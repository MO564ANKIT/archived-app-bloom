// PayPal webhook handling: signature verification via PayPal's API, event
// deduplication, and reconciliation through the same atomic credit function.
import type { SupabaseClient } from "@supabase/supabase-js";
import { PAYPAL_API, creditVerifiedOrder, getAccessToken } from "./paypal.server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any, any, any>;

const SIGNATURE_HEADERS = [
  "paypal-auth-algo",
  "paypal-cert-url",
  "paypal-transmission-id",
  "paypal-transmission-sig",
  "paypal-transmission-time",
] as const;

export interface WebhookEvent {
  id: string;
  event_type: string;
  resource?: {
    id?: string;
    status?: string;
    amount?: { value?: string; currency_code?: string };
    supplementary_data?: { related_ids?: { order_id?: string } };
  };
}

export type WebhookAction =
  | { kind: "complete"; orderId: string; captureId: string; amountCents: number | null; currency: string | null }
  | { kind: "fail"; orderId: string; reason: string }
  | { kind: "refund"; captureId: string }
  | { kind: "ignore" };

function valueToCents(value: unknown): number | null {
  if (typeof value !== "string" || !/^\d+\.\d{2}$/.test(value)) return null;
  return Math.round(Number(value) * 100);
}

export function parseWebhookEvent(value: unknown): WebhookEvent | null {
  if (typeof value !== "object" || value === null) return null;
  const event = value as WebhookEvent;
  if (typeof event.id !== "string" || event.id.length > 100 || typeof event.event_type !== "string") return null;
  return event;
}

export function interpretWebhookEvent(event: WebhookEvent): WebhookAction {
  const resource = event.resource ?? {};
  const orderId = resource.supplementary_data?.related_ids?.order_id;
  switch (event.event_type) {
    case "PAYMENT.CAPTURE.COMPLETED":
      if (typeof orderId !== "string" || typeof resource.id !== "string") return { kind: "ignore" };
      return {
        kind: "complete",
        orderId,
        captureId: resource.id,
        amountCents: valueToCents(resource.amount?.value),
        currency: typeof resource.amount?.currency_code === "string" ? resource.amount.currency_code : null,
      };
    case "PAYMENT.CAPTURE.DENIED":
    case "PAYMENT.CAPTURE.DECLINED":
      if (typeof orderId !== "string") return { kind: "ignore" };
      return { kind: "fail", orderId, reason: `PayPal reported ${event.event_type}` };
    case "PAYMENT.CAPTURE.REFUNDED":
    case "PAYMENT.CAPTURE.REVERSED":
      // The refunded resource links back to the capture via its "up" link; we match on capture id when present.
      return typeof resource.id === "string" ? { kind: "refund", captureId: resource.id } : { kind: "ignore" };
    default:
      return { kind: "ignore" };
  }
}

export async function verifyWebhookSignature(headers: Headers, event: unknown): Promise<boolean> {
  const webhookId = process.env["PAYPAL_WEBHOOK_ID"];
  if (!webhookId) return false;
  const values = SIGNATURE_HEADERS.map((name) => headers.get(name));
  if (values.some((value) => !value)) return false;

  const accessToken = await getAccessToken();
  const response = await fetch(`${PAYPAL_API}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_algo: values[0],
      cert_url: values[1],
      transmission_id: values[2],
      transmission_sig: values[3],
      transmission_time: values[4],
      webhook_id: webhookId,
      webhook_event: event,
    }),
  });
  const data = await response.json().catch(() => null);
  return response.ok && data?.verification_status === "SUCCESS";
}

export async function processWebhookEvent(db: Db, event: WebhookEvent): Promise<string> {
  // Deduplicate: the first insert wins; repeats are acknowledged without reprocessing.
  const { data: inserted, error: insertError } = await db
    .from("paypal_webhook_events")
    .upsert(
      { event_id: event.id, event_type: event.event_type, resource_id: event.resource?.id ?? null },
      { onConflict: "event_id", ignoreDuplicates: true },
    )
    .select("event_id");
  if (insertError) throw insertError;
  if (!inserted || inserted.length === 0) {
    // Seen before: skip if it finished; reprocess if an earlier attempt failed midway (crediting is idempotent).
    const { data: seen, error: seenError } = await db
      .from("paypal_webhook_events")
      .select("processed_at")
      .eq("event_id", event.id)
      .maybeSingle();
    if (seenError) throw seenError;
    if (seen?.processed_at) return "duplicate";
  }

  const action = interpretWebhookEvent(event);
  let outcome = "ignored";

  if (action.kind === "complete") {
    const { data: order, error } = await db
      .from("shop_orders")
      .select("paypal_order_id, amount_cents, currency, status")
      .eq("paypal_order_id", action.orderId)
      .maybeSingle();
    if (error) throw error;
    if (!order) outcome = "unknown-order";
    else if (order.amount_cents !== action.amountCents || order.currency !== action.currency) outcome = "amount-mismatch";
    else {
      await creditVerifiedOrder(db, action.orderId, action.captureId);
      outcome = "credited";
    }
  } else if (action.kind === "fail") {
    const { error } = await db
      .from("shop_orders")
      .update({ status: "failed", failure_reason: action.reason, updated_at: new Date().toISOString() })
      .eq("paypal_order_id", action.orderId)
      .in("status", ["created", "capturing", "pending"]);
    if (error) throw error;
    outcome = "failed";
  } else if (action.kind === "refund") {
    const { error } = await db
      .from("shop_orders")
      .update({ status: "refunded", failure_reason: "Refunded at PayPal", updated_at: new Date().toISOString() })
      .eq("paypal_capture_id", action.captureId)
      .eq("status", "completed");
    if (error) throw error;
    outcome = "refund-recorded";
  }

  const { error: doneError } = await db
    .from("paypal_webhook_events")
    .update({ outcome, processed_at: new Date().toISOString() })
    .eq("event_id", event.id);
  if (doneError) throw doneError;
  return outcome;
}

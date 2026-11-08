// Server-only PayPal Sandbox payment engine (Orders v2).
// Prices and goal limits live here; the browser only sends item IDs or a goal ID + amount.
// Nothing is granted until PayPal's capture is verified against the stored amount,
// currency, owner and purpose, and then credited once by the credit_paypal_order SQL function.
import type { SupabaseClient } from "@supabase/supabase-js";
import { centsToValue, verifyPayment, type PaypalOrderBody } from "./verification";
import { paypalSetupStatus } from "./setupStatus";

export const PAYPAL_API = "https://api-m.sandbox.paypal.com";
const ORDER_ID_PATTERN = /^[A-Z0-9]{10,30}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_CART_ITEMS = 20;
const MAX_ORDERS_PER_HOUR = 10;
const CAPTURE_LEASE_MS = 2 * 60 * 1000;
export const MIN_CONTRIBUTION_CENTS = 100;
export const MAX_CONTRIBUTION_CENTS = 50000;

export type ItemType = "skin" | "accessory" | "effect" | "background" | "collection" | "seasonal";

// Server-side price list: the only prices that are ever charged (US cents, PayPal Sandbox).
export const CATALOGUE: Record<string, { priceUsdCents: number; type: ItemType }> = {
  "skin-neon-circuit": { priceUsdCents: 499, type: "skin" },
  "skin-midnight-velvet": { priceUsdCents: 399, type: "skin" },
  "acc-tiny-crown": { priceUsdCents: 199, type: "accessory" },
  "acc-cyber-visor": { priceUsdCents: 249, type: "accessory" },
  "fx-lime-aura": { priceUsdCents: 599, type: "effect" },
  "fx-cyan-sparks": { priceUsdCents: 299, type: "effect" },
  "bg-violet-nebula": { priceUsdCents: 199, type: "background" },
  "bg-ledger-grid": { priceUsdCents: 299, type: "background" },
  "col-founders-vault": { priceUsdCents: 999, type: "collection" },
  "season-festival-lanterns": { priceUsdCents: 349, type: "seasonal" },
};

export interface CheckoutBody {
  orderId?: string;
  approveUrl?: string;
  status?: string;
  kind?: "shop" | "goal_contribution";
  itemIds?: string[];
  goalId?: string | null;
  amountCents?: number;
  milestones?: number[];
  message?: string;
}

export type CheckoutResult = { ok: true; body: CheckoutBody } | { ok: false; error: string };

interface OrderRow {
  paypal_order_id: string;
  kind: "shop" | "goal_contribution";
  goal_id: string | null;
  item_ids: string[];
  amount_cents: number;
  currency: string;
  status: string;
}

const ORDER_COLUMNS = "paypal_order_id, kind, goal_id, item_ids, amount_cents, currency, status";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any, any, any>;

const ok = (body: CheckoutBody): CheckoutResult => ({ ok: true, body });
const fail = (error: string): CheckoutResult => ({ ok: false, error });

export function paypalConfigured(): boolean {
  return paypalSetupStatus(process.env).checkoutReady;
}

export async function getAccessToken(): Promise<string> {
  const clientId = process.env["PAYPAL_CLIENT_ID"];
  const clientSecret = process.env["PAYPAL_CLIENT_SECRET"];
  if (!clientId || !clientSecret) throw new Error("PayPal credentials are not configured");

  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || typeof data?.access_token !== "string") {
    throw new Error(`PayPal authentication failed (${response.status})`);
  }
  return data.access_token;
}

async function fetchPaypalOrder(accessToken: string, orderId: string): Promise<PaypalOrderBody | null> {
  const response = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.ok ? await response.json().catch(() => null) : null;
}

async function checkRateLimit(db: Db, userId: string): Promise<string | null> {
  const windowStart = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error } = await db
    .from("shop_orders")
    .select("paypal_order_id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_demo", false)
    .gte("created_at", windowStart);
  if (error) throw error;
  return (count ?? 0) >= MAX_ORDERS_PER_HOUR
    ? "You have started too many checkouts this hour. Please try again later."
    : null;
}

interface PaypalOrderRequest {
  referenceId: string;
  description: string;
  customId: string;
  amountCents: number;
  returnPath: string;
  origin: string;
}

async function startPaypalOrder(req: PaypalOrderRequest): Promise<{ id: string; approveUrl: string } | null> {
  const accessToken = await getAccessToken();
  const response = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": crypto.randomUUID(),
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: req.referenceId,
          custom_id: req.customId,
          description: req.description,
          amount: { currency_code: "USD", value: centsToValue(req.amountCents) },
        },
      ],
      application_context: {
        brand_name: "Spendemon (Sandbox demo)",
        user_action: "PAY_NOW",
        shipping_preference: "NO_SHIPPING",
        return_url: `${req.origin}${req.returnPath}?paypal=return`,
        cancel_url: `${req.origin}${req.returnPath}?paypal=cancel`,
      },
    }),
  });
  const order = await response.json().catch(() => null);
  const approveUrl = Array.isArray(order?.links)
    ? order.links.find((link: { rel?: string }) => link.rel === "payer-action" || link.rel === "approve")?.href
    : undefined;
  if (!response.ok || typeof order?.id !== "string" || typeof approveUrl !== "string") return null;
  return { id: order.id, approveUrl };
}

export async function createOrder(db: Db, userId: string, itemIds: unknown, origin: string | null): Promise<CheckoutResult> {
  if (
    !Array.isArray(itemIds) ||
    itemIds.length === 0 ||
    itemIds.length > MAX_CART_ITEMS ||
    !itemIds.every((id) => typeof id === "string" && Object.hasOwn(CATALOGUE, id))
  ) {
    return fail("Your cart has an item we do not recognise. Remove it and try again.");
  }
  if (!origin) return fail("Checkout could not determine where to return you.");
  const ids = [...new Set(itemIds as string[])];

  const { data: owned, error: ownedError } = await db
    .from("user_inventory")
    .select("item_id")
    .eq("user_id", userId)
    .in("item_id", ids);
  if (ownedError) throw ownedError;
  if (owned && owned.length > 0) {
    return fail("You already own an item in this cart. Remove it and try again.");
  }

  const limited = await checkRateLimit(db, userId);
  if (limited) return fail(limited);

  const amountCents = ids.reduce((sum, id) => sum + CATALOGUE[id].priceUsdCents, 0);
  const order = await startPaypalOrder({
    referenceId: "monster-marketplace",
    description: "Spendemon Monster Marketplace cosmetics (Sandbox demo)",
    customId: `shop:${userId}`,
    amountCents,
    returnPath: "/loot-shop",
    origin,
  });
  if (!order) return fail("PayPal could not start this order. Please try again.");

  const { error } = await db.from("shop_orders").insert({
    paypal_order_id: order.id,
    user_id: userId,
    kind: "shop",
    item_ids: ids,
    amount_cents: amountCents,
    currency: "USD",
    status: "created",
  });
  if (error) throw error;

  return ok({ orderId: order.id, approveUrl: order.approveUrl });
}

export async function createGoalContribution(
  db: Db,
  userId: string,
  goalId: unknown,
  amountCents: unknown,
  origin: string | null,
): Promise<CheckoutResult> {
  if (typeof goalId !== "string" || !UUID_PATTERN.test(goalId)) return fail("Pick a savings goal first.");
  if (
    typeof amountCents !== "number" ||
    !Number.isInteger(amountCents) ||
    amountCents < MIN_CONTRIBUTION_CENTS ||
    amountCents > MAX_CONTRIBUTION_CENTS
  ) {
    return fail("Contributions must be between $1.00 and $500.00.");
  }
  if (!origin) return fail("Checkout could not determine where to return you.");

  const { data: goal, error: goalError } = await db
    .from("savings_goals")
    .select("id, name, target_cents, contributed_cents, completed_at")
    .eq("id", goalId)
    .eq("user_id", userId)
    .maybeSingle();
  if (goalError) throw goalError;
  if (!goal) return fail("We could not find that savings goal.");
  if (goal.completed_at) return fail("This goal is already complete.");
  const remaining = goal.target_cents - goal.contributed_cents;
  if (amountCents > remaining) {
    return fail(`Only ${centsToValue(remaining)} USD is left to reach this goal. Pick a smaller amount.`);
  }

  const limited = await checkRateLimit(db, userId);
  if (limited) return fail(limited);

  const order = await startPaypalOrder({
    referenceId: "save-to-level",
    description: `Save-to-Level contribution: ${String(goal.name).slice(0, 60)} (Sandbox demo)`,
    customId: `goal:${goal.id}`,
    amountCents,
    returnPath: "/goals",
    origin,
  });
  if (!order) return fail("PayPal could not start this contribution. Please try again.");

  const { error } = await db.from("shop_orders").insert({
    paypal_order_id: order.id,
    user_id: userId,
    kind: "goal_contribution",
    goal_id: goal.id,
    item_ids: [],
    amount_cents: amountCents,
    currency: "USD",
    status: "created",
  });
  if (error) throw error;

  return ok({ orderId: order.id, approveUrl: order.approveUrl });
}

// Atomically credits a verified order once. Safe to call repeatedly.
export async function creditVerifiedOrder(db: Db, orderId: string, captureId: string | null): Promise<number[]> {
  const { data, error } = await db.rpc("credit_paypal_order", { _order_id: orderId, _capture_id: captureId });
  if (error) throw error;
  const milestones = (data as { milestones?: unknown } | null)?.milestones;
  return Array.isArray(milestones) ? milestones.filter((m): m is number => typeof m === "number") : [];
}

function completedBody(order: OrderRow, milestones: number[] = []): CheckoutBody {
  return {
    status: "completed",
    orderId: order.paypal_order_id,
    kind: order.kind,
    itemIds: order.item_ids,
    goalId: order.goal_id,
    amountCents: order.amount_cents,
    milestones,
  };
}

// Milestones granted by this order, e.g. when the webhook credited it before the return page asked.
async function milestonesForOrder(db: Db, orderId: string): Promise<number[]> {
  const { data, error } = await db.from("goal_rewards").select("milestone").eq("order_id", orderId);
  if (error) throw error;
  return (data ?? []).map((row: { milestone: number }) => row.milestone).sort((a: number, b: number) => a - b);
}

const PENDING_MESSAGE = "PayPal is still confirming this payment. Nothing is unlocked until it clears.";

export async function captureOrder(db: Db, userId: string, orderId: unknown): Promise<CheckoutResult> {
  if (typeof orderId !== "string" || !ORDER_ID_PATTERN.test(orderId)) {
    return fail("That payment reference is not valid.");
  }

  const leaseCutoff = new Date(Date.now() - CAPTURE_LEASE_MS).toISOString();
  const { data: claimed, error: claimError } = await db
    .from("shop_orders")
    .update({ status: "capturing", updated_at: new Date().toISOString() })
    .eq("paypal_order_id", orderId)
    .eq("user_id", userId)
    .or(`status.eq.created,status.eq.pending,and(status.eq.capturing,updated_at.lt.${leaseCutoff})`)
    .select(ORDER_COLUMNS)
    .maybeSingle();
  if (claimError) throw claimError;

  if (!claimed) {
    const { data: existing, error: lookupError } = await db
      .from("shop_orders")
      .select(ORDER_COLUMNS)
      .eq("paypal_order_id", orderId)
      .eq("user_id", userId)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (!existing) return fail("We could not find this order.");
    const row = existing as OrderRow;
    if (row.status === "completed") {
      const milestones = row.kind === "goal_contribution" ? await milestonesForOrder(db, orderId) : [];
      return ok(completedBody(row, milestones));
    }
    if (row.status === "capturing") return ok({ status: "pending", orderId, kind: row.kind, message: PENDING_MESSAGE });
    return ok({ status: row.status, orderId, kind: row.kind, message: "This order can no longer be paid." });
  }

  const order = claimed as OrderRow;
  const accessToken = await getAccessToken();
  const captureResponse = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `capture-${orderId}`,
    },
  });
  let body: PaypalOrderBody | null = await captureResponse.json().catch(() => null);
  if (!captureResponse.ok) {
    body = await fetchPaypalOrder(accessToken, orderId);
  }

  const { verified, captureId, capturePending } = verifyPayment(body, {
    amountCents: order.amount_cents,
    currency: order.currency,
  });

  if (verified) {
    const milestones = await creditVerifiedOrder(db, orderId, captureId);
    return ok(completedBody(order, milestones));
  }

  const stillPayable = body?.status === "APPROVED" || body?.status === "CREATED";
  const nextStatus = capturePending ? "pending" : stillPayable ? "created" : "failed";
  const reason = capturePending
    ? "Capture pending at PayPal"
    : stillPayable
      ? "Buyer has not approved the payment yet"
      : "PayPal did not confirm the expected amount and currency";

  const { error: updateError } = await db
    .from("shop_orders")
    .update({ status: nextStatus, paypal_capture_id: captureId, failure_reason: reason, updated_at: new Date().toISOString() })
    .eq("paypal_order_id", orderId)
    .eq("user_id", userId)
    .eq("status", "capturing");
  if (updateError) throw updateError;

  if (capturePending) return ok({ status: "pending", orderId, kind: order.kind, message: PENDING_MESSAGE });
  const message = stillPayable
    ? "Payment was not completed. You can try again."
    : "PayPal did not confirm this payment, so nothing was unlocked.";
  return ok({ status: "failed", orderId, kind: order.kind, message });
}

export async function cancelOrder(db: Db, userId: string, orderId: unknown): Promise<CheckoutResult> {
  if (typeof orderId !== "string" || !ORDER_ID_PATTERN.test(orderId)) {
    return fail("That payment reference is not valid.");
  }
  const { data, error } = await db
    .from("shop_orders")
    .update({ status: "cancelled", failure_reason: "Cancelled at PayPal", updated_at: new Date().toISOString() })
    .eq("paypal_order_id", orderId)
    .eq("user_id", userId)
    .eq("status", "created")
    .select("paypal_order_id, kind")
    .maybeSingle();
  if (error) throw error;
  if (!data) return fail("We could not find this order.");
  return ok({ status: "cancelled", orderId, kind: data.kind });
}

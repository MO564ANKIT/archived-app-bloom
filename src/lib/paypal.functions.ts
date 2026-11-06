import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestUrl } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface CheckoutInput {
  action: "create" | "capture" | "cancel";
  itemIds?: string[];
  orderId?: string;
}

export interface CheckoutBody {
  orderId?: string;
  approveUrl?: string;
  status?: string;
  itemIds?: string[];
  amountCents?: number;
  message?: string;
}

export type CheckoutResponse = { ok: true; body: CheckoutBody } | { ok: false; error: string };

function resolveOrigin(): string | null {
  const origin = getRequestHeader("origin");
  if (origin && /^https?:\/\//.test(origin)) return origin;
  try {
    return getRequestUrl().origin;
  } catch {
    return null;
  }
}

export const paypalCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: CheckoutInput) => {
    if (!input || !["create", "capture", "cancel"].includes(input.action)) {
      throw new Error("Unknown checkout action.");
    }
    return {
      action: input.action,
      itemIds: Array.isArray(input.itemIds) ? input.itemIds.slice(0, 50) : undefined,
      orderId: typeof input.orderId === "string" ? input.orderId.slice(0, 64) : undefined,
    } satisfies CheckoutInput;
  })
  .handler(async ({ data, context }): Promise<CheckoutResponse> => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const checkout = await import("./checkout-server/paypal.server");
      const { userId } = context;
      switch (data.action) {
        case "create":
          return await checkout.createOrder(supabaseAdmin, userId, data.itemIds, resolveOrigin());
        case "capture":
          return await checkout.captureOrder(supabaseAdmin, userId, data.orderId);
        case "cancel":
          return await checkout.cancelOrder(supabaseAdmin, userId, data.orderId);
      }
    } catch (err) {
      console.error("paypal-checkout failed", err instanceof Error ? err.message : "unknown error");
      return { ok: false, error: "Something went wrong with the payment service. Please try again." };
    }
  });

import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestUrl } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type CheckoutAction = "create" | "contribute" | "capture" | "cancel";

export interface CheckoutInput {
  action: CheckoutAction;
  itemIds?: string[];
  orderId?: string;
  goalId?: string;
  amountCents?: number;
}

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

export type CheckoutResponse =
  | { ok: true; body: CheckoutBody }
  | { ok: false; error: string; code?: "setup_needed" };

const ACTIONS: CheckoutAction[] = ["create", "contribute", "capture", "cancel"];

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
    if (!input || !ACTIONS.includes(input.action)) {
      throw new Error("Unknown checkout action.");
    }
    return {
      action: input.action,
      itemIds: Array.isArray(input.itemIds) ? input.itemIds.slice(0, 50) : undefined,
      orderId: typeof input.orderId === "string" ? input.orderId.slice(0, 64) : undefined,
      goalId: typeof input.goalId === "string" ? input.goalId.slice(0, 64) : undefined,
      amountCents: typeof input.amountCents === "number" ? input.amountCents : undefined,
    } satisfies CheckoutInput;
  })
  .handler(async ({ data, context }): Promise<CheckoutResponse> => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const checkout = await import("./checkout-server/paypal.server");
      if (!checkout.paypalConfigured()) {
        const { paypalSetupStatus, logMissingPaypalSecrets } = await import("./checkout-server/setupStatus");
        logMissingPaypalSecrets(`checkout ${data.action}`, paypalSetupStatus(process.env));
        return {
          ok: false,
          code: "setup_needed",
          error: "Sandbox setup needed: PayPal test keys are not configured yet, so checkout is paused. No money was charged.",
        };
      }
      const { userId } = context;
      switch (data.action) {
        case "create":
          return await checkout.createOrder(supabaseAdmin, userId, data.itemIds, resolveOrigin());
        case "contribute":
          return await checkout.createGoalContribution(supabaseAdmin, userId, data.goalId, data.amountCents, resolveOrigin());
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

export interface PaypalSetupView {
  checkoutReady: boolean;
  webhooksReady: boolean;
}

// Tells the signed-in player whether Sandbox checkout and webhooks are configured (booleans only).
export const paypalSetup = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<PaypalSetupView> => {
    const { paypalSetupStatus, logMissingPaypalSecrets } = await import("./checkout-server/setupStatus");
    const status = paypalSetupStatus(process.env);
    logMissingPaypalSecrets("setup check", status);
    return { checkoutReady: status.checkoutReady, webhooksReady: status.webhooksReady };
  });

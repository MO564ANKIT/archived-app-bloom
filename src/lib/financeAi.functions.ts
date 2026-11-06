import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface GuardianFactsDto {
  priceUsdCents: number;
  priceInrPaise: number;
  categoryLabel: string;
  categoryBudgetPaise: number | null;
  categoryRemainingPaise: number | null;
  categoryShareOfRemaining: number | null;
  monthlyBudgetPaise: number | null;
  monthlyRemainingPaise: number | null;
  monthlyShareOfRemaining: number | null;
  verdict: "no-budget" | "over" | "tight" | "fits";
}

export type GuardianResponse =
  | {
      ok: true;
      facts: GuardianFactsDto;
      factLines: string[];
      explanation: string;
      explanationSource: "ai" | "fallback";
      alternative: { itemId: string; priceUsdCents: number } | null;
    }
  | { ok: false; error: string };

export type InsightsResponse =
  | { ok: true; facts: string[]; suggestions: string[]; suggestionSource: "ai" | "fallback" }
  | { ok: false; error: string };

export const purchaseGuardian = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { itemIds: string[]; today: string }) => ({
    itemIds: Array.isArray(input?.itemIds) ? input.itemIds.slice(0, 20) : [],
    today: typeof input?.today === "string" ? input.today.slice(0, 10) : "",
  }))
  .handler(async ({ data, context }): Promise<GuardianResponse> => {
    try {
      const { runGuardian } = await import("./ai-server/financeAi.server");
      return await runGuardian(context.supabase, context.userId, data.itemIds, data.today);
    } catch (err) {
      console.error("purchase-guardian failed", err instanceof Error ? err.message : "unknown error");
      return { ok: false, error: "The Purchase Guardian could not check your budget right now." };
    }
  });

export const financialInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { today: string }) => ({
    today: typeof input?.today === "string" ? input.today.slice(0, 10) : "",
  }))
  .handler(async ({ data, context }): Promise<InsightsResponse> => {
    try {
      const { runInsights } = await import("./ai-server/financeAi.server");
      return await runInsights(context.supabase, context.userId, data.today);
    } catch (err) {
      console.error("financial-insights failed", err instanceof Error ? err.message : "unknown error");
      return { ok: false, error: "Insights could not be generated right now." };
    }
  });

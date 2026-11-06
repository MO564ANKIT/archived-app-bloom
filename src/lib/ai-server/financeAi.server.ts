// Purchase Guardian and AI Insights. Budget data is read from the signed-in
// player's own save on the server; the AI only rephrases computed facts.
import type { SupabaseClient } from "@supabase/supabase-js";
import { isDateKey, readSavedBudgetState, type SavedBudgetState } from "../roast-server/budgetFacts";
import { CATALOGUE } from "../checkout-server/paypal.server";
import { generateAiText } from "./ai.server";
import {
  computeGuardianFacts,
  computeInsightFacts,
  fallbackSuggestions,
  guardianFactLines,
  guardianFallbackText,
  type GuardianFacts,
} from "./financeFacts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any, any, any>;

const EMPTY_STATE: SavedBudgetState = { monthlyBudgetPaise: null, categoryBudgetsPaise: {}, expenses: [], events: [] };

async function loadBudgetState(db: Db, userId: string): Promise<SavedBudgetState> {
  const { data, error } = await db.from("player_saves").select("state").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return readSavedBudgetState(data?.state) ?? EMPTY_STATE;
}

export interface GuardianResult {
  ok: true;
  facts: GuardianFacts;
  factLines: string[];
  explanation: string;
  explanationSource: "ai" | "fallback";
  alternative: { itemId: string; priceUsdCents: number } | null;
}

export async function runGuardian(
  db: Db,
  userId: string,
  itemIds: unknown,
  today: unknown,
): Promise<GuardianResult | { ok: false; error: string }> {
  if (!Array.isArray(itemIds) || itemIds.length === 0 || itemIds.length > 20 || !itemIds.every((id) => typeof id === "string" && Object.hasOwn(CATALOGUE, id))) {
    return { ok: false, error: "Your cart has an item we do not recognise." };
  }
  if (!isDateKey(today)) return { ok: false, error: "The request was not in the expected shape." };
  const ids = [...new Set(itemIds as string[])];
  const totalCents = ids.reduce((sum, id) => sum + CATALOGUE[id].priceUsdCents, 0);

  const state = await loadBudgetState(db, userId);
  const facts = computeGuardianFacts(state, totalCents, today);
  const factLines = guardianFactLines(facts);

  // Deterministic cheaper alternative: the cheapest item of the same type as the priciest cart item.
  const priciest = ids.reduce((a, b) => (CATALOGUE[a].priceUsdCents >= CATALOGUE[b].priceUsdCents ? a : b));
  const { data: owned } = await db.from("user_inventory").select("item_id").eq("user_id", userId);
  const ownedIds = new Set((owned ?? []).map((row: { item_id: string }) => row.item_id));
  const alternativeId = Object.entries(CATALOGUE)
    .filter(([id, item]) => item.type === CATALOGUE[priciest].type && item.priceUsdCents < CATALOGUE[priciest].priceUsdCents && !ids.includes(id) && !ownedIds.has(id))
    .sort((a, b) => a[1].priceUsdCents - b[1].priceUsdCents)[0]?.[0];
  const alternative = facts.verdict !== "fits" && alternativeId ? { itemId: alternativeId, priceUsdCents: CATALOGUE[alternativeId].priceUsdCents } : null;

  const ai = await generateAiText({
    system: [
      "You are the Spendemon Purchase Guardian, a calm, kind money coach inside a budgeting game.",
      "Explain in 2 or 3 short plain sentences how this purchase affects the user's recorded budget.",
      "Use only the numbers in the facts, exactly as written. Never invent amounts, income or balances.",
      "Do not approve or decline the purchase and make no guarantees. Leave the decision to the user.",
      "If a cheaper alternative is listed, mention it once. No markdown, lists or emojis.",
    ].join("\n"),
    user: `Facts:\n${factLines.map((line) => `- ${line}`).join("\n")}${alternative ? `\n- Cheaper alternative in the marketplace: US$${(alternative.priceUsdCents / 100).toFixed(2)}.` : ""}`,
    temperature: 0.4,
  });

  return {
    ok: true,
    facts,
    factLines,
    explanation: ai.ok ? ai.text : guardianFallbackText(facts),
    explanationSource: ai.ok ? "ai" : "fallback",
    alternative,
  };
}

export interface InsightsResult {
  ok: true;
  facts: string[];
  suggestions: string[];
  suggestionSource: "ai" | "fallback";
}

export async function runInsights(db: Db, userId: string, today: unknown): Promise<InsightsResult | { ok: false; error: string }> {
  if (!isDateKey(today)) return { ok: false, error: "The request was not in the expected shape." };
  const state = await loadBudgetState(db, userId);
  const { data: goals, error } = await db
    .from("savings_goals")
    .select("name, target_cents, contributed_cents")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(3);
  if (error) throw error;
  const facts = computeInsightFacts(state, today, goals ?? []);

  if (state.expenses.length === 0) {
    return {
      ok: true,
      facts: facts.lines,
      suggestions: ["Log a few expenses first. Insights only use spending you have actually recorded."],
      suggestionSource: "fallback",
    };
  }

  const ai = await generateAiText({
    system: [
      "You are Spendemon's financial insights coach for a young budgeter.",
      "Write exactly 4 lines, each starting with one of these labels: 'Weekly summary:', 'Budget tip:', 'Savings goal idea:', 'Quest suggestion:'.",
      "Each line is one short sentence. Use only the numbers in the facts, exactly as written; never invent transactions, income or balances.",
      "Encourage healthy habits; never suggest spending more. No markdown, bullets or emojis.",
    ].join("\n"),
    user: `Recorded facts:\n${facts.lines.map((line) => `- ${line}`).join("\n")}`,
    temperature: 0.5,
  });

  const lines = ai.ok
    ? ai.text
        .split("\n")
        .map((line) => line.replace(/^[-*•\d.\s]+/, "").trim())
        .filter((line) => line.length > 0)
        .slice(0, 4)
    : [];

  return {
    ok: true,
    facts: facts.lines,
    suggestions: lines.length ? lines : fallbackSuggestions(facts),
    suggestionSource: lines.length ? "ai" : "fallback",
  };
}

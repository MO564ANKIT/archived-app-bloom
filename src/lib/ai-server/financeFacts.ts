// Deterministic financial calculations used by the Purchase Guardian and AI Insights.
// All numbers shown to users or sent to the AI come from here, never from the model.
import type { SavedBudgetState } from "../roast-server/budgetFacts";

/** Fixed reference rate used only to compare US-dollar sandbox prices with rupee budgets. */
export const USD_INR_REFERENCE_RATE = 83;
/** Marketplace cosmetics count against this budget category. */
export const MARKETPLACE_CATEGORY = "fun";

const CATEGORY_LABELS: Record<string, string> = {
  food: "Food & Snacks",
  coffee: "Coffee & Drinks",
  shopping: "Shopping",
  subscriptions: "Subscriptions",
  fun: "Fun & Games",
  transport: "Transport",
  bills: "Bills & Rent",
  health: "Health",
  savings: "Savings Transfer",
  other: "Other",
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

export function usdCentsToPaise(cents: number): number {
  return Math.round(cents * USD_INR_REFERENCE_RATE);
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export type GuardianVerdict = "no-budget" | "over" | "tight" | "fits";

export interface GuardianFacts {
  priceUsdCents: number;
  priceInrPaise: number;
  categoryLabel: string;
  categoryBudgetPaise: number | null;
  categoryRemainingPaise: number | null;
  categoryShareOfRemaining: number | null;
  monthlyBudgetPaise: number | null;
  monthlyRemainingPaise: number | null;
  monthlyShareOfRemaining: number | null;
  verdict: GuardianVerdict;
}

function monthSpend(state: SavedBudgetState, today: string) {
  const month = today.slice(0, 7);
  const expenses = state.expenses.filter((expense) => expense.date.slice(0, 7) === month);
  const byCategory: Record<string, number> = {};
  for (const expense of expenses) byCategory[expense.category] = (byCategory[expense.category] ?? 0) + expense.amountPaise;
  return { expenses, total: expenses.reduce((sum, expense) => sum + expense.amountPaise, 0), byCategory };
}

export function computeGuardianFacts(state: SavedBudgetState, priceUsdCents: number, today: string): GuardianFacts {
  const priceInrPaise = usdCentsToPaise(priceUsdCents);
  const spend = monthSpend(state, today);
  const categoryBudget = state.categoryBudgetsPaise[MARKETPLACE_CATEGORY] ?? null;
  const categoryRemaining = categoryBudget === null ? null : categoryBudget - (spend.byCategory[MARKETPLACE_CATEGORY] ?? 0);
  const monthlyRemaining = state.monthlyBudgetPaise === null ? null : state.monthlyBudgetPaise - spend.total;

  const share = (remaining: number | null) =>
    remaining === null ? null : remaining <= 0 ? null : round1((priceInrPaise / remaining) * 100);

  const remainingValues = [categoryRemaining, monthlyRemaining].filter((value): value is number => value !== null);
  let verdict: GuardianVerdict;
  if (remainingValues.length === 0) verdict = "no-budget";
  else if (remainingValues.some((value) => priceInrPaise > value)) verdict = "over";
  else if (remainingValues.some((value) => priceInrPaise > value * 0.5)) verdict = "tight";
  else verdict = "fits";

  return {
    priceUsdCents,
    priceInrPaise,
    categoryLabel: categoryLabel(MARKETPLACE_CATEGORY),
    categoryBudgetPaise: categoryBudget,
    categoryRemainingPaise: categoryRemaining,
    categoryShareOfRemaining: share(categoryRemaining),
    monthlyBudgetPaise: state.monthlyBudgetPaise,
    monthlyRemainingPaise: monthlyRemaining,
    monthlyShareOfRemaining: share(monthlyRemaining),
    verdict,
  };
}

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
export const formatPaise = (paise: number) => inr.format(paise / 100);

export function guardianFactLines(facts: GuardianFacts): string[] {
  const lines = [
    `Purchase price: US$${(facts.priceUsdCents / 100).toFixed(2)} (about ${formatPaise(facts.priceInrPaise)} at a fixed reference rate of ₹${USD_INR_REFERENCE_RATE} per US$).`,
  ];
  if (facts.categoryRemainingPaise === null) lines.push(`No ${facts.categoryLabel} budget is set.`);
  else if (facts.categoryRemainingPaise <= 0) lines.push(`The ${facts.categoryLabel} budget is already used up this month.`);
  else lines.push(`Remaining ${facts.categoryLabel} budget this month: ${formatPaise(facts.categoryRemainingPaise)}. This purchase is ${facts.categoryShareOfRemaining}% of it.`);
  if (facts.monthlyRemainingPaise === null) lines.push("No monthly budget is set.");
  else if (facts.monthlyRemainingPaise <= 0) lines.push("The monthly budget is already used up.");
  else lines.push(`Remaining monthly budget: ${formatPaise(facts.monthlyRemainingPaise)}. This purchase is ${facts.monthlyShareOfRemaining}% of it.`);
  return lines;
}

export function guardianFallbackText(facts: GuardianFacts): string {
  const price = formatPaise(facts.priceInrPaise);
  if (facts.verdict === "no-budget") {
    return `This costs about ${price}. You have not set a ${facts.categoryLabel} or monthly budget yet, so I cannot compare it with your plan. Setting one in Spend makes this check much more useful.`;
  }
  if (facts.categoryRemainingPaise !== null && facts.categoryRemainingPaise > 0 && facts.categoryShareOfRemaining !== null) {
    const base = `You have ${formatPaise(facts.categoryRemainingPaise)} left in your ${facts.categoryLabel} budget. This purchase would use about ${facts.categoryShareOfRemaining}% of it.`;
    return facts.verdict === "over"
      ? `${base} That goes past what you planned, so consider whether it fits your priorities right now.`
      : `${base} Consider whether it fits your current priorities.`;
  }
  return `This costs about ${price}, and your budget for this has little or no room left this month. Consider saving for it first.`;
}

export interface InsightFacts {
  lines: string[];
  weekSpentPaise: number;
  previousWeekSpentPaise: number;
  monthSpentPaise: number;
  topCategories: { category: string; label: string; paise: number; share: number }[];
  unusual: { label: string; paise: number; date: string }[];
  overBudgetCategories: string[];
}

function shiftDate(key: string, days: number): string {
  const date = new Date(`${key}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function computeInsightFacts(
  state: SavedBudgetState,
  today: string,
  goals: { name: string; target_cents: number; contributed_cents: number }[] = [],
): InsightFacts {
  const weekStart = shiftDate(today, -6);
  const prevStart = shiftDate(today, -13);
  const weekSpent = state.expenses.filter((e) => e.date >= weekStart && e.date <= today).reduce((s, e) => s + e.amountPaise, 0);
  const prevSpent = state.expenses.filter((e) => e.date >= prevStart && e.date < weekStart).reduce((s, e) => s + e.amountPaise, 0);
  const spend = monthSpend(state, today);

  const topCategories = Object.entries(spend.byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category, paise]) => ({ category, label: categoryLabel(category), paise, share: spend.total ? Math.round((paise / spend.total) * 100) : 0 }));

  const amounts = spend.expenses.map((e) => e.amountPaise).sort((a, b) => a - b);
  const median = amounts.length ? amounts[Math.floor(amounts.length / 2)] : 0;
  const unusual =
    amounts.length >= 4
      ? spend.expenses
          .filter((e) => e.amountPaise >= median * 3)
          .sort((a, b) => b.amountPaise - a.amountPaise)
          .slice(0, 2)
          .map((e) => ({ label: categoryLabel(e.category), paise: e.amountPaise, date: e.date }))
      : [];

  const overBudgetCategories = Object.entries(state.categoryBudgetsPaise)
    .filter(([category, budget]) => (spend.byCategory[category] ?? 0) > budget)
    .map(([category]) => categoryLabel(category));

  const lines: string[] = [];
  lines.push(`Spent in the last 7 days: ${formatPaise(weekSpent)}. The 7 days before that: ${formatPaise(prevSpent)}.`);
  lines.push(`Spent this month: ${formatPaise(spend.total)} across ${spend.expenses.length} recorded expense(s).`);
  if (state.monthlyBudgetPaise !== null) {
    lines.push(`Monthly budget ${formatPaise(state.monthlyBudgetPaise)}; ${Math.round((spend.total / state.monthlyBudgetPaise) * 100)}% used.`);
  } else lines.push("No monthly budget is set.");
  for (const top of topCategories) lines.push(`${top.label}: ${formatPaise(top.paise)} (${top.share}% of this month's spending).`);
  for (const item of unusual) lines.push(`Unusually large expense: ${formatPaise(item.paise)} in ${item.label} on ${item.date} (at least 3x the typical expense).`);
  if (overBudgetCategories.length) lines.push(`Over budget this month in: ${overBudgetCategories.join(", ")}.`);
  for (const goal of goals.slice(0, 3)) {
    lines.push(`Savings goal "${goal.name.slice(0, 40)}": US$${(goal.contributed_cents / 100).toFixed(2)} of US$${(goal.target_cents / 100).toFixed(2)} in verified sandbox contributions.`);
  }
  if (goals.length === 0) lines.push("No savings goals yet.");

  return { lines, weekSpentPaise: weekSpent, previousWeekSpentPaise: prevSpent, monthSpentPaise: spend.total, topCategories, unusual, overBudgetCategories };
}

export function fallbackSuggestions(facts: InsightFacts): string[] {
  const out: string[] = [];
  const top = facts.topCategories[0];
  if (top) out.push(`Budget tip: ${top.label} is your biggest category this month. Try setting a weekly cap for it.`);
  if (facts.overBudgetCategories.length) out.push(`Habit: you are over budget in ${facts.overBudgetCategories[0]}. Pause non-essential buys there until next month.`);
  out.push("Savings goal idea: create a small Save-to-Level goal and make one sandbox contribution this week.");
  out.push("Quest suggestion: run one Money Lab simulation before your next non-essential purchase.");
  return out.slice(0, 4);
}

const CATEGORY_LABELS: Record<string, { label: string; roastable: boolean }> = {
  food: { label: "Food & Snacks", roastable: true },
  coffee: { label: "Coffee & Drinks", roastable: true },
  shopping: { label: "Shopping", roastable: true },
  subscriptions: { label: "Subscriptions", roastable: true },
  fun: { label: "Fun & Games", roastable: true },
  transport: { label: "Transport", roastable: false },
  bills: { label: "Bills & Rent", roastable: false },
  health: { label: "Health", roastable: false },
  savings: { label: "Savings Transfer", roastable: false },
  other: { label: "Other", roastable: false },
};

const CATEGORY_KEYWORDS: { pattern: RegExp; category: string }[] = [
  { pattern: /coffee|cafe|latte|chai|cold brew|tea/i, category: "coffee" },
  { pattern: /food|swiggy|zomato|pizza|burger|dinner|lunch|snack|meal|takeout/i, category: "food" },
  { pattern: /netflix|spotify|prime|subscription|ott|membership|youtube/i, category: "subscriptions" },
  { pattern: /game|movie|concert|ticket|party|arcade|fun/i, category: "fun" },
  { pattern: /rent|bill|electric|water|internet|phone plan/i, category: "bills" },
];

const MAX_AMOUNT_PAISE = 1_000_000_000;
const TIGHT_THRESHOLD_RATIO = 0.1;
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const moneyFormatter = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

interface SavedExpense {
  amountPaise: number;
  category: string;
  date: string;
}

export interface SavedBudgetState {
  monthlyBudgetPaise: number | null;
  categoryBudgetsPaise: Record<string, number>;
  expenses: SavedExpense[];
  events: { at: string }[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPaise(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0 && value <= MAX_AMOUNT_PAISE;
}

function isSavedExpense(value: unknown): value is SavedExpense {
  return (
    isRecord(value) &&
    isPaise(value.amountPaise) &&
    typeof value.category === "string" &&
    Object.hasOwn(CATEGORY_LABELS, value.category) &&
    typeof value.date === "string" &&
    DATE_KEY_PATTERN.test(value.date)
  );
}

export function readSavedBudgetState(value: unknown): SavedBudgetState | null {
  if (!isRecord(value)) return null;
  const budgets = isRecord(value.categoryBudgetsPaise) ? value.categoryBudgetsPaise : {};
  const expenses = Array.isArray(value.expenses) ? value.expenses.filter(isSavedExpense) : [];
  const events = Array.isArray(value.events)
    ? value.events.filter((event): event is { at: string } => isRecord(event) && typeof event.at === "string")
    : [];
  const categoryBudgetsPaise: Record<string, number> = {};
  for (const [category, amount] of Object.entries(budgets)) {
    if (Object.hasOwn(CATEGORY_LABELS, category) && isPaise(amount)) categoryBudgetsPaise[category] = amount;
  }
  return {
    monthlyBudgetPaise: isPaise(value.monthlyBudgetPaise) ? value.monthlyBudgetPaise : null,
    categoryBudgetsPaise,
    expenses,
    events,
  };
}

function shiftDateKey(key: string, days: number): string {
  const date = new Date(`${key}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function streakEndingOn(events: { at: string }[], today: string): number {
  const activeDays = new Set(events.map((event) => event.at.slice(0, 10)));
  let cursor = activeDays.has(today) ? today : shiftDateKey(today, -1);
  let streak = 0;
  while (activeDays.has(cursor)) {
    streak += 1;
    cursor = shiftDateKey(cursor, -1);
  }
  return streak;
}

function parsePurchasePaise(message: string): number | null {
  const amounts = [...message.matchAll(/\d[\d,]*(?:\.\d{1,2})?/g)]
    .map((match) => Math.round(Number(match[0].replace(/,/g, "")) * 100))
    .filter((paise) => Number.isFinite(paise) && paise > 0 && paise <= MAX_AMOUNT_PAISE);
  return amounts.length ? Math.max(...amounts) : null;
}

function guessCategory(message: string): string {
  return CATEGORY_KEYWORDS.find((entry) => entry.pattern.test(message))?.category ?? "shopping";
}

function verdictText(verdict: string): string {
  switch (verdict) {
    case "over":
      return "would go over the monthly budget";
    case "category-over":
      return "would go over the category budget";
    case "tight":
      return "fits, but leaves very little room";
    case "fits":
      return "fits comfortably";
    default:
      return "cannot be checked because no budget is set";
  }
}

export function buildBudgetFacts(state: SavedBudgetState, message: string, today: string): string[] {
  const month = today.slice(0, 7);
  const monthExpenses = state.expenses.filter((expense) => expense.date.slice(0, 7) === month);
  const spentPaise = monthExpenses.reduce((sum, expense) => sum + expense.amountPaise, 0);
  const spentByCategory: Record<string, number> = {};
  for (const expense of monthExpenses) {
    spentByCategory[expense.category] = (spentByCategory[expense.category] ?? 0) + expense.amountPaise;
  }
  const budget = state.monthlyBudgetPaise;
  const remaining = budget === null ? null : budget - spentPaise;
  const streak = streakEndingOn(state.events, today);
  const facts: string[] = [];

  if (remaining === null) facts.push("No monthly budget is set.");
  else if (remaining < 0) facts.push(`Over this month's budget by ${moneyFormatter.format(Math.abs(remaining) / 100)}.`);
  else facts.push(`Left in this month's budget: ${moneyFormatter.format(remaining / 100)}.`);
  if (budget !== null) facts.push(`Used ${Math.round((spentPaise / budget) * 100)}% of the monthly budget.`);
  if (monthExpenses.length === 0) facts.push("No expenses logged this month yet.");
  else facts.push(`Spent this month so far: ${moneyFormatter.format(spentPaise / 100)}.`);
  facts.push(`Current logging streak: ${streak} day(s).`);

  const topRoastable = Object.entries(spentByCategory)
    .filter(([category, spent]) => spent > 0 && CATEGORY_LABELS[category].roastable)
    .sort((a, b) => b[1] - a[1])[0];
  if (topRoastable) {
    facts.push(
      `Biggest flexible spending: ${CATEGORY_LABELS[topRoastable[0]].label} at ${moneyFormatter.format(topRoastable[1] / 100)}.`,
    );
  }

  const amountPaise = parsePurchasePaise(message);
  if (amountPaise !== null) {
    const category = guessCategory(message);
    const categoryBudget = state.categoryBudgetsPaise[category];
    const categoryRemaining = categoryBudget === undefined ? null : categoryBudget - (spentByCategory[category] ?? 0);
    const monthlyAfter = remaining === null ? null : remaining - amountPaise;
    const categoryAfter = categoryRemaining === null ? null : categoryRemaining - amountPaise;

    let verdict: string;
    if (monthlyAfter === null && categoryAfter === null) verdict = "no-budget";
    else if (monthlyAfter !== null && monthlyAfter < 0) verdict = "over";
    else if (categoryAfter !== null && categoryAfter < 0) verdict = "category-over";
    else if (monthlyAfter !== null && budget !== null && monthlyAfter < budget * TIGHT_THRESHOLD_RATIO) verdict = "tight";
    else verdict = "fits";

    facts.push(
      `User is considering a ${moneyFormatter.format(amountPaise / 100)} purchase in ${CATEGORY_LABELS[category].label}. ` +
        `This ${verdictText(verdict)}.`,
    );
    const left = monthlyAfter ?? categoryAfter;
    if (left !== null) facts.push(`Left after that purchase: ${moneyFormatter.format(Math.max(0, left) / 100)}.`);
    const over = Math.max(-(monthlyAfter ?? 0), -(categoryAfter ?? 0), 0);
    if (over > 0) facts.push(`Would be over budget by ${moneyFormatter.format(over / 100)}.`);
  }

  return facts;
}

export function isDateKey(value: unknown): value is string {
  return typeof value === "string" && DATE_KEY_PATTERN.test(value);
}

import { describe, expect, it } from "vitest";
import { simulatePurchase, summarizeMonth } from "@/lib/finance";
import type { Category } from "@/lib/categories";
import { buildBudgetFacts, readSavedBudgetState, type SavedBudgetState } from "./budgetFacts";

const TODAY = "2025-06-15";

function stateWith(overrides: Partial<SavedBudgetState> = {}): SavedBudgetState {
  return {
    monthlyBudgetPaise: 1_000_000,
    categoryBudgetsPaise: { shopping: 300_000 },
    expenses: [
      { amountPaise: 200_000, category: "food", date: "2025-06-02" },
      { amountPaise: 50_000, category: "coffee", date: "2025-06-10" },
      { amountPaise: 999_999, category: "bills", date: "2025-05-30" },
    ],
    events: [{ at: "2025-06-13T09:00:00.000Z" }, { at: "2025-06-14T09:00:00.000Z" }, { at: "2025-06-15T08:00:00.000Z" }],
    ...overrides,
  };
}

describe("buildBudgetFacts", () => {
  it("reports remaining budget, streak and spending from saved state only", () => {
    const facts = buildBudgetFacts(stateWith(), "check my month", TODAY);
    expect(facts).toContain("Left in this month's budget: \u20B97,500.00.");
    expect(facts).toContain("Current logging streak: 3 day(s).");
    expect(facts).toContain("Spent this month so far: \u20B92,500.00.");
  });

  it("ignores expenses from other months", () => {
    const facts = buildBudgetFacts(stateWith(), "check my month", TODAY);
    expect(facts.some((fact) => fact.includes("9,999.99"))).toBe(false);
  });

  it("describes an over-budget purchase in the category that was guessed from the message", () => {
    const facts = buildBudgetFacts(stateWith(), "sneakers for 4666", TODAY);
    expect(facts.join("\n")).toContain("considering a \u20B94,666.00 purchase in Shopping");
    expect(facts.join("\n")).toContain("would go over the category budget");
  });

  it("uses the largest number in the message as the price", () => {
    const facts = buildBudgetFacts(stateWith(), "2 coffees for 900", TODAY);
    expect(facts.join("\n")).toContain("\u20B9900.00 purchase in Coffee");
  });

  it("flags a purchase that would overspend the monthly budget", () => {
    const facts = buildBudgetFacts(stateWith(), "headphones for 9000", TODAY);
    expect(facts.join("\n")).toContain("would go over the monthly budget");
    expect(facts.some((fact) => fact.startsWith("Would be over budget by"))).toBe(true);
  });

  it("returns no purchase facts when the message has no amount", () => {
    const facts = buildBudgetFacts(stateWith(), "hello there", TODAY);
    expect(facts.join("\n")).not.toContain("considering");
  });

  it("explains when no budget is set", () => {
    const facts = buildBudgetFacts(stateWith({ monthlyBudgetPaise: null, categoryBudgetsPaise: {} }), "hoodie for 500", TODAY);
    expect(facts[0]).toBe("No monthly budget is set.");
    expect(facts.join("\n")).toContain("cannot be checked because no budget is set");
  });
});

describe("readSavedBudgetState", () => {
  it("drops malformed expenses and unknown categories instead of trusting them", () => {
    const parsed = readSavedBudgetState({
      monthlyBudgetPaise: -5,
      categoryBudgetsPaise: { shopping: 1000, hacked: 99 },
      expenses: [
        { amountPaise: 100, category: "food", date: "2025-06-01" },
        { amountPaise: 1.5, category: "food", date: "2025-06-01" },
        { amountPaise: 100, category: "not-real", date: "2025-06-01" },
        { amountPaise: 100, category: "food", date: "yesterday" },
      ],
      events: [{ at: "2025-06-01T00:00:00Z" }, { nope: true }],
    });
    expect(parsed?.monthlyBudgetPaise).toBeNull();
    expect(parsed?.categoryBudgetsPaise).toEqual({ shopping: 1000 });
    expect(parsed?.expenses).toHaveLength(1);
    expect(parsed?.events).toHaveLength(1);
  });

  it("returns null for a missing or non-object state", () => {
    expect(readSavedBudgetState(null)).toBeNull();
    expect(readSavedBudgetState([])).toBeNull();
  });
});

describe("parity with the client finance logic", () => {
  const cases: { message: string; amountPaise: number; category: Category }[] = [
    { message: "sneakers for 4666", amountPaise: 466_600, category: "shopping" },
    { message: "pizza for 900", amountPaise: 90_000, category: "food" },
    { message: "headphones for 9000", amountPaise: 900_000, category: "shopping" },
  ];
  const verdictPhrase: Record<string, string> = {
    over: "would go over the monthly budget",
    "category-over": "would go over the category budget",
    tight: "fits, but leaves very little room",
    fits: "fits comfortably",
    "no-budget": "cannot be checked because no budget is set",
  };

  for (const { message, amountPaise, category } of cases) {
    it(`agrees with the app's simulator for "${message}"`, () => {
      const state = stateWith();
      const summary = summarizeMonth({ ...state, expenses: state.expenses.map((e) => ({ ...e, id: "x", description: "", isSample: false, createdAt: e.date, category: e.category as Category })) }, "2025-06");
      const expected = simulatePurchase(summary, amountPaise, category).verdict;
      expect(buildBudgetFacts(state, message, TODAY).join("\n")).toContain(verdictPhrase[expected]);
    });
  }
});

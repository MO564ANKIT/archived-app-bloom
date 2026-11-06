import { createFileRoute } from "@tanstack/react-router";
import { ExpensesPage } from "@/screens/ExpensesPage";

export const Route = createFileRoute("/expenses")({
  head: () => ({
    meta: [
      { title: "Spending | Spendemon" },
      { name: "description", content: "Log expenses, set monthly and category budgets, and see where your money goes." },
      { property: "og:title", content: "Spending | Spendemon" },
      { property: "og:description", content: "Log expenses, set monthly and category budgets, and see where your money goes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExpensesPage,
});

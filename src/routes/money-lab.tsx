import { createFileRoute } from "@tanstack/react-router";
import { MoneyLabPage } from "@/screens/MoneyLabPage";

export const Route = createFileRoute("/money-lab")({
  head: () => ({
    meta: [
      { title: "Money Lab | Spendemon" },
      { name: "description", content: "Simulate a purchase before you buy and see whether it fits your budget." },
      { property: "og:title", content: "Money Lab | Spendemon" },
      { property: "og:description", content: "Simulate a purchase before you buy and see whether it fits your budget." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MoneyLabPage,
});

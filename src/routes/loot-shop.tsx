import { createFileRoute } from "@tanstack/react-router";
import { LootShopPage } from "@/screens/LootShopPage";

export const Route = createFileRoute("/loot-shop")({
  head: () => ({
    meta: [
      { title: "Loot Shop | Spendemon" },
      { name: "description", content: "Browse playful loot and check out with PayPal sandbox." },
      { property: "og:title", content: "Loot Shop | Spendemon" },
      { property: "og:description", content: "Browse playful loot and check out with PayPal sandbox." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LootShopPage,
});

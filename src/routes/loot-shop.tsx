import { createFileRoute } from "@tanstack/react-router";
import { LootShopPage } from "@/screens/LootShopPage";

export const Route = createFileRoute("/loot-shop")({
  head: () => ({
    meta: [
      { title: "Monster Marketplace | Spendemon" },
      { name: "description", content: "Collect monster skins, accessories and effects with a Purchase Guardian check and PayPal Sandbox checkout." },
      { property: "og:title", content: "Monster Marketplace | Spendemon" },
      { property: "og:description", content: "Collect monster skins, accessories and effects with a Purchase Guardian check and PayPal Sandbox checkout." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LootShopPage,
});

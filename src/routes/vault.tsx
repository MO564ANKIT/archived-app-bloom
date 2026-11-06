import { createFileRoute } from "@tanstack/react-router";
import { VaultPage } from "@/screens/VaultPage";

export const Route = createFileRoute("/vault")({
  head: () => ({
    meta: [
      { title: "Transaction Vault | Spendemon" },
      { name: "description", content: "Every verified PayPal Sandbox payment, contribution and purchase in one searchable vault." },
      { property: "og:title", content: "Transaction Vault | Spendemon" },
      { property: "og:description", content: "Every verified PayPal Sandbox payment, contribution and purchase in one searchable vault." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VaultPage,
});

import { createFileRoute } from "@tanstack/react-router";
import { GoalsPage } from "@/screens/GoalsPage";

export const Route = createFileRoute("/goals")({
  head: () => ({
    meta: [
      { title: "Save to Level | Spendemon" },
      { name: "description", content: "Create savings goals and make verified PayPal Sandbox contributions that level up your monsters." },
      { property: "og:title", content: "Save to Level | Spendemon" },
      { property: "og:description", content: "Create savings goals and make verified PayPal Sandbox contributions that level up your monsters." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GoalsPage,
});

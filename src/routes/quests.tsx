import { createFileRoute } from "@tanstack/react-router";
import { QuestsPage } from "@/screens/QuestsPage";

export const Route = createFileRoute("/quests")({
  head: () => ({
    meta: [
      { title: "Quests | Spendemon" },
      { name: "description", content: "Daily and weekly money quests, rewards, and achievements." },
      { property: "og:title", content: "Quests | Spendemon" },
      { property: "og:description", content: "Daily and weekly money quests, rewards, and achievements." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: QuestsPage,
});

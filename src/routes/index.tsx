import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/screens/DashboardPage";
import { usePageNavigate } from "@/components/app/usePageNavigate";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Spendemon - Your Wallet Is Cooked. Your Monsters Are Thriving." },
      {
        name: "description",
        content:
          "A budgeting game: track spending, level up spending monsters, complete money quests, and get roasted by a friendly AI.",
      },
      { property: "og:title", content: "Spendemon - Your Wallet Is Cooked. Your Monsters Are Thriving." },
      {
        property: "og:description",
        content: "A budgeting game: track spending, level up spending monsters, complete money quests, and get roasted by a friendly AI.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const navigate = usePageNavigate();
  return <DashboardPage onNavigate={navigate} />;
}

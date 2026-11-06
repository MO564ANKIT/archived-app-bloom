import { createFileRoute } from "@tanstack/react-router";
import { MonstersPage } from "@/screens/MonstersPage";

export const Route = createFileRoute("/monsters")({
  head: () => ({
    meta: [
      { title: "Monsters | Spendemon" },
      { name: "description", content: "Meet your spending-habit monsters and watch them evolve as you log expenses." },
      { property: "og:title", content: "Monsters | Spendemon" },
      { property: "og:description", content: "Meet your spending-habit monsters and watch them evolve as you log expenses." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MonstersPage,
});

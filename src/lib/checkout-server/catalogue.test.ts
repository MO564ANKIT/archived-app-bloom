import { describe, expect, it } from "vitest";
import { CATALOGUE } from "./paypal.server";
import { LOOT_CATALOGUE } from "@/lib/lootCatalogue";

describe("Loot Shop server prices", () => {
  it("charges the same US-cent price the shop shows for every item", () => {
    for (const item of LOOT_CATALOGUE) {
      expect(CATALOGUE[item.id]?.priceUsdCents).toBe(item.priceUsdCents);
    }
    expect(Object.keys(CATALOGUE).sort()).toEqual(LOOT_CATALOGUE.map((item) => item.id).sort());
  });

  it("prices the Glow Sneakers at $34.99", () => {
    expect(CATALOGUE["glow-sneakers"]?.priceUsdCents).toBe(3499);
  });
});

import { describe, expect, it } from "vitest";
import { CATALOGUE } from "./paypal.server";
import { LOOT_CATALOGUE, SHOP_ITEMS } from "@/lib/lootCatalogue";

describe("Monster Marketplace server prices", () => {
  it("charges the same US-cent price the marketplace shows for every buyable item", () => {
    for (const item of SHOP_ITEMS) {
      expect(CATALOGUE[item.id]?.priceUsdCents).toBe(item.priceUsdCents);
      expect(CATALOGUE[item.id]?.type).toBe(item.type);
    }
    expect(Object.keys(CATALOGUE).sort()).toEqual(SHOP_ITEMS.map((item) => item.id).sort());
  });

  it("never lets milestone rewards be bought", () => {
    for (const item of LOOT_CATALOGUE.filter((entry) => entry.earnOnly)) {
      expect(CATALOGUE[item.id]).toBeUndefined();
    }
  });

  it("prices the Lime Evolution Aura at $5.99", () => {
    expect(CATALOGUE["fx-lime-aura"]?.priceUsdCents).toBe(599);
  });
});

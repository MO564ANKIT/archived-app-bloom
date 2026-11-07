import { describe, expect, it } from "vitest";
import {
  captureIdFromLinks,
  expectedCustomId,
  verifyPayment,
  type PaypalOrderBody,
} from "./verification";
import { interpretWebhookEvent, parseWebhookEvent } from "./webhook.server";

function orderBody(
  overrides: { id?: string; unitCustomId?: string; captureCustomId?: string } = {},
): PaypalOrderBody {
  return {
    id: overrides.id ?? "ORDER123456789",
    status: "COMPLETED",
    purchase_units: [
      {
        custom_id: overrides.unitCustomId,
        payments: {
          captures: [
            {
              id: "CAPTURE123",
              status: "COMPLETED",
              custom_id: overrides.captureCustomId,
              amount: { value: "4.99", currency_code: "USD" },
            },
          ],
        },
      },
    ],
  };
}

const expected = {
  amountCents: 499,
  currency: "USD",
  orderId: "ORDER123456789",
  customId: "shop:user-1",
};

describe("verifyPayment order and purpose binding", () => {
  it("accepts a matching order id and custom id", () => {
    expect(
      verifyPayment(
        orderBody({ unitCustomId: "shop:user-1", captureCustomId: "shop:user-1" }),
        expected,
      ).verified,
    ).toBe(true);
  });

  it("accepts a response that does not echo custom id", () => {
    expect(verifyPayment(orderBody(), expected).verified).toBe(true);
  });

  it("rejects a response for a different PayPal order", () => {
    expect(verifyPayment(orderBody({ id: "OTHERORDER9999" }), expected).verified).toBe(false);
  });

  it("rejects a capture bound to another user or purpose", () => {
    expect(verifyPayment(orderBody({ unitCustomId: "shop:user-2" }), expected).verified).toBe(
      false,
    );
    expect(verifyPayment(orderBody({ captureCustomId: "goal:abc" }), expected).verified).toBe(
      false,
    );
  });
});

describe("expectedCustomId", () => {
  it("derives the id Spendemon attached at order creation", () => {
    expect(expectedCustomId({ kind: "shop", user_id: "u1" })).toBe("shop:u1");
    expect(expectedCustomId({ kind: "goal_contribution", goal_id: "g1" })).toBe("goal:g1");
    expect(expectedCustomId({ kind: "goal_contribution", goal_id: null })).toBeUndefined();
  });
});

describe("webhook interpretation", () => {
  it("reads the capture id of a refund from its up link, not the refund id", () => {
    const event = parseWebhookEvent({
      id: "WH-1",
      event_type: "PAYMENT.CAPTURE.REFUNDED",
      resource: {
        id: "REFUND111",
        links: [
          { rel: "self", href: "https://api-m.sandbox.paypal.com/v2/payments/refunds/REFUND111" },
          { rel: "up", href: "https://api-m.sandbox.paypal.com/v2/payments/captures/CAPTURE123" },
        ],
      },
    });
    expect(event && interpretWebhookEvent(event)).toEqual({
      kind: "refund",
      captureId: "CAPTURE123",
    });
  });

  it("ignores a refund with no capture link", () => {
    expect(
      interpretWebhookEvent({
        id: "WH-2",
        event_type: "PAYMENT.CAPTURE.REFUNDED",
        resource: { id: "R1" },
      }),
    ).toEqual({
      kind: "ignore",
    });
    expect(captureIdFromLinks("nope")).toBeNull();
  });

  it("parses a completed capture including amount and custom id", () => {
    expect(
      interpretWebhookEvent({
        id: "WH-3",
        event_type: "PAYMENT.CAPTURE.COMPLETED",
        resource: {
          id: "CAPTURE123",
          status: "COMPLETED",
          custom_id: "goal:g1",
          amount: { value: "10.00", currency_code: "USD" },
          supplementary_data: { related_ids: { order_id: "ORDER123456789" } },
        },
      }),
    ).toEqual({
      kind: "complete",
      orderId: "ORDER123456789",
      captureId: "CAPTURE123",
      amountCents: 1000,
      currency: "USD",
      customId: "goal:g1",
    });
  });

  it("rejects malformed events and ignores unrelated types", () => {
    expect(parseWebhookEvent(null)).toBeNull();
    expect(parseWebhookEvent({ id: 5, event_type: "X" })).toBeNull();
    expect(interpretWebhookEvent({ id: "WH-4", event_type: "CHECKOUT.ORDER.APPROVED" })).toEqual({
      kind: "ignore",
    });
  });
});

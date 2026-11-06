import { describe, expect, it } from "vitest";
import { verifyPayment, type PaypalOrderBody } from "./verification";

const expected = { amountCents: 3499, currency: "USD" };

function completedBody(overrides: { value?: string; currency?: string; status?: string } = {}): PaypalOrderBody {
  return {
    id: "ORDER123456789",
    status: "COMPLETED",
    purchase_units: [
      {
        payments: {
          captures: [
            {
              id: "CAPTURE123",
              status: overrides.status ?? "COMPLETED",
              amount: { value: overrides.value ?? "34.99", currency_code: overrides.currency ?? "USD" },
            },
          ],
        },
      },
    ],
  };
}

describe("verifyPayment", () => {
  it("accepts a completed capture with the exact amount and currency", () => {
    expect(verifyPayment(completedBody(), expected)).toEqual({
      verified: true,
      captureId: "CAPTURE123",
      capturePending: false,
    });
  });

  it("rejects a capture for a different amount (tampered price)", () => {
    expect(verifyPayment(completedBody({ value: "0.01" }), expected).verified).toBe(false);
  });

  it("rejects a capture in a different currency", () => {
    expect(verifyPayment(completedBody({ currency: "INR" }), expected).verified).toBe(false);
  });

  it("rejects an order that PayPal has not marked completed", () => {
    const body = { ...completedBody(), status: "APPROVED" };
    expect(verifyPayment(body, expected).verified).toBe(false);
  });

  it("flags a capture that is still pending without verifying it", () => {
    const result = verifyPayment(completedBody({ status: "PENDING" }), expected);
    expect(result.verified).toBe(false);
    expect(result.capturePending).toBe(true);
  });

  it("treats a missing or malformed PayPal reply as unverified", () => {
    expect(verifyPayment(null, expected).verified).toBe(false);
    expect(verifyPayment({ status: "COMPLETED", purchase_units: [] }, expected).verified).toBe(false);
    expect(verifyPayment(completedBody({ value: "34.9" }), expected).verified).toBe(false);
  });
});

export interface PaypalCapture {
  id?: string;
  status?: string;
  custom_id?: string;
  amount?: { value?: string; currency_code?: string };
}

export interface PaypalOrderBody {
  id?: string;
  status?: string;
  links?: { rel?: string; href?: string }[];
  purchase_units?: { custom_id?: string; payments?: { captures?: PaypalCapture[] } }[];
}

export interface ExpectedPayment {
  amountCents: number;
  currency: string;
  /** When set, PayPal's order id must equal it. */
  orderId?: string;
  /** When set, any custom_id PayPal echoes back must equal it (binds the payment to its owner and purpose). */
  customId?: string;
}

/** The custom_id Spendemon attaches when it creates an order, derived from the stored order row. */
export function expectedCustomId(order: {
  kind: string;
  user_id?: string | null;
  goal_id?: string | null;
}): string | undefined {
  if (order.kind === "shop" && order.user_id) return `shop:${order.user_id}`;
  if (order.kind === "goal_contribution" && order.goal_id) return `goal:${order.goal_id}`;
  return undefined;
}

/** Capture id a refund/reversal resource points back to, from its "up" link. */
export function captureIdFromLinks(links: unknown): string | null {
  if (!Array.isArray(links)) return null;
  for (const link of links as { rel?: unknown; href?: unknown }[]) {
    if (link?.rel !== "up" || typeof link.href !== "string") continue;
    const match = /\/v2\/payments\/captures\/([A-Z0-9]{6,40})(?:[/?#]|$)/.exec(link.href);
    if (match) return match[1];
  }
  return null;
}

export function centsToValue(cents: number): string {
  return (cents / 100).toFixed(2);
}

function valueToCents(value: unknown): number | null {
  if (typeof value !== "string" || !/^\d+\.\d{2}$/.test(value)) return null;
  return Math.round(Number(value) * 100);
}

export function verifyPayment(
  body: PaypalOrderBody | null,
  expected: ExpectedPayment,
): { verified: boolean; captureId: string | null; capturePending: boolean } {
  const unit = body?.purchase_units?.[0];
  const captured = unit?.payments?.captures?.[0];
  const echoedCustomIds = [unit?.custom_id, captured?.custom_id].filter(
    (id): id is string => typeof id === "string",
  );
  const orderMatches = expected.orderId === undefined || body?.id === expected.orderId;
  const purposeMatches =
    expected.customId === undefined || echoedCustomIds.every((id) => id === expected.customId);
  const verified =
    orderMatches &&
    purposeMatches &&
    body?.status === "COMPLETED" &&
    captured?.status === "COMPLETED" &&
    captured.amount?.currency_code === expected.currency &&
    valueToCents(captured.amount?.value) === expected.amountCents;
  return {
    verified,
    captureId: typeof captured?.id === "string" ? captured.id : null,
    capturePending: captured?.status === "PENDING",
  };
}

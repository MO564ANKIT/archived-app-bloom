export interface PaypalCapture {
  id?: string;
  status?: string;
  amount?: { value?: string; currency_code?: string };
}

export interface PaypalOrderBody {
  id?: string;
  status?: string;
  links?: { rel?: string; href?: string }[];
  purchase_units?: { payments?: { captures?: PaypalCapture[] } }[];
}

export interface ExpectedPayment {
  amountCents: number;
  currency: string;
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
  const captured = body?.purchase_units?.[0]?.payments?.captures?.[0];
  const verified =
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

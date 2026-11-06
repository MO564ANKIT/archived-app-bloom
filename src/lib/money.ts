export const MAX_AMOUNT_PAISE = 1_000_000_000;

const AMOUNT_PATTERN = /^\d{1,9}(\.\d{1,2})?$/;

const wholeRupeeFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const preciseRupeeFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function parseAmountToPaise(input: string): number | null {
  const cleaned = input.replace(/[,\s\u20B9]/g, '');
  if (!AMOUNT_PATTERN.test(cleaned)) return null;
  const paise = Math.round(Number(cleaned) * 100);
  return paise <= MAX_AMOUNT_PAISE ? paise : null;
}

export function formatMoney(paise: number): string {
  const formatter = paise % 100 === 0 ? wholeRupeeFormatter : preciseRupeeFormatter;
  return formatter.format(paise / 100);
}

const usdFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function formatUsdCents(cents: number): string {
  return usdFormatter.format(cents / 100);
}

export function formatSignedMoney(paise: number): string {
  if (paise === 0) return formatMoney(0);
  return `${paise > 0 ? '+' : '-'}${formatMoney(Math.abs(paise))}`;
}

export function percentOf(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

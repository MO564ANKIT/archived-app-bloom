import { LOOT_BY_ID } from '@/lib/lootCatalogue';
import { paypalCheckout, type CheckoutBody, type CheckoutInput, type CheckoutResponse } from '@/lib/paypal.functions';

export type CaptureResult =
  | {
      status: 'completed';
      orderId: string;
      kind: 'shop' | 'goal_contribution';
      itemIds: string[];
      goalId: string | null;
      amountCents: number;
      milestones: number[];
    }
  | { status: 'failed'; orderId: string; message: string }
  | { status: 'pending'; orderId: string; message: string };

/** A checkout error with an optional machine-readable code (e.g. "setup_needed"). */
export class CheckoutError extends Error {
  constructor(
    message: string,
    readonly code?: 'setup_needed',
  ) {
    super(message);
    this.name = 'CheckoutError';
  }
}

async function postCheckout(body: CheckoutInput): Promise<CheckoutBody> {
  let result: CheckoutResponse;
  try {
    result = await paypalCheckout({ data: body });
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    if (/unauthorized/i.test(message)) throw new CheckoutError('Sign in to continue checkout.');
    throw new CheckoutError('Could not reach the payment service. Check your connection and try again.');
  }
  if (!result.ok) throw new CheckoutError(result.error, result.code);
  return result.body;
}

function readApproval(data: CheckoutBody): { orderId: string; approveUrl: string } {
  if (typeof data.orderId !== 'string' || typeof data.approveUrl !== 'string') {
    throw new Error('PayPal did not return a checkout link. Please try again.');
  }
  return { orderId: data.orderId, approveUrl: data.approveUrl };
}

export async function createPaypalOrder(itemIds: string[]): Promise<{ orderId: string; approveUrl: string }> {
  const unknownItem = itemIds.find((id) => !LOOT_BY_ID[id] || LOOT_BY_ID[id].earnOnly);
  if (unknownItem || itemIds.length === 0) throw new Error('Your cart is empty or has an unknown item.');
  return readApproval(await postCheckout({ action: 'create', itemIds }));
}

export async function createGoalContribution(goalId: string, amountCents: number): Promise<{ orderId: string; approveUrl: string }> {
  return readApproval(await postCheckout({ action: 'contribute', goalId, amountCents }));
}

export async function capturePaypalOrder(orderId: string): Promise<CaptureResult> {
  const data = await postCheckout({ action: 'capture', orderId });
  if (
    data.status === 'completed' &&
    typeof data.orderId === 'string' &&
    typeof data.amountCents === 'number' &&
    (data.kind === 'shop' || data.kind === 'goal_contribution')
  ) {
    return {
      status: 'completed',
      orderId: data.orderId,
      kind: data.kind,
      itemIds: Array.isArray(data.itemIds) ? data.itemIds.filter((id) => typeof id === 'string') : [],
      goalId: typeof data.goalId === 'string' ? data.goalId : null,
      amountCents: data.amountCents,
      milestones: Array.isArray(data.milestones) ? data.milestones : [],
    };
  }
  if (data.status === 'pending') {
    return {
      status: 'pending',
      orderId,
      message: typeof data.message === 'string' ? data.message : 'Your payment is still being confirmed.',
    };
  }
  return {
    status: 'failed',
    orderId,
    message: typeof data.message === 'string' ? data.message : 'Payment was not completed. Nothing was unlocked.',
  };
}

export async function cancelPaypalOrder(orderId: string): Promise<void> {
  await postCheckout({ action: 'cancel', orderId });
}

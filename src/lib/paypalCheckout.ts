import { LOOT_BY_ID } from '@/lib/lootCatalogue';
import { paypalCheckout, type CheckoutBody, type CheckoutInput, type CheckoutResponse } from '@/lib/paypal.functions';

export type CaptureResult =
  | { status: 'completed'; orderId: string; itemIds: string[]; amountCents: number }
  | { status: 'failed'; orderId: string; message: string }
  | { status: 'pending'; orderId: string; message: string };

async function postCheckout(body: CheckoutInput): Promise<CheckoutBody> {
  let result: CheckoutResponse;
  try {
    result = await paypalCheckout({ data: body });
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    if (/unauthorized/i.test(message)) throw new Error('Sign in to continue checkout.');
    throw new Error('Could not reach the payment service. Check your connection and try again.');
  }
  if (!result.ok) throw new Error(result.error);
  return result.body;
}

export async function createPaypalOrder(itemIds: string[]): Promise<{ orderId: string; approveUrl: string }> {
  const unknownItem = itemIds.find((id) => !LOOT_BY_ID[id]);
  if (unknownItem || itemIds.length === 0) throw new Error('Your cart is empty or has an unknown item.');

  const data = await postCheckout({ action: 'create', itemIds });
  if (typeof data.orderId !== 'string' || typeof data.approveUrl !== 'string') {
    throw new Error('PayPal did not return a checkout link. Please try again.');
  }
  return { orderId: data.orderId, approveUrl: data.approveUrl };
}

export async function capturePaypalOrder(orderId: string): Promise<CaptureResult> {
  const data = await postCheckout({ action: 'capture', orderId });
  const itemIds = data.itemIds;
  if (
    data.status === 'completed' &&
    typeof data.orderId === 'string' &&
    Array.isArray(itemIds) &&
    itemIds.every((id) => typeof id === 'string') &&
    typeof data.amountCents === 'number'
  ) {
    return { status: 'completed', orderId: data.orderId, itemIds, amountCents: data.amountCents };
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
    message: typeof data.message === 'string' ? data.message : 'Payment was not completed. Nothing was charged.',
  };
}

export async function cancelPaypalOrder(orderId: string): Promise<void> {
  await postCheckout({ action: 'cancel', orderId });
}

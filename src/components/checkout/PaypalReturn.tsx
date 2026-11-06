import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2, RotateCw, Undo2, XCircle } from 'lucide-react';
import { Button } from '@/components/kit/Button';
import { Modal } from '@/components/kit/Modal';
import { LOOT_BY_ID } from '@/lib/lootCatalogue';
import { formatUsdCents } from '@/lib/money';
import { cancelPaypalOrder, capturePaypalOrder, type CaptureResult } from '@/lib/paypalCheckout';
import { useGame } from '@/state/gameContext';

type PaypalReturnRequest = { kind: 'return' | 'cancel'; orderId: string };

type Outcome =
  | { phase: 'capturing' }
  | { phase: 'completed'; result: Extract<CaptureResult, { status: 'completed' }> }
  | { phase: 'failed'; orderId: string; message: string }
  | { phase: 'pending'; orderId: string; message: string }
  | { phase: 'cancelled' };

function readPaypalReturn(): PaypalReturnRequest | null {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('token');
  if (!orderId) return null;
  if (params.get('paypal') === 'return') return { kind: 'return', orderId };
  if (params.get('paypal') === 'cancel') return { kind: 'cancel', orderId };
  return null;
}

export function PaypalReturn() {
  const { recordEvent } = useGame();
  const [request] = useState(readPaypalReturn);
  const [outcome, setOutcome] = useState<Outcome | null>(() => (request ? { phase: 'capturing' } : null));
  const startedRef = useRef(false);

  const confirm = useCallback(
    (orderId: string) => {
      setOutcome({ phase: 'capturing' });
      capturePaypalOrder(orderId)
        .then((result) => {
          if (result.status === 'completed') {
            recordEvent('purchase_completed');
            setOutcome({ phase: 'completed', result });
          } else if (result.status === 'pending') {
            setOutcome({ phase: 'pending', orderId, message: result.message });
          } else {
            setOutcome({ phase: 'failed', orderId, message: result.message });
          }
        })
        .catch((error: unknown) => {
          setOutcome({
            phase: 'failed',
            orderId,
            message: error instanceof Error ? error.message : 'Payment could not be confirmed. Please try again.',
          });
        });
    },
    [recordEvent],
  );

  useEffect(() => {
    if (!request || startedRef.current) return;
    startedRef.current = true;
    window.history.replaceState(null, '', window.location.pathname);

    if (request.kind === 'cancel') {
      cancelPaypalOrder(request.orderId).catch(() => undefined);
      setOutcome({ phase: 'cancelled' });
      return;
    }
    confirm(request.orderId);
  }, [request, confirm]);

  if (!outcome) return null;

  const close = () => {
    if (outcome.phase !== 'capturing') setOutcome(null);
  };

  return (
    <Modal open onClose={close} title={modalTitle(outcome.phase)}>
      {outcome.phase === 'capturing' && (
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-aqua-300" />
          <p className="text-sm text-ink-200">Confirming your payment with PayPal...</p>
        </div>
      )}

      {outcome.phase === 'completed' && (
        <div className="space-y-5">
          <div className="flex flex-col items-center gap-3 text-center">
            <CheckCircle2 className="h-12 w-12 text-neon-300" />
            <p className="text-sm text-ink-200">
              Payment of {formatUsdCents(outcome.result.amountCents)} was confirmed by PayPal. Your purchase is now recorded in the app.
            </p>
          </div>
          <ul className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-night-950/50 px-4 text-sm">
            {outcome.result.itemIds.map((id) => (
              <li key={id} className="flex items-center justify-between py-3 text-ink-100">
                <span>{LOOT_BY_ID[id]?.name ?? id}</span>
                <span className="font-semibold text-ink-50">{LOOT_BY_ID[id] ? formatUsdCents(LOOT_BY_ID[id].priceUsdCents) : ''}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-ink-400">PayPal order reference: {outcome.result.orderId}</p>
        </div>
      )}

      {outcome.phase === 'failed' && (
        <div className="flex flex-col items-center gap-4 text-center">
          <XCircle className="h-12 w-12 text-rose-300" />
          <p role="alert" className="text-sm text-ink-200">{outcome.message}</p>
          <Button variant="ghost" size="sm" onClick={() => confirm(outcome.orderId)}>
            <RotateCw className="h-4 w-4" /> Try again
          </Button>
        </div>
      )}

      {outcome.phase === 'pending' && (
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-aqua-300" />
          <p role="status" className="text-sm text-ink-200">{outcome.message}</p>
          <Button variant="ghost" size="sm" onClick={() => confirm(outcome.orderId)}>
            <RotateCw className="h-4 w-4" /> Check again
          </Button>
        </div>
      )}

      {outcome.phase === 'cancelled' && (
        <div className="flex flex-col items-center gap-4 text-center">
          <Undo2 className="h-12 w-12 text-amber-300" />
          <p className="text-sm text-ink-200">You cancelled the PayPal checkout. Nothing was charged. You can try again from the Loot Shop.</p>
        </div>
      )}
    </Modal>
  );
}

function modalTitle(phase: Outcome['phase']): string {
  switch (phase) {
    case 'capturing':
      return 'Checking your payment';
    case 'completed':
      return 'Payment confirmed';
    case 'failed':
      return 'Payment not completed';
    case 'pending':
      return 'Payment still processing';
    case 'cancelled':
      return 'Checkout cancelled';
  }
}

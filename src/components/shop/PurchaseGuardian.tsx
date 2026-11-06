import { useEffect, useState } from 'react';
import { Bookmark, Loader2, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/kit/Button';
import { Modal } from '@/components/kit/Modal';
import { SandboxBadge } from '@/components/checkout/SandboxBadge';
import { LOOT_BY_ID } from '@/lib/lootCatalogue';
import { formatMoney, formatUsdCents } from '@/lib/money';
import { purchaseGuardian, type GuardianResponse } from '@/lib/financeAi.functions';
import { createPaypalOrder } from '@/lib/paypalCheckout';
import { useGame } from '@/state/gameContext';
import { cn } from '@/lib/cn';

type Loaded = Extract<GuardianResponse, { ok: true }>;

const VERDICT: Record<Loaded['facts']['verdict'], { label: string; className: string }> = {
  fits: { label: 'Fits your plan', className: 'bg-neon-500/15 text-neon-300' },
  tight: { label: 'Uses a big share', className: 'bg-amber-500/15 text-amber-300' },
  over: { label: 'Over your budget', className: 'bg-rose-500/15 text-rose-300' },
  'no-budget': { label: 'No budget set', className: 'bg-white/10 text-ink-200' },
};

interface PurchaseGuardianProps {
  open: boolean;
  itemIds: string[];
  onClose: () => void;
  onSavedForLater: () => void;
}

export function PurchaseGuardian({ open, itemIds, onClose, onSavedForLater }: PurchaseGuardianProps) {
  const { today, saveForLater } = useGame();
  const [result, setResult] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const key = itemIds.join(',');

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setResult(null);
    setError(null);
    setPayError(null);
    purchaseGuardian({ data: { itemIds: key.split(','), today } })
      .then((response) => {
        if (cancelled) return;
        if (response.ok) setResult(response);
        else setError(response.error);
      })
      .catch(() => !cancelled && setError('The Purchase Guardian could not be reached.'));
    return () => {
      cancelled = true;
    };
  }, [open, key, today]);

  const total = itemIds.reduce((sum, id) => sum + (LOOT_BY_ID[id]?.priceUsdCents ?? 0), 0);

  const pay = async () => {
    setPaying(true);
    setPayError(null);
    try {
      const { approveUrl } = await createPaypalOrder(itemIds);
      window.location.assign(approveUrl);
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Could not start PayPal. Please try again.');
      setPaying(false);
    }
  };

  const later = () => {
    saveForLater(itemIds);
    onSavedForLater();
  };

  const verdict = result ? VERDICT[result.facts.verdict] : null;

  return (
    <Modal open={open} onClose={() => !paying && onClose()} title="AI Purchase Guardian" maxWidth="xl">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm text-ink-200">
            <ShieldCheck className="h-5 w-5 text-volt-300" /> {itemIds.length} item(s) · {formatUsdCents(total)}
          </p>
          <SandboxBadge />
        </div>

        {!result && !error && (
          <div className="flex items-center gap-3 rounded-2xl bg-night-950/50 p-5 text-sm text-ink-300" role="status">
            <Loader2 className="h-5 w-5 animate-spin text-volt-300" /> Checking this against your recorded budget...
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-2xl border border-rose-400/40 bg-rose-500/10 p-4 text-sm text-rose-200">
            {error} You can still continue or cancel.
          </p>
        )}

        {result && verdict && (
          <>
            <section className="rounded-2xl border border-white/10 bg-night-950/50 p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-ink-300">Recorded facts</h3>
                <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider', verdict.className)}>{verdict.label}</span>
              </div>
              <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                <Fact label="Price (approx.)" value={formatMoney(result.facts.priceInrPaise)} />
                <Fact
                  label={`${result.facts.categoryLabel} left`}
                  value={result.facts.categoryRemainingPaise === null ? 'No budget' : formatMoney(Math.max(0, result.facts.categoryRemainingPaise))}
                  sub={result.facts.categoryShareOfRemaining !== null ? `${result.facts.categoryShareOfRemaining}% of it` : undefined}
                />
                <Fact
                  label="Monthly left"
                  value={result.facts.monthlyRemainingPaise === null ? 'No budget' : formatMoney(Math.max(0, result.facts.monthlyRemainingPaise))}
                  sub={result.facts.monthlyShareOfRemaining !== null ? `${result.facts.monthlyShareOfRemaining}% of it` : undefined}
                />
              </dl>
              <p className="mt-3 text-xs text-ink-400">Calculated on our server from your saved budget. US$ prices are converted at a fixed reference rate of ₹83 per US$.</p>
            </section>

            <section className="rounded-2xl border border-volt-500/30 bg-volt-500/10 p-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-volt-300">
                {result.explanationSource === 'ai' ? 'AI explanation' : 'Guardian explanation (AI unavailable)'}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-100">{result.explanation}</p>
              {result.alternative && LOOT_BY_ID[result.alternative.itemId] && (
                <p className="mt-3 text-sm text-ink-200">
                  Cheaper option: <strong className="text-ink-50">{LOOT_BY_ID[result.alternative.itemId].name}</strong> at {formatUsdCents(result.alternative.priceUsdCents)}.
                </p>
              )}
              <p className="mt-3 text-xs text-ink-400">Guidance only. The Guardian never approves or blocks a payment; you decide.</p>
            </section>
          </>
        )}

        {payError && (
          <p role="alert" className="rounded-2xl border border-rose-400/40 bg-rose-500/10 p-4 text-sm text-rose-200">
            {payError}
          </p>
        )}

        <div className="grid gap-2 sm:grid-cols-3">
          <Button variant="primary" onClick={pay} disabled={paying || (!result && !error)}>
            {paying ? 'Opening PayPal...' : 'Continue to PayPal'}
          </Button>
          <Button variant="volt" onClick={later} disabled={paying}>
            <Bookmark className="h-4 w-4" /> Save for later
          </Button>
          <Button variant="ghost" onClick={onClose} disabled={paying}>
            <X className="h-4 w-4" /> Cancel purchase
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function Fact({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-night-900/60 p-3">
      <dt className="text-[11px] uppercase tracking-wider text-ink-400">{label}</dt>
      <dd className="mt-1 font-bold text-ink-50">{value}</dd>
      {sub && <dd className="text-xs text-ink-300">{sub}</dd>}
    </div>
  );
}

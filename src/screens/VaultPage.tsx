import { useMemo, useState } from 'react';
import { Search, Vault as VaultIcon } from 'lucide-react';
import { EmptyState } from '@/components/kit/EmptyState';
import { Modal } from '@/components/kit/Modal';
import { Skeleton } from '@/components/kit/Skeleton';
import { SandboxBadge } from '@/components/checkout/SandboxBadge';
import { STATUS_LABEL, StatusPill } from '@/components/checkout/StatusPill';
import { LOOT_BY_ID } from '@/lib/lootCatalogue';
import { formatUsdCents } from '@/lib/money';
import { useGoals, useTransactions, type OrderStatus, type PaypalTransaction } from '@/lib/ledger';

type KindFilter = 'all' | PaypalTransaction['kind'];
type StatusFilter = 'all' | OrderStatus;

const STATUS_OPTIONS: OrderStatus[] = ['completed', 'pending', 'capturing', 'created', 'cancelled', 'failed', 'refunded'];

function formatDateTime(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export function VaultPage() {
  const transactions = useTransactions();
  const goals = useGoals();
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<KindFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [selected, setSelected] = useState<PaypalTransaction | null>(null);

  const goalNames = useMemo(
    () => Object.fromEntries((goals.data ?? []).map((goal) => [goal.id, goal.name])) as Record<string, string>,
    [goals.data],
  );

  const describe = (tx: PaypalTransaction): string => {
    if (tx.kind === 'goal_contribution') return `Contribution to ${tx.goal_id ? goalNames[tx.goal_id] ?? 'a savings goal' : 'a savings goal'}`;
    const names = tx.item_ids.map((id) => LOOT_BY_ID[id]?.name ?? id);
    return names.length ? names.join(', ') : 'Marketplace purchase';
  };

  const rows = transactions.data ?? [];
  const needle = query.trim().toLowerCase();
  const filtered = rows.filter((tx) => {
    if (kind !== 'all' && tx.kind !== kind) return false;
    if (status !== 'all' && tx.status !== status) return false;
    if (!needle) return true;
    return [describe(tx), tx.paypal_order_id, tx.paypal_capture_id ?? ''].some((text) => text.toLowerCase().includes(needle));
  });

  const verifiedTotal = rows.filter((tx) => tx.status === 'completed').reduce((sum, tx) => sum + tx.amount_cents, 0);
  const savedTotal = rows
    .filter((tx) => tx.status === 'completed' && tx.kind === 'goal_contribution')
    .reduce((sum, tx) => sum + tx.amount_cents, 0);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm font-medium text-aqua-300">Transaction Vault</p>
          <SandboxBadge />
        </div>
        <h1 className="text-3xl font-bold text-ink-50 sm:text-4xl">Every payment, on the record.</h1>
        <p className="max-w-2xl text-sm text-ink-300">
          Goal contributions and marketplace purchases made through PayPal Sandbox. A payment shows as Verified only after our server confirms it with PayPal. No real money moves.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Tile label="Verified payments" value={String(rows.filter((tx) => tx.status === 'completed').length)} />
        <Tile label="Verified total" value={formatUsdCents(verifiedTotal)} />
        <Tile label="Saved toward goals" value={formatUsdCents(savedTotal)} />
      </div>

      <section className="card space-y-5 p-6">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <label className="relative block">
            <span className="sr-only">Search transactions</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by item, goal or PayPal ID"
              className="h-11 w-full rounded-2xl border border-white/10 bg-night-950/60 pl-9 pr-3 text-sm text-ink-50 placeholder:text-ink-400 focus:border-neon-400/60 focus:outline-none"
            />
          </label>
          <Select label="Type" value={kind} onChange={(value) => setKind(value as KindFilter)}>
            <option value="all">All types</option>
            <option value="goal_contribution">Goal contributions</option>
            <option value="shop">Marketplace</option>
          </Select>
          <Select label="Status" value={status} onChange={(value) => setStatus(value as StatusFilter)}>
            <option value="all">All statuses</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {STATUS_LABEL[option]}
              </option>
            ))}
          </Select>
        </div>

        {transactions.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : transactions.isError ? (
          <p role="alert" className="rounded-2xl border border-rose-400/40 bg-rose-500/10 p-4 text-sm text-rose-200">
            {transactions.error.message} Refresh the page to try again.
          </p>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<VaultIcon className="h-6 w-6" />}
            title="The vault is empty"
            description="Contribute to a savings goal or buy a marketplace item with PayPal Sandbox, and it will appear here."
          />
        ) : filtered.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/15 p-6 text-center text-sm text-ink-300">
            No transactions match these filters.
          </p>
        ) : (
          <ul className="divide-y divide-white/10">
            {filtered.map((tx) => (
              <li key={tx.id}>
                <button
                  type="button"
                  onClick={() => setSelected(tx)}
                  className="flex w-full flex-wrap items-center justify-between gap-3 rounded-xl px-2 py-4 text-left transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-400"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink-50">{describe(tx)}</p>
                    <p className="text-xs text-ink-400">
                      {tx.kind === 'goal_contribution' ? 'Goal contribution' : 'Marketplace'} · {formatDateTime(tx.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusPill status={tx.status} />
                    <span className="font-display text-lg font-bold text-ink-50">{formatUsdCents(tx.amount_cents)}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Modal open={selected !== null} onClose={() => setSelected(null)} title="Transaction details" description="PayPal Sandbox demo. No real money moved.">
        {selected && (
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <Detail label="What" value={describe(selected)} wide />
            <Detail label="Status" value={<StatusPill status={selected.status} />} />
            <Detail label="Amount" value={`${formatUsdCents(selected.amount_cents)} ${selected.currency}`} />
            <Detail label="Started" value={formatDateTime(selected.created_at)} />
            <Detail label="Verified" value={formatDateTime(selected.captured_at)} />
            <Detail label="PayPal order ID" value={selected.paypal_order_id} wide mono />
            <Detail label="PayPal capture ID" value={selected.paypal_capture_id ?? 'Not captured'} wide mono />
            {selected.failure_reason && <Detail label="Reason" value={selected.failure_reason} wide />}
          </dl>
        )}
      </Modal>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-ink-400">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-aqua-300">{value}</p>
    </div>
  );
}

function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-2xl border border-white/10 bg-night-950/60 px-3 text-sm text-ink-50 focus:border-neon-400/60 focus:outline-none"
      >
        {children}
      </select>
    </label>
  );
}

function Detail({ label, value, wide, mono }: { label: string; value: React.ReactNode; wide?: boolean; mono?: boolean }) {
  return (
    <div className={`rounded-xl bg-night-950/60 p-3 ${wide ? 'sm:col-span-2' : ''}`}>
      <dt className="text-[11px] uppercase tracking-wider text-ink-400">{label}</dt>
      <dd className={`mt-1 break-all text-ink-50 ${mono ? 'font-mono text-xs' : 'font-semibold'}`}>{value}</dd>
    </div>
  );
}

import { useCallback, useMemo, useState, type FormEvent } from 'react';
import { ArrowRight, Calculator, FlaskConical, SkipForward } from 'lucide-react';
import { Button } from '@/components/kit/Button';
import { FormField } from '@/components/kit/FormField';
import { Toast } from '@/components/kit/Toast';
import { CATEGORIES, CATEGORY_META, type Category } from '@/lib/categories';
import { daysLeftInMonth, formatMonthLabel, monthKeyOf } from '@/lib/dates';
import { buildAlternatives, simulatePurchase, summarizeMonth, type Simulation, type Verdict } from '@/lib/finance';
import { formatMoney, parseAmountToPaise } from '@/lib/money';
import { cn } from '@/lib/cn';
import { useGame } from '@/state/gameContext';

const VERDICT_COPY: Record<Verdict, { title: string; tone: string }> = {
  'no-budget': { title: 'No budget set', tone: 'border-aqua-400/40 bg-aqua-500/10 text-aqua-200' },
  fits: { title: 'Fits comfortably', tone: 'border-neon-400/40 bg-neon-500/10 text-neon-200' },
  tight: { title: 'Fits, but tight', tone: 'border-amber-400/40 bg-amber-500/10 text-amber-200' },
  over: { title: 'Would exceed your monthly budget', tone: 'border-rose-400/40 bg-rose-500/10 text-rose-200' },
  'category-over': { title: 'Would exceed this category budget', tone: 'border-rose-400/40 bg-rose-500/10 text-rose-200' },
};

export function MoneyLabPage() {
  const { state, today, recordEvent } = useGame();
  const [amountText, setAmountText] = useState('');
  const [category, setCategory] = useState<Category>('shopping');
  const [amountError, setAmountError] = useState<string | null>(null);
  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [skipped, setSkipped] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  const monthKey = monthKeyOf(today);
  const summary = useMemo(() => summarizeMonth(state, monthKey), [state, monthKey]);
  const alternatives = useMemo(
    () => (simulation ? buildAlternatives(simulation, daysLeftInMonth(today)) : []),
    [simulation, today],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amountPaise = parseAmountToPaise(amountText);
    if (amountPaise === null || amountPaise <= 0) {
      setAmountError('Enter a price above zero, like 1499 or 1,499.50.');
      setSimulation(null);
      return;
    }
    setAmountError(null);
    setSkipped(false);
    setSimulation(simulatePurchase(summary, amountPaise, category));
    recordEvent('simulation');
  };

  const handleSkip = () => {
    recordEvent('purchase_skipped');
    setSkipped(true);
    setToast('Skipped. Restraint counts toward your quests.');
  };

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-medium text-volt-300">Money Lab</p>
        <h1 className="mt-1 text-3xl font-bold text-ink-50 sm:text-4xl">Test a purchase before you make it.</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-300">
          Simulations use your real budget for {formatMonthLabel(monthKey)} but never create an expense. Nothing here changes your spending.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="card p-6 sm:p-8 lg:col-span-2">
          <div className="mb-5 flex items-center gap-2">
            <span className="rounded-full bg-volt-500/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-volt-200">
              Simulation
            </span>
            <span className="text-xs text-ink-400">Not saved as an expense</span>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <FormField label="Price of the thing" htmlFor="lab-amount" error={amountError} hint="Indian rupees, for example 2499 or 2,499.50">
              <input
                id="lab-amount"
                inputMode="decimal"
                autoComplete="off"
                value={amountText}
                onChange={(event) => setAmountText(event.target.value)}
                placeholder="2499"
                className="input"
                aria-invalid={amountError ? true : undefined}
              />
            </FormField>
            <div>
              <p className="label mb-2">Category</p>
              <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Category">
                {CATEGORIES.map((item) => {
                  const active = item === category;
                  return (
                    <button
                      key={item}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setCategory(item)}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-xs font-medium transition duration-200',
                        active
                          ? 'border-neon-400 bg-neon-500/15 text-neon-200'
                          : 'border-white/10 bg-white/5 text-ink-300 hover:border-white/25 hover:text-ink-50',
                      )}
                    >
                      {CATEGORY_META[item].label}
                    </button>
                  );
                })}
              </div>
            </div>
            <Button type="submit" variant="primary" className="w-full">
              <Calculator className="h-4 w-4" /> Run simulation
            </Button>
          </form>

          <div className="mt-6 rounded-2xl border border-white/10 bg-night-950/50 p-4 text-xs text-ink-300">
            <p className="font-semibold text-ink-200">This month, before this purchase</p>
            <p className="mt-1">
              {summary.remainingPaise === null
                ? 'No monthly budget yet. Set one on the Expenses page to see real limits.'
                : `${formatMoney(Math.max(0, summary.remainingPaise))} remaining of ${formatMoney(summary.budgetPaise ?? 0)}.`}
            </p>
          </div>
        </section>

        <section className="lg:col-span-3">
          {simulation === null ? (
            <div className="card flex h-full min-h-[280px] flex-col items-center justify-center gap-3 p-8 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-volt-500/20 text-volt-200">
                <FlaskConical className="h-7 w-7" />
              </span>
              <p className="font-bold text-ink-50">No simulation yet</p>
              <p className="max-w-xs text-sm text-ink-300">Enter a price and category, then run a simulation to compare your options.</p>
            </div>
          ) : (
            <div className="space-y-5">
              <VerdictCard simulation={simulation} />
              <div className="card p-6 sm:p-8">
                <h2 className="mb-4 text-lg font-bold text-ink-50">Alternatives and trade-offs</h2>
                <ul className="space-y-3">
                  {alternatives.map((alternative) => (
                    <li key={alternative.id} className="rounded-2xl border border-white/10 bg-night-950/50 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="font-semibold text-ink-50">{alternative.title}</p>
                          <p className="mt-1 text-xs leading-relaxed text-ink-300">{alternative.detail}</p>
                        </div>
                        <p className="shrink-0 text-xs text-ink-400">
                          {alternative.remainingAfterPaise === null
                            ? 'No budget'
                            : `Leaves ${formatMoney(Math.max(0, alternative.remainingAfterPaise))}`}
                        </p>
                      </div>
                      {alternative.id === 'skip' && (
                        <div className="mt-3">
                          {skipped ? (
                            <p className="text-xs font-semibold text-neon-300">Skip recorded. Nice restraint.</p>
                          ) : (
                            <Button variant="ghost" size="sm" onClick={handleSkip}>
                              <SkipForward className="h-4 w-4" /> Skip this purchase
                            </Button>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>
      </div>

      <Toast message={toast} onDismiss={dismissToast} />
    </div>
  );
}

function VerdictCard({ simulation }: { simulation: Simulation }) {
  const copy = VERDICT_COPY[simulation.verdict];
  const remaining = simulation.monthlyAfter;
  return (
    <div className={cn('rounded-3xl border p-6 sm:p-8', copy.tone)}>
      <p className="text-xs font-bold uppercase tracking-wider opacity-80">Simulated result</p>
      <h2 className="mt-1 text-2xl font-bold">{copy.title}</h2>
      <p className="mt-2 text-sm opacity-90">
        {formatMoney(simulation.amountPaise)} in {CATEGORY_META[simulation.category].label.toLowerCase()}.
      </p>
      <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs opacity-75">Remaining now</dt>
          <dd className="font-bold">{simulation.monthlyBefore === null ? 'No budget' : formatMoney(Math.max(0, simulation.monthlyBefore))}</dd>
        </div>
        <div>
          <dt className="flex items-center gap-1 text-xs opacity-75">After purchase <ArrowRight className="h-3 w-3" /></dt>
          <dd className="font-bold">
            {remaining === null ? 'No budget' : remaining < 0 ? `-${formatMoney(-remaining)}` : formatMoney(remaining)}
          </dd>
        </div>
        <div>
          <dt className="text-xs opacity-75">Budget used after</dt>
          <dd className="font-bold">{simulation.usedPercentAfter === null ? 'No budget' : `${simulation.usedPercentAfter}%`}</dd>
        </div>
      </dl>
    </div>
  );
}

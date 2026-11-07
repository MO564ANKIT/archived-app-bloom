import { useState } from 'react';
import { BrainCircuit, CheckCircle2, ClipboardList, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/kit/Button';
import { financialInsights, type InsightsResponse } from '@/lib/financeAi.functions';
import { useGame } from '@/state/gameContext';

type Loaded = Extract<InsightsResponse, { ok: true }>;

export function InsightsCard() {
  const { today, recordEvent } = useGame();
  const [result, setResult] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [reviewed, setReviewed] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await financialInsights({ data: { today } });
      if (response.ok) setResult(response);
      else setError(response.error);
    } catch {
      setError('Insights could not be reached. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const markReviewed = () => {
    recordEvent('spending_reviewed');
    setReviewed(true);
  };

  return (
    <section className="card p-6 sm:p-8">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink-50">
            <BrainCircuit className="h-5 w-5 text-volt-300" /> AI financial insights
          </h2>
          <p className="mt-1 text-sm text-ink-300">Your recorded numbers first, then AI suggestions based only on them.</p>
        </div>
        <Button variant="volt" size="sm" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {result ? 'Refresh insights' : 'Get insights'}
        </Button>
      </div>

      {error && (
        <p role="alert" className="rounded-2xl border border-rose-400/40 bg-rose-500/10 p-4 text-sm text-rose-200">
          {error}
        </p>
      )}

      {!result && !error && (
        <p className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-ink-300">
          {loading ? 'Reading your recorded spending...' : 'Tap “Get insights” for a weekly summary, a budget tip, a savings idea and a quest suggestion.'}
        </p>
      )}

      {result && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-night-950/50 p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-ink-300">
              <ClipboardList className="h-4 w-4" /> Recorded facts
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-ink-100">
              {result.facts.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-volt-500/30 bg-volt-500/10 p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-volt-300">
              {result.suggestionSource === 'ai' ? 'AI suggestions' : 'Suggestions (AI unavailable)'}
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-ink-100">
              {result.suggestions.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-ink-400">Suggestions are guidance, not financial advice.</p>
          </div>
          <div className="md:col-span-2 flex justify-end">
            {reviewed ? (
              <span className="flex items-center gap-1.5 text-sm font-bold text-neon-300">
                <CheckCircle2 className="h-4 w-4" /> Spending reviewed
              </span>
            ) : (
              <Button variant="ghost" size="sm" onClick={markReviewed}>
                <CheckCircle2 className="h-4 w-4" /> Mark spending reviewed
              </Button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

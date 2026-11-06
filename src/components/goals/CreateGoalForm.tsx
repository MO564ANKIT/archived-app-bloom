import { useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/kit/Button';
import { FormField } from '@/components/kit/FormField';
import { supabase } from '@/lib/supabase';
import { useRefreshLedger } from '@/lib/ledger';
import { useGame } from '@/state/gameContext';

export function CreateGoalForm({ onCreated }: { onCreated?: () => void }) {
  const { today } = useGame();
  const refresh = useRefreshLedger();
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    const cleanName = name.trim();
    const targetCents = Math.round(Number(target) * 100);
    if (cleanName.length < 1 || cleanName.length > 60) return setError('Give your goal a name of up to 60 characters.');
    if (!/^\d{1,5}(\.\d{1,2})?$/.test(target.trim()) || targetCents < 100 || targetCents > 1_000_000) {
      return setError('Target must be between $1 and $10,000.');
    }
    if (deadline && deadline < today) return setError('Pick a deadline from today onwards.');

    setSaving(true);
    const { error: insertError } = await supabase
      .from('savings_goals')
      .insert({ name: cleanName, target_cents: targetCents, deadline: deadline || null });
    setSaving(false);
    if (insertError) {
      setError(/10 active/.test(insertError.message) ? 'You can have up to 10 active goals.' : 'The goal could not be saved. Please try again.');
      return;
    }
    setName('');
    setTarget('');
    setDeadline('');
    await refresh();
    onCreated?.();
  };

  return (
    <form onSubmit={submit} className="card space-y-4 p-6" noValidate>
      <h2 className="text-lg font-bold text-ink-50">New savings goal</h2>
      <FormField label="Goal name" htmlFor="goal-name">
        <input id="goal-name" className="input" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} placeholder="New headphones" />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Target (US$)" htmlFor="goal-target" hint="Sandbox amounts only">
          <input id="goal-target" className="input" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="50" />
        </FormField>
        <FormField label="Deadline (optional)" htmlFor="goal-deadline">
          <input id="goal-deadline" type="date" className="input" min={today} value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </FormField>
      </div>
      {error && (
        <p role="alert" className="text-sm text-rose-300">
          {error}
        </p>
      )}
      <Button type="submit" variant="primary" className="w-full" disabled={saving}>
        <Plus className="h-4 w-4" /> {saving ? 'Saving...' : 'Create goal'}
      </Button>
    </form>
  );
}

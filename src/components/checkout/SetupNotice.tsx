import { FlaskConical, Info, Wrench } from 'lucide-react';
import { usePaypalSetup } from '@/lib/paypalSetup';
import { cn } from '@/lib/cn';

/** Friendly notice when PayPal Sandbox keys or the webhook ID are not configured yet. */
export function SetupNotice({ className }: { className?: string }) {
  const { data } = usePaypalSetup();
  if (!data) return null;
  if (!data.checkoutReady) {
    return (
      <div role="status" className={cn('flex items-start gap-3 rounded-2xl border border-amber-400/40 bg-amber-500/10 p-4 text-sm text-amber-100', className)}>
        <Wrench className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
        <div>
          <p className="font-bold text-amber-200">Sandbox setup needed</p>
          <p className="mt-1 text-amber-100/90">
            PayPal Sandbox test keys are not configured yet, so checkout and contributions are paused. Nothing will be charged. Demo mode still works.
          </p>
        </div>
      </div>
    );
  }
  if (!data.webhooksReady) {
    return (
      <div role="status" className={cn('flex items-start gap-3 rounded-2xl border border-aqua-400/30 bg-aqua-500/10 p-3 text-xs text-ink-200', className)}>
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-aqua-300" />
        <p>
          Sandbox webhooks are not set up yet. Payments are still verified when you return from PayPal; background confirmations will start once the webhook ID is added.
        </p>
      </div>
    );
  }
  return null;
}

/** Small reassurance shown next to every PayPal button. */
export function TestModeNote({ className }: { className?: string }) {
  return (
    <p className={cn('flex items-center gap-1.5 text-xs font-medium text-amber-300', className)}>
      <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" /> Test mode: no real money. PayPal Sandbox only.
    </p>
  );
}

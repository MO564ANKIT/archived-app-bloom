import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Flame, KeyRound } from "lucide-react";
import { Button } from "@/components/kit/Button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/state/authContext";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password | Spendemon" },
      { name: "description", content: "Choose a new password for your Spendemon account." },
      { property: "og:title", content: "Set a new password | Spendemon" },
      { property: "og:description", content: "Choose a new password for your Spendemon account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const description = hash.get("error_description");
    if (description) setLinkError(description.replace(/\+/g, " "));
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    if (password.length < 6) {
      setError("Use a password with at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (updateError) {
      setError("Your new password could not be saved. Request a fresh link and try again.");
      return;
    }
    void navigate({ to: "/" });
  };

  const ready = !loading && !!session;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 text-ink-100">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-neon-400/50 bg-night-900 shadow-glow-neon">
            <Flame className="h-6 w-6 text-neon-300" strokeWidth={2.25} />
          </div>
          <p className="font-display text-2xl font-bold uppercase tracking-[0.18em] text-ink-50">Spendemon</p>
        </div>

        <section className="card space-y-6 p-6 sm:p-8">
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-ink-50">Choose a new password</h1>
            <p className="text-sm text-ink-300">
              {ready ? "Your email is confirmed. Pick a password to finish signing in." : "Open the link from your email to continue."}
            </p>
          </div>

          {linkError || (!loading && !session) ? (
            <div className="space-y-4">
              <p role="alert" className="text-sm text-rose-300">
                {linkError ?? "This link has expired or was already used."} Request a new one from the sign-in screen.
              </p>
              <Button variant="ghost" className="w-full" onClick={() => void navigate({ to: "/" })}>
                Back to sign in
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <label htmlFor="new-password" className="text-sm font-medium text-ink-200">
                  New password
                </label>
                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="input w-full"
                  disabled={submitting || !ready}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="confirm-password" className="text-sm font-medium text-ink-200">
                  Confirm new password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  className="input w-full"
                  disabled={submitting || !ready}
                />
              </div>
              {error && (
                <p role="alert" className="text-sm text-rose-300">
                  {error}
                </p>
              )}
              <Button type="submit" variant="primary" className="w-full" disabled={submitting || !ready}>
                <KeyRound className="h-4 w-4" />
                {submitting ? "Saving..." : ready ? "Save password" : "Checking your link..."}
              </Button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}

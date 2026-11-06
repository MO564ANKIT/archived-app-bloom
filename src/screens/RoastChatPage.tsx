import { useEffect, useRef, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Bot, Info, Send, User } from 'lucide-react';
import { MonsterImage } from '@/components/monsters/MonsterImage';
import { getLevelProgress, getSpecies } from '@/lib/monsters';
import { Button } from '@/components/kit/Button';
import { cn } from '@/lib/cn';
import { PERSONALITIES, type Personality } from '@/lib/roast';
import { requestRoast } from '@/lib/roastAi';
import { useGame } from '@/state/gameContext';

const MAX_MESSAGE_LENGTH = 200;
const HISTORY_LENGTH = 10;

interface ChatMessage {
  id: number;
  role: 'user' | 'bot';
  text: string;
}

function greetingFor(personality: Personality): ChatMessage {
  const info = PERSONALITIES.find((entry) => entry.id === personality);
  return { id: 0, role: 'bot', text: info?.greeting ?? '' };
}

export function RoastChatPage() {
  const { state, today } = useGame();
  const [personality, setPersonality] = useState<Personality>('softie');
  const [messages, setMessages] = useState<ChatMessage[]>(() => [greetingFor('softie')]);
  const [draft, setDraft] = useState('');
  const [draftError, setDraftError] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const nextId = useRef(1);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const switchPersonality = (next: Personality) => {
    setPersonality(next);
    setMessages([greetingFor(next)]);
    setDraft('');
    setDraftError(null);
  };

  const pushMessage = (role: ChatMessage['role'], text: string) => {
    const id = nextId.current++;
    setMessages((current) => [...current, { id, role, text }]);
  };

  const sendMessage = async (text: string) => {
    const previous = messages.slice(1).slice(-HISTORY_LENGTH);
    pushMessage('user', text);
    setIsThinking(true);
    setDraftError(null);
    try {
      const reply = await requestRoast({
        personality,
        message: text,
        today,
        history: previous.map(({ role, text: body }) => ({ role, text: body })),
      });
      pushMessage('bot', reply);
    } catch (err) {
      setDraftError(err instanceof Error ? err.message : 'The roast did not come through. Please try again.');
    } finally {
      setIsThinking(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isThinking) return;
    const text = draft.trim();
    if (!text) {
      setDraftError('Type something first, like a price or "check my month".');
      return;
    }
    if (text.length > MAX_MESSAGE_LENGTH) {
      setDraftError(`Keep messages under ${MAX_MESSAGE_LENGTH} characters.`);
      return;
    }
    setDraft('');
    void sendMessage(text);
  };

  const checkMonth = () => {
    if (isThinking) return;
    void sendMessage('Check my month');
  };

  const featuredSpecies = getSpecies(state.featuredMonsterId);
  const featuredStage = getLevelProgress(state.monsters[state.featuredMonsterId].xp).stage;

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between gap-6">
        <div>
          <p className="text-sm font-medium text-neon-400">Roast Chat</p>
          <h1 className="mt-1 text-3xl font-bold text-ink-50 sm:text-4xl">Get roasted, lovingly or not.</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-300">
            Type a price to test a purchase. Replies use your real budget and streak.
          </p>
        </div>
        <div className="hidden shrink-0 flex-col items-center gap-1 sm:flex">
          <div className="h-24 w-24">
            <MonsterImage monsterId={featuredSpecies.id} stage={featuredStage} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-ink-400">{featuredSpecies.name}</span>
        </div>
      </header>

      <div className="flex items-start gap-3 rounded-2xl border border-aqua-400/30 bg-aqua-500/10 p-4 text-sm text-aqua-100">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Replies are written by an AI model using your real budget numbers. Chats are not saved and nothing you type changes your expenses.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="space-y-3 lg:col-span-1" role="radiogroup" aria-label="Personality">
          {PERSONALITIES.map((info) => {
            const active = info.id === personality;
            return (
              <button
                key={info.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => switchPersonality(info.id)}
                className={cn(
                  'w-full rounded-2xl border p-4 text-left transition duration-200',
                  active
                    ? 'border-volt-400/60 bg-volt-500/15 shadow-glow-volt'
                    : 'border-white/10 bg-night-900/60 hover:border-white/25',
                )}
              >
                <p className="font-bold text-ink-50">{info.label}</p>
                <p className="mt-0.5 text-xs text-ink-300">{info.tagline}</p>
              </button>
            );
          })}
        </div>

        <section className="card flex min-h-[460px] flex-col p-4 sm:p-6 lg:col-span-3">
          <div className="flex-1 space-y-4 overflow-y-auto pr-1" aria-live="polite">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn('flex gap-3', message.role === 'user' && 'flex-row-reverse')}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    message.role === 'bot' ? 'bg-volt-500/25 text-volt-200' : 'bg-neon-500/20 text-neon-200',
                  )}
                >
                  {message.role === 'bot' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </span>
                <p
                  className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                    message.role === 'bot' ? 'bg-night-950/70 text-ink-100' : 'bg-neon-500/15 text-ink-50',
                  )}
                >
                  {message.text}
                </p>
              </motion.div>
            ))}
            {isThinking && (
              <p className="text-sm text-ink-300" role="status">
                {PERSONALITIES.find((entry) => entry.id === personality)?.label} is thinking...
              </p>
            )}
            <div ref={endRef} />
          </div>

          <div className="mt-5 space-y-3 border-t border-white/10 pt-5">
            <Button variant="ghost" size="sm" onClick={checkMonth} disabled={isThinking}>
              Check my month
            </Button>
            <form onSubmit={handleSubmit} className="flex gap-2" noValidate>
              <label htmlFor="roast-input" className="sr-only">
                Message
              </label>
              <input
                id="roast-input"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Try: sneakers for 2499"
                maxLength={MAX_MESSAGE_LENGTH + 50}
                className="input flex-1"
                disabled={isThinking}
                aria-invalid={draftError ? true : undefined}
                aria-describedby={draftError ? 'roast-error' : undefined}
              />
              <Button type="submit" variant="primary" aria-label="Send" disabled={isThinking}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
            {draftError && (
              <p id="roast-error" role="alert" className="text-xs text-rose-300">
                {draftError}
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

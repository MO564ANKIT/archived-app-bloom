// Server-only AI roaster, ported from the original roast-chat function.
// Budget figures come from the saved game on the server, never from the browser.
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildBudgetFacts, isDateKey, readSavedBudgetState } from "./budgetFacts";

const ROAST_LIMIT_PER_HOUR = 30;
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent";
const MAX_MESSAGE_LENGTH = 200;
const MAX_HISTORY = 10;
const MAX_HISTORY_TEXT = 300;
const MAX_FACTS = 12;
const MAX_FACT_LENGTH = 300;

export const PERSONA_STYLE: Record<string, string> = {
  softie: "You are a gentle, warm money buddy. Nudge kindly, celebrate small wins, never shame the user.",
  savage: "You are a blunt, witty roaster. Tease hard and fast, no sugar coating, but never cruel about the person's worth.",
  "big-brain": "You are a calm data analyst. Lead with numbers and trade-offs, keep feelings to one short line.",
  unhinged: "You are chaotic, hyped and playful, with big energy and short punchy sentences. Keep it fun, not mean.",
};

const RULES = [
  "Reply in 2 to 4 short sentences as plain text. No markdown, no lists, no emojis.",
  "Use only the numbers listed in the facts. Never invent amounts, dates or categories.",
  "If there are no facts, just chat about budgeting and invite the user to type a price.",
  "Reply in the same language the user writes in (English or Hinglish).",
].join("\n");

export interface HistoryItem {
  role: "user" | "bot";
  text: string;
}

export type RoastResult = { ok: true; reply: string } | { ok: false; error: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any, any, any>;

function isHistory(value: unknown): value is HistoryItem[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        ((item as HistoryItem).role === "user" || (item as HistoryItem).role === "bot") &&
        typeof (item as HistoryItem).text === "string",
    )
  );
}

function buildRequest(personality: string, message: string, facts: string[], history: HistoryItem[]) {
  const system = [PERSONA_STYLE[personality], RULES].join("\n\n");
  const contents = [
    ...history.slice(-MAX_HISTORY).map((item) => ({
      role: item.role === "user" ? "user" : "model",
      parts: [{ text: item.text.slice(0, MAX_HISTORY_TEXT) }],
    })),
    {
      role: "user",
      parts: [
        {
          text: `Facts from the user's budget app:\n${facts.length ? facts.slice(0, MAX_FACTS).map((fact) => `- ${fact.slice(0, MAX_FACT_LENGTH)}`).join("\n") : "- (none)"}\n\nUser message: ${message}`,
        },
      ],
    },
  ];
  return {
    systemInstruction: { parts: [{ text: system }] },
    contents,
    generationConfig: {
      temperature: 1.0,
      maxOutputTokens: 4096,
      thinkingConfig: { thinkingLevel: "low" },
    },
  };
}

export async function runRoast(
  userDb: Db,
  adminDb: Db,
  userId: string,
  input: { personality: unknown; message: unknown; today: unknown; history: unknown },
): Promise<RoastResult> {
  const { personality, message, today } = input;
  const history = input.history ?? [];

  if (typeof personality !== "string" || !Object.hasOwn(PERSONA_STYLE, personality)) {
    return { ok: false, error: "Pick a personality and try again." };
  }
  if (typeof message !== "string" || message.trim().length === 0 || message.length > MAX_MESSAGE_LENGTH) {
    return { ok: false, error: "Your message must be between 1 and 200 characters." };
  }
  if (!isDateKey(today) || !isHistory(history)) {
    return { ok: false, error: "The roast request was not in the expected shape." };
  }

  const windowStart = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await adminDb
    .from("roast_requests")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", windowStart);
  if (countError) throw countError;
  if ((count ?? 0) >= ROAST_LIMIT_PER_HOUR) {
    return { ok: false, error: "You have used all your roasts for this hour. Come back soon." };
  }
  const { error: insertError } = await adminDb.from("roast_requests").insert({ user_id: userId });
  if (insertError) throw insertError;

  // Read the player's own save with their session (owner-only access rules apply).
  const { data: saveRow, error: saveError } = await userDb
    .from("player_saves")
    .select("state")
    .eq("user_id", userId)
    .maybeSingle();
  if (saveError) throw saveError;
  const savedState = readSavedBudgetState(saveRow?.state);
  const facts = savedState ? buildBudgetFacts(savedState, message.trim(), today) : [];

  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) {
    // No project Gemini key: use the same Gemini model through Lovable AI.
    const request = buildRequest(personality, message.trim(), facts, history);
    const { generateAiText } = await import("../ai-server/ai.server");
    const result = await generateAiText({
      system: request.systemInstruction.parts[0].text,
      user: request.contents[request.contents.length - 1].parts[0].text,
      history: history.slice(-MAX_HISTORY).map((item) => ({
        role: item.role === "user" ? "user" : "assistant",
        text: item.text.slice(0, MAX_HISTORY_TEXT),
      })),
      temperature: 1.0,
    });
    if (result.ok) return { ok: true, reply: result.text };
    if (result.reason === "credits") return { ok: false, error: "The AI roaster is out of credits right now." };
    if (result.reason === "rate-limit") return { ok: false, error: "Too many roasts at once. Try again in a minute." };
    return { ok: false, error: "The AI roaster is taking a break. Try again in a moment." };
  }

  const response = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    signal: AbortSignal.timeout(45000),
    body: JSON.stringify(buildRequest(personality, message.trim(), facts, history)),
  });
  const data = await response.json().catch(() => null);
  const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!response.ok || typeof reply !== "string" || reply.trim().length === 0) {
    console.error("roast-chat gemini failed", response.status);
    return { ok: false, error: "The AI roaster is taking a break. Try again in a moment." };
  }
  return { ok: true, reply: reply.trim() };
}

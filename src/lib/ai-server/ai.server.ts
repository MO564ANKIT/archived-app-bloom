// Shared server-only text generation for Spendemon's AI features.
// Uses the project's own Gemini key when one is configured (the original integration);
// otherwise the same Gemini model through Lovable AI. Returns null on any failure so
// callers can fall back to deterministic text.
import { GatewayError, generateChatCompletion } from "@lovable.dev/ai-gateway";

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent";
const TIMEOUT_MS = 25000;

export interface AiTextRequest {
  system: string;
  user: string;
  temperature?: number;
  history?: { role: "user" | "assistant"; text: string }[];
}

export type AiTextResult = { ok: true; text: string; source: "gemini" | "lovable-ai" } | { ok: false; reason: "timeout" | "unavailable" | "credits" | "rate-limit" };

export async function generateAiText(req: AiTextRequest): Promise<AiTextResult> {
  const geminiKey = process.env["GEMINI_API_KEY"];
  if (geminiKey) {
    try {
      const response = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: req.system }] },
          contents: [
            ...(req.history ?? []).map((item) => ({ role: item.role === "user" ? "user" : "model", parts: [{ text: item.text }] })),
            { role: "user", parts: [{ text: req.user }] },
          ],
          generationConfig: { temperature: req.temperature ?? 0.6, maxOutputTokens: 2048 },
        }),
      });
      const data = await response.json().catch(() => null);
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (response.ok && typeof text === "string" && text.trim()) return { ok: true, text: text.trim(), source: "gemini" };
      console.error("gemini request failed", response.status);
      return { ok: false, reason: "unavailable" };
    } catch (err) {
      return { ok: false, reason: err instanceof Error && err.name === "TimeoutError" ? "timeout" : "unavailable" };
    }
  }

  try {
    const completion = await generateChatCompletion(
      {
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: req.system },
          ...(req.history ?? []).map((item) => ({ role: item.role, content: item.text })),
          { role: "user", content: req.user },
        ],
        temperature: req.temperature ?? 0.6,
        max_tokens: 2048,
      },
      { signal: AbortSignal.timeout(TIMEOUT_MS) },
    );
    const content = completion.choices?.[0]?.message?.content;
    const text = typeof content === "string" ? content.trim() : "";
    return text ? { ok: true, text, source: "lovable-ai" } : { ok: false, reason: "unavailable" };
  } catch (err) {
    if (err instanceof GatewayError) {
      console.error("ai gateway failed", err.code, err.httpStatus);
      if (err.httpStatus === 402) return { ok: false, reason: "credits" };
      if (err.httpStatus === 429) return { ok: false, reason: "rate-limit" };
      if (err.name === "TimeoutError") return { ok: false, reason: "timeout" };
    } else if (err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")) {
      return { ok: false, reason: "timeout" };
    }
    return { ok: false, reason: "unavailable" };
  }
}

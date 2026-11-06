import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface RoastInput {
  personality: string;
  message: string;
  today: string;
  history: { role: "user" | "bot"; text: string }[];
}

export type RoastResponse = { ok: true; reply: string } | { ok: false; error: string };

export const roastChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: RoastInput) => {
    if (!input || typeof input !== "object") throw new Error("The roast request was not in the expected shape.");
    return input;
  })
  .handler(async ({ data, context }): Promise<RoastResponse> => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { runRoast } = await import("./roast-server/roast.server");
      return await runRoast(context.supabase, supabaseAdmin, context.userId, data);
    } catch (err) {
      console.error("roast-chat failed", err);
      if (err instanceof Error && err.name === "TimeoutError") {
        return { ok: false, error: "The roaster is taking too long right now. Please try again." };
      }
      return { ok: false, error: "Something went wrong while roasting. Please try again." };
    }
  });

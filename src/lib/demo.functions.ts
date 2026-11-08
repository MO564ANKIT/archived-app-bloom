import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type DemoResponse = { ok: true } | { ok: false; error: string };

// Seeds or removes the signed-in player's own demo goal and demo order. The user id
// comes from the verified session, never from the browser.
export const demoJourney = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { action: "start" | "reset" }) => {
    if (!input || (input.action !== "start" && input.action !== "reset")) throw new Error("Unknown demo action.");
    return { action: input.action };
  })
  .handler(async ({ data, context }): Promise<DemoResponse> => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const fn = data.action === "start" ? "start_demo_journey" : "reset_demo_journey";
      const { error } = await supabaseAdmin.rpc(fn, { _user_id: context.userId });
      if (error) {
        console.error(`demo-journey ${data.action} failed`, error.message);
        return {
          ok: false,
          error: /10 active goals/.test(error.message)
            ? "You already have 10 active goals. Finish or delete one, then start the demo."
            : "The demo could not be set up. Please try again.",
        };
      }
      return { ok: true };
    } catch (err) {
      console.error("demo-journey failed", err instanceof Error ? err.message : "unknown error");
      return { ok: false, error: "The demo could not be set up. Please try again." };
    }
  });

import { createFileRoute } from "@tanstack/react-router";

const MAX_BODY_BYTES = 64 * 1024;

export const Route = createFileRoute("/api/public/paypal-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const raw = await request.text();
          if (raw.length > MAX_BODY_BYTES) return new Response("Payload too large", { status: 413 });
          let parsed: unknown;
          try {
            parsed = JSON.parse(raw);
          } catch {
            return new Response("Invalid JSON", { status: 400 });
          }

          const webhook = await import("@/lib/checkout-server/webhook.server");
          const event = webhook.parseWebhookEvent(parsed);
          if (!event) return new Response("Invalid event", { status: 400 });

          const { paypalSetupStatus, logMissingPaypalSecrets } = await import("@/lib/checkout-server/setupStatus");
          const setup = paypalSetupStatus(process.env);
          if (!setup.webhooksReady) {
            logMissingPaypalSecrets("webhook received", setup);
            return Response.json({ received: false, error: "Sandbox setup needed" }, { status: 503 });
          }
          const verified = await webhook.verifyWebhookSignature(request.headers, parsed);
          if (!verified) return new Response("Signature verification failed", { status: 401 });

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const outcome = await webhook.processWebhookEvent(supabaseAdmin, event);
          return Response.json({ received: true, outcome });
        } catch (err) {
          console.error("paypal-webhook failed", err instanceof Error ? err.message : "unknown error");
          return new Response("Webhook processing failed", { status: 500 });
        }
      },
    },
  },
});

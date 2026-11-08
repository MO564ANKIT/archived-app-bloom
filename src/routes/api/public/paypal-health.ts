import { createFileRoute } from "@tanstack/react-router";
import { paypalSetupStatus } from "@/lib/checkout-server/setupStatus";

// Public status check: reports only whether each PayPal Sandbox secret is set (true/false).
export const Route = createFileRoute("/api/public/paypal-health")({
  server: {
    handlers: {
      GET: async () => {
        const status = paypalSetupStatus(process.env);
        return Response.json(
          {
            ok: status.checkoutReady,
            mode: status.mode,
            environment: "https://api-m.sandbox.paypal.com",
            secrets: {
              PAYPAL_CLIENT_ID: status.clientId,
              PAYPAL_CLIENT_SECRET: status.clientSecret,
              PAYPAL_WEBHOOK_ID: status.webhookId,
            },
            checkoutReady: status.checkoutReady,
            webhooksReady: status.webhooksReady,
          },
          { headers: { "Cache-Control": "no-store" } },
        );
      },
    },
  },
});

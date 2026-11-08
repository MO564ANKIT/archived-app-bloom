// Reports which PayPal Sandbox secrets are configured, as booleans only. Never returns values.
export interface PaypalSetupStatus {
  mode: 'sandbox';
  clientId: boolean;
  clientSecret: boolean;
  webhookId: boolean;
  /** Checkout and goal contributions can run. */
  checkoutReady: boolean;
  /** Webhook events can be signature-verified and reconciled. */
  webhooksReady: boolean;
  missing: string[];
}

type Env = Record<string, string | undefined>;

const present = (value: string | undefined) => typeof value === 'string' && value.trim().length > 0;

export function paypalSetupStatus(env: Env): PaypalSetupStatus {
  const clientId = present(env['PAYPAL_CLIENT_ID']);
  const clientSecret = present(env['PAYPAL_CLIENT_SECRET']);
  const webhookId = present(env['PAYPAL_WEBHOOK_ID']);
  const missing = [
    !clientId && 'PAYPAL_CLIENT_ID',
    !clientSecret && 'PAYPAL_CLIENT_SECRET',
    !webhookId && 'PAYPAL_WEBHOOK_ID',
  ].filter((name): name is string => Boolean(name));
  return {
    mode: 'sandbox',
    clientId,
    clientSecret,
    webhookId,
    checkoutReady: clientId && clientSecret,
    webhooksReady: clientId && clientSecret && webhookId,
    missing,
  };
}

/** Logs one clear server-side line naming missing secrets (names only). */
export function logMissingPaypalSecrets(context: string, status: PaypalSetupStatus): void {
  if (status.missing.length === 0) return;
  console.warn(`[paypal-sandbox] ${context}: setup needed, missing secret(s): ${status.missing.join(', ')}`);
}

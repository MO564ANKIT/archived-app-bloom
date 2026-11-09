import { useQuery } from '@tanstack/react-query';
import { paypalSetup, type PaypalSetupView } from '@/lib/paypal.functions';

/** Whether PayPal Sandbox checkout and webhooks are configured on the server (true/false only). */
export function usePaypalSetup() {
  return useQuery({
    queryKey: ['paypal', 'setup'],
    queryFn: (): Promise<PaypalSetupView> => paypalSetup(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

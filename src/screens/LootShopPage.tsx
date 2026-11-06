import { useCallback, useState } from 'react';
import { ShoppingBag, Trash2 } from 'lucide-react';
import { Button } from '@/components/kit/Button';
import { Modal } from '@/components/kit/Modal';
import { Toast } from '@/components/kit/Toast';
import { EmptyState } from '@/components/kit/EmptyState';
import { LOOT_BY_ID, LOOT_CATALOGUE } from '@/lib/lootCatalogue';
import { formatUsdCents } from '@/lib/money';
import { createPaypalOrder } from '@/lib/paypalCheckout';
import { useGame } from '@/state/gameContext';

export function LootShopPage() {
  const { recordEvent } = useGame();
  const [cart, setCart] = useState<string[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  const cartItems = cart.map((id) => LOOT_BY_ID[id]);
  const cartTotal = cartItems.reduce((total, item) => total + item.priceUsdCents, 0);

  const toggleItem = (id: string) => {
    setCart((current) => (current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]));
  };

  const abandonCart = () => {
    recordEvent('cart_abandoned');
    setCart([]);
    setCheckoutOpen(false);
    setToast('Cart abandoned on purpose. Your wallet says thank you.');
  };

  const closeCheckout = () => {
    if (paying) return;
    setCheckoutOpen(false);
    setPayError(null);
  };

  const payWithPaypal = async () => {
    setPaying(true);
    setPayError(null);
    try {
      const { approveUrl } = await createPaypalOrder(cart);
      window.location.assign(approveUrl);
    } catch (error) {
      setPayError(error instanceof Error ? error.message : 'Could not start PayPal. Please try again.');
      setPaying(false);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-medium text-amber-300">Loot Shop</p>
        <h1 className="mt-1 text-3xl font-bold text-ink-50 sm:text-4xl">Browse the loot</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-300">
          Prices are in US dollars. Checkout runs in the PayPal sandbox, so no real money moves.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-3">
          {LOOT_CATALOGUE.map((item) => {
            const inCart = cart.includes(item.id);
            const Icon = item.icon;
            return (
              <article key={item.id} className="card flex flex-col gap-4 p-5">
                <div className="flex items-start justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-300">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-ink-400">
                    Sandbox
                  </span>
                </div>
                <div className="flex-1">
                  <h2 className="font-bold text-ink-50">{item.name}</h2>
                  <p className="mt-1 text-xs text-ink-300">{item.blurb}</p>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-display text-lg font-bold text-ink-50">{formatUsdCents(item.priceUsdCents)}</p>
                  <Button variant={inCart ? 'ghost' : 'primary'} size="sm" onClick={() => toggleItem(item.id)}>
                    {inCart ? 'Remove' : 'Add to cart'}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="card flex flex-col p-6 sm:p-7 lg:col-span-2 lg:sticky lg:top-40 lg:self-start">
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink-50">
            <ShoppingBag className="h-5 w-5 text-amber-300" /> Your cart
          </h2>

          {cartItems.length === 0 ? (
            <EmptyState
              icon={<ShoppingBag className="h-6 w-6" />}
              title="Your cart is empty"
              description="Add an item to start a PayPal checkout."
            />
          ) : (
            <div className="mt-4 space-y-4">
              <ul className="divide-y divide-white/10">
                {cartItems.map((item) => (
                  <li key={item.id} className="flex items-center justify-between py-3 text-sm">
                    <span className="text-ink-100">{item.name}</span>
                    <span className="flex items-center gap-3">
                      <span className="font-semibold text-ink-50">{formatUsdCents(item.priceUsdCents)}</span>
                      <button
                        type="button"
                        onClick={() => toggleItem(item.id)}
                        aria-label={`Remove ${item.name}`}
                        className="rounded-lg p-1 text-ink-400 transition hover:bg-white/10 hover:text-rose-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between text-base font-bold text-ink-50">
                <span>Cart total</span>
                <span>{formatUsdCents(cartTotal)}</span>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <Button variant="primary" onClick={() => setCheckoutOpen(true)}>
                  Review checkout
                </Button>
                <Button variant="danger" onClick={abandonCart}>
                  Abandon cart
                </Button>
              </div>
            </div>
          )}
        </aside>
      </div>

      <Modal
        open={checkoutOpen}
        onClose={closeCheckout}
        title="Checkout with PayPal"
        description="Sandbox mode: sign in with a PayPal sandbox buyer account. No real money moves."
      >
        <div className="space-y-5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-300">{cartItems.length} items</span>
            <span className="font-display text-xl font-bold text-ink-50">{formatUsdCents(cartTotal)}</span>
          </div>

          {payError && (
            <p role="alert" className="rounded-2xl border border-rose-400/40 bg-rose-500/10 p-4 text-sm text-rose-200">
              {payError}
            </p>
          )}

          <Button variant="primary" className="w-full" disabled={paying || cartItems.length === 0} onClick={payWithPaypal}>
            {paying ? 'Opening PayPal...' : `Pay ${formatUsdCents(cartTotal)} with PayPal`}
          </Button>
          <div className="flex justify-end">
            <Button variant="subtle" onClick={closeCheckout} disabled={paying}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      <Toast message={toast} onDismiss={dismissToast} />
    </div>
  );
}

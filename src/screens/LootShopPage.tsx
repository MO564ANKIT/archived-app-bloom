import { useCallback, useState } from 'react';
import { Bookmark, CheckCircle2, Lock, ShieldCheck, ShoppingBag, Trash2 } from 'lucide-react';
import { Button } from '@/components/kit/Button';
import { Toast } from '@/components/kit/Toast';
import { EmptyState } from '@/components/kit/EmptyState';
import { SandboxBadge } from '@/components/checkout/SandboxBadge';
import { MonsterImage } from '@/components/monsters/MonsterImage';
import { PurchaseGuardian } from '@/components/shop/PurchaseGuardian';
import { ITEM_TYPE_LABEL, LOOT_BY_ID, LOOT_CATALOGUE, RARITY_CLASS, SHOP_ITEMS, type ItemType, type LootItem } from '@/lib/lootCatalogue';
import { formatUsdCents } from '@/lib/money';
import { useInventory } from '@/lib/ledger';
import { cn } from '@/lib/cn';
import { useGame } from '@/state/gameContext';

type TypeFilter = 'all' | ItemType;
const TYPE_FILTERS: TypeFilter[] = ['all', 'skin', 'accessory', 'effect', 'background', 'collection', 'seasonal'];
const EARN_ONLY = LOOT_CATALOGUE.filter((item) => item.earnOnly);

export function LootShopPage() {
  const { state, recordEvent, removeFromWishlist } = useGame();
  const inventory = useInventory();
  const [cart, setCart] = useState<string[]>([]);
  const [filter, setFilter] = useState<TypeFilter>('all');
  const [guardianOpen, setGuardianOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  const owned = new Set((inventory.data ?? []).map((entry) => entry.item_id));
  const cartItems = cart.map((id) => LOOT_BY_ID[id]).filter(Boolean);
  const cartTotal = cartItems.reduce((total, item) => total + item.priceUsdCents, 0);
  const visible = SHOP_ITEMS.filter((item) => filter === 'all' || item.type === filter);
  const wishlist = state.wishlist.map((id) => LOOT_BY_ID[id]).filter((item): item is LootItem => Boolean(item) && !item.earnOnly);

  const toggleItem = (id: string) => {
    setCart((current) => (current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]));
  };

  const abandonCart = () => {
    recordEvent('cart_abandoned');
    setCart([]);
    setToast('Cart abandoned on purpose. Your wallet says thank you.');
  };

  const savedForLater = () => {
    setGuardianOpen(false);
    setCart([]);
    setToast('Saved for later. Your wishlist is below whenever you are ready.');
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm font-medium text-amber-300">Monster Marketplace</p>
          <SandboxBadge />
        </div>
        <h1 className="text-3xl font-bold text-ink-50 sm:text-4xl">Dress up your monsters</h1>
        <p className="max-w-2xl text-sm text-ink-300">
          Cosmetic items only, priced in US dollars. Every checkout is checked by the AI Purchase Guardian first and runs in PayPal Sandbox, so no real money moves. Items unlock only after PayPal confirms the payment.
        </p>
      </header>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by item type">
        {TYPE_FILTERS.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setFilter(type)}
            aria-pressed={filter === type}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-bold transition',
              filter === type ? 'border-neon-400 bg-neon-500 text-night-950' : 'border-white/15 bg-white/5 text-ink-200 hover:border-white/30',
            )}
          >
            {type === 'all' ? 'All items' : ITEM_TYPE_LABEL[type]}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-3">
          {visible.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              owned={owned.has(item.id)}
              inCart={cart.includes(item.id)}
              onToggle={() => toggleItem(item.id)}
            />
          ))}
        </div>

        <aside className="space-y-6 lg:col-span-2 lg:sticky lg:top-40 lg:self-start">
          <section className="card flex flex-col p-6 sm:p-7">
            <h2 className="flex items-center gap-2 text-lg font-bold text-ink-50">
              <ShoppingBag className="h-5 w-5 text-amber-300" /> Your cart
            </h2>

            {cartItems.length === 0 ? (
              <EmptyState icon={<ShoppingBag className="h-6 w-6" />} title="Your cart is empty" description="Add an item to start a PayPal Sandbox checkout." />
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
                  <Button variant="primary" onClick={() => setGuardianOpen(true)}>
                    <ShieldCheck className="h-4 w-4" /> Check and pay
                  </Button>
                  <Button variant="danger" onClick={abandonCart}>
                    Abandon cart
                  </Button>
                </div>
              </div>
            )}
          </section>

          <section className="card p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold text-ink-50">
              <Bookmark className="h-5 w-5 text-volt-300" /> Saved for later
            </h2>
            {wishlist.length === 0 ? (
              <p className="mt-3 text-sm text-ink-300">Nothing saved yet. Choose “Save for later” in the Purchase Guardian to park an item here.</p>
            ) : (
              <ul className="mt-3 divide-y divide-white/10">
                {wishlist.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <span className="text-ink-100">{item.name}</span>
                    <span className="flex items-center gap-2">
                      {!owned.has(item.id) && !cart.includes(item.id) && (
                        <Button variant="ghost" size="sm" onClick={() => toggleItem(item.id)}>
                          Add to cart
                        </Button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeFromWishlist(item.id)}
                        aria-label={`Remove ${item.name} from saved items`}
                        className="rounded-lg p-1 text-ink-400 transition hover:bg-white/10 hover:text-rose-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-ink-50">Earned from savings</h2>
          <p className="text-sm text-ink-300">These can’t be bought. They unlock when a savings goal passes a verified milestone.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {EARN_ONLY.map((item) => (
            <ItemCard key={item.id} item={item} owned={owned.has(item.id)} />
          ))}
        </div>
      </section>

      <PurchaseGuardian open={guardianOpen} itemIds={cart} onClose={() => setGuardianOpen(false)} onSavedForLater={savedForLater} />
      <Toast message={toast} onDismiss={dismissToast} />
    </div>
  );
}

function ItemCard({ item, owned, inCart, onToggle }: { item: LootItem; owned: boolean; inCart?: boolean; onToggle?: () => void }) {
  const Icon = item.icon;
  return (
    <article className="card flex flex-col gap-4 p-5">
      <div className={cn('relative flex h-32 items-center justify-center overflow-hidden rounded-2xl ring-1', item.previewClass)}>
        <MonsterImage monsterId={item.previewMonster} stage={2} className="h-28 w-28" />
        <span className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl bg-night-950/70 text-amber-300">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider', RARITY_CLASS[item.rarity])}>{item.rarity}</span>
        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-ink-400">{ITEM_TYPE_LABEL[item.type]}</span>
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-ink-50">{item.name}</h3>
        <p className="mt-1 text-xs text-ink-300">{item.blurb}</p>
      </div>
      <div className="flex items-center justify-between gap-3">
        {item.earnOnly ? (
          <p className="text-sm font-semibold text-volt-300">Savings reward</p>
        ) : (
          <p className="font-display text-lg font-bold text-ink-50">{formatUsdCents(item.priceUsdCents)}</p>
        )}
        {owned ? (
          <span className="flex items-center gap-1 text-sm font-bold text-neon-300">
            <CheckCircle2 className="h-4 w-4" /> Owned
          </span>
        ) : item.earnOnly ? (
          <span className="flex items-center gap-1 text-sm text-ink-400">
            <Lock className="h-4 w-4" /> Locked
          </span>
        ) : (
          <Button variant={inCart ? 'ghost' : 'primary'} size="sm" onClick={onToggle}>
            {inCart ? 'Remove' : 'Add to cart'}
          </Button>
        )}
      </div>
    </article>
  );
}

-- Spendemon schema migrated from the original project.
-- User IDs are plain UUIDs (no FK to auth.users) per Lovable Cloud rules.

-- 1. player_saves: one game save per signed-in player, owner-only.
CREATE TABLE public.player_saves (
  user_id uuid PRIMARY KEY DEFAULT auth.uid(),
  state jsonb NOT NULL,
  version integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.player_saves TO authenticated;
GRANT ALL ON public.player_saves TO service_role;

ALTER TABLE public.player_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_player_save" ON public.player_saves FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_player_save" ON public.player_saves FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_player_save" ON public.player_saves FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_player_save" ON public.player_saves FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- 2. roast_requests: hourly AI roast counter, server-only.
CREATE TABLE public.roast_requests (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.roast_requests TO service_role;

ALTER TABLE public.roast_requests ENABLE ROW LEVEL SECURITY;

CREATE INDEX roast_requests_user_created_idx ON public.roast_requests (user_id, created_at);

-- 3. shop_orders: Loot Shop PayPal orders, server-only.
CREATE TABLE public.shop_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paypal_order_id text NOT NULL UNIQUE,
  user_id uuid,
  item_ids text[] NOT NULL,
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'created'
    CHECK (status IN ('created', 'capturing', 'cancelled', 'completed', 'failed')),
  paypal_capture_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.shop_orders TO service_role;

ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;

CREATE INDEX shop_orders_user_created_idx ON public.shop_orders (user_id, created_at);

-- 4. legacy_user_map: server-controlled mapping from the old app's user IDs
--    to new accounts, used when existing users are imported. Server-only.
CREATE TABLE public.legacy_user_map (
  original_user_id uuid PRIMARY KEY,
  email text NOT NULL,
  auth_user_id uuid UNIQUE,
  imported_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.legacy_user_map TO service_role;

ALTER TABLE public.legacy_user_map ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX legacy_user_map_email_idx ON public.legacy_user_map (lower(email));
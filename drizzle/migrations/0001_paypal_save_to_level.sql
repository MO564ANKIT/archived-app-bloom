-- Savings goals (Save-to-Level). Contributions are credited only by the server.
CREATE TABLE public.savings_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 60),
  target_cents integer NOT NULL CHECK (target_cents BETWEEN 100 AND 1000000),
  deadline date,
  contributed_cents integer NOT NULL DEFAULT 0 CHECK (contributed_cents >= 0),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, DELETE ON public.savings_goals TO authenticated;
GRANT INSERT (name, target_cents, deadline) ON public.savings_goals TO authenticated;
GRANT UPDATE (name, deadline) ON public.savings_goals TO authenticated;
GRANT ALL ON public.savings_goals TO service_role;

ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_goals" ON public.savings_goals FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_goals" ON public.savings_goals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_goals" ON public.savings_goals FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_unfunded_goals" ON public.savings_goals FOR DELETE TO authenticated USING (auth.uid() = user_id AND contributed_cents = 0);

CREATE INDEX savings_goals_user_idx ON public.savings_goals (user_id, created_at);

CREATE OR REPLACE FUNCTION public.validate_savings_goal()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.deadline IS NOT NULL AND NEW.deadline < current_date THEN
      RAISE EXCEPTION 'Deadline must be today or later';
    END IF;
    IF (SELECT count(*) FROM public.savings_goals WHERE user_id = NEW.user_id AND completed_at IS NULL) >= 10 THEN
      RAISE EXCEPTION 'You can have at most 10 active goals';
    END IF;
  END IF;
  NEW.name := btrim(NEW.name);
  RETURN NEW;
END;
$$;

CREATE TRIGGER savings_goals_validate BEFORE INSERT OR UPDATE ON public.savings_goals
  FOR EACH ROW EXECUTE FUNCTION public.validate_savings_goal();

-- Extend the PayPal order ledger for goal contributions and richer statuses.
ALTER TABLE public.shop_orders ADD COLUMN kind text NOT NULL DEFAULT 'shop' CHECK (kind IN ('shop', 'goal_contribution'));
ALTER TABLE public.shop_orders ADD COLUMN goal_id uuid REFERENCES public.savings_goals(id) ON DELETE SET NULL;
ALTER TABLE public.shop_orders ADD COLUMN captured_at timestamptz;
ALTER TABLE public.shop_orders ADD COLUMN failure_reason text;
ALTER TABLE public.shop_orders DROP CONSTRAINT IF EXISTS shop_orders_status_check;
ALTER TABLE public.shop_orders ADD CONSTRAINT shop_orders_status_check
  CHECK (status IN ('created', 'capturing', 'pending', 'cancelled', 'completed', 'failed', 'refunded'));
CREATE UNIQUE INDEX shop_orders_capture_id_key ON public.shop_orders (paypal_capture_id) WHERE paypal_capture_id IS NOT NULL;
CREATE INDEX shop_orders_goal_idx ON public.shop_orders (goal_id);

GRANT SELECT ON public.shop_orders TO authenticated;
CREATE POLICY "select_own_orders" ON public.shop_orders FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Items a player owns. Written only by the server after a verified capture.
CREATE TABLE public.user_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  item_id text NOT NULL,
  order_id text REFERENCES public.shop_orders(paypal_order_id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'purchase' CHECK (source IN ('purchase', 'milestone')),
  acquired_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_id)
);

GRANT SELECT ON public.user_inventory TO authenticated;
GRANT ALL ON public.user_inventory TO service_role;

ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_inventory" ON public.user_inventory FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Savings milestones reached (25/50/75/100%). Each is granted once per goal.
CREATE TABLE public.goal_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  goal_id uuid NOT NULL REFERENCES public.savings_goals(id) ON DELETE CASCADE,
  milestone integer NOT NULL CHECK (milestone IN (25, 50, 75, 100)),
  order_id text REFERENCES public.shop_orders(paypal_order_id) ON DELETE SET NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (goal_id, milestone)
);

GRANT SELECT ON public.goal_rewards TO authenticated;
GRANT ALL ON public.goal_rewards TO service_role;

ALTER TABLE public.goal_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_goal_rewards" ON public.goal_rewards FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX goal_rewards_user_idx ON public.goal_rewards (user_id, granted_at);

-- PayPal webhook events, stored once per event id for deduplication. Server-only.
CREATE TABLE public.paypal_webhook_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  resource_id text,
  outcome text,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

GRANT ALL ON public.paypal_webhook_events TO service_role;

ALTER TABLE public.paypal_webhook_events ENABLE ROW LEVEL SECURITY;

-- Atomically mark a verified order completed and grant what it pays for.
-- Only the first transition to 'completed' credits anything, so repeated
-- captures or duplicate webhooks cannot double-credit.
CREATE OR REPLACE FUNCTION public.credit_paypal_order(_order_id text, _capture_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  o public.shop_orders%ROWTYPE;
  g public.savings_goals%ROWTYPE;
  granted integer[] := '{}';
  m integer;
  reward_item text;
BEGIN
  UPDATE public.shop_orders
     SET status = 'completed', paypal_capture_id = _capture_id, captured_at = now(), updated_at = now(), failure_reason = NULL
   WHERE paypal_order_id = _order_id AND status IN ('created', 'capturing', 'pending')
  RETURNING * INTO o;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('credited', false);
  END IF;

  IF o.kind = 'shop' THEN
    INSERT INTO public.user_inventory (user_id, item_id, order_id, source)
    SELECT o.user_id, item, o.paypal_order_id, 'purchase' FROM unnest(o.item_ids) AS item
    ON CONFLICT (user_id, item_id) DO NOTHING;
  ELSIF o.kind = 'goal_contribution' AND o.goal_id IS NOT NULL THEN
    UPDATE public.savings_goals
       SET contributed_cents = contributed_cents + o.amount_cents,
           completed_at = CASE WHEN completed_at IS NULL AND contributed_cents + o.amount_cents >= target_cents THEN now() ELSE completed_at END
     WHERE id = o.goal_id AND user_id = o.user_id
    RETURNING * INTO g;

    IF FOUND THEN
      FOREACH m IN ARRAY ARRAY[25, 50, 75, 100] LOOP
        IF g.contributed_cents::bigint * 100 >= g.target_cents::bigint * m THEN
          INSERT INTO public.goal_rewards (user_id, goal_id, milestone, order_id)
          VALUES (o.user_id, g.id, m, o.paypal_order_id)
          ON CONFLICT (goal_id, milestone) DO NOTHING;
          IF FOUND THEN
            granted := granted || m;
            reward_item := CASE m WHEN 50 THEN 'reward-goal-medal' WHEN 75 THEN 'reward-rare-glow' WHEN 100 THEN 'reward-legendary-crest' ELSE NULL END;
            IF reward_item IS NOT NULL THEN
              INSERT INTO public.user_inventory (user_id, item_id, order_id, source)
              VALUES (o.user_id, reward_item, o.paypal_order_id, 'milestone')
              ON CONFLICT (user_id, item_id) DO NOTHING;
            END IF;
          END IF;
        END IF;
      END LOOP;
    END IF;
  END IF;

  RETURN jsonb_build_object('credited', true, 'kind', o.kind, 'milestones', to_jsonb(granted));
END;
$$;

REVOKE ALL ON FUNCTION public.credit_paypal_order(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.credit_paypal_order(text, text) TO service_role;
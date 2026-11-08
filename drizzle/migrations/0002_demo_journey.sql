-- Demo journey: clearly-flagged sample rows owned by the requesting player only.
ALTER TABLE public.savings_goals ADD COLUMN is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE public.shop_orders ADD COLUMN is_demo boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.reset_demo_journey(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.user_inventory
   WHERE user_id = _user_id
     AND order_id IN (SELECT paypal_order_id FROM public.shop_orders WHERE user_id = _user_id AND is_demo);
  DELETE FROM public.shop_orders WHERE user_id = _user_id AND is_demo;
  DELETE FROM public.savings_goals WHERE user_id = _user_id AND is_demo;
END;
$$;

CREATE OR REPLACE FUNCTION public.start_demo_journey(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  g_id uuid;
  o_id text;
  past timestamptz := now() - interval '2 days';
BEGIN
  PERFORM public.reset_demo_journey(_user_id);

  INSERT INTO public.savings_goals (user_id, name, target_cents, deadline, contributed_cents, is_demo, created_at)
  VALUES (_user_id, 'Demo: Wireless headphones', 5000, current_date + 30, 2000, true, past)
  RETURNING id INTO g_id;

  o_id := 'DEMO-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 16));
  INSERT INTO public.shop_orders
    (paypal_order_id, user_id, kind, goal_id, item_ids, amount_cents, currency, status,
     paypal_capture_id, captured_at, created_at, updated_at, is_demo)
  VALUES
    (o_id, _user_id, 'goal_contribution', g_id, '{}', 2000, 'USD', 'completed',
     'DEMOCAP-' || substr(o_id, 6), past, past, past, true);

  INSERT INTO public.goal_rewards (user_id, goal_id, milestone, order_id, granted_at)
  VALUES (_user_id, g_id, 25, o_id, past);

  RETURN jsonb_build_object('goalId', g_id, 'orderId', o_id);
END;
$$;

REVOKE ALL ON FUNCTION public.reset_demo_journey(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.start_demo_journey(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_demo_journey(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.start_demo_journey(uuid) TO service_role;

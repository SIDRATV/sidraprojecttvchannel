-- ============================================================
-- NOTIFICATIONS TRIGGERS — Auto-create notifications for events
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Trigger: Auto-notify on NEW VIDEO upload
CREATE OR REPLACE FUNCTION trigger_new_video_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Broadcast to all users with notifications enabled
  PERFORM broadcast_notification(
    'new_video',
    'Nouvelle vidéo disponible',
    'Découvrez: ' || NEW.title,
    'video',
    '/videos/' || NEW.id::TEXT
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_new_video ON videos;
CREATE TRIGGER trigger_new_video
  AFTER INSERT ON videos
  FOR EACH ROW
  EXECUTE FUNCTION trigger_new_video_notification();

-- ============================================================

-- 2. Trigger: Auto-notify on WALLET TRANSACTION
CREATE OR REPLACE FUNCTION trigger_transaction_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_sender_name TEXT;
  v_recipient_name TEXT;
  v_title TEXT;
  v_message TEXT;
  v_icon TEXT;
BEGIN
  -- Skip system/internal transfers without user context
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Determine notification based on transaction direction
  IF NEW.direction = 'in' THEN
    -- Incoming transaction (RECEPTION)
    v_icon := 'arrow-down-left';
    v_title := 'Vous avez reçu ' || NEW.amount::TEXT || ' SIDRA';
    v_message := 'Réception de ' || NEW.amount::TEXT || ' SIDRA';
    IF NEW.type = 'subscription' THEN
      v_message := 'Recharge d''abonnement reçue';
      v_icon := 'crown';
    END IF;

    PERFORM create_notification(
      NEW.user_id,
      'transaction',
      v_title,
      v_message,
      v_icon,
      '/wallet'
    );

  ELSIF NEW.direction = 'out' THEN
    -- Outgoing transaction (ENVOI/PAIEMENT)
    v_icon := 'arrow-up-right';
    v_title := 'Vous avez envoyé ' || NEW.amount::TEXT || ' SIDRA';
    v_message := 'Envoi de ' || NEW.amount::TEXT || ' SIDRA';
    
    IF NEW.type = 'subscription' THEN
      v_message := 'Abonnement premium: -' || NEW.amount::TEXT || ' SIDRA';
      v_icon := 'crown';
      v_title := 'Abonnement premium';
    ELSIF NEW.type = 'withdrawal' THEN
      v_message := 'Retrait: -' || NEW.amount::TEXT || ' SIDRA (frais: ' || COALESCE(NEW.fee, 0)::TEXT || ')';
      v_icon := 'send';
      v_title := 'Retrait effectué';
    END IF;

    PERFORM create_notification(
      NEW.user_id,
      'transaction',
      v_title,
      v_message,
      v_icon,
      '/wallet'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_transaction_notification ON wallet_transactions;
CREATE TRIGGER trigger_transaction_notification
  AFTER INSERT ON wallet_transactions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_transaction_notification();

-- ============================================================

-- 3. Trigger: Auto-notify on SUBSCRIPTION (already in premium_subscribe)
-- But we add a trigger on premium_subscriptions table for safety
CREATE OR REPLACE FUNCTION trigger_subscription_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_plan_name TEXT;
  v_duration_text TEXT;
  v_expires_text TEXT;
BEGIN
  -- Get plan info
  SELECT name INTO v_plan_name
  FROM premium_plans
  WHERE id = NEW.plan_id;

  v_duration_text := CASE NEW.duration
    WHEN 'monthly' THEN '1 mois'
    WHEN 'quarterly' THEN '3 mois'
    WHEN 'yearly' THEN '1 an'
    ELSE 'abonnement'
  END;

  v_expires_text := to_char(NEW.expires_at, 'DD/MM/YYYY');

  -- Create notification
  PERFORM create_notification(
    NEW.user_id,
    'subscription',
    'Abonnement ' || COALESCE(v_plan_name, NEW.plan_id) || ' activé',
    'Abonnement ' || v_duration_text || ' jusqu''au ' || v_expires_text || '. Montant: ' || NEW.amount_paid::TEXT || ' SIDRA',
    'crown',
    '/premium-dashboard'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_subscription_notification ON premium_subscriptions;
CREATE TRIGGER trigger_subscription_notification
  AFTER INSERT ON premium_subscriptions
  FOR EACH ROW
  WHEN (NEW.status = 'active')
  EXECUTE FUNCTION trigger_subscription_notification();

-- ============================================================

-- 4. Trigger: Auto-notify on SUBSCRIPTION EXPIRATION/RENEWAL
CREATE OR REPLACE FUNCTION trigger_subscription_expiring()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify if subscription expired
  IF NEW.status = 'expired' AND OLD.status != 'expired' THEN
    PERFORM create_notification(
      NEW.user_id,
      'subscription',
      'Votre abonnement a expiré',
      'Votre abonnement premium n''est plus actif. Renouvelez pour continuer à profiter des avantages.',
      'alert-circle',
      '/premium-dashboard'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_subscription_expiring ON premium_subscriptions;
CREATE TRIGGER trigger_subscription_expiring
  BEFORE UPDATE ON premium_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_subscription_expiring();

-- ============================================================

-- 5. Function: Manual trigger for withdrawal notifications
-- Can be called from backend when withdrawal status changes
CREATE OR REPLACE FUNCTION notify_withdrawal_status(
  p_withdrawal_id UUID,
  p_new_status TEXT
) RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_amount NUMERIC;
  v_address TEXT;
  v_title TEXT;
  v_message TEXT;
  v_icon TEXT;
BEGIN
  SELECT user_id, amount, to_address INTO v_user_id, v_amount, v_address
  FROM wallet_withdrawals
  WHERE id = p_withdrawal_id;

  CASE p_new_status
    WHEN 'pending' THEN
      v_title := 'Retrait en attente';
      v_message := 'Votre demande de retrait de ' || v_amount::TEXT || ' SIDRA est en cours de traitement.';
      v_icon := 'clock';

    WHEN 'approved' THEN
      v_title := 'Retrait approuvé';
      v_message := 'Votre retrait de ' || v_amount::TEXT || ' SIDRA a été approuvé vers ' || v_address || '.';
      v_icon := 'check-circle';

    WHEN 'processed' THEN
      v_title := 'Retrait effectué';
      v_message := 'Votre retrait de ' || v_amount::TEXT || ' SIDRA a été complété vers ' || v_address || '.';
      v_icon := 'send';

    WHEN 'failed' THEN
      v_title := 'Retrait échoué';
      v_message := 'Votre retrait de ' || v_amount::TEXT || ' SIDRA a échoué. Veuillez réessayer ou contacter le support.';
      v_icon := 'alert-triangle';

    WHEN 'rejected' THEN
      v_title := 'Retrait refusé';
      v_message := 'Votre retrait de ' || v_amount::TEXT || ' SIDRA a été refusé. Les fonds ont été remboursés.';
      v_icon := 'x-circle';

    ELSE
      RETURN;
  END CASE;

  PERFORM create_notification(
    v_user_id,
    'transaction',
    v_title,
    v_message,
    v_icon,
    '/wallet'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================

-- 6. Verify notification triggers are in place
SELECT 
  'Triggers Status' as check,
  COUNT(*) as count
FROM information_schema.triggers
WHERE trigger_name IN (
  'trigger_new_video',
  'trigger_transaction_notification',
  'trigger_subscription_notification',
  'trigger_subscription_expiring'
)
UNION ALL
SELECT 
  'Functions Status' as check,
  COUNT(*) as count
FROM pg_proc
WHERE proname IN (
  'trigger_new_video_notification',
  'trigger_transaction_notification',
  'trigger_subscription_notification',
  'trigger_subscription_expiring',
  'notify_withdrawal_status'
);

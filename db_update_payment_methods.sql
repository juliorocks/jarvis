-- ADD PAYMENT METHOD & CREDIT CARD INVOICE RPC

-- 1. Add payment_method column
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'money';

-- 2. Update RPC to include payment_method
DROP FUNCTION IF EXISTS get_family_transactions(uuid);

CREATE OR REPLACE FUNCTION get_family_transactions(target_family_id UUID)
RETURNS TABLE (
    id UUID,
    description TEXT,
    amount NUMERIC,
    type TEXT,
    date DATE,
    category_id UUID,
    wallet_id UUID,
    credit_card_id UUID,
    status TEXT,
    creator_id UUID,
    created_at TIMESTAMPTZ,
    payment_method TEXT, -- Added
    category_json JSONB,
    profile_json JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM family_members fm
        WHERE fm.family_id = target_family_id AND fm.user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Access Denied';
    END IF;

    RETURN QUERY
    SELECT 
        t.id,
        t.description,
        t.amount,
        t.type,
        t.date,
        t.category_id,
        t.wallet_id,
        t.credit_card_id,
        t.status,
        t.user_id AS creator_id,
        t.created_at,
        t.payment_method, -- Added
        jsonb_build_object('name', c.name, 'icon', c.icon, 'color', c.color) as category_json,
        jsonb_build_object(
            'full_name', COALESCE(p.full_name, au.raw_user_meta_data->>'full_name', au.email),
            'email', COALESCE(p.email, au.email)
        ) as profile_json
    FROM transactions t
    LEFT JOIN transaction_categories c ON t.category_id = c.id
    LEFT JOIN profiles p ON t.user_id = p.id
    LEFT JOIN auth.users au ON t.user_id = au.id
    WHERE t.family_id = target_family_id
    ORDER BY t.date DESC
    LIMIT 50;
END;
$$;

-- 3. Enhance Dashboard RPC to return Credit Card Usage
-- We calculate the "Current Invoice" by summing expenses for the current month
DROP FUNCTION IF EXISTS get_family_dashboard_data(uuid);

CREATE OR REPLACE FUNCTION get_family_dashboard_data(target_family_id UUID)
RETURNS TABLE (
    members_json JSONB,
    invites_json JSONB,
    cards_usage_json JSONB -- New: Returns cards with calculated invoice
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM family_members WHERE family_id = target_family_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Access Denied';
    END IF;

    RETURN QUERY
    SELECT 
        -- 1. Members
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'user_id', fm.user_id,
                    'role', fm.role,
                    'joined_at', fm.joined_at,
                    'profiles', jsonb_build_object(
                        'email', COALESCE(p.email, au.email),
                        'full_name', COALESCE(p.full_name, au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name')
                    )
                )
            )
            FROM family_members fm
            LEFT JOIN profiles p ON p.id = fm.user_id
            JOIN auth.users au ON au.id = fm.user_id
            WHERE fm.family_id = target_family_id
        ) as members_json,
        
        -- 2. Invites
        (SELECT jsonb_agg(t) FROM invitations t WHERE t.family_id = target_family_id) as invites_json,
        
        -- 3. Cards Usage (Current Month)
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', cc.id,
                    'name', cc.name,
                    'limit_amount', cc.limit_amount,
                    'current_invoice', COALESCE((
                        SELECT SUM(amount) 
                        FROM transactions t 
                        WHERE t.credit_card_id = cc.id 
                        AND t.type = 'expense'
                        -- Simple logic: Current month = Current Invoice
                        -- Using date_trunc to match month and year
                        AND date_trunc('month', t.date::date) = date_trunc('month', CURRENT_DATE)
                    ), 0)
                )
            )
            FROM credit_cards cc
            WHERE cc.family_id = target_family_id
        ) as cards_usage_json;
END;
$$;

-- 4. AUTOMATIC WALLET BALANCE UPDATE TRIGGER
-- Ensure wallets balance is always in sync with transactions
CREATE OR REPLACE FUNCTION update_wallet_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Handle DELETIONS (Reverse the effect)
    IF (TG_OP = 'DELETE') THEN
        IF OLD.wallet_id IS NOT NULL THEN
            IF OLD.type = 'income' THEN
                UPDATE wallets SET balance = balance - OLD.amount WHERE id = OLD.wallet_id;
            ELSIF OLD.type = 'expense' THEN
                UPDATE wallets SET balance = balance + OLD.amount WHERE id = OLD.wallet_id;
            END IF;
        END IF;
        RETURN OLD;
    
    -- Handle INSERTIONS
    ELSIF (TG_OP = 'INSERT') THEN
        IF NEW.wallet_id IS NOT NULL THEN
            IF NEW.type = 'income' THEN
                UPDATE wallets SET balance = balance + NEW.amount WHERE id = NEW.wallet_id;
            ELSIF NEW.type = 'expense' THEN
                UPDATE wallets SET balance = balance - NEW.amount WHERE id = NEW.wallet_id;
            END IF;
        END IF;
        RETURN NEW;

    -- Handle UPDATES (Reverse OLD, Apply NEW)
    ELSIF (TG_OP = 'UPDATE') THEN
        -- 1. Reverse OLD
        IF OLD.wallet_id IS NOT NULL THEN
            IF OLD.type = 'income' THEN
                UPDATE wallets SET balance = balance - OLD.amount WHERE id = OLD.wallet_id;
            ELSIF OLD.type = 'expense' THEN
                UPDATE wallets SET balance = balance + OLD.amount WHERE id = OLD.wallet_id;
            END IF;
        END IF;

        -- 2. Apply NEW
        IF NEW.wallet_id IS NOT NULL THEN
            IF NEW.type = 'income' THEN
                UPDATE wallets SET balance = balance + NEW.amount WHERE id = NEW.wallet_id;
            ELSIF NEW.type = 'expense' THEN
                UPDATE wallets SET balance = balance - NEW.amount WHERE id = NEW.wallet_id;
            END IF;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_wallet_balance ON transactions;

CREATE TRIGGER trg_update_wallet_balance
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_wallet_balance();

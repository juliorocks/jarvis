-- 1. Create Wallets Table
CREATE TABLE IF NOT EXISTS wallets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('checking', 'investment', 'cash')),
    balance DECIMAL(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Credit Cards Table
CREATE TABLE IF NOT EXISTS credit_cards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    name TEXT NOT NULL,
    limit_amount DECIMAL(12, 2) NOT NULL,
    closing_day INT NOT NULL,
    due_day INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Categories Table
CREATE TABLE IF NOT EXISTS transaction_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    icon TEXT,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    wallet_id UUID REFERENCES wallets(id),
    credit_card_id UUID REFERENCES credit_cards(id),
    category_id UUID REFERENCES transaction_categories(id),
    amount DECIMAL(12, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    description TEXT,
    date DATE NOT NULL,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (wallet_id IS NOT NULL OR credit_card_id IS NOT NULL)
);

-- 5. Enable RLS
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies (Drop first to avoid errors if re-running)
DROP POLICY IF EXISTS "Users can all wallets" ON wallets;
DROP POLICY IF EXISTS "Users can all credit_cards" ON credit_cards;
DROP POLICY IF EXISTS "Users can all categories" ON transaction_categories;
DROP POLICY IF EXISTS "Users can all transactions" ON transactions;

CREATE POLICY "Users can all wallets" ON wallets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can all credit_cards" ON credit_cards FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can all categories" ON transaction_categories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can all transactions" ON transactions FOR ALL USING (auth.uid() = user_id);

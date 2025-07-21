-- Life Budget Hub - Comprehensive Database Schema
-- This schema supports multi-profile budget tracking with all required features

-- Enable RLS (Row Level Security)
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS & PROFILES TABLE
-- Stores user authentication and profile information
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  login_id TEXT UNIQUE NOT NULL, -- e.g., 'tharanmurali901'
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. USER PROFILES TABLE
-- Each user can have multiple profiles (e.g., self, spouse, family members)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_name TEXT NOT NULL, -- e.g., 'Murali', 'Valar'
  display_name TEXT, -- Display name for the profile
  is_primary BOOLEAN DEFAULT FALSE, -- Whether this is the primary profile
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, profile_name)
);

-- 3. BUDGET PERIODS TABLE
-- Tracks different budget periods (month/year combinations)
CREATE TABLE budget_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  budget_year INTEGER NOT NULL,
  budget_month INTEGER NOT NULL CHECK (budget_month >= 1 AND budget_month <= 12),
  period_name TEXT, -- Optional custom name for the period
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, profile_id, budget_year, budget_month)
);

-- 4. BUDGET MODULES TABLE
-- Configurable budget modules (need, want, savings, investments, custom modules)
CREATE TABLE budget_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL, -- 'need', 'want', 'savings', 'investments', custom names
  display_name TEXT NOT NULL,
  is_system_module BOOLEAN DEFAULT FALSE, -- True for default modules (need, want, etc.)
  include_in_budget BOOLEAN DEFAULT TRUE, -- Whether to include in budget allocation
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, module_name)
);

-- 5. BUDGET CONFIGURATIONS TABLE
-- Stores complete budget configuration for each profile/period
CREATE TABLE budget_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  budget_period_id UUID NOT NULL REFERENCES budget_periods(id) ON DELETE CASCADE,
  monthly_salary DECIMAL(15,2) DEFAULT 0,
  budget_percentage DECIMAL(5,2) DEFAULT 100, -- Percentage of salary to budget
  total_budget_amount DECIMAL(15,2) DEFAULT 0, -- Calculated budget amount
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, profile_id, budget_period_id)
);

-- 6. BUDGET ALLOCATIONS TABLE
-- Stores allocation breakdown for each module per budget config
CREATE TABLE budget_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  budget_config_id UUID NOT NULL REFERENCES budget_configs(id) ON DELETE CASCADE,
  budget_module_id UUID NOT NULL REFERENCES budget_modules(id) ON DELETE CASCADE,
  allocation_percentage DECIMAL(5,2) DEFAULT 0,
  allocated_amount DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(budget_config_id, budget_module_id)
);

-- 7. INVESTMENT PORTFOLIOS TABLE
-- Stores investment portfolio configurations
CREATE TABLE investment_portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  budget_period_id UUID NOT NULL REFERENCES budget_periods(id) ON DELETE CASCADE,
  portfolio_name TEXT NOT NULL,
  allocation_type TEXT NOT NULL CHECK (allocation_type IN ('percentage', 'amount')),
  allocation_value DECIMAL(15,2) DEFAULT 0,
  allocated_amount DECIMAL(15,2) DEFAULT 0,
  invested_amount DECIMAL(15,2) DEFAULT 0,
  allow_direct_investment BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. INVESTMENT CATEGORIES TABLE
-- Nested categories within portfolios
CREATE TABLE investment_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID NOT NULL REFERENCES investment_portfolios(id) ON DELETE CASCADE,
  category_name TEXT NOT NULL,
  allocation_type TEXT NOT NULL CHECK (allocation_type IN ('percentage', 'amount')),
  allocation_value DECIMAL(15,2) DEFAULT 0,
  allocated_amount DECIMAL(15,2) DEFAULT 0,
  invested_amount DECIMAL(15,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. INVESTMENT FUNDS TABLE
-- Individual funds within categories
CREATE TABLE investment_funds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES investment_categories(id) ON DELETE CASCADE,
  fund_name TEXT NOT NULL,
  allocated_amount DECIMAL(15,2) DEFAULT 0,
  invested_amount DECIMAL(15,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. TRANSACTIONS TABLE
-- All expenses, income, refunds, investments, etc.
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  budget_period_id UUID NOT NULL REFERENCES budget_periods(id) ON DELETE CASCADE,
  budget_module_id UUID REFERENCES budget_modules(id), -- Which module this transaction belongs to
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('expense', 'income', 'refund', 'investment', 'savings', 'transfer')),
  category TEXT, -- Additional categorization within module
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  notes TEXT,
  transaction_date DATE NOT NULL,
  transaction_time TIME,
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'upi', 'netbanking', 'cheque', 'other')),
  reference_number TEXT, -- For tracking purposes
  tags TEXT[], -- Array of tags for better categorization
  -- Investment specific fields
  portfolio_id UUID REFERENCES investment_portfolios(id),
  category_id UUID REFERENCES investment_categories(id),
  fund_id UUID REFERENCES investment_funds(id),
  -- Refund specific fields
  original_transaction_id UUID REFERENCES transactions(id), -- For refunds
  refund_reason TEXT,
  -- Status and metadata
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'refunded', 'partial_refund')),
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- 11. BANK ACCOUNTS TABLE
-- Track multiple bank accounts
CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  account_name TEXT NOT NULL,
  account_number TEXT,
  bank_name TEXT,
  account_type TEXT CHECK (account_type IN ('savings', 'current', 'credit', 'investment')),
  is_primary BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. BANK BALANCES TABLE
-- Track opening/closing balances for each period
CREATE TABLE bank_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  budget_period_id UUID NOT NULL REFERENCES budget_periods(id) ON DELETE CASCADE,
  bank_account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
  opening_balance DECIMAL(15,2) DEFAULT 0,
  closing_balance DECIMAL(15,2) DEFAULT 0,
  total_income DECIMAL(15,2) DEFAULT 0,
  total_expenses DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id, budget_period_id, bank_account_id)
);

-- 13. TRANSACTION HISTORY TABLE
-- Audit trail for all changes to transactions
CREATE TABLE transaction_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'refunded')),
  old_values JSONB,
  new_values JSONB,
  changes_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- 14. CONFIGURATION INHERITANCE TABLE
-- Track which configurations were inherited from which periods
CREATE TABLE configuration_inheritances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  source_budget_period_id UUID NOT NULL REFERENCES budget_periods(id),
  target_budget_period_id UUID NOT NULL REFERENCES budget_periods(id),
  inherited_components TEXT[] NOT NULL, -- ['budget_config', 'investment_portfolios', 'allocations']
  inheritance_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INDEXES for better performance
CREATE INDEX idx_users_login_id ON users(login_id);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_budget_periods_user_profile ON budget_periods(user_id, profile_id);
CREATE INDEX idx_budget_configs_period ON budget_configs(budget_period_id);
CREATE INDEX idx_transactions_user_profile_period ON transactions(user_id, profile_id, budget_period_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_module ON transactions(budget_module_id);
CREATE INDEX idx_investment_portfolios_period ON investment_portfolios(budget_period_id);
CREATE INDEX idx_bank_balances_period ON bank_balances(budget_period_id);

-- TRIGGERS for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to all tables with updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budget_periods_updated_at BEFORE UPDATE ON budget_periods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budget_modules_updated_at BEFORE UPDATE ON budget_modules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budget_configs_updated_at BEFORE UPDATE ON budget_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budget_allocations_updated_at BEFORE UPDATE ON budget_allocations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_investment_portfolios_updated_at BEFORE UPDATE ON investment_portfolios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_investment_categories_updated_at BEFORE UPDATE ON investment_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_investment_funds_updated_at BEFORE UPDATE ON investment_funds FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON bank_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bank_balances_updated_at BEFORE UPDATE ON bank_balances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- INSERT DEFAULT BUDGET MODULES
-- These are the standard modules that every user gets
INSERT INTO budget_modules (user_id, module_name, display_name, is_system_module, include_in_budget, sort_order) 
SELECT 
  u.id,
  module.name,
  module.display,
  true,
  module.include_budget,
  module.sort_order
FROM users u
CROSS JOIN (
  VALUES 
    ('need', 'Need', true, 1),
    ('want', 'Want', true, 2),
    ('savings', 'Savings', true, 3),
    ('investments', 'Investments', true, 4),
    ('unplanned', 'Unplanned', false, 5)
) AS module(name, display, include_budget, sort_order);

-- FUNCTION to create default modules for new users
CREATE OR REPLACE FUNCTION create_default_modules_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO budget_modules (user_id, module_name, display_name, is_system_module, include_in_budget, sort_order) VALUES
    (NEW.id, 'need', 'Need', true, true, 1),
    (NEW.id, 'want', 'Want', true, true, 2),
    (NEW.id, 'savings', 'Savings', true, true, 3),
    (NEW.id, 'investments', 'Investments', true, true, 4),
    (NEW.id, 'unplanned', 'Unplanned', true, false, 5);
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to create default modules when a new user is created
CREATE TRIGGER create_default_modules_on_user_creation
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_modules_for_user();

-- RLS (Row Level Security) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuration_inheritances ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only access their own data
CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can view their own profiles" ON user_profiles FOR ALL USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can view their own budget periods" ON budget_periods FOR ALL USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can view their own budget modules" ON budget_modules FOR ALL USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can view their own budget configs" ON budget_configs FOR ALL USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can view their own budget allocations" ON budget_allocations FOR ALL USING (auth.uid()::text = (SELECT user_id::text FROM budget_configs WHERE id = budget_config_id));
CREATE POLICY "Users can view their own investment portfolios" ON investment_portfolios FOR ALL USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can view their own investment categories" ON investment_categories FOR ALL USING (auth.uid()::text = (SELECT user_id::text FROM investment_portfolios WHERE id = portfolio_id));
CREATE POLICY "Users can view their own investment funds" ON investment_funds FOR ALL USING (auth.uid()::text = (SELECT ip.user_id::text FROM investment_portfolios ip JOIN investment_categories ic ON ip.id = ic.portfolio_id WHERE ic.id = category_id));
CREATE POLICY "Users can view their own transactions" ON transactions FOR ALL USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can view their own bank accounts" ON bank_accounts FOR ALL USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can view their own bank balances" ON bank_balances FOR ALL USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can view their own transaction history" ON transaction_history FOR ALL USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can view their own configuration inheritances" ON configuration_inheritances FOR ALL USING (auth.uid()::text = user_id::text);

-- Comments for documentation
COMMENT ON TABLE users IS 'Main users table for authentication and basic user info';
COMMENT ON TABLE user_profiles IS 'Multiple profiles per user (e.g., self, spouse, family members)';
COMMENT ON TABLE budget_periods IS 'Different budget periods (month/year combinations) for each profile';
COMMENT ON TABLE budget_modules IS 'Configurable budget modules (need, want, savings, custom modules)';
COMMENT ON TABLE budget_configs IS 'Complete budget configuration for each profile/period';
COMMENT ON TABLE budget_allocations IS 'Allocation breakdown for each module per budget config';
COMMENT ON TABLE investment_portfolios IS 'Investment portfolio configurations with nested structure';
COMMENT ON TABLE transactions IS 'All financial transactions (expenses, income, refunds, investments)';
COMMENT ON TABLE bank_balances IS 'Track opening/closing balances and transaction summaries';
COMMENT ON TABLE transaction_history IS 'Audit trail for all transaction changes';
COMMENT ON TABLE configuration_inheritances IS 'Track configuration inheritance between periods';

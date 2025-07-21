-- Fix RLS policies for Life Budget Hub
-- This script addresses the "new row violates row-level security policy" error

-- First, ensure RLS is enabled on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can manage their own data" ON users;
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Users can insert their own data" ON users;

-- USERS table policies
-- Allow users to insert their own record during signup
CREATE POLICY "Users can insert own record" ON users
  FOR INSERT 
  WITH CHECK (auth.uid()::text = id::text);

-- Allow users to view their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT 
  USING (auth.uid()::text = id::text);

-- Allow users to update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE 
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

-- Drop existing user_profiles policies
DROP POLICY IF EXISTS "Users can view their own profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can manage own profiles" ON user_profiles;

-- USER_PROFILES table policies
CREATE POLICY "Users can manage own profiles" ON user_profiles
  FOR ALL 
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- Drop existing budget_configs policies
DROP POLICY IF EXISTS "Users can manage own budget config" ON budget_configs;
DROP POLICY IF EXISTS "Users can manage own budget configs" ON budget_configs;

-- BUDGET_CONFIGS table policies
CREATE POLICY "Users can manage own budget configs" ON budget_configs
  FOR ALL 
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- Drop existing investment_portfolios policies
DROP POLICY IF EXISTS "Users can manage own portfolios" ON investment_portfolios;

-- INVESTMENT_PORTFOLIOS table policies
CREATE POLICY "Users can manage own portfolios" ON investment_portfolios
  FOR ALL 
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- Drop existing transactions policies
DROP POLICY IF EXISTS "Users can manage own transactions" ON transactions;

-- TRANSACTIONS table policies
CREATE POLICY "Users can manage own transactions" ON transactions
  FOR ALL 
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- If you have other tables, add similar policies for them
-- Example for investment_categories (if exists)
DROP POLICY IF EXISTS "Users can manage own categories" ON investment_categories;
CREATE POLICY "Users can manage own categories" ON investment_categories
  FOR ALL 
  USING (auth.uid()::text = (SELECT user_id::text FROM investment_portfolios WHERE id = portfolio_id))
  WITH CHECK (auth.uid()::text = (SELECT user_id::text FROM investment_portfolios WHERE id = portfolio_id));

-- Example for investment_funds (if exists)
DROP POLICY IF EXISTS "Users can manage own funds" ON investment_funds;
CREATE POLICY "Users can manage own funds" ON investment_funds
  FOR ALL 
  USING (auth.uid()::text = (SELECT ip.user_id::text FROM investment_portfolios ip JOIN investment_categories ic ON ip.id = ic.portfolio_id WHERE ic.id = category_id))
  WITH CHECK (auth.uid()::text = (SELECT ip.user_id::text FROM investment_portfolios ip JOIN investment_categories ic ON ip.id = ic.portfolio_id WHERE ic.id = category_id));

-- Example for monthly_summaries (if exists)
DROP POLICY IF EXISTS "Users can manage own summaries" ON monthly_summaries;
CREATE POLICY "Users can manage own summaries" ON monthly_summaries
  FOR ALL 
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- Ensure proper grants for authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON users TO authenticated;
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON budget_configs TO authenticated;
GRANT ALL ON investment_portfolios TO authenticated;
GRANT ALL ON transactions TO authenticated;

-- Grant SELECT, INSERT, UPDATE, DELETE on all tables to authenticated users
-- (RLS policies will still control access)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Verify policies are working
-- You can run these queries to check the policies:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename IN ('users', 'user_profiles', 'budget_configs', 'investment_portfolios', 'transactions');

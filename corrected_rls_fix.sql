-- Corrected RLS fix that only handles existing tables
-- Run this in your Supabase SQL Editor

-- Enable RLS on existing tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Check if user_profiles table exists and enable RLS
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Check if budget_configs table exists and enable RLS
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'budget_configs') THEN
        ALTER TABLE budget_configs ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Check if investment_portfolios table exists and enable RLS
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'investment_portfolios') THEN
        ALTER TABLE investment_portfolios ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Check if transactions table exists and enable RLS
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'transactions') THEN
        ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Drop existing policies for users table (main fix for signup)
DROP POLICY IF EXISTS "Users can manage their own data" ON users;
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Users can insert their own data" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users own record" ON users;
DROP POLICY IF EXISTS "Enable select for users own data" ON users;
DROP POLICY IF EXISTS "Enable update for users own data" ON users;

-- USERS table policies (CRITICAL FIX)
CREATE POLICY "Users can insert own record" ON users
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Users can view own data" ON users
  FOR SELECT 
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE 
  TO authenticated
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

-- Only create policies for tables that exist
-- USER_PROFILES table (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        DROP POLICY IF EXISTS "Users can view their own profiles" ON user_profiles;
        DROP POLICY IF EXISTS "Users can manage own profiles" ON user_profiles;
        
        CREATE POLICY "Users can manage own profiles" ON user_profiles
          FOR ALL 
          TO authenticated
          USING (auth.uid()::text = user_id::text)
          WITH CHECK (auth.uid()::text = user_id::text);
    END IF;
END $$;

-- BUDGET_CONFIGS table (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'budget_configs') THEN
        DROP POLICY IF EXISTS "Users can manage own budget config" ON budget_configs;
        DROP POLICY IF EXISTS "Users can manage own budget configs" ON budget_configs;
        
        CREATE POLICY "Users can manage own budget configs" ON budget_configs
          FOR ALL 
          TO authenticated
          USING (auth.uid()::text = user_id::text)
          WITH CHECK (auth.uid()::text = user_id::text);
    END IF;
END $$;

-- INVESTMENT_PORTFOLIOS table (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'investment_portfolios') THEN
        DROP POLICY IF EXISTS "Users can manage own portfolios" ON investment_portfolios;
        
        CREATE POLICY "Users can manage own portfolios" ON investment_portfolios
          FOR ALL 
          TO authenticated
          USING (auth.uid()::text = user_id::text)
          WITH CHECK (auth.uid()::text = user_id::text);
    END IF;
END $$;

-- TRANSACTIONS table (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'transactions') THEN
        DROP POLICY IF EXISTS "Users can manage own transactions" ON transactions;
        
        CREATE POLICY "Users can manage own transactions" ON transactions
          FOR ALL 
          TO authenticated
          USING (auth.uid()::text = user_id::text)
          WITH CHECK (auth.uid()::text = user_id::text);
    END IF;
END $$;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON users TO authenticated;

-- Grant permissions only for existing tables
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        GRANT ALL ON user_profiles TO authenticated;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'budget_configs') THEN
        GRANT ALL ON budget_configs TO authenticated;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'investment_portfolios') THEN
        GRANT ALL ON investment_portfolios TO authenticated;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'transactions') THEN
        GRANT ALL ON transactions TO authenticated;
    END IF;
END $$;

-- Grant general permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

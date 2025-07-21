-- Supabase Database Cleanup Script
-- WARNING: This will permanently delete all data and tables!
-- Run this script in your Supabase SQL Editor to completely clean up the database

-- First, drop all foreign key constraints by dropping dependent tables first
DROP TABLE IF EXISTS transaction_history CASCADE;
DROP TABLE IF EXISTS investment_funds CASCADE;
DROP TABLE IF EXISTS investment_categories CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS investment_portfolios CASCADE;
DROP TABLE IF EXISTS budget_configs CASCADE;
DROP TABLE IF EXISTS budget_periods CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Also drop any indexes that might exist
DROP INDEX IF EXISTS idx_budget_configs_user_period;
DROP INDEX IF EXISTS idx_budget_periods_user_active;
DROP INDEX IF EXISTS idx_investment_portfolios_user_period;
DROP INDEX IF EXISTS idx_investment_categories_portfolio;
DROP INDEX IF EXISTS idx_investment_funds_category;
DROP INDEX IF EXISTS idx_transactions_user_period;
DROP INDEX IF EXISTS idx_transactions_date;
DROP INDEX IF EXISTS idx_transaction_history_transaction;

-- Drop any custom types that might have been created
DROP TYPE IF EXISTS transaction_type CASCADE;
DROP TYPE IF EXISTS transaction_category CASCADE;
DROP TYPE IF EXISTS transaction_status CASCADE;
DROP TYPE IF EXISTS payment_type CASCADE;
DROP TYPE IF EXISTS allocation_type CASCADE;
DROP TYPE IF EXISTS history_action_type CASCADE;

-- Drop any functions that might have been created
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop any triggers that might exist
DROP TRIGGER IF EXISTS trigger_updated_at ON profiles;
DROP TRIGGER IF EXISTS trigger_updated_at ON budget_configs;
DROP TRIGGER IF EXISTS trigger_updated_at ON budget_periods;
DROP TRIGGER IF EXISTS trigger_updated_at ON investment_portfolios;
DROP TRIGGER IF EXISTS trigger_updated_at ON investment_categories;
DROP TRIGGER IF EXISTS trigger_updated_at ON investment_funds;
DROP TRIGGER IF EXISTS trigger_updated_at ON transactions;

-- Drop any RLS policies (if any exist)
-- These will be automatically dropped when tables are dropped

-- Clear any storage buckets (if any exist)
-- Note: You may need to manually delete these in the Supabase dashboard
-- DELETE FROM storage.buckets WHERE id = 'avatars';
-- DELETE FROM storage.buckets WHERE id = 'documents';

-- Vacuum the database to reclaim space
VACUUM FULL;

-- Print completion message
SELECT 'Database cleanup completed successfully! All budget application tables, types, functions, and triggers have been removed.' as cleanup_status;

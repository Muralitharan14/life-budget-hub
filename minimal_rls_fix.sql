-- Minimal fix for user signup RLS policy violation
-- Run this in your Supabase SQL Editor

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might be causing conflicts
DROP POLICY IF EXISTS "Users can manage their own data" ON users;
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Users can insert their own data" ON users;

-- Create policies that allow user signup
CREATE POLICY "Enable insert for authenticated users own record" ON users
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Enable select for users own data" ON users
  FOR SELECT 
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Enable update for users own data" ON users
  FOR UPDATE 
  TO authenticated
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

-- Ensure authenticated users can access the table
GRANT ALL ON users TO authenticated;

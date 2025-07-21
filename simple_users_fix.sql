-- Ultra simple fix - just for the users table signup issue
-- This will resolve the "new row violates row-level security policy" error

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Remove any existing conflicting policies
DROP POLICY IF EXISTS "Users can manage their own data" ON users;
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Users can insert their own data" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users own record" ON users;
DROP POLICY IF EXISTS "Enable select for users own data" ON users;
DROP POLICY IF EXISTS "Enable update for users own data" ON users;

-- Create the correct policies for user signup
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

-- Ensure authenticated users have access
GRANT ALL ON users TO authenticated;

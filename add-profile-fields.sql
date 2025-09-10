-- Add new fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS country VARCHAR(50),
ADD COLUMN IF NOT EXISTS city VARCHAR(50),
ADD COLUMN IF NOT EXISTS gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_country ON profiles(country);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city);
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON profiles(gender);

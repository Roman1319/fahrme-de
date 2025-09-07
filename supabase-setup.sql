-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  handle TEXT UNIQUE,
  avatar_url TEXT,
  about TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
-- Users can view all profiles (public)
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can delete their own profile
CREATE POLICY "Users can delete own profile" ON profiles
  FOR DELETE USING (auth.uid() = id);

-- Create cars table
CREATE TABLE IF NOT EXISTS cars (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  name TEXT,
  color TEXT,
  is_main_vehicle BOOLEAN DEFAULT false,
  is_former BOOLEAN DEFAULT false,
  description TEXT,
  story TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for cars
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;

-- Create policies for cars
-- Everyone can view cars
CREATE POLICY "Cars are viewable by everyone" ON cars
  FOR SELECT USING (true);

-- Users can insert their own cars
CREATE POLICY "Users can insert own cars" ON cars
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Users can update their own cars
CREATE POLICY "Users can update own cars" ON cars
  FOR UPDATE USING (auth.uid() = owner_id);

-- Users can delete their own cars
CREATE POLICY "Users can delete own cars" ON cars
  FOR DELETE USING (auth.uid() = owner_id);

-- Create car_photos table
CREATE TABLE IF NOT EXISTS car_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  car_id UUID REFERENCES cars(id) ON DELETE CASCADE NOT NULL,
  storage_path TEXT NOT NULL,
  sort INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for car_photos
ALTER TABLE car_photos ENABLE ROW LEVEL SECURITY;

-- Create policies for car_photos
-- Everyone can view car photos
CREATE POLICY "Car photos are viewable by everyone" ON car_photos
  FOR SELECT USING (true);

-- Users can insert photos for their own cars
CREATE POLICY "Users can insert photos for own cars" ON car_photos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM cars 
      WHERE cars.id = car_photos.car_id 
      AND cars.owner_id = auth.uid()
    )
  );

-- Users can delete photos for their own cars
CREATE POLICY "Users can delete photos for own cars" ON car_photos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM cars 
      WHERE cars.id = car_photos.car_id 
      AND cars.owner_id = auth.uid()
    )
  );

-- Create logbook_entries table
CREATE TABLE IF NOT EXISTS logbook_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  car_id UUID REFERENCES cars(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  allow_comments BOOLEAN DEFAULT true,
  publish_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for logbook_entries
ALTER TABLE logbook_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for logbook_entries
-- Everyone can view logbook entries
CREATE POLICY "Logbook entries are viewable by everyone" ON logbook_entries
  FOR SELECT USING (true);

-- Users can insert entries for their own cars
CREATE POLICY "Users can insert entries for own cars" ON logbook_entries
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM cars 
      WHERE cars.id = logbook_entries.car_id 
      AND cars.owner_id = auth.uid()
    )
  );

-- Users can update their own entries
CREATE POLICY "Users can update own entries" ON logbook_entries
  FOR UPDATE USING (auth.uid() = author_id);

-- Users can delete their own entries
CREATE POLICY "Users can delete own entries" ON logbook_entries
  FOR DELETE USING (auth.uid() = author_id);

-- Create logbook_media table
CREATE TABLE IF NOT EXISTS logbook_media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id UUID REFERENCES logbook_entries(id) ON DELETE CASCADE NOT NULL,
  storage_path TEXT NOT NULL,
  sort INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for logbook_media
ALTER TABLE logbook_media ENABLE ROW LEVEL SECURITY;

-- Create policies for logbook_media
-- Everyone can view logbook media
CREATE POLICY "Logbook media is viewable by everyone" ON logbook_media
  FOR SELECT USING (true);

-- Users can insert media for their own entries
CREATE POLICY "Users can insert media for own entries" ON logbook_media
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM logbook_entries 
      WHERE logbook_entries.id = logbook_media.entry_id 
      AND logbook_entries.author_id = auth.uid()
    )
  );

-- Users can delete media for their own entries
CREATE POLICY "Users can delete media for own entries" ON logbook_media
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM logbook_entries 
      WHERE logbook_entries.id = logbook_media.entry_id 
      AND logbook_entries.author_id = auth.uid()
    )
  );

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id UUID REFERENCES logbook_entries(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Create policies for comments
-- Everyone can view comments
CREATE POLICY "Comments are viewable by everyone" ON comments
  FOR SELECT USING (true);

-- Authenticated users can insert comments
CREATE POLICY "Authenticated users can insert comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Users can update their own comments
CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE USING (auth.uid() = author_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE USING (auth.uid() = author_id);

-- Create post_likes table
CREATE TABLE IF NOT EXISTS post_likes (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  entry_id UUID REFERENCES logbook_entries(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, entry_id)
);

-- Enable RLS for post_likes
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

-- Create policies for post_likes
-- Everyone can view post likes
CREATE POLICY "Post likes are viewable by everyone" ON post_likes
  FOR SELECT USING (true);

-- Authenticated users can insert/delete their own likes
CREATE POLICY "Users can manage own post likes" ON post_likes
  FOR ALL USING (auth.uid() = user_id);

-- Create comment_likes table
CREATE TABLE IF NOT EXISTS comment_likes (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, comment_id)
);

-- Enable RLS for comment_likes
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- Create policies for comment_likes
-- Everyone can view comment likes
CREATE POLICY "Comment likes are viewable by everyone" ON comment_likes
  FOR SELECT USING (true);

-- Authenticated users can insert/delete their own likes
CREATE POLICY "Users can manage own comment likes" ON comment_likes
  FOR ALL USING (auth.uid() = user_id);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, handle)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'handle', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('avatars', 'avatars', true),
  ('car-photos', 'car-photos', true),
  ('logbook-media', 'logbook-media', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatars" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatars" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatars" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Car photos are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'car-photos');

CREATE POLICY "Users can upload car photos for their own cars" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'car-photos' 
    AND EXISTS (
      SELECT 1 FROM cars 
      WHERE cars.owner_id = auth.uid() 
      AND cars.id::text = (storage.foldername(name))[2]
    )
  );

CREATE POLICY "Users can delete car photos for their own cars" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'car-photos' 
    AND EXISTS (
      SELECT 1 FROM cars 
      WHERE cars.owner_id = auth.uid() 
      AND cars.id::text = (storage.foldername(name))[2]
    )
  );

CREATE POLICY "Logbook media is publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'logbook-media');

CREATE POLICY "Users can upload logbook media for their own entries" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'logbook-media' 
    AND EXISTS (
      SELECT 1 FROM logbook_entries 
      WHERE logbook_entries.author_id = auth.uid() 
      AND logbook_entries.id::text = (storage.foldername(name))[2]
    )
  );

CREATE POLICY "Users can delete logbook media for their own entries" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'logbook-media' 
    AND EXISTS (
      SELECT 1 FROM logbook_entries 
      WHERE logbook_entries.author_id = auth.uid() 
      AND logbook_entries.id::text = (storage.foldername(name))[2]
    )
  );

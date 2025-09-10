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
  car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
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

-- Authenticated users can insert logbook entries
CREATE POLICY "Authenticated users can insert logbook entries" ON logbook_entries
  FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Users can update their own entries
CREATE POLICY "Users can update own logbook entries" ON logbook_entries
  FOR UPDATE USING (auth.uid() = author_id);

-- Users can delete their own entries
CREATE POLICY "Users can delete own logbook entries" ON logbook_entries
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
  ('logbook', 'logbook', true)
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
      AND cars.id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Users can delete car photos for their own cars" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'car-photos' 
    AND EXISTS (
      SELECT 1 FROM cars 
      WHERE cars.owner_id = auth.uid() 
      AND cars.id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Logbook media is publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'logbook');

CREATE POLICY "Users can upload logbook media for their own entries" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'logbook' 
    AND EXISTS (
      SELECT 1 FROM logbook_entries 
      WHERE logbook_entries.author_id = auth.uid() 
      AND logbook_entries.id::text = (storage.foldername(name))[2]
    )
  );

CREATE POLICY "Users can delete logbook media for their own entries" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'logbook' 
    AND EXISTS (
      SELECT 1 FROM logbook_entries 
      WHERE logbook_entries.author_id = auth.uid()
      AND logbook_entries.id::text = (storage.foldername(name))[2]
    )
  );

-- [RPC] feed_explore / feed_personal / get_table_stats

-- Feed explore function - returns public logbook entries
CREATE OR REPLACE FUNCTION feed_explore(p_limit int default 20, p_offset int default 0)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  author_handle text,
  author_avatar_url text,
  car_brand text,
  car_model text,
  car_year int,
  car_name text,
  media_preview text,
  likes_count bigint,
  comments_count bigint,
  publish_date timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    le.id,
    le.title,
    le.content,
    p.handle as author_handle,
    p.avatar_url as author_avatar_url,
    c.brand as car_brand,
    c.model as car_model,
    c.year as car_year,
    c.name as car_name,
    lm.storage_path as media_preview,
    COALESCE(pl.likes_count, 0) as likes_count,
    COALESCE(cc.comments_count, 0) as comments_count,
    le.publish_date
  FROM logbook_entries le
  LEFT JOIN profiles p ON le.author_id = p.id
  LEFT JOIN cars c ON le.car_id = c.id
  LEFT JOIN LATERAL (
    SELECT storage_path 
    FROM logbook_media 
    WHERE entry_id = le.id 
    ORDER BY sort ASC, created_at ASC 
    LIMIT 1
  ) lm ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*) as likes_count
    FROM post_likes 
    WHERE entry_id = le.id
  ) pl ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*) as comments_count
    FROM comments 
    WHERE entry_id = le.id
  ) cc ON true
  ORDER BY le.publish_date DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Feed personal function - returns logbook entries for authenticated user
CREATE OR REPLACE FUNCTION feed_personal(p_limit int default 20, p_offset int default 0)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  author_handle text,
  author_avatar_url text,
  car_brand text,
  car_model text,
  car_year int,
  car_name text,
  media_preview text,
  likes_count bigint,
  comments_count bigint,
  liked_by_me boolean,
  publish_date timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    le.id,
    le.title,
    le.content,
    p.handle as author_handle,
    p.avatar_url as author_avatar_url,
    c.brand as car_brand,
    c.model as car_model,
    c.year as car_year,
    c.name as car_name,
    lm.storage_path as media_preview,
    COALESCE(pl.likes_count, 0) as likes_count,
    COALESCE(cc.comments_count, 0) as comments_count,
    COALESCE(ul.liked_by_me, false) as liked_by_me,
    le.publish_date
  FROM logbook_entries le
  LEFT JOIN profiles p ON le.author_id = p.id
  LEFT JOIN cars c ON le.car_id = c.id
  LEFT JOIN LATERAL (
    SELECT storage_path 
    FROM logbook_media 
    WHERE entry_id = le.id 
    ORDER BY sort ASC, created_at ASC 
    LIMIT 1
  ) lm ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*) as likes_count
    FROM post_likes 
    WHERE entry_id = le.id
  ) pl ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*) as comments_count
    FROM comments 
    WHERE entry_id = le.id
  ) cc ON true
  LEFT JOIN LATERAL (
    SELECT EXISTS(
      SELECT 1 FROM post_likes 
      WHERE entry_id = le.id AND user_id = auth.uid()
    ) as liked_by_me
  ) ul ON true
  ORDER BY le.publish_date DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Get table statistics function
CREATE OR REPLACE FUNCTION get_table_stats()
RETURNS TABLE (
  table_name text,
  row_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.table_name::text,
    COALESCE(s.n_tup_ins + s.n_tup_upd + s.n_tup_del, 0) as row_count
  FROM information_schema.tables t
  LEFT JOIN pg_stat_user_tables s ON s.relname = t.table_name
  WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  ORDER BY t.table_name;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION feed_explore(int, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION feed_personal(int, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_table_stats() TO anon, authenticated;

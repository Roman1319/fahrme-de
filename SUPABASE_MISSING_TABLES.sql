-- Дополнительные таблицы для полной миграции на Supabase

-- 1. Таблица для отслеживания подписок на автомобили
CREATE TABLE IF NOT EXISTS follows_cars (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  car_id UUID REFERENCES cars(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, car_id)
);

-- Включить RLS для follows_cars
ALTER TABLE follows_cars ENABLE ROW LEVEL SECURITY;

-- Политики для follows_cars
CREATE POLICY "Follows are viewable by everyone" ON follows_cars
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own follows" ON follows_cars
  FOR ALL USING (auth.uid() = user_id);

-- 2. Таблица для медиа логбука (если еще нет)
CREATE TABLE IF NOT EXISTS logbook_media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id UUID REFERENCES logbook_entries(id) ON DELETE CASCADE NOT NULL,
  storage_path TEXT NOT NULL,
  sort INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Включить RLS для logbook_media
ALTER TABLE logbook_media ENABLE ROW LEVEL SECURITY;

-- Политики для logbook_media
CREATE POLICY "Logbook media is viewable by everyone" ON logbook_media
  FOR SELECT USING (true);

CREATE POLICY "Users can manage media for own entries" ON logbook_media
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM logbook_entries 
      WHERE logbook_entries.id = logbook_media.entry_id 
      AND logbook_entries.author_id = auth.uid()
    )
  );

-- 3. Добавить недостающие поля в logbook_entries
ALTER TABLE logbook_entries 
ADD COLUMN IF NOT EXISTS topic TEXT,
ADD COLUMN IF NOT EXISTS mileage INTEGER,
ADD COLUMN IF NOT EXISTS mileage_unit TEXT,
ADD COLUMN IF NOT EXISTS cost NUMERIC,
ADD COLUMN IF NOT EXISTS currency TEXT,
ADD COLUMN IF NOT EXISTS pin_to_car BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'de';

-- 4. Добавить недостающие поля в profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- 5. Создать индексы для производительности
CREATE INDEX IF NOT EXISTS idx_cars_owner_id ON cars(owner_id);
CREATE INDEX IF NOT EXISTS idx_cars_brand_model ON cars(brand, model);
CREATE INDEX IF NOT EXISTS idx_car_photos_car_id ON car_photos(car_id);
CREATE INDEX IF NOT EXISTS idx_logbook_entries_car_id ON logbook_entries(car_id);
CREATE INDEX IF NOT EXISTS idx_logbook_entries_author_id ON logbook_entries(author_id);
CREATE INDEX IF NOT EXISTS idx_logbook_entries_publish_date ON logbook_entries(publish_date);
CREATE INDEX IF NOT EXISTS idx_comments_entry_id ON comments(entry_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_entry_id ON post_likes(entry_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_cars_user_id ON follows_cars(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_cars_car_id ON follows_cars(car_id);
CREATE INDEX IF NOT EXISTS idx_logbook_media_entry_id ON logbook_media(entry_id);

-- 6. Обновить политики для logbook_entries (добавить недостающие)
CREATE POLICY IF NOT EXISTS "Users can insert own logbook entries" ON logbook_entries
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY IF NOT EXISTS "Users can update own logbook entries" ON logbook_entries
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY IF NOT EXISTS "Users can delete own logbook entries" ON logbook_entries
  FOR DELETE USING (auth.uid() = author_id);

-- 7. Обновить политики для comments (добавить недостающие)
CREATE POLICY IF NOT EXISTS "Users can insert own comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY IF NOT EXISTS "Users can update own comments" ON comments
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY IF NOT EXISTS "Users can delete own comments" ON comments
  FOR DELETE USING (auth.uid() = author_id);

-- 8. Обновить политики для post_likes (добавить недостающие)
CREATE POLICY IF NOT EXISTS "Users can manage own post likes" ON post_likes
  FOR ALL USING (auth.uid() = user_id);

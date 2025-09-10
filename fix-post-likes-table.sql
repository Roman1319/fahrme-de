-- Исправление таблицы post_likes и RLS политик
-- Выполнить этот скрипт в Supabase SQL Editor

-- 1. Проверим существование таблицы post_likes
-- Если таблица не существует, создадим её
CREATE TABLE IF NOT EXISTS post_likes (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  entry_id UUID REFERENCES logbook_entries(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, entry_id)
);

-- 2. Включить RLS для post_likes
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

-- 3. Удалить существующие политики (если есть)
DROP POLICY IF EXISTS "Post likes are viewable by everyone" ON post_likes;
DROP POLICY IF EXISTS "Users can manage own post likes" ON post_likes;

-- 4. Создать правильные политики для post_likes
-- Все могут просматривать лайки
CREATE POLICY "Post likes are viewable by everyone" ON post_likes
  FOR SELECT USING (true);

-- Аутентифицированные пользователи могут добавлять/удалять свои лайки
CREATE POLICY "Users can manage own post likes" ON post_likes
  FOR ALL USING (auth.uid() = user_id);

-- 5. Создать индексы для производительности
CREATE INDEX IF NOT EXISTS idx_post_likes_entry_id ON post_likes(entry_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);

-- 6. Проверим, что таблица comment_likes тоже существует
CREATE TABLE IF NOT EXISTS comment_likes (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, comment_id)
);

-- 7. Включить RLS для comment_likes
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- 8. Удалить существующие политики для comment_likes
DROP POLICY IF EXISTS "Comment likes are viewable by everyone" ON comment_likes;
DROP POLICY IF EXISTS "Users can manage own comment likes" ON comment_likes;

-- 9. Создать правильные политики для comment_likes
CREATE POLICY "Comment likes are viewable by everyone" ON comment_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own comment likes" ON comment_likes
  FOR ALL USING (auth.uid() = user_id);

-- 10. Создать индексы для comment_likes
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);

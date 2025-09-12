-- Создание таблицы follows_cars для подписок на машины
CREATE TABLE IF NOT EXISTS follows_cars (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  car_id UUID REFERENCES cars(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, car_id)
);

-- Включить RLS для follows_cars
ALTER TABLE follows_cars ENABLE ROW LEVEL SECURITY;

-- Политики для follows_cars
-- Все могут видеть подписки (для подсчета подписчиков)
CREATE POLICY "Follows cars are viewable by everyone" ON follows_cars
  FOR SELECT USING (true);

-- Пользователи могут управлять только своими подписками
CREATE POLICY "Users can manage own follows" ON follows_cars
  FOR ALL USING (auth.uid() = user_id);

-- Создать индексы для производительности
CREATE INDEX IF NOT EXISTS idx_follows_cars_user_id ON follows_cars(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_cars_car_id ON follows_cars(car_id);

-- Обновить функцию feed_personal для учета подписок
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
  WHERE (
    -- Показывать записи от машин, на которые подписан пользователь
    EXISTS (
      SELECT 1 FROM follows_cars fc 
      WHERE fc.car_id = le.car_id AND fc.user_id = auth.uid()
    )
    -- Или записи от собственных машин
    OR le.author_id = auth.uid()
  )
  ORDER BY le.publish_date DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Создать функцию для получения количества подписчиков машины
CREATE OR REPLACE FUNCTION get_car_followers_count(p_car_id uuid)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) 
    FROM follows_cars 
    WHERE car_id = p_car_id
  );
END;
$$;

-- Создать функцию для проверки подписки пользователя на машину
CREATE OR REPLACE FUNCTION is_user_following_car(p_user_id uuid, p_car_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM follows_cars 
    WHERE user_id = p_user_id AND car_id = p_car_id
  );
END;
$$;

-- Предоставить права на выполнение функций
GRANT EXECUTE ON FUNCTION get_car_followers_count(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION is_user_following_car(uuid, uuid) TO anon, authenticated;

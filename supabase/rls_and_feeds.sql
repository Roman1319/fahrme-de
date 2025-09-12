-- =============================================================
-- Fahrme — прод-настройка RLS + GRANT + RPC feeds (без заглушек)
-- =============================================================

-- 0) Библиотека для UUID (обычно уже есть)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1) Очистка конфликтных политик на ключевых таблицах
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname='public'
      AND tablename IN (
        'profiles','cars','car_photos',
        'logbook_entries','logbook_media',
        'comments','post_likes','comment_likes',
        'follows_cars','brands','car_models'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END$$;

-- 2) Гарантируем необходимые колонки/индексы
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS handle text;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_handle_key ON public.profiles(handle);

-- 3) Включаем RLS
ALTER TABLE public.brands           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_models       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cars             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_photos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logbook_entries  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logbook_media    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows_cars     ENABLE ROW LEVEL SECURITY;

-- 4) Базовые GRANT, иначе 42501 даже при корректной RLS
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON
  public.brands, public.car_models,
  public.profiles, public.cars, public.car_photos,
  public.logbook_entries, public.logbook_media,
  public.comments, public.post_likes, public.comment_likes,
  public.follows_cars
TO anon, authenticated;

GRANT INSERT, UPDATE, DELETE ON
  public.profiles, public.cars, public.car_photos,
  public.logbook_entries, public.logbook_media,
  public.comments, public.post_likes, public.comment_likes,
  public.follows_cars
TO authenticated;

-- 5) Политики RLS — публичный просмотр, изменение только владельцам/авторам

-- profiles
CREATE POLICY profiles_public_read ON public.profiles
  FOR SELECT USING (true);
CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY profiles_delete_own ON public.profiles
  FOR DELETE USING (id = auth.uid());

-- cars
CREATE POLICY cars_public_read ON public.cars
  FOR SELECT USING (true);
CREATE POLICY cars_insert_owner ON public.cars
  FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY cars_update_owner ON public.cars
  FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY cars_delete_owner ON public.cars
  FOR DELETE USING (owner_id = auth.uid());

-- car_photos (видят все; управляет владелец машины)
CREATE POLICY car_photos_public_read ON public.car_photos
  FOR SELECT USING (true);
CREATE POLICY car_photos_owner_all ON public.car_photos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.cars c
            WHERE c.id = car_photos.car_id
              AND c.owner_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.cars c
            WHERE c.id = car_photos.car_id
              AND c.owner_id = auth.uid())
  );

-- logbook_entries (видят все; управляет автор)
CREATE POLICY entries_public_read ON public.logbook_entries
  FOR SELECT USING (true);
CREATE POLICY entries_insert_author ON public.logbook_entries
  FOR INSERT TO authenticated WITH CHECK (
    author_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.cars c
            WHERE c.id = logbook_entries.car_id
              AND c.owner_id = auth.uid())
  );
CREATE POLICY entries_update_author ON public.logbook_entries
  FOR UPDATE TO authenticated USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());
CREATE POLICY entries_delete_author ON public.logbook_entries
  FOR DELETE TO authenticated USING (author_id = auth.uid());

-- logbook_media (видят все; управляет автор записи)
CREATE POLICY media_public_read ON public.logbook_media
  FOR SELECT USING (true);
CREATE POLICY media_author_all ON public.logbook_media
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.logbook_entries e
            WHERE e.id = logbook_media.entry_id
              AND e.author_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.logbook_entries e
            WHERE e.id = logbook_media.entry_id
              AND e.author_id = auth.uid())
  );

-- comments (видят все; управляет автор)
CREATE POLICY comments_public_read ON public.comments
  FOR SELECT USING (true);
CREATE POLICY comments_insert_author ON public.comments
  FOR INSERT WITH CHECK (author_id = auth.uid());
CREATE POLICY comments_update_author ON public.comments
  FOR UPDATE USING (author_id = auth.uid());
CREATE POLICY comments_delete_author ON public.comments
  FOR DELETE USING (author_id = auth.uid());

-- post_likes / comment_likes (видят все; управляет владелец лайка)
CREATE POLICY post_likes_public_read ON public.post_likes
  FOR SELECT USING (true);
CREATE POLICY post_likes_owner_all ON public.post_likes
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY comment_likes_public_read ON public.comment_likes
  FOR SELECT USING (true);
CREATE POLICY comment_likes_owner_all ON public.comment_likes
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- follows_cars (видят все; управляет владелец подписки)
CREATE POLICY follows_public_read ON public.follows_cars
  FOR SELECT USING (true);
CREATE POLICY follows_owner_all ON public.follows_cars
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 6) RPC: feed_explore / feed_personal — SECURITY INVOKER + search_path

DROP FUNCTION IF EXISTS public.feed_explore(int,int);
DROP FUNCTION IF EXISTS public.feed_personal(int,int);

CREATE OR REPLACE FUNCTION public.feed_explore(p_limit int DEFAULT 20, p_offset int DEFAULT 0)
RETURNS TABLE (
  entry_id uuid,
  title text,
  content text,
  publish_date timestamptz,
  author_id uuid,
  author_handle text,
  author_avatar_url text,
  car_id uuid,
  car_brand text,
  car_model text,
  car_year int,
  car_name text,
  media_preview text,
  likes_count int,
  comments_count int
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH src AS (
    SELECT e.*
    FROM public.logbook_entries e
    ORDER BY e.publish_date DESC
    LIMIT COALESCE(p_limit,20) OFFSET COALESCE(p_offset,0)
  ),
  m1 AS (
    SELECT lm.entry_id, MIN(lm.storage_path) AS media_preview
    FROM public.logbook_media lm JOIN src s ON s.id = lm.entry_id
    GROUP BY lm.entry_id
  ),
  lc AS (
    SELECT pl.entry_id, COUNT(*)::int AS likes_count
    FROM public.post_likes pl JOIN src s ON s.id = pl.entry_id
    GROUP BY pl.entry_id
  ),
  cc AS (
    SELECT c.entry_id, COUNT(*)::int AS comments_count
    FROM public.comments c JOIN src s ON s.id = c.entry_id
    GROUP BY c.entry_id
  )
  SELECT
    s.id AS entry_id,
    s.title, s.content, s.publish_date,
    p.id AS author_id,
    COALESCE(p.handle, p.display_name, p.name) AS author_handle,
    p.avatar_url AS author_avatar_url,
    c.id AS car_id, c.brand AS car_brand, c.model AS car_model, c.year AS car_year, c.name AS car_name,
    m1.media_preview,
    COALESCE(lc.likes_count,0) AS likes_count,
    COALESCE(cc.comments_count,0) AS comments_count
  FROM src s
  LEFT JOIN public.profiles p ON p.id = s.author_id
  LEFT JOIN public.cars c ON c.id = s.car_id
  LEFT JOIN m1 ON m1.entry_id = s.id
  LEFT JOIN lc ON lc.entry_id = s.id
  LEFT JOIN cc ON cc.entry_id = s.id;
$$;

CREATE OR REPLACE FUNCTION public.feed_personal(p_limit int DEFAULT 20, p_offset int DEFAULT 0)
RETURNS TABLE (
  entry_id uuid,
  title text,
  content text,
  publish_date timestamptz,
  author_id uuid,
  author_handle text,
  author_avatar_url text,
  car_id uuid,
  car_brand text,
  car_model text,
  car_year int,
  car_name text,
  media_preview text,
  likes_count int,
  comments_count int,
  liked_by_me boolean
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH me AS (SELECT auth.uid() AS uid),
  src AS (
    SELECT e.*
    FROM public.logbook_entries e, me
    WHERE e.author_id = me.uid
       OR e.car_id IN (SELECT fc.car_id FROM public.follows_cars fc WHERE fc.user_id = me.uid)
    ORDER BY e.publish_date DESC
    LIMIT COALESCE(p_limit,20) OFFSET COALESCE(p_offset,0)
  ),
  m1 AS (
    SELECT lm.entry_id, MIN(lm.storage_path) AS media_preview
    FROM public.logbook_media lm JOIN src s ON s.id = lm.entry_id
    GROUP BY lm.entry_id
  ),
  lc AS (
    SELECT pl.entry_id, COUNT(*)::int AS likes_count
    FROM public.post_likes pl JOIN src s ON s.id = pl.entry_id
    GROUP BY pl.entry_id
  ),
  cc AS (
    SELECT c.entry_id, COUNT(*)::int AS comments_count
    FROM public.comments c JOIN src s ON s.id = c.entry_id
    GROUP BY c.entry_id
  ),
  lbm AS (
    SELECT s.id AS entry_id, EXISTS(
      SELECT 1 FROM public.post_likes pl, me
      WHERE pl.entry_id = s.id AND pl.user_id = me.uid
    ) AS liked_by_me
    FROM src s
  )
  SELECT
    s.id AS entry_id,
    s.title, s.content, s.publish_date,
    p.id AS author_id,
    COALESCE(p.handle, p.display_name, p.name) AS author_handle,
    p.avatar_url AS author_avatar_url,
    c.id AS car_id, c.brand AS car_brand, c.model AS car_model, c.year AS car_year, c.name AS car_name,
    m1.media_preview,
    COALESCE(lc.likes_count,0) AS likes_count,
    COALESCE(cc.comments_count,0) AS comments_count,
    lbm.liked_by_me
  FROM src s
  LEFT JOIN public.profiles p ON p.id = s.author_id
  LEFT JOIN public.cars c ON c.id = s.car_id
  LEFT JOIN m1 ON m1.entry_id = s.id
  LEFT JOIN lc ON lc.entry_id = s.id
  LEFT JOIN cc ON cc.entry_id = s.id
  LEFT JOIN lbm ON lbm.entry_id = s.id;
$$;

GRANT EXECUTE ON FUNCTION public.feed_explore(int,int)  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.feed_personal(int,int) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.feed_personal(int,int) FROM anon;

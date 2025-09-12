-- Создание таблицы notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'system')),
  title text NOT NULL,
  body text,
  href text,
  created_at timestamptz NOT NULL DEFAULT now(),
  read boolean NOT NULL DEFAULT false
);

-- Создание индексов для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
  ON public.notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
  ON public.notifications(user_id, read);

-- Включение RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Политики RLS
-- Пользователи могут видеть только свои уведомления
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Пользователи могут создавать уведомления только для себя
CREATE POLICY "Users can insert own notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Пользователи могут обновлять только свои уведомления
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Пользователи могут удалять только свои уведомления
CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Включение Realtime для таблицы notifications
-- Это нужно сделать в Supabase Dashboard: Database → Replication → Publications
-- Добавить таблицу 'notifications' в supabase_realtime

-- Функция для создания системных уведомлений (опционально)
CREATE OR REPLACE FUNCTION public.create_system_notification(
  target_user_id uuid,
  notification_title text,
  notification_body text DEFAULT NULL,
  notification_href text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    body,
    href
  ) VALUES (
    target_user_id,
    'system',
    notification_title,
    notification_body,
    notification_href
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Функция для создания уведомления о лайке (опционально)
CREATE OR REPLACE FUNCTION public.create_like_notification(
  target_user_id uuid,
  post_id uuid,
  liker_name text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    body,
    href
  ) VALUES (
    target_user_id,
    'like',
    liker_name || ' gefällt dein Beitrag',
    'Jemand hat deinen Logbucheintrag geliked',
    '/post/' || post_id
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Функция для создания уведомления о комментарии (опционально)
CREATE OR REPLACE FUNCTION public.create_comment_notification(
  target_user_id uuid,
  post_id uuid,
  commenter_name text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    body,
    href
  ) VALUES (
    target_user_id,
    'comment',
    commenter_name || ' hat kommentiert',
    'Jemand hat deinen Logbucheintrag kommentiert',
    '/post/' || post_id
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Функция для создания уведомления о подписке (опционально)
CREATE OR REPLACE FUNCTION public.create_follow_notification(
  target_user_id uuid,
  follower_name text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    body,
    href
  ) VALUES (
    target_user_id,
    'follow',
    follower_name || ' folgt dir jetzt',
    'Jemand folgt deinem Profil',
    '/profile'
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

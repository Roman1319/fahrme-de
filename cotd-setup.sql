-- Создание таблиц для системы "Машина дня" (COTD)
-- Выполнить этот скрипт в Supabase SQL Editor

-- 1. Создать таблицу cotd_days для хранения дней голосования
CREATE TABLE IF NOT EXISTS cotd_days (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'voting', -- 'voting', 'closed', 'winner_announced'
  winner_car_id UUID REFERENCES cars(id) ON DELETE SET NULL,
  total_votes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Создать таблицу cotd_candidates для кандидатов на машину дня
CREATE TABLE IF NOT EXISTS cotd_candidates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  day_id UUID REFERENCES cotd_days(id) ON DELETE CASCADE NOT NULL,
  car_id UUID REFERENCES cars(id) ON DELETE CASCADE NOT NULL,
  votes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(day_id, car_id)
);

-- 3. Создать таблицу cotd_votes для голосов пользователей
CREATE TABLE IF NOT EXISTS cotd_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  day_id UUID REFERENCES cotd_days(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  car_id UUID REFERENCES cars(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(day_id, user_id) -- Один голос в день на пользователя
);

-- 4. Включить RLS для всех таблиц
ALTER TABLE cotd_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotd_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotd_votes ENABLE ROW LEVEL SECURITY;

-- 5. Создать политики для cotd_days
-- Все могут читать дни голосования
CREATE POLICY "COTD days are viewable by everyone" ON cotd_days
  FOR SELECT USING (true);

-- Только аутентифицированные пользователи могут создавать дни (для админов)
CREATE POLICY "Authenticated users can create COTD days" ON cotd_days
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Только аутентифицированные пользователи могут обновлять дни (для админов)
CREATE POLICY "Authenticated users can update COTD days" ON cotd_days
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- 6. Создать политики для cotd_candidates
-- Все могут читать кандидатов
CREATE POLICY "COTD candidates are viewable by everyone" ON cotd_candidates
  FOR SELECT USING (true);

-- Только аутентифицированные пользователи могут создавать кандидатов
CREATE POLICY "Authenticated users can create COTD candidates" ON cotd_candidates
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 7. Создать политики для cotd_votes
-- Все могут читать голоса (для подсчета)
CREATE POLICY "COTD votes are viewable by everyone" ON cotd_votes
  FOR SELECT USING (true);

-- Пользователи могут создавать только свои голоса
CREATE POLICY "Users can create own COTD votes" ON cotd_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Пользователи могут удалять только свои голоса
CREATE POLICY "Users can delete own COTD votes" ON cotd_votes
  FOR DELETE USING (auth.uid() = user_id);

-- 8. Создать индексы для производительности
CREATE INDEX IF NOT EXISTS idx_cotd_days_date ON cotd_days(date);
CREATE INDEX IF NOT EXISTS idx_cotd_days_status ON cotd_days(status);
CREATE INDEX IF NOT EXISTS idx_cotd_candidates_day_id ON cotd_candidates(day_id);
CREATE INDEX IF NOT EXISTS idx_cotd_candidates_car_id ON cotd_candidates(car_id);
CREATE INDEX IF NOT EXISTS idx_cotd_votes_day_id ON cotd_votes(day_id);
CREATE INDEX IF NOT EXISTS idx_cotd_votes_user_id ON cotd_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_cotd_votes_car_id ON cotd_votes(car_id);

-- 9. Создать функцию для получения сегодняшних кандидатов
CREATE OR REPLACE FUNCTION get_today_cotd_candidates()
RETURNS TABLE (
  day_id uuid,
  date date,
  status varchar,
  car_id uuid,
  car_brand text,
  car_model text,
  car_year integer,
  car_name text,
  car_photo_url text,
  owner_handle text,
  owner_avatar_url text,
  votes integer,
  my_vote boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cd.id as day_id,
    cd.date,
    cd.status,
    c.id as car_id,
    c.brand as car_brand,
    c.model as car_model,
    c.year as car_year,
    c.name as car_name,
    cp.storage_path as car_photo_url,
    p.handle as owner_handle,
    p.avatar_url as owner_avatar_url,
    cc.votes,
    CASE 
      WHEN auth.uid() IS NULL THEN false
      ELSE EXISTS(
        SELECT 1 FROM cotd_votes cv 
        WHERE cv.day_id = cd.id 
        AND cv.user_id = auth.uid() 
        AND cv.car_id = c.id
      )
    END as my_vote
  FROM cotd_days cd
  LEFT JOIN cotd_candidates cc ON cd.id = cc.day_id
  LEFT JOIN cars c ON cc.car_id = c.id
  LEFT JOIN profiles p ON c.owner_id = p.id
  LEFT JOIN LATERAL (
    SELECT storage_path 
    FROM car_photos 
    WHERE car_id = c.id 
    ORDER BY sort ASC, created_at ASC 
    LIMIT 1
  ) cp ON true
  WHERE cd.date = CURRENT_DATE
  ORDER BY cc.votes DESC, c.created_at ASC;
END;
$$;

-- 10. Создать функцию для получения вчерашнего победителя
CREATE OR REPLACE FUNCTION get_yesterday_cotd_winner()
RETURNS TABLE (
  car_id uuid,
  car_brand text,
  car_model text,
  car_year integer,
  car_name text,
  car_photo_url text,
  owner_handle text,
  owner_avatar_url text,
  votes integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as car_id,
    c.brand as car_brand,
    c.model as car_model,
    c.year as car_year,
    c.name as car_name,
    cp.storage_path as car_photo_url,
    p.handle as owner_handle,
    p.avatar_url as owner_avatar_url,
    cc.votes
  FROM cotd_days cd
  LEFT JOIN cotd_candidates cc ON cd.id = cc.day_id
  LEFT JOIN cars c ON cc.car_id = c.id
  LEFT JOIN profiles p ON c.owner_id = p.id
  LEFT JOIN LATERAL (
    SELECT storage_path 
    FROM car_photos 
    WHERE car_id = c.id 
    ORDER BY sort ASC, created_at ASC 
    LIMIT 1
  ) cp ON true
  WHERE cd.date = CURRENT_DATE - INTERVAL '1 day'
  AND cd.winner_car_id = c.id
  LIMIT 1;
END;
$$;

-- 11. Создать функцию для голосования
CREATE OR REPLACE FUNCTION vote_for_cotd_car(p_car_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_day_id uuid;
  v_existing_vote uuid;
  v_result json;
BEGIN
  -- Проверить, что пользователь аутентифицирован
  IF auth.uid() IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Получить ID сегодняшнего дня
  SELECT id INTO v_day_id FROM cotd_days WHERE date = CURRENT_DATE;
  
  IF v_day_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No voting day found');
  END IF;

  -- Проверить, что день еще открыт для голосования
  IF (SELECT status FROM cotd_days WHERE id = v_day_id) != 'voting' THEN
    RETURN json_build_object('success', false, 'error', 'Voting is closed');
  END IF;

  -- Проверить, что машина является кандидатом
  IF NOT EXISTS (SELECT 1 FROM cotd_candidates WHERE day_id = v_day_id AND car_id = p_car_id) THEN
    RETURN json_build_object('success', false, 'error', 'Car is not a candidate');
  END IF;

  -- Проверить, не голосовал ли уже пользователь сегодня
  SELECT id INTO v_existing_vote FROM cotd_votes WHERE day_id = v_day_id AND user_id = auth.uid();
  
  IF v_existing_vote IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Already voted today');
  END IF;

  -- Добавить голос
  INSERT INTO cotd_votes (day_id, user_id, car_id) 
  VALUES (v_day_id, auth.uid(), p_car_id);

  -- Обновить счетчик голосов для машины
  UPDATE cotd_candidates 
  SET votes = votes + 1 
  WHERE day_id = v_day_id AND car_id = p_car_id;

  -- Обновить общий счетчик голосов для дня
  UPDATE cotd_days 
  SET total_votes = total_votes + 1 
  WHERE id = v_day_id;

  RETURN json_build_object('success', true, 'message', 'Vote recorded');
END;
$$;

-- 12. Создать функцию для закрытия дня голосования и определения победителя
CREATE OR REPLACE FUNCTION close_cotd_day()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_day_id uuid;
  v_winner_car_id uuid;
  v_result json;
BEGIN
  -- Получить ID сегодняшнего дня
  SELECT id INTO v_day_id FROM cotd_days WHERE date = CURRENT_DATE;
  
  IF v_day_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No voting day found');
  END IF;

  -- Найти машину с максимальным количеством голосов
  SELECT car_id INTO v_winner_car_id 
  FROM cotd_candidates 
  WHERE day_id = v_day_id 
  ORDER BY votes DESC, created_at ASC 
  LIMIT 1;

  -- Обновить статус дня и установить победителя
  UPDATE cotd_days 
  SET 
    status = 'closed',
    winner_car_id = v_winner_car_id,
    updated_at = NOW()
  WHERE id = v_day_id;

  RETURN json_build_object(
    'success', true, 
    'winner_car_id', v_winner_car_id,
    'message', 'Day closed and winner determined'
  );
END;
$$;

-- 13. Предоставить права на выполнение функций
GRANT EXECUTE ON FUNCTION get_today_cotd_candidates() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_yesterday_cotd_winner() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION vote_for_cotd_car(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION close_cotd_day() TO authenticated;

-- 14. Создать триггер для автоматического создания дня голосования
CREATE OR REPLACE FUNCTION create_daily_cotd()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Создать день голосования, если его еще нет
  INSERT INTO cotd_days (date, status)
  VALUES (CURRENT_DATE, 'voting')
  ON CONFLICT (date) DO NOTHING;
END;
$$;

-- 15. Создать функцию для добавления кандидатов (для админов)
CREATE OR REPLACE FUNCTION add_cotd_candidates(p_car_ids uuid[])
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_day_id uuid;
  v_car_id uuid;
  v_added_count integer := 0;
BEGIN
  -- Проверить, что пользователь аутентифицирован
  IF auth.uid() IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Получить или создать ID сегодняшнего дня
  SELECT id INTO v_day_id FROM cotd_days WHERE date = CURRENT_DATE;
  
  IF v_day_id IS NULL THEN
    INSERT INTO cotd_days (date, status) VALUES (CURRENT_DATE, 'voting') RETURNING id INTO v_day_id;
  END IF;

  -- Добавить кандидатов
  FOREACH v_car_id IN ARRAY p_car_ids
  LOOP
    INSERT INTO cotd_candidates (day_id, car_id)
    VALUES (v_day_id, v_car_id)
    ON CONFLICT (day_id, car_id) DO NOTHING;
    
    IF FOUND THEN
      v_added_count := v_added_count + 1;
    END IF;
  END LOOP;

  RETURN json_build_object('success', true, 'added_count', v_added_count);
END;
$$;

GRANT EXECUTE ON FUNCTION add_cotd_candidates(uuid[]) TO authenticated;

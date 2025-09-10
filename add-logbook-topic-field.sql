-- Добавление поля topic в таблицу logbook_entries
-- Выполнить этот скрипт в Supabase SQL Editor

-- Добавляем поле topic в таблицу logbook_entries
ALTER TABLE logbook_entries 
ADD COLUMN IF NOT EXISTS topic TEXT;

-- Добавляем комментарий к полю
COMMENT ON COLUMN logbook_entries.topic IS 'Тема/категория записи логбука (тюнинг, ремонт, путешествия и т.д.)';

-- Создаем индекс для быстрого поиска по темам
CREATE INDEX IF NOT EXISTS idx_logbook_entries_topic 
ON logbook_entries(topic);

-- Обновляем существующие записи (если нужно)
-- UPDATE logbook_entries SET topic = 'other' WHERE topic IS NULL;

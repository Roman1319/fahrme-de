# Обновление полей профиля

## Добавленные поля

В профиль пользователя добавлены следующие поля:
- **Страна** (country) - текстовое поле, максимум 50 символов
- **Город** (city) - текстовое поле, максимум 50 символов  
- **Пол** (gender) - выпадающий список: Мужской, Женский, Другое
- **Дата рождения** (birth_date) - поле выбора даты

## Изменения в коде

### 1. Обновлены типы данных
- `src/lib/types.ts` - добавлены новые поля в интерфейс Profile
- `src/lib/profiles.ts` - обновлен интерфейс UpdateProfileData

### 2. Обновлена страница профиля
- `src/app/profile/page.tsx` - добавлены новые поля в форму
- Добавлена валидация для новых полей
- Обновлена функция сохранения профиля

### 3. Создан SQL скрипт
- `add-profile-fields.sql` - для добавления новых полей в базу данных

## Что нужно сделать

### 1. Выполнить SQL скрипт в Supabase
Выполните содержимое файла `add-profile-fields.sql` в Supabase SQL Editor:

```sql
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
```

### 2. Проверить работу
1. Перейдите на `/profile`
2. Заполните новые поля
3. Сохраните профиль
4. Проверьте, что данные сохранились

## Особенности

- Все новые поля опциональные
- Валидация проверяет длину текстовых полей и корректность даты
- Поле даты рождения сохраняется в формате ISO
- Добавлены индексы для быстрого поиска по новым полям

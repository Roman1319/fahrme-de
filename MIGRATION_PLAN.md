# План полной миграции на Supabase

## 🎯 ЦЕЛЬ
Полностью убрать localStorage и перевести все данные на Supabase.

## 📋 ЭТАПЫ МИГРАЦИИ

### ЭТАП 1: Подготовка базы данных
### ЭТАП 2: Миграция аутентификации
### ЭТАП 3: Миграция данных автомобилей
### ЭТАП 4: Миграция логбука и комментариев
### ЭТАП 5: Миграция лайков
### ЭТАП 6: Очистка localStorage кода
### ЭТАП 7: Тестирование и финальная проверка

---

## ЭТАП 1: ПОДГОТОВКА БАЗЫ ДАННЫХ

### 1.1 Добавить недостающие поля в Supabase

**Действия в Supabase Dashboard:**

1. Откройте **SQL Editor** в Supabase
2. Выполните следующие запросы:

```sql
-- Добавить технические поля в cars (если еще не добавлены)
ALTER TABLE cars 
ADD COLUMN IF NOT EXISTS power INTEGER,
ADD COLUMN IF NOT EXISTS engine TEXT,
ADD COLUMN IF NOT EXISTS volume TEXT,
ADD COLUMN IF NOT EXISTS gearbox TEXT,
ADD COLUMN IF NOT EXISTS drive TEXT;

-- Добавить поля для лайков комментариев
CREATE TABLE IF NOT EXISTS comment_likes (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, comment_id)
);

-- Включить RLS для comment_likes
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- Политики для comment_likes
CREATE POLICY "Comment likes are viewable by everyone" ON comment_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own comment likes" ON comment_likes
  FOR ALL USING (auth.uid() = user_id);

-- Добавить индексы для производительности
CREATE INDEX IF NOT EXISTS idx_cars_owner_id ON cars(owner_id);
CREATE INDEX IF NOT EXISTS idx_car_photos_car_id ON car_photos(car_id);
CREATE INDEX IF NOT EXISTS idx_logbook_entries_car_id ON logbook_entries(car_id);
CREATE INDEX IF NOT EXISTS idx_logbook_entries_author_id ON logbook_entries(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_entry_id ON comments(entry_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_entry_id ON post_likes(entry_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
```

### 1.2 Настроить Storage Buckets

**Действия в Supabase Dashboard:**

1. Перейдите в **Storage** → **Buckets**
2. Убедитесь, что bucket `car-photos` существует
3. Если нет, создайте его:
   - Name: `car-photos`
   - Public: `true`
   - File size limit: `50MB`
   - Allowed MIME types: `image/*`

---

## ЭТАП 2: МИГРАЦИЯ АУТЕНТИФИКАЦИИ

### 2.1 Обновить AuthProvider

**Файл:** `src/components/AuthProvider.tsx`

```typescript
// Убрать переключение между local/supabase
// Использовать только Supabase auth
import { supabase } from '@/lib/supabaseClient';

// Удалить все localStorage логику
// Использовать только supabase.auth
```

### 2.2 Удалить Local Auth Service

**Файлы для удаления:**
- `src/services/auth/local.ts`
- `src/lib/auth.ts` (если есть)

**Файл для обновления:**
- `src/services/auth/index.ts` - убрать переключение, использовать только Supabase

---

## ЭТАП 3: МИГРАЦИЯ ДАННЫХ АВТОМОБИЛЕЙ

### 3.1 Создать функцию миграции автомобилей

**Файл:** `src/lib/migrate-cars-to-supabase.ts`

```typescript
import { supabase } from './supabaseClient';
import { STORAGE_KEYS } from './keys';

export async function migrateCarsToSupabase() {
  if (typeof window === 'undefined') return;
  
  try {
    // Получить текущего пользователя
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Получить автомобили из localStorage
    const localCars = localStorage.getItem(STORAGE_KEYS.MY_CARS_KEY);
    if (!localCars) return;

    const cars = JSON.parse(localCars);
    
    // Мигрировать каждый автомобиль
    for (const car of cars) {
      const carData = {
        brand: car.make || car.brand,
        model: car.model,
        year: car.year,
        name: car.name,
        color: car.color,
        power: car.power,
        engine: car.engine,
        volume: car.volume,
        gearbox: car.gearbox,
        drive: car.drive,
        description: car.description,
        story: car.story,
        is_main_vehicle: car.isMainVehicle || false,
        is_former: car.isFormerCar || false
      };

      const { data, error } = await supabase
        .from('cars')
        .insert(carData)
        .select()
        .single();

      if (error) {
        console.error('Error migrating car:', error);
        continue;
      }

      // Мигрировать фото если есть
      if (car.images && car.images.length > 0) {
        // TODO: Мигрировать фото
      }
    }

    // Очистить localStorage
    localStorage.removeItem(STORAGE_KEYS.MY_CARS_KEY);
    console.log('Cars migrated successfully');
    
  } catch (error) {
    console.error('Error migrating cars:', error);
  }
}
```

### 3.2 Обновить компоненты автомобилей

**Файлы для обновления:**
- `src/app/my-cars/page.tsx` - использовать только Supabase API
- `src/app/car/[id]/page.tsx` - убрать localStorage логику
- `src/components/EditCarModal.tsx` - использовать только Supabase

---

## ЭТАП 4: МИГРАЦИЯ ЛОГБУКА И КОММЕНТАРИЕВ

### 4.1 Создать функции миграции логбука

**Файл:** `src/lib/migrate-logbook-to-supabase.ts`

```typescript
import { supabase } from './supabaseClient';
import { STORAGE_KEYS } from './keys';

export async function migrateLogbookToSupabase() {
  if (typeof window === 'undefined') return;
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Мигрировать записи логбука
    const logbookKeys = Object.keys(localStorage)
      .filter(key => key.startsWith(STORAGE_KEYS.LOGBOOK_ENTRIES_PREFIX));

    for (const key of logbookKeys) {
      const entry = JSON.parse(localStorage.getItem(key) || '{}');
      
      const entryData = {
        car_id: entry.carId,
        author_id: user.id,
        title: entry.title,
        content: entry.content || entry.text,
        allow_comments: entry.allowComments !== false,
        publish_date: entry.publishDate || entry.publish_date
      };

      const { data, error } = await supabase
        .from('logbook_entries')
        .insert(entryData)
        .select()
        .single();

      if (error) {
        console.error('Error migrating logbook entry:', error);
        continue;
      }

      // Мигрировать комментарии
      const commentsKey = key.replace('logbook:', 'logbook:comments:');
      const comments = JSON.parse(localStorage.getItem(commentsKey) || '[]');
      
      for (const comment of comments) {
        const commentData = {
          entry_id: data.id,
          author_id: user.id,
          text: comment.text,
          parent_id: comment.parentId || null
        };

        await supabase
          .from('comments')
          .insert(commentData);
      }
    }

    // Очистить localStorage
    logbookKeys.forEach(key => localStorage.removeItem(key));
    console.log('Logbook migrated successfully');
    
  } catch (error) {
    console.error('Error migrating logbook:', error);
  }
}
```

---

## ЭТАП 5: МИГРАЦИЯ ЛАЙКОВ

### 5.1 Создать функции миграции лайков

**Файл:** `src/lib/migrate-likes-to-supabase.ts`

```typescript
import { supabase } from './supabaseClient';
import { STORAGE_KEYS } from './keys';

export async function migrateLikesToSupabase() {
  if (typeof window === 'undefined') return;
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Мигрировать лайки постов
    const postLikes = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGBOOK_LIKES_KEY) || '[]');
    
    for (const like of postLikes) {
      await supabase
        .from('post_likes')
        .insert({
          user_id: user.id,
          entry_id: like.entryId
        });
    }

    // Мигрировать лайки комментариев
    const commentLikes = JSON.parse(localStorage.getItem(STORAGE_KEYS.LIKES_SET_KEY) || '[]');
    
    for (const like of commentLikes) {
      if (like.type === 'comment') {
        await supabase
          .from('comment_likes')
          .insert({
            user_id: user.id,
            comment_id: like.commentId
          });
      }
    }

    // Очистить localStorage
    localStorage.removeItem(STORAGE_KEYS.LOGBOOK_LIKES_KEY);
    localStorage.removeItem(STORAGE_KEYS.LIKES_SET_KEY);
    console.log('Likes migrated successfully');
    
  } catch (error) {
    console.error('Error migrating likes:', error);
  }
}
```

---

## ЭТАП 6: ОЧИСТКА LOCALSTORAGE КОДА

### 6.1 Файлы для удаления:
- `src/lib/interactions.ts` (заменить на Supabase API)
- `src/lib/likes.ts` (заменить на Supabase API)
- `src/lib/profile.ts` (заменить на Supabase API)
- `src/lib/migrate-*.ts` (все файлы миграции)
- `src/lib/clear-all-profiles.ts`
- `src/lib/fix-car-ownership.ts`

### 6.2 Файлы для обновления:
- `src/lib/keys.ts` - убрать localStorage ключи
- `src/lib/logbook.ts` - убрать localStorage функции
- `src/lib/cars.ts` - убрать localStorage функции

---

## ЭТАП 7: ТЕСТИРОВАНИЕ

### 7.1 Создать тестовую функцию

**Файл:** `src/lib/test-migration.ts`

```typescript
export async function testMigration() {
  console.log('Testing Supabase migration...');
  
  // Тест аутентификации
  const { data: { user } } = await supabase.auth.getUser();
  console.log('User:', user ? 'Logged in' : 'Not logged in');
  
  // Тест автомобилей
  const { data: cars } = await supabase.from('cars').select('*');
  console.log('Cars count:', cars?.length || 0);
  
  // Тест логбука
  const { data: entries } = await supabase.from('logbook_entries').select('*');
  console.log('Logbook entries count:', entries?.length || 0);
  
  // Тест комментариев
  const { data: comments } = await supabase.from('comments').select('*');
  console.log('Comments count:', comments?.length || 0);
  
  console.log('Migration test completed');
}
```

---

## 🚀 ПОРЯДОК ВЫПОЛНЕНИЯ

1. **Выполнить ЭТАП 1** (настройка БД в Supabase)
2. **Создать файлы миграции** из ЭТАПОВ 3-5
3. **Обновить AuthProvider** (ЭТАП 2)
4. **Запустить миграцию** данных
5. **Обновить компоненты** для использования только Supabase
6. **Удалить localStorage код** (ЭТАП 6)
7. **Протестировать** (ЭТАП 7)

---

## ⚠️ ВАЖНЫЕ ЗАМЕЧАНИЯ

- **Сделать бэкап** данных перед миграцией
- **Тестировать** каждый этап отдельно
- **Не удалять** localStorage код до полного тестирования
- **Уведомить пользователей** о миграции данных

Готов начать с любого этапа! С чего начнем? 🚀

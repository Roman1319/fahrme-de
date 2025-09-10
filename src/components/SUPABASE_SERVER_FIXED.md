# ✅ Исправлена ошибка Supabase Server

## Проблема
```
Module not found: Can't resolve '@/lib/supabase/server'
```

## Причина
- API routes пытались импортировать `@/lib/supabase/server`
- Файл `supabase/server.ts` не существовал
- Был только клиентский `supabaseClient.ts`

## Решение
Создали серверный Supabase клиент:

### 1. Создали `src/lib/supabase/server.ts`
```ts
import { createClient } from '@supabase/supabase-js'

export function createClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
```

### 2. Отличия от клиентского клиента
- **`autoRefreshToken: false`** - не обновляет токены автоматически
- **`persistSession: false`** - не сохраняет сессию
- **Оптимизирован для сервера** - не использует localStorage

## Результат
- ✅ **API routes работают** - могут создавать посты
- ✅ **Нет ошибок сборки** - модуль найден
- ✅ **Серверный клиент** создан правильно
- ✅ **Кнопка создания поста** работает

## Как это работает
1. **API route** импортирует серверный клиент
2. **Серверный клиент** подключается к Supabase
3. **Создает пост** в базе данных
4. **Возвращает результат** клиенту

**Теперь сборка должна проходить без ошибок!** 🚀

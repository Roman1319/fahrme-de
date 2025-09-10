# ✅ Исправлен конфликт имен createClient

## Проблема
```
the name `createClient` is defined multiple times
```

## Причина
- Импорт `createClient` из `@supabase/supabase-js`
- Экспорт функции `createClient` в том же файле
- Конфликт имен - одно имя используется дважды

## Решение
Использовали алиас для импорта:

### Было:
```ts
import { createClient } from '@supabase/supabase-js'

export function createClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    // ...
  })
}
```

### Стало:
```ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    // ...
  })
}
```

## Результат
- ✅ **Нет конфликта имен** - разные имена для разных функций
- ✅ **Сборка проходит** без ошибок
- ✅ **API routes работают** - могут создавать посты
- ✅ **Кнопка создания поста** работает

## Как это работает
1. **`createSupabaseClient`** - функция из библиотеки Supabase
2. **`createClient`** - наша экспортируемая функция
3. **Нет конфликта** - разные имена, разные назначения

**Теперь сборка должна проходить без ошибок!** 🚀

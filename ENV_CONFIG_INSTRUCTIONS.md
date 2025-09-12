# Инструкция по настройке переменных окружения и конфигурации Supabase

## 1. Обзор системы

Система валидации переменных окружения обеспечивает:
- ✅ Проверку обязательных переменных
- ✅ Валидацию форматов URL и ключей
- ✅ Автоматическое исправление пробелов
- ✅ Предупреждения о тестовых значениях
- ✅ Рекомендации по использованию клиентов

## 2. Обязательные переменные окружения

### NEXT_PUBLIC_SUPABASE_URL
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
```

**Требования:**
- Должен начинаться с `https://`
- Не может быть localhost в продакшене
- Должен быть валидным URL Supabase

### NEXT_PUBLIC_SUPABASE_ANON_KEY
```bash
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Требования:**
- Должен быть JWT токеном (начинается с `eyJ`)
- Должен быть валидным anon key от Supabase
- Не может быть placeholder значением

### SUPABASE_SERVICE_ROLE_KEY (опционально)
```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Использование:**
- Только для административных операций
- Обходит RLS политики
- Используется в service client

## 3. Файл .env.local

Создайте файл `.env.local` в корне проекта:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-key-here

# Environment
NODE_ENV=development
```

## 4. Валидация переменных

### Автоматическая валидация
Система автоматически проверяет переменные при:
- Импорте `supabaseClient.ts`
- Создании клиентов Supabase
- Запуске приложения

### Проверки валидации
- ✅ **Обязательные переменные** - URL и anon key должны быть установлены
- ✅ **Формат URL** - должен начинаться с https://
- ✅ **Формат ключей** - должны быть JWT токенами
- ✅ **Пробелы** - автоматически удаляются
- ✅ **Тестовые значения** - предупреждения о placeholder значениях
- ✅ **Окружение** - проверка localhost в продакшене

## 5. Типы клиентов Supabase

### Anon Client (по умолчанию)
```typescript
import { supabase } from '@/lib/supabaseClient';
// Использует NEXT_PUBLIC_SUPABASE_ANON_KEY
// Соблюдает RLS политики
// Для пользовательских операций
```

### Service Client
```typescript
import { createSupabaseServiceClient } from '@/lib/supabaseServer';
// Использует SUPABASE_SERVICE_ROLE_KEY
// Обходит RLS политики
// Только для административных операций
```

## 6. Рекомендации по использованию клиентов

### Используйте Anon Client для:
- ✅ Чтения данных (с RLS)
- ✅ Создания записей пользователями
- ✅ Обновления собственных записей
- ✅ Удаления собственных записей
- ✅ RPC функций для пользователей

### Используйте Service Client для:
- ✅ Административных операций
- ✅ Массовых операций
- ✅ Системных задач
- ✅ Миграций данных
- ✅ Очистки данных

## 7. Диагностика конфигурации

### Страница диагностики
Перейдите на `/debug/config` для проверки:
- Статус валидации переменных
- Информация о клиентах
- Тест подключения к БД
- Тест RLS политик

### Проверка в коде
```typescript
import { validateSupabaseEnv, getConfigDebugInfo } from '@/lib/env-validation';

// Проверить валидацию
const validation = validateSupabaseEnv();
if (!validation.isValid) {
  console.error('Validation failed:', validation.errors);
}

// Получить информацию о конфигурации
const configInfo = getConfigDebugInfo();
console.log('Config info:', configInfo);
```

## 8. Обработка ошибок

### Ошибки валидации
```typescript
try {
  const supabase = createClient();
} catch (error) {
  if (error.message.includes('validation failed')) {
    // Обработать ошибку валидации
  }
}
```

### Предупреждения
```typescript
// Предупреждения логируются в консоль
console.warn('[supabase] Environment warnings:');
console.warn('[supabase] ⚠️  Using example Supabase URL');
```

## 9. Смена окружения

### Development → Production
1. Обновите `.env.local`:
   ```bash
   NODE_ENV=production
   NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
   ```

2. Перезапустите приложение:
   ```bash
   npm run dev
   ```

3. Проверьте конфигурацию на `/debug/config`

### Production → Development
1. Обновите `.env.local`:
   ```bash
   NODE_ENV=development
   NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-dev-anon-key
   ```

2. Перезапустите приложение

## 10. Аудит использования клиентов

### Проверка API endpoints
```typescript
import { auditAllEndpoints, getClientRecommendations } from '@/lib/client-audit';

// Аудит всех endpoints
const audits = auditAllEndpoints();
console.log('Client usage audit:', audits);

// Рекомендации по улучшению
const recommendations = getClientRecommendations();
console.log('Recommendations:', recommendations);
```

### Рекомендации по улучшению
- **Высокий приоритет**: Админские операции должны использовать service client
- **Средний приоритет**: Массовые операции должны использовать service client
- **Низкий приоритет**: Пользовательские операции правильно используют anon client

## 11. Мониторинг и логирование

### Логи валидации
```bash
[env-validation] Starting environment validation...
[env-validation] ✅ Environment validation passed
[supabase] URL: Set
[supabase] Key: Set
```

### Логи предупреждений
```bash
[supabase] Environment warnings:
[supabase] ⚠️  NEXT_PUBLIC_SUPABASE_URL had leading/trailing spaces (auto-trimmed)
[supabase] ⚠️  Using example Supabase URL - make sure to replace with real URL
```

## 12. Устранение проблем

### Проблема: "Missing NEXT_PUBLIC_SUPABASE_URL"
**Решение:**
1. Проверьте файл `.env.local`
2. Убедитесь, что переменная установлена
3. Перезапустите приложение

### Проблема: "Invalid Supabase URL format"
**Решение:**
1. Убедитесь, что URL начинается с `https://`
2. Проверьте, что URL не содержит пробелов
3. Убедитесь, что URL валидный

### Проблема: "Invalid Supabase key format"
**Решение:**
1. Убедитесь, что ключ начинается с `eyJ`
2. Проверьте, что ключ не содержит пробелов
3. Убедитесь, что ключ валидный

### Проблема: "Cannot use localhost URL in production"
**Решение:**
1. Используйте production URL Supabase
2. Убедитесь, что `NODE_ENV=production`
3. Проверьте настройки окружения

## 13. Безопасность

### Важные моменты:
- ✅ **Не коммитьте** `.env.local` в Git
- ✅ **Используйте** `.env.example` для документации
- ✅ **Ротируйте** ключи регулярно
- ✅ **Ограничьте** доступ к service key
- ✅ **Мониторьте** использование ключей

### Рекомендации:
- Service key только для серверных операций
- Anon key для клиентских операций
- Регулярно проверяйте права доступа
- Используйте RLS для безопасности данных

## 14. Тестирование

### Проверка конфигурации
```bash
# Запустить приложение
npm run dev

# Проверить логи
# Должны быть сообщения о валидации

# Открыть /debug/config
# Проверить статус всех компонентов
```

### Тестирование смены окружения
1. Измените переменные в `.env.local`
2. Перезапустите приложение
3. Проверьте, что изменения применились
4. Убедитесь, что приложение работает

Все готово для использования! 🔧⚙️

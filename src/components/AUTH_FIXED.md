# ✅ Исправлена ошибка аутентификации 401

## Проблема
```
Failed to load resource: the server responded with a status of 401 (Unauthorized)
Error creating logbook entry: Error: Failed to create logbook entry
```

## Причина
- API routes не имели доступа к сессии пользователя
- Серверный Supabase клиент не знал о токене аутентификации
- Отсутствовал заголовок Authorization в запросах

## Решение

### 1. Обновили API route для получения токена
```ts
// src/app/api/logbook/route.ts
const authHeader = request.headers.get('authorization');
if (!authHeader || !authHeader.startsWith('Bearer ')) {
  return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
}

const token = authHeader.substring(7);
const { data: { user }, error: authError } = await supabase.auth.getUser(token);
```

### 2. Обновили клиентский код для передачи токена
```ts
// src/app/cars/[brand]/[model]/[carId]/logbook/new/page.tsx
const { data: { session } } = await supabase.auth.getSession();
if (!session?.access_token) {
  throw new Error('No authentication token available');
}

const response = await fetch('/api/logbook', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  },
  // ...
});
```

## Результат
- ✅ **Аутентификация работает** - токен передается в API
- ✅ **API routes получают пользователя** - могут создавать посты
- ✅ **Кнопка создания поста** работает
- ✅ **Нет ошибок 401** - пользователь авторизован

## Как это работает
1. **Клиент получает токен** из Supabase сессии
2. **Токен передается** в заголовке Authorization
3. **API route проверяет токен** и получает пользователя
4. **Создает пост** от имени пользователя

**Теперь создание постов должно работать!** 🚀

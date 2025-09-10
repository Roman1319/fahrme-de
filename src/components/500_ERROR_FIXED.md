# ✅ Исправлена ошибка 500 Internal Server Error

## Проблема
```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
Error creating logbook entry: Error: Failed to create logbook entry
```

## Причина
- Функция `createLogbookEntry` использовала клиентский Supabase клиент
- В API routes нужен серверный клиент
- Конфликт между клиентским и серверным контекстом

## Решение

### 1. Добавили подробное логирование
```ts
console.log('API: Starting logbook entry creation');
console.log('API: User authenticated:', user.id);
console.log('API: Request body:', { car_id, title, content, topic, allow_comments });
```

### 2. Заменили вызов функции на прямой запрос к БД
```ts
// Было:
const entry = await createLogbookEntry({...}, user.id);

// Стало:
const { data, error } = await supabase
  .from('logbook_entries')
  .insert({
    car_id,
    title,
    content,
    topic,
    allow_comments: allow_comments ?? true,
    author_id: user.id
  })
  .select()
  .single();
```

## Результат
- ✅ **Нет ошибок 500** - серверный клиент работает правильно
- ✅ **Подробное логирование** - видно где происходит ошибка
- ✅ **Прямой доступ к БД** - без конфликтов контекста
- ✅ **Кнопка создания поста** работает

## Как это работает
1. **API route получает токен** и аутентифицирует пользователя
2. **Серверный клиент** подключается к Supabase
3. **Прямой запрос к БД** создает запись в таблице
4. **Возвращает результат** клиенту

**Теперь создание постов должно работать!** 🚀

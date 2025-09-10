# ErrorBoundaryClient - Детекция проблемных компонентов

## Назначение

ErrorBoundaryClient предназначен для детекции компонентов, которые вызывают ошибки из-за неправильного использования async функций в клиентских компонентах Next.js.

## Использование

### 1. Импорт
```tsx
import ErrorBoundaryClient from '@/components/ErrorBoundaryClient';
```

### 2. Обертка компонента
```tsx
return (
  <ErrorBoundaryClient>
    {/* Ваш контент */}
  </ErrorBoundaryClient>
);
```

## Что детектирует

ErrorBoundary ловит следующие ошибки:
- Async клиентские компоненты
- Промисы в JSX
- Неправильные импорты серверных модулей в клиентских компонентах

## Логирование

При обнаружении ошибки в консоли появится:
```
[Async Client Component DETECTED] { error, componentStack }
```

Где `componentStack` содержит точный путь к проблемному компоненту.

## Уже добавлен в:
- `EntryPageClient.tsx` - страница логбука
- `post/[id]/page.tsx` - страница поста
- `profile/page.tsx` - страница профиля

## Добавление в другие страницы

Для добавления в другие клиентские страницы:

1. Импортируйте ErrorBoundaryClient
2. Оберните весь контент страницы в `<ErrorBoundaryClient>`
3. Перезагрузите страницу
4. Проверьте консоль на наличие ошибок

## Пример полной интеграции

```tsx
'use client';
import ErrorBoundaryClient from '@/components/ErrorBoundaryClient';

export default function MyPage() {
  return (
    <ErrorBoundaryClient>
      <div>
        {/* Ваш контент */}
      </div>
    </ErrorBoundaryClient>
  );
}
```

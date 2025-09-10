# 🔍 Руководство по отладке Async Client Component ошибок

## Проблема
Ошибка: `An unknown Component is an async Client Component. Only Server Components can be async at the moment.`

## Инструменты отладки

### 1. ErrorBoundaryClient
- **Где**: Обернут вокруг контента страниц
- **Что делает**: Ловит ошибки в компонентах и показывает детальную информацию
- **Где смотреть**: В консоли и в UI (красная рамка с ошибкой)

### 2. GlobalErrorHandler
- **Где**: В корневом layout
- **Что делает**: Ловит глобальные ошибки JavaScript
- **Где смотреть**: В консоли `[GLOBAL ERROR HANDLER]`

### 3. AsyncComponentDetector
- **Где**: В корневом layout
- **Что делает**: Перехватывает console.error и анализирует async ошибки
- **Где смотреть**: В консоли `🔍 ASYNC CLIENT COMPONENT DETECTOR`

### 4. AsyncComponentDebugger
- **Где**: В корневом layout
- **Что делает**: Детальный анализ стека вызовов
- **Где смотреть**: В консоли `🚨 ASYNC CLIENT COMPONENT DEBUGGER`

### 5. ComponentAnalyzer
- **Где**: В корневом layout
- **Что делает**: Анализирует DOM на предмет промисов
- **Где смотреть**: В консоли `🔍 COMPONENT ANALYZER`

## Как использовать

1. **Откройте страницу** с ошибкой
2. **Откройте консоль** (F12)
3. **Ищите сообщения** с эмодзи 🔍, 🚨, 🔍
4. **Анализируйте стек** - там будет точный путь к проблемному компоненту

## Типичные проблемы

### 1. Async функция в JSX
```tsx
// ❌ ПЛОХО
<div>{asyncFunction()}</div>

// ✅ ХОРОШО
const [data, setData] = useState(null);
useEffect(() => {
  asyncFunction().then(setData);
}, []);
<div>{data}</div>
```

### 2. Импорт серверных модулей в клиенте
```tsx
// ❌ ПЛОХО
import { serverFunction } from '@/lib/server';

// ✅ ХОРОШО
// Используйте API вызовы через fetch()
```

### 3. Async компонент
```tsx
// ❌ ПЛОХО
'use client';
export default async function MyComponent() {
  return <div>Hello</div>;
}

// ✅ ХОРОШО
'use client';
export default function MyComponent() {
  const [data, setData] = useState(null);
  useEffect(() => {
    loadData().then(setData);
  }, []);
  return <div>{data}</div>;
}
```

## Где искать проблему

1. **В стеке вызовов** - ищите `.tsx` файлы
2. **В компонентах** - ищите функции с `async`
3. **В JSX** - ищите вызовы функций `{function()}`
4. **В импортах** - ищите импорты из `@/lib/`

## Быстрый поиск

```bash
# Найти async функции в клиентских компонентах
grep -r "async function" src --include="*.tsx" | grep -v "//"

# Найти вызовы функций в JSX
grep -r "{[^}]*(" src --include="*.tsx"

# Найти импорты серверных модулей в клиенте
grep -r "from '@/lib/" src --include="*.tsx" | grep "'use client'"
```

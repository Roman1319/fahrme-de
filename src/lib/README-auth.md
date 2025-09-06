# Система авторизации fahrme.de

Полная система авторизации для демо-режима с localStorage и in-memory fallback, готовая для миграции на серверную авторизацию.

## 🚀 Основные возможности

### Роли и состояния
- **Гость (Guest)**: Может просматривать публичный контент, не может создавать/редактировать
- **Пользователь (User)**: Полный доступ к функциям, личные данные изолированы по userId

### Функции
- ✅ **Регистрация**: Handle + DisplayName + опционально Email/Password
- ✅ **Вход**: По handle или email
- ✅ **Переключение пользователей**: Список локальных аккаунтов
- ✅ **Выход**: Сброс сессии
- ✅ **Rate Limiting**: Защита от спама (5 входов/мин, 3 регистрации/мин)
- ✅ **Валидация**: Handle (3-30 символов), DisplayName (1-50 символов)
- ✅ **Cross-tab синхронизация**: Изменения между вкладками
- ✅ **Guards**: Защита маршрутов и действий
- ✅ **Изоляция данных**: Каждый пользователь видит только свои данные

## 📁 Архитектура

### Интерфейсы
- `src/lib/auth-service.ts` - Интерфейс AuthService
- `src/lib/local-auth-service.ts` - Реализация для демо-режима

### Компоненты
- `src/components/AuthProvider.tsx` - React контекст
- `src/components/ui/AuthModal.tsx` - Модалка входа/регистрации
- `src/components/ui/UserStatus.tsx` - Статус пользователя в хедере
- `src/components/guards/AuthGuard.tsx` - Защита маршрутов
- `src/components/ui/ProtectedAction.tsx` - Защита действий

### Хранилище (localStorage)
```
fahrme:auth:current → { userId, issuedAt }
fahrme:auth:users → Record<userId, AccountRecord>
fahrme:profile:<userId> → UserProfile
fahrme:garage:<userId> → MyCar[]
fahrme:likes:<userId> → LikeData
```

## 🔧 Использование

### Основные хуки
```tsx
import { useAuth } from '@/components/AuthProvider';

function MyComponent() {
  const { 
    user,           // Текущий пользователь
    isAuthenticated, // Авторизован ли
    isGuest,        // Гость ли
    isLoading,      // Загрузка
    signUp,         // Регистрация
    signIn,         // Вход
    signOut,        // Выход
    updateProfile,  // Обновление профиля
    getCurrentUserId // Получение userId
  } = useAuth();

  // Ваша логика
}
```

### Защита маршрутов
```tsx
import AuthGuard from '@/components/guards/AuthGuard';

function ProtectedPage() {
  return (
    <AuthGuard requireAuth={true}>
      <div>Контент только для авторизованных</div>
    </AuthGuard>
  );
}
```

### Защита действий
```tsx
import ProtectedAction from '@/components/ui/ProtectedAction';

function MyComponent() {
  const handleAction = () => {
    alert('Действие выполнено!');
  };

  return (
    <ProtectedAction action={handleAction}>
      <button>Защищенная кнопка</button>
    </ProtectedAction>
  );
}
```

### Модалка авторизации
```tsx
import AuthModal from '@/components/ui/AuthModal';

function MyComponent() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button onClick={() => setShowModal(true)}>
        Войти
      </button>
      
      <AuthModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => setShowModal(false)}
      />
    </>
  );
}
```

## 🎯 Режимы регистрации

### 1. Быстрая регистрация
```tsx
const result = await signUp({
  handle: 'username',
  displayName: 'User Name'
});
```

### 2. Полная регистрация
```tsx
const result = await signUp({
  handle: 'username',
  displayName: 'User Name',
  email: 'user@example.com',
  password: 'password123'
});
```

### 3. Вход
```tsx
// По handle
const result = await signIn({
  handle: 'username',
  password: 'password123'
});

// По email
const result = await signIn({
  email: 'user@example.com',
  password: 'password123'
});
```

## 🔒 Безопасность

### Rate Limiting
- **Вход**: Максимум 5 попыток в минуту
- **Регистрация**: Максимум 3 попытки в минуту
- **Идентификация**: По handle/email + IP (в демо - по handle/email)

### Валидация
- **Handle**: 3-30 символов, только латиница, цифры, подчеркивания
- **DisplayName**: 1-50 символов
- **Email**: Стандартная валидация email
- **Password**: В демо не проверяется (заглушка)

### Изоляция данных
- Все пользовательские данные привязаны к `userId`
- Ключи: `fahrme:profile:<userId>`, `fahrme:garage:<userId>`, etc.
- Пользователи видят только свои данные

## 🔄 Cross-tab синхронизация

Система автоматически синхронизирует изменения между вкладками:

```tsx
// В одной вкладке
signOut();

// Во всех других вкладках автоматически обновится UI
```

## 🧪 Тестирование

Посетите `/auth-demo` для тестирования всех функций:

- Регистрация и вход
- Переключение пользователей
- Защищенные действия
- Rate limiting
- Cross-tab синхронизация
- Очистка данных

## 🔮 Миграция на сервер

Система спроектирована для легкой миграции:

### 1. Замените LocalAuthService на ApiAuthService
```tsx
// src/lib/api-auth-service.ts
class ApiAuthService implements AuthService {
  async signUp(payload: SignUpPayload) {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return response.json();
  }
  
  // ... остальные методы
}

// Замените в AuthProvider
export const authService = new ApiAuthService();
```

### 2. Серверные эндпоинты
```
POST /api/auth/signup
POST /api/auth/signin
POST /api/auth/signout
GET  /api/auth/me
GET  /api/auth/users
POST /api/auth/switch
DELETE /api/auth/user/:id
```

### 3. Сессии
- HTTP-only cookies (рекомендуется)
- Или JWT + refresh tokens
- CSRF защита для cookies

### 4. База данных
```sql
-- Пользователи
CREATE TABLE users (
  id VARCHAR PRIMARY KEY,
  handle VARCHAR UNIQUE NOT NULL,
  email VARCHAR UNIQUE,
  password_hash VARCHAR,
  created_at TIMESTAMP,
  last_login_at TIMESTAMP
);

-- Профили
CREATE TABLE profiles (
  user_id VARCHAR PRIMARY KEY,
  display_name VARCHAR NOT NULL,
  bio TEXT,
  avatar_url VARCHAR,
  updated_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## 📊 Производительность

- **Оптимистичные обновления**: UI обновляется мгновенно
- **Локальное кэширование**: Данные хранятся в localStorage
- **Lazy loading**: Профили загружаются по требованию
- **Debounced saves**: Сохранение с задержкой 300-500мс

## 🐛 Обработка ошибок

- **localStorage недоступен**: Автоматический fallback на in-memory
- **Поврежденные данные**: Попытка восстановления или сброс
- **Rate limiting**: Мягкие уведомления пользователю
- **Network errors**: Retry логика и fallback

## 📝 Changelog

### v2.0.0 - Новая система авторизации
- ✅ Полная переработка системы авторизации
- ✅ Интерфейс AuthService для легкой миграции
- ✅ LocalAuthService с localStorage + in-memory fallback
- ✅ Rate limiting и валидация
- ✅ Cross-tab синхронизация
- ✅ Guards для маршрутов и действий
- ✅ Изоляция данных по userId
- ✅ Демо-страница для тестирования

### v1.0.0 - Старая система
- Базовая авторизация с email/password
- Простая система профилей
- Нет изоляции данных между пользователями

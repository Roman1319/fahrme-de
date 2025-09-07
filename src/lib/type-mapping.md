# Таблица соответствий snake_case/camelCase

## Основные несоответствия типов

### LogbookEntry
| Поле в коде (camelCase) | Поле в типах (snake_case) | Статус |
|-------------------------|---------------------------|---------|
| `allowComments` | `allow_comments` | ✅ Исправлено |
| `publishDate` | `publish_date` | ✅ Исправлено |
| `authorId` | `author_id` | ✅ Исправлено |
| `createdAt` | `created_at` | ✅ Исправлено |
| `updatedAt` | `updated_at` | ✅ Исправлено |
| `carId` | `car_id` | ✅ Исправлено |
| `text` | `content` | ✅ Исправлено |
| `userId` | `author_id` | ✅ Исправлено |

### Comment
| Поле в коде (camelCase) | Поле в типах (snake_case) | Статус |
|-------------------------|---------------------------|---------|
| `parentId` | `parent_id` | ✅ Исправлено |
| `createdAt` | `created_at` | ✅ Исправлено |
| `updatedAt` | `updated_at` | ✅ Исправлено |
| `authorId` | `author_id` | ✅ Исправлено |
| `entryId` | `entry_id` | ✅ Исправлено |
| `authorEmail` | - | ⚠️ TODO: Добавить поле |
| `author` | - | ⚠️ TODO: Добавить поле |
| `userId` | - | ⚠️ TODO: Добавить поле |

### Car
| Поле в коде (camelCase) | Поле в типах (snake_case) | Статус |
|-------------------------|---------------------------|---------|
| `ownerId` | `owner_id` | ✅ Исправлено |
| `createdAt` | `created_at` | ✅ Исправлено |
| `updatedAt` | `updated_at` | ✅ Исправлено |

### Profile
| Поле в коде (camelCase) | Поле в типах (snake_case) | Статус |
|-------------------------|---------------------------|---------|
| `avatarUrl` | `avatar_url` | ✅ Исправлено |
| `createdAt` | `created_at` | ✅ Исправлено |
| `updatedAt` | `updated_at` | ✅ Исправлено |

## Legacy поля (требуют адаптеров)

### LogbookEntry legacy поля
- `topic` - тип записи (maintenance, repair, tuning, trip, event, general)
- `images` - массив изображений
- `mileage` - пробег
- `cost` - стоимость
- `currency` - валюта
- `mileageUnit` - единица измерения пробега
- `poll` - опрос
- `pinOnCar` - закрепление на странице авто
- `language` - язык
- `status` - статус публикации
- `author` - автор (строка)
- `authorEmail` - email автора
- `timestamp` - временная метка
- `likes` - количество лайков

### Comment legacy поля
- `authorEmail` - email автора
- `author` - автор (строка)
- `userId` - ID пользователя
- `images` - массив изображений
- `likes` - количество лайков
- `replies` - массив ответов
- `isEdited` - флаг редактирования
| `editedAt` - время редактирования
- `timestamp` - временная метка

## Рекомендации

1. **Создать адаптеры** в `src/lib/adapters.ts` для преобразования между форматами
2. **Добавить недостающие поля** в типы или использовать legacy поля через `(as any)`
3. **Централизовать логику** преобразования в одном месте
4. **Постепенно мигрировать** UI компоненты на использование адаптеров
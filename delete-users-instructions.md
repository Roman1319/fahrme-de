# Инструкция по удалению пользователей

## 🗑️ Удаление всех пользователей

### Способ 1: Только пользователи
Откройте консоль браузера (F12) и выполните:

```javascript
// Удаляем всех пользователей
localStorage.removeItem("fahrme:users");
console.log("✅ Все пользователи удалены!");
```

### Способ 2: Полная очистка всех данных fahrme
Если хотите удалить ВСЕ данные приложения:

```javascript
// Находим все ключи fahrme
const fahrmeKeys = Object.keys(localStorage).filter(key => key.startsWith("fahrme:"));

console.log("Найдено ключей fahrme:", fahrmeKeys.length);
fahrmeKeys.forEach(key => {
  console.log("Удаляем:", key);
  localStorage.removeItem(key);
});

console.log("✅ Все данные fahrme очищены!");
```

### Способ 3: Проверка и удаление
Сначала посмотрите, что есть, потом удалите:

```javascript
// Проверяем текущих пользователей
const users = JSON.parse(localStorage.getItem("fahrme:users") || "[]");
console.log("Текущие пользователи:", users);

// Удаляем
localStorage.removeItem("fahrme:users");

// Проверяем результат
const remainingUsers = JSON.parse(localStorage.getItem("fahrme:users") || "[]");
console.log("Осталось пользователей:", remainingUsers.length);
```

## 🔍 Проверка результата

После удаления проверьте:

```javascript
// Проверяем, что пользователи удалены
const users = JSON.parse(localStorage.getItem("fahrme:users") || "[]");
console.log("Пользователей осталось:", users.length);

// Проверяем все ключи fahrme
const fahrmeKeys = Object.keys(localStorage).filter(key => key.startsWith("fahrme:"));
console.log("Ключи fahrme:", fahrmeKeys);
```

## ⚠️ Важно

- После удаления пользователей нужно будет **зарегистрироваться заново**
- Все **личные данные** (профили, машины, записи) также будут удалены
- Это действие **необратимо** - данные нельзя восстановить

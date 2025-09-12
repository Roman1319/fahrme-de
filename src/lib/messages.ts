// Messages module - заглушка для совместимости
// Планируется реализация полноценной системы сообщений с Supabase

export interface Message {
  id: string;
  from: "me" | string;
  body: string;
  timestamp: number;
}

export interface Thread {
  id: string;
  with: string;
  messages: Message[];
  unread: number;
}

// Заглушки функций для MessagesButton
export function unreadCount(): number {
  // В режиме отладки возвращаем тестовое значение
  if (process.env.NEXT_PUBLIC_DEBUG === '1') {
    return 3; // Тестовое количество непрочитанных
  }
  return 0;
}

export function seedDemo(): void {
  // Заглушка для демо-данных
  console.log('Messages: seedDemo called (заглушка)');
}

// Заглушки функций для MessagesPage
export function allThreads(): Thread[] {
  // В режиме отладки возвращаем тестовые данные
  if (process.env.NEXT_PUBLIC_DEBUG === '1') {
    return [
      {
        id: '1',
        with: 'Max Mustermann',
        messages: [
          {
            id: '1',
            from: 'Max Mustermann',
            body: 'Hallo! Wie geht es dir?',
            timestamp: Date.now() - 3600000
          },
          {
            id: '2',
            from: 'me',
            body: 'Gut, danke! Und dir?',
            timestamp: Date.now() - 1800000
          }
        ],
        unread: 1
      },
      {
        id: '2',
        with: 'Anna Schmidt',
        messages: [
          {
            id: '3',
            from: 'Anna Schmidt',
            body: 'Hast du das neue Auto gesehen?',
            timestamp: Date.now() - 7200000
          }
        ],
        unread: 0
      }
    ];
  }
  return [];
}

export function markThreadRead(threadId: string): void {
  // Заглушка для отметки о прочтении
  console.log(`Messages: markThreadRead called for thread ${threadId} (заглушка)`);
}

export function send(to: string, message: string): void {
  // Заглушка для отправки сообщения
  console.log(`Messages: send called to ${to}: ${message} (заглушка)`);
  // В реальной реализации здесь будет вызов API Supabase
}

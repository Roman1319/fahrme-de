"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import * as N from '@/lib/notifications';

export default function DebugNotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<N.Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testMessage, setTestMessage] = useState('');

  const loadNotifications = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const [notificationsData, unreadCountData] = await Promise.all([
        N.list(user.id),
        N.unreadCount(user.id)
      ]);
      
      setNotifications(notificationsData);
      setUnreadCount(unreadCountData);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const createTestNotification = async () => {
    if (!user || !testMessage.trim()) return;
    
    try {
      await N.push(user.id, {
        type: 'system',
        title: 'Test Notification',
        body: testMessage,
        href: '/debug/notifications'
      });
      
      setTestMessage('');
      await loadNotifications();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const markAllRead = async () => {
    if (!user) return;
    
    try {
      await N.markAllRead(user.id);
      await loadNotifications();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const markAsRead = async (id: string) => {
    if (!user) return;
    
    try {
      await N.markRead(user.id, id);
      await loadNotifications();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  // Подписка на realtime обновления
  useEffect(() => {
    if (!user) return;

    const unsubscribe = N.subscribe(user.id, () => {
      console.log('[Debug Notifications] Realtime update received');
      loadNotifications();
    });

    return unsubscribe;
  }, [user]);

  // Загрузка данных при изменении пользователя
  useEffect(() => {
    loadNotifications();
  }, [user]);

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Notifications Debug</h1>
        <div>Please log in to test notifications</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">Notifications Debug</h1>
      
      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg p-4 mb-4">
          <div className="text-red-800 dark:text-red-200">Error: {error}</div>
        </div>
      )}

      {/* Test Controls */}
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-4">Test Controls</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Create Test Notification:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Enter test message..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <button
                onClick={createTestNotification}
                disabled={!testMessage.trim()}
                className="btn-primary"
              >
                Create
              </button>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={loadNotifications}
              disabled={loading}
              className="btn-secondary"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
            <button
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className="btn-secondary"
            >
              Mark All Read
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">Statistics</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>Total Notifications: {notifications.length}</div>
          <div>Unread Count: {unreadCount}</div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Notifications</h2>
        
        {notifications.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400 text-center py-8">
            No notifications yet
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border ${
                  notification.read 
                    ? 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600' 
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{notification.title}</span>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                    </div>
                    {notification.body && (
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        {notification.body}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      {new Date(notification.createdAt).toLocaleString()}
                    </div>
                  </div>
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

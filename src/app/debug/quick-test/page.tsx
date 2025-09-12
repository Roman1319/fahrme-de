"use client";

import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { StorageImage, StorageImg } from '@/components/ui/StorageImage';
import { getAvatarImage, getLogbookImage } from '@/lib/storage-helpers';
import * as N from '@/lib/notifications';

export default function QuickTestPage() {
  const { user } = useAuth();
  const [testMessage, setTestMessage] = useState('Test notification from quick test');
  const [notifications, setNotifications] = useState<N.Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const testNotification = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await N.push(user.id, {
        type: 'system',
        title: 'Quick Test',
        body: testMessage,
        href: '/debug/quick-test'
      });
      
      // Refresh notifications
      const updatedNotifications = await N.list(user.id);
      setNotifications(updatedNotifications);
    } catch (error) {
      console.error('Error creating notification:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshNotifications = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const updatedNotifications = await N.list(user.id);
      setNotifications(updatedNotifications);
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Test images
  const testImages = [
    {
      name: 'Avatar Placeholder',
      image: getAvatarImage(null),
      component: 'StorageImage'
    },
    {
      name: 'Logbook Placeholder',
      image: getLogbookImage(null),
      component: 'StorageImg'
    }
  ];

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Quick Test</h1>
      
      {!user && (
        <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4 mb-6">
          <div className="text-yellow-800 dark:text-yellow-200">
            Please log in to test notifications and other features.
          </div>
        </div>
      )}

      {/* Image Tests */}
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-4">Image Component Tests</h2>
        <div className="grid grid-cols-2 gap-4">
          {testImages.map((test, index) => (
            <div key={index} className="text-center">
              <div className="text-sm font-medium mb-2">{test.name}</div>
              <div className="w-32 h-24 border border-gray-300 dark:border-gray-600 rounded overflow-hidden mx-auto">
                {test.component === 'StorageImage' ? (
                  <StorageImage
                    image={test.image}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <StorageImg
                    image={test.image}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notification Tests */}
      {user && (
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-6">
          <h2 className="text-lg font-semibold mb-4">Notification Tests</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Test Message:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <button
                  onClick={testNotification}
                  disabled={loading || !testMessage.trim()}
                  className="btn-primary"
                >
                  {loading ? 'Creating...' : 'Create Notification'}
                </button>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={refreshNotifications}
                disabled={loading}
                className="btn-secondary"
              >
                Refresh Notifications
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications List */}
      {user && (
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Recent Notifications</h2>
          
          {notifications.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-400 text-center py-4">
              No notifications yet. Create one above!
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.slice(0, 5).map((notification) => (
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Links */}
      <div className="mt-8 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Quick Links</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <a href="/debug/smoke-test" className="text-blue-600 dark:text-blue-400 hover:underline">
            Full Smoke Test
          </a>
          <a href="/debug/feed" className="text-blue-600 dark:text-blue-400 hover:underline">
            Feed Debug
          </a>
          <a href="/debug/notifications" className="text-blue-600 dark:text-blue-400 hover:underline">
            Notifications Debug
          </a>
          <a href="/feed" className="text-blue-600 dark:text-blue-400 hover:underline">
            Feed Page
          </a>
        </div>
      </div>
    </div>
  );
}

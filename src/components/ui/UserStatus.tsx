'use client';

import { useState } from 'react';
import { LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import AuthModal from './AuthModal';

export default function UserStatus() {
  const { user, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = () => {
    logout();
    setShowUserMenu(false);
  };

  // If no user, show login/register buttons
  if (!user) {
    return (
      <>
        <a href="/login" className="btn-ghost">Einloggen</a>
        <a href="/register" className="btn-accent">Registrieren</a>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode="signin"
        />
      </>
    );
  }

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
            {user.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span className="hidden sm:block">{user.name || 'User'}</span>
        </button>

        {/* Выпадающее меню */}
        {showUserMenu && (
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {user.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {user.email}
                  </div>
                </div>
              </div>
            </div>

            <div className="py-1">
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  // Переход к настройкам профиля
                  window.location.href = '/profile';
                }}
                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Settings size={16} />
                Настройки профиля
              </button>

              <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <LogOut size={16} />
                Выйти
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Модалка входа/регистрации */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="signin"
      />
    </>
  );
}

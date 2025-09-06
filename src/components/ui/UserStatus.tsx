'use client';

import { useState } from 'react';
import { User, LogOut, Settings, Users, Trash2 } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import AuthModal from './AuthModal';

export default function UserStatus() {
  const { user, isAuthenticated, isGuest, signOut, getUsers, switchUser, deleteUser, clearAllData } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  const handleSignOut = () => {
    signOut();
    setShowUserMenu(false);
  };

  const handleSwitchUser = (userId: string) => {
    if (switchUser(userId)) {
      setShowSwitchModal(false);
      setShowUserMenu(false);
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Удалить этого пользователя? Все его данные будут потеряны.')) {
      deleteUser(userId);
      setShowSwitchModal(false);
      setShowUserMenu(false);
    }
  };

  const handleClearAllData = () => {
    if (confirm('Очистить ВСЕ данные? Это действие нельзя отменить.')) {
      clearAllData();
      setShowUserMenu(false);
    }
  };

  const openSwitchModal = () => {
    setUsers(getUsers());
    setShowSwitchModal(true);
    setShowUserMenu(false);
  };

  if (isGuest) {
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

  if (!user) return null;

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.displayName}
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
              {user.displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="hidden sm:block">{user.displayName}</span>
        </button>

        {/* Выпадающее меню */}
        {showUserMenu && (
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {user.displayName}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    @{user.handle}
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

              <button
                onClick={openSwitchModal}
                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Users size={16} />
                Сменить пользователя
              </button>

              <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

              <button
                onClick={handleClearAllData}
                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 size={16} />
                Очистить все данные
              </button>

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

      {/* Модалка смены пользователя */}
      <AuthModal
        isOpen={showSwitchModal}
        onClose={() => setShowSwitchModal(false)}
        initialMode="switch"
      />

      {/* Модалка входа/регистрации */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="signin"
      />
    </>
  );
}

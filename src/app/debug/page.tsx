'use client';

import { useState, useEffect } from 'react';
import { Bug, Shield, User, Database, TestTube, AlertTriangle, CheckCircle, XCircle, Settings } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabaseClient';

interface SystemStatus {
  database: 'connected' | 'disconnected' | 'error';
  auth: 'ready' | 'not_ready' | 'error';
  rls: 'enabled' | 'disabled' | 'unknown';
  lastCheck: string;
}

export default function DebugPage() {
  const { user, isAuthenticated, authReady } = useAuth();
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkSystemStatus();
  }, [user, isAuthenticated, authReady]);

  const checkSystemStatus = async () => {
    try {
      setIsLoading(true);

      // Проверить подключение к БД
      let databaseStatus: 'connected' | 'disconnected' | 'error' = 'disconnected';
      try {
        const { error } = await supabase.from('profiles').select('id').limit(1);
        databaseStatus = error ? 'error' : 'connected';
      } catch (e) {
        databaseStatus = 'error';
      }

      // Проверить статус аутентификации
      let authStatus: 'ready' | 'not_ready' | 'error' = 'not_ready';
      try {
        const { error } = await supabase.auth.getUser();
        authStatus = error ? 'error' : 'ready';
      } catch (e) {
        authStatus = 'error';
      }

      // Проверить RLS
      let rlsStatus: 'enabled' | 'disabled' | 'unknown' = 'unknown';
      try {
        const { data, error } = await supabase
          .from('pg_tables')
          .select('rowsecurity')
          .eq('schemaname', 'public')
          .limit(1);
        
        if (!error && data) {
          rlsStatus = data[0]?.rowsecurity ? 'enabled' : 'disabled';
        }
      } catch (e) {
        rlsStatus = 'unknown';
      }

      setSystemStatus({
        database: databaseStatus,
        auth: authStatus,
        rls: rlsStatus,
        lastCheck: new Date().toLocaleTimeString()
      });
    } catch (error) {
      console.error('Error checking system status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'ready':
      case 'enabled':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'disconnected':
      case 'not_ready':
      case 'disabled':
        return <XCircle size={16} className="text-red-500" />;
      case 'error':
        return <AlertTriangle size={16} className="text-red-500" />;
      case 'unknown':
        return <AlertTriangle size={16} className="text-yellow-500" />;
      default:
        return <AlertTriangle size={16} className="text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'ready':
      case 'enabled':
        return 'text-green-500';
      case 'disconnected':
      case 'not_ready':
      case 'disabled':
        return 'text-red-500';
      case 'error':
        return 'text-red-500';
      case 'unknown':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  };

  const debugTools = [
    {
      title: 'RLS Диагностика',
      description: 'Тестирование Row Level Security и сессий',
      href: '/debug/rls',
      icon: Shield,
      color: 'bg-blue-500'
    },
    {
      title: 'Диагностика сессии',
      description: 'Детальная информация о текущей сессии',
      href: '/debug/session',
      icon: User,
      color: 'bg-green-500'
    },
    {
      title: 'Конфигурация',
      description: 'Проверка переменных окружения и конфигурации',
      href: '/debug/config',
      icon: Settings,
      color: 'bg-purple-500'
    }
  ];

  return (
    <main className="pb-12">
      <div className="space-y-6">
        {/* Header */}
        <div className="section">
          <div className="flex items-center gap-3 mb-4">
            <Bug size={24} className="text-[#6A3FFB]" />
            <h1 className="h1">Отладка системы</h1>
          </div>
          <p className="opacity-70 text-sm">
            Инструменты для диагностики и отладки проблем с аутентификацией, RLS и подключением к базе данных
          </p>
        </div>

        {/* System Status */}
        <div className="section">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TestTube size={20} className="text-[#6A3FFB]" />
              <h2 className="text-lg font-bold">Статус системы</h2>
            </div>
            <button
              onClick={checkSystemStatus}
              disabled={isLoading}
              className="btn-secondary flex items-center gap-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Database size={16} />
              )}
              Обновить
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span className="ml-2 opacity-70">Проверка статуса...</span>
            </div>
          ) : systemStatus ? (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(systemStatus.database)}
                  <h3 className="font-semibold">База данных</h3>
                </div>
                <p className={`text-sm ${getStatusColor(systemStatus.database)}`}>
                  {systemStatus.database === 'connected' && 'Подключена'}
                  {systemStatus.database === 'disconnected' && 'Отключена'}
                  {systemStatus.database === 'error' && 'Ошибка подключения'}
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(systemStatus.auth)}
                  <h3 className="font-semibold">Аутентификация</h3>
                </div>
                <p className={`text-sm ${getStatusColor(systemStatus.auth)}`}>
                  {systemStatus.auth === 'ready' && 'Готова'}
                  {systemStatus.auth === 'not_ready' && 'Не готова'}
                  {systemStatus.auth === 'error' && 'Ошибка'}
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(systemStatus.rls)}
                  <h3 className="font-semibold">RLS</h3>
                </div>
                <p className={`text-sm ${getStatusColor(systemStatus.rls)}`}>
                  {systemStatus.rls === 'enabled' && 'Включен'}
                  {systemStatus.rls === 'disabled' && 'Отключен'}
                  {systemStatus.rls === 'unknown' && 'Неизвестно'}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-red-500">
              Ошибка проверки статуса системы
            </div>
          )}

          {systemStatus && (
            <div className="mt-4 text-xs opacity-70 text-center">
              Последняя проверка: {systemStatus.lastCheck}
            </div>
          )}
        </div>

        {/* Current User Info */}
        <div className="section">
          <div className="flex items-center gap-2 mb-4">
            <User size={20} className="text-[#6A3FFB]" />
            <h2 className="text-lg font-bold">Текущий пользователь</h2>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            {isAuthenticated && user ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  <span className="text-green-500">Аутентифицирован</span>
                </div>
                <div className="text-sm space-y-1">
                  <div><span className="opacity-70">ID:</span> <span className="font-mono text-xs">{user.id}</span></div>
                  <div><span className="opacity-70">Email:</span> {user.email}</div>
                  <div><span className="opacity-70">Handle:</span> {user.user_metadata?.handle || 'Не установлен'}</div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <XCircle size={16} className="text-red-500" />
                <span className="text-red-500">Не аутентифицирован</span>
              </div>
            )}
          </div>
        </div>

        {/* Debug Tools */}
        <div className="section">
          <div className="flex items-center gap-2 mb-4">
            <Bug size={20} className="text-[#6A3FFB]" />
            <h2 className="text-lg font-bold">Инструменты отладки</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {debugTools.map((tool, index) => {
              const Icon = tool.icon;
              return (
                <a
                  key={index}
                  href={tool.href}
                  className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`${tool.color} p-2 rounded-lg`}>
                      <Icon size={20} className="text-white" />
                    </div>
                    <h3 className="font-semibold group-hover:text-[#6A3FFB] transition-colors">
                      {tool.title}
                    </h3>
                  </div>
                  <p className="text-sm opacity-70">{tool.description}</p>
                </a>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="section">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={20} className="text-[#6A3FFB]" />
            <h2 className="text-lg font-bold">Быстрые действия</h2>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <button
              onClick={() => window.location.href = '/login'}
              className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-left"
            >
              <h3 className="font-semibold mb-1">Войти в систему</h3>
              <p className="text-sm opacity-70">Перейти на страницу входа</p>
            </button>

            <button
              onClick={() => window.location.href = '/register'}
              className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-left"
            >
              <h3 className="font-semibold mb-1">Регистрация</h3>
              <p className="text-sm opacity-70">Создать новый аккаунт</p>
            </button>

            <button
              onClick={() => window.location.href = '/feed'}
              className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-left"
            >
              <h3 className="font-semibold mb-1">Проверить ленту</h3>
              <p className="text-sm opacity-70">Тестирование основного функционала</p>
            </button>

            <button
              onClick={() => window.location.href = '/my-cars'}
              className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-left"
            >
              <h3 className="font-semibold mb-1">Проверить машины</h3>
              <p className="text-sm opacity-70">Тестирование доступа к машинам</p>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

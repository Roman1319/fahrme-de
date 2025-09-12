'use client';

import { useState, useEffect } from 'react';
import { User, Shield, Database, Clock, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabaseClient';

interface SessionDetails {
  user: { id: string; email?: string } | null;
  session: { access_token?: string; refresh_token?: string } | null;
  isAuthenticated: boolean;
  authReady: boolean;
  role: string;
  permissions: string[];
  tokenInfo: {
    exp: number;
    iat: number;
    iss: string;
    sub: string;
  } | null;
  rlsEnabled: boolean;
  policies: string[];
}

export default function SessionDebugPage() {
  const { user, isAuthenticated, authReady } = useAuth();
  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSessionDetails();
  }, [user, isAuthenticated, authReady]);

  const loadSessionDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Получить детальную информацию о сессии
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (userError || sessionError) {
        throw new Error(`Ошибка получения сессии: ${userError?.message || sessionError?.message}`);
      }

      // Проверить RLS статус
      const { data: rlsData, error: rlsError } = await supabase
        .from('pg_tables')
        .select('tablename, rowsecurity')
        .eq('schemaname', 'public')
        .limit(10);

      const rlsEnabled = !rlsError && rlsData?.some(table => table.rowsecurity);
      const policies: string[] = [];

      // Получить информацию о токене
      let tokenInfo = null;
      if (session?.access_token) {
        try {
          const payload = JSON.parse(atob(session.access_token.split('.')[1]));
          tokenInfo = {
            exp: payload.exp,
            iat: payload.iat,
            iss: payload.iss,
            sub: payload.sub
          };
        } catch (e) {
          console.warn('Не удалось декодировать токен:', e);
        }
      }

      // Определить разрешения
      const permissions = [];
      if (currentUser) {
        permissions.push('authenticated');
        
        // Проверить роль
        const role = session?.user?.app_metadata?.role || 'user';
        permissions.push(`role:${role}`);
        
        // Проверить дополнительные разрешения
        if (session?.user?.app_metadata?.admin) {
          permissions.push('admin');
        }
        if (session?.user?.app_metadata?.moderator) {
          permissions.push('moderator');
        }
      } else {
        permissions.push('anonymous');
      }

      setSessionDetails({
        user: currentUser,
        session,
        isAuthenticated: !!currentUser,
        authReady: !userError,
        role: session?.user?.app_metadata?.role || 'user',
        permissions,
        tokenInfo,
        rlsEnabled: !!rlsEnabled,
        policies
      });
    } catch (err) {
      console.error('Error loading session details:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Error refreshing session:', error);
      } else {
        console.log('Session refreshed successfully');
        await loadSessionDetails();
      }
    } catch (err) {
      console.error('Error refreshing session:', err);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      await loadSessionDetails();
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getTimeUntilExpiry = (exp: number) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = exp - now;
    
    if (diff <= 0) return 'Истек';
    
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    
    if (hours > 0) return `${hours}ч ${minutes}м ${seconds}с`;
    if (minutes > 0) return `${minutes}м ${seconds}с`;
    return `${seconds}с`;
  };

  if (isLoading) {
    return (
      <main className="pb-12">
        <div className="section">
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin opacity-50" />
            <span className="ml-2 opacity-70">Загрузка информации о сессии...</span>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="pb-12">
        <div className="section">
          <div className="text-center py-16">
            <XCircle size={48} className="mx-auto mb-4 text-red-500" />
            <h1 className="text-xl font-bold mb-2">Ошибка загрузки</h1>
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={loadSessionDetails}
              className="btn-primary"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="pb-12">
      <div className="space-y-6">
        {/* Header */}
        <div className="section">
          <div className="flex items-center gap-3 mb-4">
            <User size={24} className="text-[#6A3FFB]" />
            <h1 className="h1">Диагностика сессии</h1>
          </div>
          <p className="opacity-70 text-sm">
            Детальная информация о текущей сессии и аутентификации
          </p>
        </div>

        {/* Session Status */}
        <div className="section">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={20} className="text-[#6A3FFB]" />
            <h2 className="text-lg font-bold">Статус сессии</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle size={16} className={sessionDetails?.isAuthenticated ? 'text-green-500' : 'text-red-500'} />
                Аутентификация
              </h3>
              <p className={`text-sm ${sessionDetails?.isAuthenticated ? 'text-green-500' : 'text-red-500'}`}>
                {sessionDetails?.isAuthenticated ? 'Аутентифицирован' : 'Не аутентифицирован'}
              </p>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Clock size={16} className={sessionDetails?.authReady ? 'text-green-500' : 'text-red-500'} />
                Готовность
              </h3>
              <p className={`text-sm ${sessionDetails?.authReady ? 'text-green-500' : 'text-red-500'}`}>
                {sessionDetails?.authReady ? 'Готов' : 'Не готов'}
              </p>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Database size={16} className={sessionDetails?.rlsEnabled ? 'text-green-500' : 'text-yellow-500'} />
                RLS
              </h3>
              <p className={`text-sm ${sessionDetails?.rlsEnabled ? 'text-green-500' : 'text-yellow-500'}`}>
                {sessionDetails?.rlsEnabled ? 'Включен' : 'Не определен'}
              </p>
            </div>
          </div>
        </div>

        {/* User Details */}
        {sessionDetails?.user && (
          <div className="section">
            <div className="flex items-center gap-2 mb-4">
              <User size={20} className="text-[#6A3FFB]" />
              <h2 className="text-lg font-bold">Информация о пользователе</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Основная информация</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="opacity-70">ID:</span>
                    <span className="font-mono text-xs">{sessionDetails.user.id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="opacity-70">Email:</span>
                    <span>{sessionDetails.user.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="opacity-70">Роль:</span>
                    <span className="text-[#6A3FFB]">{sessionDetails.role}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="opacity-70">Handle:</span>
                    <span>{sessionDetails.user.user_metadata?.handle || 'Не установлен'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Разрешения</h3>
                <div className="space-y-2">
                  {sessionDetails.permissions.map((permission, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-green-500" />
                      <span className="text-sm">{permission}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Token Information */}
        {sessionDetails?.tokenInfo && (
          <div className="section">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={20} className="text-[#6A3FFB]" />
              <h2 className="text-lg font-bold">Информация о токене</h2>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="opacity-70">Выдан:</span>
                    <span>{formatTimestamp(sessionDetails.tokenInfo.iat)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="opacity-70">Истекает:</span>
                    <span>{formatTimestamp(sessionDetails.tokenInfo.exp)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="opacity-70">Осталось:</span>
                    <span className={getTimeUntilExpiry(sessionDetails.tokenInfo.exp).includes('Истек') ? 'text-red-500' : 'text-green-500'}>
                      {getTimeUntilExpiry(sessionDetails.tokenInfo.exp)}
                    </span>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="opacity-70">Issuer:</span>
                    <span className="font-mono text-xs">{sessionDetails.tokenInfo.iss}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="opacity-70">Subject:</span>
                    <span className="font-mono text-xs">{sessionDetails.tokenInfo.sub}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Session Actions */}
        <div className="section">
          <div className="flex items-center gap-2 mb-4">
            <Database size={20} className="text-[#6A3FFB]" />
            <h2 className="text-lg font-bold">Действия с сессией</h2>
          </div>

          <div className="flex gap-3">
            <button
              onClick={refreshSession}
              className="btn-primary flex items-center gap-2"
            >
              <Clock size={16} />
              Обновить сессию
            </button>
            <button
              onClick={loadSessionDetails}
              className="btn-secondary flex items-center gap-2"
            >
              <Database size={16} />
              Перезагрузить данные
            </button>
            {sessionDetails?.isAuthenticated && (
              <button
                onClick={signOut}
                className="btn-secondary flex items-center gap-2"
              >
                <XCircle size={16} />
                Выйти
              </button>
            )}
          </div>
        </div>

        {/* Raw Session Data */}
        <div className="section">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={20} className="text-[#6A3FFB]" />
            <h2 className="text-lg font-bold">Сырые данные сессии</h2>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <details>
              <summary className="cursor-pointer font-semibold mb-2">
                Показать/скрыть детали
              </summary>
              <pre className="text-xs overflow-x-auto bg-black/20 p-4 rounded">
                {JSON.stringify(sessionDetails, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      </div>
    </main>
  );
}

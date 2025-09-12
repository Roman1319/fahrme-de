'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Loader2, User, Shield, Database, TestTube } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabaseClient';
import RLSDiagnostics from '@/components/debug/RLSDiagnostics';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: string;
  timestamp: string;
}

interface SessionInfo {
  user: any;
  isAuthenticated: boolean;
  authReady: boolean;
  role: string;
  permissions: string[];
}

export default function RLSDebugPage() {
  const { user, isAuthenticated, authReady } = useAuth();
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  useEffect(() => {
    loadSessionInfo();
  }, [user, isAuthenticated, authReady]);

  const loadSessionInfo = async () => {
    try {
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      const permissions = [];
      if (currentUser) {
        // Проверить базовые разрешения
        permissions.push('authenticated');
        
        // Проверить роль (если есть)
        const role = session?.user?.app_metadata?.role || 'user';
        permissions.push(`role:${role}`);
      } else {
        permissions.push('anonymous');
      }

      setSessionInfo({
        user: currentUser,
        isAuthenticated: !!currentUser,
        authReady: !authError,
        role: session?.user?.app_metadata?.role || 'user',
        permissions
      });
    } catch (error) {
      console.error('Error loading session info:', error);
      setSessionInfo({
        user: null,
        isAuthenticated: false,
        authReady: false,
        role: 'unknown',
        permissions: ['error']
      });
    }
  };

  const addTestResult = (result: Omit<TestResult, 'timestamp'>) => {
    const newResult: TestResult = {
      ...result,
      timestamp: new Date().toLocaleTimeString()
    };
    setTestResults(prev => [newResult, ...prev]);
  };

  const runRLSTests = async () => {
    setIsRunningTests(true);
    setTestResults([]);

    // Тест 1: Чтение профилей
    try {
      addTestResult({
        name: 'Чтение профилей',
        status: 'pending',
        message: 'Попытка чтения таблицы profiles...'
      });

      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, handle')
        .limit(1);

      if (error) {
        addTestResult({
          name: 'Чтение профилей',
          status: 'error',
          message: `Ошибка: ${error.message}`,
          details: `Код: ${error.code}, Детали: ${JSON.stringify(error.details)}`
        });
      } else {
        addTestResult({
          name: 'Чтение профилей',
          status: 'success',
          message: `Успешно прочитано ${data?.length || 0} записей`,
          details: data ? `Пример: ${JSON.stringify(data[0])}` : 'Нет данных'
        });
      }
    } catch (error) {
      addTestResult({
        name: 'Чтение профилей',
        status: 'error',
        message: `Исключение: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // Тест 2: Чтение машин
    try {
      addTestResult({
        name: 'Чтение машин',
        status: 'pending',
        message: 'Попытка чтения таблицы cars...'
      });

      const { data, error } = await supabase
        .from('cars')
        .select('id, brand, model, year, owner_id')
        .limit(1);

      if (error) {
        addTestResult({
          name: 'Чтение машин',
          status: 'error',
          message: `Ошибка: ${error.message}`,
          details: `Код: ${error.code}, Детали: ${JSON.stringify(error.details)}`
        });
      } else {
        addTestResult({
          name: 'Чтение машин',
          status: 'success',
          message: `Успешно прочитано ${data?.length || 0} записей`,
          details: data ? `Пример: ${JSON.stringify(data[0])}` : 'Нет данных'
        });
      }
    } catch (error) {
      addTestResult({
        name: 'Чтение машин',
        status: 'error',
        message: `Исключение: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // Тест 3: Запись в car_photos (если аутентифицирован)
    if (isAuthenticated && user) {
      try {
        addTestResult({
          name: 'Запись в car_photos',
          status: 'pending',
          message: 'Попытка записи в таблицу car_photos...'
        });

        // Сначала найдем машину пользователя
        const { data: userCars } = await supabase
          .from('cars')
          .select('id')
          .eq('owner_id', user.id)
          .limit(1);

        if (userCars && userCars.length > 0) {
          const { data, error } = await supabase
            .from('car_photos')
            .insert({
              car_id: userCars[0].id,
              storage_path: 'debug/test-photo.jpg',
              sort: 999
            })
            .select();

          if (error) {
            addTestResult({
              name: 'Запись в car_photos',
              status: 'error',
              message: `Ошибка записи: ${error.message}`,
              details: `Код: ${error.code}, Детали: ${JSON.stringify(error.details)}`
            });
          } else {
            addTestResult({
              name: 'Запись в car_photos',
              status: 'success',
              message: 'Успешно создана запись',
              details: `ID: ${data?.[0]?.id}`
            });

            // Удалить тестовую запись
            if (data?.[0]?.id) {
              await supabase
                .from('car_photos')
                .delete()
                .eq('id', data[0].id);
            }
          }
        } else {
          addTestResult({
            name: 'Запись в car_photos',
            status: 'error',
            message: 'Нет машин пользователя для тестирования',
            details: 'Создайте машину для тестирования записи'
          });
        }
      } catch (error) {
        addTestResult({
          name: 'Запись в car_photos',
          status: 'error',
          message: `Исключение: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    } else {
      addTestResult({
        name: 'Запись в car_photos',
        status: 'error',
        message: 'Не аутентифицирован',
        details: 'Войдите в систему для тестирования записи'
      });
    }

    // Тест 4: Запись в logbook_entries (если аутентифицирован)
    if (isAuthenticated && user) {
      try {
        addTestResult({
          name: 'Запись в logbook_entries',
          status: 'pending',
          message: 'Попытка записи в таблицу logbook_entries...'
        });

        // Сначала найдем машину пользователя
        const { data: userCars } = await supabase
          .from('cars')
          .select('id')
          .eq('owner_id', user.id)
          .limit(1);

        if (userCars && userCars.length > 0) {
          const { data, error } = await supabase
            .from('logbook_entries')
            .insert({
              car_id: userCars[0].id,
              author_id: user.id,
              title: 'Debug Test Entry',
              content: 'This is a test entry for debugging RLS',
              topic: 'general',
              allow_comments: true,
              publish_date: new Date().toISOString()
            })
            .select();

          if (error) {
            addTestResult({
              name: 'Запись в logbook_entries',
              status: 'error',
              message: `Ошибка записи: ${error.message}`,
              details: `Код: ${error.code}, Детали: ${JSON.stringify(error.details)}`
            });
          } else {
            addTestResult({
              name: 'Запись в logbook_entries',
              status: 'success',
              message: 'Успешно создана запись',
              details: `ID: ${data?.[0]?.id}`
            });

            // Удалить тестовую запись
            if (data?.[0]?.id) {
              await supabase
                .from('logbook_entries')
                .delete()
                .eq('id', data[0].id);
            }
          }
        } else {
          addTestResult({
            name: 'Запись в logbook_entries',
            status: 'error',
            message: 'Нет машин пользователя для тестирования',
            details: 'Создайте машину для тестирования записи'
          });
        }
      } catch (error) {
        addTestResult({
          name: 'Запись в logbook_entries',
          status: 'error',
          message: `Исключение: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    } else {
      addTestResult({
        name: 'Запись в logbook_entries',
        status: 'error',
        message: 'Не аутентифицирован',
        details: 'Войдите в систему для тестирования записи'
      });
    }

    // Тест 5: RPC функции
    try {
      addTestResult({
        name: 'RPC feed_explore',
        status: 'pending',
        message: 'Попытка вызова RPC функции feed_explore...'
      });

      const { data, error } = await supabase.rpc('feed_explore', {
        p_limit: 1,
        p_offset: 0
      });

      if (error) {
        addTestResult({
          name: 'RPC feed_explore',
          status: 'error',
          message: `Ошибка RPC: ${error.message}`,
          details: `Код: ${error.code}, Детали: ${JSON.stringify(error.details)}`
        });
      } else {
        addTestResult({
          name: 'RPC feed_explore',
          status: 'success',
          message: `RPC успешно выполнена, получено ${data?.length || 0} записей`,
          details: data ? `Пример: ${JSON.stringify(data[0])}` : 'Нет данных'
        });
      }
    } catch (error) {
      addTestResult({
        name: 'RPC feed_explore',
        status: 'error',
        message: `Исключение RPC: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    setIsRunningTests(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'error':
        return <XCircle size={16} className="text-red-500" />;
      case 'pending':
        return <Loader2 size={16} className="animate-spin text-blue-500" />;
      default:
        return <AlertTriangle size={16} className="text-yellow-500" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-500/10 border-green-500/20 text-green-500';
      case 'error':
        return 'bg-red-500/10 border-red-500/20 text-red-500';
      case 'pending':
        return 'bg-blue-500/10 border-blue-500/20 text-blue-500';
      default:
        return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500';
    }
  };

  return (
    <main className="pb-12">
      <div className="space-y-6">
        {/* Header */}
        <div className="section">
          <div className="flex items-center gap-3 mb-4">
            <TestTube size={24} className="text-[#6A3FFB]" />
            <h1 className="h1">RLS Диагностика</h1>
          </div>
          <p className="opacity-70 text-sm">
            Диагностика Row Level Security (RLS) и сессий для быстрого выявления проблем
          </p>
        </div>

        {/* Session Info */}
        <div className="section">
          <div className="flex items-center gap-2 mb-4">
            <User size={20} className="text-[#6A3FFB]" />
            <h2 className="text-lg font-bold">Информация о сессии</h2>
          </div>

          {sessionInfo ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Статус аутентификации</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="opacity-70">Готовность:</span>
                    <span className={sessionInfo.authReady ? 'text-green-500' : 'text-red-500'}>
                      {sessionInfo.authReady ? 'Готов' : 'Не готов'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="opacity-70">Аутентифицирован:</span>
                    <span className={sessionInfo.isAuthenticated ? 'text-green-500' : 'text-red-500'}>
                      {sessionInfo.isAuthenticated ? 'Да' : 'Нет'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="opacity-70">Роль:</span>
                    <span className="text-[#6A3FFB]">{sessionInfo.role}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Пользователь</h3>
                {sessionInfo.user ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="opacity-70">ID:</span>
                      <span className="font-mono text-xs">{sessionInfo.user.id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="opacity-70">Email:</span>
                      <span>{sessionInfo.user.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="opacity-70">Handle:</span>
                      <span>{sessionInfo.user.user_metadata?.handle || 'Не установлен'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-red-500 text-sm">Пользователь не найден</div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin opacity-50" />
              <span className="ml-2 opacity-70">Загрузка информации о сессии...</span>
            </div>
          )}
        </div>

        {/* RLS Tests */}
        <div className="section">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield size={20} className="text-[#6A3FFB]" />
              <h2 className="text-lg font-bold">Тесты RLS</h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={runRLSTests}
                disabled={isRunningTests}
                className="btn-primary flex items-center gap-2"
              >
                {isRunningTests ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <TestTube size={16} />
                )}
                {isRunningTests ? 'Выполняется...' : 'Запустить тесты'}
              </button>
              <button
                onClick={clearResults}
                disabled={isRunningTests}
                className="btn-secondary"
              >
                Очистить
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {testResults.length === 0 ? (
              <div className="text-center py-8 text-sm opacity-70">
                Нажмите "Запустить тесты" для диагностики RLS
              </div>
            ) : (
              testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}
                >
                  <div className="flex items-start gap-3">
                    {getStatusIcon(result.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-sm">{result.name}</h3>
                        <span className="text-xs opacity-70">{result.timestamp}</span>
                      </div>
                      <p className="text-sm mb-2">{result.message}</p>
                      {result.details && (
                        <details className="text-xs opacity-70">
                          <summary className="cursor-pointer hover:opacity-100">
                            Детали
                          </summary>
                          <pre className="mt-2 p-2 bg-black/20 rounded text-xs overflow-x-auto">
                            {result.details}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Advanced RLS Diagnostics */}
        <RLSDiagnostics />

        {/* Quick Actions */}
        <div className="section">
          <div className="flex items-center gap-2 mb-4">
            <Database size={20} className="text-[#6A3FFB]" />
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
              onClick={() => window.location.href = '/my-cars'}
              className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-left"
            >
              <h3 className="font-semibold mb-1">Мои машины</h3>
              <p className="text-sm opacity-70">Проверить доступ к машинам</p>
            </button>

            <button
              onClick={() => window.location.href = '/feed'}
              className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-left"
            >
              <h3 className="font-semibold mb-1">Лента</h3>
              <p className="text-sm opacity-70">Проверить доступ к ленте</p>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

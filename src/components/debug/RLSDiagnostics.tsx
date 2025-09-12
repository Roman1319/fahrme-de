'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Loader2, Database, User, Shield, Eye, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface DiagnosticTest {
  id: string;
  name: string;
  description: string;
  category: 'read' | 'write' | 'delete' | 'rpc';
  table?: string;
  requiresAuth: boolean;
}

interface TestResult {
  testId: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: string;
  timestamp: string;
  duration?: number;
}

const DIAGNOSTIC_TESTS: DiagnosticTest[] = [
  {
    id: 'read_profiles',
    name: 'Чтение профилей',
    description: 'Попытка прочитать таблицу profiles',
    category: 'read',
    table: 'profiles',
    requiresAuth: false
  },
  {
    id: 'read_cars',
    name: 'Чтение машин',
    description: 'Попытка прочитать таблицу cars',
    category: 'read',
    table: 'cars',
    requiresAuth: false
  },
  {
    id: 'read_logbook',
    name: 'Чтение логбука',
    description: 'Попытка прочитать таблицу logbook_entries',
    category: 'read',
    table: 'logbook_entries',
    requiresAuth: false
  },
  {
    id: 'read_car_photos',
    name: 'Чтение фото машин',
    description: 'Попытка прочитать таблицу car_photos',
    category: 'read',
    table: 'car_photos',
    requiresAuth: false
  },
  {
    id: 'write_car_photo',
    name: 'Запись фото машины',
    description: 'Попытка создать запись в car_photos',
    category: 'write',
    table: 'car_photos',
    requiresAuth: true
  },
  {
    id: 'write_logbook_entry',
    name: 'Запись в логбук',
    description: 'Попытка создать запись в logbook_entries',
    category: 'write',
    table: 'logbook_entries',
    requiresAuth: true
  },
  {
    id: 'delete_car_photo',
    name: 'Удаление фото машины',
    description: 'Попытка удалить запись из car_photos',
    category: 'delete',
    table: 'car_photos',
    requiresAuth: true
  },
  {
    id: 'rpc_feed_explore',
    name: 'RPC feed_explore',
    description: 'Вызов RPC функции feed_explore',
    category: 'rpc',
    requiresAuth: false
  },
  {
    id: 'rpc_feed_personal',
    name: 'RPC feed_personal',
    description: 'Вызов RPC функции feed_personal',
    category: 'rpc',
    requiresAuth: true
  }
];

export default function RLSDiagnostics() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);

  const addTestResult = (result: Omit<TestResult, 'timestamp'>) => {
    const newResult: TestResult = {
      ...result,
      timestamp: new Date().toLocaleTimeString()
    };
    setTestResults(prev => [newResult, ...prev]);
  };

  const runSingleTest = async (test: DiagnosticTest) => {
    const startTime = Date.now();
    
    addTestResult({
      testId: test.id,
      status: 'pending',
      message: `Выполняется: ${test.description}`
    });

    try {
      let result: unknown;
      let error: unknown;

      switch (test.category) {
        case 'read':
          if (test.table) {
            const { data, error: readError } = await supabase
              .from(test.table)
              .select('*')
              .limit(1);
            result = data;
            error = readError;
          }
          break;

        case 'write':
          if (test.table === 'car_photos') {
            // Найти машину пользователя
            const { data: userCars } = await supabase
              .from('cars')
              .select('id')
              .limit(1);

            if (userCars && userCars.length > 0) {
              const { data, error: writeError } = await supabase
                .from('car_photos')
                .insert({
                  car_id: userCars[0].id,
                  storage_path: 'debug/test-photo.jpg',
                  sort: 999
                })
                .select();
              result = data;
              error = writeError;
            } else {
              error = { message: 'Нет машин для тестирования' };
            }
          } else if (test.table === 'logbook_entries') {
            // Найти машину пользователя
            const { data: userCars } = await supabase
              .from('cars')
              .select('id')
              .limit(1);

            if (userCars && userCars.length > 0) {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                const { data, error: writeError } = await supabase
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
                result = data;
                error = writeError;
              } else {
                error = { message: 'Пользователь не аутентифицирован' };
              }
            } else {
              error = { message: 'Нет машин для тестирования' };
            }
          }
          break;

        case 'delete':
          if (test.table === 'car_photos') {
            // Найти тестовую запись
            const { data: testPhotos } = await supabase
              .from('car_photos')
              .select('id')
              .eq('storage_path', 'debug/test-photo.jpg')
              .limit(1);

            if (testPhotos && testPhotos.length > 0) {
              const { data, error: deleteError } = await supabase
                .from('car_photos')
                .delete()
                .eq('id', testPhotos[0].id)
                .select();
              result = data;
              error = deleteError;
            } else {
              error = { message: 'Нет тестовых записей для удаления' };
            }
          }
          break;

        case 'rpc':
          if (test.id === 'rpc_feed_explore') {
            const { data, error: rpcError } = await supabase.rpc('feed_explore', {
              p_limit: 1,
              p_offset: 0
            });
            result = data;
            error = rpcError;
          } else if (test.id === 'rpc_feed_personal') {
            const { data, error: rpcError } = await supabase.rpc('feed_personal', {
              p_limit: 1,
              p_offset: 0
            });
            result = data;
            error = rpcError;
          }
          break;
      }

      const duration = Date.now() - startTime;

      if (error) {
        addTestResult({
          testId: test.id,
          status: 'error',
          message: `Ошибка: ${error.message}`,
          details: `Код: ${error.code || 'N/A'}, Детали: ${JSON.stringify(error.details || {})}`,
          duration
        });
      } else {
        addTestResult({
          testId: test.id,
          status: 'success',
          message: `Успешно выполнено`,
          details: result ? `Результат: ${JSON.stringify(result)}` : 'Нет данных',
          duration
        });
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      addTestResult({
        testId: test.id,
        status: 'error',
        message: `Исключение: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration
      });
    }
  };

  const runSelectedTests = async () => {
    if (selectedTests.length === 0) return;

    setIsRunning(true);
    setTestResults([]);

    for (const testId of selectedTests) {
      const test = DIAGNOSTIC_TESTS.find(t => t.id === testId);
      if (test) {
        await runSingleTest(test);
        // Небольшая пауза между тестами
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    setIsRunning(false);
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    for (const test of DIAGNOSTIC_TESTS) {
      await runSingleTest(test);
      // Небольшая пауза между тестами
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setIsRunning(false);
  };

  const toggleTest = (testId: string) => {
    setSelectedTests(prev => 
      prev.includes(testId) 
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    );
  };

  const selectAllTests = () => {
    setSelectedTests(DIAGNOSTIC_TESTS.map(t => t.id));
  };

  const clearSelection = () => {
    setSelectedTests([]);
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

  const getCategoryIcon = (category: DiagnosticTest['category']) => {
    switch (category) {
      case 'read':
        return <Eye size={16} className="text-blue-500" />;
      case 'write':
        return <Edit size={16} className="text-green-500" />;
      case 'delete':
        return <Trash2 size={16} className="text-red-500" />;
      case 'rpc':
        return <Database size={16} className="text-purple-500" />;
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
    <div className="space-y-6">
      {/* Test Selection */}
      <div className="section">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Выбор тестов</h3>
          <div className="flex gap-2">
            <button
              onClick={selectAllTests}
              className="btn-secondary text-sm"
            >
              Выбрать все
            </button>
            <button
              onClick={clearSelection}
              className="btn-secondary text-sm"
            >
              Очистить
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {DIAGNOSTIC_TESTS.map(test => (
            <label
              key={test.id}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedTests.includes(test.id)
                  ? 'bg-[#6A3FFB]/20 border-[#6A3FFB]/50'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedTests.includes(test.id)}
                  onChange={() => toggleTest(test.id)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getCategoryIcon(test.category)}
                    <span className="font-semibold text-sm">{test.name}</span>
                    {test.requiresAuth && (
                      <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded">
                        Требует авторизации
                      </span>
                    )}
                  </div>
                  <p className="text-xs opacity-70">{test.description}</p>
                  {test.table && (
                    <p className="text-xs opacity-50 mt-1">Таблица: {test.table}</p>
                  )}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Test Controls */}
      <div className="section">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Управление тестами</h3>
          <div className="flex gap-2">
            <button
              onClick={runSelectedTests}
              disabled={isRunning || selectedTests.length === 0}
              className="btn-primary flex items-center gap-2"
            >
              {isRunning ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Shield size={16} />
              )}
              Запустить выбранные ({selectedTests.length})
            </button>
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="btn-secondary flex items-center gap-2"
            >
              <Database size={16} />
              Запустить все
            </button>
            <button
              onClick={clearResults}
              disabled={isRunning}
              className="btn-secondary"
            >
              Очистить результаты
            </button>
          </div>
        </div>
      </div>

      {/* Test Results */}
      <div className="section">
        <h3 className="text-lg font-bold mb-4">Результаты тестов</h3>

        <div className="space-y-3">
          {testResults.length === 0 ? (
            <div className="text-center py-8 text-sm opacity-70">
              Выберите тесты и нажмите "Запустить" для диагностики
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
                      <h4 className="font-semibold text-sm">
                        {DIAGNOSTIC_TESTS.find(t => t.id === result.testId)?.name || result.testId}
                      </h4>
                      <div className="flex items-center gap-2 text-xs opacity-70">
                        {result.duration && (
                          <span>{result.duration}ms</span>
                        )}
                        <span>{result.timestamp}</span>
                      </div>
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
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Settings, CheckCircle, XCircle, AlertTriangle, Loader2, Database, Key, Globe, RefreshCw } from 'lucide-react';
import { getSupabaseConfigInfo, testSupabaseConnection, testRLSPolicies } from '@/lib/supabaseConfig';
import { validateSupabaseEnv } from '@/lib/env-validation';

interface ConfigInfo {
  validation: {
    isValid: boolean;
    errorCount: number;
    warningCount: number;
  };
  environment: {
    nodeEnv: string;
    isDevelopment: boolean;
    isProduction: boolean;
  };
  supabase: {
    url: string;
    urlLength: number;
    anonKey: string;
    anonKeyLength: number;
    serviceKey: string;
    serviceKeyLength: number;
  };
  errors: string[];
  warnings: string[];
  clients: {
    anon: {
      url: string;
      keyType: string;
      hasKey: boolean;
    };
    service: {
      url: string;
      keyType: string;
      hasKey: boolean;
    };
  };
}

interface ConnectionTest {
  success: boolean;
  error?: string;
  latency?: number;
}

interface RLSTest {
  success: boolean;
  error?: string;
  policies: string[];
}

export default function ConfigDebugPage() {
  const [configInfo, setConfigInfo] = useState<ConfigInfo | null>(null);
  const [connectionTest, setConnectionTest] = useState<ConnectionTest | null>(null);
  const [rlsTest, setRlsTest] = useState<RLSTest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConfigInfo();
  }, []);

  const loadConfigInfo = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const info = getSupabaseConfigInfo();
      setConfigInfo(info);
    } catch (err) {
      console.error('Error loading config info:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const runConnectionTest = async () => {
    try {
      setIsTesting(true);
      const result = await testSupabaseConnection();
      setConnectionTest(result);
    } catch (err) {
      setConnectionTest({
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const runRLSTest = async () => {
    try {
      setIsTesting(true);
      const result = await testRLSPolicies();
      setRlsTest(result);
    } catch (err) {
      setRlsTest({
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        policies: []
      });
    } finally {
      setIsTesting(false);
    }
  };

  const refreshAll = async () => {
    await loadConfigInfo();
    await runConnectionTest();
    await runRLSTest();
  };

  const getStatusIcon = (status: boolean | string) => {
    if (typeof status === 'boolean') {
      return status ? <CheckCircle size={16} className="text-green-500" /> : <XCircle size={16} className="text-red-500" />;
    }
    if (status === 'Set') {
      return <CheckCircle size={16} className="text-green-500" />;
    }
    if (status === 'Missing') {
      return <XCircle size={16} className="text-red-500" />;
    }
    return <AlertTriangle size={16} className="text-yellow-500" />;
  };

  const getStatusColor = (status: boolean | string) => {
    if (typeof status === 'boolean') {
      return status ? 'text-green-500' : 'text-red-500';
    }
    if (status === 'Set') {
      return 'text-green-500';
    }
    if (status === 'Missing') {
      return 'text-red-500';
    }
    return 'text-yellow-500';
  };

  if (isLoading) {
    return (
      <main className="pb-12">
        <div className="section">
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin opacity-50" />
            <span className="ml-2 opacity-70">Загрузка конфигурации...</span>
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
              onClick={loadConfigInfo}
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Settings size={24} className="text-[#6A3FFB]" />
              <h1 className="h1">Диагностика конфигурации</h1>
            </div>
            <button
              onClick={refreshAll}
              disabled={isTesting}
              className="btn-primary flex items-center gap-2"
            >
              {isTesting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <RefreshCw size={16} />
              )}
              Обновить все
            </button>
          </div>
          <p className="opacity-70 text-sm">
            Проверка переменных окружения и конфигурации Supabase
          </p>
        </div>

        {/* Validation Status */}
        {configInfo && (
          <div className="section">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle size={20} className="text-[#6A3FFB]" />
              <h2 className="text-lg font-bold">Статус валидации</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(configInfo.validation.isValid)}
                  <h3 className="font-semibold">Валидация</h3>
                </div>
                <p className={`text-sm ${getStatusColor(configInfo.validation.isValid)}`}>
                  {configInfo.validation.isValid ? 'Прошла' : 'Не прошла'}
                </p>
                <p className="text-xs opacity-70 mt-1">
                  {configInfo.validation.errorCount} ошибок, {configInfo.validation.warningCount} предупреждений
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Globe size={16} className="text-blue-500" />
                  <h3 className="font-semibold">Окружение</h3>
                </div>
                <p className="text-sm text-[#6A3FFB]">
                  {configInfo.environment.nodeEnv}
                </p>
                <p className="text-xs opacity-70 mt-1">
                  {configInfo.environment.isDevelopment ? 'Разработка' : 'Продакшн'}
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Database size={16} className="text-purple-500" />
                  <h3 className="font-semibold">Клиенты</h3>
                </div>
                <p className="text-sm">
                  Anon: {configInfo.clients.anon.hasKey ? '✓' : '✗'}, 
                  Service: {configInfo.clients.service.hasKey ? '✓' : '✗'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Environment Variables */}
        {configInfo && (
          <div className="section">
            <div className="flex items-center gap-2 mb-4">
              <Key size={20} className="text-[#6A3FFB]" />
              <h2 className="text-lg font-bold">Переменные окружения</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Supabase URL</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(configInfo.supabase.url)}
                    <span className={getStatusColor(configInfo.supabase.url)}>
                      {configInfo.supabase.url}
                    </span>
                  </div>
                  <div className="opacity-70">
                    Длина: {configInfo.supabase.urlLength} символов
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Anon Key</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(configInfo.supabase.anonKey)}
                    <span className={getStatusColor(configInfo.supabase.anonKey)}>
                      {configInfo.supabase.anonKey}
                    </span>
                  </div>
                  <div className="opacity-70">
                    Длина: {configInfo.supabase.anonKeyLength} символов
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Service Key</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(configInfo.supabase.serviceKey)}
                    <span className={getStatusColor(configInfo.supabase.serviceKey)}>
                      {configInfo.supabase.serviceKey}
                    </span>
                  </div>
                  <div className="opacity-70">
                    Длина: {configInfo.supabase.serviceKeyLength} символов
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Errors and Warnings */}
        {configInfo && (configInfo.errors.length > 0 || configInfo.warnings.length > 0) && (
          <div className="section">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={20} className="text-[#6A3FFB]" />
              <h2 className="text-lg font-bold">Ошибки и предупреждения</h2>
            </div>

            <div className="space-y-4">
              {configInfo.errors.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <h3 className="font-semibold text-red-500 mb-2">Ошибки</h3>
                  <ul className="space-y-1 text-sm">
                    {configInfo.errors.map((error, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <XCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {configInfo.warnings.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-500 mb-2">Предупреждения</h3>
                  <ul className="space-y-1 text-sm">
                    {configInfo.warnings.map((warning, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <AlertTriangle size={14} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Connection Test */}
        <div className="section">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Database size={20} className="text-[#6A3FFB]" />
              <h2 className="text-lg font-bold">Тест подключения</h2>
            </div>
            <button
              onClick={runConnectionTest}
              disabled={isTesting}
              className="btn-primary flex items-center gap-2"
            >
              {isTesting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Database size={16} />
              )}
              Тестировать
            </button>
          </div>

          {connectionTest ? (
            <div className={`p-4 rounded-lg border ${
              connectionTest.success 
                ? 'bg-green-500/10 border-green-500/20 text-green-500'
                : 'bg-red-500/10 border-red-500/20 text-red-500'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {getStatusIcon(connectionTest.success)}
                <span className="font-semibold">
                  {connectionTest.success ? 'Подключение успешно' : 'Ошибка подключения'}
                </span>
              </div>
              {connectionTest.latency && (
                <p className="text-sm opacity-70">
                  Время отклика: {connectionTest.latency}ms
                </p>
              )}
              {connectionTest.error && (
                <p className="text-sm mt-2">
                  {connectionTest.error}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-sm opacity-70">
              Нажмите "Тестировать" для проверки подключения
            </div>
          )}
        </div>

        {/* RLS Test */}
        <div className="section">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle size={20} className="text-[#6A3FFB]" />
              <h2 className="text-lg font-bold">Тест RLS политик</h2>
            </div>
            <button
              onClick={runRLSTest}
              disabled={isTesting}
              className="btn-primary flex items-center gap-2"
            >
              {isTesting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle size={16} />
              )}
              Тестировать
            </button>
          </div>

          {rlsTest ? (
            <div className={`p-4 rounded-lg border ${
              rlsTest.success 
                ? 'bg-green-500/10 border-green-500/20 text-green-500'
                : 'bg-red-500/10 border-red-500/20 text-red-500'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {getStatusIcon(rlsTest.success)}
                <span className="font-semibold">
                  {rlsTest.success ? 'RLS тест успешен' : 'Ошибка RLS теста'}
                </span>
              </div>
              {rlsTest.error && (
                <p className="text-sm mb-2">
                  {rlsTest.error}
                </p>
              )}
              {rlsTest.policies.length > 0 && (
                <div className="mt-3">
                  <h4 className="font-semibold text-sm mb-2">Результаты по таблицам:</h4>
                  <ul className="space-y-1 text-xs">
                    {rlsTest.policies.map((policy, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <span className={policy.includes('OK') ? 'text-green-500' : 'text-red-500'}>
                          {policy.includes('OK') ? '✓' : '✗'}
                        </span>
                        <span>{policy}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-sm opacity-70">
              Нажмите "Тестировать" для проверки RLS политик
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="section">
          <div className="flex items-center gap-2 mb-4">
            <Settings size={20} className="text-[#6A3FFB]" />
            <h2 className="text-lg font-bold">Быстрые действия</h2>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <button
              onClick={() => window.location.href = '/debug/rls'}
              className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-left"
            >
              <h3 className="font-semibold mb-1">RLS Диагностика</h3>
              <p className="text-sm opacity-70">Перейти к тестированию RLS</p>
            </button>

            <button
              onClick={() => window.location.href = '/debug/session'}
              className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-left"
            >
              <h3 className="font-semibold mb-1">Диагностика сессии</h3>
              <p className="text-sm opacity-70">Проверить состояние сессии</p>
            </button>

            <button
              onClick={() => window.location.href = '/debug'}
              className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-left"
            >
              <h3 className="font-semibold mb-1">Главная диагностика</h3>
              <p className="text-sm opacity-70">Вернуться к общему обзору</p>
            </button>

            <button
              onClick={() => window.location.reload()}
              className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-left"
            >
              <h3 className="font-semibold mb-1">Перезагрузить страницу</h3>
              <p className="text-sm opacity-70">Обновить все данные</p>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

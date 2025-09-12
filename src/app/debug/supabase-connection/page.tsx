'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function SupabaseConnectionTest() {
  const [connectionStatus, setConnectionStatus] = useState<string>('Проверка...');
  const [userCount, setUserCount] = useState<number | null>(null);
  const [profileCount, setProfileCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      setConnectionStatus('Проверка подключения к Supabase...');
      
      // Тест 1: Проверка подключения
      const { data: healthData, error: healthError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      if (healthError) {
        throw new Error(`Ошибка подключения: ${healthError.message}`);
      }
      
      setConnectionStatus('✅ Подключение к Supabase работает');
      
      // Тест 2: Подсчет пользователей
      const { count: userCount, error: userError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      if (userError) {
        console.warn('Ошибка подсчета пользователей:', userError);
        setUserCount(null);
      } else {
        setUserCount(userCount);
      }
      
      // Тест 3: Проверка текущей сессии
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.warn('Ошибка получения сессии:', sessionError);
      } else if (session?.user) {
        console.log('Текущий пользователь:', session.user.email);
      } else {
        console.log('Пользователь не аутентифицирован');
      }
      
      // Тест 4: Проверка настроек аутентификации
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.warn('Ошибка получения пользователя:', authError);
      }
      
    } catch (err) {
      setError(`Ошибка: ${err}`);
      setConnectionStatus('❌ Ошибка подключения');
    }
  };

  const testAuth = async () => {
    try {
      setError(null);
      
      // Попробуем зарегистрировать тестового пользователя
      const testEmail = `test-${Date.now()}@example.com`;
      const testPassword = 'testpassword123';
      
      console.log('Регистрация тестового пользователя:', testEmail);
      
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            name: 'Test User',
            handle: testEmail.split('@')[0]
          }
        }
      });
      
      if (error) {
        setError(`Ошибка регистрации: ${error.message}`);
        return;
      }
      
      if (data.user) {
        setError(`✅ Регистрация успешна! Пользователь: ${data.user.email}`);
        
        // Попробуем войти
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: testPassword
        });
        
        if (loginError) {
          setError(`Ошибка входа: ${loginError.message}`);
        } else {
          setError(`✅ Вход успешен! Пользователь: ${loginData.user?.email}`);
        }
      } else {
        setError('Регистрация не создала пользователя (возможно, требуется подтверждение email)');
      }
      
    } catch (err) {
      setError(`Ошибка: ${err}`);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Тест подключения к Supabase</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-100 rounded">
          <h2 className="font-semibold mb-2">Статус подключения:</h2>
          <p>{connectionStatus}</p>
        </div>
        
        <div className="p-4 bg-gray-100 rounded">
          <h2 className="font-semibold mb-2">Статистика:</h2>
          <p>Пользователей в базе: {userCount !== null ? userCount : 'Не удалось получить'}</p>
        </div>
        
        <div className="p-4 bg-gray-100 rounded">
          <h2 className="font-semibold mb-2">Тест аутентификации:</h2>
          <button
            onClick={testAuth}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Тест регистрации и входа
          </button>
        </div>
        
        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            <h3 className="font-semibold">Результат теста:</h3>
            <pre className="whitespace-pre-wrap mt-2">{error}</pre>
          </div>
        )}
        
        <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
          <h3 className="font-semibold">Информация о конфигурации:</h3>
          <p>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Настроен' : 'Не настроен'}</p>
          <p>Anon Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Настроен' : 'Не настроен'}</p>
        </div>
      </div>
    </div>
  );
}

'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AuthTestPage() {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('testpassword123');
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testConnection = async () => {
    setIsLoading(true);
    setResult('Проверка подключения...');
    
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      if (error) {
        setResult(`Ошибка подключения: ${error.message}`);
      } else {
        setResult('✅ Подключение к Supabase работает');
      }
    } catch (err) {
      setResult(`Ошибка: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testRegister = async () => {
    setIsLoading(true);
    setResult('Регистрация пользователя...');
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: 'Test User',
            handle: email.split('@')[0]
          }
        }
      });
      
      if (error) {
        setResult(`Ошибка регистрации: ${error.message}`);
      } else {
        setResult(`✅ Регистрация успешна: ${data.user?.email}`);
      }
    } catch (err) {
      setResult(`Ошибка: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testLogin = async () => {
    setIsLoading(true);
    setResult('Вход в систему...');
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        setResult(`Ошибка входа: ${error.message}`);
      } else {
        setResult(`✅ Вход успешен: ${data.user?.email}`);
      }
    } catch (err) {
      setResult(`Ошибка: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testLogout = async () => {
    setIsLoading(true);
    setResult('Выход из системы...');
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        setResult(`Ошибка выхода: ${error.message}`);
      } else {
        setResult('✅ Выход успешен');
      }
    } catch (err) {
      setResult(`Ошибка: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Тест аутентификации Supabase</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={testConnection}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            Тест подключения
          </button>
          
          <button
            onClick={testRegister}
            disabled={isLoading}
            className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
          >
            Регистрация
          </button>
          
          <button
            onClick={testLogin}
            disabled={isLoading}
            className="px-4 py-2 bg-yellow-500 text-white rounded disabled:opacity-50"
          >
            Вход
          </button>
          
          <button
            onClick={testLogout}
            disabled={isLoading}
            className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
          >
            Выход
          </button>
        </div>
        
        {result && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <pre className="whitespace-pre-wrap">{result}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

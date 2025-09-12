'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function RLSTest() {
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testProfilesAccess = async () => {
    setIsLoading(true);
    setResult('Проверка доступа к таблице profiles...');
    
    try {
      // Тест 1: Попытка чтения без аутентификации
      const { data: anonData, error: anonError } = await supabase
        .from('profiles')
        .select('*')
        .limit(5);
      
      if (anonError) {
        setResult(`Ошибка доступа без аутентификации: ${anonError.message}`);
        return;
      }
      
      setResult(`✅ Доступ к profiles без аутентификации работает. Найдено записей: ${anonData?.length || 0}`);
      
    } catch (err) {
      setResult(`Ошибка: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testCarsAccess = async () => {
    setIsLoading(true);
    setResult('Проверка доступа к таблице cars...');
    
    try {
      const { data: carsData, error: carsError } = await supabase
        .from('cars')
        .select('*')
        .limit(5);
      
      if (carsError) {
        setResult(`Ошибка доступа к cars: ${carsError.message}`);
        return;
      }
      
      setResult(`✅ Доступ к cars работает. Найдено записей: ${carsData?.length || 0}`);
      
    } catch (err) {
      setResult(`Ошибка: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testAuthStatus = async () => {
    setIsLoading(true);
    setResult('Проверка статуса аутентификации...');
    
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        setResult(`Ошибка получения сессии: ${sessionError.message}`);
        return;
      }
      
      if (session?.user) {
        setResult(`✅ Пользователь аутентифицирован: ${session.user.email}`);
      } else {
        setResult('❌ Пользователь не аутентифицирован');
      }
      
    } catch (err) {
      setResult(`Ошибка: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Тест RLS (Row Level Security)</h1>
      
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={testProfilesAccess}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            Тест profiles
          </button>
          
          <button
            onClick={testCarsAccess}
            disabled={isLoading}
            className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
          >
            Тест cars
          </button>
          
          <button
            onClick={testAuthStatus}
            disabled={isLoading}
            className="px-4 py-2 bg-yellow-500 text-white rounded disabled:opacity-50"
          >
            Статус аутентификации
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

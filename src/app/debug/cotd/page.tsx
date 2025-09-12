'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface COTDDebugInfo {
  tablesExist: boolean;
  todayDayExists: boolean;
  todayDayData: Record<string, unknown> | null;
  candidatesCount: number;
  rpcFunctionExists: boolean;
  rpcError: string | null;
  rpcData: Record<string, unknown>[] | null;
}

export default function COTDDebugPage() {
  const [debugInfo, setDebugInfo] = useState<COTDDebugInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkCOTDStatus();
  }, []);

  const checkCOTDStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      // Используем глобальный supabase клиент

      const debugInfo: COTDDebugInfo = {
        tablesExist: false,
        todayDayExists: false,
        todayDayData: null,
        candidatesCount: 0,
        rpcFunctionExists: false,
        rpcError: null,
        rpcData: null
      };

      // 1. Проверить существование таблиц
      try {
        const { data: tables, error: tablesError } = await supabase
          .from('cotd_days')
          .select('id')
          .limit(1);
        
        debugInfo.tablesExist = !tablesError;
        console.log('COTD tables check:', { tables, tablesError });
      } catch (err) {
        console.error('Error checking COTD tables:', err);
      }

      // 2. Проверить существование сегодняшнего дня
      try {
        const { data: todayDay, error: todayError } = await supabase
          .from('cotd_days')
          .select('*')
          .eq('date', new Date().toISOString().split('T')[0])
          .single();
        
        debugInfo.todayDayExists = !todayError && !!todayDay;
        debugInfo.todayDayData = todayDay;
        console.log('Today COTD day check:', { todayDay, todayError });
      } catch (err) {
        console.error('Error checking today COTD day:', err);
      }

      // 3. Проверить количество кандидатов
      if (debugInfo.todayDayExists && debugInfo.todayDayData) {
        try {
          const { count, error: candidatesError } = await supabase
            .from('cotd_candidates')
            .select('*', { count: 'exact', head: true })
            .eq('day_id', debugInfo.todayDayData.id);
          
          debugInfo.candidatesCount = count || 0;
          console.log('Candidates count:', { count, candidatesError });
        } catch (err) {
          console.error('Error checking candidates count:', err);
        }
      }

      // 4. Проверить RPC функцию
      try {
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('get_today_cotd_candidates');
        
        debugInfo.rpcFunctionExists = !rpcError;
        debugInfo.rpcError = rpcError?.message || null;
        debugInfo.rpcData = rpcData;
        console.log('RPC function check:', { rpcData, rpcError });
      } catch (err) {
        debugInfo.rpcError = err instanceof Error ? err.message : String(err);
        console.error('Error checking RPC function:', err);
      }

      setDebugInfo(debugInfo);
    } catch (err) {
      console.error('Error in COTD debug check:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createTodayDay = async () => {
    try {
      // Используем глобальный supabase клиент
      const { data, error } = await supabase
        .from('cotd_days')
        .insert({
          date: new Date().toISOString().split('T')[0],
          status: 'voting'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating today day:', error);
        alert('Ошибка создания дня: ' + error.message);
      } else {
        console.log('Today day created:', data);
        alert('День голосования создан!');
        checkCOTDStatus();
      }
    } catch (err) {
      console.error('Error creating today day:', err);
      alert('Ошибка: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">COTD Debug</h1>
          <div className="text-center">Загрузка...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">COTD Debug</h1>
          <div className="bg-red-900 border border-red-700 rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-2">Ошибка</h2>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">COTD Debug</h1>
        
        {debugInfo && (
          <div className="space-y-6">
            {/* Статус таблиц */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Статус таблиц</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${debugInfo.tablesExist ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>Таблицы COTD существуют</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${debugInfo.todayDayExists ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>Сегодняшний день существует</span>
                </div>
              </div>
            </div>

            {/* Данные сегодняшнего дня */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Данные сегодняшнего дня</h2>
              {debugInfo.todayDayData ? (
                <pre className="bg-gray-700 p-4 rounded text-sm overflow-auto">
                  {JSON.stringify(debugInfo.todayDayData, null, 2)}
                </pre>
              ) : (
                <div className="text-red-400">
                  <p>Сегодняшний день не найден</p>
                  <button
                    onClick={createTodayDay}
                    className="mt-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
                  >
                    Создать сегодняшний день
                  </button>
                </div>
              )}
            </div>

            {/* Количество кандидатов */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Кандидаты</h2>
              <p>Количество кандидатов: <span className="font-mono">{debugInfo.candidatesCount}</span></p>
            </div>

            {/* RPC функция */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">RPC функция get_today_cotd_candidates</h2>
              <div className="flex items-center space-x-2 mb-4">
                <div className={`w-3 h-3 rounded-full ${debugInfo.rpcFunctionExists ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>Функция работает</span>
              </div>
              
              {debugInfo.rpcError && (
                <div className="bg-red-900 border border-red-700 rounded p-4 mb-4">
                  <h3 className="font-semibold">Ошибка RPC:</h3>
                  <p className="text-sm">{debugInfo.rpcError}</p>
                </div>
              )}

              {debugInfo.rpcData && (
                <div>
                  <h3 className="font-semibold mb-2">Данные RPC:</h3>
                  <pre className="bg-gray-700 p-4 rounded text-sm overflow-auto">
                    {JSON.stringify(debugInfo.rpcData, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Действия */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Действия</h2>
              <div className="space-x-4">
                <button
                  onClick={checkCOTDStatus}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
                >
                  Обновить статус
                </button>
                {!debugInfo.todayDayExists && (
                  <button
                    onClick={createTodayDay}
                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
                  >
                    Создать сегодняшний день
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

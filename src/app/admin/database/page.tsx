"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Database, BarChart3, Download, RefreshCw, AlertTriangle } from "lucide-react";

interface TableStats {
  table_name: string;
  row_count: number;
  table_size: string;
}

export default function AdminDatabase() {
  const [stats, setStats] = useState<TableStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDatabaseStats();
  }, []);

  const loadDatabaseStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get table statistics
      const { data: tableStats, error: statsError } = await supabase
        .rpc('get_table_stats');

      if (statsError) {
        console.error('Error loading table stats:', statsError);
        // Fallback to manual queries if RPC doesn't exist
        await loadManualStats();
        return;
      }

      setStats(tableStats || []);
    } catch (err) {
      console.error('Error loading database stats:', err);
      setError('Ошибка при загрузке статистики базы данных');
    } finally {
      setLoading(false);
    }
  };

  const loadManualStats = async () => {
    try {
      const tables = ['cars', 'car_photos', 'profiles', 'logbook_entries', 'comments', 'post_likes'];
      const manualStats: TableStats[] = [];

      for (const table of tables) {
        try {
          const { count } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
          
          manualStats.push({
            table_name: table,
            row_count: count || 0,
            table_size: 'N/A'
          });
        } catch (err) {
          console.error(`Error loading stats for ${table}:`, err);
        }
      }

      setStats(manualStats);
    } catch (err) {
      console.error('Error loading manual stats:', err);
      setError('Ошибка при загрузке статистики');
    }
  };

  const exportData = async (tableName: string) => {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*');

      if (error) {
        console.error(`Error exporting ${tableName}:`, error);
        return;
      }

      const csv = convertToCSV(data || []);
      downloadCSV(csv, `${tableName}_export.csv`);
    } catch (err) {
      console.error(`Error exporting ${tableName}:`, err);
    }
  };

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => 
          typeof row[header] === 'string' && row[header].includes(',') 
            ? `"${row[header]}"` 
            : row[header]
        ).join(',')
      )
    ].join('\n');
    
    return csvContent;
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Загрузка статистики базы данных...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-6 w-6 text-red-500" />
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Управление базой данных</h1>
        <p className="text-gray-400">Статистика и операции с базой данных</p>
      </div>

      {/* Database Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1A1A1A] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Всего таблиц</p>
              <p className="text-3xl font-bold mt-2">{stats.length}</p>
            </div>
            <div className="bg-blue-600 p-3 rounded-lg">
              <Database className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-[#1A1A1A] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Всего записей</p>
              <p className="text-3xl font-bold mt-2">
                {stats.reduce((sum, table) => sum + table.row_count, 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-green-600 p-3 rounded-lg">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-[#1A1A1A] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Статус</p>
              <p className="text-lg font-bold mt-2 text-green-400">Активна</p>
            </div>
            <div className="bg-green-600 p-3 rounded-lg">
              <RefreshCw className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Table Statistics */}
      <div className="bg-[#1A1A1A] rounded-lg overflow-hidden">
        <div className="p-6 border-b border-[#333]">
          <h3 className="text-xl font-semibold">Статистика таблиц</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0A0A0A] border-b border-[#333]">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Таблица</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Количество записей</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Размер</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#333]">
              {stats.map((table) => (
                <tr key={table.table_name} className="hover:bg-[#333]/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center">
                        <Database className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-medium text-white">{table.table_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-white">{table.row_count.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-300">{table.table_size}</span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => exportData(table.table_name)}
                      className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      <span>Экспорт</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-[#1A1A1A] rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Быстрые действия</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors">
            Полный экспорт
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors">
            Резервное копирование
          </button>
          <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-3 rounded-lg transition-colors">
            Оптимизация таблиц
          </button>
          <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg transition-colors">
            Очистка логов
          </button>
        </div>
      </div>
    </div>
  );
}

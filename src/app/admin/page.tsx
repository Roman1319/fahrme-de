"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { BarChart3, Users, Car, Image, Database, AlertTriangle } from "lucide-react";

interface AdminStats {
  totalUsers: number;
  totalCars: number;
  totalPhotos: number;
  totalLogbookEntries: number;
  recentUsers: Record<string, unknown>[];
  recentCars: Record<string, unknown>[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all stats in parallel
      const [
        usersResult,
        carsResult,
        photosResult,
        logbookResult,
        recentUsersResult,
        recentCarsResult
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('cars').select('id', { count: 'exact' }),
        supabase.from('car_photos').select('id', { count: 'exact' }),
        supabase.from('logbook_entries').select('id', { count: 'exact' }),
        supabase.from('profiles').select('id, email, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('cars').select('id, brand, model, year, created_at').order('created_at', { ascending: false }).limit(5)
      ]);

      setStats({
        totalUsers: usersResult.count || 0,
        totalCars: carsResult.count || 0,
        totalPhotos: photosResult.count || 0,
        totalLogbookEntries: logbookResult.count || 0,
        recentUsers: recentUsersResult.data || [],
        recentCars: recentCarsResult.data || []
      });
    } catch (err) {
      console.error('Error loading admin stats:', err);
      setError('Ошибка при загрузке статистики');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Загрузка статистики...</p>
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

  const statCards = [
    {
      title: "Пользователи",
      value: stats?.totalUsers || 0,
      icon: Users,
      color: "bg-blue-600",
    },
    {
      title: "Автомобили",
      value: stats?.totalCars || 0,
      icon: Car,
      color: "bg-green-600",
    },
    {
      title: "Фотографии",
      value: stats?.totalPhotos || 0,
      icon: Image,
      color: "bg-purple-600",
    },
    {
      title: "Записи логбука",
      value: stats?.totalLogbookEntries || 0,
      icon: Database,
      color: "bg-orange-600",
    },
  ];

  return (
    <div className="space-y-16 w-full">
      <div>
        <h1 className="text-5xl font-bold mb-6">Обзор системы</h1>
        <p className="text-xl text-gray-400">Статистика и мониторинг платформы fahrme.de</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-10">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-[#1A1A1A] rounded-2xl p-10 hover:bg-[#222] transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-lg mb-4">{card.title}</p>
                  <p className="text-5xl font-bold">{card.value.toLocaleString()}</p>
                </div>
                <div className={`${card.color} p-5 rounded-2xl`}>
                  <Icon className="h-10 w-10 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
        {/* Recent Users */}
        <div className="bg-[#1A1A1A] rounded-2xl p-10">
          <h3 className="text-3xl font-semibold mb-8 flex items-center">
            <Users className="h-8 w-8 mr-4" />
            Последние пользователи
          </h3>
          <div className="space-y-6">
            {stats?.recentUsers.map((user) => (
              <div key={(user as { id: string }).id} className="flex items-center justify-between py-6 px-6 bg-[#0A0A0A] rounded-xl border border-[#333] hover:border-[#444] transition-colors">
                <div>
                  <p className="font-medium text-xl">{(user as { email: string }).email}</p>
                  <p className="text-base text-gray-400">
                    {new Date((user as { created_at: string }).created_at).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Cars */}
        <div className="bg-[#1A1A1A] rounded-2xl p-10">
          <h3 className="text-3xl font-semibold mb-8 flex items-center">
            <Car className="h-8 w-8 mr-4" />
            Последние автомобили
          </h3>
          <div className="space-y-6">
            {stats?.recentCars.map((car) => (
              <div key={(car as { id: string }).id} className="flex items-center justify-between py-6 px-6 bg-[#0A0A0A] rounded-xl border border-[#333] hover:border-[#444] transition-colors">
                <div>
                  <p className="font-medium text-xl">{(car as { brand: string; model: string }).brand} {(car as { brand: string; model: string }).model}</p>
                  <p className="text-base text-gray-400">
                    {(car as { year: number }).year} • {new Date((car as { created_at: string }).created_at).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-[#1A1A1A] rounded-2xl p-10">
        <h3 className="text-3xl font-semibold mb-10">Быстрые действия</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <a href="/admin/cotd" className="bg-yellow-600 hover:bg-yellow-700 text-white px-8 py-6 rounded-2xl transition-colors text-xl font-medium hover:scale-105 transform text-center">
            Машина дня
          </a>
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 rounded-2xl transition-colors text-xl font-medium hover:scale-105 transform">
            Очистить мусорные файлы
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 rounded-2xl transition-colors text-xl font-medium hover:scale-105 transform">
            Экспорт данных
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 rounded-2xl transition-colors text-xl font-medium hover:scale-105 transform">
            Резервное копирование
          </button>
        </div>
      </div>
    </div>
  );
}

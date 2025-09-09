"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Settings, Save, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";

interface SystemSettings {
  site_name: string;
  maintenance_mode: boolean;
  allow_registration: boolean;
  max_photos_per_car: number;
  max_file_size_mb: number;
  allowed_file_types: string[];
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<SystemSettings>({
    site_name: 'fahrme.de',
    maintenance_mode: false,
    allow_registration: true,
    max_photos_per_car: 10,
    max_file_size_mb: 5,
    allowed_file_types: ['jpg', 'jpeg', 'png', 'webp']
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Here you would typically save to a settings table or config file
      // For now, we'll just simulate saving
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Ошибка при сохранении настроек');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSettings({
      site_name: 'fahrme.de',
      maintenance_mode: false,
      allow_registration: true,
      max_photos_per_car: 10,
      max_file_size_mb: 5,
      allowed_file_types: ['jpg', 'jpeg', 'png', 'webp']
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Настройки системы</h1>
        <p className="text-gray-400">Управление настройками платформы</p>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      )}

      {saved && (
        <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <p className="text-green-400">Настройки сохранены успешно!</p>
          </div>
        </div>
      )}

      {/* General Settings */}
      <div className="bg-[#1A1A1A] rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-6">Общие настройки</h3>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Название сайта
            </label>
            <input
              type="text"
              value={settings.site_name}
              onChange={(e) => setSettings(prev => ({ ...prev, site_name: e.target.value }))}
              className="w-full px-4 py-2 bg-[#0A0A0A] border border-[#333] rounded-lg text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-300">Режим обслуживания</label>
              <p className="text-xs text-gray-500">Временно отключить сайт для пользователей</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.maintenance_mode}
                onChange={(e) => setSettings(prev => ({ ...prev, maintenance_mode: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-300">Разрешить регистрацию</label>
              <p className="text-xs text-gray-500">Позволить новым пользователям регистрироваться</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allow_registration}
                onChange={(e) => setSettings(prev => ({ ...prev, allow_registration: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* File Upload Settings */}
      <div className="bg-[#1A1A1A] rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-6">Настройки загрузки файлов</h3>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Максимум фотографий на автомобиль
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={settings.max_photos_per_car}
              onChange={(e) => setSettings(prev => ({ ...prev, max_photos_per_car: parseInt(e.target.value) }))}
              className="w-full px-4 py-2 bg-[#0A0A0A] border border-[#333] rounded-lg text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Максимальный размер файла (МБ)
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={settings.max_file_size_mb}
              onChange={(e) => setSettings(prev => ({ ...prev, max_file_size_mb: parseInt(e.target.value) }))}
              className="w-full px-4 py-2 bg-[#0A0A0A] border border-[#333] rounded-lg text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Разрешенные типы файлов
            </label>
            <div className="flex flex-wrap gap-2">
              {['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].map((type) => (
                <label key={type} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.allowed_file_types.includes(type)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSettings(prev => ({
                          ...prev,
                          allowed_file_types: [...prev.allowed_file_types, type]
                        }));
                      } else {
                        setSettings(prev => ({
                          ...prev,
                          allowed_file_types: prev.allowed_file_types.filter(t => t !== type)
                        }));
                      }
                    }}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-300">{type.toUpperCase()}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-[#1A1A1A] rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-6">Действия</h3>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors"
          >
            {loading ? (
              <RefreshCw className="h-5 w-5 animate-spin" />
            ) : (
              <Save className="h-5 w-5" />
            )}
            <span>{loading ? 'Сохранение...' : 'Сохранить настройки'}</span>
          </button>
          
          <button
            onClick={handleReset}
            className="flex items-center space-x-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
          >
            <RefreshCw className="h-5 w-5" />
            <span>Сбросить</span>
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { cleanupOrphanedPhotos } from "@/lib/cars";
import { useAuth } from "@/components/AuthProvider";
import Guard from "@/components/auth/Guard";

export default function CleanupPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");

  const handleCleanup = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setResult("Начинаем очистку...");
      
      await cleanupOrphanedPhotos();
      setResult("Очистка завершена успешно! Проверьте Supabase Storage.");
    } catch (error) {
      console.error("Error during cleanup:", error);
      setResult(`Ошибка при очистке: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Guard>
      <div className="min-h-screen bg-[#0A0A0A] text-white p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Очистка фотографий</h1>
          
          <div className="bg-[#1A1A1A] p-6 rounded-lg mb-6">
            <h2 className="text-xl font-semibold mb-4">Что делает эта функция:</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
            <li>Находит фотографии в Supabase Storage, которые не связаны с существующими автомобилями</li>
            <li>Удаляет эти &quot;мусорные&quot; фотографии из Storage</li>
            <li>Очищает базу данных от неиспользуемых записей</li>
            </ul>
          </div>

          <div className="bg-[#1A1A1A] p-6 rounded-lg mb-6">
            <h2 className="text-xl font-semibold mb-4">Результат:</h2>
            <div className="bg-black p-4 rounded text-sm font-mono min-h-[100px]">
              {result || "Нажмите кнопку для начала очистки..."}
            </div>
          </div>

          <button
            onClick={handleCleanup}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {loading ? "Очистка..." : "Начать очистку"}
          </button>
        </div>
      </div>
    </Guard>
  );
}

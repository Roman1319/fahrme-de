"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Car, Search, Filter, MoreVertical, Trash2, Eye, Edit } from "lucide-react";

interface CarData {
  id: string;
  brand: string;
  model: string;
  year: number;
  name?: string;
  color?: string;
  created_at: string;
  owner_id: string;
  owner_email?: string;
  photo_count?: number;
}

export default function AdminCars() {
  const [cars, setCars] = useState<CarData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCars, setFilteredCars] = useState<CarData[]>([]);

  useEffect(() => {
    loadCars();
  }, []);

  useEffect(() => {
    const filtered = cars.filter(car =>
      `${car.brand} ${car.model}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.owner_email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCars(filtered);
  }, [cars, searchTerm]);

  const loadCars = async () => {
    try {
      setLoading(true);
      
      // Get cars with owner information
      const { data: carsData, error: carsError } = await supabase
        .from('cars')
        .select(`
          *,
          profiles!cars_owner_id_fkey(email)
        `)
        .order('created_at', { ascending: false });

      if (carsError) {
        console.error('Error loading cars:', carsError);
        throw carsError;
      }

      // Get photo counts for each car
      const carsWithPhotoCounts = await Promise.all(
        carsData.map(async (car) => {
          const { count } = await supabase
            .from('car_photos')
            .select('*', { count: 'exact', head: true })
            .eq('car_id', car.id);
          
          return {
            ...car,
            owner_email: car.profiles?.email || 'Unknown',
            photo_count: count || 0
          };
        })
      );

      setCars(carsWithPhotoCounts);
    } catch (error) {
      console.error('Error loading cars:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Загрузка автомобилей...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Управление автомобилями</h1>
        <p className="text-gray-400">Всего автомобилей: {cars.length}</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-[#1A1A1A] rounded-lg p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск по марке, модели или владельцу..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#0A0A0A] border border-[#333] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
            />
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 bg-[#0A0A0A] border border-[#333] rounded-lg hover:bg-[#333] transition-colors">
            <Filter className="h-4 w-4" />
            <span>Фильтры</span>
          </button>
        </div>
      </div>

      {/* Cars Table */}
      <div className="bg-[#1A1A1A] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0A0A0A] border-b border-[#333]">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Автомобиль</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Владелец</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Фотографии</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Создан</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#333]">
              {filteredCars.map((car) => (
                <tr key={car.id} className="hover:bg-[#333]/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                        <Car className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{car.brand} {car.model}</p>
                        <p className="text-sm text-gray-400">{car.year} • {car.name || 'Без названия'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-white">{car.owner_email}</p>
                      <p className="text-sm text-gray-400">ID: {car.owner_id.slice(0, 8)}...</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-900 text-purple-300">
                      {car.photo_count} фото
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    {formatDate(car.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-blue-400 transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-yellow-400 transition-colors">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-400 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-white transition-colors">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredCars.length === 0 && (
        <div className="text-center py-12">
          <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">Автомобили не найдены</p>
        </div>
      )}
    </div>
  );
}

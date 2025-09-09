"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Image, Search, Filter, Trash2, Eye, Download } from "lucide-react";

interface PhotoData {
  id: string;
  car_id: string;
  storage_path: string;
  created_at: string;
  car_brand?: string;
  car_model?: string;
  owner_email?: string;
  file_size?: number;
}

export default function AdminPhotos() {
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPhotos, setFilteredPhotos] = useState<PhotoData[]>([]);

  useEffect(() => {
    loadPhotos();
  }, []);

  useEffect(() => {
    const filtered = photos.filter(photo =>
      photo.car_brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      photo.car_model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      photo.owner_email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPhotos(filtered);
  }, [photos, searchTerm]);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      
      // Get photos with car and owner information
      const { data: photosData, error: photosError } = await supabase
        .from('car_photos')
        .select(`
          *,
          cars!car_photos_car_id_fkey(
            brand,
            model,
            profiles!cars_owner_id_fkey(email)
          )
        `)
        .order('created_at', { ascending: false });

      if (photosError) {
        console.error('Error loading photos:', photosError);
        throw photosError;
      }

      const photosWithDetails = photosData.map(photo => ({
        ...photo,
        car_brand: photo.cars?.brand,
        car_model: photo.cars?.model,
        owner_email: photo.cars?.profiles?.email
      }));

      setPhotos(photosWithDetails);
    } catch (error) {
      console.error('Error loading photos:', error);
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getPhotoUrl = (storagePath: string) => {
    const { data } = supabase.storage
      .from('car-photos')
      .getPublicUrl(storagePath);
    return data.publicUrl;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Загрузка фотографий...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Управление фотографиями</h1>
        <p className="text-gray-400">Всего фотографий: {photos.length}</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-[#1A1A1A] rounded-lg p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск по автомобилю или владельцу..."
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

      {/* Photos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredPhotos.map((photo) => (
          <div key={photo.id} className="bg-[#1A1A1A] rounded-lg overflow-hidden">
            <div className="aspect-square relative">
              <img
                src={getPhotoUrl(photo.storage_path)}
                alt={`${photo.car_brand} ${photo.car_model}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-car.jpg';
                }}
              />
              <div className="absolute top-2 right-2 bg-black/50 rounded px-2 py-1">
                <span className="text-xs text-white">#{photo.id.slice(0, 8)}</span>
              </div>
            </div>
            <div className="p-4">
              <div className="mb-2">
                <p className="font-medium text-white">
                  {photo.car_brand} {photo.car_model}
                </p>
                <p className="text-sm text-gray-400">{photo.owner_email}</p>
              </div>
              <div className="text-xs text-gray-500 mb-3">
                <p>Создано: {formatDate(photo.created_at)}</p>
                {photo.file_size && (
                  <p>Размер: {formatFileSize(photo.file_size)}</p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors">
                  <Eye className="h-4 w-4" />
                  <span>Просмотр</span>
                </button>
                <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors">
                  <Download className="h-4 w-4" />
                  <span>Скачать</span>
                </button>
                <button className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPhotos.length === 0 && (
        <div className="text-center py-12">
          <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">Фотографии не найдены</p>
        </div>
      )}
    </div>
  );
}

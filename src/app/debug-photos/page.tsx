'use client';

import { useState, useEffect } from 'react';
import { getCarPhotos, getCarPhotoUrl } from '@/lib/cars';
import { supabase } from '@/lib/supabaseClient';

export default function DebugPhotosPage() {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      
      // Получаем все автомобили
      const { data: cars, error: carsError } = await supabase
        .from('cars')
        .select('id, brand, model, name')
        .limit(5);

      if (carsError) {
        console.error('Error loading cars:', carsError);
        setError('Error loading cars: ' + carsError.message);
        return;
      }

      console.log('Cars:', cars);

      // Для каждого автомобиля получаем фото
      const allPhotos = [];
      for (const car of cars || []) {
        try {
          const carPhotos = await getCarPhotos(car.id);
          console.log(`Photos for car ${car.brand} ${car.model}:`, carPhotos);
          
          for (const photo of carPhotos) {
            const photoUrl = getCarPhotoUrl(photo.storage_path);
            console.log(`Photo URL for ${photo.storage_path}:`, photoUrl);
            
            allPhotos.push({
              carId: car.id,
              carName: `${car.brand} ${car.model}`,
              photoId: photo.id,
              storagePath: photo.storage_path,
              photoUrl: photoUrl,
              isCover: photo.is_cover
            });
          }
        } catch (photoError) {
          console.error(`Error loading photos for car ${car.id}:`, photoError);
        }
      }

      setPhotos(allPhotos);
    } catch (err) {
      console.error('Error in loadPhotos:', err);
      setError('Error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Photos</h1>
      
      <div className="mb-4">
        <button 
          onClick={loadPhotos}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Reload Photos
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {photos.map((photo, index) => (
          <div key={index} className="border rounded p-4">
            <h3 className="font-bold">{photo.carName}</h3>
            <p className="text-sm text-gray-600">ID: {photo.carId}</p>
            <p className="text-sm text-gray-600">Storage Path: {photo.storagePath}</p>
            <p className="text-sm text-gray-600">Is Cover: {photo.isCover ? 'Yes' : 'No'}</p>
            
            <div className="mt-2">
              <img 
                src={photo.photoUrl} 
                alt={photo.carName}
                className="w-full h-32 object-cover rounded"
                onError={(e) => {
                  console.error('Image load error for:', photo.photoUrl);
                  e.currentTarget.style.display = 'none';
                }}
                onLoad={() => {
                  console.log('Image loaded successfully:', photo.photoUrl);
                }}
              />
            </div>
            
            <p className="text-xs text-gray-500 mt-2">URL: {photo.photoUrl}</p>
          </div>
        ))}
      </div>

      {photos.length === 0 && (
        <div className="text-gray-500">No photos found</div>
      )}
    </div>
  );
}


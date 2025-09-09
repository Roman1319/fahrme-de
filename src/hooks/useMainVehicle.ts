import { useState, useEffect } from 'react';
import { MyCar } from '@/lib/types';
import { useAuth } from '@/components/AuthProvider';
import { getMainVehicle } from '@/lib/cars';

export function useMainVehicle() {
  const { user } = useAuth();
  const [mainVehicle, setMainVehicle] = useState<MyCar | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMainVehicle = async () => {
      if (!user) {
        setMainVehicle(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const serverMainVehicle = await getMainVehicle(user.id);
        
        if (serverMainVehicle) {
          // Convert server data to MyCar format
          const mainVehicleData: MyCar = {
            id: serverMainVehicle.id,
            make: serverMainVehicle.brand,
            model: serverMainVehicle.model,
            year: serverMainVehicle.year,
            images: [],
            description: serverMainVehicle.description ?? '',
            isMainVehicle: true,
            isFormerCar: serverMainVehicle.is_former,
            name: serverMainVehicle.name ?? '',
            color: serverMainVehicle.color ?? '',
            story: serverMainVehicle.story ?? '',
            addedDate: serverMainVehicle.created_at,
            ownerId: serverMainVehicle.owner_id
          };
          setMainVehicle(mainVehicleData);
        } else {
          setMainVehicle(null);
        }
      } catch (error) {
        console.error('Error loading main vehicle:', error);
        setMainVehicle(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadMainVehicle();

    // Listen for main vehicle changes
    const handleMainVehicleChange = () => {
      loadMainVehicle();
    };

    window.addEventListener('mainVehicleChanged', handleMainVehicleChange);

    return () => {
      window.removeEventListener('mainVehicleChanged', handleMainVehicleChange);
    };
  }, [user]);

  return { mainVehicle, isLoading };
}
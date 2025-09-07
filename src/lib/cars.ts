import { supabase } from './supabaseClient';
import { Car, CarPhoto } from './types';

export interface CreateCarData {
  brand: string;
  model: string;
  year: number;
  name?: string;
  color?: string;
  is_main_vehicle?: boolean;
  is_former?: boolean;
  description?: string;
  story?: string;
}

export interface UpdateCarData extends Partial<CreateCarData> {
  id: string;
}

export async function getCars(ownerId?: string): Promise<Car[]> {
  try {
    let query = supabase
      .from('cars')
      .select('*')
      .order('created_at', { ascending: false });

    if (ownerId) {
      query = query.eq('owner_id', ownerId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching cars:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getCars:', error);
    throw error;
  }
}

export async function getCar(carId: string): Promise<Car | null> {
  try {
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('id', carId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Car not found
      }
      console.error('Error fetching car:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getCar:', error);
    throw error;
  }
}

export async function createCar(carData: CreateCarData, ownerId: string): Promise<Car> {
  try {
    const { data, error } = await supabase
      .from('cars')
      .insert({
        ...carData,
        owner_id: ownerId
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating car:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createCar:', error);
    throw error;
  }
}

export async function updateCar(carData: UpdateCarData): Promise<Car> {
  try {
    const { id, ...updateData } = carData;
    
    const { data, error } = await supabase
      .from('cars')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating car:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateCar:', error);
    throw error;
  }
}

export async function deleteCar(carId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('cars')
      .delete()
      .eq('id', carId);

    if (error) {
      console.error('Error deleting car:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteCar:', error);
    throw error;
  }
}

export async function getCarPhotos(carId: string): Promise<CarPhoto[]> {
  try {
    const { data, error } = await supabase
      .from('car_photos')
      .select('*')
      .eq('car_id', carId)
      .order('sort', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching car photos:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getCarPhotos:', error);
    throw error;
  }
}

export async function uploadCarPhoto(
  carId: string, 
  file: File, 
  ownerId: string
): Promise<CarPhoto> {
  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${ownerId}/${carId}/${fileName}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('car-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading photo:', uploadError);
      throw uploadError;
    }

    // Get the next sort order
    const { data: photos } = await supabase
      .from('car_photos')
      .select('sort')
      .eq('car_id', carId)
      .order('sort', { ascending: false })
      .limit(1);

    const nextSort = photos && photos.length > 0 ? photos[0].sort + 1 : 0;

    // Save photo record
    const { data, error } = await supabase
      .from('car_photos')
      .insert({
        car_id: carId,
        storage_path: filePath,
        sort: nextSort
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving photo record:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in uploadCarPhoto:', error);
    throw error;
  }
}

export async function deleteCarPhoto(photoId: string): Promise<void> {
  try {
    // Get photo info first
    const { data: photo, error: fetchError } = await supabase
      .from('car_photos')
      .select('storage_path')
      .eq('id', photoId)
      .single();

    if (fetchError) {
      console.error('Error fetching photo info:', fetchError);
      throw fetchError;
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('car-photos')
      .remove([photo.storage_path]);

    if (storageError) {
      console.error('Error deleting from storage:', storageError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('car_photos')
      .delete()
      .eq('id', photoId);

    if (dbError) {
      console.error('Error deleting photo record:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error in deleteCarPhoto:', error);
    throw error;
  }
}

export function getCarPhotoUrl(storagePath: string): string {
  const { data } = supabase.storage
    .from('car-photos')
    .getPublicUrl(storagePath);
  
  return data.publicUrl;
}

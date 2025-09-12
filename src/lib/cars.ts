import { supabase } from './supabaseClient';
import { Car, CarPhoto } from './types';
import { uploadCarPhoto } from './storage';

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
  power?: number;
  engine?: string;
  volume?: string;
  gearbox?: string;
  drive?: string;
  images?: File[];
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

    const cars = data || [];

    // Load photos for each car
    const carsWithPhotos = await Promise.all(
      cars.map(async (car) => {
        try {
          const photos = await getCarPhotos(car.id);
          console.log(`[getCars] Loaded ${photos.length} photos for car ${car.id}`);
          return { ...car, photos };
        } catch (photoError) {
          console.error(`Error loading photos for car ${car.id}:`, photoError);
          return { ...car, photos: [] };
        }
      })
    );

    return carsWithPhotos;
  } catch (error) {
    console.error('Error in getCars:', error);
    throw error;
  }
}

export async function getCar(carId: string): Promise<Car | null> {
  try {
    console.log('[getCar] Fetching car with ID:', carId);
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('id', carId)
      .single();

    if (error) {
      console.log('[getCar] Error fetching car:', error);
      if (error.code === 'PGRST116') {
        console.log('[getCar] Car not found (PGRST116)');
        return null; // Car not found
      }
      console.error('Error fetching car:', error);
      throw error;
    }

    console.log('[getCar] Car data retrieved:', data);
    return data;
  } catch (error) {
    console.error('Error in getCar:', error);
    throw error;
  }
}

export async function createCar(carData: CreateCarData, ownerId: string): Promise<Car> {
  try {
    const { images, ...carDataWithoutImages } = carData;
    
    console.log('[createCar] Received carData:', carData);
    console.log('[createCar] Images:', images);
    console.log('[createCar] Images length:', images?.length || 0);
    
    const { data, error } = await supabase
      .from('cars')
      .insert({
        ...carDataWithoutImages,
        owner_id: ownerId
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating car:', error);
      throw error;
    }

    console.log('[createCar] Car created successfully with ID:', data.id);

    // Upload images if provided
    if (images && images.length > 0) {
      console.log('[createCar] Starting image upload for', images.length, 'images');
      try {
        for (const image of images) {
          console.log('[createCar] Uploading image:', image.name, image.type, image.size);
          await uploadCarPhoto(image, data.id, ownerId);
          console.log('[createCar] Image uploaded successfully:', image.name);
        }
      } catch (photoError) {
        console.error('Error uploading car photos:', photoError);
        // Don't throw error here, car is already created
      }
    } else {
      console.log('[createCar] No images to upload');
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
    console.log(`[deleteCar] Starting deletion for car ${carId}`);
    
    // 1. Get all photos for this car
    const { data: photos, error: photosError } = await supabase
      .from('car_photos')
      .select('storage_path')
      .eq('car_id', carId);

    if (photosError) {
      console.error('Error fetching car photos for deletion:', photosError);
      throw photosError;
    }

    console.log(`[deleteCar] Found ${photos?.length || 0} photos to delete`);

    // 2. Delete photos from Storage
    if (photos && photos.length > 0) {
      const photoPaths = photos.map(photo => photo.storage_path);
      console.log(`[deleteCar] Deleting photos from storage:`, photoPaths);
      
      const { error: storageError } = await supabase.storage
        .from('car-photos')
        .remove(photoPaths);

      if (storageError) {
        console.error('Error deleting photos from storage:', storageError);
        // Don't throw here, continue with database cleanup
      } else {
        console.log(`[deleteCar] Successfully deleted ${photoPaths.length} photos from storage`);
      }
    }

    // 3. Delete car_photos records
    const { error: carPhotosError } = await supabase
      .from('car_photos')
      .delete()
      .eq('car_id', carId);

    if (carPhotosError) {
      console.error('Error deleting car_photos records:', carPhotosError);
      throw carPhotosError;
    }

    console.log(`[deleteCar] Deleted car_photos records for car ${carId}`);

    // 4. Delete the car record
    const { error: carError } = await supabase
      .from('cars')
      .delete()
      .eq('id', carId);

    if (carError) {
      console.error('Error deleting car:', carError);
      throw carError;
    }

    console.log(`[deleteCar] Successfully deleted car ${carId} and all associated data`);
  } catch (error) {
    console.error('Error in deleteCar:', error);
    throw error;
  }
}

// Clean up orphaned photos in storage (photos that exist in storage but not in car_photos table)
export async function cleanupOrphanedPhotos(): Promise<void> {
  try {
    console.log('[cleanupOrphanedPhotos] Starting cleanup of orphaned photos');
    
    // Get all car_photos records
    const { data: carPhotos, error: carPhotosError } = await supabase
      .from('car_photos')
      .select('storage_path');
    
    if (carPhotosError) {
      console.error('Error fetching car_photos:', carPhotosError);
      throw carPhotosError;
    }
    
    const validPaths = new Set(carPhotos?.map(photo => photo.storage_path) || []);
    console.log(`[cleanupOrphanedPhotos] Found ${validPaths.size} valid photo paths in database`);
    
    // List all files in car-photos bucket
    const { data: storageFiles, error: storageError } = await supabase.storage
      .from('car-photos')
      .list('', { limit: 1000, sortBy: { column: 'created_at', order: 'desc' } });
    
    if (storageError) {
      console.error('Error listing storage files:', storageError);
      throw storageError;
    }
    
    // Find orphaned files
    const orphanedFiles: string[] = [];
    
    const checkDirectory = async (path: string = '') => {
      const { data: files, error } = await supabase.storage
        .from('car-photos')
        .list(path, { limit: 1000 });
      
      if (error) {
        console.error(`Error listing directory ${path}:`, error);
        return;
      }
      
      for (const file of files || []) {
        const fullPath = path ? `${path}/${file.name}` : file.name;
        
        if (file.metadata?.mimetype?.startsWith('image/')) {
          // This is an image file
          if (!validPaths.has(fullPath)) {
            orphanedFiles.push(fullPath);
            console.log(`[cleanupOrphanedPhotos] Found orphaned file: ${fullPath}`);
          }
        } else if (!file.metadata?.mimetype) {
          // This might be a directory, check it recursively
          await checkDirectory(fullPath);
        }
      }
    };
    
    await checkDirectory();
    
    console.log(`[cleanupOrphanedPhotos] Found ${orphanedFiles.length} orphaned files`);
    
    // Delete orphaned files
    if (orphanedFiles.length > 0) {
      const { error: deleteError } = await supabase.storage
        .from('car-photos')
        .remove(orphanedFiles);
      
      if (deleteError) {
        console.error('Error deleting orphaned files:', deleteError);
        throw deleteError;
      }
      
      console.log(`[cleanupOrphanedPhotos] Successfully deleted ${orphanedFiles.length} orphaned files`);
    } else {
      console.log('[cleanupOrphanedPhotos] No orphaned files found');
    }
  } catch (error) {
    console.error('Error in cleanupOrphanedPhotos:', error);
    throw error;
  }
}

export async function getCarPhotos(carId: string): Promise<CarPhoto[]> {
  try {
    console.log(`[getCarPhotos] Fetching photos for car ${carId}`);
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

    console.log(`[getCarPhotos] Found ${data?.length || 0} photos for car ${carId}:`, data);
    return data || [];
  } catch (error) {
    console.error('Error in getCarPhotos:', error);
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

// Server-side version for use in API routes
export function getCarPhotoUrlServer(storagePath: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return `${supabaseUrl}/storage/v1/object/public/car-photos/${storagePath}`;
}

export async function addCarPhoto(params: {
  carId: string;
  userId: string;
  url: string;
  storagePath: string;
  isCover?: boolean;
}) {
  const { data, error } = await supabase
    .from('car_photos')
    .insert({
      car_id: params.carId,
      storage_path: params.storagePath,
      sort: 0, // Default sort order
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function getMainVehicle(userId: string) {
  const { data, error } = await supabase
    .from('cars')
    .select('*')
    .eq('owner_id', userId)
    .eq('is_main_vehicle', true)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  return data ?? null;
}

export async function updateCarWithPhotos(
  carData: UpdateCarData,
  newImages: string[],
  deletedImageUrls: string[],
  ownerId: string
): Promise<Car> {
  try {
    // Start all operations in parallel for maximum speed
    const operations = [];

    // 1. Update car data
    operations.push(updateCar(carData));

    // 2. Handle deleted images (only if there are any)
    if (deletedImageUrls.length > 0) {
      operations.push(
        (async () => {
          // Get only the photos we need to delete (more efficient query)
          const { data: carPhotos, error } = await supabase
            .from('car_photos')
            .select('id, storage_path')
            .eq('car_id', carData.id);
          
          if (error) throw error;

          // Find photos that match the deleted URLs
          const photosToDelete = carPhotos?.filter(photo => {
            const photoUrl = getCarPhotoUrl(photo.storage_path);
            return deletedImageUrls.includes(photoUrl);
          }) || [];

          if (photosToDelete.length > 0) {
            // Delete all photos in one batch operation
            const photoIds = photosToDelete.map(photo => photo.id);
            const storagePaths = photosToDelete.map(photo => photo.storage_path);

            // Delete from database in one query
            const { error: dbError } = await supabase
              .from('car_photos')
              .delete()
              .in('id', photoIds);

            if (dbError) throw dbError;

            // Delete from storage in one operation
            const { error: storageError } = await supabase.storage
              .from('car-photos')
              .remove(storagePaths);

            if (storageError) {
              console.error('Error deleting from storage:', storageError);
              // Continue even if storage deletion fails
            }
          }
        })()
      );
    }

    // 3. Handle new images (only if there are any)
    if (newImages.length > 0) {
      const base64Images = newImages.filter(img => img.startsWith('data:image/'));
      
      if (base64Images.length > 0) {
        operations.push(
          (async () => {
            // Process all images in parallel
            const uploadPromises = base64Images.map(async (base64Image, index) => {
              try {
                // Convert base64 to file
                const response = await fetch(base64Image);
                const blob = await response.blob();
                const file = new File([blob], `image_${Date.now()}_${index}.jpg`, { type: 'image/jpeg' });
                
                // Upload the photo
                return await uploadCarPhoto(file, carData.id, ownerId);
              } catch (error) {
                console.error(`Error uploading image ${index}:`, error);
                return null;
              }
            });

            // Wait for all uploads to complete
            await Promise.all(uploadPromises);
          })()
        );
      }
    }

    // Wait for all operations to complete
    const results = await Promise.all(operations);
    
    // Return the updated car (first result is the car update)
    return results[0] as Car;
  } catch (error) {
    console.error('Error updating car with photos:', error);
    throw error;
  }
}
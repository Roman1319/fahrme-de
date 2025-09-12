import { supabase } from './supabaseClient';

// Типы для storage buckets
export type StorageBucket = 'logbook' | 'avatars' | 'car-photos';

// Интерфейс для изображения с fallback
export interface ImageWithFallback {
  src: string;
  alt: string;
  fallback?: string;
}

// Конфигурация для разных типов изображений
const IMAGE_CONFIG = {
  logbook: {
    bucket: 'logbook' as StorageBucket,
    placeholder: '/placeholder-logbook.jpg',
    alt: 'Logbook image'
  },
  avatars: {
    bucket: 'avatars' as StorageBucket,
    placeholder: '/placeholder-avatar.jpg',
    alt: 'User avatar'
  },
  'car-photos': {
    bucket: 'car-photos' as StorageBucket,
    placeholder: '/placeholder-car.jpg',
    alt: 'Car photo'
  }
} as const;

/**
 * Создает публичный URL для изображения из storage_path
 */
export function getStorageUrl(storagePath: string, bucket: StorageBucket): string {
  if (!storagePath) {
    return getPlaceholderUrl(bucket);
  }

  try {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(storagePath);
    
    return data.publicUrl;
  } catch (error) {
    console.error(`Error generating storage URL for ${bucket}:`, error);
    return getPlaceholderUrl(bucket);
  }
}

/**
 * Получает URL плацхолдера для типа изображения
 */
export function getPlaceholderUrl(bucket: StorageBucket): string {
  return IMAGE_CONFIG[bucket].placeholder;
}

/**
 * Получает alt текст для типа изображения
 */
export function getImageAlt(bucket: StorageBucket): string {
  return IMAGE_CONFIG[bucket].alt;
}

/**
 * Создает объект изображения с fallback для logbook медиа
 */
export function getLogbookImage(storagePath: string | null | undefined): ImageWithFallback {
  const src = storagePath ? getStorageUrl(storagePath, 'logbook') : getPlaceholderUrl('logbook');
  return {
    src,
    alt: getImageAlt('logbook'),
    fallback: getPlaceholderUrl('logbook')
  };
}

/**
 * Создает объект изображения с fallback для аватарок
 */
export function getAvatarImage(storagePath: string | null | undefined): ImageWithFallback {
  const src = storagePath ? getStorageUrl(storagePath, 'avatars') : getPlaceholderUrl('avatars');
  return {
    src,
    alt: getImageAlt('avatars'),
    fallback: getPlaceholderUrl('avatars')
  };
}

/**
 * Создает объект изображения с fallback для фото автомобилей
 */
export function getCarImage(storagePath: string | null | undefined): ImageWithFallback {
  const src = storagePath ? getStorageUrl(storagePath, 'car-photos') : getPlaceholderUrl('car-photos');
  return {
    src,
    alt: getImageAlt('car-photos'),
    fallback: getPlaceholderUrl('car-photos')
  };
}

/**
 * Проверяет, является ли URL валидным storage URL
 */
export function isStorageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    // Проверяем, что это URL от Supabase Storage
    return urlObj.hostname.includes('supabase') && urlObj.pathname.includes('/storage/');
  } catch {
    return false;
  }
}

/**
 * Извлекает storage_path из полного URL
 */
export function extractStoragePath(url: string, bucket: StorageBucket): string | null {
  try {
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(new RegExp(`/storage/v1/object/public/${bucket}/(.+)`));
    return pathMatch ? pathMatch[1] : null;
  } catch {
    return null;
  }
}

/**
 * Создает массив изображений с fallback для массива storage_path
 */
export function getLogbookImages(storagePaths: (string | null | undefined)[]): ImageWithFallback[] {
  return storagePaths
    .filter((path): path is string => Boolean(path))
    .map(path => getLogbookImage(path));
}

/**
 * Создает массив изображений с fallback для массива storage_path автомобилей
 */
export function getCarImages(storagePaths: (string | null | undefined)[]): ImageWithFallback[] {
  return storagePaths
    .filter((path): path is string => Boolean(path))
    .map(path => getCarImage(path));
}

/**
 * Универсальная функция для получения изображения по типу
 */
export function getImageByType(
  storagePath: string | null | undefined, 
  type: 'logbook' | 'avatars' | 'car-photos'
): ImageWithFallback {
  switch (type) {
    case 'logbook':
      return getLogbookImage(storagePath);
    case 'avatars':
      return getAvatarImage(storagePath);
    case 'car-photos':
      return getCarImage(storagePath);
    default:
      return getLogbookImage(storagePath);
  }
}

/**
 * Хук для обработки ошибок загрузки изображений
 */
export function useImageErrorHandler(fallbackUrl: string) {
  return (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = event.currentTarget;
    if (img.src !== fallbackUrl) {
      console.warn('Image failed to load, using fallback:', img.src);
      img.src = fallbackUrl;
    }
  };
}

/**
 * Валидирует путь файла перед операциями
 */
export function validateStoragePath(storagePath: string, expectedUserId: string, bucket: StorageBucket): boolean {
  if (!storagePath || !expectedUserId) {
    return false;
  }

  // Проверяем, что путь начинается с userId
  if (!storagePath.startsWith(`${expectedUserId}/`)) {
    console.warn(`Storage path validation failed: path ${storagePath} does not start with user ${expectedUserId}`);
    return false;
  }

  // Дополнительные проверки в зависимости от типа бакета
  switch (bucket) {
    case 'avatars':
      // Для аватарок: userId/filename
      const avatarParts = storagePath.split('/');
      if (avatarParts.length !== 2) {
        console.warn(`Invalid avatar path format: ${storagePath}`);
        return false;
      }
      break;
    
    case 'car-photos':
      // Для фото автомобилей: userId/carId/filename
      const carParts = storagePath.split('/');
      if (carParts.length !== 3) {
        console.warn(`Invalid car photo path format: ${storagePath}`);
        return false;
      }
      break;
    
    case 'logbook':
      // Для медиа логбука: userId/entryId/filename
      const logbookParts = storagePath.split('/');
      if (logbookParts.length !== 3) {
        console.warn(`Invalid logbook media path format: ${storagePath}`);
        return false;
      }
      break;
  }

  return true;
}

/**
 * Удаляет файл из Storage с проверкой прав доступа
 */
export async function deleteStorageFile(
  storagePath: string, 
  bucket: StorageBucket, 
  userId: string
): Promise<boolean> {
  try {
    // Валидируем путь
    if (!validateStoragePath(storagePath, userId, bucket)) {
      throw new Error('Invalid storage path or insufficient permissions');
    }

    const { error } = await supabase.storage
      .from(bucket)
      .remove([storagePath]);

    if (error) {
      console.error(`Error deleting file from ${bucket}:`, error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error(`Failed to delete file ${storagePath} from ${bucket}:`, error);
    throw error;
  }
}

/**
 * Удаляет аватар пользователя
 */
export async function deleteAvatar(storagePath: string, userId: string): Promise<boolean> {
  return deleteStorageFile(storagePath, 'avatars', userId);
}

/**
 * Удаляет фото автомобиля
 */
export async function deleteCarPhoto(storagePath: string, userId: string): Promise<boolean> {
  return deleteStorageFile(storagePath, 'car-photos', userId);
}

/**
 * Удаляет медиа логбука
 */
export async function deleteLogbookMedia(storagePath: string, userId: string): Promise<boolean> {
  return deleteStorageFile(storagePath, 'logbook', userId);
}

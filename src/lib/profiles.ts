import { supabase } from './supabaseClient';
import { Profile } from './types';

export interface UpdateProfileData {
  name?: string;
  handle?: string;
  about?: string;
  avatar_url?: string;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Profile not found
      }
      console.error('Error fetching profile:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getProfile:', error);
    throw error;
  }
}

export async function updateProfile(userId: string, profileData: UpdateProfileData): Promise<Profile> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...profileData,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateProfile:', error);
    throw error;
  }
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Error in uploadAvatar:', error);
    throw error;
  }
}

export function getAvatarUrl(storagePath: string): string {
  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(storagePath);
  
  return data.publicUrl;
}

export async function checkHandleAvailability(handle: string, currentUserId?: string): Promise<boolean> {
  try {
    let query = supabase
      .from('profiles')
      .select('id')
      .eq('handle', handle);

    if (currentUserId) {
      query = query.neq('id', currentUserId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error checking handle availability:', error);
      throw error;
    }

    return data.length === 0; // Available if no results
  } catch (error) {
    console.error('Error in checkHandleAvailability:', error);
    throw error;
  }
}

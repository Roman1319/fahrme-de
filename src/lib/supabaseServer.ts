// src/lib/supabaseServer.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createSupabaseConfig } from './env-validation';
import { cookies } from 'next/headers';

export function createSupabaseServerClient(req: NextRequest, res: NextResponse) {
  // Используем валидированную конфигурацию
  const config = createSupabaseConfig(false); // anon client для серверных операций
  
  return createServerClient(config.url, config.anonKey, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: Record<string, any>) {
        // важно: записываем cookie на ответ
        res.cookies.set(name, value, options);
      },
      remove(name: string, options: Record<string, any>) {
        res.cookies.set(name, '', { ...options, maxAge: 0 });
      },
    },
  });
}

/**
 * Создает серверный клиент для Server Components (правильная реализация по гайду Supabase)
 */
export function createServerSupabaseClient() {
  const config = createSupabaseConfig(false);
  const cookieStore = cookies();
  
  return createServerClient(config.url, config.anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: Record<string, any>) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch (error) {
          // В Server Components нельзя устанавливать cookies
          console.warn('[supabase] Cannot set cookie in Server Component:', error);
        }
      },
      remove(name: string, options: Record<string, any>) {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch (error) {
          // В Server Components нельзя удалять cookies
          console.warn('[supabase] Cannot remove cookie in Server Component:', error);
        }
      },
    },
  });
}

/**
 * Создает серверный клиент для API роутов (без response объекта)
 */
export function createSupabaseApiClient(req: NextRequest) {
  const config = createSupabaseConfig(false); // anon client для серверных операций
  
  return createServerClient(config.url, config.anonKey, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value;
      },
      set() {
        // В API роутах не можем устанавливать cookies
        // Это делается в middleware или в response
      },
      remove() {
        // В API роутах не можем удалять cookies
        // Это делается в middleware или в response
      },
    },
  });
}

/**
 * Создает серверный клиент с service role key (только для административных операций)
 */
export function createSupabaseServiceClient(req: NextRequest, res: NextResponse) {
  const config = createSupabaseConfig(true); // service client
  
  return createServerClient(config.url, config.serviceKey!, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: Record<string, any>) {
        res.cookies.set(name, value, options);
      },
      remove(name: string, options: Record<string, any>) {
        res.cookies.set(name, '', { ...options, maxAge: 0 });
      },
    },
  });
}

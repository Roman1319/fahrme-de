// src/lib/supabaseServer.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createSupabaseConfig } from './env-validation';

export function createSupabaseServerClient(req: NextRequest, res: NextResponse) {
  // Используем валидированную конфигурацию
  const config = createSupabaseConfig(false); // anon client для серверных операций
  
  return createServerClient(config.url, config.anonKey, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        // важно: записываем cookie на ответ
        res.cookies.set(name, value, options);
      },
      remove(name: string, options: any) {
        res.cookies.set(name, '', { ...options, maxAge: 0 });
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
      set(name: string, value: string, options: any) {
        res.cookies.set(name, value, options);
      },
      remove(name: string, options: any) {
        res.cookies.set(name, '', { ...options, maxAge: 0 });
      },
    },
  });
}

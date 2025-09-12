/**
 * Конфигурация Supabase с валидацией переменных окружения
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseConfig, validateSupabaseEnv, getConfigDebugInfo } from './env-validation';

// Валидация при импорте модуля
const validation = validateSupabaseEnv();

if (!validation.isValid) {
  console.error('[supabase-config] Environment validation failed:');
  validation.errors.forEach(error => console.error(`[supabase-config] ❌ ${error}`));
  throw new Error('Supabase configuration validation failed');
}

if (validation.warnings.length > 0) {
  console.warn('[supabase-config] Environment warnings:');
  validation.warnings.forEach(warning => console.warn(`[supabase-config] ⚠️  ${warning}`));
}

// Создание конфигурации
const config = createSupabaseConfig(false); // anon client
const serviceConfig = createSupabaseConfig(true); // service client

/**
 * Создает анонимный клиент Supabase
 */
export function createSupabaseClient(): SupabaseClient {
  return createClient(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    global: {
      headers: {
        'X-Client-Info': 'fahrme-de-anon'
      }
    }
  });
}

/**
 * Создает сервисный клиент Supabase (с service role key)
 */
export function createSupabaseServiceClient(): SupabaseClient {
  if (!serviceConfig.serviceKey) {
    throw new Error('Service role key is required for service client');
  }
  
  return createClient(config.url, serviceConfig.serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        'X-Client-Info': 'fahrme-de-service'
      }
    }
  });
}

/**
 * Создает серверный клиент Supabase (для API routes)
 */
export function createSupabaseServerClient(): SupabaseClient {
  // Для серверных операций используем anon client с RLS
  // Service client только для административных операций
  return createSupabaseClient();
}

/**
 * Получает информацию о конфигурации для отладки
 */
export function getSupabaseConfigInfo() {
  return {
    ...getConfigDebugInfo(),
    clients: {
      anon: {
        url: config.url,
        keyType: 'anon',
        hasKey: !!config.anonKey
      },
      service: {
        url: config.url,
        keyType: 'service',
        hasKey: !!serviceConfig.serviceKey
      }
    }
  };
}

/**
 * Проверяет подключение к Supabase
 */
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  error?: string;
  latency?: number;
}> {
  const client = createSupabaseClient();
  const startTime = Date.now();
  
  try {
    const { data, error } = await client
      .from('profiles')
      .select('id')
      .limit(1);
    
    const latency = Date.now() - startTime;
    
    if (error) {
      return {
        success: false,
        error: error.message,
        latency
      };
    }
    
    return {
      success: true,
      latency
    };
  } catch (err) {
    const latency = Date.now() - startTime;
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      latency
    };
  }
}

/**
 * Проверяет RLS политики
 */
export async function testRLSPolicies(): Promise<{
  success: boolean;
  error?: string;
  policies: string[];
}> {
  const client = createSupabaseClient();
  
  try {
    // Проверяем доступ к таблицам с RLS
    const tables = ['profiles', 'cars', 'logbook_entries', 'car_photos'];
    const results: string[] = [];
    
    for (const table of tables) {
      try {
        const { data, error } = await client
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          results.push(`${table}: ${error.message}`);
        } else {
          results.push(`${table}: OK`);
        }
      } catch (err) {
        results.push(`${table}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
    
    return {
      success: true,
      policies: results
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      policies: []
    };
  }
}

// Экспорт конфигурации для обратной совместимости
export const supabaseConfig = config;
export const supabaseServiceConfig = serviceConfig;

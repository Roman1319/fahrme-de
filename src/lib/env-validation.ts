/**
 * Валидация переменных окружения и конфигурации Supabase
 */

export interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  config: {
    supabaseUrl: string | null;
    supabaseAnonKey: string | null;
    supabaseServiceKey: string | null;
    nodeEnv: string;
    isDevelopment: boolean;
    isProduction: boolean;
  };
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceKey?: string;
  isServiceClient: boolean;
}

/**
 * Валидирует переменные окружения Supabase
 */
export function validateSupabaseEnv(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Получить переменные окружения
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  // Проверка обязательных переменных
  if (!supabaseUrl) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is required');
  }
  
  if (!supabaseAnonKey) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
  }
  
  // Проверка формата URL
  if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
    errors.push(`Invalid Supabase URL format: ${supabaseUrl}. Must start with https://`);
  }
  
  // Проверка формата ключа (JWT)
  if (supabaseAnonKey && !supabaseAnonKey.startsWith('eyJ')) {
    errors.push(`Invalid Supabase anon key format. Must be a JWT token starting with 'eyJ'`);
  }
  
  // Проверка формата service key
  if (supabaseServiceKey && !supabaseServiceKey.startsWith('eyJ')) {
    errors.push(`Invalid Supabase service key format. Must be a JWT token starting with 'eyJ'`);
  }
  
  // Проверка на пробелы в начале/конце
  if (supabaseUrl && (supabaseUrl !== process.env.NEXT_PUBLIC_SUPABASE_URL)) {
    warnings.push('NEXT_PUBLIC_SUPABASE_URL had leading/trailing spaces (auto-trimmed)');
  }
  
  if (supabaseAnonKey && (supabaseAnonKey !== process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
    warnings.push('NEXT_PUBLIC_SUPABASE_ANON_KEY had leading/trailing spaces (auto-trimmed)');
  }
  
  // Проверка на дублирование переменных
  if (supabaseUrl === supabaseAnonKey) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY cannot be the same');
  }
  
  // Проверка на тестовые значения
  if (supabaseUrl === 'https://example.supabase.co') {
    warnings.push('Using example Supabase URL - make sure to replace with real URL');
  }
  
  if (supabaseAnonKey === 'your-anon-key') {
    warnings.push('Using placeholder anon key - make sure to replace with real key');
  }
  
  // Проверка окружения
  if (nodeEnv === 'production' && supabaseUrl?.includes('localhost')) {
    errors.push('Cannot use localhost URL in production environment');
  }
  
  if (nodeEnv === 'development' && !supabaseUrl?.includes('localhost') && !supabaseUrl?.includes('supabase.co')) {
    warnings.push('Development environment should use localhost or supabase.co URL');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    config: {
      supabaseUrl,
      supabaseAnonKey,
      supabaseServiceKey,
      nodeEnv,
      isDevelopment: nodeEnv === 'development',
      isProduction: nodeEnv === 'production'
    }
  };
}

/**
 * Создает конфигурацию Supabase с валидацией
 */
export function createSupabaseConfig(isServiceClient: boolean = false): SupabaseConfig {
  const validation = validateSupabaseEnv();
  
  if (!validation.isValid) {
    throw new Error(`Supabase configuration validation failed:\n${validation.errors.join('\n')}`);
  }
  
  const { supabaseUrl, supabaseAnonKey, supabaseServiceKey } = validation.config;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Required Supabase environment variables are missing');
  }
  
  if (isServiceClient && !supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for service client');
  }
  
  return {
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
    serviceKey: supabaseServiceKey,
    isServiceClient
  };
}

/**
 * Проверяет, можно ли использовать серверный клиент
 */
export function shouldUseServiceClient(operation: string, requiresAuth: boolean = true): boolean {
  // Операции, которые всегда должны использовать service client
  const serviceClientOperations = [
    'admin',
    'system',
    'migration',
    'cleanup',
    'bulk_operation'
  ];
  
  if (serviceClientOperations.some(op => operation.includes(op))) {
    return true;
  }
  
  // Если операция не требует аутентификации, можно использовать anon client
  if (!requiresAuth) {
    return false;
  }
  
  // Для операций, зависящих от RLS, лучше использовать аутентифицированного пользователя
  return false;
}

/**
 * Получает информацию о конфигурации для отладки
 */
export function getConfigDebugInfo(): Record<string, any> {
  const validation = validateSupabaseEnv();
  
  return {
    validation: {
      isValid: validation.isValid,
      errorCount: validation.errors.length,
      warningCount: validation.warnings.length
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      isDevelopment: process.env.NODE_ENV === 'development',
      isProduction: process.env.NODE_ENV === 'production'
    },
    supabase: {
      url: validation.config.supabaseUrl ? 'Set' : 'Missing',
      urlLength: validation.config.supabaseUrl?.length || 0,
      anonKey: validation.config.supabaseAnonKey ? 'Set' : 'Missing',
      anonKeyLength: validation.config.supabaseAnonKey?.length || 0,
      serviceKey: validation.config.supabaseServiceKey ? 'Set' : 'Missing',
      serviceKeyLength: validation.config.supabaseServiceKey?.length || 0
    },
    errors: validation.errors,
    warnings: validation.warnings
  };
}

/**
 * Валидирует переменные окружения при запуске приложения
 */
export function validateEnvOnStartup(): void {
  const validation = validateSupabaseEnv();
  
  console.log('[env-validation] Starting environment validation...');
  
  if (validation.warnings.length > 0) {
    console.warn('[env-validation] Warnings:');
    validation.warnings.forEach(warning => {
      console.warn(`[env-validation] ⚠️  ${warning}`);
    });
  }
  
  if (validation.errors.length > 0) {
    console.error('[env-validation] Errors:');
    validation.errors.forEach(error => {
      console.error(`[env-validation] ❌ ${error}`);
    });
    throw new Error('Environment validation failed. Check the errors above.');
  }
  
  console.log('[env-validation] ✅ Environment validation passed');
}

/**
 * Проверяет, что переменные окружения изменились
 */
export function detectEnvChanges(): string[] {
  const changes: string[] = [];
  
  // Проверка на изменения в .env файле
  const currentUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const currentKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // В реальном приложении здесь можно добавить сравнение с предыдущими значениями
  // Для демонстрации просто проверяем наличие
  if (currentUrl && currentKey) {
    changes.push('Environment variables loaded successfully');
  }
  
  return changes;
}

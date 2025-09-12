/**
 * Утилиты для работы с конфигурацией и переменными окружения
 */

import { validateSupabaseEnv, shouldUseServiceClient } from './env-validation';

/**
 * Проверяет, что приложение готово к работе
 */
export function isAppReady(): boolean {
  try {
    const validation = validateSupabaseEnv();
    return validation.isValid;
  } catch (error) {
    console.error('[config-utils] App readiness check failed:', error);
    return false;
  }
}

/**
 * Получает информацию о текущем окружении
 */
export function getEnvironmentInfo() {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

/**
 * Проверяет, нужно ли использовать service client для операции
 */
export function shouldUseServiceClientForOperation(operation: string, requiresAuth: boolean = true): boolean {
  return shouldUseServiceClient(operation, requiresAuth);
}

/**
 * Получает рекомендуемый тип клиента для операции
 */
export function getRecommendedClientType(operation: string, requiresAuth: boolean = true): 'anon' | 'service' {
  if (shouldUseServiceClientForOperation(operation, requiresAuth)) {
    return 'service';
  }
  return 'anon';
}

/**
 * Валидирует конфигурацию перед выполнением операции
 */
export function validateConfigForOperation(operation: string, requiresAuth: boolean = true): {
  isValid: boolean;
  recommendedClient: 'anon' | 'service';
  errors: string[];
  warnings: string[];
} {
  const validation = validateSupabaseEnv();
  const recommendedClient = getRecommendedClientType(operation, requiresAuth);
  
  const errors: string[] = [...validation.errors];
  const warnings: string[] = [...validation.warnings];
  
  // Дополнительные проверки для конкретных операций
  if (recommendedClient === 'service' && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    errors.push(`Operation '${operation}' requires service client but SUPABASE_SERVICE_ROLE_KEY is not set`);
  }
  
  if (requiresAuth && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    errors.push(`Operation '${operation}' requires authentication but NEXT_PUBLIC_SUPABASE_ANON_KEY is not set`);
  }
  
  return {
    isValid: errors.length === 0,
    recommendedClient,
    errors,
    warnings
  };
}

/**
 * Создает конфигурацию для клиента Supabase
 */
export function createClientConfig(clientType: 'anon' | 'service' = 'anon') {
  const validation = validateSupabaseEnv();
  
  if (!validation.isValid) {
    throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
  }
  
  const { supabaseUrl, supabaseAnonKey, supabaseServiceKey } = validation.config;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Required Supabase environment variables are missing');
  }
  
  if (clientType === 'service' && !supabaseServiceKey) {
    throw new Error('Service role key is required for service client');
  }
  
  return {
    url: supabaseUrl,
    key: clientType === 'service' ? supabaseServiceKey! : supabaseAnonKey,
    clientType,
    headers: {
      'X-Client-Info': `fahrme-de-${clientType}`,
      'X-Operation-Type': clientType
    }
  };
}

/**
 * Логирует информацию о конфигурации (только в development)
 */
export function logConfigInfo(operation: string, clientType: 'anon' | 'service' = 'anon') {
  if (process.env.NODE_ENV !== 'development') return;
  
  const envInfo = getEnvironmentInfo();
  const config = createClientConfig(clientType);
  
  console.log(`[config-utils] Operation: ${operation}`);
  console.log(`[config-utils] Client type: ${clientType}`);
  console.log(`[config-utils] Environment: ${envInfo.nodeEnv}`);
  console.log(`[config-utils] Supabase URL: ${config.url}`);
  console.log(`[config-utils] Key type: ${config.clientType}`);
}

/**
 * Проверяет, что переменные окружения изменились
 */
export function detectEnvironmentChanges(): {
  hasChanges: boolean;
  changes: string[];
  recommendations: string[];
} {
  const changes: string[] = [];
  const recommendations: string[] = [];
  
  // Проверка на наличие переменных
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    changes.push('NEXT_PUBLIC_SUPABASE_URL is missing');
    recommendations.push('Set NEXT_PUBLIC_SUPABASE_URL in your .env.local file');
  }
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    changes.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing');
    recommendations.push('Set NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file');
  }
  
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    recommendations.push('Consider setting SUPABASE_SERVICE_ROLE_KEY for admin operations');
  }
  
  // Проверка на тестовые значения
  if (process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://example.supabase.co') {
    changes.push('Using example Supabase URL');
    recommendations.push('Replace with your actual Supabase project URL');
  }
  
  if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'your-anon-key') {
    changes.push('Using placeholder anon key');
    recommendations.push('Replace with your actual Supabase anon key');
  }
  
  return {
    hasChanges: changes.length > 0,
    changes,
    recommendations
  };
}

/**
 * Создает отчет о конфигурации
 */
export function generateConfigReport(): {
  summary: {
    isValid: boolean;
    hasWarnings: boolean;
    environment: string;
    clientTypes: string[];
  };
  details: {
    environment: ReturnType<typeof getEnvironmentInfo>;
    validation: ReturnType<typeof validateSupabaseEnv>;
    changes: ReturnType<typeof detectEnvironmentChanges>;
  };
  recommendations: string[];
} {
  const validation = validateSupabaseEnv();
  const envInfo = getEnvironmentInfo();
  const changes = detectEnvironmentChanges();
  
  const recommendations: string[] = [];
  
  if (!validation.isValid) {
    recommendations.push('Fix environment variable errors before proceeding');
  }
  
  if (validation.warnings.length > 0) {
    recommendations.push('Review and address configuration warnings');
  }
  
  if (changes.hasChanges) {
    recommendations.push('Update environment variables as needed');
  }
  
  if (!envInfo.hasServiceKey) {
    recommendations.push('Consider adding service role key for admin operations');
  }
  
  return {
    summary: {
      isValid: validation.isValid,
      hasWarnings: validation.warnings.length > 0,
      environment: envInfo.nodeEnv,
      clientTypes: ['anon', ...(envInfo.hasServiceKey ? ['service'] : [])]
    },
    details: {
      environment: envInfo,
      validation,
      changes
    },
    recommendations
  };
}

/**
 * Проверяет готовность к продакшену
 */
export function checkProductionReadiness(): {
  isReady: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  if (process.env.NODE_ENV !== 'production') {
    return {
      isReady: true,
      issues: [],
      recommendations: ['This check is only relevant in production']
    };
  }
  
  // Проверки для продакшена
  if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('localhost')) {
    issues.push('Cannot use localhost URL in production');
    recommendations.push('Use production Supabase URL');
  }
  
  if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('supabase.co') && 
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('https://')) {
    issues.push('Supabase URL must use HTTPS in production');
    recommendations.push('Ensure URL starts with https://');
  }
  
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    recommendations.push('Consider adding service role key for admin operations');
  }
  
  return {
    isReady: issues.length === 0,
    issues,
    recommendations
  };
}

/**
 * Аудит использования серверных клиентов Supabase
 */

import { shouldUseServiceClientForOperation, getRecommendedClientType } from './config-utils';

export interface ClientUsageAudit {
  endpoint: string;
  method: string;
  currentClient: 'anon' | 'service' | 'unknown';
  recommendedClient: 'anon' | 'service';
  requiresAuth: boolean;
  operation: string;
  isCorrect: boolean;
  issues: string[];
  recommendations: string[];
}

/**
 * Аудит всех API endpoints
 */
export function auditAllEndpoints(): ClientUsageAudit[] {
  const endpoints: Array<{
    endpoint: string;
    method: string;
    operation: string;
    requiresAuth: boolean;
    currentClient: 'anon' | 'service' | 'unknown';
  }> = [
    // Cars API
    {
      endpoint: '/api/cars',
      method: 'GET',
      operation: 'read_cars',
      requiresAuth: false,
      currentClient: 'anon'
    },
    {
      endpoint: '/api/cars/[carId]/stats',
      method: 'GET',
      operation: 'read_car_stats',
      requiresAuth: false,
      currentClient: 'anon'
    },
    {
      endpoint: '/api/cars/[carId]/follow',
      method: 'POST',
      operation: 'follow_car',
      requiresAuth: true,
      currentClient: 'anon'
    },
    {
      endpoint: '/api/cars/[carId]/follow',
      method: 'DELETE',
      operation: 'unfollow_car',
      requiresAuth: true,
      currentClient: 'anon'
    },

    // COTD API
    {
      endpoint: '/api/cotd/today',
      method: 'GET',
      operation: 'read_cotd_candidates',
      requiresAuth: false,
      currentClient: 'anon'
    },
    {
      endpoint: '/api/cotd/vote',
      method: 'POST',
      operation: 'vote_cotd',
      requiresAuth: true,
      currentClient: 'anon'
    },
    {
      endpoint: '/api/cotd/admin',
      method: 'POST',
      operation: 'admin_cotd',
      requiresAuth: true,
      currentClient: 'anon'
    },

    // Filters API
    {
      endpoint: '/api/filters/brands',
      method: 'GET',
      operation: 'read_brands',
      requiresAuth: false,
      currentClient: 'anon'
    },
    {
      endpoint: '/api/filters/models',
      method: 'GET',
      operation: 'read_models',
      requiresAuth: false,
      currentClient: 'anon'
    },
    {
      endpoint: '/api/filters/years',
      method: 'GET',
      operation: 'read_years',
      requiresAuth: false,
      currentClient: 'anon'
    },

    // Logbook API
    {
      endpoint: '/api/logbook',
      method: 'POST',
      operation: 'create_logbook_entry',
      requiresAuth: true,
      currentClient: 'anon'
    },
    {
      endpoint: '/api/logbook/[entryId]',
      method: 'PATCH',
      operation: 'update_logbook_entry',
      requiresAuth: true,
      currentClient: 'anon'
    },
    {
      endpoint: '/api/logbook/[entryId]',
      method: 'DELETE',
      operation: 'delete_logbook_entry',
      requiresAuth: true,
      currentClient: 'anon'
    },
    {
      endpoint: '/api/logbook/[entryId]/comments',
      method: 'GET',
      operation: 'read_comments',
      requiresAuth: false,
      currentClient: 'anon'
    },
    {
      endpoint: '/api/logbook/[entryId]/comments',
      method: 'POST',
      operation: 'create_comment',
      requiresAuth: true,
      currentClient: 'anon'
    },
    {
      endpoint: '/api/logbook/media',
      method: 'POST',
      operation: 'upload_media',
      requiresAuth: true,
      currentClient: 'anon'
    },

    // Comments API
    {
      endpoint: '/api/comments/[commentId]',
      method: 'PATCH',
      operation: 'update_comment',
      requiresAuth: true,
      currentClient: 'anon'
    },
    {
      endpoint: '/api/comments/[commentId]',
      method: 'DELETE',
      operation: 'delete_comment',
      requiresAuth: true,
      currentClient: 'anon'
    },

    // Profile API
    {
      endpoint: '/api/profile',
      method: 'PATCH',
      operation: 'update_profile',
      requiresAuth: true,
      currentClient: 'anon'
    }
  ];

  return endpoints.map(endpoint => auditEndpoint(endpoint));
}

/**
 * Аудит конкретного endpoint
 */
function auditEndpoint(endpoint: {
  endpoint: string;
  method: string;
  operation: string;
  requiresAuth: boolean;
  currentClient: 'anon' | 'service' | 'unknown';
}): ClientUsageAudit {
  const recommendedClient = getRecommendedClientType(endpoint.operation, endpoint.requiresAuth);
  const isCorrect = endpoint.currentClient === recommendedClient;
  
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  if (!isCorrect) {
    if (endpoint.currentClient === 'anon' && recommendedClient === 'service') {
      issues.push('Should use service client for admin operations');
      recommendations.push('Switch to service client for better security');
    } else if (endpoint.currentClient === 'service' && recommendedClient === 'anon') {
      issues.push('Should use anon client for user operations');
      recommendations.push('Switch to anon client to respect RLS policies');
    }
  }
  
  // Специфичные рекомендации для операций
  if (endpoint.operation.includes('admin')) {
    if (endpoint.currentClient === 'anon') {
      issues.push('Admin operations should use service client');
      recommendations.push('Use service client for admin operations to bypass RLS');
    }
  }
  
  if (endpoint.operation.includes('bulk') || endpoint.operation.includes('system')) {
    if (endpoint.currentClient === 'anon') {
      issues.push('Bulk operations should use service client');
      recommendations.push('Use service client for bulk operations');
    }
  }
  
  if (endpoint.requiresAuth && endpoint.currentClient === 'anon') {
    // Это нормально - anon client с RLS для аутентифицированных операций
    recommendations.push('Current setup is correct - anon client with RLS for authenticated operations');
  }
  
  return {
    endpoint: endpoint.endpoint,
    method: endpoint.method,
    currentClient: endpoint.currentClient,
    recommendedClient,
    requiresAuth: endpoint.requiresAuth,
    operation: endpoint.operation,
    isCorrect,
    issues,
    recommendations
  };
}

/**
 * Получает сводку аудита
 */
export function getAuditSummary(audits: ClientUsageAudit[]): {
  total: number;
  correct: number;
  incorrect: number;
  issues: string[];
  recommendations: string[];
} {
  const correct = audits.filter(a => a.isCorrect).length;
  const incorrect = audits.filter(a => !a.isCorrect).length;
  
  const allIssues = audits.flatMap(a => a.issues);
  const allRecommendations = audits.flatMap(a => a.recommendations);
  
  return {
    total: audits.length,
    correct,
    incorrect,
    issues: [...new Set(allIssues)],
    recommendations: [...new Set(allRecommendations)]
  };
}

/**
 * Проверяет, нужно ли изменить клиент для endpoint
 */
export function shouldChangeClient(endpoint: string, method: string): {
  shouldChange: boolean;
  currentClient: 'anon' | 'service' | 'unknown';
  recommendedClient: 'anon' | 'service';
  reason: string;
} {
  const audits = auditAllEndpoints();
  const audit = audits.find(a => a.endpoint === endpoint && a.method === method);
  
  if (!audit) {
    return {
      shouldChange: false,
      currentClient: 'unknown',
      recommendedClient: 'anon',
      reason: 'Endpoint not found in audit'
    };
  }
  
  return {
    shouldChange: !audit.isCorrect,
    currentClient: audit.currentClient,
    recommendedClient: audit.recommendedClient,
    reason: audit.issues.join(', ') || 'No issues found'
  };
}

/**
 * Получает рекомендации по улучшению использования клиентов
 */
export function getClientRecommendations(): {
  priority: 'high' | 'medium' | 'low';
  category: string;
  description: string;
  affectedEndpoints: string[];
  action: string;
}[] {
  const audits = auditAllEndpoints();
  const recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    category: string;
    description: string;
    affectedEndpoints: string[];
    action: string;
  }> = [];
  
  // Высокий приоритет: админские операции используют anon client
  const adminEndpoints = audits.filter(a => 
    a.operation.includes('admin') && a.currentClient === 'anon'
  );
  
  if (adminEndpoints.length > 0) {
    recommendations.push({
      priority: 'high',
      category: 'Security',
      description: 'Admin operations should use service client',
      affectedEndpoints: adminEndpoints.map(a => `${a.method} ${a.endpoint}`),
      action: 'Switch admin endpoints to service client'
    });
  }
  
  // Средний приоритет: массовые операции
  const bulkEndpoints = audits.filter(a => 
    (a.operation.includes('bulk') || a.operation.includes('system')) && a.currentClient === 'anon'
  );
  
  if (bulkEndpoints.length > 0) {
    recommendations.push({
      priority: 'medium',
      category: 'Performance',
      description: 'Bulk operations should use service client',
      affectedEndpoints: bulkEndpoints.map(a => `${a.method} ${a.endpoint}`),
      action: 'Consider using service client for bulk operations'
    });
  }
  
  // Низкий приоритет: общие рекомендации
  const userEndpoints = audits.filter(a => 
    a.requiresAuth && a.currentClient === 'anon' && a.isCorrect
  );
  
  if (userEndpoints.length > 0) {
    recommendations.push({
      priority: 'low',
      category: 'Best Practices',
      description: 'User operations correctly use anon client with RLS',
      affectedEndpoints: userEndpoints.map(a => `${a.method} ${a.endpoint}`),
      action: 'Continue current approach - anon client with RLS is correct'
    });
  }
  
  return recommendations;
}

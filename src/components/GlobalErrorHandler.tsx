'use client';
import { useEffect } from 'react';

export default function GlobalErrorHandler() {
  useEffect(() => {
    // Глобальный обработчик ошибок для ловли async client component ошибок
    const handleError = (event: ErrorEvent) => {
      if (event.error?.message?.includes('async Client Component')) {
        console.error('[GLOBAL ERROR HANDLER] Async Client Component Error:', {
          message: event.error.message,
          stack: event.error.stack,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        });
      }
    };

    // Обработчик необработанных промисов
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes('async Client Component')) {
        console.error('[GLOBAL ERROR HANDLER] Unhandled Promise Rejection:', {
          reason: event.reason,
          promise: event.promise
        });
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null;
}

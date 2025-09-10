'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Car page error:', error);
  }, [error]);

  return (
    <main className="pb-12">
      <section className="space-y-4">
        <div className="section text-center py-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Что-то пошло не так
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Не удалось загрузить страницу автомобиля. Попробуйте обновить страницу.
          </p>
          <button
            onClick={reset}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Попробовать снова
          </button>
        </div>
      </section>
    </main>
  );
}

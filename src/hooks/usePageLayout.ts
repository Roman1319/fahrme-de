"use client";

import { useAuth } from "@/components/AuthProvider";

export function usePageLayout() {
  const { user } = useAuth();
  
  return {
    isAuthenticated: !!user,
    // Возвращает классы для контента в зависимости от статуса аутентификации
    getContentClasses: (additionalClasses = "") => {
      if (user) {
        // Для авторизованных пользователей контент будет рядом с сайдбаром
        return `flex-1 flex flex-col ${additionalClasses}`;
      }
      // Для неавторизованных пользователей обычный контент
      return `min-h-screen flex flex-col ${additionalClasses}`;
    }
  };
}

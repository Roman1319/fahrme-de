"use client";

import { useAuth } from "./AuthProvider";
import Sidebar from "./Sidebar";
import SiteFooter from "./SiteFooter";
import PageWrapper from "./PageWrapper";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user, authReady, isLoading } = useAuth();

  // Показываем загрузку пока проверяется авторизация
  if (!authReady || isLoading) {
    return <>{children}</>;
  }

  // Если пользователь не зарегистрирован, показываем контент без навигации
  if (!user) {
    return <>{children}</>;
  }

  // Для зарегистрированных пользователей показываем навигацию
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-1 max-w-5xl mx-auto w-full">
        {/* Левая боковая навигация */}
        <Sidebar />
        
        {/* Основной контент */}
        <div className="flex-1 px-4">
          <PageWrapper>
            {children}
          </PageWrapper>
        </div>
      </div>
      {/* Подвал вне контейнера для полной ширины */}
      <SiteFooter />
    </div>
  );
}

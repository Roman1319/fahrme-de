"use client";

import { useAuth } from "./AuthProvider";
import Sidebar from "./Sidebar";
import SiteFooter from "./SiteFooter";
import PageWrapper from "./PageWrapper";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user } = useAuth();

  // Если пользователь не зарегистрирован, показываем контент без навигации
  if (!user) {
    return <>{children}</>;
  }

  // Для зарегистрированных пользователей показываем навигацию
  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto flex flex-1">
        {/* Боковая навигация */}
        <Sidebar />
        
        {/* Основной контент - автоматически рядом с сайдбаром */}
        <PageWrapper>
          {children}
        </PageWrapper>
      </div>
      {/* Подвал вне контейнера для полной ширины */}
      <SiteFooter />
    </div>
  );
}

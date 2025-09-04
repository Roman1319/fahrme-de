"use client";

import { useAuth } from "./AuthProvider";
import Sidebar from "./Sidebar";

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
    <div className="min-h-screen">
      <div className="container mx-auto flex">
        {/* Боковая навигация */}
        <Sidebar />
        
        {/* Основной контент */}
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}

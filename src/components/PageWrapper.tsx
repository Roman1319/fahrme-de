"use client";

import { useAuth } from "@/components/AuthProvider";

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export default function PageWrapper({ children, className = "" }: PageWrapperProps) {
  const { user } = useAuth();
  
  // Если пользователь не авторизован, возвращаем контент как есть
  if (!user) {
    return <>{children}</>;
  }
  
  // Для авторизованных пользователей контент автоматически будет рядом с сайдбаром
  return (
    <div className={`flex-1 flex flex-col ${className}`}>
      {children}
    </div>
  );
}

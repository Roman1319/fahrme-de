"use client";

import { useAuth } from "@/components/AuthProvider";
import Guard from "@/components/auth/Guard";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Settings, 
  Users, 
  Car, 
  Image, 
  BarChart3, 
  Database,
  Trash2,
  Shield
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const pathname = usePathname();

  const menuItems = [
    {
      name: "Обзор",
      href: "/admin",
      icon: BarChart3,
    },
    {
      name: "Пользователи",
      href: "/admin/users",
      icon: Users,
    },
    {
      name: "Автомобили",
      href: "/admin/cars",
      icon: Car,
    },
    {
      name: "Фотографии",
      href: "/admin/photos",
      icon: Image,
    },
    {
      name: "Очистка данных",
      href: "/admin/cleanup",
      icon: Trash2,
    },
    {
      name: "База данных",
      href: "/admin/database",
      icon: Database,
    },
    {
      name: "Настройки",
      href: "/admin/settings",
      icon: Settings,
    },
  ];

  return (
    <Guard>
      <div className="min-h-screen bg-[#0A0A0A] text-white">
        {/* Header */}
        <div className="bg-[#1A1A1A] border-b border-[#333] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-purple-500" />
              <h1 className="text-2xl font-bold">Админ-панель</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">
                {user?.email}
              </span>
              <Link 
                href="/my-cars"
                className="text-purple-500 hover:text-purple-400 transition-colors"
              >
                ← Назад к сайту
              </Link>
            </div>
          </div>
        </div>

        <div className="flex min-h-screen">
          {/* Sidebar */}
          <div className="w-80 bg-[#1A1A1A] border-r border-[#333] flex-shrink-0">
            <nav className="p-8">
              <ul className="space-y-4">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center space-x-4 px-6 py-5 rounded-xl transition-colors ${
                          isActive
                            ? "bg-purple-600 text-white"
                            : "text-gray-300 hover:bg-[#333] hover:text-white"
                        }`}
                      >
                        <Icon className="h-6 w-6" />
                        <span className="text-lg font-medium">{item.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="p-12 max-w-none">
              {children}
            </div>
          </div>
        </div>
      </div>
    </Guard>
  );
}

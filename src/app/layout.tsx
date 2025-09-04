import "./globals.css";
import Providers from "./providers";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ClientHeader from "@/components/ClientHeader";
import MainLayout from "@/components/MainLayout";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "fahrme.de",
  description: "Auto-Community MVP",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className={`${inter.variable} min-h-dvh antialiased font-sans`}>
        <Providers>
          {/* ГЛОБАЛЬНЫЙ HEADER ДЛЯ ЗАЛОГИНЕННЫХ */}
          <ClientHeader />
          {/* Основной layout с навигацией для зарегистрированных пользователей */}
          <MainLayout>
            {children}
          </MainLayout>
        </Providers>
      </body>
    </html>
  );
}

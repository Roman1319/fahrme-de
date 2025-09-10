import "./globals.css";
import Providers from "./providers";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ClientHeader from "@/components/ClientHeader";
import MainLayout from "@/components/MainLayout";
import GlobalErrorHandler from "@/components/GlobalErrorHandler";
import AsyncComponentDetector from "@/components/AsyncComponentDetector";
import AsyncComponentDebugger from "@/components/AsyncComponentDebugger";
import ComponentAnalyzer from "@/components/ComponentAnalyzer";

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-sans",
  display: 'swap',
  preload: true
});

export const metadata: Metadata = {
  title: "fahrme.de",
  description: "Auto-Community MVP",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className={`${inter.variable} min-h-dvh antialiased font-sans`}>
        <Providers>
          <GlobalErrorHandler />
          <AsyncComponentDetector />
          <AsyncComponentDebugger />
          <ComponentAnalyzer />
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

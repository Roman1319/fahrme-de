"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

export default function RedirectIfAuthed() {
  const { user, authReady } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && user) {
      console.log('[RedirectIfAuthed] User found in context, redirecting to /feed');
      router.replace("/feed");
    }
  }, [user, router, mounted]);

  // Immediate check when component mounts
  useEffect(() => {
    if (user) {
      console.log('[RedirectIfAuthed] Immediate redirect on mount');
      router.replace("/feed");
    }
  }, [user, router]);

  // Показываем индикатор загрузки во время проверки
  if (!mounted) {
    return null;
  }

  return null;
}

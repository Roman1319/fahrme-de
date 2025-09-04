"use client";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <Sun size={16} />;

  const isDark = theme !== "light";
  return (
    <div onClick={() => setTheme(isDark ? "light" : "dark")} className="cursor-pointer">
      {isDark ? <Sun size={16}/> : <Moon size={16}/>}
    </div>
  );
}
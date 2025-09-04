"use client";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "./AuthProvider";
import NotificationsButton from "./NotificationsButton";
import MessagesButton from "./MessagesButton";
import UserMenu from "./UserMenu";
import ProfileMenu from "./ui/ProfileMenu";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  variant?: "default" | "feed";  // feed — с большой search-пилюлей
  showAuth?: boolean;
};

export default function Header({ variant="default", showAuth=true }: Props) {
  const { user } = useAuth();
  const homeHref = user ? "/feed" : "/";
  const router = useRouter();
  const [q, setQ] = useState("");

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    if (query) router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <header className="header-blur">
      <div className="container flex items-center justify-between gap-3 py-3">
        {/* Лого */}
        <a href={homeHref} className="flex items-center gap-2 shrink-0">
          <img src="/logo.png" alt="fahrme.de" className="h-6 w-auto rounded-md" />
          <span className="font-extrabold text-lg">fahrme.de</span>
        </a>

        {/* Центр: поисковая пилюля — только для фида */}
        <div className="flex-1 max-w-[820px] mx-4 hidden md:block">
          {variant==="feed" && (
            <form className="search-pill" onSubmit={onSearch}>
              <Search size={16} className="search-icon" />
              <input
                value={q}
                onChange={(e)=>setQ(e.target.value)}
                placeholder="Suche in Beiträgen & Logbüchern"
                aria-label="Suche"
              />
              <button type="submit" className="search-btn">Suchen</button>
            </form>
          )}
        </div>

        {/* Правый кластер */}
        <div className="flex items-center gap-2">
          <button className="icon-btn icon-btn--tight" title="Theme">
            <ThemeToggle/>
          </button>
          {user && <MessagesButton/>}
          {user && <NotificationsButton/>}
          {!user && showAuth && (
            <>
              <a href="/login" className="btn-ghost">Einloggen</a>
              <a href="/register" className="btn-accent">Registrieren</a>
            </>
          )}
          {user && <ProfileMenu />}
        </div>
      </div>
    </header>
  );
}
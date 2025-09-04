"use client";
import { Home, Sparkles, Clock3, User, Settings, Info } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const startHref = user ? "/feed" : "/";

  const items = [
    { icon: Home, label: "Startseite", href: startHref },
    { icon: Sparkles, label: "Beliebt", href: "/explore?tab=top" },
    { icon: Clock3,  label: "Neueste", href: "/explore?tab=new" },
    { icon: User,    label: "Profil",  href: "/profile/me" },
    { icon: Settings,label: "Einstellungen", href: "/settings" },
    { icon: Info,    label: "Über uns", href: "/about" },
  ];

  return (
    <aside className="hidden lg:block w-48 sidebar-container">
      <div className="p-4 h-full">
        <nav className="flex flex-col gap-2">
          {items.map(({ icon:Icon, label, href }) => {
            const isActive = pathname === href || (href === "/feed" && pathname === "/");
            return (
              <a 
                key={href+label} 
                href={href} 
                className={`
                  sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                  ${isActive 
                    ? 'sidebar-item--active' 
                    : 'sidebar-item--inactive'
                  }
                `}
              >
                <Icon size={16} className="flex-shrink-0"/>
                <span className="text-sm font-medium truncate">{label}</span>
              </a>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
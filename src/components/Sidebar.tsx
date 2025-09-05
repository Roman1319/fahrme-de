"use client";
import { Home, Sparkles, Clock3, Car, Settings, Heart, History, Eye } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { usePathname } from "next/navigation";
import { useMainVehicle } from "@/hooks/useMainVehicle";

export default function Sidebar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const startHref = user ? "/feed" : "/";
  const { mainVehicle, isLoading } = useMainVehicle();

  const mainItems = [
    { icon: Home, label: "Startseite", href: startHref },
    { icon: Sparkles, label: "Beliebt", href: "/explore?tab=top" },
    { icon: Clock3,  label: "Neueste", href: "/explore?tab=new" },
  ];

  // Dynamisch erstellte Unterpunkte für Meine Autos
  const getMyItems = () => {
    const subItems = [
      { label: "Alle Autos", href: "/my-cars" }
    ];

    if (mainVehicle && !isLoading) {
      subItems.unshift({
        label: `${mainVehicle.make} ${mainVehicle.model}`,
        href: `/car/${mainVehicle.id}`
      });
    } else if (!isLoading) {
      subItems.unshift({
        label: "Kein Hauptauto",
        href: "/my-cars?filter=main"
      });
    }

    return [
      { icon: Car, label: "Meine Autos", href: "/my-cars", subItems },
      { icon: Heart, label: "Favoriten", href: "/favorites" },
      { icon: History, label: "Verlauf", href: "/history" },
      { icon: Eye, label: "Besucher", href: "/visitors" },
    ];
  };

  const myItems = getMyItems();

  const settingsItems = [
    { icon: Settings, label: "Einstellungen", href: "/settings" },
  ];

  const renderItem = (item: any, isSubItem = false, showCarImage = false) => {
    const isActive = pathname === item.href || (item.href === "/feed" && pathname === "/");
    return (
      <a 
        key={item.href + item.label} 
        href={item.href} 
        className={`
          sidebar-item flex items-center gap-2 px-2 py-2 rounded-xl transition-all duration-200
          ${isActive 
            ? 'sidebar-item--active' 
            : 'sidebar-item--inactive'
          }
          ${isSubItem ? 'ml-1 text-sm' : ''}
        `}
      >
        {!isSubItem && <item.icon size={16} className="flex-shrink-0"/>}
        {showCarImage && mainVehicle && (
          <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
            {mainVehicle.images && mainVehicle.images.length > 0 ? (
              <img 
                src={mainVehicle.images[0]} 
                alt={mainVehicle.make}
                className="w-full h-full object-cover"
              />
            ) : (
              <Car size={12} className="text-neutral-500" />
            )}
          </div>
        )}
        <span className="text-sm font-medium truncate">{item.label}</span>
      </a>
    );
  };

  return (
    <aside className="hidden lg:block w-52 sidebar-container">
      <div className="p-4 h-full">
        <nav className="flex flex-col gap-2">
          {/* Hauptbereiche */}
          {mainItems.map(item => renderItem(item))}
          
          {/* Trennlinie */}
          <div className="my-2 border-t border-neutral-200 dark:border-neutral-700"></div>
          
          {/* Meine Bereiche */}
          {myItems.map(item => (
            <div key={item.href + item.label}>
              {renderItem(item)}
              {item.subItems && (
                <div className="ml-1 mt-1 space-y-1">
                  {item.subItems.map((subItem, index) => 
                    renderItem(subItem, true, index === 0 && mainVehicle?.images && mainVehicle.images.length > 0)
                  )}
                </div>
              )}
            </div>
          ))}
          
          {/* Trennlinie */}
          <div className="my-2 border-t border-neutral-200 dark:border-neutral-700"></div>
          
          {/* Einstellungen */}
          {settingsItems.map(item => renderItem(item))}
        </nav>
      </div>
    </aside>
  );
}
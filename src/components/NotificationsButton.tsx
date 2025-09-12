"use client";
import { Bell, CheckCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as N from "@/lib/notifications";
import { onAuthStateChange, getGlobalUser } from "@/lib/supabaseClient";

export default function NotificationsButton(){
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<N.Notification[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refresh = async () => {
    if (!userId) return;
    
    try {
      const [unreadCount, notifications] = await Promise.all([
        N.unreadCount(userId),
        N.list(userId)
      ]);
      setUnread(unreadCount);
      setItems(notifications);
    } catch (error) {
      console.warn('Failed to refresh notifications:', error);
    }
  };

  const handleMarkAllRead = async () => {
    if (!userId) return;
    
    try {
      await N.markAllRead(userId);
      await refresh();
    } catch (error) {
      console.warn('Failed to mark all notifications as read:', error);
    }
  };

  const handleMarkRead = async (id: string) => {
    if (!userId) return;
    
    try {
      await N.markRead(userId, id);
      await refresh();
    } catch (error) {
      console.warn('Failed to mark notification as read:', error);
    }
  };

  const handleNotificationClick = async (notification: N.Notification) => {
    await handleMarkRead(notification.id);
    
    if (notification.href) {
      router.push(notification.href);
    }
  };

  // Подписка на изменения аутентификации
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user, ready) => {
      setLoading(!ready);
      setUserId(user?.id || null);
      
      if (user?.id) {
        refresh();
      } else {
        setUnread(0);
        setItems([]);
      }
    });

    return unsubscribe;
  }, []);

  // Подписка на realtime обновления
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = N.subscribe(userId, () => {
      refresh();
    });

    return unsubscribe;
  }, [userId]);

  // Обработка кликов вне попапа
  useEffect(() => {
    if (!open) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("#notif-popover")) {
        setOpen(false);
      }
    };
    
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [open]);

  // Не рендерить кнопку без авторизации
  if (loading || !userId) {
    return null;
  }

  return (
    <div className="relative">
      <button className="icon-btn h-9 w-9 grid place-items-center relative" onClick={()=>setOpen(v=>!v)} title="Benachrichtigungen">
        <Bell size={16}/>
        {unread > 0 && <span className="badge">{unread}</span>}
      </button>

      {open && (
        <div id="notif-popover" className="menu absolute right-0 mt-2 w-80 max-h-[60vh] overflow-auto">
          <div className="px-2 py-1 flex items-center justify-between">
            <div className="font-semibold">Benachrichtigungen</div>
            <button className="text-xs flex items-center gap-1 opacity-80 hover:opacity-100"
              onClick={handleMarkAllRead}>
              <CheckCheck size={14}/> alle gelesen
            </button>
          </div>
          <div className="mt-1">
            {items.length === 0 && <div className="px-3 py-3 text-sm opacity-70">Noch nichts hier.</div>}
            {items.map(notification => (
              <div 
                key={notification.id} 
                className={`menu-item text-sm cursor-pointer ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="shrink-0 w-6 text-center">
                  {notification.type === "like" ? "❤️" : 
                   notification.type === "comment" ? "💬" : 
                   notification.type === "follow" ? "👤" : "🔔"}
                </div>
                <div className="leading-snug">
                  <div className="font-medium">{notification.title}</div>
                  {notification.body && <div className="text-xs opacity-80">{notification.body}</div>}
                  <div className="text-xs opacity-60">{new Date(notification.createdAt).toLocaleString()}</div>
                </div>
                {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full ml-auto"></div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

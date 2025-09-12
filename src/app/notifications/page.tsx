"use client";
import SiteFooter from "@/components/SiteFooter";
import * as N from "@/lib/notifications";
import { useEffect, useState } from "react";
import Guard from "@/components/auth/Guard";
import { onAuthStateChange } from "@/lib/supabaseClient";

export default function NotificationsPage(){
  const [items, setItems] = useState<N.Notification[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!userId) return;
    
    try {
      const notifications = await N.list(userId);
      setItems(notifications);
    } catch (error) {
      console.warn('Failed to load notifications:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user, ready) => {
      setLoading(!ready);
      setUserId(user?.id || null);
      
      if (user?.id) {
        refresh();
      } else {
        setItems([]);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = N.subscribe(userId, () => {
      refresh();
    });

    return unsubscribe;
  }, [userId]);
  return (
    <Guard>
      <main className="container pb-12">
        <div className="section mt-6">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-extrabold">Benachrichtigungen</h1>
            <button className="btn-secondary" onClick={async () => { 
              if (userId) {
                await N.markAllRead(userId);
                await refresh();
              }
            }}>alle gelesen</button>
          </div>
          <div className="divide-y divide-white/5">
            {items.map(n=>(
              <div key={n.id} className="py-3 flex items-start gap-3">
                <div className="shrink-0 w-6 text-center">
                  {n.type==="like" ? "❤️" : n.type==="comment" ? "💬" : n.type==="follow" ? "👤" : "🔔"}
                </div>
                <div className="text-sm">
                  <div className="font-medium">{n.title}</div>
                  {n.body && <div className="opacity-80">{n.body}</div>}
                  <div className="opacity-60 text-xs">{new Date(n.createdAt).toLocaleString()}</div>
                </div>
              </div>
            ))}
            {items.length===0 && <div className="opacity-70 text-sm">Noch nichts hier.</div>}
          </div>
        </div>
      </main>
      <SiteFooter/>
    </Guard>
  );
}

"use client";
import { Bell, CheckCheck } from "lucide-react";
import { useEffect, useState } from "react";
import * as N from "@/lib/notifications";

export default function NotificationsButton(){
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<N.Notification[]>([]);

  const refresh = () => { setUnread(N.unreadCount()); setItems(N.all()); };

  useEffect(()=>{ 
    if (process.env.NEXT_PUBLIC_DEBUG === '1') {
      N.seedDemo(); 
      refresh(); 
    }
  },[]);
  useEffect(()=>{ if(!open) return; const h=(e:MouseEvent)=>{ const t=e.target as HTMLElement; if(!t.closest?.("#notif-popover")) setOpen(false); }; document.addEventListener("click",h); return ()=>document.removeEventListener("click",h); },[open]);

  return (
    <div className="relative">
      <button className="icon-btn h-9 w-9 grid place-items-center relative" onClick={()=>setOpen(v=>!v)} title="Benachrichtigungen">
        <Bell size={16}/>
        {unread>0 && <span className="badge">{unread}</span>}
      </button>

      {open && (
        <div id="notif-popover" className="menu absolute right-0 mt-2 w-80 max-h-[60vh] overflow-auto">
          <div className="px-2 py-1 flex items-center justify-between">
            <div className="font-semibold">Benachrichtigungen</div>
            <button className="text-xs flex items-center gap-1 opacity-80 hover:opacity-100"
              onClick={()=>{ N.markAllRead(); refresh(); }}>
              <CheckCheck size={14}/> alle gelesen
            </button>
          </div>
          <div className="mt-1">
            {items.length===0 && <div className="px-3 py-3 text-sm opacity-70">Noch nichts hier.</div>}
            {items.map(n=>(
              <div key={n.id} className="menu-item text-sm">
                <div className="shrink-0 w-6 text-center">
                  {n.type==="like" ? "❤️" : n.type==="comment" ? "💬" : n.type==="reaction" ? "🔥" : "👤"}
                </div>
                <div className="leading-snug">
                  <div>{n.message}</div>
                  <div className="text-xs opacity-60">{new Date(n.createdAt).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
          {/* демо-кнопка: сгенерировать событие */}
          <button
            onClick={()=>{ N.add({type:"like", message:"Demo: Jemand gefällt Dein Beitrag."}); refresh(); }}
            className="menu-item justify-center text-xs opacity-80"
          >
            + Demo-Like
          </button>
        </div>
      )}
    </div>
  );
}

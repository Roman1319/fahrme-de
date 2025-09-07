"use client";
import SiteFooter from "@/components/SiteFooter";
import * as N from "@/lib/notifications";
import { useEffect, useState } from "react";
import Guard from "@/components/auth/Guard";

export default function NotificationsPage(){
  const [items, setItems] = useState(N.all());
  useEffect(()=>{ setItems(N.all()); },[]);
  return (
    <Guard>
      <main className="container pb-12">
        <div className="section mt-6">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-extrabold">Benachrichtigungen</h1>
            <button className="btn-secondary" onClick={()=>{ N.markAllRead(); setItems(N.all()); }}>alle gelesen</button>
          </div>
          <div className="divide-y divide-white/5">
            {items.map(n=>(
              <div key={n.id} className="py-3 flex items-start gap-3">
                <div className="shrink-0 w-6 text-center">
                  {n.type==="like" ? "❤️" : n.type==="comment" ? "💬" : n.type==="reaction" ? "🔥" : "👤"}
                </div>
                <div className="text-sm">
                  <div>{n.message}</div>
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

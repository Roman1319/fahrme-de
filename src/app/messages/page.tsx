"use client";
import * as M from "@/lib/messages";
import { useEffect, useState } from "react";

export default function MessagesPage(){
  const [threads, setThreads] = useState<M.Thread[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [text, setText] = useState("");

  const load = ()=> setThreads(M.allThreads());
  useEffect(()=>{ load(); },[]);
  useEffect(()=>{ if(active) M.markThreadRead(active); },[active]);

  const current = threads.find(t=>t.with===active) || threads[0];
  useEffect(()=>{ if(!active && threads[0]) setActive(threads[0].with); },[threads]);

  const send = () => {
    if (!current || !text.trim()) return;
    M.send(current.with, text.trim());
    setText(""); load();
  };

  return (
    <>
      <main className="container grid md:grid-cols-[280px_1fr] gap-4 pb-12">
        <aside className="section">
          <div className="font-semibold mb-2">Chats</div>
          <div className="flex flex-col gap-1">
            {threads.map(t=>(
              <button key={t.id} onClick={()=>setActive(t.with)}
                className={`menu-item ${active===t.with ? "bg-brand text-white" : ""}`}>
                <div className="h-6 w-6 rounded-full bg-brand grid place-items-center text-xs font-bold text-white">{t.with[0].toUpperCase()}</div>
                <div className="flex-1 text-left">
                  <div className="font-medium">{t.with}</div>
                  <div className="text-xs opacity-70">{t.messages.slice(-1)[0]?.body ?? "…"}</div>
                </div>
                {t.unread>0 && <span className="badge">{t.unread}</span>}
              </button>
            ))}
            {threads.length===0 && <div className="opacity-70 text-sm">Noch keine Nachrichten.</div>}
          </div>
        </aside>

        <section className="section flex flex-col">
          <div className="font-semibold mb-2">{current ? `Chat mit ${current.with}` : "Kein Chat ausgewählt"}</div>
          <div className="flex-1 space-y-2 overflow-auto pr-1">
            {current?.messages.map(m=>(
              <div key={m.id} className={`max-w-[70%] ${m.from==="me" ? "ml-auto text-right" : ""}`}>
                <div className="glass px-3 py-2">{m.body}</div>
              </div>
            ))}
          </div>
          {current && (
            <div className="mt-3 flex gap-2">
              <input className="form-input flex-1" value={text} onChange={e=>setText(e.target.value)} placeholder="Nachricht schreiben…"/>
              <button className="btn-primary" onClick={send}>Senden</button>
            </div>
          )}
        </section>
      </main>
    </>
  );
}

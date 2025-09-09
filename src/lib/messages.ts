"use client";
import { useAuth } from "@/components/AuthProvider";

export type Message = { id:string; from:string; to:string; body:string; createdAt:number; };       
export type Thread = { id:string; with:string; messages:Message[]; unread:number; };

// This hook should be used in components that need messages
export function useMessages() {
  const { user } = useAuth();
  
  function key() {
    return `fahrme.messages.${user?.email ?? "guest"}`;
  }

  function read(): Thread[] {
    try { return JSON.parse(localStorage.getItem(key()) || "[]"); }
    catch { return []; }
  }
  
  function write(list: Thread[]) { 
    localStorage.setItem(key(), JSON.stringify(list)); 
  }

  const allThreads = (): Thread[] => read();
  const unreadCount = (): number => read().reduce((s,t)=>s+t.unread,0);

  const send = (to:string, body:string) => {
    if (!user) return;
    const list = read();
    let th = list.find(t=>t.with===to);
    if(!th){ th={id:crypto.randomUUID(), with:to, messages:[], unread:0}; list.push(th); }
    const msg: Message = { id:crypto.randomUUID(), from:user.name || user.email, to, body, createdAt:Date.now() };
    th.messages.push(msg);
    write(list);
  }

  const receive = (from:string, body:string) => {
    const list = read();
    let th = list.find(t=>t.with===from);
    if(!th){ th={id:crypto.randomUUID(), with:from, messages:[], unread:0}; list.push(th); }
    th.messages.push({ id:crypto.randomUUID(), from, to:"me", body, createdAt:Date.now() });
    th.unread += 1;
    write(list);
  }

  const markThreadRead = (withUser:string) => {
    const list=read(); 
    const th=list.find(t=>t.with===withUser);
    if(th){ th.unread=0; write(list); }
  }

  const seedDemo = () => {
    if (read().length) return;
    receive("Alex","Hey, mega Umbau! 👍");
    receive("Sandra","Hast Du Bilder vom Innenraum?");
  }

  return {
    allThreads,
    unreadCount,
    send,
    receive,
    markThreadRead,
    seedDemo
  };
}

// Legacy exports for backward compatibility (deprecated)
export function allThreads(): Thread[] { 
  console.warn('allThreads() is deprecated, use useMessages() hook instead');
  return []; 
}

export function unreadCount(): number { 
  console.warn('unreadCount() is deprecated, use useMessages() hook instead');
  return 0; 
}

export function send(to:string, body:string) { 
  console.warn('send() is deprecated, use useMessages() hook instead');
}

export function receive(from:string, body:string) { 
  console.warn('receive() is deprecated, use useMessages() hook instead');
}

export function markThreadRead(withUser:string) { 
  console.warn('markThreadRead() is deprecated, use useMessages() hook instead');
}

export function seedDemo() { 
  console.warn('seedDemo() is deprecated, use useMessages() hook instead');
}
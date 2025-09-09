"use client";
import { useAuth } from "@/components/AuthProvider";

export type NotificationType = "like" | "comment" | "reaction" | "follow";
export type Notification = {
  id: string;
  type: NotificationType;
  message: string;
  postId?: string;
  postTitle?: string;
  actor?: string;
  createdAt: number;
  read: boolean;
};

// This hook should be used in components that need notifications
export function useNotifications() {
  const { user } = useAuth();
  
  function key() {
    return `fahrme.notifications.${user?.email ?? "guest"}`;
  }

  function read(): Notification[] {
    try { return JSON.parse(localStorage.getItem(key()) || "[]"); }
    catch { return []; }
  }
  
  function write(list: Notification[]) {
    localStorage.setItem(key(), JSON.stringify(list));
  }

  const all = (): Notification[] => read().sort((a,b)=>b.createdAt-a.createdAt);
  
  const add = (n: Omit<Notification,"id"|"createdAt"|"read">) => {
    const list = read();
    list.push({ id: crypto.randomUUID(), createdAt: Date.now(), read:false, ...n });
    write(list);
  }
  
  const markAllRead = () => {
    const list = read().map(n => ({...n, read:true})); 
    write(list);
  }
  
  const unreadCount = (): number => read().filter(n=>!n.read).length;

  const seedDemo = () => {
    if (read().length) return;
    add({
      type: "like",
      message: "Alex hat deinen Post geliked",
      postId: "1",
      postTitle: "Mein neuer BMW",
      actor: "Alex"
    });
    add({
      type: "comment",
      message: "Sandra hat deinen Post kommentiert",
      postId: "1",
      postTitle: "Mein neuer BMW",
      actor: "Sandra"
    });
    add({
      type: "follow",
      message: "Max folgt dir jetzt",
      actor: "Max"
    });
  }

  return {
    all,
    add,
    markAllRead,
    unreadCount,
    seedDemo
  };
}

// Legacy exports for backward compatibility (deprecated)
export function all(): Notification[] { 
  console.warn('all() is deprecated, use useNotifications() hook instead');
  return []; 
}

export function add(n: Omit<Notification,"id"|"createdAt"|"read">) { 
  console.warn('add() is deprecated, use useNotifications() hook instead');
}

export function markAllRead() { 
  console.warn('markAllRead() is deprecated, use useNotifications() hook instead');
}

export function unreadCount(): number { 
  console.warn('unreadCount() is deprecated, use useNotifications() hook instead');
  return 0; 
}

export function seedDemo() { 
  console.warn('seedDemo() is deprecated, use useNotifications() hook instead');
}
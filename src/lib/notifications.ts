"use client";
import { currentUser } from "./auth";

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

function key() {
  const u = currentUser();
  return `fahrme.notifications.${u?.email ?? "guest"}`;
}

function read(): Notification[] {
  try { return JSON.parse(localStorage.getItem(key()) || "[]"); }
  catch { return []; }
}
function write(list: Notification[]) {
  localStorage.setItem(key(), JSON.stringify(list));
}

export function all(): Notification[] { return read().sort((a,b)=>b.createdAt-a.createdAt); }
export function add(n: Omit<Notification,"id"|"createdAt"|"read">) {
  const list = read();
  list.push({ id: crypto.randomUUID(), createdAt: Date.now(), read:false, ...n });
  write(list);
}
export function markAllRead() {
  const list = read().map(n => ({...n, read:true})); write(list);
}
export function unreadCount(): number { return read().filter(n=>!n.read).length; }

/* демо-наполнение */
export function seedDemo() {
  if (read().length) return;
  add({
    type: "like",
    message: 'Alex gefällt Dein Beitrag „BMW 3er G20".',
    actor: "Alex",
    postId: "1",
    postTitle: "BMW 3er G20",
  });
  add({
    type: "comment",
    message: 'Sandra hat kommentiert: „Sieht super aus!"',
    actor: "Sandra",
    postId: "2",
    postTitle: "Mini Cooper S R56",
  });
  add({
    type: "reaction",
    message: "Max reagierte auf Deinen Beitrag mit 🔥",
  });
}

"use client";
import { currentUser } from "./auth";

export type Message = { id:string; from:string; to:string; body:string; createdAt:number; };
export type Thread = { id:string; with:string; messages:Message[]; unread:number; };

function key() {
  const u = currentUser();
  return `fahrme.messages.${u?.email ?? "guest"}`;
}

function read(): Thread[] {
  try { return JSON.parse(localStorage.getItem(key()) || "[]"); }
  catch { return []; }
}
function write(list: Thread[]) { localStorage.setItem(key(), JSON.stringify(list)); }

export function allThreads(): Thread[] { return read(); }
export function unreadCount(): number { return read().reduce((s,t)=>s+t.unread,0); }

export function send(to:string, body:string) {
  const me = currentUser(); if (!me) return;
  const list = read();
  let th = list.find(t=>t.with===to);
  if(!th){ th={id:crypto.randomUUID(), with:to, messages:[], unread:0}; list.push(th); }
  const msg: Message = { id:crypto.randomUUID(), from:me.name, to, body, createdAt:Date.now() };
  th.messages.push(msg);
  write(list);
}

export function receive(from:string, body:string) {
  const list = read();
  let th = list.find(t=>t.with===from);
  if(!th){ th={id:crypto.randomUUID(), with:from, messages:[], unread:0}; list.push(th); }
  th.messages.push({ id:crypto.randomUUID(), from, to:"me", body, createdAt:Date.now() });
  th.unread += 1;
  write(list);
}

export function markThreadRead(withUser:string) {
  const list=read(); const th=list.find(t=>t.with===withUser);
  if(th){ th.unread=0; write(list); }
}

export function seedDemo() {
  if (read().length) return;
  receive("Alex","Hey, mega Umbau! 👍");
  receive("Sandra","Hast Du Bilder vom Innenraum?");
}

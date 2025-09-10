"use client";
import { MessageCircleMore } from "lucide-react";
import { useEffect, useState } from "react";
import * as M from "@/lib/messages";
import { useRouter } from "next/navigation";

export default function MessagesButton(){
  const [unread, setUnread] = useState(0);
  const router = useRouter();
  const refresh = ()=> setUnread(M.unreadCount());
  useEffect(()=>{ 
    if (process.env.NEXT_PUBLIC_DEBUG === '1') {
      M.seedDemo(); 
      refresh(); 
    }
  },[]);
  return (
    <button className="icon-btn h-9 w-9 grid place-items-center relative" onClick={()=>router.push("/messages")} title="Nachrichten">
      <MessageCircleMore size={16}/>
      {unread>0 && <span className="badge">{unread}</span>}
    </button>
  );
}

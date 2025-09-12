"use client";
import { MessageCircleMore } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function MessagesButton(){
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState(false);
  const router = useRouter();
  
  const refresh = async () => {
    try {
      const { unreadCount } = await import("@/lib/messages");
      setUnread(unreadCount());
      setError(false);
    } catch (err) {
      console.warn("Messages module not available:", err);
      setError(true);
      setUnread(0);
    }
  };

  useEffect(() => { 
    if (process.env.NEXT_PUBLIC_DEBUG === '1') {
      try {
        import("@/lib/messages").then(M => {
          M.seedDemo(); 
          refresh(); 
        });
      } catch (err) {
        console.warn("Messages module not available in debug mode:", err);
        setError(true);
      }
    } else {
      refresh();
    }
  }, []);

  return (
    <button className="icon-btn h-9 w-9 grid place-items-center relative" onClick={()=>router.push("/messages")} title="Nachrichten">
      <MessageCircleMore size={16}/>
      {!error && unread > 0 && <span className="badge">{unread}</span>}
    </button>
  );
}

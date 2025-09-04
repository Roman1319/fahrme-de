"use client";
import { useAuth } from "./AuthProvider";
import { User, LogOut, Settings } from "lucide-react";
import { useEffect, useState } from "react";

export default function UserMenu(){
  const { user, logout } = useAuth();
  const [open,setOpen]=useState(false);

  useEffect(()=>{
    const h=(e:MouseEvent)=>{ const t=e.target as HTMLElement; if(!t.closest?.("#user-popover")) setOpen(false); };
    document.addEventListener("click",h);
    return ()=>document.removeEventListener("click",h);
  },[]);

  if(!user) return null;
  const initials = (user.name?.match(/\b\p{L}/gu)?.slice(0,2).join("") ?? "DU").toUpperCase();

  return (
    <div className="relative">
      {/* Триггер как в референсе: фиолетовый бейдж + серый чип Du */}
      <button onClick={()=>setOpen(v=>!v)} className="profile-group" title={user.name}>
        <span className="profile-initials">{initials}</span>
        <span className="profile-chip">Du</span>
      </button>

      {open && (
        <div id="user-popover" className="menu absolute right-0 mt-2 w-56">
          <div className="px-3 py-2 text-sm opacity-80">
            {user.name}<br/><span className="opacity-60">{user.email}</span>
          </div>
          <a href="/profile/me" className="menu-item"><User size={16}/> Profil</a>
          <a href="/settings" className="menu-item"><Settings size={16}/> Einstellungen</a>
          <button onClick={logout} className="menu-item text-left w-full"><LogOut size={16}/> Logout</button>
        </div>
      )}
    </div>
  );
}


"use client";
import { useAuth } from "./AuthProvider";
import { User, LogOut, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { getProfile } from "@/lib/profiles";
// import AvatarButton from "./ui/AvatarButton"; // TODO: Use AvatarButton if needed
import AvatarTooltip from "./ui/AvatarTooltip";

export default function UserMenu(){
  const { user, logout } = useAuth();
  const [open,setOpen]=useState(false);
  const [profile, setProfile] = useState<{ avatarUrl?: string | null; displayName?: string } | null>(null);

  useEffect(()=>{
    const h=(e:MouseEvent)=>{ const t=e.target as HTMLElement; if(!t.closest?.("#user-popover")) setOpen(false); };
    document.addEventListener("click",h);
    return ()=>document.removeEventListener("click",h);
  },[]);

  useEffect(() => {
    if (!user) return;
    
    const loadProfile = async () => {
      const p = await getProfile(user.id);
      if (p) {
        setProfile({
          avatarUrl: p.avatar_url,
          displayName: p.name
        });
      }
    };
    loadProfile();
  }, [user?.id]);

  if(!user) return null;

  return (
    <div className="relative">
      {/* Триггер как в референсе: фиолетовый бейдж + серый чип Du */}
      <button onClick={()=>setOpen(v=>!v)} className="profile-group" title={user.name}>
        <AvatarTooltip
          src={profile?.avatarUrl || null}
          name={profile?.displayName || user.name || user.email || 'User'}
          size={32}
          userInfo={{
            displayName: profile?.displayName || user.name || user.email || 'User',
            fullName: user.name || user.email || 'User',
            city: 'Мюнхен', // TODO: Get from profile
            about: 'Ваш профиль'
          }}
          showActions={false}
        />
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

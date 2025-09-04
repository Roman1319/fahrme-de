"use client";
import SiteFooter from "@/components/SiteFooter";
import { useAuth } from "@/components/AuthProvider";
import { saveUsers, getUsers } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function MyProfile(){
  const { user, refresh, logout } = useAuth();
  const router = useRouter();
  const [name, setName] = useState(user?.name ?? "");

  useEffect(()=>{ if(!user){ router.push("/login"); } },[user,router]);

  const save = ()=>{
    if(!user) return;
    const all = getUsers().map(u => u.email===user.email ? {...u, name} : u);
    saveUsers(all);
    refresh();
  };

  if(!user) return null;

  return (
    <>
      <main className="container pb-12">
        <div className="form-card mt-8 space-y-5">
          <div>
            <h1 className="text-2xl font-extrabold">Dein Profil</h1>
            <p className="opacity-70 text-sm mt-1">{user.email}</p>
          </div>

          <div className="space-y-2">
            <label className="form-label">Name</label>
            <input className="form-input" value={name} onChange={e=>setName(e.target.value)} />
          </div>

          <div className="flex gap-2">
            <button className="btn-primary" onClick={save}>Speichern</button>
            <button className="btn-secondary" onClick={logout}>Logout</button>
          </div>
        </div>
      </main>
      <SiteFooter/>
    </>
  );
}

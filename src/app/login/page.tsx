"use client";
import SiteFooter from "@/components/SiteFooter";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const error = login(email.trim(), pwd);
    if (error) setErr(error);
    else router.push("/feed"); // после входа
  };

  return (
    <div className="flex flex-col min-h-screen">
      <main className="container pb-16 flex-1 flex items-center justify-center">
        <form onSubmit={onSubmit} className="form-card mt-6 space-y-4">
          <div>
            <h1 className="text-xl font-extrabold">Einloggen</h1>
            <p className="opacity-70 text-xs mt-1">Mit E-Mail und Passwort fortfahren.</p>
          </div>

          <div className="space-y-1.5">
            <label className="form-label">E-Mail</label>
            <input className="form-input" type="email" required value={email} onChange={e=>setEmail(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <label className="form-label">Passwort</label>
            <input className="form-input" type="password" required value={pwd} onChange={e=>setPwd(e.target.value)} />
          </div>

          {err && <p className="form-error">{err}</p>}

          <div className="flex gap-1.5">
            <button className="btn-primary" type="submit">Einloggen</button>
            <a href="/register" className="btn-secondary">Registrieren</a>
          </div>
        </form>
      </main>
      <SiteFooter/>
    </div>
  );
}

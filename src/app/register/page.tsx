"use client";
import SiteFooter from "@/components/SiteFooter";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useState } from "react";
import RedirectIfAuthed from "@/components/RedirectIfAuthed";

function isEmail(x:string){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x); }

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); // Clear previous errors
    if (!isEmail(email)) return setErr("Bitte gültige E-Mail eingeben.");
    if (pwd.length < 6) return setErr("Passwort muss mindestens 6 Zeichen haben.");
    if (pwd !== pwd2) return setErr("Passwörter stimmen nicht überein.");
    
    setIsLoading(true);
    try {
      const error = await register(name.trim() || "User", email.trim(), pwd);
      if (error) setErr(error);
      // Navigation will be handled by AuthProvider/Guard
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <RedirectIfAuthed />
      <main className="container pb-16">
        <form onSubmit={onSubmit} className="form-card mt-8 space-y-5">
          <div>
            <h1 className="text-2xl font-extrabold">Registrieren</h1>
            <p className="opacity-70 text-sm mt-1">Erstelle ein Konto, um Beiträge zu schreiben und zu abonnieren.</p>
          </div>

          <div className="space-y-2">
            <label className="form-label">Name</label>
            <input className="form-input" type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Dein Name" />
          </div>

          <div className="space-y-2">
            <label className="form-label">E-Mail</label>
            <input className="form-input" type="email" required value={email} onChange={e=>setEmail(e.target.value)} />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="form-label">Passwort</label>
              <input className="form-input" type="password" required value={pwd} onChange={e=>setPwd(e.target.value)} placeholder="mind. 6 Zeichen" />
            </div>
            <div className="space-y-2">
              <label className="form-label">Passwort wiederholen</label>
              <input className="form-input" type="password" required value={pwd2} onChange={e=>setPwd2(e.target.value)} />
            </div>
          </div>

          {err && <p className="form-error">{err}</p>}

          <div className="flex gap-2">
            <button className="btn-primary" type="submit" disabled={isLoading}>
              {isLoading ? "Wird erstellt..." : "Konto erstellen"}
            </button>
            <a href="/login" className="btn-secondary">Ich habe schon ein Konto</a>
          </div>
        </form>
      </main>
      <SiteFooter/>
    </>
  );
}

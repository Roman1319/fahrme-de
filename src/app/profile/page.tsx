'use client';

import { useEffect, useMemo, useState } from 'react';
import { readProfile, updateProfile, UserProfile } from '@/lib/profile';
import DropzoneAvatar from '@/components/ui/DropzoneAvatar';
import { PillToggleGroup } from '@/components/ui/PillToggle';

type Errors = Partial<Record<
  'phone'|'email'|'displayName'|'firstName'|'lastName',
  string
>>;

const MAX_NICK = 30;
const MAX_NAME = 40;

export default function ProfilePage() {
  const [p, setP] = useState<UserProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    const data = readProfile();
    const init: UserProfile = data || { id: 'local', displayName: '', otherLanguages: [] };
    setP(init);
    setAvatar(init.avatarUrl ?? null);
  }, []);

  const canSave = useMemo(() =>
    !!p && !Object.values(errors).some(Boolean) && (p.displayName?.trim().length ?? 0) > 0
  , [p, errors]);

  function set<K extends keyof UserProfile>(key: K, val: UserProfile[K]) {
    setP(prev => prev ? ({ ...prev, [key]: val }) as UserProfile : prev);
  }

  // === Validation helpers ===
  function sanitizePhone(input: string) {
    // только + и цифры, плюс только в начале; E.164 до 15 цифр
    let v = input.replace(/[^\d+]/g, '');
    if (v.includes('+')) v = '+' + v.replace(/\+/g, '');
    const digits = v.replace(/\D/g, '').slice(0, 15);
    return v.startsWith('+') ? `+${digits}` : digits;
  }
  const emailValid = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  const latinOnly = (v: string) => /^[A-Za-z0-9 ._\-]+$/.test(v); // ник: латиница, цифры, пробел, ._-

  function validate(next: Partial<UserProfile>) {
    const e: Errors = {};
    const phone = next.phone ?? p?.phone ?? '';
    const email = next.email ?? p?.email ?? '';
    const nick = next.displayName ?? p?.displayName ?? '';
    const fn = next.firstName ?? p?.firstName ?? '';
    const ln = next.lastName ?? p?.lastName ?? '';

    if (phone && !/^\+?\d{1,15}$/.test(phone)) e.phone = 'Nur Ziffern und + (max 15).';
    if (email && !emailValid(email)) e.email = 'Ungültige E-Mail.';
    if (nick.length > MAX_NICK) e.displayName = `Max. ${MAX_NICK} Zeichen.`;
    if (nick && !latinOnly(nick)) e.displayName = 'Nur lateinische Zeichen, Ziffern und .-_';
    if (fn && fn.length > MAX_NAME) e.firstName = `Max. ${MAX_NAME} Zeichen.`;
    if (ln && ln.length > MAX_NAME) e.lastName = `Max. ${MAX_NAME} Zeichen.`;

    setErrors(e);
  }

  async function onSave() {
    if (!p) return;
    setSaving(true);
    try {
      updateProfile({ ...p, avatarUrl: avatar ?? null });
    } finally {
      setSaving(false);
    }
  }

  if (!p) return null;

  return (
    <main className="container grid gap-3 pb-6">
      <section className="space-y-3">
        <div className="section">
          <h1 className="h1">Mein Profil</h1>
        </div>

        {/* Sicherheit & Anmeldung */}
        <section className="section">
          <header className="mb-3">
            <h2 className="h2">Sicherheit & Anmeldung</h2>
            <p className="opacity-70 mt-1 text-xs">Diese Daten sind nur für dich sichtbar.</p>
          </header>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Mobiltelefon</span>
              <input
                inputMode="tel"
                pattern="^\+?\d{1,15}$"
                className="form-input"
                placeholder="+49 ..."
                value={p.phone ?? ''}
                onChange={(e) => { const v = sanitizePhone(e.target.value); set('phone', v); validate({ phone: v }); }}
              />
              {errors.phone && <span className="form-error">{errors.phone}</span>}
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">E-Mail-Adresse</span>
              <input
                type="email"
                className="form-input"
                placeholder="dein.name@mail.de"
                value={p.email ?? ''}
                onChange={(e) => { set('email', e.target.value); validate({ email: e.target.value }); }}
              />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </label>

            <label className="sm:col-span-2 flex flex-col gap-1">
              <span className="text-sm font-medium">Passwort</span>
              <div className="flex gap-2">
                <input type="password" className="form-input flex-1" placeholder="Neues Passwort" />
                <button type="button" className="btn-secondary"
                        onClick={() => alert('Demo: Passwort ändern ohne Backend')}>
                  Ändern
                </button>
              </div>
              <p className="opacity-70 text-sm">Demo: ohne Backend – кнопка einfach für вида.</p>
            </label>
          </div>
        </section>

        {/* Persönliche Informationen */}
        <section className="section">
          <header className="mb-3">
            <h2 className="h2">Persönliche Informationen</h2>
            <p className="opacity-70 mt-1 text-xs">Diese Daten sehen andere Nutzer.</p>
          </header>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Spitzname</span>
              <input
                className="form-input"
                maxLength={MAX_NICK}
                placeholder="z. B. ehal77"
                value={p.displayName}
                onChange={(e) => { set('displayName', e.target.value); validate({ displayName: e.target.value }); }}
              />
              {errors.displayName && <span className="form-error">{errors.displayName}</span>}
            </label>

            <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium">Vorname</span>
                <input
                  className="form-input"
                  maxLength={MAX_NAME}
                  value={p.firstName ?? ''}
                  onChange={(e) => { set('firstName', e.target.value); validate({ firstName: e.target.value }); }}
                />
                {errors.firstName && <span className="form-error">{errors.firstName}</span>}
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium">Nachname</span>
                <input
                  className="form-input"
                  maxLength={MAX_NAME}
                  value={p.lastName ?? ''}
                  onChange={(e) => { set('lastName', e.target.value); validate({ lastName: e.target.value }); }}
                />
                {errors.lastName && <span className="form-error">{errors.lastName}</span>}
              </label>
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Geschlecht</span>
              <PillToggleGroup
                value={p.gender ?? null}
                onChange={(v) => set('gender', v)}
                options={[
                  { label: 'männlich', value: 'm' as const },
                  { label: 'weiblich', value: 'w' as const },
                  { label: 'divers', value: 'x' as const },
                ]}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Geburtstag</span>
              <input
                type="date"
                className="form-input"
                value={p.birthDate ?? ''}
                onChange={(e) => set('birthDate', e.target.value)}
              />
            </label>

            <label className="sm:col-span-2 flex flex-col gap-1">
              <span className="text-sm font-medium">Über mich</span>
              <textarea
                className="form-input min-h-[120px] resize-y"
                maxLength={25000}
                value={p.about ?? ''}
                onChange={(e) => set('about', e.target.value)}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Hauptsprache</span>
              <select
                className="form-input"
                value={p.primaryLanguage ?? 'Deutsch'}
                onChange={(e) => set('primaryLanguage', e.target.value)}
              >
                {['Deutsch','Englisch','Russisch','Polnisch','Ukrainisch','Französisch','Spanisch'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Ich kann lesen auf diesen Sprachen</span>
              <TagInput
                value={p.otherLanguages ?? []}
                placeholder="z. B. Englisch"
                onChange={arr => set('otherLanguages', arr)}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Land</span>
              <input
                className="form-input"
                placeholder="Deutschland"
                value={p.country ?? ''}
                onChange={(e) => set('country', e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Stadt</span>
              <input
                className="form-input"
                placeholder="z. B. München"
                value={p.city ?? ''}
                onChange={(e) => set('city', e.target.value)}
              />
            </label>
          </div>
        </section>

        {/* Avatar */}
        <section className="section">
          <header className="mb-3">
            <h2 className="h2">Benutzerbild (Avatar)</h2>
            <p className="opacity-70 mt-1 text-xs">Minimale Größe 200×200 px. Ziehe das Bild in die Fläche.</p>
          </header>

          <DropzoneAvatar
            value={avatar}
            onChange={(d) => setAvatar(d)}
            onRemove={() => setAvatar(null)}
          />
        </section>

        {/* Кнопка сохранения */}
        <div className="section">
          <div className="flex justify-end">
            <button className="btn-primary" disabled={!canSave || saving} onClick={onSave}>
              {saving ? 'Speichern…' : 'Speichern'}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

/* === TagInput (без изменений по сути) === */
function TagInput({
  value, onChange, placeholder,
}:{ value: string[]; onChange: (v: string[]) => void; placeholder?: string; }) {
  const [text, setText] = useState('');
  function add(v: string) {
    const t = v.trim(); if (!t) return;
    if (value.includes(t)) return;
    onChange([...value, t]); setText('');
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      {value.map(tag => (
        <span key={tag} className="rounded-full bg-black/5 px-2.5 py-1 text-xs dark:bg-white/10">
          {tag}
          <button className="ml-1 text-neutral-500 hover:text-neutral-700 dark:hover:text-white"
                  onClick={() => onChange(value.filter(v => v !== tag))}>×</button>
        </span>
      ))}
      <input
        className="form-input min-w-[160px] flex-1"
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') add(text); }}
        onBlur={() => add(text)}
      />
    </div>
  );
}

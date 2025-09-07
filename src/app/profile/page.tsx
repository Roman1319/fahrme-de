'use client';

import { useEffect, useMemo, useState } from 'react';
import { Profile, getProfile, updateProfile, uploadAvatar, checkHandleAvailability } from '@/lib/profiles';
import DropzoneAvatar from '@/components/ui/DropzoneAvatar';
// import { PillToggleGroup } from '@/components/ui/PillToggle'; // TODO: Use PillToggleGroup if needed
import { useAuth } from '@/components/AuthProvider';
import Guard from '@/components/auth/Guard';
import { Loader2 } from 'lucide-react';

type Errors = Partial<Record<
  'handle'|'name'|'about',
  string
>>;

const MAX_HANDLE = 30;
const MAX_NAME = 40;

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const profileData = await getProfile(user.id);
      if (profileData) {
        setProfile(profileData);
        setAvatar(profileData.avatar_url || null);
      } else {
        // Create a basic profile if none exists
        const basicProfile: Profile = {
          id: user.id,
          email: user.email,
          name: user.name || '',
          handle: user.email?.split('@')[0] || '',
          about: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setProfile(basicProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const canSave = useMemo(() => {
    const hasProfile = !!profile;
    const noErrors = !Object.values(errors).some(Boolean);
    const hasName = (profile?.name?.trim().length ?? 0) > 0;
    
    return hasProfile && noErrors && hasName;
  }, [profile, errors]);

  function set<K extends keyof Profile>(key: K, val: Profile[K]) {
    setProfile(prev => prev ? ({ ...prev, [key]: val }) as any : prev);
  }

  // === Validation helpers ===
  const latinOnly = (v: string) => /^[A-Za-z0-9._\-]+$/.test(v); // handle: латиница, цифры, ._-

  function validate(next: Partial<Profile>) {
    const e: Errors = {};
    const handle = next.handle ?? profile?.handle ?? '';
    const name = next.name ?? profile?.name ?? '';
    const about = next.about ?? profile?.about ?? '';

    if (handle.length > MAX_HANDLE) e.handle = `Max. ${MAX_HANDLE} Zeichen.`;
    if (handle && !latinOnly(handle)) e.handle = 'Nur lateinische Zeichen, Ziffern und .-_';
    if (name.length > MAX_NAME) e.name = `Max. ${MAX_NAME} Zeichen.`;
    if (about && about.length > 1000) e.about = `Max. 1000 Zeichen.`;

    setErrors(e);
  }

  const checkHandle = async (handle: string) => {
    if (!handle || !profile) return;
    
    try {
      const isAvailable = await checkHandleAvailability(handle, profile.id);
      if (!isAvailable) {
        setErrors(prev => ({ ...prev, handle: 'Dieser Handle ist bereits vergeben' }));
      } else {
        setErrors(prev => ({ ...prev, handle: undefined }));
      }
    } catch (error) {
      console.error('Error checking handle availability:', error);
    }
  };

  async function onSave() {
    if (!profile || !user) {
      alert('Keine Profildaten zum Speichern');
      return;
    }
    
    if (!canSave) {
      alert('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }
    
    setSaving(true);
    
    try {
      let avatarUrl = profile.avatar_url;
      
      // Upload avatar if changed
      if (avatar && avatar !== profile.avatar_url) {
        // Convert data URL to File
        const response = await fetch(avatar);
        const blob = await response.blob();
        const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
        
        avatarUrl = await uploadAvatar(user.id, file);
      }
      
      // Update profile
      const updatedProfile = await updateProfile(user.id, {
        name: profile.name,
        handle: profile.handle,
        about: profile.about,
        avatar_url: avatarUrl
      });
      
      setProfile(updatedProfile);
      setAvatar(avatarUrl || null);
      
      alert('Profil erfolgreich gespeichert!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Fehler beim Speichern des Profils: ' + error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Guard>
        <main className="pb-12">
          <div className="section text-center py-16">
            <Loader2 size={32} className="mx-auto mb-4 animate-spin" />
            <div className="text-xl">Lade Profil...</div>
          </div>
        </main>
      </Guard>
    );
  }

  if (!profile) {
    return (
      <Guard>
        <main className="pb-12">
          <div className="section text-center py-16">
            <div className="text-xl">Profil nicht gefunden</div>
          </div>
        </main>
      </Guard>
    );
  }

  return (
    <Guard>
      <main className="pb-12">
        <div className="space-y-6">
          <div className="section">
            <h1 className="h1">Mein Profil</h1>
          </div>

        {/* Persönliche Informationen */}
        <section className="section">
          <header className="mb-3">
            <h2 className="h2">Persönliche Informationen</h2>
            <p className="opacity-70 mt-1 text-xs">Diese Daten sehen andere Nutzer.</p>
          </header>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">E-Mail-Adresse</span>
              <input
                type="email"
                className="form-input bg-white/5 cursor-not-allowed"
                placeholder="dein.name@mail.de"
                value={profile.email}
                readOnly
                title="E-Mail-Adresse kann nicht geändert werden"
              />
              <p className="opacity-70 text-xs">E-Mail-Adresse kann nicht geändert werden</p>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Handle *</span>
              <input
                className="form-input"
                maxLength={MAX_HANDLE}
                placeholder="z.B. ehal77"
                value={profile.handle || ''}
                onChange={(e) => { 
                  set('handle', e.target.value); 
                  validate({ handle: e.target.value });
                  // Check availability after a delay
                  setTimeout(() => checkHandle(e.target.value), 500);
                }}
              />
              {errors.handle && <span className="form-error">{errors.handle}</span>}
            </label>

            <label className="sm:col-span-2 flex flex-col gap-1">
              <span className="text-sm font-medium">Name *</span>
              <input
                className="form-input"
                maxLength={MAX_NAME}
                placeholder="Ihr vollständiger Name"
                value={profile.name || ''}
                onChange={(e) => { set('name', e.target.value); validate({ name: e.target.value }); }}
              />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </label>

            <label className="sm:col-span-2 flex flex-col gap-1">
              <span className="text-sm font-medium">Über mich</span>
              <textarea
                className="form-input min-h-[120px] resize-y"
                maxLength={1000}
                placeholder="Erzählen Sie etwas über sich..."
                value={profile.about || ''}
                onChange={(e) => { set('about', e.target.value); validate({ about: e.target.value }); }}
              />
              {errors.about && <span className="form-error">{errors.about}</span>}
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

        {/* Save Button */}
        <div className="section">
          <div className="flex justify-end">
            <button 
              className="btn-primary" 
              disabled={!canSave || saving} 
              onClick={onSave}
              title={!canSave ? 'Bitte füllen Sie das Pflichtfeld "Name" aus' : 'Profil speichern'}
            >
              {saving ? 'Speichern…' : 'Speichern'}
            </button>
          </div>
        </div>
        </div>
      </main>
    </Guard>
  );
}

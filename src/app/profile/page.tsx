'use client';

import { useEffect, useMemo, useState } from 'react';
import { Profile } from '@/lib/profiles';
import DropzoneAvatar from '@/components/ui/DropzoneAvatar';
// import { PillToggleGroup } from '@/components/ui/PillToggle'; // TODO: Use PillToggleGroup if needed
import { useAuth } from '@/components/AuthProvider';
import Guard from '@/components/auth/Guard';
import { Loader2 } from 'lucide-react';
import ErrorBoundaryClient from '@/components/ErrorBoundaryClient';

type Errors = Partial<Record<
  'handle'|'name'|'about'|'country'|'city'|'birth_date',
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
  }, [user]); // TODO: Add loadProfile to deps when stable

  const loadProfile = () => {
    if (!user) return;
    
    try {
      setLoading(true);
      fetch(`/api/profiles/${user.id}`)
        .then(response => response.json())
        .then((profileData) => {
          if (profileData) {
            setProfile(profileData);
            setAvatar(profileData.avatar_url || null);
          }
        })
        .catch(error => {
          console.error('Error:', error);
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
        });
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
    setProfile(prev => prev ? ({ ...prev, [key]: val }) as Profile : prev);
  }

  // === Validation helpers ===
  const latinOnly = (v: string) => /^[A-Za-z0-9._\-]+$/.test(v); // handle: латиница, цифры, ._-

  function validate(next: Partial<Profile>) {
    const e: Errors = {};
    const handle = next.handle ?? profile?.handle ?? '';
    const name = next.name ?? profile?.name ?? '';
    const about = next.about ?? profile?.about ?? '';
    const country = next.country ?? profile?.country ?? '';
    const city = next.city ?? profile?.city ?? '';
    const birth_date = next.birth_date ?? profile?.birth_date ?? '';

    if (handle.length > MAX_HANDLE) e.handle = `Max. ${MAX_HANDLE} Zeichen.`;
    if (handle && !latinOnly(handle)) e.handle = 'Nur lateinische Zeichen, Ziffern und .-_';
    if (name.length > MAX_NAME) e.name = `Max. ${MAX_NAME} Zeichen.`;
    if (about && about.length > 1000) e.about = `Max. 1000 Zeichen.`;
    if (country && country.length > 50) e.country = `Max. 50 Zeichen.`;
    if (city && city.length > 50) e.city = `Max. 50 Zeichen.`;
    if (birth_date && isNaN(Date.parse(birth_date))) e.birth_date = 'Ungültiges Datum.';

    setErrors(e);
  }

  const checkHandle = (handle: string) => {
    if (!handle || !profile) return;
    
    fetch(`/api/profiles/check-handle?handle=${encodeURIComponent(handle)}&userId=${profile.id}`)
      .then(response => response.json())
      .then(({ isAvailable }) => {
        if (!isAvailable) {
          setErrors(prev => ({ ...prev, handle: 'Dieser Handle ist bereits vergeben' }));
        } else {
          setErrors(prev => ({ ...prev, handle: undefined }));
        }
      })
      .catch(error => {
        console.error('Error checking handle availability:', error);
      });
  };

  function onSave() {
    if (!profile || !user) {
      alert('Keine Profildaten zum Speichern');
      return;
    }
    
    if (!canSave) {
      alert('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }
    
    setSaving(true);
    
    const saveProfile = () => {
      let avatarUrl = profile.avatar_url;
      
      // Upload avatar if changed
      if (avatar && avatar !== profile.avatar_url) {
        console.log('Uploading new avatar...');
        // Convert data URL to File
        fetch(avatar)
          .then(response => response.blob())
          .then(blob => {
            const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
            const formData = new FormData();
            formData.append('file', file);
            formData.append('userId', user.id);
            
            return fetch('/api/profiles/avatar', {
              method: 'POST',
              body: formData,
            }).then(response => response.json()).then(data => data.url);
          })
          .then(uploadedUrl => {
            avatarUrl = uploadedUrl;
            console.log('Avatar uploaded successfully:', avatarUrl);
            updateProfileData(avatarUrl);
          })
          .catch(uploadError => {
            console.error('Avatar upload failed:', uploadError);
            alert('Fehler beim Hochladen des Avatars: ' + uploadError);
            setSaving(false);
          });
      } else {
        updateProfileData(avatarUrl || '');
      }
      
      function updateProfileData(avatarUrl: string) {
        if (!user || !profile) return;
        
        console.log('Updating profile...');
        fetch(`/api/profiles/${user.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: profile.name,
            handle: profile.handle,
            about: profile.about,
            avatar_url: avatarUrl,
            country: profile.country,
            city: profile.city,
            gender: profile.gender,
            birth_date: profile.birth_date
          }),
        })
        .then(response => response.json())
        .then(updatedProfile => {
          setProfile(updatedProfile);
          setAvatar(avatarUrl || null);
        
          // Notify other components about profile update
          window.dispatchEvent(new CustomEvent('profileUpdated', { 
            detail: { avatar_url: avatarUrl, name: updatedProfile.name } 
          }));
          
          alert('Profil erfolgreich gespeichert!');
        })
        .catch(error => {
          console.error('Error saving profile:', error);
          alert('Fehler beim Speichern des Profils: ' + error);
        })
        .finally(() => {
          setSaving(false);
        });
      }
    };
    
    saveProfile();
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
    <ErrorBoundaryClient>
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

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Land</span>
              <input
                className="form-input"
                maxLength={50}
                placeholder="z.B. Deutschland"
                value={profile.country || ''}
                onChange={(e) => { set('country', e.target.value); validate({ country: e.target.value }); }}
              />
              {errors.country && <span className="form-error">{errors.country}</span>}
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Stadt</span>
              <input
                className="form-input"
                maxLength={50}
                placeholder="z.B. Berlin"
                value={profile.city || ''}
                onChange={(e) => { set('city', e.target.value); validate({ city: e.target.value }); }}
              />
              {errors.city && <span className="form-error">{errors.city}</span>}
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Geschlecht</span>
              <select
                className="form-input"
                value={profile.gender || ''}
                onChange={(e) => { set('gender', e.target.value as 'male' | 'female' | 'other' | undefined); validate({ gender: e.target.value as 'male' | 'female' | 'other' | undefined }); }}
              >
                <option value="">Bitte wählen...</option>
                <option value="male">Männlich</option>
                <option value="female">Weiblich</option>
                <option value="other">Andere</option>
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Geburtsdatum</span>
              <input
                type="date"
                className="form-input"
                value={profile.birth_date ? profile.birth_date.split('T')[0] : ''}
                onChange={(e) => { 
                  const date = e.target.value ? new Date(e.target.value).toISOString() : undefined;
                  set('birth_date', date); 
                  validate({ birth_date: date }); 
                }}
              />
              {errors.birth_date && <span className="form-error">{errors.birth_date}</span>}
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
    </ErrorBoundaryClient>
  );
}

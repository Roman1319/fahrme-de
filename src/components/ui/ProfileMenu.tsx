'use client';

import { useEffect, useRef, useState } from 'react';
import AvatarButton from '@/components/ui/AvatarButton';
import { readProfile } from '@/lib/profile';

export default function ProfileMenu() {
  const [avatar, setAvatar] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const p = readProfile();
    setAvatar(p?.avatarUrl ?? null);
    setName(p?.displayName || (p as any)?.name || (p as any)?.username || null);
  }, []);

  // Закрытие по клику вне
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  return (
    <div ref={wrapRef} className="relative z-50">
      <AvatarButton
        src={avatar || undefined}
        name={name || undefined}
        size={36}
        onClick={() => setOpen((v) => !v)}
      />

      {/* DROPDOWN */}
      <div
        className={[
          'menu absolute right-0 mt-2 w-56 select-none',
          'origin-top-right transition-all duration-150',
          open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none',
        ].join(' ')}
        role="menu"
      >
        {/* шапка */}
        <div className="px-3 py-2 text-sm opacity-80">
          <div>{name ?? 'Gast'}</div>
          <div className="opacity-60">fahrme.de</div>
        </div>

        {/* пункты */}
        <nav>
          <MenuItem label="Profil" onClick={() => (window.location.href = '/profile')} />
          <MenuItem label="Einstellungen" onClick={() => (window.location.href = '/settings')} />
          <div className="my-1 h-px bg-black/10 dark:bg-white/10" />
          <MenuItem
            label="Abmelden"
            danger
            onClick={() => {
              try {
                localStorage.removeItem('fahrme:profile');
                localStorage.removeItem('fahrme:user');
                // Принудительно обновляем страницу для сброса состояния
                window.location.href = '/';
              } catch (error) {
                console.warn('Error during logout:', error);
                window.location.href = '/';
              }
            }}
          />
        </nav>
      </div>
    </div>
  );
}

function MenuItem({
  label,
  onClick,
  danger = false,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'menu-item text-left w-full',
        danger ? 'text-red-600 dark:text-red-400' : '',
      ].join(' ')}
      role="menuitem"
    >
      {label}
    </button>
  );
}

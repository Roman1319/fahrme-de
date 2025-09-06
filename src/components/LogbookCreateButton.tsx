"use client";
import { Plus } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { isCarOwnerByCar } from '@/lib/ownership';

interface LogbookCreateButtonProps {
  car: { id: string; make: string; model: string; ownerId?: string } | null;
  className?: string;
  showText?: boolean;
}

export default function LogbookCreateButton({ car, className = "", showText = true }: LogbookCreateButtonProps) {
  const { user } = useAuth();

  // Проверяем, может ли пользователь создавать посты
  const canPost = user && car && isCarOwnerByCar(car, user.id, user.email);

  // Если пользователь не может создавать посты, не рендерим кнопку
  if (!canPost) {
    return null;
  }

  const handleClick = () => {
    if (!car) return;
    window.location.href = `/cars/${car.make.toLowerCase()}/${car.model.toLowerCase()}/${car.id}/logbook/new`;
  };

  return (
    <button 
      onClick={handleClick}
      className={`btn-accent flex items-center gap-1 px-1.5 py-1 text-xs ${className}`}
    >
      <Plus size={10} />
      {showText && (
        <>
          <span className="hidden sm:inline">Neuer Eintrag</span>
          <span className="sm:hidden">Neu</span>
        </>
      )}
    </button>
  );
}

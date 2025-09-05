'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import AvatarButton from './AvatarButton';
import { UserPlus, MessageCircle } from 'lucide-react';

interface AvatarTooltipProps {
  src?: string | null;
  name?: string | null;
  size?: number;
  onClick?: () => void;
  userInfo?: {
    displayName?: string;
    fullName?: string;
    city?: string;
    about?: string;
  };
  onSubscribe?: () => void;
  onMessage?: () => void;
  showActions?: boolean;
}

export default function AvatarTooltip({ 
  src, 
  name, 
  size = 36, 
  onClick, 
  userInfo,
  onSubscribe,
  onMessage,
  showActions = true
}: AvatarTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const avatarRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showTooltip && avatarRef.current && tooltipRef.current) {
      const avatarRect = avatarRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      // Позиционируем tooltip над аватаром (fixed позиционирование)
      const top = avatarRect.top - tooltipRect.height - 8;
      const left = avatarRect.left + (avatarRect.width / 2) - (tooltipRect.width / 2);
      
      // Проверяем, не выходит ли tooltip за границы экрана
      const adjustedLeft = Math.max(8, Math.min(left, window.innerWidth - tooltipRect.width - 8));
      
      setPosition({ top, left: adjustedLeft });
    }
  }, [showTooltip]);

  const handleMouseEnter = () => {
    if (userInfo) {
      setShowTooltip(true);
    }
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  return (
    <>
      <div className="relative">
        <div
          ref={avatarRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <AvatarButton
            src={src}
            name={name}
            size={size}
            onClick={onClick}
          />
        </div>
      </div>
      
      {showTooltip && userInfo && typeof window !== 'undefined' && createPortal(
        <div
          ref={tooltipRef}
          className="fixed z-[9999] bg-black/95 backdrop-blur-sm border border-white/20 rounded-lg p-3 shadow-2xl min-w-[200px]"
          style={{
            top: position.top,
            left: position.left,
          }}
        >
          {/* Стрелочка, указывающая на аватар */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white/20"></div>
          <div className="flex items-center gap-2 mb-2">
            <AvatarButton
              src={src}
              name={name}
              size={24}
            />
            <div>
              <div className="font-semibold text-white text-sm">
                {userInfo.displayName || name}
              </div>
              {userInfo.fullName && (
                <div className="text-xs text-white/70">
                  {userInfo.fullName}
                </div>
              )}
            </div>
          </div>
          
          {userInfo.city && (
            <div className="text-xs text-white/80 mb-1">
              📍 {userInfo.city}
            </div>
          )}
          
          {userInfo.about && (
            <div className="text-xs text-white/70 line-clamp-2 mb-3">
              {userInfo.about}
            </div>
          )}
          
          {/* Кнопки действий */}
          {showActions && (onSubscribe || onMessage) && (
            <div className="flex gap-2 pt-2 border-t border-white/10">
              {onSubscribe && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSubscribe();
                  }}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-accent text-black text-xs font-medium rounded hover:bg-accent/80 transition-colors"
                >
                  <UserPlus size={12} />
                  Подписаться
                </button>
              )}
              {onMessage && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMessage();
                  }}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-white/10 text-white text-xs font-medium rounded hover:bg-white/20 transition-colors"
                >
                  <MessageCircle size={12} />
                  Сообщение
                </button>
              )}
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
}

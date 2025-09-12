'use client';

import Image from 'next/image';
import * as React from 'react';
import IconCircle from './IconCircle';
import { getAvatarImage } from '@/lib/storage-helpers';
import { StorageImage } from './StorageImage';

type Props = {
  src?: string | null;
  name?: string | null;   // латиница: "Roman"
  size?: number;          // px, по умолчанию 36
  onClick?: () => void;
};

function firstInitialLatin(name?: string | null) {
  if (!name) return 'U';
  const m = name.trim().match(/[A-Za-z0-9]/);
  const ch = (m?.[0] ?? name.trim()[0] ?? 'U');
  return ch.toLocaleUpperCase('en-US');
}

export default function AvatarButton({ src, name, size = 36, onClick }: Props) {
  const image = getAvatarImage(src);
  
  return (
    <IconCircle size={size} onClick={onClick}>
      {image.src ? (
        <StorageImage
          image={image}
          fill
          sizes={`${size}px`}
          className="rounded-full object-cover"
        />
      ) : (
        <span className="select-none text-[12px] font-semibold tracking-wide">
          {firstInitialLatin(name)}
        </span>
      )}
    </IconCircle>
  );
}

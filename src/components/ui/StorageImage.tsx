'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ImageWithFallback, useImageErrorHandler } from '@/lib/storage-helpers';

interface StorageImageProps {
  image: ImageWithFallback;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  quality?: number;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export default function StorageImage({
  image,
  className = '',
  fill = false,
  width,
  height,
  sizes,
  priority = false,
  quality = 75,
  onClick,
  style
}: StorageImageProps) {
  const [imageError, setImageError] = useState(false);
  const handleError = useImageErrorHandler(image.fallback || '');

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setImageError(true);
    handleError(event);
  };

  const imageSrc = imageError && image.fallback ? image.fallback : image.src;

  if (fill) {
    return (
      <Image
        src={imageSrc}
        alt={image.alt}
        fill
        sizes={sizes}
        className={className}
        priority={priority}
        quality={quality}
        onClick={onClick}
        style={style}
        onError={handleImageError}
      />
    );
  }

  return (
    <Image
      src={imageSrc}
      alt={image.alt}
      width={width}
      height={height}
      sizes={sizes}
      className={className}
      priority={priority}
      quality={quality}
      onClick={onClick}
      style={style}
      onError={handleImageError}
    />
  );
}

// Компонент для обычного img тега (без Next.js Image)
interface StorageImgProps {
  image: ImageWithFallback;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function StorageImg({ image, className = '', style, onClick }: StorageImgProps) {
  const [imageError, setImageError] = useState(false);
  const handleError = useImageErrorHandler(image.fallback || '');

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setImageError(true);
    handleError(event);
  };

  const imageSrc = imageError && image.fallback ? image.fallback : image.src;

  return (
    <img
      src={imageSrc}
      alt={image.alt}
      className={className}
      style={style}
      onClick={onClick}
      onError={handleImageError}
    />
  );
}

import React from 'react';
import { menuImageManifest } from '../../data/menuImageManifest';

const localMenuImagePath = (imageUrl: string) => {
  if (!imageUrl.startsWith('/images/menu/')) return null;
  return imageUrl.split(/[?#]/, 1)[0];
};

export const hasUsableMenuImage = (imageUrl?: string | null): boolean => {
  if (!imageUrl?.trim()) return false;
  const localPath = localMenuImagePath(imageUrl);
  return localPath ? menuImageManifest.has(localPath) : true;
};

interface FoodImageProps {
  imageUrl?: string | null;
  alt: string;
  className?: string;
  loading?: 'eager' | 'lazy';
  onError?: () => void;
}

export const FoodImage: React.FC<FoodImageProps> = ({
  imageUrl,
  alt,
  className,
  loading = 'lazy',
  onError,
}) => {
  if (!hasUsableMenuImage(imageUrl)) return null;

  return (
    <img
      src={imageUrl!}
      alt={alt}
      loading={loading}
      className={className}
      onError={onError}
    />
  );
};

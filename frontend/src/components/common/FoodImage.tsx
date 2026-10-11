import React from 'react';
import { menuImageManifest } from '../../data/menuImageManifest';
import generatedMenuPhotosData from '../../data/menuPhotos.generated.json';

const localMenuImagePath = (imageUrl: string) => {
  if (!imageUrl.startsWith('/images/menu/') && !imageUrl.startsWith('/menu/')) return null;
  return imageUrl.split(/[?#]/, 1)[0];
};

interface GeneratedMenuPhoto {
  file: string;
  alt: string;
}

const generatedMenuPhotos = generatedMenuPhotosData as Record<string, GeneratedMenuPhoto>;

const slugify = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const resolvedMenuImage = (imageUrl?: string | null, dishName?: string): string | null => {
  const generatedPhoto = dishName ? generatedMenuPhotos[slugify(dishName)] : undefined;
  if (generatedPhoto && menuImageManifest.has(generatedPhoto.file)) return generatedPhoto.file;
  if (!imageUrl?.trim()) return null;
  const localPath = localMenuImagePath(imageUrl);
  if (localPath) return menuImageManifest.has(localPath) ? localPath : null;
  return imageUrl.trim();
};

export const hasUsableMenuImage = (imageUrl?: string | null, dishName?: string): boolean =>
  resolvedMenuImage(imageUrl, dishName) !== null;

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
  const src = resolvedMenuImage(imageUrl, alt);
  if (!src) return null;

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      width={960}
      height={640}
      className={className}
      onError={onError}
    />
  );
};

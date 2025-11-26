import { useState, useEffect } from "react";

interface ImageOptions {
  width?: number;
  quality?: number;
  format?: "webp" | "avif" | "jpg";
}

export const useOptimizedImage = (url: string | null | undefined, options: ImageOptions = {}) => {
  const { width = 800, quality = 75, format = "webp" } = options;
  const [imageSrc, setImageSrc] = useState<string>("/placeholder.svg");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!url) {
      setIsLoading(false);
      return;
    }

    // Si es una URL de Supabase Storage, añadir parámetros de optimización
    const isSupabaseStorage = url.includes("supabase.co/storage");
    
    if (isSupabaseStorage) {
      // Supabase Storage auto-optimiza con parámetros en URL
      const optimizedUrl = `${url}?width=${width}&quality=${quality}`;
      setImageSrc(optimizedUrl);
    } else {
      setImageSrc(url);
    }
    
    // Precargar imagen
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => setIsLoading(false);
    img.onerror = () => {
      setImageSrc("/placeholder.svg");
      setIsLoading(false);
    };
  }, [url, width, quality, imageSrc]);

  return { imageSrc, isLoading };
};

export const optimizeImageURL = (url: string | null | undefined, options: ImageOptions = {}): string => {
  if (!url) return "/placeholder.svg";
  
  const { width = 800, quality = 75 } = options;
  const isSupabaseStorage = url.includes("supabase.co/storage");
  
  if (isSupabaseStorage) {
    return `${url}?width=${width}&quality=${quality}`;
  }
  
  return url;
};

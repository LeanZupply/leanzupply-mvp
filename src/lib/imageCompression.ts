import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  /** Maximum file size in MB (default: 2MB) */
  maxSizeMB?: number;
  /** Maximum width/height in pixels (default: 1920px) */
  maxWidthOrHeight?: number;
  /** Image quality 0-1 (default: 0.8) */
  initialQuality?: number;
  /** Whether to use WebWorker for better performance (default: true) */
  useWebWorker?: boolean;
  /** File type to convert to (default: 'image/jpeg' for better compression) */
  fileType?: string;
}

/**
 * Compresses an image file before upload to reduce storage size.
 * 
 * How it works:
 * 1. Reads the image file using FileReader API
 * 2. Creates an Image element to get dimensions
 * 3. Uses Canvas API to resize/compress the image
 * 4. Converts to Blob with specified quality
 * 5. Returns a new File object with reduced size
 * 
 * Benefits:
 * - Reduces storage costs
 * - Faster uploads/downloads
 * - Better user experience
 * - Maintains visual quality
 * 
 * @param file - Original image file
 * @param options - Compression options
 * @returns Compressed File object
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxSizeMB = 2, // Target max 2MB (your bucket limit is 5MB, but we compress more)
    maxWidthOrHeight = 1920, // Max dimension (good for web display)
    initialQuality = 0.8, // 80% quality (good balance)
    useWebWorker = true, // Use WebWorker for better performance
    fileType = 'image/jpeg', // JPEG compresses better than PNG
  } = options;

  // Skip compression for non-image files
  if (!file.type.startsWith('image/')) {
    return file;
  }

  const fileSizeMB = file.size / (1024 * 1024);
  const fileSizeKB = file.size / 1024;
  
  // Always compress images to ensure consistent sizing, but log if already small
  if (fileSizeKB <= maxSizeMB * 1024) {
    console.log(`[Image Compression] File ${file.name} is already ${fileSizeKB.toFixed(0)}KB (target: ${(maxSizeMB * 1024).toFixed(0)}KB), will still optimize`);
  }

  try {
    console.log(`[Image Compression] Compressing ${file.name} (${fileSizeMB.toFixed(2)}MB)...`);
    
    const compressedFile = await imageCompression(file, {
      maxSizeMB,
      maxWidthOrHeight,
      initialQuality,
      useWebWorker,
      fileType: fileType as CompressionOptions['fileType'],
      // Preserve EXIF data (optional, can remove for smaller files)
      preserveExif: false,
    });

    const compressedSizeMB = compressedFile.size / (1024 * 1024);
    const compressedSizeKB = compressedFile.size / 1024;
    const reductionPercent = ((file.size - compressedFile.size) / file.size * 100).toFixed(1);
    
    // Check if we hit the target
    const targetKB = maxSizeMB * 1024;
    const targetMet = compressedSizeKB <= targetKB ? '✓' : '⚠';
    
    console.log(
      `[Image Compression] ${targetMet} Compressed ${file.name}: ` +
      `${fileSizeKB.toFixed(0)}KB → ${compressedSizeKB.toFixed(0)}KB ` +
      `(target: ${targetKB.toFixed(0)}KB, ${reductionPercent}% reduction)`
    );

    return compressedFile;
  } catch (error) {
    console.error('[Image Compression] Error compressing image:', error);
    // Return original file if compression fails
    return file;
  }
}

/**
 * Compresses multiple image files in parallel.
 * 
 * @param files - Array of image files
 * @param options - Compression options
 * @returns Array of compressed File objects
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {}
): Promise<File[]> {
  return Promise.all(files.map(file => compressImage(file, options)));
}

/**
 * Validates file size after compression.
 * Throws an error if file exceeds the maximum allowed size.
 * 
 * @param file - File to validate
 * @param maxSizeMB - Maximum size in MB
 * @param fileType - Type of file for error message
 * @throws Error if file exceeds max size
 */
export function validateFileSize(file: File, maxSizeMB: number, fileType: string = 'file'): void {
  const fileSizeMB = file.size / (1024 * 1024);
  const fileSizeKB = file.size / 1024;
  
  if (fileSizeMB > maxSizeMB) {
    throw new Error(
      `El ${fileType} "${file.name}" es demasiado grande: ${fileSizeKB.toFixed(0)}KB ` +
      `(máximo permitido: ${(maxSizeMB * 1024).toFixed(0)}KB). ` +
      `Por favor, usa una imagen más pequeña o de menor resolución.`
    );
  }
}

/**
 * Gets compression options optimized for product images.
 * Target: 150 KB per image to fit 4,000 images in 600 MB (58.6% of 1GB storage)
 * These are optimized for catalog display with good quality/size balance.
 */
export function getProductImageCompressionOptions(): CompressionOptions {
  return {
    maxSizeMB: 0.15, // 150 KB target - allows 4,000 images in 600 MB
    maxWidthOrHeight: 1600, // Slightly lower resolution for better compression
    initialQuality: 0.80, // 80% quality - good balance for web display
    useWebWorker: true,
    fileType: 'image/jpeg',
  };
}

/**
 * Gets compression options optimized for manufacturer profile photos.
 * Target: 500 KB per photo to fit ~200 files in 100 MB (9.8% of 1GB storage)
 * These allow slightly larger files for verification purposes.
 */
export function getManufacturerPhotoCompressionOptions(): CompressionOptions {
  return {
    maxSizeMB: 0.5, // 500 KB target - allows ~200 photos in 100 MB
    maxWidthOrHeight: 1920, // Full HD resolution for verification
    initialQuality: 0.75, // 75% quality - slightly lower for better compression
    useWebWorker: true,
    fileType: 'image/jpeg',
  };
}

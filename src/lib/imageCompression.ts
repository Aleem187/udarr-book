interface CompressImageOptions {
  maxDimension?: number;
  quality?: number;
}

// Resizes + re-encodes an image client-side before it ever reaches Supabase
// Storage, since phone camera photos (often 3-10MB) would otherwise burn
// through storage quota and load slowly in the transaction history list.
export async function compressImage(file: File, options: CompressImageOptions = {}): Promise<Blob> {
  const maxDimension = options.maxDimension ?? 1600;
  const quality = options.quality ?? 0.75;

  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Image compression is not supported in this browser.');
    }
    ctx.drawImage(bitmap, 0, 0, width, height);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to compress the image.'));
        },
        'image/jpeg',
        quality
      );
    });
  } finally {
    bitmap.close();
  }
}

/** Resize a photo client-side before sending it to the API: caps token cost
 * and upload size while keeping plenty of detail for food recognition. */

const MAX_DIM = 1280;
const JPEG_QUALITY = 0.82;

export interface EncodedImage {
  data: string; // base64, no data: prefix
  mediaType: 'image/jpeg';
}

export async function fileToEncodedImage(file: File): Promise<EncodedImage> {
  const bitmap = await loadBitmap(file);
  const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not process the image.');
  ctx.drawImage(bitmap, 0, 0, w, h);

  const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  return { data: dataUrl.split(',')[1], mediaType: 'image/jpeg' };
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file);
    } catch {
      // Some Safari versions reject certain HEIC->JPEG conversions; fall through.
    }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read the image file.'));
    };
    img.src = url;
  });
}

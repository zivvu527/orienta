import { Capacitor } from '@capacitor/core';
import {
  Camera,
  CameraResultType,
  CameraSource,
} from '@capacitor/camera';

export type NativeImageSource = 'camera' | 'photos' | 'prompt';

export function canUseNativeImagePicker() {
  return Capacitor.isNativePlatform();
}

export function isNativeImagePickerCancel(error: unknown) {
  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : String(error).toLowerCase();

  return (
    message.includes('cancel') ||
    message.includes('cancelled') ||
    message.includes('canceled')
  );
}

export async function pickNativeImage(
  source: NativeImageSource,
): Promise<File | null> {
  if (!canUseNativeImagePicker()) {
    return null;
  }


  const photo = await Camera.getPhoto({
    source: toCameraSource(source),
    resultType: CameraResultType.DataUrl,
    quality: 82,
    width: 1600,
    correctOrientation: true,
    allowEditing: false,
  });


  if (!photo.dataUrl) {
    return null;
  }

  return dataUrlToFile(
    photo.dataUrl,
    source === 'camera'
      ? 'orienta-camera-photo'
      : 'orienta-photo',
  );
}

function toCameraSource(source: NativeImageSource) {
  if (source === 'camera') return CameraSource.Camera;
  if (source === 'photos') return CameraSource.Photos;
  return CameraSource.Prompt;
}

function dataUrlToFile(dataUrl: string, baseName: string): File {
  const match = dataUrl.match(/^data:([^;,]+);base64,(.+)$/s);

  if (!match) {
    throw new Error('Could not prepare this image.');
  }

  const mimeType = match[1] || 'image/jpeg';
  const base64 = match[2];

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  const extension =
    mimeType === 'image/png'
      ? 'png'
      : mimeType === 'image/webp'
        ? 'webp'
        : 'jpg';

  return new File([bytes], `${baseName}.${extension}`, {
    type: mimeType,
    lastModified: Date.now(),
  });
}

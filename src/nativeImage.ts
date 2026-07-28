import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export type NativeImageSource = 'camera' | 'photos' | 'prompt';

export function canUseNativeImagePicker() {
  return Capacitor.isNativePlatform();
}

export function isNativeImagePickerCancel(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return message.includes('cancel') || message.includes('user denied');
}

export async function pickNativeImage(source: NativeImageSource): Promise<File | null> {
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

  return dataUrlToJpegFile(photo.dataUrl, source === 'camera' ? 'oriented-camera-photo.jpg' : 'oriented-photo.jpg');
}

function toCameraSource(source: NativeImageSource) {
  if (source === 'camera') return CameraSource.Camera;
  if (source === 'photos') return CameraSource.Photos;
  return CameraSource.Prompt;
}

async function dataUrlToJpegFile(dataUrl: string, fileName: string) {
  const image = await loadImage(dataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Could not prepare this image.');
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));

  if (!blob) {
    throw new Error('Could not prepare this image.');
  }

  return new File([blob], fileName, { type: 'image/jpeg', lastModified: Date.now() });
}

function loadImage(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not open this image.'));
    image.src = dataUrl;
  });
}

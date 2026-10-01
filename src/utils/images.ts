import type { ImagePickerAsset } from 'expo-image-picker';
import type { PickedImage, Product } from '@/types/domain';

export function productImages(product?: Product | null) {
  if (!product) {
    return [];
  }

  return [product.images, product.productImages, product.imageUrls]
    .flatMap((value) => (Array.isArray(value) ? value : []))
    .filter(Boolean);
}

export function firstProductImage(product?: Product | null) {
  return productImages(product)[0];
}

export function imageAssetToFile(asset: ImagePickerAsset): PickedImage {
  const name = asset.fileName || asset.uri.split('/').pop() || `rewore-${Date.now()}.jpg`;
  const extension = name.split('.').pop()?.toLowerCase();
  const type = asset.mimeType || (extension ? `image/${extension === 'jpg' ? 'jpeg' : extension}` : 'image/jpeg');

  return {
    uri: asset.uri,
    name,
    type,
  };
}

export function appendFile(formData: FormData, key: string, image?: PickedImage | null) {
  if (!image) {
    return;
  }

  formData.append(key, image as unknown as Blob);
}

export function appendFiles(formData: FormData, key: string, images: PickedImage[]) {
  images.forEach((image) => appendFile(formData, key, image));
}

import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AppButton } from '@/components/AppButton';
import { colors } from '@/components/theme';
import type { PickedImage } from '@/types/domain';
import { imageAssetToFile } from '@/utils/images';

type Props = {
  label: string;
  multiple?: boolean;
  onChange: (images: PickedImage[]) => void;
};

export function ImagePickerField({ label, multiple, onChange }: Props) {
  const [images, setImages] = useState<PickedImage[]>([]);

  const pick = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: multiple,
      allowsEditing: false,
      quality: 0.88,
    });

    if (result.canceled) {
      return;
    }

    const next = multiple
      ? [...images, ...result.assets.map(imageAssetToFile)]
      : result.assets.slice(0, 1).map(imageAssetToFile);

    setImages(next);
    onChange(next);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.previewRow}>
        {images.length ? (
          images.map((image) => <Image key={image.uri} source={{ uri: image.uri }} style={styles.preview} resizeMode="contain" />)
        ) : (
          <View style={[styles.preview, styles.empty]}>
            <Text style={styles.emptyText}>Chua co anh</Text>
          </View>
        )}
      </View>
      <AppButton title={multiple ? 'Chon anh' : 'Chon file'} variant="secondary" onPress={pick} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  label: {
    color: colors.ink,
    fontWeight: '800',
  },
  previewRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  preview: {
    width: 88,
    height: 88,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 12,
  },
});

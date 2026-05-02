import { useMemo, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { getListingPhotoPublicUrl } from '../lib/listingPhotos';

type Props = {
  photoPaths?: string[];
  width: number;
  height: number;
  borderRadius?: number;
};

export function ListingCardImage({ photoPaths, width, height, borderRadius = 0 }: Props) {
  const [loaded, setLoaded] = useState(false);
  const uri = useMemo(() => {
    const first = photoPaths?.[0];
    return first ? getListingPhotoPublicUrl(first) : null;
  }, [photoPaths]);

  if (!uri) {
    return (
      <View style={[styles.placeholder, { width, height, borderRadius }]}>
        <Text style={styles.placeholderGlyph} accessibilityLabel="No photo">
          🏠
        </Text>
        <Text style={styles.placeholderHint}>No photo yet</Text>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { width, height, borderRadius }]}>
      <Image
        source={{ uri }}
        style={[styles.image, { width, height, borderRadius }]}
        resizeMode="cover"
        accessibilityLabel="Listing photo"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />
      {!loaded ? (
        <View style={[styles.loader, { borderRadius }]}>
          <ActivityIndicator color="#111827" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', backgroundColor: '#f3f4f6' },
  image: { backgroundColor: '#f3f4f6' },
  loader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  placeholder: {
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  placeholderGlyph: { fontSize: 36, marginBottom: 4 },
  placeholderHint: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
});

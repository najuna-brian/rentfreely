import { RouteProp, useRoute } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ListingCardImage } from '../components/ListingCardImage';
import { useAuth } from '../context/AuthContext';
import { fetchFavorites, toggleFavorite } from '../lib/favorites';
import { getListingPhotoPublicUrl } from '../lib/listingPhotos';
import { fetchListingById } from '../lib/listings';
import { RootStackParamList } from '../navigation/AppNavigator';

type DetailRoute = RouteProp<RootStackParamList, 'ListingDetail'>;

const ugx = new Intl.NumberFormat('en-UG');

export function ListingDetailScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const isTablet = windowWidth >= 900;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const route = useRoute<DetailRoute>();
  const listingQuery = useQuery({
    queryKey: ['listing', route.params.listingId],
    queryFn: () => fetchListingById(route.params.listingId),
  });
  const favoritesQuery = useQuery({
    queryKey: ['favorites'],
    queryFn: fetchFavorites,
    enabled: Boolean(user),
  });
  const favoriteIds = new Set((favoritesQuery.data ?? []).map((item) => item.id));
  const isFavorite = favoriteIds.has(route.params.listingId);

  const favoriteMutation = useMutation({
    mutationFn: () => toggleFavorite(route.params.listingId, isFavorite),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
    onError: (error) => {
      Alert.alert('Could not update favorites', (error as Error).message);
    },
  });
  const listing = listingQuery.data;
  const galleryWidth = windowWidth;
  const photoPaths = listing?.photoPaths ?? [];

  const openInMaps = () => {
    if (!listing) return;
    const q = `${listing.latitude},${listing.longitude}`;
    void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`);
  };

  if (listingQuery.isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color="#111827" />
          <Text style={styles.loadingLabel}>Loading listing…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (listingQuery.isError) {
    return (
      <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
        <View style={styles.centerWrap}>
          <Text style={styles.loadingLabel}>Could not load this listing.</Text>
          <Pressable style={styles.retryBtn} onPress={() => listingQuery.refetch()} accessibilityRole="button">
            <Text style={styles.retryBtnText}>Try again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!listing) {
    return (
      <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
        <View style={styles.centerWrap}>
          <Text>Listing not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {photoPaths.length > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.galleryStrip}
            accessibilityLabel="Listing photos"
          >
            {photoPaths.map((path) => (
              <Image
                key={path}
                source={{ uri: getListingPhotoPublicUrl(path) }}
                style={{ width: galleryWidth, height: 260 }}
                resizeMode="cover"
                accessibilityLabel="Listing photo"
              />
            ))}
          </ScrollView>
        ) : (
          <View style={[styles.heroPlaceholder, { width: galleryWidth - 32, alignSelf: 'center' }]}>
            <ListingCardImage photoPaths={[]} width={galleryWidth - 32} height={200} borderRadius={12} />
          </View>
        )}

        <View style={[styles.card, isTablet && styles.cardWide]}>
          <Text style={styles.title}>{listing.title}</Text>
          <Text style={styles.price}>{ugx.format(listing.priceUgx)} UGX / month</Text>
          <Text style={styles.meta}>
            {listing.bedrooms} bedrooms • {listing.bathrooms} bathrooms
          </Text>
          <Text style={styles.meta}>
            {listing.propertyType} • {listing.furnished ? 'Furnished' : 'Unfurnished'}
          </Text>
          <Text style={styles.meta}>{listing.address}</Text>
          {listing.description ? <Text style={styles.description}>{listing.description}</Text> : null}

          <Text style={styles.sectionLabel}>Location</Text>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            scrollEnabled={false}
            zoomEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
            region={{
              latitude: listing.latitude,
              longitude: listing.longitude,
              latitudeDelta: 0.012,
              longitudeDelta: 0.012,
            }}
            accessibilityLabel="Map showing listing location"
          >
            <Marker coordinate={{ latitude: listing.latitude, longitude: listing.longitude }} />
          </MapView>
          <Pressable style={styles.mapsLink} onPress={openInMaps} accessibilityRole="link">
            <Text style={styles.mapsLinkText}>Open in Google Maps</Text>
          </Pressable>

          <Text style={styles.sectionLabel}>Contact</Text>
          <Text style={styles.contactBody}>
            In-app messaging is not available yet. Save this listing so you can find it quickly; we are working on
            verified owner contact options next.
          </Text>

          {user ? (
            <Pressable
              style={styles.button}
              onPress={() => favoriteMutation.mutate()}
              disabled={favoriteMutation.isPending}
            >
              <Text style={styles.buttonText}>
                {favoriteMutation.isPending
                  ? 'Updating…'
                  : isFavorite
                    ? 'Remove from saved'
                    : 'Save listing'}
              </Text>
            </Pressable>
          ) : (
            <Text style={styles.meta}>Sign in from the Profile tab to save this listing.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  centerWrap: { flex: 1, padding: 16, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingLabel: { color: '#4b5563', fontSize: 16, textAlign: 'center' },
  retryBtn: {
    marginTop: 8,
    backgroundColor: '#111827',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryBtnText: { color: '#fff', fontWeight: '600' },
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { paddingBottom: 24 },
  galleryStrip: { marginBottom: 16 },
  heroPlaceholder: { marginBottom: 8 },
  card: {
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  cardWide: { alignSelf: 'center', width: '85%', maxWidth: 760 },
  title: { fontSize: 24, fontWeight: '700' },
  price: { fontSize: 22, fontWeight: '700' },
  meta: { color: '#374151', fontSize: 15 },
  description: { color: '#1f2937', fontSize: 15, lineHeight: 22, marginTop: 4 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#111827', marginTop: 8 },
  map: { height: 160, borderRadius: 12, marginTop: 4 },
  mapsLink: { alignSelf: 'flex-start', paddingVertical: 8 },
  mapsLinkText: { color: '#2563eb', fontWeight: '600', fontSize: 15 },
  contactBody: { color: '#4b5563', fontSize: 15, lineHeight: 22 },
  button: {
    marginTop: 8,
    backgroundColor: '#111827',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 12,
  },
  buttonText: { color: '#fff', fontWeight: '600' },
});

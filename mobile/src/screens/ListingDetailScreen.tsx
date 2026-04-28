import { RouteProp, useRoute } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { fetchFavorites, toggleFavorite } from '../lib/favorites';
import { fetchListingById } from '../lib/listings';
import { RootStackParamList } from '../navigation/AppNavigator';

type DetailRoute = RouteProp<RootStackParamList, 'ListingDetail'>;

const ugx = new Intl.NumberFormat('en-UG');

export function ListingDetailScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 900;
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

  if (listingQuery.isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading listing...</Text>
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={styles.container}>
        <Text>Listing not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
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
        <Text style={styles.contact}>Contact owner from listing dashboard (MVP).</Text>
        {user ? (
          <Pressable
            style={styles.button}
            onPress={() => favoriteMutation.mutate()}
            disabled={favoriteMutation.isPending}
          >
            <Text style={styles.buttonText}>
              {favoriteMutation.isPending
                ? 'Updating...'
                : isFavorite
                  ? 'Remove from saved'
                  : 'Save listing'}
            </Text>
          </Pressable>
        ) : (
          <Text style={styles.meta}>Sign in to save this listing.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 16 },
  card: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14, padding: 16, gap: 10 },
  cardWide: { alignSelf: 'center', width: '85%', maxWidth: 760 },
  title: { fontSize: 24, fontWeight: '700' },
  price: { fontSize: 22, fontWeight: '700' },
  meta: { color: '#374151', fontSize: 15 },
  contact: { marginTop: 12, color: '#1f2937' },
  button: {
    marginTop: 8,
    backgroundColor: '#111827',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 12,
  },
  buttonText: { color: '#fff', fontWeight: '600' },
});

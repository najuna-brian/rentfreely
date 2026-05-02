import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ListingCardImage } from '../components/ListingCardImage';
import { useAuth } from '../context/AuthContext';
import { fetchFavorites } from '../lib/favorites';
import { MainTabParamList, RootStackParamList } from '../navigation/types';

const ugx = new Intl.NumberFormat('en-UG');
const CARD_IMAGE_HEIGHT = 120;

type FavoritesNav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Favorites'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function FavoritesScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 900;
  const listMaxWidth = isTablet ? Math.min(760, width * 0.85) : width;
  const cardImageWidth = Math.max(0, listMaxWidth - 32);
  const { user } = useAuth();
  const navigation = useNavigation<FavoritesNav>();

  const favoritesQuery = useQuery({
    queryKey: ['favorites'],
    queryFn: fetchFavorites,
    enabled: Boolean(user),
  });

  if (!user) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.container}>
          <Text style={styles.title}>Favorites</Text>
          <Text style={styles.message}>Sign in from Profile to save and view favorite homes.</Text>
          <Pressable
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Profile')}
            accessibilityRole="button"
            accessibilityLabel="Go to profile to sign in"
          >
            <Text style={styles.primaryButtonText}>Go to Profile</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={[styles.container, isTablet && styles.containerWide]}>
        <Text style={styles.title}>Favorites</Text>
        <FlatList
          data={favoritesQuery.data ?? []}
          keyExtractor={(item) => item.id}
          onRefresh={() => favoritesQuery.refetch()}
          refreshing={favoritesQuery.isFetching && !favoritesQuery.isLoading}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => navigation.navigate('ListingDetail', { listingId: item.id })}
              accessibilityRole="button"
              accessibilityLabel={`${item.title}, saved listing`}
            >
              <ListingCardImage photoPaths={item.photoPaths} width={cardImageWidth} height={CARD_IMAGE_HEIGHT} />
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardPrice}>{ugx.format(item.priceUgx)} UGX</Text>
                <Text style={styles.message}>
                  {item.bedrooms} bed • {item.bathrooms} bath • {item.district}
                </Text>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={styles.message}>
              {favoritesQuery.isLoading ? 'Loading favorite homes…' : 'No favorite homes yet.'}
            </Text>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  containerWide: { alignSelf: 'center', width: '85%', maxWidth: 760 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  message: { color: '#4b5563', lineHeight: 20 },
  primaryButton: {
    marginTop: 20,
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  listContent: { paddingBottom: 24, gap: 12 },
  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  cardBody: { padding: 12 },
  cardTitle: { fontWeight: '600', fontSize: 16, marginBottom: 4 },
  cardPrice: { fontWeight: '700', fontSize: 16, marginBottom: 4, color: '#111827' },
});

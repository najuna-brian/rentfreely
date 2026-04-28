import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { fetchFavorites } from '../lib/favorites';
import { RootStackParamList } from '../navigation/AppNavigator';

const ugx = new Intl.NumberFormat('en-UG');

export function SavedScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 900;
  const { user } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const favoritesQuery = useQuery({
    queryKey: ['favorites'],
    queryFn: fetchFavorites,
    enabled: Boolean(user),
  });

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Saved listings</Text>
        <Text style={styles.message}>Sign in from Profile to save and view favorites.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isTablet && styles.containerWide]}>
      <Text style={styles.title}>Saved listings</Text>
      <FlatList
        data={favoritesQuery.data ?? []}
        keyExtractor={(item) => item.id}
        onRefresh={() => favoritesQuery.refetch()}
        refreshing={favoritesQuery.isFetching}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate('ListingDetail', { listingId: item.id })}
          >
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.message}>{ugx.format(item.priceUgx)} UGX</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={styles.message}>
            {favoritesQuery.isLoading ? 'Loading saved listings...' : 'No saved listings yet.'}
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  containerWide: { alignSelf: 'center', width: '85%', maxWidth: 760 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  message: { color: '#4b5563', lineHeight: 20 },
  card: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, marginBottom: 8 },
  cardTitle: { fontWeight: '600', fontSize: 16, marginBottom: 4 },
});

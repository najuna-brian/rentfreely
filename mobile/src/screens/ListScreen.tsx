import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { FlatList, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchListings } from '../lib/listings';
import { geocodePlace, PlaceSearchResult, searchPlacesWithCoordinates } from '../lib/maps';
import { RootStackParamList } from '../navigation/AppNavigator';
import { MapBounds } from '../types/map';

const ugx = new Intl.NumberFormat('en-UG');

export function ListScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [searchText, setSearchText] = useState('');
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  const [selectedPlace, setSelectedPlace] = useState('Uganda');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [bounds, setBounds] = useState<MapBounds>({
    minLat: -1.5267,
    minLng: 29.5733,
    maxLat: 4.2341,
    maxLng: 35.0011,
  });

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchText(searchText.trim());
    }, 250);
    return () => clearTimeout(timeout);
  }, [searchText]);

  const placesQuery = useQuery({
    queryKey: ['list-places', debouncedSearchText],
    queryFn: () => searchPlacesWithCoordinates(debouncedSearchText),
    enabled: debouncedSearchText.trim().length > 2,
  });

  const listingsQuery = useQuery({
    queryKey: ['list-screen-listings', bounds],
    queryFn: () => fetchListings(undefined, bounds),
  });

  const selectPlace = async (place: PlaceSearchResult) => {
    Keyboard.dismiss();
    setShowSuggestions(false);
    const resolved = place.placeId ? await geocodePlace(place.placeId) : null;
    const latitude = resolved?.latitude ?? place.latitude;
    const longitude = resolved?.longitude ?? place.longitude;
    setBounds({
      minLat: latitude - 0.015,
      maxLat: latitude + 0.015,
      minLng: longitude - 0.015,
      maxLng: longitude + 0.015,
    });
    setSearchText(place.name);
    setSelectedPlace(place.name);
    setDebouncedSearchText('');
  };

  const submitSearch = async () => {
    if (placesQuery.data?.length) {
      await selectPlace(placesQuery.data[0]);
      return;
    }
    const freshResults = await searchPlacesWithCoordinates(searchText);
    if (freshResults.length) {
      await selectPlace(freshResults[0]);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
    <View style={styles.container}>
      <Text style={styles.title}>List</Text>
      <TextInput
        value={searchText}
        onChangeText={(text) => {
          setSearchText(text);
          setShowSuggestions(true);
        }}
        placeholder="Search place to list homes"
        style={styles.search}
        returnKeyType="search"
        onSubmitEditing={submitSearch}
      />
      {showSuggestions && placesQuery.data?.length ? (
        <View style={styles.suggestions}>
          {placesQuery.data.map((item) => (
            <Pressable key={item.id} style={styles.suggestionItem} onPress={() => void selectPlace(item)}>
              <Text style={styles.suggestionTitle}>{item.name}</Text>
              <Text style={styles.suggestionSub}>{item.address}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <Text style={styles.subtle}>Showing homes around: {selectedPlace}</Text>
      <FlatList
        data={listingsQuery.data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshing={listingsQuery.isFetching}
        onRefresh={() => listingsQuery.refetch()}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate('ListingDetail', { listingId: item.id })}
          >
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardPrice}>{ugx.format(item.priceUgx)} UGX</Text>
            <Text style={styles.subtle}>
              {item.bedrooms} bed • {item.bathrooms} bath • {item.district}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={styles.subtle}>
            {listingsQuery.isLoading ? 'Loading listings...' : 'No homes found for this place.'}
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
  title: { fontSize: 26, fontWeight: '700', marginBottom: 8 },
  search: {
    borderWidth: 1,
    borderColor: '#d5d9df',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  suggestions: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    marginTop: -2,
    marginBottom: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  suggestionItem: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  suggestionTitle: { fontWeight: '600', color: '#111827' },
  suggestionSub: { color: '#4b5563', marginTop: 2 },
  listContent: { paddingTop: 10, paddingBottom: 20, gap: 10 },
  card: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12 },
  cardTitle: { fontWeight: '600', fontSize: 16, marginBottom: 4 },
  cardPrice: { fontWeight: '700', fontSize: 16, marginBottom: 2 },
  subtle: { color: '#6b7280' },
});

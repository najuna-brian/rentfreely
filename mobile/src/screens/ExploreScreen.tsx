import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Keyboard,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import ClusteredMapView from 'react-native-map-clustering';
import { fetchListings } from '../lib/listings';
import { geocodePlace, PlaceSearchResult, searchPlacesWithCoordinates } from '../lib/maps';
import { RootStackParamList } from '../navigation/AppNavigator';
import { ListingFilters } from '../types/filters';
import { MapBounds } from '../types/map';

const ugx = new Intl.NumberFormat('en-UG');

export function ExploreScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { width } = useWindowDimensions();
  const isTablet = width >= 900;
  const mapRef = useRef<any>(null);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ListingFilters>({});
  const [bounds, setBounds] = useState<MapBounds>({
    minLat: -1.5267,
    minLng: 29.5733,
    maxLat: 4.2341,
    maxLng: 35.0011,
  });
  const [region, setRegion] = useState<Region>({
    latitude: 1.3733,
    longitude: 32.2903,
    latitudeDelta: 5.8,
    longitudeDelta: 5.8,
  });
  const listingsQuery = useQuery({
    queryKey: ['listings', bounds, filters],
    queryFn: () => fetchListings(undefined, bounds, filters),
  });
  const placesQuery = useQuery({
    queryKey: ['places-rich', debouncedSearchText],
    queryFn: () => searchPlacesWithCoordinates(debouncedSearchText),
    enabled: debouncedSearchText.trim().length > 2,
  });

  const listings = useMemo(() => {
    return listingsQuery.data ?? [];
  }, [listingsQuery.data]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchText(searchText.trim());
    }, 250);
    return () => clearTimeout(timeout);
  }, [searchText]);

  const updateBoundsFromRegion = (region: Region) => {
    setRegion(region);
    const minLat = region.latitude - region.latitudeDelta / 2;
    const maxLat = region.latitude + region.latitudeDelta / 2;
    const minLng = region.longitude - region.longitudeDelta / 2;
    const maxLng = region.longitude + region.longitudeDelta / 2;
    setBounds({ minLat, minLng, maxLat, maxLng });
  };

  const moveToPlace = async (place: PlaceSearchResult) => {
    Keyboard.dismiss();
    setShowSuggestions(false);
    const resolved = place.placeId ? await geocodePlace(place.placeId) : null;
    const latitude = resolved?.latitude ?? place.latitude;
    const longitude = resolved?.longitude ?? place.longitude;
    const selectedRegion = {
      latitude,
      longitude,
      latitudeDelta: 0.03,
      longitudeDelta: 0.03,
    };
    setRegion(selectedRegion);
    // Keep imperative fallbacks for clustered map wrappers on some devices.
    mapRef.current?.animateToRegion?.(selectedRegion, 700);
    mapRef.current?.getMapRef?.()?.animateToRegion?.(selectedRegion, 700);
    mapRef.current?.getMapRef?.()?.animateCamera?.(
      { center: { latitude, longitude }, zoom: 15 },
      { duration: 700 }
    );
    mapRef.current?.getMapRef?.()?.fitToCoordinates?.(
      [{ latitude, longitude }],
      { edgePadding: { top: 80, right: 80, bottom: 80, left: 80 }, animated: true }
    );
    setBounds({
      minLat: latitude - 0.015,
      maxLat: latitude + 0.015,
      minLng: longitude - 0.015,
      maxLng: longitude + 0.015,
    });
    setSearchText(place.name);
    setDebouncedSearchText('');
  };

  const submitSearch = async () => {
    if (placesQuery.data?.length) {
      await moveToPlace(placesQuery.data[0]);
      return;
    }
    const freshResults = await searchPlacesWithCoordinates(searchText);
    if (freshResults.length) {
      await moveToPlace(freshResults[0]);
    }
  };

  const mapView = (
    <ClusteredMapView
      ref={(value) => {
        mapRef.current = value;
      }}
      provider={PROVIDER_GOOGLE}
      style={styles.map}
      animationEnabled
      clusterColor="#111827"
      spiralEnabled={false}
      tracksViewChanges={false}
      region={region}
      onRegionChangeComplete={updateBoundsFromRegion}
    >
      {listings.map((item) => (
        <Marker
          key={item.id}
          coordinate={{ latitude: item.latitude, longitude: item.longitude }}
          title={item.title}
          description={`${ugx.format(item.priceUgx)} UGX / month`}
          onCalloutPress={() => navigation.navigate('ListingDetail', { listingId: item.id })}
        >
          <View style={styles.housePin}>
            <Text style={styles.housePinText}>🏠</Text>
          </View>
        </Marker>
      ))}
    </ClusteredMapView>
  );

  return (
    <View style={styles.container}>
      {mapView}
      <View style={styles.topControls}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>RentFreely</Text>
          <Text style={styles.badge}>{listings.length} homes</Text>
        </View>
        <TextInput
          value={searchText}
          onChangeText={(text) => {
            setSearchText(text);
            setShowSuggestions(true);
          }}
          placeholder="Search place (town, area, landmark...)"
          style={styles.search}
          returnKeyType="search"
          onSubmitEditing={submitSearch}
        />
        {showSuggestions && placesQuery.data?.length ? (
          <View style={styles.suggestions}>
            {placesQuery.data.map((item: PlaceSearchResult) => (
              <Pressable
                key={item.id}
                style={styles.suggestionItem}
                onPress={() => {
                  void moveToPlace(item);
                }}
              >
                <Text style={styles.suggestionTitle}>{item.name}</Text>
                <Text style={styles.suggestionSub}>{item.address}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        <Pressable style={styles.filterButton} onPress={() => setShowFilters((v) => !v)}>
          <Text style={styles.filterButtonText}>{showFilters ? 'Hide filters' : 'Show filters'}</Text>
        </Pressable>
        {showFilters ? (
          <View style={styles.filtersPanel}>
            <TextInput
              placeholder="Min price (UGX)"
              keyboardType="numeric"
              style={styles.filterInput}
              value={filters.minPrice?.toString() ?? ''}
              onChangeText={(text) =>
                setFilters((prev) => ({ ...prev, minPrice: text ? Number(text) : undefined }))
              }
            />
            <TextInput
              placeholder="Max price (UGX)"
              keyboardType="numeric"
              style={styles.filterInput}
              value={filters.maxPrice?.toString() ?? ''}
              onChangeText={(text) =>
                setFilters((prev) => ({ ...prev, maxPrice: text ? Number(text) : undefined }))
              }
            />
            <TextInput
              placeholder="Min bedrooms"
              keyboardType="numeric"
              style={styles.filterInput}
              value={filters.minBedrooms?.toString() ?? ''}
              onChangeText={(text) =>
                setFilters((prev) => ({ ...prev, minBedrooms: text ? Number(text) : undefined }))
              }
            />
            <View style={styles.typeRow}>
              {(['', 'House', 'Apartment', 'Room'] as const).map((type) => (
                <Pressable
                  key={type || 'all'}
                  style={[styles.typeChip, filters.propertyType === type && styles.typeChipActive]}
                  onPress={() => setFilters((prev) => ({ ...prev, propertyType: type }))}
                >
                  <Text style={filters.propertyType === type ? styles.typeChipActiveText : undefined}>
                    {type || 'Any type'}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.toggleRow}>
              <Text style={styles.subtle}>Furnished only</Text>
              <Switch
                value={filters.furnished ?? false}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, furnished: value ? true : undefined }))
                }
              />
            </View>
          </View>
        ) : null}
      </View>

      <View style={[styles.bottomTray, isTablet && styles.bottomTrayTablet]}>
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          horizontal
          showsHorizontalScrollIndicator={false}
          refreshing={listingsQuery.isFetching}
          onRefresh={() => listingsQuery.refetch()}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.card, isTablet && styles.cardTablet]}
              onPress={() => navigation.navigate('ListingDetail', { listingId: item.id })}
            >
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.cardPrice}>{ugx.format(item.priceUgx)} UGX</Text>
              <Text style={styles.subtle}>
                {item.bedrooms} bed • {item.bathrooms} bath • {item.district}
              </Text>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.emptyChip}>
              <Text style={styles.empty}>
                {listingsQuery.isLoading ? 'Loading listings...' : 'No listings in this area.'}
              </Text>
            </View>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  map: { ...StyleSheet.absoluteFillObject },
  topControls: { position: 'absolute', top: 12, left: 14, right: 14 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 26, fontWeight: '700', color: '#111827' },
  badge: {
    backgroundColor: '#111827',
    color: '#fff',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: 'hidden',
    fontWeight: '600',
  },
  search: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d5d9df',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  suggestions: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    marginTop: -2,
    marginBottom: 10,
    overflow: 'hidden',
  },
  suggestionItem: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  suggestionTitle: { fontWeight: '600', color: '#111827' },
  suggestionSub: { color: '#4b5563', marginTop: 2 },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  housePin: {
    backgroundColor: '#111827',
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#fff',
  },
  housePinText: { color: '#fff', fontSize: 12 },
  filterButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  filterButtonText: { fontWeight: '600', color: '#111827' },
  filtersPanel: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 10,
    gap: 8,
    marginBottom: 10,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: '#d5d9df',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  typeChipActive: { backgroundColor: '#111827', borderColor: '#111827' },
  typeChipActiveText: { color: '#fff' },
  bottomTray: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: 12,
  },
  bottomTrayTablet: { paddingBottom: 16 },
  listContent: { paddingHorizontal: 14, gap: 10 },
  card: {
    width: 280,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fff',
  },
  cardTablet: { width: 340 },
  cardTitle: { fontWeight: '600', fontSize: 16, marginBottom: 4 },
  cardPrice: { fontWeight: '700', fontSize: 16, marginBottom: 2 },
  subtle: { color: '#6b7280' },
  emptyChip: {
    backgroundColor: '#fff',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  empty: { textAlign: 'center', color: '#6b7280' },
});

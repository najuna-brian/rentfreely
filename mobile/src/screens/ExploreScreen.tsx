import { Ionicons } from '@expo/vector-icons';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import ClusteredMapView from 'react-native-map-clustering';
import { ListingCardImage } from '../components/ListingCardImage';
import { fetchListings } from '../lib/listings';
import { geocodePlace, PlaceSearchResult, searchPlacesWithCoordinates } from '../lib/maps';
import { MainTabParamList, RootStackParamList } from '../navigation/types';
import { ListingFilters } from '../types/filters';
import type { Listing } from '../types/listing';
import { MapBounds } from '../types/map';

const ugx = new Intl.NumberFormat('en-UG');
const EXPLORE_CARD_WIDTH = 280;
const EXPLORE_CARD_IMAGE_HEIGHT = 104;

type ExploreNav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Explore'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function ExploreScreen() {
  const navigation = useNavigation<ExploreNav>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 900;
  const mapRef = useRef<any>(null);
  const boundsDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
  const listingsQuery = useQuery<Listing[]>({
    queryKey: ['listings', bounds, filters],
    queryFn: () => fetchListings(undefined, bounds, filters),
    placeholderData: keepPreviousData,
    staleTime: 20_000,
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

  useEffect(
    () => () => {
      if (boundsDebounceRef.current) {
        clearTimeout(boundsDebounceRef.current);
      }
    },
    []
  );

  /** Map region updates often; debounce bounds so the listings query key does not reset on every pan end. */
  const scheduleBoundsFromRegion = (next: Region) => {
    setRegion(next);
    if (boundsDebounceRef.current) {
      clearTimeout(boundsDebounceRef.current);
    }
    boundsDebounceRef.current = setTimeout(() => {
      boundsDebounceRef.current = null;
      const minLat = next.latitude - next.latitudeDelta / 2;
      const maxLat = next.latitude + next.latitudeDelta / 2;
      const minLng = next.longitude - next.longitudeDelta / 2;
      const maxLng = next.longitude + next.longitudeDelta / 2;
      setBounds({ minLat, minLng, maxLat, maxLng });
    }, 450);
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

  const clearFilters = () => setFilters({});

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
      onRegionChangeComplete={scheduleBoundsFromRegion}
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
      <View style={[styles.topControls, { paddingTop: insets.top + 6 }]}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>RentFreely</Text>
          <View style={styles.headerActions}>
            <Pressable
              style={styles.iconGhost}
              onPress={() => listingsQuery.refetch()}
              accessibilityRole="button"
              accessibilityLabel="Refresh listings on the map"
            >
              <Ionicons name="refresh" size={22} color="#111827" />
            </Pressable>
            <Text style={styles.badge}>{listings.length} homes</Text>
          </View>
        </View>
        {listingsQuery.isError ? (
          <Text style={styles.errorBanner}>Could not load listings. Tap refresh or try again.</Text>
        ) : null}
        <View style={styles.searchRow}>
          <TextInput
            value={searchText}
            onChangeText={(text) => {
              setSearchText(text);
              setShowSuggestions(true);
            }}
            placeholder="Search place (town, area, landmark...)"
            style={styles.searchInput}
            returnKeyType="search"
            onSubmitEditing={submitSearch}
            accessibilityLabel="Search place on the map"
          />
          {placesQuery.isFetching && debouncedSearchText.length > 2 ? (
            <ActivityIndicator style={styles.searchSpinner} color="#111827" />
          ) : null}
          <Pressable
            style={[styles.filterIconButton, showFilters && styles.filterIconButtonActive]}
            onPress={() => setShowFilters((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={showFilters ? 'Close filters' : 'Open filters'}
          >
            <Ionicons
              name={showFilters ? 'options' : 'options-outline'}
              size={22}
              color={showFilters ? '#fff' : '#111827'}
            />
          </Pressable>
        </View>
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
        {showFilters ? (
          <View style={styles.filtersPanel}>
            <Text style={styles.filterSectionLabel}>Price and size</Text>
            <TextInput
              placeholder="Min price (UGX)"
              keyboardType="numeric"
              style={styles.filterInput}
              value={filters.minPrice?.toString() ?? ''}
              onChangeText={(text) =>
                setFilters((prev) => ({ ...prev, minPrice: text ? Number(text) : undefined }))
              }
              accessibilityLabel="Minimum monthly rent in UGX"
            />
            <TextInput
              placeholder="Max price (UGX)"
              keyboardType="numeric"
              style={styles.filterInput}
              value={filters.maxPrice?.toString() ?? ''}
              onChangeText={(text) =>
                setFilters((prev) => ({ ...prev, maxPrice: text ? Number(text) : undefined }))
              }
              accessibilityLabel="Maximum monthly rent in UGX"
            />
            <TextInput
              placeholder="Min bedrooms"
              keyboardType="numeric"
              style={styles.filterInput}
              value={filters.minBedrooms?.toString() ?? ''}
              onChangeText={(text) =>
                setFilters((prev) => ({ ...prev, minBedrooms: text ? Number(text) : undefined }))
              }
              accessibilityLabel="Minimum number of bedrooms"
            />
            <Text style={styles.filterSectionLabel}>Property type</Text>
            <View style={styles.typeRow}>
              {(['', 'House', 'Apartment', 'Room'] as const).map((type) => (
                <Pressable
                  key={type || 'all'}
                  style={[styles.typeChip, filters.propertyType === type && styles.typeChipActive]}
                  onPress={() => setFilters((prev) => ({ ...prev, propertyType: type }))}
                  accessibilityRole="button"
                  accessibilityState={{ selected: filters.propertyType === type }}
                  accessibilityLabel={type || 'Any property type'}
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
                accessibilityLabel="Show only furnished homes"
              />
            </View>
            <View style={styles.filterActions}>
              <Pressable
                style={styles.filterSecondary}
                onPress={clearFilters}
                accessibilityRole="button"
                accessibilityLabel="Clear all filters"
              >
                <Text style={styles.filterSecondaryText}>Clear all</Text>
              </Pressable>
              <Pressable
                style={styles.filterPrimary}
                onPress={() => setShowFilters(false)}
                accessibilityRole="button"
                accessibilityLabel="Done editing filters"
              >
                <Text style={styles.filterPrimaryText}>Done</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>

      <View
        style={[
          styles.bottomTray,
          isTablet && styles.bottomTrayTablet,
          { paddingBottom: Math.max(insets.bottom, 12) },
        ]}
      >
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          horizontal
          showsHorizontalScrollIndicator={false}
          refreshing={listingsQuery.isFetching && !listingsQuery.isLoading}
          onRefresh={() => listingsQuery.refetch()}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.card, isTablet && styles.cardTablet]}
              onPress={() => navigation.navigate('ListingDetail', { listingId: item.id })}
              accessibilityRole="button"
              accessibilityLabel={`${item.title}, ${ugx.format(item.priceUgx)} UGX per month`}
            >
              <ListingCardImage
                photoPaths={item.photoPaths}
                width={isTablet ? 340 : EXPLORE_CARD_WIDTH}
                height={EXPLORE_CARD_IMAGE_HEIGHT}
              />
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.cardPrice}>{ugx.format(item.priceUgx)} UGX</Text>
                <Text style={styles.subtle}>
                  {item.bedrooms} bed • {item.bathrooms} bath • {item.district}
                </Text>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.emptyChip}>
              {listingsQuery.isLoading ? (
                <View style={styles.emptyLoading}>
                  <ActivityIndicator color="#111827" />
                  <Text style={styles.empty}>Loading listings…</Text>
                </View>
              ) : (
                <Text style={styles.empty}>No listings in this area.</Text>
              )}
            </View>
          }
          ListFooterComponent={
            <Pressable
              style={styles.listFooter}
              onPress={() => navigation.navigate('Browse')}
              accessibilityRole="button"
              accessibilityLabel="Open full list of homes in the Browse tab"
            >
              <Text style={styles.listFooterText}>Full list</Text>
              <Ionicons name="chevron-forward" size={18} color="#111827" />
            </Pressable>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  map: { ...StyleSheet.absoluteFillObject },
  topControls: { position: 'absolute', top: 0, left: 14, right: 14 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconGhost: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  errorBanner: {
    color: '#b45309',
    fontSize: 13,
    marginBottom: 8,
    lineHeight: 18,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  searchSpinner: { marginRight: -4 },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d5d9df',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  filterIconButton: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIconButtonActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
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
  filtersPanel: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 10,
    gap: 8,
    marginBottom: 10,
  },
  filterSectionLabel: { fontSize: 12, fontWeight: '700', color: '#374151' },
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
  filterActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 4 },
  filterSecondary: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  filterSecondaryText: { color: '#374151', fontWeight: '600', fontSize: 14 },
  filterPrimary: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#111827',
  },
  filterPrimaryText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  bottomTray: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  bottomTrayTablet: {},
  listContent: { paddingHorizontal: 14, gap: 10, alignItems: 'stretch' },
  card: {
    width: EXPLORE_CARD_WIDTH,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  cardTablet: { width: 340 },
  cardBody: { padding: 12, paddingTop: 10 },
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
    minHeight: 44,
    justifyContent: 'center',
  },
  emptyLoading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  empty: { textAlign: 'center', color: '#6b7280' },
  listFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginLeft: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 4,
  },
  listFooterText: { fontWeight: '700', color: '#111827', fontSize: 14 },
});

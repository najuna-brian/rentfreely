import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';
import { createListingDraft, publishListing, uploadListingPhotos } from '../../lib/listings';
import type { RootStackParamList } from '../../navigation/types';
import type { PropertyType } from '../../types/listing';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateListing'>;

const steps = ['Basics', 'Details', 'Location', 'Photos', 'Review'] as const;

const basicsSchema = z.object({
  title: z.string().min(5, 'Title should be at least 5 characters'),
  priceUgx: z.number().int().positive('Monthly rent must be above 0'),
  bedrooms: z.number().int().min(0).max(20),
  bathrooms: z.number().int().min(0).max(20),
  propertyType: z.enum(['House', 'Apartment', 'Room']),
  furnished: z.boolean(),
});

const detailsSchema = z.object({
  description: z.string().min(30, 'Description should be at least 30 characters'),
});

const locationSchema = z.object({
  address: z.string().min(5, 'Address is required'),
  district: z.string().min(2, 'District is required'),
  city: z.string().min(2, 'City is required'),
  latitude: z.number(),
  longitude: z.number(),
});

type WizardState = {
  title: string;
  priceUgx: string;
  bedrooms: string;
  bathrooms: string;
  propertyType: PropertyType;
  furnished: boolean;
  description: string;
  address: string;
  district: string;
  city: string;
  latitude: number;
  longitude: number;
  photos: string[];
  listingId?: string;
};

const ugx = new Intl.NumberFormat('en-UG');
const MAX_LISTING_PHOTOS = 8;

export function CreateListingWizard({ navigation }: Props) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [state, setState] = useState<WizardState>({
    title: '',
    priceUgx: '',
    bedrooms: '1',
    bathrooms: '1',
    propertyType: 'House',
    furnished: false,
    description: '',
    address: '',
    district: '',
    city: '',
    latitude: 1.3733,
    longitude: 32.2903,
    photos: [],
  });

  const draftMutation = useMutation({
    mutationFn: createListingDraft,
    onSuccess: (listingId) => {
      setState((prev) => ({ ...prev, listingId }));
    },
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!state.listingId) {
        throw new Error('Draft listing not created yet.');
      }
      await uploadListingPhotos(state.listingId, state.photos);
      await publishListing(state.listingId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      Alert.alert('Published', 'Your property is now live.');
      navigation.goBack();
    },
    onError: (error) => {
      Alert.alert('Publish failed', (error as Error).message);
    },
  });

  const region: Region = useMemo(
    () => ({
      latitude: state.latitude,
      longitude: state.longitude,
      latitudeDelta: 0.03,
      longitudeDelta: 0.03,
    }),
    [state.latitude, state.longitude]
  );

  const next = async () => {
    if (step === 0) {
      const parsed = basicsSchema.safeParse({
        title: state.title.trim(),
        priceUgx: Number(state.priceUgx),
        bedrooms: Number(state.bedrooms),
        bathrooms: Number(state.bathrooms),
        propertyType: state.propertyType,
        furnished: state.furnished,
      });
      if (!parsed.success) {
        Alert.alert('Check basics', parsed.error.issues[0]?.message ?? 'Please review form values.');
        return;
      }
      setStep(1);
      return;
    }
    if (step === 1) {
      const parsed = detailsSchema.safeParse({ description: state.description.trim() });
      if (!parsed.success) {
        Alert.alert('Check details', parsed.error.issues[0]?.message ?? 'Please review description.');
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      const parsed = locationSchema.safeParse({
        address: state.address.trim(),
        district: state.district.trim(),
        city: state.city.trim(),
        latitude: state.latitude,
        longitude: state.longitude,
      });
      if (!parsed.success) {
        Alert.alert('Check location', parsed.error.issues[0]?.message ?? 'Please review location.');
        return;
      }
      if (!state.listingId) {
        try {
          const listingId = await draftMutation.mutateAsync({
            title: state.title.trim(),
            description: state.description.trim(),
            priceUgx: Number(state.priceUgx),
            bedrooms: Number(state.bedrooms),
            bathrooms: Number(state.bathrooms),
            propertyType: state.propertyType,
            furnished: state.furnished,
            address: state.address.trim(),
            city: state.city.trim(),
            district: state.district.trim(),
            latitude: state.latitude,
            longitude: state.longitude,
          });
          setState((prev) => ({ ...prev, listingId }));
        } catch (error) {
          Alert.alert('Draft failed', (error as Error).message);
          return;
        }
      }
      setStep(3);
      return;
    }
    if (step === 3) {
      if (state.photos.length < 1) {
        Alert.alert('Add photos', 'Please add at least one photo before review.');
        return;
      }
      setStep(4);
      return;
    }
  };

  const back = () => {
    if (step === 0) {
      navigation.goBack();
      return;
    }
    setStep((value) => value - 1);
  };

  const pickFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Allow photo access to choose listing images from your library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: MAX_LISTING_PHOTOS,
    });
    if (!result.canceled) {
      setState((prev) => ({
        ...prev,
        photos: result.assets.map((asset) => asset.uri).slice(0, MAX_LISTING_PHOTOS),
      }));
    }
  };

  const takePhotoWithCamera = async () => {
    if (state.photos.length >= MAX_LISTING_PHOTOS) {
      Alert.alert('Maximum photos', `You can add up to ${MAX_LISTING_PHOTOS} photos per listing.`);
      return;
    }
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Allow camera access to take listing photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setState((prev) => ({
        ...prev,
        photos: [...prev.photos, result.assets[0].uri].slice(0, MAX_LISTING_PHOTOS),
      }));
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable onPress={back} hitSlop={8}>
            <Text style={styles.link}>{step === 0 ? 'Close' : 'Back'}</Text>
          </Pressable>
          <Text style={styles.headerTitle}>
            {steps[step]} ({step + 1}/{steps.length})
          </Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {step === 0 ? (
            <View style={styles.card}>
              <Text style={styles.title}>Basics</Text>
              <Text style={styles.fieldLabel}>Title</Text>
              <TextInput
                style={styles.input}
                value={state.title}
                onChangeText={(title) => setState((prev) => ({ ...prev, title }))}
                placeholder="e.g. 2-bedroom apartment near town centre"
                accessibilityLabel="Property title"
              />
              <Text style={styles.fieldLabel}>Monthly rent (UGX)</Text>
              <TextInput
                style={styles.input}
                value={state.priceUgx}
                onChangeText={(priceUgx) => setState((prev) => ({ ...prev, priceUgx }))}
                placeholder="Amount in Ugandan shillings"
                keyboardType="numeric"
                accessibilityLabel="Monthly rent in UGX"
              />
              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.fieldLabel}>Bedrooms</Text>
                  <TextInput
                    style={styles.input}
                    value={state.bedrooms}
                    onChangeText={(bedrooms) => setState((prev) => ({ ...prev, bedrooms }))}
                    placeholder="0–20"
                    keyboardType="numeric"
                    accessibilityLabel="Number of bedrooms"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.fieldLabel}>Bathrooms</Text>
                  <TextInput
                    style={styles.input}
                    value={state.bathrooms}
                    onChangeText={(bathrooms) => setState((prev) => ({ ...prev, bathrooms }))}
                    placeholder="0–20"
                    keyboardType="numeric"
                    accessibilityLabel="Number of bathrooms"
                  />
                </View>
              </View>
              <Text style={styles.fieldLabel}>Property type</Text>
              <View style={styles.typeRow}>
                {(['House', 'Apartment', 'Room'] as const).map((type) => (
                  <Pressable
                    key={type}
                    style={[styles.typeChip, state.propertyType === type && styles.typeChipActive]}
                    onPress={() => setState((prev) => ({ ...prev, propertyType: type }))}
                    accessibilityRole="button"
                    accessibilityLabel={type}
                  >
                    <Text style={state.propertyType === type ? styles.typeChipTextActive : styles.typeChipText}>
                      {type}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.switchRow}>
                <Text style={styles.subtle}>Furnished</Text>
                <Switch
                  value={state.furnished}
                  onValueChange={(furnished) => setState((prev) => ({ ...prev, furnished }))}
                  accessibilityLabel="Furnished property"
                />
              </View>
            </View>
          ) : null}

          {step === 1 ? (
            <View style={styles.card}>
              <Text style={styles.title}>Details</Text>
              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.multiInput]}
                value={state.description}
                onChangeText={(description) => setState((prev) => ({ ...prev, description }))}
                placeholder="Describe the home, nearby places, and rental terms"
                multiline
                textAlignVertical="top"
                accessibilityLabel="Property description"
              />
            </View>
          ) : null}

          {step === 2 ? (
            <View style={styles.card}>
              <Text style={styles.title}>Location</Text>
              <Text style={styles.fieldLabel}>Street address</Text>
              <TextInput
                style={styles.input}
                value={state.address}
                onChangeText={(address) => setState((prev) => ({ ...prev, address }))}
                placeholder="Address line"
                accessibilityLabel="Street address"
              />
              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.fieldLabel}>District</Text>
                  <TextInput
                    style={styles.input}
                    value={state.district}
                    onChangeText={(district) => setState((prev) => ({ ...prev, district }))}
                    placeholder="District"
                    accessibilityLabel="District"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.fieldLabel}>City</Text>
                  <TextInput
                    style={styles.input}
                    value={state.city}
                    onChangeText={(city) => setState((prev) => ({ ...prev, city }))}
                    placeholder="City"
                    accessibilityLabel="City"
                  />
                </View>
              </View>
              <Text style={styles.subtle}>
                Pan and zoom the map so the pin sits on your property entrance. Coordinates update from the map
                center.
              </Text>
              <View style={styles.mapShell}>
                <MapView
                  provider={PROVIDER_GOOGLE}
                  style={styles.map}
                  region={region}
                  onRegionChangeComplete={(nextRegion) =>
                    setState((prev) => ({
                      ...prev,
                      latitude: nextRegion.latitude,
                      longitude: nextRegion.longitude,
                    }))
                  }
                  accessibilityLabel="Map to set property location"
                />
                <View style={styles.mapCrosshair} pointerEvents="none">
                  <View style={styles.crosshairRing} />
                  <View style={styles.crosshairDot} />
                </View>
              </View>
            </View>
          ) : null}

          {step === 3 ? (
            <View style={styles.card}>
              <Text style={styles.title}>Photos</Text>
              <Text style={styles.subtle}>
                Choose from your library or take new shots (up to {MAX_LISTING_PHOTOS} photos).
              </Text>
              <View style={styles.photoSourceRow}>
                <Pressable style={[styles.secondaryButton, styles.photoSourceHalf]} onPress={() => void pickFromLibrary()}>
                  <Text style={styles.secondaryButtonText}>Photo library</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.secondaryButton,
                    styles.photoSourceHalf,
                    state.photos.length >= MAX_LISTING_PHOTOS && styles.buttonDisabled,
                  ]}
                  onPress={() => void takePhotoWithCamera()}
                  disabled={state.photos.length >= MAX_LISTING_PHOTOS}
                >
                  <Text style={styles.secondaryButtonText}>Take photo</Text>
                </Pressable>
              </View>
              <View style={styles.photoGrid}>
                {state.photos.map((uri, index) => (
                  <View key={`${index}-${uri}`} style={styles.photoTile}>
                    <Image source={{ uri }} style={styles.photo} accessibilityLabel="Listing photo preview" />
                    <Pressable
                      style={styles.removePhotoBtn}
                      onPress={() =>
                        setState((prev) => ({
                          ...prev,
                          photos: prev.photos.filter((_, i) => i !== index),
                        }))
                      }
                      accessibilityRole="button"
                      accessibilityLabel="Remove photo"
                    >
                      <Text style={styles.removePhotoText}>×</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {step === 4 ? (
            <View style={styles.card}>
              <Text style={styles.title}>Review</Text>
              <Text style={styles.reviewLine}>{state.title}</Text>
              <Text style={styles.reviewLine}>UGX {ugx.format(Number(state.priceUgx || 0))} / month</Text>
              <Text style={styles.reviewLine}>
                {state.propertyType} • {state.bedrooms} bed • {state.bathrooms} bath
              </Text>
              <Text style={styles.reviewLine}>{state.furnished ? 'Furnished' : 'Unfurnished'}</Text>
              <Text style={styles.reviewLine}>
                {state.address}, {state.district}, {state.city}
              </Text>
              <Text style={styles.reviewLine}>{state.photos.length} photos ready</Text>
              <Text style={styles.subtle}>Publishing will make this listing visible in Explore and Browse.</Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          {step < 4 ? (
            <Pressable
              style={[styles.button, draftMutation.isPending && styles.buttonDisabled]}
              onPress={() => void next()}
              disabled={draftMutation.isPending}
            >
              <Text style={styles.buttonText}>{draftMutation.isPending ? 'Saving draft...' : 'Continue'}</Text>
            </Pressable>
          ) : (
            <Pressable
              style={[styles.button, publishMutation.isPending && styles.buttonDisabled]}
              onPress={() => publishMutation.mutate()}
              disabled={publishMutation.isPending}
            >
              <Text style={styles.buttonText}>
                {publishMutation.isPending ? 'Publishing...' : 'Publish listing'}
              </Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#eef0f3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 15, color: '#111827', fontWeight: '600' },
  link: { color: '#111827', fontWeight: '600' },
  content: { padding: 16 },
  card: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14, padding: 14, gap: 10 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151' },
  input: {
    borderWidth: 1,
    borderColor: '#d5d9df',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  multiInput: { minHeight: 120 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  halfInput: { flex: 1 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  typeChipActive: { borderColor: '#111827', backgroundColor: '#111827' },
  typeChipText: { color: '#111827' },
  typeChipTextActive: { color: '#fff' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mapShell: {
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  map: { ...StyleSheet.absoluteFillObject },
  mapCrosshair: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crosshairRing: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: '#111827',
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  crosshairDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#111827',
    borderWidth: 2,
    borderColor: '#fff',
  },
  subtle: { color: '#6b7280', lineHeight: 20 },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 11,
  },
  secondaryButtonText: { color: '#111827', fontWeight: '600' },
  photoSourceRow: { flexDirection: 'row', gap: 8 },
  photoSourceHalf: { flex: 1 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoTile: { position: 'relative' },
  photo: { width: 92, height: 92, borderRadius: 10, backgroundColor: '#f3f4f6' },
  removePhotoBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(17,24,39,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoText: { color: '#fff', fontSize: 20, lineHeight: 22, fontWeight: '700', marginTop: -2 },
  reviewLine: { color: '#111827', lineHeight: 22 },
  footer: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8 },
  button: {
    backgroundColor: '#111827',
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 14,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700' },
});

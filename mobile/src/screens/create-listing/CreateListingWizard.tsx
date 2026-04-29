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
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
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
              <TextInput
                style={styles.input}
                value={state.title}
                onChangeText={(title) => setState((prev) => ({ ...prev, title }))}
                placeholder="Property title"
              />
              <TextInput
                style={styles.input}
                value={state.priceUgx}
                onChangeText={(priceUgx) => setState((prev) => ({ ...prev, priceUgx }))}
                placeholder="Monthly rent (UGX)"
                keyboardType="numeric"
              />
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  value={state.bedrooms}
                  onChangeText={(bedrooms) => setState((prev) => ({ ...prev, bedrooms }))}
                  placeholder="Bedrooms"
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  value={state.bathrooms}
                  onChangeText={(bathrooms) => setState((prev) => ({ ...prev, bathrooms }))}
                  placeholder="Bathrooms"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.typeRow}>
                {(['House', 'Apartment', 'Room'] as const).map((type) => (
                  <Pressable
                    key={type}
                    style={[styles.typeChip, state.propertyType === type && styles.typeChipActive]}
                    onPress={() => setState((prev) => ({ ...prev, propertyType: type }))}
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
                />
              </View>
            </View>
          ) : null}

          {step === 1 ? (
            <View style={styles.card}>
              <Text style={styles.title}>Details</Text>
              <TextInput
                style={[styles.input, styles.multiInput]}
                value={state.description}
                onChangeText={(description) => setState((prev) => ({ ...prev, description }))}
                placeholder="Describe the home, nearby places, and rental terms"
                multiline
                textAlignVertical="top"
              />
            </View>
          ) : null}

          {step === 2 ? (
            <View style={styles.card}>
              <Text style={styles.title}>Location</Text>
              <TextInput
                style={styles.input}
                value={state.address}
                onChangeText={(address) => setState((prev) => ({ ...prev, address }))}
                placeholder="Address line"
              />
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  value={state.district}
                  onChangeText={(district) => setState((prev) => ({ ...prev, district }))}
                  placeholder="District"
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  value={state.city}
                  onChangeText={(city) => setState((prev) => ({ ...prev, city }))}
                  placeholder="City"
                />
              </View>
              <Text style={styles.subtle}>Drag the pin to the exact property location</Text>
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
              >
                <Marker
                  draggable
                  coordinate={{ latitude: state.latitude, longitude: state.longitude }}
                  onDragEnd={(event) =>
                    setState((prev) => ({
                      ...prev,
                      latitude: event.nativeEvent.coordinate.latitude,
                      longitude: event.nativeEvent.coordinate.longitude,
                    }))
                  }
                />
              </MapView>
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
                {state.photos.map((uri) => (
                  <Image key={uri} source={{ uri }} style={styles.photo} />
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
              <Text style={styles.subtle}>Publishing will make this listing visible in Explore and List.</Text>
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
  input: {
    borderWidth: 1,
    borderColor: '#d5d9df',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  multiInput: { minHeight: 120 },
  row: { flexDirection: 'row', gap: 8 },
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
  map: { height: 220, borderRadius: 12 },
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
  photo: { width: 92, height: 92, borderRadius: 10 },
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

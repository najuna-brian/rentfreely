import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { createListing } from '../lib/listings';

export function PostListingScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 900;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');

  const createMutation = useMutation({
    mutationFn: createListing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      Alert.alert('Saved', 'Listing published successfully.');
      setTitle('');
      setPrice('');
      setDistrict('');
      setAddress('');
    },
    onError: (error) => {
      Alert.alert('Could not save', (error as Error).message);
    },
  });

  const submit = () => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in from Profile before posting.');
      return;
    }
    if (!title || !price || !district || !address) {
      Alert.alert('Missing fields', 'Please fill title, monthly price, district, and address.');
      return;
    }
    createMutation.mutate({
      title,
      description: '',
      priceUgx: Number(price),
      bedrooms: 1,
      bathrooms: 1,
      propertyType: 'House',
      furnished: false,
      address,
      city: district,
      district,
      latitude: 1.3733,
      longitude: 32.2903,
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={[styles.formCard, isTablet && styles.formCardWide]}>
        <Text style={styles.title}>Post your rental property</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Property title"
          style={styles.input}
        />
        <TextInput
          value={price}
          onChangeText={setPrice}
          placeholder="Monthly rent (UGX)"
          keyboardType="numeric"
          style={styles.input}
        />
        <TextInput
          value={district}
          onChangeText={setDistrict}
          placeholder="District / area"
          style={styles.input}
        />
        <TextInput
          value={address}
          onChangeText={setAddress}
          placeholder="Address line"
          style={styles.input}
        />
        <Pressable style={styles.button} onPress={submit}>
          <Text style={styles.buttonText}>
            {createMutation.isPending ? 'Publishing...' : 'Publish listing'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 16 },
  formCard: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14, padding: 16, gap: 10 },
  formCardWide: { alignSelf: 'center', width: '85%', maxWidth: 760 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#d5d9df',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  button: {
    marginTop: 4,
    backgroundColor: '#111827',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 12,
  },
  buttonText: { color: '#fff', fontWeight: '600' },
});

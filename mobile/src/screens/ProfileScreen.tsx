import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export function ProfileScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 900;
  const { user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      Alert.alert('Sign in failed', error.message);
      return;
    }
    Alert.alert('Signed in', 'You are now connected.');
  };

  const signUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      Alert.alert('Sign up failed', error.message);
      return;
    }
    Alert.alert('Account created', 'Check your email if confirmation is enabled.');
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.loadingWrap}>
        <Text>Loading profile...</Text>
      </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={[styles.card, isTablet && styles.cardWide]}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.row}>Account type: Landlord + Tenant</Text>
        <Text style={styles.row}>You can both post properties and search rentals.</Text>
        {user ? (
          <>
            <Text style={styles.row}>Signed in as: {user.email}</Text>
            <Pressable style={styles.button} onPress={signOut}>
              <Text style={styles.buttonText}>Sign out</Text>
            </Pressable>
          </>
        ) : (
          <>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              style={styles.input}
              secureTextEntry
            />
            <Pressable style={styles.button} onPress={signIn}>
              <Text style={styles.buttonText}>Sign in</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={signUp}>
              <Text style={styles.secondaryButtonText}>Create account</Text>
            </Pressable>
          </>
        )}
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  loadingWrap: { flex: 1, padding: 16, justifyContent: 'center' },
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 16 },
  card: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14, padding: 16, gap: 8 },
  cardWide: { alignSelf: 'center', width: '85%', maxWidth: 760 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  row: { color: '#4b5563', lineHeight: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#d5d9df',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  button: {
    marginTop: 6,
    backgroundColor: '#111827',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 12,
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#111827',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 12,
  },
  secondaryButtonText: { color: '#111827', fontWeight: '600' },
});

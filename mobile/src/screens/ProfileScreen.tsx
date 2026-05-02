import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CommonActions, CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { clearOnboardingFlag } from '../lib/onboardingStorage';
import { enableLandlordRole, ensureTenantProfile, getMyProfile } from '../lib/profile';
import { supabase } from '../lib/supabase';
import { MainTabParamList, RootStackParamList } from '../navigation/types';

type ProfileNav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Profile'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function ProfileScreen() {
  const navigation = useNavigation<ProfileNav>();
  const { width } = useWindowDimensions();
  const isTablet = width >= 900;
  const { user, loading } = useAuth();
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isEnablingLandlord, setIsEnablingLandlord] = useState(false);
  const [roles, setRoles] = useState<string[]>(['tenant']);

  const canListProperty = useMemo(() => roles.includes('landlord'), [roles]);

  const loadProfile = async () => {
    if (!user?.id) {
      setRoles(['tenant']);
      return;
    }
    setProfileLoading(true);
    try {
      const profile = await getMyProfile(user.id);
      if (profile) {
        setUsername(profile.username ?? '');
        setPhone(profile.phone ?? '');
        setEmail(profile.email ?? user.email ?? '');
        setRoles(profile.app_roles?.length ? profile.app_roles : ['tenant']);
      } else {
        setEmail(user.email ?? '');
        setRoles(['tenant']);
      }
    } catch (error) {
      Alert.alert('Profile error', (error as Error).message);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    void loadProfile();
  }, [user?.id]);

  const validateProfileInputs = () => {
    if (!username.trim()) {
      Alert.alert('Username required', 'Please enter a username.');
      return false;
    }
    if (!phone.trim()) {
      Alert.alert('Phone required', 'Please enter your phone number.');
      return false;
    }
    if (!email.trim()) {
      Alert.alert('Email required', 'Please enter your email address.');
      return false;
    }
    return true;
  };

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      Alert.alert('Sign in failed', error.message);
      return;
    }
    Alert.alert('Signed in', 'You are now connected.');
    await loadProfile();
  };

  const signUp = async () => {
    if (!validateProfileInputs()) return;

    const emailRedirectTo = Linking.createURL('auth/callback');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo },
    });
    if (error) {
      Alert.alert('Sign up failed', error.message);
      return;
    }
    if (data.user?.id) {
      try {
        await ensureTenantProfile({
          userId: data.user.id,
          username,
          phone,
          email,
        });
      } catch (profileError) {
        Alert.alert('Profile setup failed', (profileError as Error).message);
        return;
      }
    }
    Alert.alert(
      'Account created',
      'You are signed up as a tenant. Enable landlord mode below when you want to post rentals.'
    );
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const signInWithGoogle = async () => {
    const redirectTo = Linking.createURL('auth/callback');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      Alert.alert('Google sign-in failed', error.message);
      return;
    }

    if (data?.url) {
      await Linking.openURL(data.url);
    }
  };

  const saveProfile = async () => {
    if (!user?.id) return;
    if (!validateProfileInputs()) return;
    setIsSavingProfile(true);
    try {
      const profile = await ensureTenantProfile({
        userId: user.id,
        username,
        phone,
        email,
      });
      setRoles(profile.app_roles);
      Alert.alert('Saved', 'Profile details updated.');
    } catch (error) {
      Alert.alert('Save failed', (error as Error).message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const activateLandlord = async () => {
    if (!user?.id) {
      Alert.alert('Sign in required', 'Please sign in first.');
      return;
    }
    if (!validateProfileInputs()) return;
    setIsEnablingLandlord(true);
    try {
      const profile = await ensureTenantProfile({
        userId: user.id,
        username,
        phone,
        email,
      });
      const next = profile.app_roles.includes('landlord')
        ? profile
        : await enableLandlordRole(user.id);
      setRoles(next.app_roles);
      Alert.alert('Landlord enabled', 'You can now list properties.');
    } catch (error) {
      Alert.alert('Enable landlord failed', (error as Error).message);
    } finally {
      setIsEnablingLandlord(false);
    }
  };

  const replayIntroduction = async () => {
    await clearOnboardingFlag();
    navigation.getParent()?.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Onboarding' }],
      })
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#111827" />
          <Text style={styles.loadingText}>Loading profile…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.wrap}>
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
          <View style={[styles.card, isTablet && styles.cardWide]}>
            <Text style={styles.title}>Profile</Text>
            {user ? (
              <>
                <Text style={styles.row}>
                  Account type: {canListProperty ? 'Tenant + Landlord' : 'Tenant'}
                </Text>
                <Text style={styles.row}>
                  {canListProperty
                    ? 'You can search rentals and post properties.'
                    : 'New accounts start as tenant. Enable landlord to post properties.'}
                </Text>
                <Text style={styles.row}>Signed in as: {user.email ?? 'Google account'}</Text>
                <Text style={styles.label}>Username</Text>
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="How we should address you"
                  style={styles.input}
                  autoCapitalize="none"
                  editable={!profileLoading}
                  accessibilityLabel="Username"
                />
                <Text style={styles.label}>Phone</Text>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+256…"
                  style={styles.input}
                  keyboardType="phone-pad"
                  editable={!profileLoading}
                  accessibilityLabel="Phone number"
                />
                <Text style={styles.label}>Email</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  style={styles.input}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!profileLoading}
                  accessibilityLabel="Email address"
                />
                <Pressable
                  style={[styles.secondaryButton, profileLoading && styles.buttonMuted]}
                  onPress={() => void saveProfile()}
                  disabled={isSavingProfile || profileLoading}
                >
                  <Text style={styles.secondaryButtonText}>
                    {isSavingProfile ? 'Saving profile…' : 'Save profile details'}
                  </Text>
                </Pressable>
                {!canListProperty ? (
                  <Pressable
                    style={[styles.secondaryButton, profileLoading && styles.buttonMuted]}
                    onPress={() => void activateLandlord()}
                    disabled={isEnablingLandlord || profileLoading}
                  >
                    <Text style={styles.secondaryButtonText}>
                      {isEnablingLandlord ? 'Enabling landlord…' : 'Enable landlord account'}
                    </Text>
                  </Pressable>
                ) : null}
                <Pressable
                  style={styles.primaryAlt}
                  onPress={() =>
                    canListProperty
                      ? navigation.navigate('CreateListing')
                      : Alert.alert(
                          'Landlord account required',
                          'Enable landlord account first, then you can list a property.'
                        )
                  }
                >
                  <Text style={styles.primaryAltText}>List a property</Text>
                </Pressable>
                <Pressable style={styles.button} onPress={signOut}>
                  <Text style={styles.buttonText}>Sign out</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.row}>
                  Create an account to save homes and unlock landlord tools. Use the same email you will share with
                  renters.
                </Text>
                <Text style={styles.label}>Username</Text>
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="How we should address you"
                  style={styles.input}
                  autoCapitalize="none"
                  accessibilityLabel="Username"
                />
                <Text style={styles.label}>Phone</Text>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+256…"
                  style={styles.input}
                  keyboardType="phone-pad"
                  accessibilityLabel="Phone number"
                />
                <Text style={styles.label}>Email</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  style={styles.input}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  accessibilityLabel="Email address"
                />
                <Text style={styles.label}>Password</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 6 characters"
                  style={styles.input}
                  secureTextEntry
                  accessibilityLabel="Password"
                />
                <Pressable style={styles.button} onPress={signIn}>
                  <Text style={styles.buttonText}>Sign in</Text>
                </Pressable>
                <Pressable style={styles.secondaryButton} onPress={signUp}>
                  <Text style={styles.secondaryButtonText}>Create tenant account</Text>
                </Pressable>
                <Pressable style={styles.secondaryButton} onPress={() => void signInWithGoogle()}>
                  <Text style={styles.secondaryButtonText}>Continue with Google</Text>
                </Pressable>
                <Text style={styles.hint}>
                  Want to list a property? After you sign in, enable landlord mode on this screen, then use “List a
                  property.”
                </Text>
              </>
            )}
            <Pressable onPress={() => void replayIntroduction()} style={styles.linkWrap}>
              <Text style={styles.link}>View introduction again</Text>
            </Pressable>
          </View>
        </ScrollView>
        {profileLoading && user ? (
          <View style={styles.profileOverlay} pointerEvents="auto">
            <ActivityIndicator size="large" color="#111827" />
            <Text style={styles.overlayText}>Loading profile…</Text>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  wrap: { flex: 1 },
  loadingWrap: { flex: 1, padding: 16, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#4b5563' },
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 16 },
  card: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14, padding: 16, gap: 8 },
  cardWide: { alignSelf: 'center', width: '85%', maxWidth: 760 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  row: { color: '#4b5563', lineHeight: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 4, marginBottom: 2 },
  hint: { color: '#6b7280', fontSize: 14, lineHeight: 20, marginTop: 8 },
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
  primaryAlt: {
    marginTop: 4,
    backgroundColor: '#111827',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 12,
  },
  primaryAltText: { color: '#fff', fontWeight: '600' },
  buttonMuted: { opacity: 0.45 },
  linkWrap: { marginTop: 12, alignSelf: 'center', paddingVertical: 8 },
  link: { color: '#6b7280', fontSize: 14, textDecorationLine: 'underline' },
  profileOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  overlayText: { color: '#4b5563', fontSize: 15 },
});

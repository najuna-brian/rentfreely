import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'rentfreely.onboarding.v1';

export async function isOnboardingComplete(): Promise<boolean> {
  const value = await AsyncStorage.getItem(KEY);
  return value === '1';
}

export async function setOnboardingComplete(): Promise<void> {
  await AsyncStorage.setItem(KEY, '1');
}

/** Dev / testing only — call if you need to see onboarding again */
export async function clearOnboardingFlag(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../navigation/types';
import { setOnboardingComplete } from '../../lib/onboardingStorage';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const STEPS = [
  {
    title: 'Welcome to RentFreely',
    body: 'Discover rental homes across Uganda and list your own property — all in one place.',
    accent: '🏠',
  },
  {
    title: 'Explore on the map',
    body: 'Pan and zoom the map to see homes where you want to live. Filters help you match price, size, and more.',
    accent: '🗺️',
  },
  {
    title: 'Browse in a list',
    body: 'Use the Browse tab to search by town or landmark and scroll results with photos in a clear, scannable list.',
    accent: '📋',
  },
  {
    title: 'Save & sign in when ready',
    body: 'Favorite homes from any listing. Create an account in Profile to keep your saves and post rentals.',
    accent: '⭐',
  },
];

export function OnboardingScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [step, setStep] = useState(0);

  const finish = async () => {
    await setOnboardingComplete();
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  const goNext = () => {
    if (step < STEPS.length - 1) {
      const next = step + 1;
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
      setStep(next);
    } else {
      void finish();
    }
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const i = Math.round(x / width);
    setStep(Math.min(Math.max(i, 0), STEPS.length - 1));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Pressable onPress={finish} hitSlop={12} accessibilityRole="button" accessibilityLabel="Skip introduction">
          <Text style={styles.skip}>Skip</Text>
        </Pressable>
      </View>

      <View style={styles.scrollWrap}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        scrollEventThrottle={16}
        style={styles.scroll}
      >
        {STEPS.map((item) => (
          <View key={item.title} style={[styles.slide, { width }]}>
            <Text style={styles.accent}>{item.accent}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </View>
        ))}
      </ScrollView>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <View key={String(i)} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>
        <Pressable style={styles.primary} onPress={goNext} accessibilityRole="button">
          <Text style={styles.primaryText}>{step === STEPS.length - 1 ? 'Get started' : 'Continue'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fafafa' },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  headerSpacer: { flex: 1 },
  skip: { fontSize: 16, color: '#6b7280', paddingVertical: 8, paddingHorizontal: 12 },
  scrollWrap: { flex: 1 },
  scroll: { flex: 1 },
  slide: {
    paddingHorizontal: 28,
    paddingTop: 24,
    justifyContent: 'center',
    minHeight: 360,
  },
  accent: { fontSize: 48, marginBottom: 20, textAlign: 'center' },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 32,
  },
  body: {
    fontSize: 17,
    lineHeight: 26,
    color: '#4b5563',
    textAlign: 'center',
  },
  footer: { paddingHorizontal: 24, paddingBottom: 8, gap: 20 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#d1d5db' },
  dotActive: { backgroundColor: '#111827', width: 22 },
  primary: {
    backgroundColor: '#111827',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});

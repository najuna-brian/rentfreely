import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { ExploreScreen } from '../screens/ExploreScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { ListScreen } from '../screens/ListScreen';
import { ListingDetailScreen } from '../screens/ListingDetailScreen';
import { CreateListingWizard } from '../screens/create-listing/CreateListingWizard';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { isOnboardingComplete } from '../lib/onboardingStorage';
import type { MainTabParamList, RootStackParamList } from './types';

export type { MainTabParamList, RootStackParamList } from './types';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="List" component={ListScreen} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const [bootState, setBootState] = useState<'loading' | 'onboarding' | 'main'>('loading');

  useEffect(() => {
    let alive = true;
    void isOnboardingComplete().then((done) => {
      if (!alive) return;
      setBootState(done ? 'main' : 'onboarding');
    });
    return () => {
      alive = false;
    };
  }, []);

  if (bootState === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: '#fafafa', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  return (
    <RootStack.Navigator
      initialRouteName={bootState === 'onboarding' ? 'Onboarding' : 'MainTabs'}
      screenOptions={{ headerShown: false }}
    >
      <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
      <RootStack.Screen name="MainTabs" component={MainTabs} />
      <RootStack.Screen
        name="CreateListing"
        component={CreateListingWizard}
        options={{ headerShown: false, presentation: 'modal' }}
      />
      <RootStack.Screen
        name="ListingDetail"
        component={ListingDetailScreen}
        options={{ headerShown: true, title: 'Listing details' }}
      />
    </RootStack.Navigator>
  );
}

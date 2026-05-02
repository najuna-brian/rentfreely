import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { BrowseScreen } from '../screens/BrowseScreen';
import { ExploreScreen } from '../screens/ExploreScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
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
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#111827',
        tabBarInactiveTintColor: '#6b7280',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: { borderTopColor: '#e5e7eb' },
      }}
    >
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Browse"
        component={BrowseScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="list-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="heart-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
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

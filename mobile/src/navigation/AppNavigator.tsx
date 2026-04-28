import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ExploreScreen } from '../screens/ExploreScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { ListScreen } from '../screens/ListScreen';
import { ListingDetailScreen } from '../screens/ListingDetailScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

export type RootStackParamList = {
  MainTabs: undefined;
  ListingDetail: { listingId: string };
};

export type MainTabParamList = {
  Explore: undefined;
  List: undefined;
  Favorites: undefined;
  Profile: undefined;
};

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
  return (
    <RootStack.Navigator>
      <RootStack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name="ListingDetail"
        component={ListingDetailScreen}
        options={{ title: 'Listing details' }}
      />
    </RootStack.Navigator>
  );
}

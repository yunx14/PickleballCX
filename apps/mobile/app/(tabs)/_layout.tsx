import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';

import { HeaderLogo } from '@/components/ui/HeaderLogo';
import { HeaderRightButtons } from '@/components/ui/HeaderRightButtons';
import { brand } from '@/constants/brand';
import { spacing } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: brand.accent,
        tabBarInactiveTintColor: brand.muted,
        headerStyle: { backgroundColor: brand.background },
        headerShadowVisible: false,
        headerTintColor: brand.text,
        headerTitleStyle: { fontWeight: '800', fontSize: 17, color: brand.text },
        headerTitleAlign: 'center',
        headerLeft: () => <HeaderLogo />,
        headerLeftContainerStyle: { paddingLeft: 12 },
        headerRight: () => <HeaderRightButtons />,
        tabBarStyle: {
          backgroundColor: brand.background,
          borderTopColor: brand.border,
          paddingTop: spacing.xs,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginBottom: spacing.xs,
          textTransform: 'uppercase',
          letterSpacing: 0.4,
        },
        sceneStyle: { backgroundColor: brand.background },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Find Games',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'house.fill', android: 'home', web: 'home' }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'map.fill', android: 'map', web: 'map' }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="my-games"
        options={{
          title: 'My Games',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'calendar', android: 'event', web: 'event' }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="sessions"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
          title: 'Profile',
          headerRight: () => null,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
          title: 'Notifications',
          headerRight: () => null,
        }}
      />
    </Tabs>
  );
}

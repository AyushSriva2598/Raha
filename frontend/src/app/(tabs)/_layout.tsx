import React from 'react';
import { Tabs } from 'expo-router';
import { StitchBottomBar } from '@/components/navigation-bar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={() => <StitchBottomBar />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="map" options={{ title: 'Map' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '@/core/navigation/tab-bar';

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="agenda" />
      <Tabs.Screen name="dinheiro" />
      <Tabs.Screen name="notas" />
    </Tabs>
  );
}

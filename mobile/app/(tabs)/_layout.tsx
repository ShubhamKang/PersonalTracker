import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/theme-context';

type IconName = keyof typeof Ionicons.glyphMap;

function tabIcon(focused: IconName, unfocused: IconName) {
  return ({ color, size, focused: isFocused }: { color: string; size: number; focused: boolean }) => (
    <Ionicons name={isFocused ? focused : unfocused} size={size} color={color} />
  );
}

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.faint,
        tabBarStyle: {
          borderTopColor: colors.border,
          backgroundColor: colors.background,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Today', tabBarIcon: tabIcon('home', 'home-outline') }}
      />
      <Tabs.Screen
        name="goals"
        options={{ title: 'Goals', tabBarIcon: tabIcon('flag', 'flag-outline') }}
      />
      <Tabs.Screen
        name="habits"
        options={{ title: 'Habits', tabBarIcon: tabIcon('repeat', 'repeat-outline') }}
      />
      <Tabs.Screen
        name="notes"
        options={{ title: 'Notes', tabBarIcon: tabIcon('document-text', 'document-text-outline') }}
      />
      <Tabs.Screen
        name="growth"
        options={{ title: 'Growth', tabBarIcon: tabIcon('trending-up', 'trending-up-outline') }}
      />
      <Tabs.Screen
        name="review"
        options={{ title: 'Review', tabBarIcon: tabIcon('bar-chart', 'bar-chart-outline') }}
      />
    </Tabs>
  );
}

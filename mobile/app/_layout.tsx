import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../src/context/auth-context';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Show cached data immediately while revalidating in the background.
      staleTime: 30_000,       // 30 s before a query is considered stale
      gcTime: 5 * 60_000,      // keep unused cache 5 min (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: false, // RN has no "window focus"; use pull-to-refresh
    },
  },
});

function AuthGate() {
  const { loading, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return;
    }
    const inAuthGroup = segments[0] === '(auth)';
    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [loading, user, segments, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="auto" />
          <AuthGate />
        </AuthProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

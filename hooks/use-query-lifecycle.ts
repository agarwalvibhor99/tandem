import NetInfo from '@react-native-community/netinfo';
import { focusManager, onlineManager } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

/** Bridge native lifecycle signals; web keeps TanStack's browser listeners. */
export function useQueryLifecycle() {
  useEffect(() => {
    if (Platform.OS === 'web') return;

    focusManager.setFocused(AppState.currentState === 'active');
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      focusManager.setFocused(state === 'active');
    });
    const unsubscribeNetwork = NetInfo.addEventListener((state) => {
      // Unknown reachability should not indefinitely block a request.
      onlineManager.setOnline(state.isConnected !== false && state.isInternetReachable !== false);
    });

    return () => {
      appStateSubscription.remove();
      unsubscribeNetwork();
      focusManager.setFocused(undefined);
      onlineManager.setOnline(true);
    };
  }, []);
}

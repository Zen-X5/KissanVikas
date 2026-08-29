import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAppSelector } from '../../lib/store/store';
import { LoginScreen } from './screens/LoginScreen';
import { PolyhouseTwinScreen } from './screens/PolyhouseTwinScreen';

export default function Index() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {isAuthenticated ? <PolyhouseTwinScreen /> : <LoginScreen />}
    </GestureHandlerRootView>
  );
}

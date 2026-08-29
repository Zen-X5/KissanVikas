import { PolyhouseTwinScreen } from "./screens/PolyhouseTwinScreen";
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function Index() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
        <PolyhouseTwinScreen />
      </GestureHandlerRootView>
  );
}



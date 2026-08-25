import { Stack } from "expo-router";
import StoreProvider from "./StoreProvider";


export default function RootLayout() {
  return (
  <StoreProvider>
    <Stack screenOptions={{ headerShown: false }}/>
  </StoreProvider>
  );
}

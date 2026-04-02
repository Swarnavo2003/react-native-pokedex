import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: "#0F1117",
          },
          headerShadowVisible: false,
          headerTitleStyle: {
            fontWeight: "900",
            fontSize: 18,
            color: "#FFFFFF",
          },
          headerTintColor: "#EF4444",
          contentStyle: {
            backgroundColor: "#0F1117",
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "POKÉDEX",
            headerTitleStyle: {
              fontWeight: "900",
              fontSize: 18,
              color: "#FFFFFF",
            },
            headerRight: () => (
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "#EF4444",
                  marginRight: 4,
                  shadowColor: "#EF4444",
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.9,
                  shadowRadius: 6,
                }}
              />
            ),
          }}
        />

        <Stack.Screen
          name="details"
          options={{
            headerShown: false,
            presentation: "formSheet",
            sheetAllowedDetents: [0.35, 0.6, 0.95],
            sheetGrabberVisible: false,
          }}
        />
      </Stack>
    </>
  );
}

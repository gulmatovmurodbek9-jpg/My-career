import React from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "./src/store/auth";
import { colors } from "./src/theme";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import HomeScreen from "./src/screens/HomeScreen";
import CareersScreen from "./src/screens/CareersScreen";
import CareerDetailScreen from "./src/screens/CareerDetailScreen";
import QuizScreen from "./src/screens/QuizScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import FavoritesScreen from "./src/screens/FavoritesScreen";
import CompareScreen from "./src/screens/CompareScreen";

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.panel,
    text: colors.text,
    border: colors.border,
    primary: colors.secondary,
  },
};

const screenOptions = {
  headerStyle: { backgroundColor: colors.bg },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: "900" },
  contentStyle: { backgroundColor: colors.bg },
};

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.panel,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.secondary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "800" },
      }}
    >
      <Tabs.Screen name="Асосӣ" component={HomeScreen} />
      <Tabs.Screen name="Ихтисосҳо" component={CareersScreen} />
      <Tabs.Screen name="Панел" component={DashboardScreen} />
      <Tabs.Screen name="Захираҳо" component={FavoritesScreen} />
    </Tabs.Navigator>
  );
}

function AppNavigator() {
  const { booting, isAuthenticated } = useAuth();

  if (booting) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.secondary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={screenOptions}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen name="CareerDetail" component={CareerDetailScreen} options={{ title: "Ихтисос" }} />
            <Stack.Screen name="Quiz" component={QuizScreen} options={{ title: "Санҷиш" }} />
            <Stack.Screen name="Compare" component={CompareScreen} options={{ title: "Муқоиса" }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ title: "Воридшавӣ" }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: "Сабти ном" }} />
          </>
        )}
      </Stack.Navigator>
      <StatusBar style="light" />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}

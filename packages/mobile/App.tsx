import { useState, createContext, useContext } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "./src/navigation/types";
import { MapScreen } from "./src/screens/MapScreen";
import { SiteDetailScreen } from "./src/screens/SiteDetailScreen";
import { SurveyScreen } from "./src/screens/SurveyScreen";
import { RewardScreen } from "./src/screens/RewardScreen";
import { AuthScreen } from "./src/screens/AuthScreen";
import { setAuthToken } from "./src/services/api";

// Auth context so any screen can check auth state or trigger login
interface AuthContextType {
  isAuthenticated: boolean;
  user: any | null;
  login: (token: string, user: any) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: () => {},
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);

  function login(token: string, userData: any) {
    setAuthToken(token);
    setUser(userData);
    setIsAuthenticated(true);
  }

  function logout() {
    setAuthToken(null);
    setUser(null);
    setIsAuthenticated(false);
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      <StatusBar style="dark" />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: "#fff" },
            headerTintColor: "#1a1a1a",
            headerTitleStyle: { fontWeight: "700" },
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen
            name="Map"
            component={MapScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SiteDetail"
            component={SiteDetailScreen}
            options={({ route }) => ({ title: route.params.siteName })}
          />
          <Stack.Screen
            name="Survey"
            component={SurveyScreen}
            options={({ route }) => ({
              title: `Survey: ${route.params.siteName}`,
              headerBackVisible: true,
            })}
          />
          <Stack.Screen
            name="Reward"
            component={RewardScreen}
            options={{ headerShown: false, gestureEnabled: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
  );
}

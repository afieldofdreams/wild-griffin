import { useState, useEffect } from "react";
import * as Location from "expo-location";

interface LocationState {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  loading: boolean;
  error: string | null;
}

const DEFAULT_LOCATION = { latitude: 51.4713, longitude: 0.0087 };

export function useLocation() {
  const [state, setState] = useState<LocationState>({
    ...DEFAULT_LOCATION,
    accuracy: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function getLocation() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        if (!cancelled) {
          setState((s) => ({
            ...s,
            loading: false,
            error: "Location permission denied",
          }));
        }
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      if (!cancelled) {
        setState({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          loading: false,
          error: null,
        });
      }
    }

    getLocation();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

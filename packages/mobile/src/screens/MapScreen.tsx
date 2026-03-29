import React, { useEffect, useState } from "react";
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from "react-native";
import MapView, { Callout, Marker, Region } from "react-native-maps";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useLocation } from "../hooks/useLocation";
import { api } from "../services/api";
import { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Map">;

interface Site {
  id: string;
  name: string;
  type: string;
  lat: number;
  lon: number;
  total_surveys: number;
  days_since_survey: number | null;
}

const SITE_COLORS: Record<string, string> = {
  pond: "#2196F3",
  hedgerow: "#4CAF50",
  meadow: "#CDDC39",
  river: "#00BCD4",
  woodland: "#795548",
  verge: "#8BC34A",
};

export function MapScreen({ navigation }: Props) {
  const location = useLocation();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);

  useEffect(() => {
    if (!location.loading) {
      loadSites(location.latitude, location.longitude);
    }
  }, [location.loading, location.latitude, location.longitude]);

  async function loadSites(lat: number, lon: number) {
    try {
      const { sites } = await api.getNearby(lat, lon, 2000);
      setSites(sites);
    } catch (err) {
      console.warn("Failed to load sites:", err);
    } finally {
      setLoading(false);
    }
  }

  async function onRegionChangeComplete(region: Region) {
    await loadSites(region.latitude, region.longitude);
  }

  if (location.loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Finding your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        showsUserLocation
        showsMyLocationButton
        onRegionChangeComplete={onRegionChangeComplete}
        onPress={() => setSelectedSite(null)}
      >
        {sites.map((site) => (
          <Marker
            key={site.id}
            coordinate={{ latitude: site.lat, longitude: site.lon }}
            pinColor={SITE_COLORS[site.type] || "#999"}
            onSelect={() => setSelectedSite(site)}
            onDeselect={() => setSelectedSite(null)}
          >
            <Callout tooltip>
              <View />
            </Callout>
          </Marker>
        ))}
      </MapView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#4CAF50" />
        </View>
      )}

      {selectedSite && (
        <View style={styles.siteCard}>
          <Text style={styles.siteName}>{selectedSite.name}</Text>
          <Text style={styles.siteType}>{selectedSite.type}</Text>
          <Text style={styles.siteStats}>
            {selectedSite.total_surveys} surveys
            {selectedSite.days_since_survey != null &&
              ` · last checked ${selectedSite.days_since_survey}d ago`}
          </Text>
          <TouchableOpacity
            style={styles.surveyButton}
            onPress={() =>
              navigation.navigate("SiteDetail", {
                siteId: selectedSite.id,
                siteName: selectedSite.name,
                siteType: selectedSite.type,
              })
            }
          >
            <Text style={styles.surveyButtonText}>View Site</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 16, color: "#666" },
  loadingOverlay: {
    position: "absolute",
    top: 60,
    alignSelf: "center",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  siteCard: {
    position: "absolute",
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  siteName: { fontSize: 18, fontWeight: "700", color: "#1a1a1a" },
  siteType: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "600",
    textTransform: "capitalize",
    marginTop: 2,
  },
  siteStats: { fontSize: 14, color: "#666", marginTop: 4 },
  surveyButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  surveyButtonText: { color: "white", fontSize: 16, fontWeight: "700" },
});

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { api } from "../services/api";
import { AuthScreen } from "./AuthScreen";
import { useAuth } from "../../App";

type Props = NativeStackScreenProps<RootStackParamList, "SiteDetail">;

interface SiteDetail {
  id: string;
  name: string;
  type: string;
  total_surveys: number;
  unique_surveyors: number;
  quality_score: number;
  last_surveyed_at: string | null;
  created_at: string;
}

interface TimelineEntry {
  id: string;
  photo_url: string | null;
  answers: Record<string, any>;
  tokens_awarded: number;
  submitted_at: string;
  surveyor_name: string;
}

export function SiteDetailScreen({ route, navigation }: Props) {
  const { siteId, siteName, siteType } = route.params;
  const { isAuthenticated, login } = useAuth();
  const [site, setSite] = useState<SiteDetail | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [siteRes, timelineRes] = await Promise.all([
        api.getSite(siteId),
        api.getSiteTimeline(siteId),
      ]);
      setSite(siteRes.site);
      setTimeline(timelineRes.timeline);
    } catch (err) {
      console.warn("Failed to load site:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  const daysSince = site?.last_surveyed_at
    ? Math.floor(
        (Date.now() - new Date(site.last_surveyed_at).getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : null;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.siteType}>{siteType}</Text>
          <Text style={styles.siteName}>{siteName}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{site?.total_surveys ?? 0}</Text>
            <Text style={styles.statLabel}>Surveys</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{site?.unique_surveyors ?? 0}</Text>
            <Text style={styles.statLabel}>Surveyors</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {daysSince != null ? `${daysSince}d` : "Never"}
            </Text>
            <Text style={styles.statLabel}>Last Check</Text>
          </View>
        </View>

        {/* Timeline */}
        <Text style={styles.sectionTitle}>Survey Timeline</Text>
        {timeline.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No surveys yet. Be the first to check this site!
            </Text>
          </View>
        ) : (
          timeline.map((entry) => (
            <View key={entry.id} style={styles.timelineEntry}>
              <View style={styles.timelineHeader}>
                <Text style={styles.timelineSurveyor}>
                  {entry.surveyor_name}
                </Text>
                <Text style={styles.timelineDate}>
                  {new Date(entry.submitted_at).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.timelineTokens}>
                +{entry.tokens_awarded} tokens
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* Survey Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.surveyButton}
          onPress={() => {
            if (isAuthenticated) {
              navigation.navigate("Survey", { siteId, siteName, siteType });
            } else {
              setShowAuth(true);
            }
          }}
        >
          <Text style={styles.surveyButtonText}>Start Survey</Text>
        </TouchableOpacity>
      </View>

      {/* Auth Modal */}
      <Modal visible={showAuth} animationType="slide">
        <AuthScreen
          onAuthenticated={(token, user) => {
            login(token, user);
            setShowAuth(false);
            navigation.navigate("Survey", { siteId, siteName, siteType });
          }}
        />
        <TouchableOpacity
          style={styles.closeAuth}
          onPress={() => setShowAuth(false)}
        >
          <Text style={styles.closeAuthText}>Cancel</Text>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 100 },
  header: { marginBottom: 20 },
  siteType: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4CAF50",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  siteName: { fontSize: 28, fontWeight: "800", color: "#1a1a1a", marginTop: 4 },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  stat: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 22, fontWeight: "700", color: "#1a1a1a" },
  statLabel: { fontSize: 12, color: "#888", marginTop: 2 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 12,
  },
  emptyState: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
  },
  emptyText: { fontSize: 15, color: "#888", textAlign: "center" },
  timelineEntry: {
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  timelineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timelineSurveyor: { fontSize: 15, fontWeight: "600", color: "#333" },
  timelineDate: { fontSize: 13, color: "#888" },
  timelineTokens: { fontSize: 13, color: "#4CAF50", fontWeight: "600", marginTop: 4 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 34,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  surveyButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  surveyButtonText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  closeAuth: {
    position: "absolute",
    top: 60,
    left: 20,
  },
  closeAuthText: { fontSize: 17, color: "#4CAF50", fontWeight: "600" },
});

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Reward">;

export function RewardScreen({ route, navigation }: Props) {
  const { tokensAwarded, multiplier, visitNumber, isFirstSurvey, siteName } =
    route.params;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Token animation placeholder */}
        <View style={styles.tokenCircle}>
          <Text style={styles.tokenAmount}>+{tokensAwarded}</Text>
          <Text style={styles.tokenLabel}>Griffin Tokens</Text>
        </View>

        {isFirstSurvey && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>First Survey Bonus!</Text>
          </View>
        )}

        <Text style={styles.siteName}>{siteName}</Text>
        <Text style={styles.visitText}>Visit #{visitNumber}</Text>

        {multiplier > 1 && (
          <View style={styles.multiplierBadge}>
            <Text style={styles.multiplierText}>{multiplier}x Multiplier</Text>
          </View>
        )}

        {/* Next multiplier hint */}
        {multiplier < 5 && (
          <Text style={styles.hintText}>
            {multiplier < 1.5
              ? `Visit 2 more times to unlock 1.5x multiplier`
              : multiplier < 2
                ? `${5 - visitNumber} more visits to unlock 2x multiplier`
                : multiplier < 3
                  ? `${10 - visitNumber} more visits to unlock 3x multiplier`
                  : `${20 - visitNumber} more visits to unlock 5x multiplier`}
          </Text>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={() => {
            // TODO: Share flow
            console.log("Share survey");
          }}
        >
          <Text style={styles.shareButtonText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => navigation.popToTop()}
        >
          <Text style={styles.doneButtonText}>Back to Map</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  tokenCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#E8F5E9",
    borderWidth: 4,
    borderColor: "#4CAF50",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  tokenAmount: { fontSize: 40, fontWeight: "800", color: "#2E7D32" },
  tokenLabel: { fontSize: 14, color: "#4CAF50", fontWeight: "600", marginTop: 2 },
  badge: {
    backgroundColor: "#FFF3E0",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  badgeText: { fontSize: 14, fontWeight: "700", color: "#E65100" },
  siteName: { fontSize: 22, fontWeight: "700", color: "#1a1a1a", textAlign: "center" },
  visitText: { fontSize: 15, color: "#888", marginTop: 4 },
  multiplierBadge: {
    backgroundColor: "#E8F5E9",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  multiplierText: { fontSize: 15, fontWeight: "700", color: "#2E7D32" },
  hintText: {
    fontSize: 14,
    color: "#888",
    marginTop: 16,
    textAlign: "center",
  },
  footer: {
    padding: 16,
    paddingBottom: 34,
    gap: 10,
  },
  shareButton: {
    backgroundColor: "#E8F5E9",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  shareButtonText: { color: "#2E7D32", fontSize: 16, fontWeight: "700" },
  doneButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  doneButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});

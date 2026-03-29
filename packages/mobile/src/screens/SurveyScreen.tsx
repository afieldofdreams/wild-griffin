import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { api } from "../services/api";
import { useLocation } from "../hooks/useLocation";
import * as Crypto from "expo-crypto";
import { SURVEY_SCHEMAS, SurveyQuestion, SiteType } from "@wild-griffin/shared";

type Props = NativeStackScreenProps<RootStackParamList, "Survey">;

function QuestionCard({
  question,
  value,
  onChange,
}: {
  question: SurveyQuestion;
  value: any;
  onChange: (val: any) => void;
}) {
  const header = (
    <>
      <Text style={styles.questionText}>{question.text}</Text>
      <Text style={styles.guidanceText}>{question.guidance}</Text>
    </>
  );

  if (question.type === "single_choice") {
    return (
      <View style={styles.questionCard}>
        {header}
        <View style={styles.optionsContainer}>
          {question.options!.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[
                styles.optionButton,
                value === opt && styles.optionSelected,
              ]}
              onPress={() => onChange(opt)}
            >
              <Text
                style={[
                  styles.optionText,
                  value === opt && styles.optionTextSelected,
                ]}
              >
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  if (question.type === "multi_choice") {
    const selected: string[] = value || [];
    return (
      <View style={styles.questionCard}>
        {header}
        <View style={styles.optionsContainer}>
          {question.options!.map((opt) => {
            const isSelected = selected.includes(opt);
            return (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.optionButton,
                  isSelected && styles.optionSelected,
                ]}
                onPress={() => {
                  if (isSelected) {
                    onChange(selected.filter((s) => s !== opt));
                  } else {
                    onChange([...selected, opt]);
                  }
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    isSelected && styles.optionTextSelected,
                  ]}
                >
                  {opt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }

  if (question.type === "scale") {
    const min = question.scaleMin!;
    const max = question.scaleMax!;
    const range = Array.from({ length: max - min + 1 }, (_, i) => min + i);
    return (
      <View style={styles.questionCard}>
        {header}
        <View style={styles.scaleColumn}>
          {range.map((n) => (
            <TouchableOpacity
              key={n}
              style={[
                styles.scaleRow,
                value === n && styles.scaleRowSelected,
              ]}
              onPress={() => onChange(n)}
            >
              <View
                style={[
                  styles.scaleCircle,
                  value === n && styles.scaleCircleSelected,
                ]}
              >
                <Text
                  style={[
                    styles.scaleNumber,
                    value === n && styles.scaleNumberSelected,
                  ]}
                >
                  {n}
                </Text>
              </View>
              <Text style={[
                styles.scaleLabel,
                value === n && styles.scaleLabelSelected,
              ]}>
                {n === min
                  ? question.scaleLabels?.min
                  : n === max
                    ? question.scaleLabels?.max
                    : n === Math.round((min + max) / 2)
                      ? "Average"
                      : ""}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  return null;
}

export function SurveyScreen({ route, navigation }: Props) {
  const { siteId, siteName, siteType } = route.params;
  const location = useLocation();
  const schema = SURVEY_SCHEMAS[siteType as SiteType];
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const startTime = useRef(Date.now());

  const question = schema.questions[currentIdx];
  const totalQuestions = schema.questions.length;
  const isLast = currentIdx === totalQuestions - 1;
  const currentAnswer = answers[question.id];

  const canProceed =
    currentAnswer !== undefined &&
    currentAnswer !== null &&
    (Array.isArray(currentAnswer) ? currentAnswer.length > 0 : true);

  function handleNext() {
    if (isLast) {
      handleSubmit();
    } else {
      setCurrentIdx((i) => i + 1);
    }
  }

  function handleBack() {
    if (currentIdx > 0) {
      setCurrentIdx((i) => i - 1);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    const durationSeconds = Math.round((Date.now() - startTime.current) / 1000);

    try {
      const idempotencyKey = Crypto.randomUUID();
      const result = await api.submitSurvey({
        siteId,
        idempotencyKey,
        answers,
        gpsLat: location.latitude,
        gpsLon: location.longitude,
        gpsAccuracyM: location.accuracy ?? 10,
        durationSeconds,
        submittedAt: new Date().toISOString(),
      });

      navigation.replace("Reward", {
        tokensAwarded: result.survey.tokensAwarded,
        multiplier: result.survey.multiplier,
        visitNumber: result.survey.visitNumber,
        isFirstSurvey: result.survey.isFirstSurvey,
        siteName,
      });
    } catch (err: any) {
      Alert.alert("Survey Failed", err.message || "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentIdx + 1) / totalQuestions) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {currentIdx + 1} of {totalQuestions}
        </Text>
      </View>

      {/* Question */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        <QuestionCard
          question={question}
          value={currentAnswer}
          onChange={(val) =>
            setAnswers((prev) => ({ ...prev, [question.id]: val }))
          }
        />
      </ScrollView>

      {/* Navigation */}
      <View style={styles.footer}>
        <View style={styles.navRow}>
          {currentIdx > 0 ? (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View />
          )}

          <TouchableOpacity
            style={[
              styles.nextButton,
              !canProceed && styles.nextButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={!canProceed || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.nextButtonText}>
                {isLast ? "Submit" : "Next"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  progressContainer: { paddingHorizontal: 20, paddingTop: 12 },
  progressTrack: {
    height: 4,
    backgroundColor: "#e0e0e0",
    borderRadius: 2,
  },
  progressFill: {
    height: 4,
    backgroundColor: "#4CAF50",
    borderRadius: 2,
  },
  progressText: {
    fontSize: 13,
    color: "#888",
    marginTop: 6,
    textAlign: "right",
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 120 },
  questionCard: { marginBottom: 20 },
  questionText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  guidanceText: {
    fontSize: 15,
    color: "#666",
    lineHeight: 21,
    marginBottom: 20,
  },
  optionsContainer: { gap: 8 },
  optionButton: {
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  optionSelected: {
    borderColor: "#4CAF50",
    backgroundColor: "#E8F5E9",
  },
  optionText: { fontSize: 16, color: "#333" },
  optionTextSelected: { color: "#2E7D32", fontWeight: "600" },
  scaleColumn: {
    gap: 8,
  },
  scaleRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    padding: 12,
    gap: 12,
  },
  scaleRowSelected: {
    borderColor: "#4CAF50",
    backgroundColor: "#E8F5E9",
  },
  scaleCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
  },
  scaleCircleSelected: {
    borderColor: "#4CAF50",
    backgroundColor: "#4CAF50",
  },
  scaleNumber: { fontSize: 16, fontWeight: "600", color: "#333" },
  scaleNumberSelected: { color: "#fff" },
  scaleLabel: { fontSize: 15, color: "#888", flex: 1 },
  scaleLabelSelected: { color: "#2E7D32", fontWeight: "600" },
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
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: { paddingVertical: 14, paddingHorizontal: 24 },
  backButtonText: { fontSize: 16, color: "#888", fontWeight: "600" },
  nextButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    minWidth: 120,
    alignItems: "center",
  },
  nextButtonDisabled: { backgroundColor: "#ccc" },
  nextButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});

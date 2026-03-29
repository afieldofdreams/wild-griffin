import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { api } from "../services/api";

interface AuthScreenProps {
  onAuthenticated: (token: string, user: any) => void;
}

export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneNumber, setPhoneNumber] = useState("+44");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSendOtp() {
    if (phoneNumber.length < 10) {
      Alert.alert("Invalid number", "Please enter a valid phone number.");
      return;
    }
    setLoading(true);
    try {
      const result = await api.register(phoneNumber);
      setStep("otp");
      // In dev mode, auto-fill the OTP
      if (result.devOtp) {
        setOtp(result.devOtp);
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to send code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (otp.length !== 6) {
      Alert.alert("Invalid code", "Please enter the 6-digit code.");
      return;
    }
    setLoading(true);
    try {
      const result = await api.verify(phoneNumber, otp);
      onAuthenticated(result.token, result.user);
    } catch (err: any) {
      Alert.alert("Verification failed", err.message || "Invalid code.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Wild Griffin</Text>
        <Text style={styles.subtitle}>Nature's Digital Twin</Text>

        {step === "phone" ? (
          <>
            <Text style={styles.label}>Enter your phone number</Text>
            <Text style={styles.hint}>
              We'll send you a verification code to get started.
            </Text>
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="+44 7700 900000"
              keyboardType="phone-pad"
              autoFocus
            />
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSendOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Send Code</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.label}>Enter verification code</Text>
            <Text style={styles.hint}>
              We sent a 6-digit code to {phoneNumber}
            </Text>
            <TextInput
              style={styles.input}
              value={otp}
              onChangeText={setOtp}
              placeholder="123456"
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleVerifyOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Verify</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.backLink}
              onPress={() => {
                setStep("phone");
                setOtp("");
              }}
            >
              <Text style={styles.backLinkText}>Use a different number</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: "800",
    color: "#1a1a1a",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#4CAF50",
    fontWeight: "600",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 48,
  },
  label: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 6,
  },
  hint: {
    fontSize: 14,
    color: "#888",
    marginBottom: 16,
  },
  input: {
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 16,
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonDisabled: { backgroundColor: "#aaa" },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  backLink: { marginTop: 16, alignItems: "center" },
  backLinkText: { color: "#4CAF50", fontSize: 15, fontWeight: "600" },
});

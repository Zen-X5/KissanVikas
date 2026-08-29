import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAppDispatch } from '../../../lib/store/store';
import { setCredentials } from '../../../lib/store/authSlice';
import { useLoginMutation } from '../../../lib/services/polyhouse';

export const LoginScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [loginApi, { isLoading }] = useLoginMutation();

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setErrorMessage(null);

    try {
      const res = await loginApi({ email: email.trim(), password }).unwrap();

      if (!res.success || !res.data) {
        setErrorMessage(res.message || 'Invalid credentials');
        return;
      }

      const { user, accessToken } = res.data;

      // STRICT MOBILE ROLE CHECK: Only Customers are permitted
      if (user.role !== 'customer') {
        setErrorMessage(
          '⛔ Access Restricted: This mobile app is exclusively for Customer Farmers. Please use the Web Admin Portal.'
        );
        return;
      }

      // Store in Redux state
      dispatch(
        setCredentials({
          token: accessToken,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role as 'customer',
          },
        })
      );
    } catch (err: any) {
      const msg = err?.data?.message || err?.error || 'Unable to connect to backend server.';
      setErrorMessage(msg);
    }
  };

  const fillDemoCustomer = () => {
    setEmail('ramesh.farmer@kissanvikas.com');
    setPassword('Customer@1234');
    setErrorMessage(null);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand Header */}
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoIcon}>🌿</Text>
          </View>
          <Text style={styles.brandTitle}>
            Kissan<Text style={styles.brandAccent}>Vikas</Text>
          </Text>
          <Text style={styles.brandTagline}>Farmer Mobile Digital Twin</Text>
          <View style={styles.roleTag}>
            <Text style={styles.roleTagText}>CUSTOMER PORTAL</Text>
          </View>
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign In</Text>
          <Text style={styles.cardSub}>
            Access your polyhouse 2D/3D map & crop health
          </Text>

          {/* Demo Auto-Fill Button */}
          <Pressable
            style={({ pressed }) => [
              styles.demoBtn,
              pressed && styles.demoBtnPressed,
            ]}
            onPress={fillDemoCustomer}
          >
            <Text style={styles.demoBtnText}>👨‍🌾 Fill Demo Customer Account</Text>
          </Pressable>

          {/* Error Alert */}
          {errorMessage && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
            </View>
          )}

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. ramesh.farmer@kissanvikas.com"
              placeholderTextColor="#64748B"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#64748B"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {/* Submit Button */}
          <Pressable
            style={({ pressed }) => [
              styles.loginBtn,
              pressed && styles.loginBtnPressed,
              isLoading && styles.loginBtnDisabled,
            ]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#0F172A" />
            ) : (
              <Text style={styles.loginBtnText}>View My Polyhouse Twin →</Text>
            )}
          </Pressable>
        </View>

        {/* Footer Note */}
        <Text style={styles.footerText}>
          Powered by KissanVikas Spatial Vision & Autonomous Aerial Survey
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070A12',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoIcon: {
    fontSize: 30,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  brandAccent: {
    color: '#10B981',
  },
  brandTagline: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  },
  roleTag: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  roleTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.8,
  },
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: '#1E293B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  cardSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    marginBottom: 18,
  },
  demoBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  demoBtnPressed: {
    opacity: 0.7,
  },
  demoBtnText: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '700',
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#F87171',
    fontSize: 12,
    lineHeight: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0A0F1D',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 14,
  },
  loginBtn: {
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginBtnPressed: {
    opacity: 0.85,
  },
  loginBtnDisabled: {
    opacity: 0.5,
  },
  loginBtnText: {
    color: '#070A12',
    fontSize: 14,
    fontWeight: '800',
  },
  footerText: {
    textAlign: 'center',
    color: '#475569',
    fontSize: 11,
    marginTop: 24,
    paddingHorizontal: 16,
  },
});

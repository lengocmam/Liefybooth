import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingScreen } from '../features/onboarding/screens/OnboardingScreen';
import { useAuthStore } from '../features/auth/hooks/useAuthStore';
import { colors } from '../core/theme/colors';

export default function IndexPage() {
  const router = useRouter();
  const { isInitialized, currentUser, initAuthSession } = useAuthStore();

  useEffect(() => {
    initAuthSession();
  }, [initAuthSession]);

  useEffect(() => {
    if (isInitialized && currentUser) {
      // Người dùng đã đăng nhập và được ghi nhớ -> Tự động chuyển thẳng vào app
      router.replace('/(tabs)/moments');
    }
  }, [isInitialized, currentUser, router]);

  // Đang khôi phục phiên từ AsyncStorage / Supabase
  if (!isInitialized) {
    return (
      <View style={styles.splashContainer}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoEmoji}>🌿</Text>
        </View>
        <Text style={styles.appName}>LeafyBooth</Text>
        <Text style={styles.appSub}>Photobooth & Locket Widget</Text>
        <ActivityIndicator size="small" color={colors.lime} style={styles.spinner} />
      </View>
    );
  }

  // Nếu đã đăng nhập, giữ màn hình chờ nhỏ trong tích tắc để router chuyển trang
  if (currentUser) {
    return (
      <View style={styles.splashContainer}>
        <ActivityIndicator size="small" color={colors.lime} />
      </View>
    );
  }

  // Chưa đăng nhập -> Hiện Onboarding giới thiệu
  return <OnboardingScreen />;
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#0F141C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#1E2530',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(200, 241, 53, 0.4)',
    marginBottom: 16,
  },
  logoEmoji: {
    fontSize: 40,
  },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F9FAFB',
    letterSpacing: -0.5,
  },
  appSub: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    fontWeight: '500',
  },
  spinner: {
    marginTop: 28,
  },
});

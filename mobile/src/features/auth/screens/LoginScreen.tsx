import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '../../../core/theme/colors';
import { theme } from '../../../core/theme/theme';
import { PillButton } from '../../../core/components/PillButton';

export const LoginScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleAppleLogin = () => {
    // Sẽ tích hợp Firebase Apple Auth ở Sprint Auth
    router.replace('/(tabs)/moments');
  };

  const handleEmailLogin = () => {
    // Sẽ mở modal đăng nhập / đăng ký email
    router.replace('/(tabs)/moments');
  };

  const handleGuestBooth = () => {
    // Chế độ khách: Chụp Booth offline không cần tài khoản
    router.push('/(tabs)/booth');
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 24), paddingBottom: Math.max(insets.bottom, 20) }]}>
      {/* Brand Header */}
      <View style={styles.brandSection}>
        <Text style={styles.brandTitle}>Leafy{'\n'}Booth</Text>
        <View style={styles.taglinePill}>
          <Text style={styles.taglineText}>Plant a moment</Text>
        </View>
      </View>

      {/* Hero Illustration: 3 Strips */}
      <View style={styles.illustrationSection}>
        <View style={styles.stripsWrapper}>
          {/* Strip 1: Pink */}
          <View style={[styles.stripCard, { backgroundColor: colors.pink, transform: [{ rotate: '-8deg' }] }]}>
            {[0, 1, 2, 3].map(i => (
              <View key={i} style={styles.frameBox} />
            ))}
          </View>

          {/* Strip 2: White (Center) */}
          <View style={[styles.stripCard, { backgroundColor: colors.white, zIndex: 2 }]}>
            {[0, 1, 2, 3].map(i => (
              <View key={i} style={styles.frameBox} />
            ))}
          </View>

          {/* Strip 3: Sky Blue */}
          <View style={[styles.stripCard, { backgroundColor: colors.sky, transform: [{ rotate: '8deg' }] }]}>
            {[0, 1, 2, 3].map(i => (
              <View key={i} style={styles.frameBox} />
            ))}
          </View>

          {/* Decorative Stars */}
          <View style={styles.starStickerTopRight}>
            <Text style={styles.starText}>★</Text>
          </View>
          <View style={styles.starStickerMidRight}>
            <Text style={styles.smallStarText}>★</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons Section */}
      <View style={styles.actionSection}>
        <PillButton
          title="Tiếp tục với Apple"
          onPress={handleAppleLogin}
          variant="secondary"
          style={styles.authButton}
        />

        <PillButton
          title="Tiếp tục với email"
          onPress={handleEmailLogin}
          variant="white"
          style={styles.authButton}
        />

        {/* Guest Booth Link */}
        <Pressable
          onPress={handleGuestBooth}
          style={({ pressed }) => [
            styles.guestButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={styles.guestText}>Thử Booth, không cần tài khoản</Text>
        </Pressable>

        {/* Terms Disclaimer */}
        <Text style={styles.disclaimerText}>
          Tiếp tục nghĩa là bạn đồng ý với{' '}
          <Text style={styles.linkText}>Điều khoản</Text> và{' '}
          <Text style={styles.linkText}>Chính sách quyền riêng tư</Text>.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lime,
    paddingHorizontal: theme.spacing.xl,
    justifyContent: 'space-between',
  },
  brandSection: {
    alignItems: 'flex-start',
    marginTop: 10,
  },
  brandTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: colors.ink,
    lineHeight: 50,
    letterSpacing: -1,
  },
  taglinePill: {
    backgroundColor: colors.white,
    borderWidth: 2.5,
    borderColor: colors.ink,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 12,
    ...theme.shadows.hardSmall,
  },
  taglineText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink,
  },
  illustrationSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stripsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 240,
    width: '100%',
  },
  stripCard: {
    width: 86,
    height: 210,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: colors.ink,
    padding: 6,
    gap: 6,
    ...theme.shadows.hard,
  },
  frameBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.ink,
  },
  starStickerTopRight: {
    position: 'absolute',
    top: 0,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.pink,
    borderWidth: 2.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '12deg' }],
    ...theme.shadows.hardSmall,
  },
  starText: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.ink,
  },
  starStickerMidRight: {
    position: 'absolute',
    top: 70,
    right: 50,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 2.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-10deg' }],
    ...theme.shadows.hardSmall,
  },
  smallStarText: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.ink,
  },
  actionSection: {
    width: '100%',
    gap: 12,
    alignItems: 'center',
  },
  authButton: {
    width: '100%',
  },
  guestButton: {
    paddingVertical: 10,
  },
  guestText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.ink,
    textDecorationLine: 'underline',
  },
  disclaimerText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.ink,
    textAlign: 'center',
    lineHeight: 18,
    opacity: 0.8,
    marginTop: 4,
    paddingHorizontal: 12,
  },
  linkText: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});

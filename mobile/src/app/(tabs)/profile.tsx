import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../core/theme/colors';
import { theme } from '../../core/theme/theme';
import { TopHeader } from '../../core/components/TopHeader';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 80 }]}>
      <TopHeader title="Cá nhân" />
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>👤 Hồ sơ & Cài đặt</Text>
          <Text style={styles.cardSub}>Bạn bè (12/20), Widget iOS, Báo cáo & Xóa tài khoản</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sky,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: theme.borders.radius.card,
    borderWidth: theme.borders.width,
    borderColor: colors.ink,
    padding: 24,
    ...theme.shadows.hard,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 8,
  },
  cardSub: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
});

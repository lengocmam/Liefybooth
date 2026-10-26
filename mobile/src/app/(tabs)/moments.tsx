import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../core/theme/colors';
import { theme } from '../../core/theme/theme';
import { TopHeader } from '../../core/components/TopHeader';

export default function MomentsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 80 }]}>
      <TopHeader title="Khoảnh khắc" />
      <View style={styles.content}>
        <View style={styles.cameraPlaceholder}>
          <Text style={styles.cameraText}>📷 Camera Plant</Text>
          <Text style={styles.subText}>Chụp và gửi khoảnh khắc trong 3 chạm</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.forestGreen,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraPlaceholder: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: colors.lime,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cameraText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.lime,
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
    textAlign: 'center',
  },
});

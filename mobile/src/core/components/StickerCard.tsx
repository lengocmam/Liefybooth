import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { theme } from '../theme/theme';

interface StickerCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  tiltAngle?: string; // Ví dụ: '-2deg', '3deg'
  backgroundColor?: string;
}

export const StickerCard: React.FC<StickerCardProps> = ({
  children,
  style,
  tiltAngle,
  backgroundColor = colors.white,
}) => {
  return (
    <View
      style={[
        styles.card,
        { backgroundColor },
        tiltAngle ? { transform: [{ rotate: tiltAngle }] } : undefined,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.borders.radius.card,
    borderWidth: theme.borders.width,
    borderColor: colors.ink,
    padding: theme.spacing.lg,
    ...theme.shadows.hard,
  },
});

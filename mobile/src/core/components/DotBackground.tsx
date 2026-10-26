import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';

interface DotBackgroundProps {
  children?: React.ReactNode;
  backgroundColor?: string;
  dotColor?: string;
  style?: ViewStyle;
}

/**
 * Màn hình nền chấm bi (Dot Grid Background) đặc trưng của Sticker Pop
 */
export const DotBackground: React.FC<DotBackgroundProps> = ({
  children,
  backgroundColor = colors.lime,
  dotColor = 'rgba(0, 0, 0, 0.08)',
  style,
}) => {
  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      {/* Lớp hiển thị nội dung */}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

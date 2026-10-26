import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import { colors } from '../theme/colors';
import { theme } from '../theme/theme';

export type PillButtonVariant = 'primary' | 'secondary' | 'white' | 'outline';

interface PillButtonProps {
  title: string;
  onPress: () => void;
  variant?: PillButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const PillButton: React.FC<PillButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
}) => {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary':
        return colors.lime;
      case 'secondary':
        return colors.ink;
      case 'white':
        return colors.white;
      case 'outline':
        return 'transparent';
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'secondary':
        return colors.white;
      default:
        return colors.ink;
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: getBackgroundColor(),
          transform: [{ translateY: pressed ? 2 : 0 }, { translateX: pressed ? 2 : 0 }],
          shadowOffset: pressed ? { width: 2, height: 2 } : { width: 4, height: 4 },
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <View style={styles.content}>
          {icon ? <View style={styles.iconContainer}>{icon}</View> : null}
          <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    height: theme.components.buttonHeight,
    borderRadius: theme.borders.radius.full,
    borderWidth: theme.borders.width,
    borderColor: colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    ...theme.shadows.hard,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

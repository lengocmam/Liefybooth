import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { theme } from '../theme/theme';

interface TopHeaderProps {
  title?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightActionLabel?: string;
  onRightActionPress?: () => void;
  brandTitle?: string;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  title,
  showBack = false,
  onBackPress,
  rightActionLabel,
  onRightActionPress,
  brandTitle,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
      <View style={styles.leftContainer}>
        {showBack ? (
          <Pressable
            onPress={onBackPress}
            style={({ pressed }) => [
              styles.backButton,
              { transform: [{ scale: pressed ? 0.95 : 1 }] },
            ]}
          >
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
        ) : brandTitle ? (
          <Text style={styles.brandTitle}>{brandTitle}</Text>
        ) : null}

        {title && !brandTitle ? (
          <Text style={styles.title}>{title}</Text>
        ) : null}
      </View>

      {rightActionLabel && onRightActionPress ? (
        <Pressable
          onPress={onRightActionPress}
          style={({ pressed }) => [
            styles.rightButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={styles.rightActionText}>{rightActionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.ink,
    marginLeft: theme.spacing.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: theme.borders.width,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.hardSmall,
  },
  backIcon: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.ink,
  },
  rightButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  rightActionText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
  },
});

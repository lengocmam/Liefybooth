import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../../core/theme/colors';

interface PaginationDotsProps {
  total: number;
  current: number; // 0-indexed
}

export const PaginationDots: React.FC<PaginationDotsProps> = ({ total, current }) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: total }).map((_, index) => {
        const isActive = index === current;
        return (
          <View
            key={index}
            style={[
              styles.dot,
              isActive ? styles.activePill : styles.inactiveDot,
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 12,
    borderWidth: 2,
    borderColor: colors.ink,
  },
  activePill: {
    width: 32,
    borderRadius: 6,
    backgroundColor: colors.ink,
  },
  inactiveDot: {
    width: 12,
    borderRadius: 6,
    backgroundColor: colors.white,
  },
});

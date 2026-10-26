import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMomentsStore } from '../../features/moments/hooks/useMomentsStore';
import { PlantView } from '../../features/moments/components/PlantView';
import { PickView } from '../../features/moments/components/PickView';

export default function MomentsScreen() {
  const insets = useSafeAreaInsets();
  const { viewMode } = useMomentsStore();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 14),
          paddingBottom: insets.bottom + 76, // Khoảng trống cho floating tab bar
        },
      ]}
    >
      {viewMode === 'plant' ? <PlantView /> : <PickView />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../core/theme/colors';
import { theme } from '../../core/theme/theme';
import { useMomentsStore } from '../../features/moments/hooks/useMomentsStore';
import { PlantView } from '../../features/moments/components/PlantView';
import { PickView } from '../../features/moments/components/PickView';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function MomentsScreen() {
  const insets = useSafeAreaInsets();
  // Dùng selector để chỉ re-render khi viewMode đổi (tránh re-render theo toàn bộ store)
  const viewMode = useMomentsStore((s) => s.viewMode);
  const setViewMode = useMomentsStore((s) => s.setViewMode);

  // sheetY: 0 = mở toàn phần (Locket Feed), SCREEN_HEIGHT = thu gọn (Camera PlantView)
  const sheetY = useRef(new Animated.Value(viewMode === 'pick' ? 0 : SCREEN_HEIGHT)).current;
  const isSheetOpenRef = useRef(viewMode === 'pick');

  // Chỉ chạy animation, KHÔNG đụng tới store trong callback kết thúc animation
  // (callback của animation bị dừng giữa chừng từng gây vòng lặp setState vô hạn)
  const animateSheet = useCallback(
    (open: boolean) => {
      isSheetOpenRef.current = open;
      sheetY.stopAnimation();
      Animated.spring(sheetY, {
        toValue: open ? 0 : SCREEN_HEIGHT,
        friction: 8,
        tension: 65,
        useNativeDriver: true,
      }).start();
    },
    [sheetY]
  );

  const openFeed = useCallback(() => {
    animateSheet(true);
    if (useMomentsStore.getState().viewMode !== 'pick') setViewMode('pick');
  }, [animateSheet, setViewMode]);

  const closeFeed = useCallback(() => {
    animateSheet(false);
    if (useMomentsStore.getState().viewMode !== 'plant') setViewMode('plant');
  }, [animateSheet, setViewMode]);

  // Đồng bộ khi viewMode trong store thay đổi từ nơi khác (Studio, Result, Profile...)
  useEffect(() => {
    const shouldOpen = viewMode === 'pick';
    if (shouldOpen !== isSheetOpenRef.current) {
      animateSheet(shouldOpen);
    }
  }, [viewMode, animateSheet]);

  // Cử chỉ kéo lên (Pull UP) từ thanh điều khiển đáy hoặc từ màn hình camera
  const pullUpPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 4;
      },
      onPanResponderMove: (_, gestureState) => {
        // dy âm khi kéo lên -> sheetY di chuyển từ SCREEN_HEIGHT dần về 0
        const currentTarget = Math.max(0, Math.min(SCREEN_HEIGHT, SCREEN_HEIGHT + gestureState.dy));
        sheetY.setValue(currentTarget);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -50 || gestureState.vy < -0.4) {
          openFeed();
        } else {
          closeFeed();
        }
      },
    })
  ).current;

  // Cử chỉ kéo xuống (Pull DOWN) từ thanh tay nắm trên đầu feed PickView
  const pullDownPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 4 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderMove: (_, gestureState) => {
        // dy dương khi kéo xuống -> sheetY tăng dần từ 0 xuống dưới
        const currentTarget = Math.max(0, gestureState.dy);
        sheetY.setValue(currentTarget);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 70 || gestureState.vy > 0.4) {
          closeFeed();
        } else {
          openFeed();
        }
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      {/* 1. LỚP ĐÁY LIÊN TỤC: CAMERA CHỤP GỬI (PLANTVIEW) KHÔNG BỊ UNMOUNT */}
      <View
        style={[
          styles.baseLayer,
          {
            paddingTop: Math.max(insets.top, 14),
            paddingBottom: insets.bottom + 76, // Khoảng trống cho floating tab bar
          },
        ]}
      >
        <PlantView
          onOpenFeed={openFeed}
          pullUpPanResponder={pullUpPanResponder}
        />
      </View>

      {/* 2. LỚP TRƯỢT KÉO LÊN CHUẨN LOCKET: HỘP ẢNH FEED (PICKVIEW) */}
      <Animated.View
        style={[
          styles.feedSheet,
          {
            transform: [{ translateY: sheetY }],
            paddingTop: Math.max(insets.top, 8),
            paddingBottom: insets.bottom + 12,
          },
        ]}
      >
        <PickView
          onCloseFeed={closeFeed}
          pullDownPanResponder={pullDownPanResponder}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111317',
    position: 'relative',
    overflow: 'hidden',
  },
  baseLayer: {
    flex: 1,
  },
  feedSheet: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F8F9FA',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 2.5,
    borderColor: colors.ink,
    zIndex: 999,
    ...theme.shadows.hard,
  },
});

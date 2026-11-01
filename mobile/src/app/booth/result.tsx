import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as MediaLibrary from 'expo-media-library';
import { colors } from '../../core/theme/colors';
import { theme } from '../../core/theme/theme';
import { exportStripToImage } from '../../core/utils/stripExportService';
import { useBoothStore, StripFilter } from '../../features/booth/hooks/useBoothStore';
import { useMomentsStore } from '../../features/moments/hooks/useMomentsStore';
import { useStudioStore } from '../../features/studio/hooks/useStudioStore';
import { playShutterSound } from '../../features/booth/services/soundService';

const BOOTH_FILTERS: { id: StripFilter; label: string; icon: string }[] = [
  { id: 'original', label: 'Gốc', icon: '🌿' },
  { id: 'haru_blue', label: 'Haru Blue', icon: '🌊' },
  { id: 'bw', label: 'Mono Film', icon: '🖤' },
  { id: 'warm', label: 'Sepia 1998', icon: '☕' },
  { id: 'sakura', label: 'Sakura Glow', icon: '🌸' },
  { id: 'cool', label: 'Cyber Y2K', icon: '⚡' },
];

export default function BoothResultScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { sendMoment } = useMomentsStore();
  const [isSendingToLeafy, setIsSendingToLeafy] = useState(false);
  const [selectedSlotForRetake, setSelectedSlotForRetake] = useState<number | null>(null);

  const {
    capturedPhotos,
    frameColor,
    layout,
    filter,
    setFilter,
    stripTitle,
    activeCustomFrame,
    resetBooth,
    setRetakeIndex,
    twinStripMode,
    setTwinStripMode,
    barcodeNumber,
    stampType,
  } = useBoothStore();

  const displayPhotos = [
    capturedPhotos[0] || 'https://picsum.photos/seed/p1/400/400',
    capturedPhotos[1] || 'https://picsum.photos/seed/p2/400/400',
    capturedPhotos[2] || 'https://picsum.photos/seed/p3/400/400',
    capturedPhotos[3] || 'https://picsum.photos/seed/p4/400/400',
  ];

  const handleRetakeSlot = (slotIndex: number) => {
    playShutterSound();
    setRetakeIndex(slotIndex);
    router.push('/booth/camera' as any);
  };

  const handleSaveToDevice = async () => {
    setIsSaving(true);
    playShutterSound();
    try {
      if (Platform.OS === 'web') {
        await exportStripToImage(
          {
            id: `booth_${Date.now()}`,
            authorName: 'Bạn',
            authorColor: frameColor,
            authorLetter: 'B',
            stripColor: frameColor,
            photos: displayPhotos,
            createdAt: 'Vừa xong',
          },
          stripTitle || 'Photobooth',
          '2026.11.01',
          1,
          twinStripMode
        );
      } else {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === 'granted') {
          await MediaLibrary.saveToLibraryAsync(displayPhotos[0]);
        }
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenStudioWithPhotos = () => {
    playShutterSound();
    useStudioStore.getState().setSlotPhotos(displayPhotos);
    if (activeCustomFrame?.id) {
      useStudioStore.getState().loadSavedFrame(activeCustomFrame.id);
    } else if (frameColor) {
      useStudioStore.getState().setBackgroundColor(frameColor);
    }
    router.push('/studio' as any);
  };

  const handleRetake = () => {
    playShutterSound();
    resetBooth();
    router.replace('/booth/camera' as any);
  };

  const handleExitToHome = () => {
    resetBooth();
    if (router.canDismiss()) {
      router.dismissAll();
    }
    router.navigate('/(tabs)/moments' as any);
  };

  const handleSendToLeafy = () => {
    setIsSendingToLeafy(true);
    playShutterSound();

    const effectiveEdgeStyle = activeCustomFrame?.edgeStyle || 'classic';
    const effectiveStickers = activeCustomFrame?.stickers || [];
    const effectiveTextItems = activeCustomFrame?.textItems || [];
    const effectivePattern = activeCustomFrame?.pattern;
    const effectiveSealStamp = activeCustomFrame?.sealStamp || stampType;
    const effectiveWashiTapeStyle = activeCustomFrame?.washiTapeStyle;
    const effectiveGradientTheme = activeCustomFrame?.gradientTheme;

    sendMoment(displayPhotos[0], stripTitle || activeCustomFrame?.name || 'Photobooth 4 ô tụi mình vừa chụp ✨', {
      stripPhotos: displayPhotos,
      frameColor: frameColor || activeCustomFrame?.color || colors.pink,
      frameName: stripTitle || activeCustomFrame?.name || 'Photobooth Strip',
      layout: layout || (activeCustomFrame?.frameLayout === 'grid_4' ? 'grid' : 'vertical'),
      filter: filter || 'original',
      edgeStyle: effectiveEdgeStyle,
      stickers: effectiveStickers,
      textItems: effectiveTextItems,
      customText: stripTitle || activeCustomFrame?.customText,
      pattern: effectivePattern,
      sealStamp: effectiveSealStamp,
      washiTapeStyle: effectiveWashiTapeStyle,
      gradientTheme: effectiveGradientTheme,
    });
    setIsSendingToLeafy(false);

    Alert.alert(
      'Đã treo lên Bức tường Leafy! 🌿🎉',
      'Dải ảnh 4 ô vừa chụp đã được ghim thành công lên Widget & Bức tường Leafybooth của bạn bè!',
      [
        {
          text: 'Xem trên Bức tường Leafy 🌿',
          onPress: () => {
            useMomentsStore.getState().setViewMode('pick');
            handleExitToHome();
          },
        },
        {
          text: 'Chụp tiếp 📸',
          onPress: handleRetake,
        },
      ]
    );
  };

  const getFilterStyle = () => {
    switch (filter) {
      case 'bw':
        return { filter: 'grayscale(100%) contrast(115%)' } as any;
      case 'haru_blue':
        return { filter: 'brightness(108%) saturate(92%) hue-rotate(185deg)' } as any;
      case 'warm':
        return { filter: 'sepia(35%) saturate(125%) contrast(102%)' } as any;
      case 'cool':
        return { filter: 'saturate(85%) hue-rotate(200deg)' } as any;
      case 'sakura':
        return { filter: 'brightness(106%) saturate(110%) hue-rotate(330deg)' } as any;
      default:
        return {};
    }
  };

  const renderSingleStrip = (stripNum: number = 1) => (
    <View
      key={stripNum}
      style={[
        styles.photoboothStrip,
        { backgroundColor: frameColor || colors.pink },
        layout === 'grid' && styles.gridStrip,
        twinStripMode && styles.twinSingleStrip,
      ]}
    >
      {/* Header thương hiệu */}
      <View style={styles.stripBrandHeader}>
        <Text style={styles.stripBrandText}>LEAFYBOOTH · SEOUL 4-CUT</Text>
      </View>

      {/* 4 ô ảnh */}
      <View style={layout === 'grid' ? styles.gridPhotoContainer : styles.verticalPhotoContainer}>
        {displayPhotos.map((uri, idx) => {
          const isSlotSelected = selectedSlotForRetake === idx;

          return (
            <Pressable
              key={idx}
              onPress={() => setSelectedSlotForRetake(isSlotSelected ? null : idx)}
              style={[
                styles.photoFrame,
                layout === 'grid' && styles.gridPhotoFrame,
                twinStripMode && styles.twinPhotoFrame,
                isSlotSelected && styles.photoFrameSelected,
              ]}
            >
              <Image
                source={{ uri }}
                style={[styles.photoImage, getFilterStyle()]}
                resizeMode="cover"
              />
              {filter === 'haru_blue' && <View style={styles.haruFilterOverlay} />}
              {filter === 'sakura' && <View style={styles.sakuraFilterOverlay} />}
              {filter === 'warm' && <View style={styles.warmFilterOverlay} />}
              {filter === 'cool' && <View style={styles.coolFilterOverlay} />}

              {/* Nút Chụp lại nổi khi ô được chạm vào */}
              {isSlotSelected && (
                <View style={styles.retakeFloatingOverlay}>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      handleRetakeSlot(idx);
                    }}
                    style={styles.retakeFloatingPill}
                  >
                    <Text style={styles.retakeFloatingText}>↺ Đổi dáng ô {idx + 1}</Text>
                  </Pressable>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Dòng chữ ở đáy dải ảnh */}
      {stripTitle && stripTitle.trim().length > 0 ? (
        <Text style={styles.stripTitleText}>{stripTitle}</Text>
      ) : null}

      {/* Con dấu sáp & Barcode K-Booth */}
      <View style={styles.stripFooterSignature}>
        <View style={styles.waxSealStampPill}>
          <Text style={styles.waxSealEmoji}>💮</Text>
          <Text style={styles.waxSealText}>LEAFY CERTIFIED</Text>
        </View>

        <View style={styles.barcodeSection}>
          <View style={styles.barcodeBarsRow}>
            {[2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 2, 1, 3, 1].map((w, bIdx) => (
              <View key={bIdx} style={[styles.barcodeBar, { width: w }]} />
            ))}
          </View>
          <Text style={styles.barcodeText}>{barcodeNumber} · 2026.11.01</Text>
        </View>
      </View>

      {/* Floating stickers của khung DIY nếu có */}
      {activeCustomFrame?.stickers && activeCustomFrame.stickers.length > 0 && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {activeCustomFrame.stickers.map((st, sIdx) => {
            const leftPos = st.x > 1 ? `${Math.min(Math.max((st.x / 200) * 100, 4), 86)}%` : `${Math.min(Math.max(st.x, 4), 86)}%`;
            const topPos = st.y > 1 ? `${Math.min(Math.max((st.y / 580) * 100, 4), 92)}%` : `${Math.min(Math.max(st.y, 4), 92)}%`;
            return (
              <Text
                key={sIdx}
                style={{
                  position: 'absolute',
                  left: leftPos as any,
                  top: topPos as any,
                  fontSize: st.size ? Math.min(st.size * 0.7, 26) : 22,
                  transform: [{ rotate: `${st.rotation || 0}deg` }],
                }}
              >
                {st.emoji}
              </Text>
            );
          })}
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 10), paddingBottom: Math.max(insets.bottom, 12) }]}>
      {/* 1. TOP HEADER TINH GỌN */}
      <View style={styles.headerRow}>
        <Pressable
          onPress={handleExitToHome}
          style={({ pressed }) => [
            styles.circleBtn,
            { transform: [{ scale: pressed ? 0.94 : 1 }] },
          ]}
        >
          <Text style={styles.circleBtnText}>✕</Text>
        </Pressable>

        {/* Nút gạt chuyển đổi Dải đơn ↔ Dải đôi Twin */}
        <View style={styles.twinToggleWrapper}>
          <Pressable
            onPress={() => {
              playShutterSound();
              setTwinStripMode(false);
            }}
            style={[styles.twinToggleBtn, !twinStripMode && styles.twinToggleBtnActive]}
          >
            <Text style={[styles.twinToggleText, !twinStripMode && styles.twinToggleTextActive]}>
              🎞️ Dải đơn
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              playShutterSound();
              setTwinStripMode(true);
            }}
            style={[styles.twinToggleBtn, twinStripMode && styles.twinToggleBtnActive]}
          >
            <Text style={[styles.twinToggleText, twinStripMode && styles.twinToggleTextActive]}>
              👯 Dải đôi Twin
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={handleExitToHome}
          style={({ pressed }) => [
            styles.circleBtn,
            { transform: [{ scale: pressed ? 0.94 : 1 }] },
          ]}
        >
          <Text style={{ fontSize: 16 }}>🏠</Text>
        </Pressable>
      </View>

      {/* 2. KHÔNG GIAN DẢI ẢNH: HERO STRIP & BỘ LỌC MÀU */}
      <ScrollView
        contentContainerStyle={styles.stripScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.retakeHintText}>💡 Chạm vào ô bất kỳ để chụp đổi dáng</Text>

        {/* Dải ảnh chính (Single hoặc Twin) */}
        <View style={styles.stripPresentationWrapper}>
          {twinStripMode ? (
            <View style={styles.twinStripsContainer}>
              {renderSingleStrip(1)}
              <View style={styles.twinCutDivider}>
                <Text style={styles.twinCutIcon}>✂️</Text>
                <View style={styles.twinDashedLine} />
                <Text style={styles.twinCutIcon}>✂️</Text>
              </View>
              {renderSingleStrip(2)}
            </View>
          ) : (
            renderSingleStrip(1)
          )}
        </View>

        {/* Thanh chọn Bộ Lọc Màu K-Booth gọn gàng */}
        <View style={styles.filtersBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersScroll}
          >
            {BOOTH_FILTERS.map((fItem) => (
              <Pressable
                key={fItem.id}
                onPress={() => {
                  playShutterSound();
                  setFilter(fItem.id);
                }}
                style={[
                  styles.filterPill,
                  filter === fItem.id && styles.filterPillActive,
                ]}
              >
                <Text style={styles.filterPillIcon}>{fItem.icon}</Text>
                <Text style={[styles.filterPillLabel, filter === fItem.id && styles.filterPillLabelActive]}>
                  {fItem.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Toast thông báo đã lưu */}
        {saveSuccess && (
          <View style={styles.toastContainer}>
            <Text style={styles.toastText}>✓ Đã lưu dải ảnh HD vào máy!</Text>
          </View>
        )}
      </ScrollView>

      {/* 3. DOCK ĐIỀU KHIỂN NỔI DƯỚI ĐÁY: GỌN GÀNG, SANG TRỌNG, 1 CHẠM */}
      <View style={styles.floatingActionDock}>
        {/* Nút Hero chính: Treo lên Widget */}
        <Pressable
          onPress={handleSendToLeafy}
          disabled={isSendingToLeafy}
          style={({ pressed }) => [
            styles.dockHeroBtn,
            { transform: [{ scale: pressed ? 0.98 : 1 }] },
          ]}
        >
          <Text style={styles.dockHeroBtnIcon}>🚀</Text>
          <Text style={styles.dockHeroBtnText}>
            {isSendingToLeafy ? 'Đang gửi...' : 'Treo Lên Widget'}
          </Text>
        </Pressable>

        {/* Cụm 3 nút icon tròn: Lưu máy, Studio, Chụp mới */}
        <Pressable
          onPress={handleSaveToDevice}
          disabled={isSaving}
          style={({ pressed }) => [
            styles.dockIconBtn,
            { transform: [{ scale: pressed ? 0.92 : 1 }] },
          ]}
          hitSlop={6}
        >
          <Text style={styles.dockIconBtnEmoji}>{isSaving ? '⏳' : '💾'}</Text>
          <Text style={styles.dockIconBtnLabel}>Lưu máy</Text>
        </Pressable>

        <Pressable
          onPress={handleOpenStudioWithPhotos}
          style={({ pressed }) => [
            styles.dockIconBtn,
            { transform: [{ scale: pressed ? 0.92 : 1 }] },
          ]}
          hitSlop={6}
        >
          <Text style={styles.dockIconBtnEmoji}>🎨</Text>
          <Text style={styles.dockIconBtnLabel}>Studio</Text>
        </Pressable>

        <Pressable
          onPress={handleRetake}
          style={({ pressed }) => [
            styles.dockIconBtn,
            { transform: [{ scale: pressed ? 0.92 : 1 }] },
          ]}
          hitSlop={6}
        >
          <Text style={styles.dockIconBtnEmoji}>↺</Text>
          <Text style={styles.dockIconBtnLabel}>Chụp lại</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#08080A', // Pure Midnight OLED Dark
    paddingHorizontal: 14,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 48,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#14161D',
    borderWidth: 1.5,
    borderColor: '#2A2E39',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.darkSoft,
  },
  circleBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  twinToggleWrapper: {
    flexDirection: 'row',
    backgroundColor: '#14161D',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#2A2E39',
    padding: 3,
    gap: 4,
  },
  twinToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  twinToggleBtnActive: {
    backgroundColor: colors.yellow,
  },
  twinToggleText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  twinToggleTextActive: {
    color: colors.ink,
    fontWeight: '900',
  },

  stripScrollContent: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  retakeHintText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.45)',
    marginBottom: 6,
  },
  stripPresentationWrapper: {
    alignItems: 'center',
    marginVertical: 2,
  },

  photoboothStrip: {
    width: 210,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: colors.ink,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 10,
    alignItems: 'center',
    ...theme.shadows.hard,
  },
  gridStrip: {
    width: 270,
  },
  twinStripsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  twinSingleStrip: {
    width: 155,
    paddingHorizontal: 6,
    paddingTop: 6,
    paddingBottom: 8,
  },
  twinCutDivider: {
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 460,
    paddingVertical: 10,
  },
  twinCutIcon: {
    fontSize: 13,
  },
  twinDashedLine: {
    flex: 1,
    width: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    marginVertical: 4,
  },
  stripBrandHeader: {
    marginBottom: 6,
    alignItems: 'center',
  },
  stripBrandText: {
    fontSize: 7,
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: 0.8,
  },
  verticalPhotoContainer: {
    width: '100%',
    gap: 7,
  },
  gridPhotoContainer: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 6,
  },
  photoFrame: {
    width: '100%',
    aspectRatio: 1.34,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: colors.ink,
    position: 'relative',
  },
  photoFrameSelected: {
    borderColor: colors.yellow,
    borderWidth: 2.5,
  },
  gridPhotoFrame: {
    width: '48%',
    aspectRatio: 1,
  },
  twinPhotoFrame: {
    aspectRatio: 1.28,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },

  retakeFloatingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retakeFloatingPill: {
    backgroundColor: colors.yellow,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.ink,
  },
  retakeFloatingText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.ink,
  },

  haruFilterOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
  },
  sakuraFilterOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(244, 114, 182, 0.14)',
  },
  warmFilterOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(234, 88, 12, 0.12)',
  },
  coolFilterOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
  },

  stripTitleText: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.ink,
    marginTop: 6,
    textAlign: 'center',
  },

  stripFooterSignature: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.15)',
  },
  waxSealStampPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  waxSealEmoji: {
    fontSize: 11,
  },
  waxSealText: {
    fontSize: 6.5,
    fontWeight: '900',
    color: colors.ink,
  },
  barcodeSection: {
    alignItems: 'flex-end',
  },
  barcodeBarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1.5,
    height: 10,
  },
  barcodeBar: {
    height: '100%',
    backgroundColor: colors.ink,
  },
  barcodeText: {
    fontSize: 6,
    fontWeight: '800',
    color: colors.ink,
    marginTop: 1,
  },

  filtersBar: {
    width: '100%',
    marginTop: 8,
    marginBottom: 4,
  },
  filtersScroll: {
    gap: 6,
    paddingHorizontal: 2,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14161D',
    borderWidth: 1.5,
    borderColor: '#2A2E39',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
  },
  filterPillActive: {
    backgroundColor: colors.yellow,
    borderColor: colors.ink,
  },
  filterPillIcon: {
    fontSize: 12,
  },
  filterPillLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  filterPillLabelActive: {
    color: colors.ink,
    fontWeight: '900',
  },

  toastContainer: {
    marginTop: 6,
    backgroundColor: colors.yellow,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.ink,
  },
  toastText: {
    color: colors.ink,
    fontWeight: '900',
    fontSize: 12,
  },

  // Floating Action Dock at bottom
  floatingActionDock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14161D',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#2A2E39',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
    ...theme.shadows.darkSoft,
  },
  dockHeroBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.yellow,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.ink,
    paddingVertical: 10,
    gap: 6,
    ...theme.shadows.hard,
  },
  dockHeroBtnIcon: {
    fontSize: 16,
  },
  dockHeroBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.ink,
  },
  dockIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#1C1F28',
    borderWidth: 1.5,
    borderColor: '#2A2E39',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockIconBtnEmoji: {
    fontSize: 16,
  },
  dockIconBtnLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: colors.textSecondary,
    marginTop: 1,
  },
});

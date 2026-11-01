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
import { PillButton } from '../../core/components/PillButton';
import { exportStripToImage } from '../../core/utils/stripExportService';
import { useBoothStore, StripFilter } from '../../features/booth/hooks/useBoothStore';
import { useMomentsStore } from '../../features/moments/hooks/useMomentsStore';
import { useStudioStore } from '../../features/studio/hooks/useStudioStore';
import { playShutterSound } from '../../features/booth/services/soundService';

const BOOTH_FILTERS: { id: StripFilter; label: string; icon: string }[] = [
  { id: 'original', label: 'Màu gốc', icon: '🌿' },
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
    setStampType,
  } = useBoothStore();

  // Đảm bảo luôn có 4 ảnh (nếu thiếu dùng placeholder)
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
    try {
      if (Platform.OS === 'web') {
        // Xuất và tải dải ảnh PNG thật về máy (hỗ trợ cả dải đơn và dải đôi twin strips)
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
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenStudioWithPhotos = () => {
    useStudioStore.getState().setSlotPhotos(displayPhotos);
    if (activeCustomFrame?.id) {
      useStudioStore.getState().loadSavedFrame(activeCustomFrame.id);
    } else if (frameColor) {
      useStudioStore.getState().setBackgroundColor(frameColor);
    }
    router.push('/studio' as any);
  };

  const handleRetake = () => {
    resetBooth();
    router.replace('/booth/camera' as any);
  };

  const handleCustomize = () => {
    router.push('/booth/customize' as any);
  };

  const handleExitToHome = () => {
    resetBooth();
    if (router.canDismiss()) {
      router.dismissAll();
    }
    router.navigate('/(tabs)/moments' as any);
  };

  const handleExitToBooth = () => {
    resetBooth();
    if (router.canDismiss()) {
      router.dismissAll();
    }
    router.navigate('/(tabs)/booth' as any);
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
        activeCustomFrame?.edgeStyle === 'film_perforated' && styles.filmPerforatedBorder,
      ]}
    >
      {/* Header thương hiệu */}
      <View style={styles.stripBrandHeader}>
        <Text style={styles.stripBrandText}>LEAFYBOOTH · SEOUL PHOTO</Text>
      </View>

      {/* 4 ô ảnh */}
      <View style={layout === 'grid' ? styles.gridPhotoContainer : styles.verticalPhotoContainer}>
        {displayPhotos.map((uri, idx) => (
          <View
            key={idx}
            style={[
              styles.photoFrame,
              layout === 'grid' && styles.gridPhotoFrame,
              twinStripMode && styles.twinPhotoFrame,
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

            {/* Nút Chụp Lại Ngay Trên Ô Ảnh */}
            <Pressable
              onPress={() => handleRetakeSlot(idx)}
              style={({ pressed }) => [
                styles.slotRetakeFloatingBtn,
                { transform: [{ scale: pressed ? 0.92 : 1 }] },
              ]}
              hitSlop={6}
            >
              <Text style={styles.slotRetakeFloatingIcon}>↺</Text>
              <Text style={styles.slotRetakeFloatingLabel}>{idx + 1}</Text>
            </Pressable>
          </View>
        ))}
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
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 14), paddingBottom: Math.max(insets.bottom, 18) }]}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        <Pressable
          onPress={handleExitToHome}
          style={({ pressed }) => [
            styles.closeButton,
            { transform: [{ scale: pressed ? 0.95 : 1 }] },
          ]}
        >
          <Text style={styles.closeIcon}>✕</Text>
        </Pressable>

        {/* Nút gạt chuyển đổi Dải đơn ↔ Dải đôi Twin Strips */}
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
            styles.homeHeaderPill,
            { transform: [{ scale: pressed ? 0.95 : 1 }] },
          ]}
        >
          <Text style={styles.homeHeaderIcon}>🏠</Text>
        </Pressable>
      </View>

      {/* Main Strip Presentation */}
      <ScrollView
        contentContainerStyle={styles.stripContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Thanh Chụp Lại Từng Ô (Smart Retake Tool) */}
        <View style={styles.retakeSlotSection}>
          <Text style={styles.retakeSlotSectionTitle}>↺ Đổi dáng từng ô:</Text>
          <View style={styles.retakeSlotChipsRow}>
            {[0, 1, 2, 3].map((slotIdx) => (
              <Pressable
                key={slotIdx}
                onPress={() => handleRetakeSlot(slotIdx)}
                style={({ pressed }) => [
                  styles.retakeSlotChip,
                  { transform: [{ scale: pressed ? 0.94 : 1 }] },
                ]}
              >
                <Text style={styles.retakeSlotChipText}>Ô {slotIdx + 1} ↺</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Khung Dải Ảnh K-Booth (Hỗ trợ Dải đơn & Dải đôi Twin Strips) */}
        <View style={styles.stripWrapper}>
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

        {/* Thanh chọn Bộ Lọc Màu K-Booth */}
        <View style={styles.filtersSection}>
          <Text style={styles.filtersSectionTitle}>🎨 Bộ Lọc Màu K-Booth:</Text>
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
                  styles.filterChip,
                  filter === fItem.id && styles.filterChipActive,
                ]}
              >
                <Text style={styles.filterChipIcon}>{fItem.icon}</Text>
                <Text style={[styles.filterChipLabel, filter === fItem.id && styles.filterChipLabelActive]}>
                  {fItem.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Thông báo đã lưu */}
        {saveSuccess && (
          <View style={styles.toastContainer}>
            <Text style={styles.toastText}>✓ Đã lưu dải ảnh HD vào máy!</Text>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        {/* Nút 1: TREO LÊN BỨC TƯỜNG LEAFY (Widget & Locket) */}
        <Pressable
          onPress={handleSendToLeafy}
          disabled={isSendingToLeafy}
          style={({ pressed }) => [
            styles.leafyInstantCtaButton,
            { transform: [{ scale: pressed ? 0.98 : 1 }] },
          ]}
        >
          <View style={styles.leafyInstantCtaIconBox}>
            <Text style={{ fontSize: 22 }}>🌿</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.leafyInstantCtaTitle}>
              {isSendingToLeafy ? 'Đang ghim ảnh...' : 'Treo Lên Bức Tường Leafy 🚀'}
            </Text>
            <Text style={styles.leafyInstantCtaSubtitle}>
              Ghim ngay lên Widget bạn bè & Bức tường Leafybooth
            </Text>
          </View>
          <Text style={styles.leafyInstantCtaArrow}>➔</Text>
        </Pressable>

        {/* Nút 2: Trang trí thêm sticker, đổi viền độc lạ trong Studio */}
        <Pressable
          onPress={handleOpenStudioWithPhotos}
          style={({ pressed }) => [
            styles.studioCtaButton,
            { transform: [{ scale: pressed ? 0.98 : 1 }] },
          ]}
        >
          <View style={styles.studioCtaIconBox}>
            <Text style={{ fontSize: 18 }}>🎨</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.studioCtaTitle}>Trang Trí Khung & Sticker ✨</Text>
            <Text style={styles.studioCtaSubtitle}>180+ sticker, 6 font chữ, viền vé phim & camcorder</Text>
          </View>
          <Text style={styles.studioCtaArrow}>➔</Text>
        </Pressable>

        {/* Hàng nút phụ: Lưu vào máy & Chụp lại */}
        <View style={styles.buttonRow}>
          <PillButton
            title={isSaving ? 'Đang lưu...' : twinStripMode ? '💾 Lưu Dải Đôi (Twin)' : '💾 Lưu dải ảnh HD'}
            onPress={handleSaveToDevice}
            variant="white"
            style={styles.halfButton}
          />
          <PillButton
            title="📸 Chụp bộ mới"
            onPress={handleRetake}
            variant="secondary"
            style={styles.halfButton}
          />
        </View>

        {/* Text Actions */}
        <View style={styles.textActionsRow}>
          <Pressable onPress={handleCustomize}>
            <Text style={styles.linkText}>🎨 Bố cục</Text>
          </Pressable>
          <Text style={styles.dotSeparator}>·</Text>
          <Pressable onPress={handleExitToBooth}>
            <Text style={styles.linkText}>📸 Sảnh Booth</Text>
          </Pressable>
          <Text style={styles.dotSeparator}>·</Text>
          <Pressable onPress={handleExitToHome}>
            <Text style={styles.linkTextBold}>🏠 Màn hình chính</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.darkBg, // Pure Midnight OLED Dark
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  twinToggleWrapper: {
    flexDirection: 'row',
    backgroundColor: colors.darkSurfaceElevated,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
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
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  twinToggleTextActive: {
    color: colors.ink,
    fontWeight: '900',
  },
  homeHeaderPill: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.darkSurfaceElevated,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.darkSoft,
  },
  homeHeaderIcon: {
    fontSize: 16,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.darkSurfaceElevated,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.darkSoft,
  },
  closeIcon: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
  },

  stripContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },

  // Retake Slot Section
  retakeSlotSection: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  retakeSlotSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.yellow,
  },
  retakeSlotChipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  retakeSlotChip: {
    backgroundColor: colors.darkSurfaceElevated,
    borderWidth: 1.5,
    borderColor: colors.yellow,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  retakeSlotChipText: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.yellow,
  },

  // Strip presentation
  stripWrapper: {
    marginVertical: 4,
    alignItems: 'center',
  },
  photoboothStrip: {
    width: 220,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: colors.ink,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 12,
    alignItems: 'center',
    ...theme.shadows.hard,
  },
  gridStrip: {
    width: 280,
  },
  twinStripsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  twinSingleStrip: {
    width: 165,
    paddingHorizontal: 6,
    paddingTop: 6,
    paddingBottom: 8,
  },
  twinCutDivider: {
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 480,
    paddingVertical: 10,
  },
  twinCutIcon: {
    fontSize: 14,
  },
  twinDashedLine: {
    flex: 1,
    width: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    marginVertical: 4,
  },
  stripBrandHeader: {
    marginBottom: 6,
    alignItems: 'center',
  },
  stripBrandText: {
    fontSize: 8,
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: 1,
  },
  verticalPhotoContainer: {
    width: '100%',
    gap: 8,
  },
  gridPhotoContainer: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  photoFrame: {
    width: '100%',
    aspectRatio: 1.35,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: colors.ink,
    position: 'relative',
  },
  gridPhotoFrame: {
    width: '48%',
    aspectRatio: 1,
  },
  twinPhotoFrame: {
    aspectRatio: 1.3,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },

  // Retake Floating Button on Photo Frame
  slotRetakeFloatingBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderWidth: 1,
    borderColor: colors.yellow,
  },
  slotRetakeFloatingIcon: {
    color: colors.yellow,
    fontSize: 11,
    fontWeight: '900',
  },
  slotRetakeFloatingLabel: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
  },

  // Filters Overlays
  filmPerforatedBorder: {
    borderStyle: 'dashed',
    borderWidth: 2,
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
    fontSize: 12,
    fontWeight: '900',
    color: colors.ink,
    marginTop: 8,
    textAlign: 'center',
  },

  // Footer Signature & Barcode
  stripFooterSignature: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.15)',
  },
  waxSealStampPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  waxSealEmoji: {
    fontSize: 12,
  },
  waxSealText: {
    fontSize: 7,
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
    height: 12,
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

  // Filters Section
  filtersSection: {
    width: '100%',
    marginVertical: 10,
  },
  filtersSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  filtersScroll: {
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.darkSurfaceElevated,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: colors.yellow,
    borderColor: colors.ink,
  },
  filterChipIcon: {
    fontSize: 14,
  },
  filterChipLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  filterChipLabelActive: {
    color: colors.ink,
    fontWeight: '900',
  },

  // Toast
  toastContainer: {
    marginTop: 8,
    backgroundColor: colors.yellow,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.ink,
  },
  toastText: {
    color: colors.ink,
    fontWeight: '900',
    fontSize: 13,
  },

  // Action Section
  actionSection: {
    width: '100%',
    gap: 8,
    paddingTop: 6,
  },
  leafyInstantCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.yellow,
    borderWidth: 2.5,
    borderColor: colors.ink,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    ...theme.shadows.hard,
  },
  leafyInstantCtaIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leafyInstantCtaTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.ink,
  },
  leafyInstantCtaSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(17, 24, 39, 0.8)',
  },
  leafyInstantCtaArrow: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.ink,
  },
  studioCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.darkSurfaceElevated,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
    gap: 10,
    ...theme.shadows.darkSoft,
  },
  studioCtaIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studioCtaTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.white,
  },
  studioCtaSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  studioCtaArrow: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  halfButton: {
    flex: 1,
  },
  textActionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  linkText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  linkTextBold: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.yellow,
  },
  dotSeparator: {
    color: colors.darkBorder,
    fontSize: 14,
  },
});

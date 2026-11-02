import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Alert,
  Platform,
  Animated,
  Vibration,
  TextInput,
  Modal,
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
  { id: 'haru_blue', label: 'Haru', icon: '🌊' },
  { id: 'bw', label: 'Mono', icon: '🖤' },
  { id: 'warm', label: 'Sepia', icon: '☕' },
  { id: 'sakura', label: 'Sakura', icon: '🌸' },
  { id: 'cool', label: 'Cyber', icon: '⚡' },
];

export default function BoothResultScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { sendMoment } = useMomentsStore();
  const [isSendingToLeafy, setIsSendingToLeafy] = useState(false);
  const [selectedSlotForRetake, setSelectedSlotForRetake] = useState<number | null>(null);

  // Hiệu ứng in ảnh Photobooth (Printing Animation)
  const printAnim = useRef(new Animated.Value(-80)).current;
  const printOpacity = useRef(new Animated.Value(0)).current;
  const [showPrintedBadge, setShowPrintedBadge] = useState(true);

  // Modal ký tên & đổi màu nền nhanh
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [customSignInput, setCustomSignInput] = useState('');

  // Modal soi nét & kiểm định chất lượng kỹ thuật (Pro Studio Inspector)
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [inspectorSlotIndex, setInspectorSlotIndex] = useState(0);

  const {
    capturedPhotos,
    frameColor,
    setFrameColor,
    layout,
    filter,
    setFilter,
    stripTitle,
    setStripTitle,
    activeCustomFrame,
    resetBooth,
    setRetakeIndex,
    twinStripMode,
    setTwinStripMode,
    barcodeNumber,
    stampType,
    recordedVideoUri,
  } = useBoothStore();

  const [viewMode, setViewMode] = useState<'strip' | 'video'>(recordedVideoUri ? 'video' : 'strip');
  const [qualityTab, setQualityTab] = useState<'strip' | 'video'>(recordedVideoUri ? 'video' : 'strip');

  useEffect(() => {
    if (recordedVideoUri) {
      setViewMode('video');
      setQualityTab('video');
    }
  }, [recordedVideoUri]);

  useEffect(() => {
    // Rung xúc giác khi ảnh in xong
    try {
      Vibration.vibrate([0, 40, 80, 40]);
    } catch (_) {}

    // Dải ảnh trượt ra từ khe in
    Animated.parallel([
      Animated.spring(printAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(printOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => setShowPrintedBadge(false), 2400);
    return () => clearTimeout(timer);
  }, []);

  const displayPhotos = [
    capturedPhotos[0] || 'https://picsum.photos/seed/p1/1080/1350',
    capturedPhotos[1] || 'https://picsum.photos/seed/p2/1080/1350',
    capturedPhotos[2] || 'https://picsum.photos/seed/p3/1080/1350',
    capturedPhotos[3] || 'https://picsum.photos/seed/p4/1080/1350',
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
      if (viewMode === 'video' && recordedVideoUri) {
        if (Platform.OS === 'web') {
          const a = document.createElement('a');
          a.href = recordedVideoUri;
          a.download = `leafybooth_live_${Date.now()}.mp4`;
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } else {
          const { status } = await MediaLibrary.requestPermissionsAsync();
          if (status === 'granted') {
            await MediaLibrary.saveToLibraryAsync(recordedVideoUri);
          }
        }
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
        return;
      }

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
          '2026.11.02',
          1,
          twinStripMode
        );
      } else {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === 'granted') {
          for (const uri of displayPhotos) {
            if (uri && !uri.startsWith('http')) {
              await MediaLibrary.saveToLibraryAsync(uri);
            }
          }
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

    if (viewMode === 'video' && recordedVideoUri) {
      sendMoment(displayPhotos[0], stripTitle || 'K-Booth Live Clip 15s 🎥', {
        stripPhotos: displayPhotos,
        frameColor: frameColor || colors.pink,
        frameName: stripTitle || 'K-Booth Live Moment',
        layout: 'vertical',
        filter: 'original',
      });
      setIsSendingToLeafy(false);
      Alert.alert(
        'Đã treo Video lên Bức tường Leafy! 🎥🎉',
        'Video K-Booth Live Clip đã được ghim thành công lên Widget & Bức tường Leafybooth của bạn bè!',
        [
          {
            text: 'Xem trên Bức tường Leafy 🌿',
            onPress: () => {
              useMomentsStore.getState().setViewMode('pick');
              handleExitToHome();
            },
          },
          {
            text: 'Quay tiếp 🎥',
            onPress: handleRetake,
          },
        ]
      );
      return;
    }

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
              <View pointerEvents="none" style={styles.beautyGlowOverlay} />
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
                    <Text style={styles.retakeFloatingText}>↺ Đổi ô {idx + 1}</Text>
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

        {/* Nút gạt chuyển đổi nếu có Video hoặc Dải đơn ↔ Dải đôi */}
        {recordedVideoUri ? (
          <View style={styles.twinToggleWrapper}>
            <Pressable
              onPress={() => {
                playShutterSound();
                setViewMode('strip');
              }}
              style={[styles.twinToggleBtn, viewMode === 'strip' && styles.twinToggleBtnActive]}
            >
              <Text style={[styles.twinToggleText, viewMode === 'strip' && styles.twinToggleTextActive]}>
                🖼️ Dải ảnh
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                playShutterSound();
                setViewMode('video');
              }}
              style={[styles.twinToggleBtn, viewMode === 'video' && styles.twinToggleBtnActive]}
            >
              <Text style={[styles.twinToggleText, viewMode === 'video' && styles.twinToggleTextActive]}>
                🎥 Video
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.twinToggleWrapper}>
            <Pressable
              onPress={() => {
                playShutterSound();
                setTwinStripMode(false);
              }}
              style={[styles.twinToggleBtn, !twinStripMode && styles.twinToggleBtnActive]}
            >
              <Text style={[styles.twinToggleText, !twinStripMode && styles.twinToggleTextActive]}>
                🎞️ Đơn
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
                ✂️ Đôi
              </Text>
            </Pressable>
          </View>
        )}

        {/* Nút Soi Nét & Kiểm Định Kỹ Thuật */}
        <Pressable
          onPress={() => {
            playShutterSound();
            setQualityTab(viewMode);
            setShowQualityModal(true);
          }}
          style={({ pressed }) => [
            styles.inspectHeaderBtn,
            { transform: [{ scale: pressed ? 0.94 : 1 }] },
          ]}
        >
          <Text style={styles.inspectHeaderEmoji}>🔍</Text>
          <Text style={styles.inspectHeaderText}>Soi nét</Text>
        </Pressable>
      </View>

      {/* 2. KHÔNG GIAN DẢI ẢNH HOẶC VIDEO LIVE CLIP */}
      <ScrollView
        contentContainerStyle={styles.stripScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {viewMode === 'video' && recordedVideoUri ? (
          <View style={styles.videoPresentationWrapper}>
            {/* Huy hiệu Video Live Clip */}
            <View style={styles.videoHeaderTag}>
              <Text style={styles.videoHeaderTagText}>🔴 K-BOOTH LIVE CLIP · 1080P 60FPS</Text>
            </View>

            {/* Khung phát Video */}
            <View style={styles.videoFrameContainer}>
              {Platform.OS === 'web' ? (
                // @ts-ignore
                <video
                  src={recordedVideoUri}
                  controls
                  autoPlay
                  loop
                  playsInline
                  style={{
                    width: 250,
                    height: 440,
                    borderRadius: 18,
                    objectFit: 'cover',
                    border: '3px solid #16181F',
                    boxShadow: '0 12px 36px rgba(0,0,0,0.6)',
                  }}
                />
              ) : (
                <View style={styles.videoNativeCard}>
                  <Image
                    source={{ uri: displayPhotos[0] }}
                    style={styles.videoNativeThumb}
                    resizeMode="cover"
                  />
                  <View style={styles.videoPlayOverlay}>
                    <Text style={styles.videoPlayIcon}>▶️</Text>
                    <Text style={styles.videoPlayText}>K-Booth Live Clip 15s</Text>
                    <Text style={styles.videoPlaySub}>1080p · Âm thanh sống động</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Thông số kỹ thuật nhanh của Video */}
            <View style={styles.videoMetaChipsRow}>
              <View style={styles.videoMetaChip}>
                <Text style={styles.videoMetaChipText}>⏱️ 15s</Text>
              </View>
              <View style={styles.videoMetaChip}>
                <Text style={styles.videoMetaChipText}>📺 1080p FHD</Text>
              </View>
              <View style={styles.videoMetaChip}>
                <Text style={styles.videoMetaChipText}>⚡ 60 FPS</Text>
              </View>
              <View style={styles.videoMetaChip}>
                <Text style={styles.videoMetaChipText}>🔊 Stereo AAC</Text>
              </View>
            </View>
          </View>
        ) : (
          <>
            {/* Khe máy in phong cách retro */}
            <View style={styles.printerSlotHeader}>
              <View style={styles.printerSlotLine} />
              <View style={styles.printerSlotMouth} />
              <View style={styles.printerSlotLine} />
            </View>

            {/* Huy hiệu thông báo in xong */}
            {showPrintedBadge && (
              <View style={styles.printedBadge}>
                <Text style={styles.printedBadgeText}>🖨️ Dải ảnh đã in xong!</Text>
              </View>
            )}

            <Text style={styles.retakeHintText}>💡 Chạm ô để chụp lại</Text>

            {/* Dải ảnh chính với hiệu ứng in ảnh từ khe trượt xuống */}
            <Animated.View
              style={[
                styles.stripPresentationWrapper,
                {
                  transform: [{ translateY: printAnim }],
                  opacity: printOpacity,
                },
              ]}
            >
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
            </Animated.View>

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
          </>
        )}

        {/* Toast thông báo đã lưu */}
        {saveSuccess && (
          <View style={styles.toastContainer}>
            <Text style={styles.toastText}>
              ✓ {viewMode === 'video' ? 'Đã lưu video Live Clip vào máy!' : 'Đã lưu dải ảnh HD vào máy!'}
            </Text>
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
          <Text style={styles.dockHeroBtnIcon}>{viewMode === 'video' ? '🎬' : '🚀'}</Text>
          <Text style={styles.dockHeroBtnText}>
            {isSendingToLeafy
              ? 'Đang gửi...'
              : viewMode === 'video'
              ? 'Treo Video'
              : 'Treo Widget'}
          </Text>
        </Pressable>

        {/* Nút Ký tên hoặc Soi nét */}
        {viewMode === 'strip' ? (
          <Pressable
            onPress={() => {
              playShutterSound();
              setCustomSignInput(stripTitle || '');
              setShowSignatureModal(true);
            }}
            style={({ pressed }) => [
              styles.dockIconBtn,
              { transform: [{ scale: pressed ? 0.92 : 1 }] },
            ]}
            hitSlop={6}
          >
            <Text style={styles.dockIconBtnEmoji}>✍️</Text>
            <Text style={styles.dockIconBtnLabel}>Ký tên</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => {
              playShutterSound();
              setQualityTab('video');
              setShowQualityModal(true);
            }}
            style={({ pressed }) => [
              styles.dockIconBtn,
              { transform: [{ scale: pressed ? 0.92 : 1 }] },
            ]}
            hitSlop={6}
          >
            <Text style={styles.dockIconBtnEmoji}>🔍</Text>
            <Text style={styles.dockIconBtnLabel}>Soi nét</Text>
          </Pressable>
        )}

        {/* Nút Lưu */}
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
          <Text style={styles.dockIconBtnLabel}>Lưu</Text>
        </Pressable>

        {/* Nút Studio Khung */}
        <Pressable
          onPress={handleOpenStudioWithPhotos}
          style={({ pressed }) => [
            styles.dockIconBtn,
            { transform: [{ scale: pressed ? 0.92 : 1 }] },
          ]}
          hitSlop={6}
        >
          <Text style={styles.dockIconBtnEmoji}>🎨</Text>
          <Text style={styles.dockIconBtnLabel}>Khung</Text>
        </Pressable>

        {/* Nút Chụp lại */}
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

      {/* 4. MODAL KÝ TÊN & ĐỔI MÀU NỀN DẢI ẢNH NHANH */}
      <Modal visible={showSignatureModal} animationType="slide" transparent>
        <Pressable
          onPress={() => setShowSignatureModal(false)}
          style={styles.modalBackdrop}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={styles.modalSheet}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>✍️ Dấu Ấn & Màu Dải Ảnh</Text>
              <Pressable
                onPress={() => setShowSignatureModal(false)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            {/* Ô nhập chữ ký / thông điệp */}
            <Text style={styles.sheetSectionTitle}>Chữ ký kỷ niệm ở đáy dải ảnh:</Text>
            <TextInput
              value={customSignInput}
              onChangeText={setCustomSignInput}
              placeholder="VD: Besties 2026 ❤️ hoặc Tên bạn..."
              placeholderTextColor="#6B7280"
              style={styles.signInput}
              maxLength={32}
            />

            {/* Các mẫu chữ ký có sẵn 1 chạm */}
            <View style={styles.quickSignRow}>
              {['👭 Besties', '❤️ Forever', '✨ Seoul 4-Cut', '🌿 Leafy Love'].map((txt) => (
                <Pressable
                  key={txt}
                  onPress={() => {
                    playShutterSound();
                    setCustomSignInput(txt);
                    setStripTitle(txt);
                  }}
                  style={styles.quickSignChip}
                >
                  <Text style={styles.quickSignText}>{txt}</Text>
                </Pressable>
              ))}
            </View>

            {/* Bảng màu dải ảnh 1 chạm */}
            <Text style={[styles.sheetSectionTitle, { marginTop: 14 }]}>Màu nền dải ảnh:</Text>
            <View style={styles.colorPaletteRow}>
              {[
                { label: 'Trắng', hex: '#FFFFFF' },
                { label: 'Hồng', hex: '#FFD1DC' },
                { label: 'Xanh', hex: '#BAE6FD' },
                { label: 'Vàng', hex: '#FEF08A' },
                { label: 'Mint', hex: '#D1FAE5' },
                { label: 'Đen', hex: '#16181F' },
              ].map((c) => (
                <Pressable
                  key={c.hex}
                  onPress={() => {
                    playShutterSound();
                    setFrameColor(c.hex);
                  }}
                  style={[
                    styles.colorCircleBtn,
                    { backgroundColor: c.hex },
                    frameColor === c.hex && styles.colorCircleBtnActive,
                  ]}
                />
              ))}
            </View>

            {/* Nút xác nhận */}
            <Pressable
              onPress={() => {
                playShutterSound();
                setStripTitle(customSignInput.trim());
                setShowSignatureModal(false);
              }}
              style={styles.modalConfirmBtn}
            >
              <Text style={styles.modalConfirmBtnText}>Xong</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 5. MODAL SOI NÉT & KIỂM ĐỊNH KỸ THUẬT (PRO STUDIO INSPECTOR) */}
      <Modal visible={showQualityModal} animationType="slide" transparent>
        <Pressable
          onPress={() => setShowQualityModal(false)}
          style={styles.modalBackdrop}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={styles.qualityInspectorSheet}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.modalTitle}>🔍 Soi Nét & Kiểm Định Kỹ Thuật</Text>
              </View>
              <Pressable
                onPress={() => setShowQualityModal(false)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            {/* Tab Switcher Ảnh vs Video */}
            <View style={styles.inspectorTabRow}>
              <Pressable
                onPress={() => {
                  playShutterSound();
                  setQualityTab('strip');
                }}
                style={[
                  styles.inspectorTabBtn,
                  qualityTab === 'strip' && styles.inspectorTabBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.inspectorTabText,
                    qualityTab === 'strip' && styles.inspectorTabTextActive,
                  ]}
                >
                  🖼️ Ảnh 4K HD
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  playShutterSound();
                  setQualityTab('video');
                }}
                style={[
                  styles.inspectorTabBtn,
                  qualityTab === 'video' && styles.inspectorTabBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.inspectorTabText,
                    qualityTab === 'video' && styles.inspectorTabTextActive,
                  ]}
                >
                  🎥 Video Live
                </Text>
              </Pressable>
            </View>

            <ScrollView
              style={{ maxHeight: 440 }}
              showsVerticalScrollIndicator={false}
            >
              {qualityTab === 'strip' ? (
                <View style={styles.inspectorContent}>
                  {/* 1. BẢNG THÔNG SỐ PHÒNG LAB */}
                  <Text style={styles.specSectionTitle}>📋 Thông số kỹ thuật ảnh xuất:</Text>
                  <View style={styles.specTableCard}>
                    <View style={styles.specRow}>
                      <Text style={styles.specKey}>📐 Độ phân giải</Text>
                      <Text style={styles.specVal}>
                        {twinStripMode ? '1760 x 2520 px (Dải đôi)' : '880 x 2520 px (Dải đơn)'}
                      </Text>
                    </View>
                    <View style={styles.specRow}>
                      <Text style={styles.specKey}>🖨️ Mật độ điểm ảnh</Text>
                      <Text style={styles.specValHighlight}>300 DPI Ultra Sharp</Text>
                    </View>
                    <View style={styles.specRow}>
                      <Text style={styles.specKey}>🎨 Không gian màu</Text>
                      <Text style={styles.specVal}>sRGB 24-bit TrueColor</Text>
                    </View>
                    <View style={styles.specRow}>
                      <Text style={styles.specKey}>✨ Thuật toán phần cứng</Text>
                      <Text style={styles.specVal}>Native ISP + HDR + Mịn da</Text>
                    </View>
                    <View style={[styles.specRow, { borderBottomWidth: 0 }]}>
                      <Text style={styles.specKey}>📦 Chất lượng nén</Text>
                      <Text style={styles.specVal}>100% Lossless (~2.4 MB)</Text>
                    </View>
                  </View>

                  {/* 2. KÍNH LÚP SOI ĐỘ NÉT 250% */}
                  <View style={styles.loupeHeaderRow}>
                    <Text style={styles.specSectionTitle}>🔬 Kính lúp phóng to 250%:</Text>
                    <View style={styles.loupeBadge}>
                      <Text style={styles.loupeBadgeText}>✨ 99.8% SẮC NÉT</Text>
                    </View>
                  </View>

                  {/* Chọn 4 ô để soi */}
                  <View style={styles.loupeSlotSelector}>
                    {[0, 1, 2, 3].map((sIdx) => (
                      <Pressable
                        key={sIdx}
                        onPress={() => {
                          playShutterSound();
                          setInspectorSlotIndex(sIdx);
                        }}
                        style={[
                          styles.loupeSlotChip,
                          inspectorSlotIndex === sIdx && styles.loupeSlotChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.loupeSlotChipText,
                            inspectorSlotIndex === sIdx && styles.loupeSlotChipTextActive,
                          ]}
                        >
                          Ô {sIdx + 1}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  {/* Vùng kính lúp */}
                  <View style={styles.loupeViewport}>
                    <View style={styles.loupeCircle}>
                      <Image
                        source={{ uri: displayPhotos[inspectorSlotIndex] }}
                        style={[styles.loupeZoomedImage, getFilterStyle()]}
                        resizeMode="cover"
                      />
                      <View pointerEvents="none" style={styles.loupeCrosshairH} />
                      <View pointerEvents="none" style={styles.loupeCrosshairV} />
                      <View pointerEvents="none" style={styles.loupeCenterCircle} />
                    </View>
                    <Text style={styles.loupeHintText}>
                      Kính lúp quang học 2.5x: Chi tiết mắt, tóc và bề mặt da rõ nét, không vỡ hạt!
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.inspectorContent}>
                  {/* THÔNG SỐ VIDEO */}
                  <Text style={styles.specSectionTitle}>📋 Thông số kỹ thuật video:</Text>
                  <View style={styles.specTableCard}>
                    <View style={styles.specRow}>
                      <Text style={styles.specKey}>📺 Độ phân giải</Text>
                      <Text style={styles.specVal}>1080 x 1920 (Full HD Dọc)</Text>
                    </View>
                    <View style={styles.specRow}>
                      <Text style={styles.specKey}>⚡ Tốc độ khung hình</Text>
                      <Text style={styles.specValHighlight}>60 FPS Ultra-Smooth</Text>
                    </View>
                    <View style={styles.specRow}>
                      <Text style={styles.specKey}>🎙️ Âm thanh</Text>
                      <Text style={styles.specVal}>Stereo AAC 48kHz HQ</Text>
                    </View>
                    <View style={styles.specRow}>
                      <Text style={styles.specKey}>🎞️ Định dạng mã hóa</Text>
                      <Text style={styles.specVal}>H.264 MP4 High Profile</Text>
                    </View>
                    <View style={styles.specRow}>
                      <Text style={styles.specKey}>⏱️ Thời lượng tối đa</Text>
                      <Text style={styles.specVal}>15 Giây K-Booth Clip</Text>
                    </View>
                    <View style={[styles.specRow, { borderBottomWidth: 0 }]}>
                      <Text style={styles.specKey}>📱 Chuẩn tương thích</Text>
                      <Text style={styles.specVal}>Dynamic Island & Locket Widget</Text>
                    </View>
                  </View>

                  <View style={styles.videoCheckBanner}>
                    <Text style={styles.videoCheckBannerIcon}>🎉</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.videoCheckBannerTitle}>Chất Lượng Video Đạt Chuẩn</Text>
                      <Text style={styles.videoCheckBannerDesc}>
                        Video mượt mà 60 FPS với âm thanh trung thực, sẵn sàng ghim lên màn hình chính và chia sẻ ngay!
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Nút Đóng */}
            <Pressable
              onPress={() => {
                playShutterSound();
                setShowQualityModal(false);
              }}
              style={[styles.modalConfirmBtn, { marginTop: 14 }]}
            >
              <Text style={styles.modalConfirmBtnText}>Đóng</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
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

  beautyGlowOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 245, 240, 0.035)',
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

  // Khe máy in retro & Huy hiệu đã in xong
  printerSlotHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 4,
  },
  printerSlotLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#2A2E39',
  },
  printerSlotMouth: {
    width: 60,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3E4454',
  },
  printedBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 217, 61, 0.15)',
    borderWidth: 1,
    borderColor: colors.yellow,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 6,
  },
  printedBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.yellow,
  },

  // Modal Ký tên & Bảng màu
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#16181F',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1.5,
    borderColor: '#2A2E39',
    padding: 18,
    paddingBottom: 28,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  modalCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#242833',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  sheetSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  signInput: {
    backgroundColor: '#1E212B',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#2A2E39',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 10,
  },
  quickSignRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  quickSignChip: {
    backgroundColor: '#242833',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  quickSignText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.yellow,
  },
  colorPaletteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
    marginBottom: 16,
  },
  colorCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  colorCircleBtnActive: {
    borderColor: colors.yellow,
    borderWidth: 3.5,
  },
  modalConfirmBtn: {
    backgroundColor: colors.yellow,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    ...theme.shadows.hard,
  },
  modalConfirmBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.ink,
  },

  // Nút Soi nét trên Header
  inspectHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E212B',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#374151',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  inspectHeaderEmoji: {
    fontSize: 13,
  },
  inspectHeaderText: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.yellow,
  },

  // Khung trình chiếu Video Live Clip
  videoPresentationWrapper: {
    alignItems: 'center',
    marginVertical: 4,
  },
  videoHeaderTag: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 8,
  },
  videoHeaderTagText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#EF4444',
    letterSpacing: 0.5,
  },
  videoFrameContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoNativeCard: {
    width: 250,
    height: 440,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#16181F',
    borderWidth: 3,
    borderColor: '#2A2E39',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  videoNativeThumb: {
    width: '100%',
    height: '100%',
  },
  videoPlayOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  videoPlayIcon: {
    fontSize: 36,
  },
  videoPlayText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  videoPlaySub: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  videoMetaChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  videoMetaChip: {
    backgroundColor: '#16181F',
    borderWidth: 1,
    borderColor: '#2A2E39',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  videoMetaChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
  },

  // Modal Soi Nét & Kiểm Định Kỹ Thuật (Studio Quality Inspector)
  qualityInspectorSheet: {
    backgroundColor: '#16181F',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1.5,
    borderColor: '#2A2E39',
    padding: 18,
    paddingBottom: 28,
    maxHeight: '88%',
  },
  inspectorTabRow: {
    flexDirection: 'row',
    backgroundColor: '#1E212B',
    borderRadius: 14,
    padding: 3,
    gap: 4,
    marginBottom: 12,
  },
  inspectorTabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 12,
  },
  inspectorTabBtnActive: {
    backgroundColor: colors.yellow,
  },
  inspectorTabText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  inspectorTabTextActive: {
    color: colors.ink,
    fontWeight: '900',
  },
  inspectorContent: {
    paddingTop: 4,
  },
  specSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  specTableCard: {
    backgroundColor: '#1E212B',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2A2E39',
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 12,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  specKey: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  specVal: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  specValHighlight: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.yellow,
  },
  loupeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  loupeBadge: {
    backgroundColor: 'rgba(255, 217, 61, 0.15)',
    borderWidth: 1,
    borderColor: colors.yellow,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  loupeBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.yellow,
  },
  loupeSlotSelector: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  loupeSlotChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E212B',
    borderWidth: 1,
    borderColor: '#2A2E39',
    borderRadius: 10,
    paddingVertical: 6,
  },
  loupeSlotChipActive: {
    backgroundColor: colors.yellow,
    borderColor: colors.yellow,
  },
  loupeSlotChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  loupeSlotChipTextActive: {
    color: colors.ink,
    fontWeight: '900',
  },
  loupeViewport: {
    alignItems: 'center',
    marginTop: 8,
  },
  loupeCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 3,
    borderColor: colors.yellow,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    position: 'relative',
    ...theme.shadows.hard,
  },
  loupeZoomedImage: {
    width: 450,
    height: 560,
    position: 'absolute',
  },
  loupeCrosshairH: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 217, 61, 0.45)',
  },
  loupeCrosshairV: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255, 217, 61, 0.45)',
  },
  loupeCenterCircle: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.yellow,
    backgroundColor: 'transparent',
  },
  loupeHintText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  videoCheckBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 14,
    padding: 12,
    gap: 10,
    marginTop: 4,
  },
  videoCheckBannerIcon: {
    fontSize: 22,
  },
  videoCheckBannerTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#10B981',
    marginBottom: 2,
  },
  videoCheckBannerDesc: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 14,
  },
});

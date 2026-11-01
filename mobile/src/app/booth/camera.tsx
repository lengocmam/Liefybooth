import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Animated,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { colors } from '../../core/theme/colors';
import { theme } from '../../core/theme/theme';
import { useBoothStore } from '../../features/booth/hooks/useBoothStore';
import { playShutterSound } from '../../features/booth/services/soundService';
import { useStudioStore } from '../../features/studio/hooks/useStudioStore';
import { POSE_COLLECTIONS, PoseCollection } from '../../features/booth/constants/poseGuides';

export default function BoothCameraScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);

  const {
    selectedBackdrop,
    capturedPhotos,
    addCapturedPhoto,
    replacePhotoAtIndex,
    resetPhotos,
    retakeIndex,
    setRetakeIndex,
    shotInterval,
    setShotInterval,
    poseCategory,
    setPoseCategory,
    cameraFacing,
    isMirrored,
    soundEnabled,
    activeCustomFrame,
    frameColor,
    toggleCameraFacing,
    toggleMirror,
    toggleSound,
  } = useBoothStore();

  const [currentShotIndex, setCurrentShotIndex] = useState(0); // 0, 1, 2, 3
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isShooting, setIsShooting] = useState(false);
  const [shootingMode, setShootingMode] = useState<'instant' | 'timer'>('timer');
  const flashAnim = useRef(new Animated.Value(0)).current;

  // Yêu cầu quyền camera khi mở & xử lý retake
  useEffect(() => {
    if (retakeIndex !== null) {
      setCurrentShotIndex(retakeIndex);
    } else {
      resetPhotos();
    }
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  const triggerFlash = () => {
    flashAnim.setValue(1);
    Animated.timing(flashAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const takeSinglePhoto = async (shotIndex: number, isReplacing: boolean = false): Promise<string> => {
    triggerFlash();
    if (soundEnabled) {
      playShutterSound();
    }

    let photoUri = '';
    try {
      if (cameraRef.current && permission?.granted) {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.85,
          skipProcessing: true,
        });
        photoUri = photo?.uri || '';
      }
    } catch {
      // Fallback nếu chạy trên web hoặc mô phỏng
    }

    if (!photoUri) {
      photoUri = `https://picsum.photos/seed/leafy_${Date.now()}_${shotIndex}/400/400`;
    }

    if (!isReplacing) {
      addCapturedPhoto(photoUri);
    }
    return photoUri;
  };

  // Chụp lại riêng 1 ô (Smart Retake)
  const handleRetakeSingleShot = async () => {
    if (isShooting || retakeIndex === null) return;
    setIsShooting(true);

    for (let sec = shotInterval; sec > 0; sec--) {
      setCountdown(sec);
      if (soundEnabled) {
        playShutterSound();
      }
      await new Promise((r) => setTimeout(r, 850));
    }
    setCountdown(null);

    const uri = await takeSinglePhoto(retakeIndex, true);
    replacePhotoAtIndex(retakeIndex, uri);

    const updated = [...capturedPhotos];
    updated[retakeIndex] = uri;
    useStudioStore.getState().setSlotPhotos(updated);

    setRetakeIndex(null);
    setIsShooting(false);
    router.replace('/booth/result' as any);
  };

  // Chụp tức thời 1-chạm không cần chờ đếm ngược
  const handleInstantShot = async () => {
    if (isShooting) return;
    const currentCount = capturedPhotos.length;
    if (currentCount >= 4) return;

    setIsShooting(true);
    setCurrentShotIndex(currentCount);

    const uri = await takeSinglePhoto(currentCount);
    setIsShooting(false);

    if (currentCount + 1 >= 4) {
      const allShots = [...capturedPhotos, uri];
      useStudioStore.getState().setSlotPhotos(allShots);
      router.replace('/booth/result' as any);
    } else {
      setCurrentShotIndex(currentCount + 1);
    }
  };

  // Chế độ tự động đếm ngược chuỗi 4 ảnh chuẩn K-Booth
  const startPhotoboothSequence = async () => {
    if (isShooting) return;
    setIsShooting(true);
    resetPhotos();

    const shotUris: string[] = [];
    for (let shot = 0; shot < 4; shot++) {
      setCurrentShotIndex(shot);

      // Đếm ngược theo nhịp shotInterval (3s, 5s hoặc 7s)
      for (let sec = shotInterval; sec > 0; sec--) {
        setCountdown(sec);
        if (soundEnabled) {
          playShutterSound();
        }
        await new Promise((r) => setTimeout(r, 850));
      }

      setCountdown(null);
      const uri = await takeSinglePhoto(shot);
      if (uri) {
        shotUris.push(uri);
      }

      // Nghỉ giữa các khung hình để người dùng đổi dáng
      if (shot < 3) {
        await new Promise((r) => setTimeout(r, 900));
      }
    }

    setIsShooting(false);

    if (shotUris.length > 0) {
      useStudioStore.getState().setSlotPhotos(shotUris);
    }

    router.replace('/booth/result' as any);
  };

  const handleShutterPress = () => {
    if (retakeIndex !== null) {
      handleRetakeSingleShot();
    } else if (shootingMode === 'instant') {
      handleInstantShot();
    } else {
      startPhotoboothSequence();
    }
  };

  const currentPoseCollection = POSE_COLLECTIONS.find((p) => p.id === poseCategory);
  const currentPoseStep = currentPoseCollection?.steps[currentShotIndex] || currentPoseCollection?.steps[0];
  const effectiveBgColor = frameColor || activeCustomFrame?.color || selectedBackdrop?.color || colors.pink;

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 14), paddingBottom: Math.max(insets.bottom, 18) }]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.circleButton,
            { transform: [{ scale: pressed ? 0.95 : 1 }] },
          ]}
        >
          <Text style={styles.circleButtonText}>✕</Text>
        </Pressable>

        {/* Nền đang chọn Pill */}
        <Pressable
          onPress={() => router.push('/studio' as any)}
          style={({ pressed }) => [
            styles.backdropPill,
            activeCustomFrame && { backgroundColor: colors.yellow },
            { transform: [{ scale: pressed ? 0.95 : 1 }] },
          ]}
        >
          <Text
            style={[styles.backdropPillText, activeCustomFrame && { color: colors.ink }]}
            numberOfLines={1}
          >
            {activeCustomFrame ? `🎨 ${activeCustomFrame.name}` : `Nền ${selectedBackdrop.name}`}
          </Text>
        </Pressable>

        {/* Nút chuyển nhanh sang Tạo Khung Studio */}
        <Pressable
          onPress={() => {
            playShutterSound();
            router.push('/studio' as any);
          }}
          style={({ pressed }) => [
            styles.boothStudioShortcutBtn,
            { transform: [{ scale: pressed ? 0.94 : 1 }] },
          ]}
        >
          <Text style={styles.boothStudioShortcutText}>🎨 Khung</Text>
        </Pressable>

        {/* Cụm nút phụ: Lật gương + Âm thanh */}
        <View style={styles.topActionGroup}>
          <Pressable
            onPress={toggleMirror}
            style={({ pressed }) => [
              styles.circleButtonSmall,
              isMirrored && styles.circleButtonSmallActive,
              { transform: [{ scale: pressed ? 0.92 : 1 }] },
            ]}
          >
            <Text style={{ fontSize: 16 }}>🪞</Text>
          </Pressable>

          <Pressable
            onPress={toggleSound}
            style={({ pressed }) => [
              styles.circleButtonSmall,
              { transform: [{ scale: pressed ? 0.92 : 1 }] },
            ]}
          >
            <Text style={{ fontSize: 16 }}>{soundEnabled ? '🔊' : '🔇'}</Text>
          </Pressable>
        </View>
      </View>

      {/* Banner Smart Retake nếu đang chụp lại 1 ô */}
      {retakeIndex !== null && (
        <View style={styles.retakeBanner}>
          <View style={styles.retakeBannerContent}>
            <Text style={styles.retakeBannerTitle}>
              ↺ Đang chụp lại Ô số {retakeIndex + 1}
            </Text>
            <Text style={styles.retakeBannerSubtitle}>
              3 ô đẹp kia vẫn được giữ nguyên vẹn
            </Text>
          </View>
          <Pressable
            onPress={() => {
              setRetakeIndex(null);
              router.replace('/booth/result' as any);
            }}
            style={styles.retakeCancelBtn}
          >
            <Text style={styles.retakeCancelBtnText}>Hủy</Text>
          </Pressable>
        </View>
      )}

      {/* Floating Pose Guide Tip trên đầu Camera */}
      {poseCategory !== 'none' && currentPoseStep && (
        <View style={styles.poseGuideFloat}>
          <View style={styles.poseGuidePill}>
            <Text style={styles.poseGuidePillIcon}>{currentPoseStep.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.poseGuideTitle}>
                {currentPoseCollection?.name} · Ô {currentShotIndex + 1}/4: {currentPoseStep.title}
              </Text>
              <Text style={styles.poseGuideTip} numberOfLines={1}>
                💡 {currentPoseStep.tip}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Camera Viewfinder & Live Strip Side Column */}
      <View style={styles.chamberContainer}>
        {/* Main Camera Viewfinder */}
        <View style={styles.viewfinder}>
          {permission?.granted ? (
            <CameraView
              ref={cameraRef}
              style={[
                styles.cameraView,
                isMirrored && { transform: [{ scaleX: -1 }] },
              ]}
              facing={cameraFacing}
            />
          ) : (
            <View style={styles.simulatedCamera}>
              <Text style={styles.simulatedEmoji}>📸</Text>
              <Text style={styles.simulatedText}>
                {permission?.canAskAgain
                  ? 'Chạm để cấp quyền camera'
                  : 'Chế độ chụp Photobooth'}
              </Text>
            </View>
          )}

          {/* Silhouette Pose Outline Guide khi bật Pose Guide */}
          {poseCategory !== 'none' && (
            <View pointerEvents="none" style={styles.silhouetteOverlay}>
              <View style={styles.silhouetteHeadBox} />
              <View style={styles.silhouetteShoulderBox} />
              <Text style={styles.silhouetteLabel}>{currentPoseStep?.title || 'Tạo dáng'}</Text>
            </View>
          )}

          {/* Hiệu ứng chớp đèn Flash */}
          <Animated.View
            pointerEvents="none"
            style={[styles.flashOverlay, { opacity: flashAnim }]}
          />

          {/* Số đếm ngược to tròn ở giữa */}
          {countdown !== null && (
            <View style={styles.countdownContainer}>
              <View style={styles.countdownCircle}>
                <Text style={styles.countdownNumber}>{countdown}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Live Photobooth Strip Visualizer: Cột dải ảnh mini hiển thị trực tiếp ảnh đang lấp đầy */}
        <View style={[styles.liveStripSideBar, { backgroundColor: effectiveBgColor }]}>
          <Text style={styles.liveStripSideTitle}>LEAFY</Text>
          {[0, 1, 2, 3].map((slotIdx) => {
            const hasPhoto = capturedPhotos.length > slotIdx;
            const isCurrent = isShooting && currentShotIndex === slotIdx;

            return (
              <View
                key={slotIdx}
                style={[
                  styles.liveStripSlot,
                  isCurrent && styles.liveStripSlotCurrent,
                ]}
              >
                {hasPhoto ? (
                  <>
                    <Image
                      source={{ uri: capturedPhotos[slotIdx] }}
                      style={styles.liveStripSlotImg}
                    />
                    <View style={styles.liveStripCheckBadge}>
                      <Text style={styles.liveStripCheckText}>✓</Text>
                    </View>
                  </>
                ) : isCurrent ? (
                  <Text style={styles.liveStripSlotActiveText}>
                    {countdown || '📸'}
                  </Text>
                ) : (
                  <Text style={styles.liveStripSlotPendingText}>
                    {slotIdx + 1}
                  </Text>
                )}
              </View>
            );
          })}
          <Text style={styles.liveStripBarcodeText}>||||||||</Text>
        </View>
      </View>

      {/* Pose Collection Selector Chips */}
      <View style={styles.poseSelectorSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.poseChipsScroll}
        >
          <Pressable
            onPress={() => setPoseCategory('none')}
            style={[styles.poseChip, poseCategory === 'none' && styles.poseChipActive]}
          >
            <Text style={[styles.poseChipText, poseCategory === 'none' && styles.poseChipTextActive]}>
              🚫 Tắt dáng
            </Text>
          </Pressable>
          {POSE_COLLECTIONS.map((col) => (
            <Pressable
              key={col.id}
              onPress={() => setPoseCategory(col.id)}
              style={[styles.poseChip, poseCategory === col.id && styles.poseChipActive]}
            >
              <Text style={[styles.poseChipText, poseCategory === col.id && styles.poseChipTextActive]}>
                {col.icon} {col.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Bottom Controls: Mode switch & Interval Selector */}
      <View style={styles.controlsSection}>
        <View style={styles.modeAndIntervalRow}>
          {/* Chuyển chế độ: Tức thời vs Đếm chuỗi */}
          <View style={styles.modeSwitchRow}>
            <Pressable
              onPress={() => setShootingMode('instant')}
              disabled={isShooting}
              style={[
                styles.modeChip,
                shootingMode === 'instant' && styles.modeChipActive,
              ]}
            >
              <Text style={[styles.modeChipText, shootingMode === 'instant' && styles.modeChipTextActive]}>
                ⚡ 1-chạm
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setShootingMode('timer')}
              disabled={isShooting}
              style={[
                styles.modeChip,
                shootingMode === 'timer' && styles.modeChipActive,
              ]}
            >
              <Text style={[styles.modeChipText, shootingMode === 'timer' && styles.modeChipTextActive]}>
                ⏱️ Chuỗi 4 ảnh
              </Text>
            </Pressable>
          </View>

          {/* Chọn nhịp đếm ngược: 3s | 5s | 7s */}
          {shootingMode === 'timer' && (
            <View style={styles.intervalRow}>
              {([3, 5, 7] as const).map((sec) => (
                <Pressable
                  key={sec}
                  onPress={() => setShotInterval(sec)}
                  disabled={isShooting}
                  style={[
                    styles.intervalChip,
                    shotInterval === sec && styles.intervalChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.intervalChipText,
                      shotInterval === sec && styles.intervalChipTextActive,
                    ]}
                  >
                    {sec}s
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Shutter Area */}
        <View style={styles.shutterRow}>
          {/* Nút reset (bên trái) */}
          <Pressable
            onPress={() => {
              resetPhotos();
              setCurrentShotIndex(0);
            }}
            disabled={isShooting || capturedPhotos.length === 0}
            style={({ pressed }) => [
              styles.sideCircleBtn,
              capturedPhotos.length === 0 && { opacity: 0.3 },
              { transform: [{ scale: pressed ? 0.92 : 1 }] },
            ]}
          >
            <Text style={{ fontSize: 20 }}>↺</Text>
          </Pressable>

          {/* NÚT CHỤP CHÍNH TO TRÒN */}
          <Pressable
            onPress={handleShutterPress}
            disabled={isShooting}
            style={({ pressed }) => [
              styles.bigShutterOuter,
              { transform: [{ scale: pressed ? 0.95 : 1 }] },
            ]}
          >
            <View style={styles.bigShutterInner}>
              <Text style={styles.bigShutterEmoji}>
                {isShooting ? '⏳' : retakeIndex !== null ? '↺' : shootingMode === 'instant' ? '📸' : '⏱️'}
              </Text>
              <Text style={styles.bigShutterLabel}>
                {retakeIndex !== null
                  ? isShooting
                    ? 'Đang chụp...'
                    : `Chụp lại ô ${retakeIndex + 1}`
                  : isShooting
                  ? 'Đang chụp...'
                  : shootingMode === 'instant'
                  ? `Chụp ảnh ${capturedPhotos.length + 1}/4`
                  : `Bắt đầu (${shotInterval}s)`}
              </Text>
            </View>
          </Pressable>

          {/* Nút xoay đổi camera trước/sau */}
          <Pressable
            onPress={toggleCameraFacing}
            disabled={isShooting}
            style={({ pressed }) => [
              styles.sideCircleBtn,
              { transform: [{ scale: pressed ? 0.92 : 1 }] },
            ]}
          >
            <Text style={{ fontSize: 22 }}>🔄</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.darkBg, // Pure Midnight OLED
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  circleButton: {
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
  circleButtonText: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  backdropPill: {
    backgroundColor: colors.darkSurfaceElevated,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    ...theme.shadows.darkSoft,
  },
  backdropPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  boothStudioShortcutBtn: {
    backgroundColor: 'rgba(200, 241, 53, 0.15)',
    borderWidth: 1.5,
    borderColor: colors.yellow,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...theme.shadows.darkSoft,
  },
  boothStudioShortcutText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.yellow,
  },
  topActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  circleButtonSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.darkSurfaceElevated,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.darkSoft,
  },
  circleButtonSmallActive: {
    backgroundColor: colors.yellow,
    borderColor: colors.ink,
  },

  // Retake Banner
  retakeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 217, 61, 0.18)',
    borderWidth: 1.5,
    borderColor: colors.yellow,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginVertical: 4,
  },
  retakeBannerContent: {
    flex: 1,
  },
  retakeBannerTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.yellow,
  },
  retakeBannerSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  retakeCancelBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  retakeCancelBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.white,
  },

  // Pose Guide Floating Pill
  poseGuideFloat: {
    marginVertical: 4,
  },
  poseGuidePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 143, 199, 0.2)',
    borderWidth: 1.5,
    borderColor: '#FF8FC7',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
  },
  poseGuidePillIcon: {
    fontSize: 20,
  },
  poseGuideTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FF8FC7',
  },
  poseGuideTip: {
    fontSize: 11,
    color: colors.textSecondary,
  },

  // Chamber Viewfinder with Live Strip Side Column
  chamberContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    marginVertical: 6,
    maxHeight: 460,
  },
  viewfinder: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#000000',
    position: 'relative',
    borderWidth: 2,
    borderColor: colors.darkBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraView: {
    width: '100%',
    height: '100%',
  },
  simulatedCamera: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  simulatedEmoji: {
    fontSize: 56,
    marginBottom: 10,
  },
  simulatedText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  flashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#FFFFFF',
    zIndex: 10,
  },
  countdownContainer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    zIndex: 20,
  },
  countdownCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: colors.yellow,
    borderWidth: 4,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.hard,
  },
  countdownNumber: {
    fontSize: 60,
    fontWeight: '900',
    color: colors.ink,
  },

  // Silhouette Overlay
  silhouetteOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  silhouetteHeadBox: {
    width: 110,
    height: 130,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    borderStyle: 'dashed',
    marginBottom: 8,
  },
  silhouetteShoulderBox: {
    width: 200,
    height: 70,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderStyle: 'dashed',
  },
  silhouetteLabel: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },

  // Live Strip Visualizer (Side Column)
  liveStripSideBar: {
    width: 58,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.ink,
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'space-between',
    ...theme.shadows.hard,
  },
  liveStripSideTitle: {
    fontSize: 8,
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: 0.5,
  },
  liveStripSlot: {
    width: 46,
    height: 64,
    borderRadius: 6,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.ink,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  liveStripSlotCurrent: {
    borderColor: colors.yellow,
    borderWidth: 2.5,
    transform: [{ scale: 1.05 }],
  },
  liveStripSlotImg: {
    width: '100%',
    height: '100%',
  },
  liveStripCheckBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#10B981',
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveStripCheckText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  liveStripSlotActiveText: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.ink,
  },
  liveStripSlotPendingText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#94A3B8',
  },
  liveStripBarcodeText: {
    fontSize: 8,
    color: colors.ink,
    fontWeight: '900',
    letterSpacing: -1,
  },

  // Pose Selector Section
  poseSelectorSection: {
    marginVertical: 4,
  },
  poseChipsScroll: {
    gap: 8,
    paddingHorizontal: 2,
  },
  poseChip: {
    backgroundColor: colors.darkSurfaceElevated,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  poseChipActive: {
    backgroundColor: '#FF8FC7',
    borderColor: colors.ink,
  },
  poseChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  poseChipTextActive: {
    color: colors.ink,
    fontWeight: '900',
  },

  // Controls Section
  controlsSection: {
    gap: 12,
    marginBottom: 4,
  },
  modeAndIntervalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  modeSwitchRow: {
    flexDirection: 'row',
    backgroundColor: colors.darkSurfaceElevated,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    padding: 3,
    gap: 4,
  },
  modeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  modeChipActive: {
    backgroundColor: colors.yellow,
  },
  modeChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  modeChipTextActive: {
    color: colors.ink,
    fontWeight: '900',
  },
  intervalRow: {
    flexDirection: 'row',
    backgroundColor: colors.darkSurfaceElevated,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    padding: 3,
    gap: 4,
  },
  intervalChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  intervalChipActive: {
    backgroundColor: '#6EC6FF',
  },
  intervalChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  intervalChipTextActive: {
    color: colors.ink,
    fontWeight: '900',
  },

  // Shutter Area
  shutterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  sideCircleBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.darkSurfaceElevated,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.darkSoft,
  },
  bigShutterOuter: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: colors.yellow,
    borderWidth: 3,
    borderColor: colors.ink,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.hard,
  },
  bigShutterInner: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigShutterEmoji: {
    fontSize: 28,
  },
  bigShutterLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.ink,
    marginTop: 1,
    textAlign: 'center',
  },
});

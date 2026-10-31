import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { colors } from '../../core/theme/colors';
import { theme } from '../../core/theme/theme';
import { useBoothStore } from '../../features/booth/hooks/useBoothStore';
import { playShutterSound } from '../../features/booth/services/soundService';
import { useStudioStore } from '../../features/studio/hooks/useStudioStore';

export default function BoothCameraScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);

  const {
    selectedBackdrop,
    capturedPhotos,
    addCapturedPhoto,
    resetPhotos,
    cameraFacing,
    isMirrored,
    soundEnabled,
    activeCustomFrame,
    toggleCameraFacing,
    toggleMirror,
    toggleSound,
  } = useBoothStore();

  const [currentShotIndex, setCurrentShotIndex] = useState(0); // 0, 1, 2, 3
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isShooting, setIsShooting] = useState(false);
  const [shootingMode, setShootingMode] = useState<'instant' | 'timer'>('instant');
  const flashAnim = useRef(new Animated.Value(0)).current;

  // Yêu cầu quyền camera khi mở
  useEffect(() => {
    resetPhotos();
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

  const takeSinglePhoto = async (shotIndex: number): Promise<string> => {
    triggerFlash();
    if (soundEnabled) {
      playShutterSound();
    }

    let photoUri = '';
    try {
      if (cameraRef.current && permission?.granted) {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          skipProcessing: true,
        });
        photoUri = photo?.uri || '';
      }
    } catch {
      // Fallback nếu chạy trên web hoặc mô phỏng
    }

    // Nếu không có uri từ camera thực tế (ví dụ trên web dev), dùng placeholder phong cách pop
    if (!photoUri) {
      photoUri = `https://picsum.photos/seed/leafy_${Date.now()}_${shotIndex}/400/400`;
    }

    addCapturedPhoto(photoUri);
    return photoUri;
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

  // Chế độ tự động đếm ngược 3s theo chuỗi
  const startPhotoboothSequence = async () => {
    if (isShooting) return;
    setIsShooting(true);
    resetPhotos();

    const shotUris: string[] = [];
    for (let shot = 0; shot < 4; shot++) {
      setCurrentShotIndex(shot);

      // Đếm ngược 3 -> 2 -> 1
      for (let sec = 3; sec > 0; sec--) {
        setCountdown(sec);
        await new Promise(r => setTimeout(r, 900));
      }

      setCountdown(null);
      const uri = await takeSinglePhoto(shot);
      if (uri) {
        shotUris.push(uri);
      }

      // Nghỉ 1 giây giữa các khung hình để người dùng đổi dáng
      if (shot < 3) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    setIsShooting(false);

    // Đồng bộ ngay lập tức 4 ảnh thật vừa chụp vào Studio Store!
    if (shotUris.length > 0) {
      useStudioStore.getState().setSlotPhotos(shotUris);
    }

    // Chuyển tới màn hình kết quả dải ảnh
    router.replace('/booth/result' as any);
  };

  const handleShutterPress = () => {
    if (shootingMode === 'instant') {
      handleInstantShot();
    } else {
      startPhotoboothSequence();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 20) }]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        {/* Nút đóng X */}
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.circleButton,
            { transform: [{ scale: pressed ? 0.95 : 1 }] },
          ]}
        >
          <Text style={styles.circleButtonText}>✕</Text>
        </Pressable>

        {/* Nền đang chọn Pill (Bấm để đổi nền hoặc vào Studio chỉnh sửa) */}
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

        {/* Nút chuyển nhanh sang Tạo Khung mới trong Frame Studio */}
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
          <Text style={styles.boothStudioShortcutText}>🎨 Tạo khung</Text>
        </Pressable>

        {/* Cụm nút phụ: Lật gương + Bật/Tắt âm thanh */}
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

      {/* Camera Viewfinder */}
      <View style={styles.viewfinderWrapper}>
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

          {/* Hiệu ứng chớp đèn Flash */}
          <Animated.View
            pointerEvents="none"
            style={[styles.flashOverlay, { opacity: flashAnim }]}
          />

          {/* Số đếm ngược to ở giữa */}
          {countdown !== null && (
            <View style={styles.countdownContainer}>
              <View style={styles.countdownCircle}>
                <Text style={styles.countdownNumber}>{countdown}</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Progress & Slot Row */}
      <View style={styles.statusSection}>
        <View style={styles.statusTextRow}>
          <Text style={styles.shotProgressText}>
            Ảnh {Math.min(currentShotIndex + 1, 4)}/4
          </Text>
          <Text style={styles.holdStillText}>
            {isShooting ? 'Giữ yên nhé' : 'Sẵn sàng'}
          </Text>
        </View>

        {/* 4 Mini Slots Preview */}
        <View style={styles.slotsRow}>
          {[0, 1, 2, 3].map(index => {
            const isTaken = capturedPhotos.length > index;
            const isCurrent = isShooting && currentShotIndex === index;

            return (
              <View
                key={index}
                style={[
                  styles.slotBox,
                  isCurrent && styles.slotBoxActive,
                ]}
              >
                {isTaken ? (
                  <Image
                    source={{ uri: capturedPhotos[index] }}
                    style={styles.slotImage}
                  />
                ) : isCurrent ? (
                  <Text style={styles.slotActiveText}>{countdown || '📸'}</Text>
                ) : (
                  <Text style={styles.slotPlaceholderText}>{index + 1}</Text>
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* Bottom Controls */}
      <View style={styles.controlsSection}>
        {/* Chuyển chế độ: Tức thời vs Đếm 3s */}
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
              ⚡ Chụp tức thời
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
              ⏱️ Tự động 3s
            </Text>
          </Pressable>
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

          {/* NÚT CHỤP CHÍNH TO TRÒN (BIG INSTANT SHUTTER BUTTON) */}
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
                {isShooting ? '⏳' : shootingMode === 'instant' ? '📸' : '⏱️'}
              </Text>
              <Text style={styles.bigShutterLabel}>
                {isShooting
                  ? 'Đang chụp...'
                  : shootingMode === 'instant'
                  ? `Chụp ảnh ${capturedPhotos.length + 1}/4`
                  : 'Bắt đầu đếm'}
              </Text>
            </View>
          </Pressable>

          {/* Nút xoay đổi camera trước/sau (bên phải - icon tròn sạch sẽ) */}
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
    paddingHorizontal: theme.spacing.lg,
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
    paddingHorizontal: 16,
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
    fontSize: 13,
    fontWeight: '800',
    color: colors.yellow,
  },
  viewfinderWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  viewfinder: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000000',
    ...theme.shadows.darkSoft,
  },
  cameraView: {
    flex: 1,
  },
  simulatedCamera: {
    flex: 1,
    backgroundColor: '#1E2024',
    alignItems: 'center',
    justifyContent: 'center',
  },
  simulatedEmoji: {
    fontSize: 54,
    marginBottom: 8,
  },
  simulatedText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E5E7EB',
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
    zIndex: 20,
  },
  countdownCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#FFE600',
    borderWidth: 3.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.hard,
  },
  countdownNumber: {
    fontSize: 78,
    fontWeight: '900',
    color: colors.ink,
  },
  statusSection: {
    width: '100%',
    marginBottom: 16,
  },
  statusTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  shotProgressText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.white,
  },
  holdStillText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E5E7EB',
  },
  slotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  slotBox: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: '#1C1F26',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2E3542',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotBoxActive: {
    borderColor: '#FFE600',
    backgroundColor: '#272B35',
  },
  slotImage: {
    width: '100%',
    height: '100%',
  },
  slotActiveText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFE600',
  },
  slotPlaceholderText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748B',
  },
  topActionGroup: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
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
    backgroundColor: colors.accentYellow,
    borderColor: colors.accentYellow,
  },
  controlsSection: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  modeSwitchRow: {
    flexDirection: 'row',
    backgroundColor: '#1C1F26',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    padding: 3,
    gap: 4,
  },
  modeChip: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  modeChipActive: {
    backgroundColor: colors.accentYellow,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
  },
  modeChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#9CA3AF',
  },
  modeChipTextActive: {
    color: colors.ink,
    fontWeight: '900',
  },
  shutterRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  sideCircleBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.darkSurfaceElevated,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.darkSoft,
  },
  bigShutterOuter: {
    flex: 1,
    marginHorizontal: 12,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accentYellow,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    padding: 3,
    ...theme.shadows.darkSoft,
  },
  bigShutterInner: {
    flex: 1,
    borderRadius: 28,
    backgroundColor: colors.accentYellow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bigShutterEmoji: {
    fontSize: 24,
  },
  bigShutterLabel: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: -0.2,
  },
});

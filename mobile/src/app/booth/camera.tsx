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

        {/* Nền đang chọn Pill */}
        <View style={[styles.backdropPill, activeCustomFrame && { backgroundColor: colors.yellow }]}>
          <Text style={styles.backdropPillText}>
            {activeCustomFrame ? `🎨 ${activeCustomFrame.name}` : `Nền ${selectedBackdrop.name}`}
          </Text>
        </View>

        {/* Nút bật/tắt âm thanh */}
        <Pressable
          onPress={toggleSound}
          style={({ pressed }) => [
            styles.circleButton,
            { transform: [{ scale: pressed ? 0.95 : 1 }] },
          ]}
        >
          <Text style={styles.circleButtonText}>{soundEnabled ? '🔊' : '🔇'}</Text>
        </Pressable>
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
      <View style={styles.controlsRow}>
        <Pressable
          onPress={startPhotoboothSequence}
          disabled={isShooting}
          style={({ pressed }) => [
            styles.controlPill,
            styles.countPill,
            {
              transform: [{ translateY: pressed ? 2 : 0 }],
              opacity: isShooting ? 0.7 : 1,
            },
          ]}
        >
          <Text style={styles.countPillText}>
            {isShooting ? 'Đang chụp...' : 'Đếm 3s'}
          </Text>
        </Pressable>

        <Pressable
          onPress={toggleMirror}
          disabled={isShooting}
          style={({ pressed }) => [
            styles.controlPill,
            styles.whitePill,
            { transform: [{ translateY: pressed ? 2 : 0 }] },
          ]}
        >
          <Text style={styles.whitePillText}>Lật gương</Text>
        </Pressable>

        <Pressable
          onPress={toggleCameraFacing}
          disabled={isShooting}
          style={({ pressed }) => [
            styles.controlPill,
            styles.whitePill,
            { transform: [{ translateY: pressed ? 2 : 0 }] },
          ]}
        >
          <Text style={styles.whitePillText}>Đổi camera</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B3D2E', // Màu xanh rừng đậm đặc trưng của Booth
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
    backgroundColor: colors.white,
    borderWidth: 2.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.hardSmall,
  },
  circleButtonText: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.ink,
  },
  backdropPill: {
    backgroundColor: colors.lime,
    borderWidth: 2.5,
    borderColor: colors.ink,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    ...theme.shadows.hardSmall,
  },
  backdropPillText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink,
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
    borderWidth: 3,
    borderColor: colors.lime,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#111111',
    ...theme.shadows.hard,
  },
  cameraView: {
    flex: 1,
  },
  simulatedCamera: {
    flex: 1,
    backgroundColor: '#1F2937',
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
    color: colors.lime,
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
    backgroundColor: colors.lime,
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
    color: colors.lime,
  },
  slotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  slotBox: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#334155',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotBoxActive: {
    borderColor: colors.lime,
    backgroundColor: '#14532D',
  },
  slotImage: {
    width: '100%',
    height: '100%',
  },
  slotActiveText: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.lime,
  },
  slotPlaceholderText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748B',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  controlPill: {
    height: 48,
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    ...theme.shadows.hardSmall,
  },
  countPill: {
    flex: 1.2,
    backgroundColor: colors.lime,
  },
  countPillText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.ink,
  },
  whitePill: {
    flex: 1,
    backgroundColor: colors.white,
  },
  whitePillText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink,
  },
});

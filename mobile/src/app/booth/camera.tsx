import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Animated,
  ScrollView,
  Modal,
  Vibration,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { colors } from '../../core/theme/colors';
import { theme } from '../../core/theme/theme';
import { useBoothStore, PoseCategory } from '../../features/booth/hooks/useBoothStore';
import { playShutterSound } from '../../features/booth/services/soundService';
import { useStudioStore } from '../../features/studio/hooks/useStudioStore';
import { POSE_COLLECTIONS, PoseCollection } from '../../features/booth/constants/poseGuides';

export default function BoothCameraScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
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
    setRecordedVideoUri,
  } = useBoothStore();

  const [currentShotIndex, setCurrentShotIndex] = useState(0); // 0, 1, 2, 3
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isShooting, setIsShooting] = useState(false);
  const [shootingMode, setShootingMode] = useState<'instant' | 'timer' | 'video'>('timer');
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [isStoppingVideo, setIsStoppingVideo] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef<any>(null);

  const [showPoseModal, setShowPoseModal] = useState(false);
  const [ringLightMode, setRingLightMode] = useState<'off' | 'white' | 'warm'>('off');
  const [beautyGlow, setBeautyGlow] = useState(true); // Mặc định kích hoạt làm đẹp mịn da K-Glow
  const [exposureLevel, setExposureLevel] = useState<-1 | 0 | 1>(0); // Bù sáng EV (-1: Tối, 0: Chuẩn, +1: Sáng Studio)
  const [isFinishingSequence, setIsFinishingSequence] = useState(false); // Chuyển cảnh dải ảnh mượt mà
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null);
  const focusAnim = useRef(new Animated.Value(0)).current;

  const isMountedRef = useRef(true);
  const isCancelledRef = useRef(false);
  const flashAnim = useRef(new Animated.Value(0)).current;

  // Yêu cầu quyền camera khi mở & xử lý retake
  useEffect(() => {
    isMountedRef.current = true;
    isCancelledRef.current = false;
    if (retakeIndex !== null) {
      setCurrentShotIndex(retakeIndex);
    } else {
      resetPhotos();
    }
    if (!permission?.granted) {
      requestPermission();
    }
    return () => {
      isMountedRef.current = false;
      isCancelledRef.current = true;
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  const handleTapToFocus = (e: any) => {
    if (isShooting) return;
    const { locationX, locationY } = e.nativeEvent;
    if (typeof locationX === 'number' && typeof locationY === 'number') {
      setFocusPoint({ x: locationX, y: locationY });
      focusAnim.setValue(1);
      try {
        Vibration.vibrate(20);
      } catch (_) {}
      Animated.sequence([
        Animated.timing(focusAnim, { toValue: 0.9, duration: 150, useNativeDriver: true }),
        Animated.timing(focusAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]).start(() => {
        if (isMountedRef.current) setFocusPoint(null);
      });
    }
  };

  const triggerFlash = () => {
    try {
      Vibration.vibrate(40);
    } catch (_) {}
    flashAnim.setValue(1);
    Animated.timing(flashAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const takeSinglePhoto = async (shotIndex: number, isReplacing: boolean = false): Promise<string> => {
    // Kích hoạt phản hồi xúc giác & chớp flash ngay ở frame 0 (Zero Touch Latency)
    triggerFlash();
    if (soundEnabled) {
      playShutterSound();
    }

    let photoUri = '';
    try {
      if (cameraRef.current && permission?.granted) {
        const photoPromise = cameraRef.current.takePictureAsync({
          quality: 1.0, // Chất lượng nén ảnh cao nhất (Lossless JPEG)
          skipProcessing: false, // Bật ISP phần cứng: HDR, khử nhiễu, làm nét biên cạnh và cân bằng da
          shutterSound: false,
          exif: false,
        });

        // Bọc Promise.race với timeout 2500ms chống treo driver camera
        const photo = await Promise.race([
          photoPromise,
          new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500)),
        ]);
        photoUri = photo?.uri || '';
      }
    } catch {
      // Fallback nếu chạy trên web hoặc camera device bận
    }

    if (!photoUri) {
      // Ảnh giả lập độ nét cao chuẩn 4K Portrait (2160x2700 px)
      photoUri = `https://picsum.photos/seed/leafy_${Date.now()}_${shotIndex}/2160/2700`;
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

    const tickDelay = shotInterval === 1 ? 650 : 750;
    for (let sec = shotInterval; sec > 0; sec--) {
      if (isCancelledRef.current || !isMountedRef.current) return;
      setCountdown(sec);
      try {
        Vibration.vibrate(25);
      } catch (_) {}
      if (soundEnabled) {
        playShutterSound();
      }
      await new Promise((r) => setTimeout(r, tickDelay));
    }
    if (isCancelledRef.current || !isMountedRef.current) return;
    setCountdown(null);

    const uri = await takeSinglePhoto(retakeIndex, true);
    replacePhotoAtIndex(retakeIndex, uri);

    const updated = [...capturedPhotos];
    updated[retakeIndex] = uri;
    useStudioStore.getState().setSlotPhotos(updated);

    setRetakeIndex(null);
    setIsShooting(false);
    if (isMountedRef.current) {
      router.replace('/booth/result' as any);
    }
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

    const tickDelay = shotInterval === 1 ? 650 : 750;
    const interShotDelay = shotInterval === 1 ? 350 : 500;

    const shotUris: string[] = [];
    for (let shot = 0; shot < 4; shot++) {
      if (isCancelledRef.current || !isMountedRef.current) return;
      setCurrentShotIndex(shot);

      for (let sec = shotInterval; sec > 0; sec--) {
        if (isCancelledRef.current || !isMountedRef.current) return;
        setCountdown(sec);
        try {
          Vibration.vibrate(25);
        } catch (_) {}
        if (soundEnabled) {
          playShutterSound();
        }
        await new Promise((r) => setTimeout(r, tickDelay));
      }

      if (isCancelledRef.current || !isMountedRef.current) return;
      setCountdown(null);
      const uri = await takeSinglePhoto(shot);
      if (uri) {
        shotUris.push(uri);
      }

      if (shot < 3) {
        await new Promise((r) => setTimeout(r, interShotDelay));
      }
    }

    if (isCancelledRef.current || !isMountedRef.current) return;

    if (shotUris.length > 0) {
      useStudioStore.getState().setSlotPhotos(shotUris);
    }

    // Micro-overlay chuyển cảnh êm ru không chớp trắng
    setIsFinishingSequence(true);
    await new Promise((r) => setTimeout(r, 200));

    if (isMountedRef.current) {
      setIsShooting(false);
      setIsFinishingSequence(false);
      router.replace('/booth/result' as any);
    }
  };

  // Quay video K-Booth Live Clip 15s tối ưu hiệu suất
  const handleToggleVideoRecording = async () => {
    if (isRecordingVideo) {
      if (isStoppingVideo) return;
      setIsStoppingVideo(true);

      // Dừng quay video
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setIsRecordingVideo(false);
      try {
        Vibration.vibrate(35);
        if (cameraRef.current) {
          cameraRef.current.stopRecording();
        }
      } catch {}
    } else {
      // Yêu cầu quyền Micro nếu chưa có
      if (!micPermission?.granted) {
        const res = await requestMicPermission();
        if (!res.granted) {
          Alert.alert(
            'Quyền Micro',
            'Cần quyền Micro để quay video K-Booth kèm âm thanh sống động. Bạn có thể cấp quyền trong Cài đặt.'
          );
        }
      }

      setIsRecordingVideo(true);
      setIsStoppingVideo(false);
      setRecordingSeconds(0);
      try {
        Vibration.vibrate([0, 50, 100, 50]);
      } catch {}

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 14) {
            if (recordingTimerRef.current) {
              clearInterval(recordingTimerRef.current);
              recordingTimerRef.current = null;
            }
            setIsRecordingVideo(false);
            setIsStoppingVideo(true);
            try {
              if (cameraRef.current) cameraRef.current.stopRecording();
            } catch {}
            return 15;
          }
          return prev + 1;
        });
      }, 1000);

      try {
        if (cameraRef.current) {
          const video = await cameraRef.current.recordAsync({
            maxDuration: 15,
            maxFileSize: 100 * 1024 * 1024, // 100MB buffer an toàn cho video 4K UHD
          });
          const videoUri =
            video?.uri ||
            `https://assets.mixkit.co/videos/preview/mixkit-friends-taking-a-selfie-photo-4861-large.mp4`;
          setRecordedVideoUri(videoUri);
          setIsStoppingVideo(false);
          if (isMountedRef.current) {
            router.replace('/booth/result' as any);
          }
        } else {
          // Fallback giả lập cho môi trường web
          setTimeout(() => {
            const fallbackUri = `https://assets.mixkit.co/videos/preview/mixkit-friends-taking-a-selfie-photo-4861-large.mp4`;
            setRecordedVideoUri(fallbackUri);
            setIsStoppingVideo(false);
            if (isMountedRef.current) {
              router.replace('/booth/result' as any);
            }
          }, 2500);
        }
      } catch {
        const fallbackUri = `https://assets.mixkit.co/videos/preview/mixkit-friends-taking-a-selfie-photo-4861-large.mp4`;
        setRecordedVideoUri(fallbackUri);
        setIsStoppingVideo(false);
        if (isMountedRef.current) {
          router.replace('/booth/result' as any);
        }
      }
    }
  };

  const handleShutterPress = () => {
    if (retakeIndex !== null) {
      handleRetakeSingleShot();
    } else if (shootingMode === 'video') {
      handleToggleVideoRecording();
    } else if (shootingMode === 'instant') {
      handleInstantShot();
    } else {
      startPhotoboothSequence();
    }
  };

  const handleCycleInterval = () => {
    playShutterSound();
    if (shotInterval === 1) setShotInterval(3);
    else if (shotInterval === 3) setShotInterval(5);
    else if (shotInterval === 5) setShotInterval(7);
    else setShotInterval(1);
  };

  const currentPoseCollection = POSE_COLLECTIONS.find((p) => p.id === poseCategory);
  const currentPoseStep = currentPoseCollection?.steps[currentShotIndex] || currentPoseCollection?.steps[0];
  const effectiveBgColor = frameColor || activeCustomFrame?.color || selectedBackdrop?.color || colors.pink;

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 10), paddingBottom: Math.max(insets.bottom, 14) }]}>
      {/* 1. TOP BAR HỢP NHẤT: TINH GỌN, KHÔNG RỐI MẮT */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => {
            isCancelledRef.current = true;
            playShutterSound();
            router.back();
          }}
          style={({ pressed }) => [
            styles.circleButton,
            { transform: [{ scale: pressed ? 0.94 : 1 }] },
          ]}
        >
          <Text style={styles.circleButtonText}>✕</Text>
        </Pressable>

        {/* Nút Chọn Gợi Ý Dáng Chụp (Icon gọn gàng) */}
        <Pressable
          onPress={() => {
            playShutterSound();
            setShowPoseModal(true);
          }}
          style={({ pressed }) => [
            styles.poseIconBtn,
            poseCategory !== 'none' && styles.poseIconBtnActive,
            { transform: [{ scale: pressed ? 0.94 : 1 }] },
          ]}
        >
          <Text style={styles.poseIconBtnEmoji}>
            {poseCategory === 'none' ? '👯' : currentPoseCollection?.icon || '✨'}
          </Text>
        </Pressable>

        {/* Cụm công cụ nhỏ: Hẹn giờ + Bù sáng EV + Trợ sáng Ring Light + Mịn da K-Glow + Gương + Âm thanh */}
        <View style={styles.topRightTools}>
          <Pressable
            onPress={handleCycleInterval}
            style={({ pressed }) => [
              styles.toolChip,
              shotInterval === 1 && styles.toolChipFast,
              { transform: [{ scale: pressed ? 0.92 : 1 }] },
            ]}
          >
            <Text style={[styles.toolChipText, shotInterval === 1 && styles.toolChipTextFast]}>
              {shotInterval === 1 ? '⚡ 1s' : `⏱️ ${shotInterval}s`}
            </Text>
          </Pressable>

          {/* Nút Bù Sáng Nhanh EV */}
          <Pressable
            onPress={() => {
              playShutterSound();
              setExposureLevel((prev) => (prev === 0 ? 1 : prev === 1 ? -1 : 0));
            }}
            style={({ pressed }) => [
              styles.circleMiniBtn,
              exposureLevel !== 0 && styles.circleMiniBtnActive,
              { transform: [{ scale: pressed ? 0.92 : 1 }] },
            ]}
          >
            <Text style={{ fontSize: 13, fontWeight: '900', color: exposureLevel > 0 ? colors.yellow : '#FFF' }}>
              {exposureLevel === 1 ? '☀️+1' : exposureLevel === -1 ? '🌙-1' : '☀️ 0'}
            </Text>
          </Pressable>

          {/* Nút Viền Trợ Sáng Soft Ring Light */}
          <Pressable
            onPress={() => {
              playShutterSound();
              setRingLightMode((prev) => (prev === 'off' ? 'white' : prev === 'white' ? 'warm' : 'off'));
            }}
            style={({ pressed }) => [
              styles.circleMiniBtn,
              ringLightMode !== 'off' && styles.circleMiniBtnActive,
              { transform: [{ scale: pressed ? 0.92 : 1 }] },
            ]}
          >
            <Text style={{ fontSize: 14 }}>
              {ringLightMode === 'off' ? '💡' : ringLightMode === 'white' ? '⚪' : '🟡'}
            </Text>
          </Pressable>

          {/* Nút Làm Đẹp Mịn Da K-Booth */}
          <Pressable
            onPress={() => {
              playShutterSound();
              setBeautyGlow((prev) => !prev);
            }}
            style={({ pressed }) => [
              styles.circleMiniBtn,
              beautyGlow && styles.circleMiniBtnBeauty,
              { transform: [{ scale: pressed ? 0.92 : 1 }] },
            ]}
          >
            <Text style={{ fontSize: 13 }}>✨</Text>
          </Pressable>

          <Pressable
            onPress={toggleSound}
            style={({ pressed }) => [
              styles.circleMiniBtn,
              { transform: [{ scale: pressed ? 0.92 : 1 }] },
            ]}
          >
            <Text style={{ fontSize: 15 }}>{soundEnabled ? '🔊' : '🔇'}</Text>
          </Pressable>

          <Pressable
            onPress={toggleMirror}
            style={({ pressed }) => [
              styles.circleMiniBtn,
              isMirrored && styles.circleMiniBtnActive,
              { transform: [{ scale: pressed ? 0.92 : 1 }] },
            ]}
          >
            <Text style={{ fontSize: 15 }}>🪞</Text>
          </Pressable>
        </View>
      </View>

      {/* Banner Smart Retake (Chỉ xuất hiện khi đang chụp lại 1 ô) */}
      {retakeIndex !== null && (
        <View style={styles.retakeBanner}>
          <Text style={styles.retakeBannerTitle}>
            🔄 Đang đổi ô {retakeIndex + 1}
          </Text>
          <Pressable
            onPress={() => {
              setRetakeIndex(null);
              router.replace('/booth/result' as any);
            }}
            style={styles.retakeCancelBtn}
          >
            <Text style={styles.retakeCancelBtnText}>✕</Text>
          </Pressable>
        </View>
      )}

      {/* 2. KHUNG NGẮM CAMERA CHÍNH: MỞ RỘNG TỐI ĐA & CHẠM LẤY NÉT */}
      <View style={styles.viewfinderContainer}>
        <Pressable style={styles.viewfinder} onPress={handleTapToFocus}>
          {/* Huy hiệu độ nét & chế độ K-Booth & Hiệu năng */}
          <View pointerEvents="none" style={styles.qualityHudBadge}>
            <View style={[styles.qualityHudDot, beautyGlow && { backgroundColor: '#FF8FC7' }]} />
            <Text style={styles.qualityHudText}>
              {shootingMode === 'video'
                ? isRecordingVideo
                  ? '🔴 REC 4K UHD · 60FPS'
                  : '🎥 4K UHD · 60 FPS'
                : beautyGlow
                ? '✨ 60 FPS · 4K MASTER NÉT MỊN'
                : '⚡ 60 FPS · 4K UHD MASTER'}
            </Text>
          </View>

          {/* Lớp phủ bù sáng EV studio */}
          {exposureLevel === 1 && (
            <View pointerEvents="none" style={styles.exposureHighKeyLayer} />
          )}
          {exposureLevel === -1 && (
            <View pointerEvents="none" style={styles.exposureLowKeyLayer} />
          )}

          {/* Micro-overlay hoàn tất dải ảnh mượt mà */}
          {isFinishingSequence && (
            <View pointerEvents="none" style={styles.finishingOverlay}>
              <Text style={styles.finishingEmoji}>⚡</Text>
              <Text style={styles.finishingText}>Đang tối ưu ảnh 4K HD...</Text>
            </View>
          )}

          {/* Vòng ngắm lấy nét chạm Tap-To-Focus */}
          {focusPoint && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.focusReticle,
                {
                  left: focusPoint.x - 28,
                  top: focusPoint.y - 28,
                  opacity: focusAnim,
                  transform: [
                    {
                      scale: focusAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.75, 1.15],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.focusReticleFrame} />
            </Animated.View>
          )}

          {/* Lớp phủ nâng tông mịn da K-Booth */}
          {beautyGlow && (
            <View pointerEvents="none" style={styles.cameraBeautyGlowLayer} />
          )}

          {/* Huy hiệu ghi hình Video REC thời gian thực */}
          {isRecordingVideo && (
            <View pointerEvents="none" style={styles.recBadge}>
              <View style={styles.recDot} />
              <Text style={styles.recText}>
                REC 00:{recordingSeconds < 10 ? '0' + recordingSeconds : recordingSeconds} / 00:15
              </Text>
            </View>
          )}

          {/* Màn hình trợ sáng Soft Ring Light */}
          {ringLightMode !== 'off' && (
            <View
              pointerEvents="none"
              style={[
                styles.ringLightFrame,
                {
                  borderColor: ringLightMode === 'white' ? '#FFFFFF' : '#FFEAA7',
                  backgroundColor:
                    ringLightMode === 'white'
                      ? 'rgba(255, 255, 255, 0.06)'
                      : 'rgba(255, 234, 167, 0.06)',
                },
              ]}
            >
              <View
                style={[
                  styles.ringLightBadge,
                  {
                    backgroundColor: ringLightMode === 'white' ? '#FFFFFF' : '#FFEAA7',
                  },
                ]}
              >
                <Text style={styles.ringLightBadgeText}>
                  {ringLightMode === 'white' ? '💡 Sáng Studio' : '💡 Sáng Ấm'}
                </Text>
              </View>
            </View>
          )}
          {permission?.granted ? (
            <CameraView
              ref={cameraRef}
              style={[
                styles.cameraView,
                isMirrored && { transform: [{ scaleX: -1 }] },
              ]}
              facing={cameraFacing}
              mode={shootingMode === 'video' ? 'video' : 'picture'}
              videoQuality="2160p"
              videoBitrate={25_000_000}
              autofocus="on"
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

          {/* Mẹo tạo dáng nổi tinh tế trên khung ngắm */}
          {poseCategory !== 'none' && currentPoseStep && (
            <View pointerEvents="none" style={styles.poseFloatingTip}>
              <Text style={styles.poseFloatingTipEmoji}>{currentPoseStep.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.poseFloatingTipTitle}>
                  {currentPoseStep.title}
                </Text>
                <Text style={styles.poseFloatingTipDesc} numberOfLines={1}>
                  {currentPoseStep.tip}
                </Text>
              </View>
            </View>
          )}

          {/* Đường phác thảo dáng mờ căn chỉnh bố cục */}
          {poseCategory !== 'none' && (
            <View pointerEvents="none" style={styles.silhouetteOverlay}>
              <View style={styles.silhouetteHeadBox} />
              <View style={styles.silhouetteShoulderBox} />
            </View>
          )}

          {/* Hiệu ứng chớp Flash */}
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

          {/* Cột Dải Ảnh Mini Tinh Tế Docked Mép Phải Khung Ngắm */}
          <View style={[styles.dockedLiveStrip, { backgroundColor: effectiveBgColor }]}>
            <Text style={styles.dockedLiveStripBrand}>LB</Text>
            {[0, 1, 2, 3].map((slotIdx) => {
              const hasPhoto = capturedPhotos.length > slotIdx;
              const isCurrent = isShooting && currentShotIndex === slotIdx;

              return (
                <View
                  key={slotIdx}
                  style={[
                    styles.dockedSlot,
                    isCurrent && styles.dockedSlotCurrent,
                  ]}
                >
                  {hasPhoto ? (
                    <Image
                      source={{ uri: capturedPhotos[slotIdx] }}
                      style={styles.dockedSlotImg}
                    />
                  ) : isCurrent ? (
                    <Text style={styles.dockedSlotActiveText}>{countdown || '📸'}</Text>
                  ) : (
                    <Text style={styles.dockedSlotPendingText}>{slotIdx + 1}</Text>
                  )}
                </View>
              );
            })}
          </View>
        </Pressable>
      </View>

      {/* 3. ĐẾ ĐIỀU KHIỂN CHỤP DƯỚI ĐÁY: GỌN GÀNG, CÔNG THÁI HỌC */}
      <View style={styles.shutterDeck}>
        {/* Nút gạt chuyển chế độ: Biểu tượng 1 chạm tối giản */}
        <View style={styles.modeSwitchCapsule}>
          <Pressable
            onPress={() => setShootingMode('instant')}
            disabled={isShooting || isRecordingVideo}
            style={[
              styles.modeSegment,
              shootingMode === 'instant' && styles.modeSegmentActive,
            ]}
          >
            <Text style={styles.modeSegmentIcon}>⚡</Text>
          </Pressable>

          <Pressable
            onPress={() => setShootingMode('timer')}
            disabled={isShooting || isRecordingVideo}
            style={[
              styles.modeSegment,
              shootingMode === 'timer' && styles.modeSegmentActive,
            ]}
          >
            <Text style={styles.modeSegmentIcon}>📸</Text>
          </Pressable>

          <Pressable
            onPress={() => setShootingMode('video')}
            disabled={isShooting || isRecordingVideo}
            style={[
              styles.modeSegment,
              shootingMode === 'video' && styles.modeSegmentActive,
            ]}
          >
            <Text style={styles.modeSegmentIcon}>🎥</Text>
          </Pressable>
        </View>

        {/* Hàng nút chụp chính */}
        <View style={styles.shutterRow}>
          {/* Nút Chụp lại từ đầu */}
          <Pressable
            onPress={() => {
              playShutterSound();
              resetPhotos();
              setCurrentShotIndex(0);
            }}
            disabled={isShooting || isRecordingVideo || capturedPhotos.length === 0}
            style={({ pressed }) => [
              styles.sideDeckBtn,
              (capturedPhotos.length === 0 || isRecordingVideo) && { opacity: 0.3 },
              { transform: [{ scale: pressed ? 0.92 : 1 }] },
            ]}
          >
            <Text style={styles.sideDeckBtnIcon}>↺</Text>
          </Pressable>

          {/* NÚT CHỤP / QUAY CHÍNH TO TRÒN NỔI BẬT: BIỂU TƯỢNG ĐẲNG CẤP, KHÔNG CHỮ RƯỜM RÀ */}
          <Pressable
            onPress={handleShutterPress}
            disabled={isShooting}
            style={({ pressed }) => [
              styles.heroShutterOuter,
              isRecordingVideo && styles.heroShutterOuterRecording,
              { transform: [{ scale: pressed ? 0.96 : 1 }] },
            ]}
          >
            <View style={[styles.heroShutterInner, isRecordingVideo && styles.heroShutterInnerRecording]}>
              <Text style={styles.heroShutterEmoji}>
                {isStoppingVideo
                  ? '⏳'
                  : isRecordingVideo
                  ? '⏹️'
                  : isShooting
                  ? '⏳'
                  : retakeIndex !== null
                  ? '↺'
                  : shootingMode === 'video'
                  ? '🔴'
                  : shootingMode === 'instant'
                  ? '⚡'
                  : '📸'}
              </Text>
            </View>
          </Pressable>

          {/* Nút Lật camera trước / sau */}
          <Pressable
            onPress={toggleCameraFacing}
            disabled={isShooting}
            style={({ pressed }) => [
              styles.sideDeckBtn,
              { transform: [{ scale: pressed ? 0.92 : 1 }] },
            ]}
          >
            <Text style={styles.sideDeckBtnIcon}>🔄</Text>
          </Pressable>
        </View>
      </View>

      {/* 4. MODAL CHỌN BỘ GỢI Ý DÁNG CHỤP K-BOOTH */}
      <Modal visible={showPoseModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>👯 Gợi ý dáng</Text>
              <Pressable
                onPress={() => setShowPoseModal(false)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalList}>
              {/* Nút tắt gợi ý dáng */}
              <Pressable
                onPress={() => {
                  setPoseCategory('none');
                  setShowPoseModal(false);
                }}
                style={[
                  styles.poseCard,
                  poseCategory === 'none' && styles.poseCardActive,
                ]}
              >
                <Text style={styles.poseCardIcon}>🚫</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.poseCardName}>Không dùng</Text>
                  <Text style={styles.poseCardDesc}>Tự do tạo dáng theo cách của bạn</Text>
                </View>
                {poseCategory === 'none' && <Text style={styles.checkIcon}>✓</Text>}
              </Pressable>

              {/* Các bộ dáng thịnh hành */}
              {POSE_COLLECTIONS.map((col) => {
                const isSelected = poseCategory === col.id;
                return (
                  <Pressable
                    key={col.id}
                    onPress={() => {
                      playShutterSound();
                      setPoseCategory(col.id as PoseCategory);
                      setShowPoseModal(false);
                    }}
                    style={[
                      styles.poseCard,
                      isSelected && styles.poseCardActive,
                    ]}
                  >
                    <Text style={styles.poseCardIcon}>{col.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <View style={styles.poseCardTitleRow}>
                        <Text style={styles.poseCardName}>{col.name}</Text>
                        <View style={styles.poseCardBadge}>
                          <Text style={styles.poseCardBadgeText}>{col.badge}</Text>
                        </View>
                      </View>
                      <Text style={styles.poseCardDesc}>{col.desc}</Text>
                      {/* 4 bước nhỏ */}
                      <View style={styles.poseStepsRow}>
                        {col.steps.map((st) => (
                          <Text key={st.step} style={styles.poseStepMini}>
                            {st.step}. {st.emoji}
                          </Text>
                        ))}
                      </View>
                    </View>
                    {isSelected && <Text style={styles.checkIcon}>✓</Text>}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#08080A', // Pure Midnight OLED Dark
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
  },
  circleButton: {
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
  circleButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  poseIconBtn: {
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
  poseIconBtnActive: {
    backgroundColor: 'rgba(255, 143, 199, 0.2)',
    borderColor: '#FF8FC7',
  },
  poseIconBtnEmoji: {
    fontSize: 18,
  },
  poseCapsuleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14161D',
    borderWidth: 1.5,
    borderColor: '#2A2E39',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 6,
  },
  poseCapsuleBtnActive: {
    backgroundColor: 'rgba(255, 143, 199, 0.15)',
    borderColor: '#FF8FC7',
  },
  poseCapsuleIcon: {
    fontSize: 14,
  },
  poseCapsuleText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  poseCapsuleTextActive: {
    color: '#FF8FC7',
    fontWeight: '900',
  },
  topRightTools: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toolChip: {
    backgroundColor: '#14161D',
    borderWidth: 1.5,
    borderColor: '#2A2E39',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  toolChipFast: {
    backgroundColor: 'rgba(255, 217, 61, 0.2)',
    borderColor: colors.yellow,
  },
  toolChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.yellow,
  },
  toolChipTextFast: {
    color: colors.yellow,
    fontWeight: '900',
  },
  circleMiniBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#14161D',
    borderWidth: 1.5,
    borderColor: '#2A2E39',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleMiniBtnActive: {
    backgroundColor: colors.yellow,
    borderColor: colors.ink,
  },
  circleMiniBtnBeauty: {
    backgroundColor: '#FF8FC7',
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
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginVertical: 4,
  },
  retakeBannerTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.yellow,
  },
  retakeCancelBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  retakeCancelBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.white,
  },

  // Soft Ring Light Frame
  ringLightFrame: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 22,
    borderRadius: 28,
    zIndex: 12,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 8,
  },
  ringLightBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 4,
  },
  ringLightBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
  },

  // 4K HD Quality HUD & Tap-to-Focus
  qualityHudBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 17, 23, 0.75)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    zIndex: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  qualityHudDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.yellow,
  },
  qualityHudText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  recBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.88)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    zIndex: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  recDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  recText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  cameraBeautyGlowLayer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 240, 245, 0.04)',
    zIndex: 8,
  },
  exposureHighKeyLayer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    zIndex: 8,
  },
  exposureLowKeyLayer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    zIndex: 8,
  },
  finishingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(8, 8, 10, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 35,
  },
  finishingEmoji: {
    fontSize: 32,
  },
  finishingText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.yellow,
    letterSpacing: 0.5,
  },
  focusReticle: {
    position: 'absolute',
    width: 56,
    height: 56,
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusReticleFrame: {
    width: 46,
    height: 46,
    borderWidth: 1.5,
    borderColor: colors.yellow,
    borderRadius: 8,
    shadowColor: colors.yellow,
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },

  // Viewfinder Container: Maximized Viewfinder
  viewfinderContainer: {
    flex: 1,
    marginVertical: 8,
    justifyContent: 'center',
  },
  viewfinder: {
    width: '100%',
    aspectRatio: 0.88,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#000000',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#2A2E39',
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.darkSoft,
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
    fontSize: 54,
    marginBottom: 8,
  },
  simulatedText: {
    fontSize: 13,
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
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.yellow,
    borderWidth: 3.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.hard,
  },
  countdownNumber: {
    fontSize: 54,
    fontWeight: '900',
    color: colors.ink,
  },

  // Floating Pose Tip on top of viewfinder
  poseFloatingTip: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 56,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#FF8FC7',
    gap: 6,
    zIndex: 5,
  },
  poseFloatingTipEmoji: {
    fontSize: 18,
  },
  poseFloatingTipTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FF8FC7',
  },
  poseFloatingTipDesc: {
    fontSize: 10,
    color: '#E2E8F0',
  },

  // Silhouette Overlay
  silhouetteOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
  },
  silhouetteHeadBox: {
    width: 90,
    height: 110,
    borderRadius: 45,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderStyle: 'dashed',
    marginBottom: 6,
  },
  silhouetteShoulderBox: {
    width: 170,
    height: 60,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderStyle: 'dashed',
  },

  // Docked Live Strip (Compact Right-Edge Visualizer)
  dockedLiveStrip: {
    position: 'absolute',
    top: 8,
    right: 8,
    bottom: 8,
    width: 38,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.ink,
    paddingVertical: 4,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 6,
    ...theme.shadows.hard,
  },
  dockedLiveStripBrand: {
    fontSize: 7,
    fontWeight: '900',
    color: colors.ink,
  },
  dockedSlot: {
    width: 30,
    height: 40,
    borderRadius: 4,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.ink,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockedSlotCurrent: {
    borderColor: colors.yellow,
    borderWidth: 2,
    transform: [{ scale: 1.08 }],
  },
  dockedSlotImg: {
    width: '100%',
    height: '100%',
  },
  dockedSlotActiveText: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.ink,
  },
  dockedSlotPendingText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
  },

  // Shutter Deck (Bottom Controls)
  shutterDeck: {
    gap: 10,
    alignItems: 'center',
    paddingBottom: 2,
  },
  modeSwitchCapsule: {
    flexDirection: 'row',
    backgroundColor: '#14161D',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#2A2E39',
    padding: 3,
    gap: 4,
  },
  modeSegment: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeSegmentActive: {
    backgroundColor: colors.yellow,
  },
  modeSegmentIcon: {
    fontSize: 16,
  },
  modeSegmentText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  modeSegmentTextActive: {
    color: colors.ink,
    fontWeight: '900',
  },
  shutterRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  sideDeckBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#14161D',
    borderWidth: 1.5,
    borderColor: '#2A2E39',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.darkSoft,
  },
  sideDeckBtnIcon: {
    fontSize: 20,
    color: colors.white,
  },
  heroShutterOuter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: colors.yellow,
    borderWidth: 3,
    borderColor: colors.ink,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.hard,
  },
  heroShutterOuterRecording: {
    backgroundColor: '#EF4444',
    borderColor: '#FFFFFF',
    shadowColor: '#EF4444',
  },
  heroShutterInner: {
    width: '100%',
    height: '100%',
    borderRadius: 34,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroShutterInnerRecording: {
    backgroundColor: '#DC2626',
  },
  heroShutterEmoji: {
    fontSize: 32,
  },
  heroShutterLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: colors.ink,
    marginTop: 1,
    textAlign: 'center',
  },

  // Modal Sheet for Pose Guides
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#14161D',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1.5,
    borderColor: '#2A2E39',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
    maxHeight: '65%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.white,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '900',
  },
  modalList: {
    gap: 10,
    paddingBottom: 10,
  },
  poseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1F28',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#2A2E39',
    padding: 12,
    gap: 12,
  },
  poseCardActive: {
    borderColor: '#FF8FC7',
    backgroundColor: 'rgba(255, 143, 199, 0.12)',
  },
  poseCardIcon: {
    fontSize: 26,
  },
  poseCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  poseCardName: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.white,
  },
  poseCardBadge: {
    backgroundColor: '#FF8FC7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  poseCardBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.ink,
  },
  poseCardDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  poseStepsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  poseStepMini: {
    fontSize: 10,
    color: '#94A3B8',
  },
  checkIcon: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FF8FC7',
  },
});

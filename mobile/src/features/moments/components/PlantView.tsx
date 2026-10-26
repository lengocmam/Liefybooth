import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Animated,
  ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { colors } from '../../../core/theme/colors';
import { theme } from '../../../core/theme/theme';
import { useMomentsStore } from '../hooks/useMomentsStore';
import { playShutterSound } from '../../booth/services/soundService';

export const PlantView: React.FC = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);

  const {
    friends,
    selectedRecipientIds,
    isAllSelected,
    toggleSelectAll,
    toggleSelectFriend,
    sendMoment,
    setViewMode,
  } = useMomentsStore();

  const [caption, setCaption] = useState('');
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const [flash, setFlash] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sentToast, setSentToast] = useState(false);

  const flashAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  const triggerScreenFlash = () => {
    flashAnim.setValue(1);
    Animated.timing(flashAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const handleCaptureAndSend = async () => {
    if (isSending) return;
    setIsSending(true);
    triggerScreenFlash();
    playShutterSound();

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
      // Fallback khi chạy web dev
    }

    if (!photoUri) {
      photoUri = `https://picsum.photos/seed/moment_${Date.now()}/500/500`;
    }

    sendMoment(photoUri, caption);
    setCaption('');
    setSentToast(true);

    setTimeout(() => {
      setSentToast(false);
      setIsSending(false);
    }, 2000);
  };

  const toggleFacing = () => {
    setFacing(prev => (prev === 'front' ? 'back' : 'front'));
  };

  const toggleFlashState = () => {
    setFlash(prev => !prev);
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <Text style={styles.topTitle}>Khoảnh khắc</Text>
        <View style={styles.topRightRow}>
          <View style={styles.friendsPill}>
            <Text style={styles.friendsPillText}>12/20 bạn</Text>
          </View>
          <Pressable
            onPress={() => setViewMode('pick')}
            style={({ pressed }) => [
              styles.switchViewPill,
              { transform: [{ scale: pressed ? 0.95 : 1 }] },
            ]}
          >
            <Text style={styles.switchViewPillText}>📬 Hộp ảnh</Text>
          </Pressable>
        </View>
      </View>

      {/* 1:1 Camera Viewfinder */}
      <View style={styles.viewfinderContainer}>
        <View style={styles.viewfinder}>
          {permission?.granted ? (
            <CameraView
              ref={cameraRef}
              style={[
                styles.cameraView,
                facing === 'front' && { transform: [{ scaleX: -1 }] },
              ]}
              facing={facing}
            />
          ) : (
            <View style={styles.simulatedCamera}>
              <Text style={styles.cameraIcon}>🌿</Text>
              <Text style={styles.simulatedNotice}>Camera Plant vuông 1:1</Text>
            </View>
          )}

          {/* Flash chớp sáng */}
          <Animated.View
            pointerEvents="none"
            style={[styles.flashOverlay, { opacity: flashAnim }]}
          />

          {/* Icon Flash trên góc trái */}
          <Pressable
            onPress={toggleFlashState}
            style={[styles.cameraTopButton, styles.flashButton, flash && styles.flashButtonActive]}
          >
            <Text style={styles.cameraTopButtonText}>{flash ? '⚡' : '🌩'}</Text>
          </Pressable>

          {/* Zoom 1x góc phải */}
          <View style={[styles.cameraTopButton, styles.zoomPill]}>
            <Text style={styles.zoomText}>1×</Text>
          </View>

          {/* Ô nhập chú thích nổi ở đáy khung ngắm */}
          <View style={styles.captionInputWrapper}>
            <TextInput
              style={styles.captionInput}
              placeholder="Thêm vài chữ..."
              placeholderTextColor="#6B7280"
              value={caption}
              onChangeText={setCaption}
              maxLength={80}
            />
          </View>
        </View>

        {/* Thông báo gửi thành công */}
        {sentToast && (
          <View style={styles.toastCard}>
            <Text style={styles.toastText}>
              ✓ Đã gửi cho {isAllSelected ? 'Tất cả bạn bè' : `${selectedRecipientIds.length} bạn`}!
            </Text>
          </View>
        )}
      </View>

      {/* Shutter & Camera Controls Row */}
      <View style={styles.shutterRow}>
        {/* Nút Thư viện */}
        <Pressable
          style={({ pressed }) => [
            styles.sideActionButton,
            { transform: [{ scale: pressed ? 0.95 : 1 }] },
          ]}
        >
          <View style={styles.galleryIcon}>
            <View style={styles.miniSun} />
            <View style={styles.miniWave} />
          </View>
        </Pressable>

        {/* Nút chụp to tròn chính giữa */}
        <Pressable
          onPress={handleCaptureAndSend}
          disabled={isSending}
          style={({ pressed }) => [
            styles.shutterOuterRing,
            { transform: [{ scale: pressed ? 0.92 : 1 }] },
          ]}
        >
          <View style={styles.shutterInnerButton} />
        </Pressable>

        {/* Nút Đổi camera */}
        <Pressable
          onPress={toggleFacing}
          style={({ pressed }) => [
            styles.sideActionButton,
            { transform: [{ scale: pressed ? 0.95 : 1 }] },
          ]}
        >
          <Text style={styles.flipCameraIcon}>🔄</Text>
        </Pressable>
      </View>

      {/* Gửi cho (Recipients Row) */}
      <View style={styles.recipientsSection}>
        <Text style={styles.recipientsLabel}>Gửi cho</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recipientsScroll}
        >
          {/* Tất cả */}
          <Pressable
            onPress={toggleSelectAll}
            style={styles.recipientItem}
          >
            <View
              style={[
                styles.recipientCircle,
                isAllSelected ? styles.recipientSelected : styles.recipientUnselected,
              ]}
            >
              <Text style={styles.checkmarkIcon}>✓</Text>
            </View>
            <Text style={[styles.recipientName, isAllSelected && styles.recipientNameActive]}>
              Tất cả
            </Text>
          </Pressable>

          {/* Từng bạn bè */}
          {friends.map(friend => {
            const isSelected = !isAllSelected && selectedRecipientIds.includes(friend.id);
            return (
              <Pressable
                key={friend.id}
                onPress={() => toggleSelectFriend(friend.id)}
                style={styles.recipientItem}
              >
                <View
                  style={[
                    styles.recipientCircle,
                    { backgroundColor: friend.avatarColor },
                    isSelected && styles.recipientCircleActive,
                  ]}
                >
                  <Text style={styles.friendLetter}>{friend.avatarLetter}</Text>
                  {isSelected && (
                    <View style={styles.smallBadgeCheck}>
                      <Text style={styles.miniCheck}>✓</Text>
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    styles.recipientName,
                    isSelected && styles.recipientNameActive,
                  ]}
                  numberOfLines={1}
                >
                  {friend.name}
                </Text>
              </Pressable>
            );
          })}

          {/* Nút Thêm bạn */}
          <Pressable style={styles.recipientItem}>
            <View style={styles.addFriendCircle}>
              <Text style={styles.addFriendPlus}>+</Text>
            </View>
            <Text style={styles.recipientName}>Thêm</Text>
          </Pressable>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B3D2E', // Màu xanh rừng đặc trưng
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  topTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: -0.5,
  },
  topRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  friendsPill: {
    backgroundColor: colors.lime,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.ink,
    paddingHorizontal: 12,
    paddingVertical: 5,
    ...theme.shadows.hardSmall,
  },
  friendsPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.ink,
  },
  switchViewPill: {
    backgroundColor: colors.pink,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.ink,
    paddingHorizontal: 12,
    paddingVertical: 5,
    ...theme.shadows.hardSmall,
  },
  switchViewPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.ink,
  },
  viewfinderContainer: {
    alignItems: 'center',
    position: 'relative',
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
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    fontSize: 56,
    marginBottom: 8,
  },
  simulatedNotice: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.lime,
  },
  flashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#FFFFFF',
    zIndex: 10,
  },
  cameraTopButton: {
    position: 'absolute',
    top: 14,
    zIndex: 5,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.hardSmall,
  },
  flashButton: {
    left: 14,
    width: 36,
    height: 36,
  },
  flashButtonActive: {
    backgroundColor: colors.yellow,
  },
  cameraTopButtonText: {
    fontSize: 16,
  },
  zoomPill: {
    right: 14,
    width: 44,
    height: 32,
  },
  zoomText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.ink,
  },
  captionInputWrapper: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 14,
    zIndex: 5,
  },
  captionInput: {
    backgroundColor: colors.white,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.ink,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
    ...theme.shadows.hardSmall,
  },
  toastCard: {
    position: 'absolute',
    top: 20,
    backgroundColor: colors.lime,
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: colors.ink,
    paddingHorizontal: 18,
    paddingVertical: 8,
    zIndex: 20,
    ...theme.shadows.hard,
  },
  toastText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink,
  },
  shutterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginVertical: 4,
  },
  sideActionButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.white,
    borderWidth: 2.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.hardSmall,
  },
  galleryIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.ink,
    backgroundColor: '#FFCC80',
    overflow: 'hidden',
    position: 'relative',
  },
  miniSun: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FB8C00',
    position: 'absolute',
    top: 3,
    right: 4,
  },
  miniWave: {
    height: 12,
    backgroundColor: '#F57C00',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 6,
  },
  shutterOuterRing: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 4,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  shutterInnerButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.lime,
    borderWidth: 2.5,
    borderColor: colors.ink,
    ...theme.shadows.hardSmall,
  },
  flipCameraIcon: {
    fontSize: 22,
  },
  recipientsSection: {
    marginBottom: 8,
  },
  recipientsLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
    marginBottom: 8,
  },
  recipientsScroll: {
    flexDirection: 'row',
    gap: 14,
    paddingBottom: 4,
  },
  recipientItem: {
    alignItems: 'center',
    width: 54,
  },
  recipientCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...theme.shadows.hardSmall,
  },
  recipientSelected: {
    backgroundColor: colors.lime,
  },
  recipientUnselected: {
    backgroundColor: colors.white,
  },
  recipientCircleActive: {
    borderWidth: 3.5,
  },
  checkmarkIcon: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.ink,
  },
  friendLetter: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.ink,
  },
  smallBadgeCheck: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.lime,
    borderWidth: 1.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniCheck: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.ink,
  },
  addFriendCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.white,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  addFriendPlus: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.white,
  },
  recipientName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
    marginTop: 4,
    textAlign: 'center',
  },
  recipientNameActive: {
    color: colors.lime,
    fontWeight: '900',
  },
});

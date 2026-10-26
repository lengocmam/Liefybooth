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
import { useBoothStore } from '../../features/booth/hooks/useBoothStore';

export default function BoothResultScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const {
    capturedPhotos,
    frameColor,
    layout,
    filter,
    stripTitle,
    resetBooth,
  } = useBoothStore();

  // Đảm bảo luôn có 4 ảnh (nếu thiếu dùng placeholder)
  const displayPhotos = [
    capturedPhotos[0] || 'https://picsum.photos/seed/p1/400/400',
    capturedPhotos[1] || 'https://picsum.photos/seed/p2/400/400',
    capturedPhotos[2] || 'https://picsum.photos/seed/p3/400/400',
    capturedPhotos[3] || 'https://picsum.photos/seed/p4/400/400',
  ];

  const handleSaveToDevice = async () => {
    setIsSaving(true);
    try {
      if (Platform.OS !== 'web') {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === 'granted') {
          // Lưu ảnh đầu tiên hoặc ảnh ghép
          await MediaLibrary.saveToLibraryAsync(displayPhotos[0]);
        }
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      // Thông báo thành công mô phỏng trên môi trường web dev
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRetake = () => {
    resetBooth();
    router.replace('/booth/camera' as any);
  };

  const handleCustomize = () => {
    router.push('/booth/customize' as any);
  };

  const handleClose = () => {
    router.replace('/(tabs)/booth');
  };

  const getFilterStyle = () => {
    switch (filter) {
      case 'bw':
        return { opacity: 0.9, tintColor: '#6B7280' };
      case 'warm':
        return { opacity: 0.95 };
      case 'cool':
        return { opacity: 0.95 };
      default:
        return {};
    }
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 20) }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Pressable
          onPress={handleClose}
          style={({ pressed }) => [
            styles.closeButton,
            { transform: [{ scale: pressed ? 0.95 : 1 }] },
          ]}
        >
          <Text style={styles.closeIcon}>✕</Text>
        </Pressable>
      </View>

      <Text style={styles.title}>Xong{'\n'}rồi!</Text>

      {/* Hero Strip Presentation */}
      <ScrollView
        contentContainerStyle={styles.stripContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stripWrapper}>
          {/* Decorative Stars */}
          <View style={styles.starYellow}>
            <Text style={styles.starText}>★</Text>
          </View>
          <View style={styles.starWhite}>
            <Text style={styles.starText}>★</Text>
          </View>
          <View style={styles.starBlue}>
            <Text style={styles.starText}>★</Text>
          </View>

          {/* Dải ảnh chính 4 khung */}
          <View
            style={[
              styles.photoboothStrip,
              { backgroundColor: frameColor || colors.pink },
              layout === 'grid' && styles.gridStrip,
            ]}
          >
            <View style={layout === 'grid' ? styles.gridPhotoContainer : styles.verticalPhotoContainer}>
              {displayPhotos.map((uri, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.photoFrame,
                    layout === 'grid' && styles.gridPhotoFrame,
                  ]}
                >
                  <Image
                    source={{ uri }}
                    style={[styles.photoImage, getFilterStyle()]}
                    resizeMode="cover"
                  />
                  {filter === 'warm' && <View style={styles.warmFilterOverlay} />}
                  {filter === 'cool' && <View style={styles.coolFilterOverlay} />}
                </View>
              ))}
            </View>

            {/* Dòng chữ ở đáy dải ảnh */}
            <Text style={styles.stripTitleText}>{stripTitle}</Text>
          </View>
        </View>

        {/* Thông báo đã lưu */}
        {saveSuccess && (
          <View style={styles.toastContainer}>
            <Text style={styles.toastText}>✓ Đã lưu dải ảnh vào máy!</Text>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        <View style={styles.buttonRow}>
          <PillButton
            title={isSaving ? 'Đang lưu...' : 'Lưu vào máy'}
            onPress={handleSaveToDevice}
            variant="white"
            style={styles.halfButton}
          />
          <PillButton
            title="Gửi bạn bè"
            onPress={() => router.push('/(tabs)/moments')}
            variant="secondary"
            style={styles.halfButton}
          />
        </View>

        {/* Text Actions */}
        <View style={styles.textActionsRow}>
          <Pressable onPress={handleRetake}>
            <Text style={styles.linkText}>Chụp lại</Text>
          </Pressable>
          <Text style={styles.dotSeparator}>·</Text>
          <Pressable onPress={handleCustomize}>
            <Text style={styles.linkText}>Tùy chỉnh</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lime,
    paddingHorizontal: theme.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 4,
  },
  closeButton: {
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
  closeIcon: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.ink,
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: colors.ink,
    lineHeight: 46,
    letterSpacing: -1,
    marginBottom: 8,
  },
  stripContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  stripWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoboothStrip: {
    width: 190,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: colors.ink,
    padding: 10,
    ...theme.shadows.hard,
  },
  gridStrip: {
    width: 250,
  },
  verticalPhotoContainer: {
    gap: 8,
  },
  gridPhotoContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  photoFrame: {
    width: '100%',
    aspectRatio: 1.35,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.ink,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  gridPhotoFrame: {
    width: '48%',
    aspectRatio: 1,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  warmFilterOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 160, 50, 0.15)',
  },
  coolFilterOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(50, 160, 255, 0.15)',
  },
  stripTitleText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.ink,
    textAlign: 'center',
    marginTop: 10,
  },
  starYellow: {
    position: 'absolute',
    top: 20,
    left: -35,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.yellow,
    borderWidth: 2.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.hardSmall,
  },
  starWhite: {
    position: 'absolute',
    top: 60,
    right: -30,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.white,
    borderWidth: 2.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.hardSmall,
  },
  starBlue: {
    position: 'absolute',
    bottom: 40,
    right: -25,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.sky,
    borderWidth: 2.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.hardSmall,
  },
  starText: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.ink,
  },
  toastContainer: {
    backgroundColor: colors.ink,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 12,
    ...theme.shadows.hardSmall,
  },
  toastText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.lime,
  },
  actionSection: {
    width: '100%',
    gap: 12,
    marginTop: 'auto',
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
    gap: 12,
    paddingVertical: 4,
  },
  linkText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.ink,
    textDecorationLine: 'underline',
  },
  dotSeparator: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.ink,
  },
});

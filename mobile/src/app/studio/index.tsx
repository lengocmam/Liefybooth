import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  Alert,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '../../core/theme/colors';
import { theme } from '../../core/theme/theme';
import { useStudioStore } from '../../features/studio/hooks/useStudioStore';

type StudioTab = 'bg' | 'image' | 'sticker' | 'text' | 'color';

const PALETTE_COLORS = [
  { id: 'pink', color: colors.pink, name: 'Hồng' },
  { id: 'yellow', color: colors.yellow, name: 'Vàng' },
  { id: 'sky', color: colors.sky, name: 'Xanh trời' },
  { id: 'orange', color: colors.orange, name: 'Cam' },
  { id: 'mint', color: colors.mint, name: 'Bạc hà' },
  { id: 'cobalt', color: colors.cobalt, name: 'Cobalt' },
  { id: 'forest', color: colors.forestGreen, name: 'Xanh rừng' },
  { id: 'white', color: colors.white, name: 'Trắng' },
  { id: 'ink', color: colors.ink, name: 'Đen' },
];

const STICKER_LIBRARY = ['🍂', '🍁', '✨', '🌿', '⭐', '🎃', '❤️', '🌸', '⚡', '☕', '🎂', '🎉', '🍀', '🍓'];

const SAMPLE_TEXTURES = [
  'https://picsum.photos/seed/texture_leaves/400/800',
  'https://picsum.photos/seed/texture_clouds/400/800',
  'https://picsum.photos/seed/texture_stars/400/800',
];

export default function FrameStudioScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    frameName,
    setFrameName,
    backgroundColor,
    setBackgroundColor,
    uploadedImage,
    setUploadedImage,
    imageOpacity,
    setImageOpacity,
    stickers,
    addSticker,
    removeSticker,
    customText,
    setCustomText,
    borderColor,
    setBorderColor,
    isPublic,
    setIsPublic,
  } = useStudioStore();

  const [activeTab, setActiveTab] = useState<StudioTab>('bg');

  const handlePublish = () => {
    if (!frameName.trim()) {
      Alert.alert('Chưa đặt tên', 'Vui lòng nhập tên cho frame của bạn.');
      return;
    }

    Alert.alert(
      'Xuất bản thành công! 🎉',
      isPublic
        ? `Frame "${frameName}" đã được tải lên và sẵn sàng xuất hiện trên Bảng xếp hạng Xu hướng!`
        : `Frame "${frameName}" đã được lưu vào bộ sưu tập cá nhân của bạn.`,
      [
        {
          text: 'Xem trên Xu hướng',
          onPress: () => router.push('/trending' as any),
        },
        {
          text: 'Xong',
          onPress: () => router.back(),
        },
      ]
    );
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: Math.max(insets.top, 14), paddingBottom: Math.max(insets.bottom, 16) },
      ]}
    >
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.cancelButton,
            { transform: [{ scale: pressed ? 0.95 : 1 }] },
          ]}
        >
          <Text style={styles.cancelText}>Hủy</Text>
        </Pressable>

        <Text style={styles.headerTitle}>Frame của tôi</Text>

        <Pressable
          onPress={handlePublish}
          style={({ pressed }) => [
            styles.publishButton,
            { transform: [{ scale: pressed ? 0.95 : 1 }] },
          ]}
        >
          <Text style={styles.publishText}>Đăng</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Name Input */}
        <View style={styles.nameInputContainer}>
          <TextInput
            style={styles.nameInput}
            value={frameName}
            onChangeText={setFrameName}
            placeholder="Tên frame của bạn..."
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Canvas Preview: Real-time 4-slot Photo Strip */}
        <View style={styles.canvasContainer}>
          <View
            style={[
              styles.stripCanvas,
              {
                backgroundColor,
                borderColor,
              },
            ]}
          >
            {/* Background Texture Image Layer */}
            {uploadedImage && (
              <Image
                source={{ uri: uploadedImage }}
                style={[StyleSheet.absoluteFill, { opacity: imageOpacity }]}
                resizeMode="cover"
              />
            )}

            {/* Header branding on strip */}
            <View style={styles.stripTopHeader}>
              <Text style={styles.stripBrand}>LEAFYBOOTH</Text>
            </View>

            {/* 4 Photo Frames */}
            <View style={styles.framesColumn}>
              {[1, 2, 3, 4].map((slot) => (
                <View key={slot} style={styles.photoSlot}>
                  <View style={styles.photoSlotInner}>
                    <Text style={styles.slotNumber}>{slot}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Custom Text Banner */}
            {customText.trim().length > 0 && (
              <View style={styles.stripBottomBanner}>
                <Text style={styles.stripBannerText}>{customText}</Text>
              </View>
            )}

            {/* Floating Stickers on Canvas */}
            {stickers.map((stk) => (
              <Pressable
                key={stk.id}
                onPress={() => removeSticker(stk.id)}
                style={[styles.canvasSticker, { top: stk.y, left: stk.x }]}
              >
                <Text style={styles.stickerEmoji}>{stk.emoji}</Text>
                <View style={styles.removeStickerDot}>
                  <Text style={styles.removeStickerDotText}>✕</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* 5 Tool Tabs (Nền, Hình ảnh, Sticker, Chữ, Màu) */}
        <View style={styles.tabsRow}>
          <Pressable
            onPress={() => setActiveTab('bg')}
            style={[styles.toolTab, activeTab === 'bg' && styles.toolTabActive]}
          >
            <Text style={[styles.toolTabText, activeTab === 'bg' && styles.toolTabTextActive]}>
              Nền
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('image')}
            style={[styles.toolTab, activeTab === 'image' && styles.toolTabActive]}
          >
            <Text style={[styles.toolTabText, activeTab === 'image' && styles.toolTabTextActive]}>
              Hình ảnh
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('sticker')}
            style={[styles.toolTab, activeTab === 'sticker' && styles.toolTabActive]}
          >
            <Text style={[styles.toolTabText, activeTab === 'sticker' && styles.toolTabTextActive]}>
              Sticker
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('text')}
            style={[styles.toolTab, activeTab === 'text' && styles.toolTabActive]}
          >
            <Text style={[styles.toolTabText, activeTab === 'text' && styles.toolTabTextActive]}>
              Chữ
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('color')}
            style={[styles.toolTab, activeTab === 'color' && styles.toolTabActive]}
          >
            <Text style={[styles.toolTabText, activeTab === 'color' && styles.toolTabTextActive]}>
              Màu
            </Text>
          </Pressable>
        </View>

        {/* Tool Palette Panels */}
        <View style={styles.paletteContainer}>
          {/* TAB 1: NỀN */}
          {activeTab === 'bg' && (
            <View>
              <Text style={styles.paletteTitle}>Chọn màu nền dải ảnh</Text>
              <View style={styles.colorSwatchesGrid}>
                {PALETTE_COLORS.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => setBackgroundColor(item.color)}
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: item.color },
                      backgroundColor === item.color && styles.colorSwatchSelected,
                    ]}
                  />
                ))}
              </View>
            </View>
          )}

          {/* TAB 2: HÌNH ẢNH */}
          {activeTab === 'image' && (
            <View>
              <Text style={styles.paletteTitle}>Họa tiết nền</Text>
              <Text style={styles.paletteDisclaimer}>
                ⚠️ Chỉ dùng ảnh của bạn hoặc được phép sử dụng.
              </Text>

              <View style={styles.textureRow}>
                <Pressable
                  onPress={() => setUploadedImage(null)}
                  style={[
                    styles.textureThumb,
                    { justifyContent: 'center', alignItems: 'center' },
                    uploadedImage === null && styles.textureThumbSelected,
                  ]}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700' }}>Trống</Text>
                </Pressable>

                {SAMPLE_TEXTURES.map((url, i) => (
                  <Pressable
                    key={i}
                    onPress={() => setUploadedImage(url)}
                    style={[
                      styles.textureThumb,
                      uploadedImage === url && styles.textureThumbSelected,
                    ]}
                  >
                    <Image source={{ uri: url }} style={StyleSheet.absoluteFill} />
                  </Pressable>
                ))}
              </View>

              {uploadedImage && (
                <View style={styles.opacityRow}>
                  <Text style={styles.opacityLabel}>Độ đậm nhạt (Opacity):</Text>
                  <View style={styles.opacityButtons}>
                    {[0.4, 0.7, 1.0].map((val) => (
                      <Pressable
                        key={val}
                        onPress={() => setImageOpacity(val)}
                        style={[
                          styles.opacityBtn,
                          imageOpacity === val && styles.opacityBtnActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.opacityBtnText,
                            imageOpacity === val && styles.opacityBtnTextActive,
                          ]}
                        >
                          {Math.round(val * 100)}%
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* TAB 3: STICKER */}
          {activeTab === 'sticker' && (
            <View>
              <Text style={styles.paletteTitle}>Thư viện Sticker (Chạm để thêm)</Text>
              <Text style={styles.paletteSubtitle}>
                Chạm vào sticker trên khung ảnh để xóa bỏ.
              </Text>
              <View style={styles.stickerGrid}>
                {STICKER_LIBRARY.map((emoji) => (
                  <Pressable
                    key={emoji}
                    onPress={() => addSticker(emoji)}
                    style={({ pressed }) => [
                      styles.stickerItem,
                      { transform: [{ scale: pressed ? 0.9 : 1 }] },
                    ]}
                  >
                    <Text style={styles.stickerEmojiLarge}>{emoji}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* TAB 4: CHỮ */}
          {activeTab === 'text' && (
            <View>
              <Text style={styles.paletteTitle}>Thông điệp gắn trên dải ảnh</Text>
              <TextInput
                style={styles.textInputBanner}
                value={customText}
                onChangeText={setCustomText}
                placeholder="Nhập chữ hiển thị (ví dụ: Happy Birthday 🎂)..."
                placeholderTextColor="#9CA3AF"
                maxLength={40}
              />
            </View>
          )}

          {/* TAB 5: MÀU VIỀN */}
          {activeTab === 'color' && (
            <View>
              <Text style={styles.paletteTitle}>Màu viền khung dải ảnh</Text>
              <View style={styles.colorSwatchesGrid}>
                {[colors.ink, colors.lime, colors.pink, colors.yellow, colors.white].map(
                  (c, i) => (
                    <Pressable
                      key={i}
                      onPress={() => setBorderColor(c)}
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: c },
                        borderColor === c && styles.colorSwatchSelected,
                      ]}
                    />
                  )
                )}
              </View>
            </View>
          )}
        </View>

        {/* Share to Trending Toggle */}
        <View style={styles.shareToggleCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.shareToggleTitle}>Chia sẻ lên Xu hướng</Text>
            <Text style={styles.shareToggleDesc}>
              Cho phép cộng đồng LeafyBooth khám phá và sử dụng frame của bạn.
            </Text>
          </View>
          <Switch
            value={isPublic}
            onValueChange={setIsPublic}
            trackColor={{ false: '#D1D5DB', true: colors.lime }}
            thumbColor={colors.white}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF4F8B', // Hồng đậm đặc trưng của Frame Studio
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: theme.borders.radius.full,
    backgroundColor: colors.white,
    borderWidth: theme.borders.width,
    borderColor: colors.ink,
    ...theme.shadows.hardSmall,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.white,
  },
  publishButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: theme.borders.radius.full,
    backgroundColor: colors.lime,
    borderWidth: theme.borders.width,
    borderColor: colors.ink,
    ...theme.shadows.hardSmall,
  },
  publishText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.ink,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  nameInputContainer: {
    marginBottom: 16,
  },
  nameInput: {
    height: 48,
    backgroundColor: colors.white,
    borderRadius: theme.borders.radius.full,
    borderWidth: theme.borders.width,
    borderColor: colors.ink,
    paddingHorizontal: 18,
    fontSize: 15,
    fontWeight: '800',
    color: colors.ink,
    textAlign: 'center',
    ...theme.shadows.hard,
  },
  canvasContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  stripCanvas: {
    width: 170,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 3,
    ...theme.shadows.hard,
    position: 'relative',
    overflow: 'hidden',
  },
  stripTopHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  stripBrand: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: 2,
  },
  framesColumn: {
    gap: 8,
  },
  photoSlot: {
    width: '100%',
    aspectRatio: 1.15,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.ink,
    overflow: 'hidden',
  },
  photoSlotInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#9CA3AF',
  },
  stripBottomBanner: {
    marginTop: 10,
    backgroundColor: colors.white,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.ink,
    alignItems: 'center',
  },
  stripBannerText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.ink,
    textAlign: 'center',
  },
  canvasSticker: {
    position: 'absolute',
    zIndex: 10,
  },
  stickerEmoji: {
    fontSize: 28,
  },
  removeStickerDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeStickerDotText: {
    color: colors.white,
    fontSize: 8,
    fontWeight: '900',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  toolTab: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderRadius: theme.borders.radius.full,
    borderWidth: theme.borders.width,
    borderColor: colors.ink,
    alignItems: 'center',
    ...theme.shadows.hardSmall,
  },
  toolTabActive: {
    backgroundColor: colors.lime,
  },
  toolTabText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.ink,
  },
  toolTabTextActive: {
    fontWeight: '900',
  },
  paletteContainer: {
    backgroundColor: colors.white,
    borderRadius: theme.borders.radius.card,
    borderWidth: theme.borders.width,
    borderColor: colors.ink,
    padding: 16,
    ...theme.shadows.hard,
    marginBottom: 16,
  },
  paletteTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.ink,
    marginBottom: 10,
  },
  paletteSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 10,
  },
  paletteDisclaimer: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '700',
    marginBottom: 12,
  },
  colorSwatchesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorSwatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2.5,
    borderColor: colors.ink,
  },
  colorSwatchSelected: {
    borderWidth: 4,
    borderColor: colors.lime,
    transform: [{ scale: 1.1 }],
  },
  textureRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  textureThumb: {
    width: 60,
    height: 70,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.ink,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  textureThumbSelected: {
    borderColor: colors.lime,
    borderWidth: 3.5,
  },
  opacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  opacityLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink,
  },
  opacityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  opacityBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: theme.borders.radius.full,
    borderWidth: 1.5,
    borderColor: colors.ink,
    backgroundColor: '#F3F4F6',
  },
  opacityBtnActive: {
    backgroundColor: colors.lime,
  },
  opacityBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.ink,
  },
  opacityBtnTextActive: {
    fontWeight: '900',
  },
  stickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  stickerItem: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stickerEmojiLarge: {
    fontSize: 26,
  },
  textInputBanner: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.ink,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
  },
  shareToggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: theme.borders.radius.card,
    borderWidth: theme.borders.width,
    borderColor: colors.ink,
    padding: 16,
    ...theme.shadows.hard,
  },
  shareToggleTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.ink,
    marginBottom: 2,
  },
  shareToggleDesc: {
    fontSize: 12,
    color: '#6B7280',
    paddingRight: 10,
    lineHeight: 16,
  },
});

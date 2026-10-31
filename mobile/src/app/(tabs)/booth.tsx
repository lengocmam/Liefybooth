import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '../../core/theme/colors';
import { theme } from '../../core/theme/theme';
import { DEFAULT_BACKDROPS } from '../../core/constants';
import { PillButton } from '../../core/components/PillButton';
import { useBoothStore, BackdropItem } from '../../features/booth/hooks/useBoothStore';
import { useStudioStore } from '../../features/studio/hooks/useStudioStore';

export default function BoothScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { selectBackdrop, resetBooth } = useBoothStore();
  const { savedCustomFrames } = useStudioStore();

  const handleStartShooting = (backdrop: BackdropItem) => {
    resetBooth();
    selectBackdrop(backdrop);
    router.push('/booth/camera' as any);
  };

  const featuredBackdrop = DEFAULT_BACKDROPS[0]; // Halloween (Gần dịp)

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top, 20), paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Header */}
        <View style={styles.header}>
          <Text style={styles.mainTitle}>Booth</Text>
          <Text style={styles.subtitle}>
            Chọn nền, chụp 4 khung. Không cần mạng.
          </Text>

          {/* Quick shortcuts to Frame Studio & Widget Guide */}
          <View style={styles.shortcutsRow}>
            <Pressable
              onPress={() => router.push('/(tabs)/studio' as any)}
              style={({ pressed }) => [
                styles.shortcutPill,
                { backgroundColor: colors.darkSurfaceElevated, transform: [{ scale: pressed ? 0.96 : 1 }] },
              ]}
            >
              <Text style={styles.shortcutEmoji}>🎨</Text>
              <Text style={styles.shortcutText}>Tự tạo frame</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/widget-guide' as any)}
              style={({ pressed }) => [
                styles.shortcutPill,
                { backgroundColor: colors.darkSurfaceElevated, transform: [{ scale: pressed ? 0.96 : 1 }] },
              ]}
            >
              <Text style={styles.shortcutEmoji}>📱</Text>
              <Text style={styles.shortcutText}>Widget Leafy</Text>
            </Pressable>
          </View>
        </View>

        {/* Featured Card (Halloween) */}
        <Pressable
          onPress={() => handleStartShooting(featuredBackdrop)}
          style={({ pressed }) => [
            styles.featuredCard,
            { transform: [{ scale: pressed ? 0.98 : 1 }] },
          ]}
        >
          <View style={styles.featuredLeft}>
            <View style={styles.nearDatePill}>
              <Text style={styles.nearDateText}>Gần dịp · {featuredBackdrop.dateLabel}</Text>
            </View>
            <Text style={styles.featuredTitle}>Hallo-{'\n'}ween</Text>
            <PillButton
              title="Chụp ngay"
              onPress={() => handleStartShooting(featuredBackdrop)}
              variant="secondary"
              style={styles.featuredButton}
            />
          </View>

          {/* Mini Strip Graphic */}
          <View style={styles.featuredRight}>
            <View style={styles.featuredStrip}>
              {[0, 1, 2, 3].map(i => (
                <View key={i} style={styles.featuredStripBox}>
                  <View style={styles.miniWave} />
                </View>
              ))}
            </View>
          </View>
        </Pressable>

        {/* Banner Tự Tạo Khung Độc Lạ */}
        <Pressable
          onPress={() => router.push('/studio' as any)}
          style={({ pressed }) => [
            styles.diyFrameBanner,
            { transform: [{ scale: pressed ? 0.98 : 1 }] },
          ]}
        >
          <View style={styles.diyBannerIconBox}>
            <Text style={{ fontSize: 24 }}>🎨</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.diyBannerBadge}>
              <Text style={styles.diyBannerBadgeText}>180+ STICKER · 6 FONT CHỮ</Text>
            </View>
            <Text style={styles.diyBannerTitle}>Tự Thiết Kế Khung Độc Lạ</Text>
            <Text style={styles.diyBannerDesc}>
              Khung vé xem phim, camcorder 1998 REC, viền lượn sóng bánh kem
            </Text>
          </View>
          <Text style={styles.diyBannerArrow}>➔</Text>
        </Pressable>

        {/* Section: Khung Tự Thiết Kế (nếu có) */}
        {savedCustomFrames && savedCustomFrames.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Khung Bạn Đã Tự Tạo ✨</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
              {savedCustomFrames.map((cf) => (
                <Pressable
                  key={cf.id}
                  onPress={() => {
                    resetBooth();
                    // Nạp sẵn khung vào StudioStore để luôn đồng bộ
                    useStudioStore.getState().loadSavedFrame(cf.id);
                    selectBackdrop({
                      id: cf.id,
                      name: cf.name,
                      dateLabel: 'DIY',
                      color: cf.backgroundColor,
                    });
                    useBoothStore.getState().setActiveCustomFrame({
                      id: cf.id,
                      name: cf.name,
                      color: cf.backgroundColor,
                      edgeStyle: cf.frameEdgeStyle,
                      stickers: cf.stickers ? cf.stickers.map((s) => ({ ...s })) : [],
                      textItems: cf.textItems ? cf.textItems.map((t) => ({ ...t })) : [],
                      customText: cf.customText || '',
                      frameLayout: cf.frameLayout,
                      pattern: cf.pattern,
                      sealStamp: cf.sealStamp,
                      washiTapeStyle: cf.washiTapeStyle,
                      gradientTheme: cf.gradientTheme,
                    });
                    useBoothStore.getState().setLayout(cf.frameLayout === 'grid_4' ? 'grid' : 'vertical');
                    if (cf.customText || cf.name) {
                      useBoothStore.getState().setStripTitle(cf.customText || cf.name);
                    }
                    router.push('/booth/camera' as any);
                  }}
                  style={({ pressed }) => [
                    styles.customFrameCard,
                    { transform: [{ scale: pressed ? 0.96 : 1 }] },
                  ]}
                >
                  <View style={[styles.stripThumbnail, { backgroundColor: cf.backgroundColor }]}>
                    {[0, 1, 2, 3].map((i) => (
                      <View key={i} style={styles.thumbnailSlot} />
                    ))}
                  </View>
                  <Text style={styles.backdropName} numberOfLines={1}>
                    {cf.name}
                  </Text>
                  <Text style={styles.customFrameSubText}>🎨 Khung DIY</Text>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}

        {/* Section: Tất cả nền */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tất cả nền</Text>
        </View>

        {/* 10 Backdrops Grid */}
        <View style={styles.grid}>
          {DEFAULT_BACKDROPS.map(item => (
            <Pressable
              key={item.id}
              onPress={() => handleStartShooting(item)}
              style={({ pressed }) => [
                styles.backdropItem,
                { transform: [{ scale: pressed ? 0.96 : 1 }] },
              ]}
            >
              {/* Mini Strip Card */}
              <View style={[styles.stripThumbnail, { backgroundColor: item.color }]}>
                {[0, 1, 2, 3].map(i => (
                  <View key={i} style={styles.thumbnailSlot} />
                ))}
              </View>
              <Text style={styles.backdropName} numberOfLines={1}>
                {item.name}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.darkBg, // Midnight Dark Studio
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.xl,
  },
  header: {
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: 44,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 4,
  },
  featuredCard: {
    backgroundColor: colors.darkSurface,
    borderRadius: theme.borders.radius.card,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    ...theme.shadows.darkSoft,
  },
  featuredLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  nearDatePill: {
    backgroundColor: colors.accentYellow,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 10,
    ...theme.shadows.darkSoft,
  },
  nearDateText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.ink,
  },
  featuredTitle: {
    fontSize: 40,
    fontWeight: '900',
    color: colors.textPrimary,
    lineHeight: 42,
    letterSpacing: -0.5,
    marginBottom: 14,
  },
  featuredButton: {
    minWidth: 120,
    height: 46,
  },
  featuredRight: {
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredStrip: {
    width: 80,
    backgroundColor: '#FF7A3D',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.darkBorder,
    padding: 6,
    gap: 6,
    transform: [{ rotate: '4deg' }],
    ...theme.shadows.darkSoft,
  },
  featuredStripBox: {
    height: 38,
    backgroundColor: '#FFCC80',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
    overflow: 'hidden',
    position: 'relative',
  },
  miniWave: {
    height: 16,
    backgroundColor: '#FB8C00',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 6,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  diyFrameBanner: {
    backgroundColor: colors.darkSurface,
    borderRadius: theme.borders.radius.card,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
    ...theme.shadows.darkSoft,
  },
  diyBannerIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accentYellow,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.darkSoft,
  },
  diyBannerBadge: {
    backgroundColor: '#FF4F8B',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  diyBannerBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.white,
  },
  diyBannerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  diyBannerDesc: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  diyBannerArrow: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  customFrameCard: {
    width: 120,
    marginRight: 14,
    alignItems: 'center',
  },
  customFrameSubText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  backdropItem: {
    width: '47%',
    alignItems: 'center',
    marginBottom: 8,
  },
  stripThumbnail: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.darkBorder,
    padding: 10,
    gap: 6,
    ...theme.shadows.darkSoft,
  },
  thumbnailSlot: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.15)',
  },
  backdropName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 8,
    textAlign: 'center',
  },
  shortcutsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  shortcutPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: theme.borders.radius.full,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    gap: 6,
    ...theme.shadows.darkSoft,
  },
  shortcutEmoji: {
    fontSize: 16,
  },
  shortcutText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.textPrimary,
  },
});

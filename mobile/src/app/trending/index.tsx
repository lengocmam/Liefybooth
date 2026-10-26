import React, { useState } from 'react';
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
import { PillButton } from '../../core/components/PillButton';
import { useStudioStore, TrendingFrameItem } from '../../features/studio/hooks/useStudioStore';
import { useBoothStore } from '../../features/booth/hooks/useBoothStore';

type TimeFilter = 'week' | 'month' | 'newest';

export default function TrendingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { trendingFrames } = useStudioStore();
  const { selectBackdrop, resetBooth } = useBoothStore();

  const [activeFilter, setActiveFilter] = useState<TimeFilter>('week');

  const heroFrame = trendingFrames.find((f) => f.isHero) || trendingFrames[0];
  const listFrames = trendingFrames.filter((f) => !f.isHero);

  const handleUseFrame = (frame: TrendingFrameItem) => {
    resetBooth();
    selectBackdrop({
      id: frame.id,
      name: frame.name,
      color: frame.backgroundColor,
      dateLabel: 'Hot 🔥',
    });
    router.push('/booth/camera' as any);
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: Math.max(insets.top, 14), paddingBottom: Math.max(insets.bottom, 20) },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              { transform: [{ scale: pressed ? 0.95 : 1 }] },
            ]}
          >
            <Text style={styles.backArrow}>←</Text>
          </Pressable>
          <View>
            <Text style={styles.mainTitle}>Xu hướng</Text>
            <Text style={styles.subtitle}>Cập nhật hằng ngày</Text>
          </View>
        </View>

        <Pressable
          onPress={() => router.push('/studio' as any)}
          style={({ pressed }) => [
            styles.createButton,
            { transform: [{ scale: pressed ? 0.95 : 1 }] },
          ]}
        >
          <Text style={styles.createButtonText}>+ Tự tạo</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Time Filters Row */}
        <View style={styles.filtersRow}>
          <Pressable
            onPress={() => setActiveFilter('week')}
            style={[
              styles.filterPill,
              activeFilter === 'week' && styles.filterPillActive,
            ]}
          >
            <Text
              style={[
                styles.filterPillText,
                activeFilter === 'week' && styles.filterPillTextActive,
              ]}
            >
              Tuần này
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveFilter('month')}
            style={[
              styles.filterPill,
              activeFilter === 'month' && styles.filterPillActive,
            ]}
          >
            <Text
              style={[
                styles.filterPillText,
                activeFilter === 'month' && styles.filterPillTextActive,
              ]}
            >
              Tháng này
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveFilter('newest')}
            style={[
              styles.filterPill,
              activeFilter === 'newest' && styles.filterPillActive,
            ]}
          >
            <Text
              style={[
                styles.filterPillText,
                activeFilter === 'newest' && styles.filterPillTextActive,
              ]}
            >
              Mới nhất
            </Text>
          </Pressable>
        </View>

        {/* HERO CARD: #1 Frame của tuần */}
        <View style={styles.heroCard}>
          {/* Gold Badge */}
          <View style={styles.heroBadgeRow}>
            <View style={styles.rankBadgeGold}>
              <Text style={styles.rankBadgeGoldText}>#1</Text>
            </View>
            <View style={styles.heroBadgeLabel}>
              <Text style={styles.heroBadgeLabelText}>Frame của tuần</Text>
            </View>
          </View>

          {/* Title & Creator */}
          <Text style={styles.heroTitle}>{heroFrame.name}</Text>

          <View style={styles.heroCreatorRow}>
            <View style={[styles.avatarCircle, { backgroundColor: heroFrame.authorColor }]}>
              <Text style={styles.avatarLetter}>{heroFrame.authorLetter}</Text>
            </View>
            <View>
              <Text style={styles.authorName}>{heroFrame.authorName}</Text>
              <Text style={styles.heroStats}>
                {heroFrame.usesCount} lượt dùng · {heroFrame.savesCount} lượt lưu
              </Text>
            </View>
          </View>

          {/* Hero Strip Mockup */}
          <View style={styles.heroPreviewWrapper}>
            <View style={[styles.miniStrip, { backgroundColor: heroFrame.backgroundColor }]}>
              {[1, 2, 3, 4].map((i) => (
                <View key={i} style={styles.miniStripPhoto}>
                  <Text style={styles.miniStripIndex}>{i}</Text>
                </View>
              ))}
              <Text style={styles.miniStripStickers}>🍂 ✨</Text>
            </View>
          </View>

          {/* CTA Button */}
          <PillButton
            title="Dùng frame này"
            variant="primary"
            onPress={() => handleUseFrame(heroFrame)}
            style={{ width: '100%', marginTop: 14 }}
          />
        </View>

        {/* Leaderboard Section (#2 -> #6) */}
        <View style={styles.leaderboardSection}>
          <Text style={styles.leaderboardSectionTitle}>Bảng xếp hạng cộng đồng</Text>

          <View style={styles.leaderboardList}>
            {listFrames.map((item, idx) => (
              <React.Fragment key={item.id}>
                <View style={styles.leaderboardRow}>
                  {/* Rank Number */}
                  <View style={styles.rankNumberBox}>
                    <Text style={styles.rankNumberText}>{item.rank}</Text>
                  </View>

                  {/* Thumbnail */}
                  <View style={[styles.thumbnailBox, { backgroundColor: item.backgroundColor }]}>
                    <View style={styles.thumbnailSlot} />
                    <View style={styles.thumbnailSlot} />
                  </View>

                  {/* Info */}
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <View style={styles.itemMeta}>
                      <View style={[styles.avatarDot, { backgroundColor: item.authorColor }]}>
                        <Text style={styles.avatarDotText}>{item.authorLetter}</Text>
                      </View>
                      <Text style={styles.itemAuthor}>{item.authorName}</Text>
                      <Text style={styles.itemUses}>· {item.usesCount} dùng</Text>
                    </View>
                  </View>

                  {/* Action */}
                  <Pressable
                    onPress={() => handleUseFrame(item)}
                    style={({ pressed }) => [
                      styles.useSmallBtn,
                      { transform: [{ scale: pressed ? 0.95 : 1 }] },
                    ]}
                  >
                    <Text style={styles.useSmallBtnText}>Dùng</Text>
                  </Pressable>
                </View>
                {idx < listFrames.length - 1 && <View style={styles.leaderboardDivider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Floating CTA Banner to Frame Studio */}
        <Pressable
          onPress={() => router.push('/studio' as any)}
          style={({ pressed }) => [
            styles.createPromoBanner,
            { transform: [{ scale: pressed ? 0.98 : 1 }] },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.createPromoTitle}>🎨 Tự thiết kế frame của bạn</Text>
            <Text style={styles.createPromoDesc}>
              Thêm sticker, ảnh riêng, chọn màu và chia sẻ lên bảng xếp hạng ngay hôm nay.
            </Text>
          </View>
          <Text style={styles.createPromoArrow}>→</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B3D2E', // Xanh rừng đặc trưng của Xu hướng
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: theme.borders.width,
    borderColor: colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.hard,
  },
  backArrow: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.ink,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: '#A7F3D0',
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: colors.lime,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: theme.borders.radius.full,
    borderWidth: theme.borders.width,
    borderColor: colors.ink,
    ...theme.shadows.hardSmall,
  },
  createButtonText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.ink,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  filterPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: theme.borders.radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterPillActive: {
    backgroundColor: colors.lime,
    borderColor: colors.ink,
    borderWidth: 2,
    ...theme.shadows.hardSmall,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
  filterPillTextActive: {
    color: colors.ink,
    fontWeight: '900',
  },
  heroCard: {
    backgroundColor: colors.white,
    borderRadius: theme.borders.radius.card,
    borderWidth: theme.borders.width,
    borderColor: colors.ink,
    padding: 20,
    ...theme.shadows.hard,
    marginBottom: 20,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  rankBadgeGold: {
    backgroundColor: '#FFD93D',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.ink,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  rankBadgeGoldText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.ink,
  },
  heroBadgeLabel: {
    backgroundColor: colors.pink,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.ink,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  heroBadgeLabelText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.ink,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.ink,
    marginBottom: 8,
  },
  heroCreatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.ink,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink,
  },
  heroStats: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  heroPreviewWrapper: {
    alignItems: 'center',
    marginVertical: 4,
  },
  miniStrip: {
    width: 140,
    padding: 10,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: colors.ink,
    gap: 6,
    alignItems: 'center',
    ...theme.shadows.hardSmall,
  },
  miniStripPhoto: {
    width: '100%',
    aspectRatio: 1.2,
    backgroundColor: colors.white,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniStripIndex: {
    fontSize: 12,
    fontWeight: '900',
    color: '#9CA3AF',
  },
  miniStripStickers: {
    fontSize: 14,
    marginTop: 2,
  },
  leaderboardSection: {
    marginBottom: 20,
  },
  leaderboardSectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.white,
    marginBottom: 10,
  },
  leaderboardList: {
    backgroundColor: colors.white,
    borderRadius: theme.borders.radius.card,
    borderWidth: theme.borders.width,
    borderColor: colors.ink,
    ...theme.shadows.hard,
    overflow: 'hidden',
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  rankNumberBox: {
    width: 26,
    alignItems: 'center',
  },
  rankNumberText: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.ink,
  },
  thumbnailBox: {
    width: 36,
    height: 48,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.ink,
    padding: 3,
    gap: 3,
  },
  thumbnailSlot: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: colors.ink,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 2,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  avatarDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarDotText: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.ink,
  },
  itemAuthor: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '600',
  },
  itemUses: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  useSmallBtn: {
    backgroundColor: colors.lime,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: theme.borders.radius.full,
    borderWidth: 2,
    borderColor: colors.ink,
    ...theme.shadows.hardSmall,
  },
  useSmallBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.ink,
  },
  leaderboardDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 12,
  },
  createPromoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF4F8B',
    borderRadius: theme.borders.radius.card,
    borderWidth: theme.borders.width,
    borderColor: colors.ink,
    padding: 16,
    ...theme.shadows.hard,
  },
  createPromoTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.white,
    marginBottom: 4,
  },
  createPromoDesc: {
    fontSize: 12,
    color: '#FFE4EE',
    lineHeight: 16,
  },
  createPromoArrow: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.white,
    marginLeft: 10,
  },
});

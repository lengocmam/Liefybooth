import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '../../core/theme/colors';
import { theme } from '../../core/theme/theme';
import { PillButton } from '../../core/components/PillButton';
import { useBoothStore, StripLayout, StripFilter } from '../../features/booth/hooks/useBoothStore';
import { useStudioStore } from '../../features/studio/hooks/useStudioStore';

const COLOR_OPTIONS = [
  colors.pink,
  colors.yellow,
  colors.mint,
  colors.orange,
  colors.sky,
  colors.ink,
];

const FILTER_OPTIONS: { id: StripFilter; label: string }[] = [
  { id: 'original', label: 'Màu gốc' },
  { id: 'bw', label: 'Đen trắng' },
  { id: 'warm', label: 'Phim ấm' },
  { id: 'cool', label: 'Phim lạnh' },
];

export default function BoothCustomizeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    capturedPhotos,
    frameColor,
    layout,
    filter,
    stripTitle,
    setFrameColor,
    setLayout,
    setFilter,
  } = useBoothStore();

  const displayPhotos = [
    capturedPhotos[0] || 'https://picsum.photos/seed/p1/400/400',
    capturedPhotos[1] || 'https://picsum.photos/seed/p2/400/400',
    capturedPhotos[2] || 'https://picsum.photos/seed/p3/400/400',
    capturedPhotos[3] || 'https://picsum.photos/seed/p4/400/400',
  ];

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
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 16) }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            { transform: [{ scale: pressed ? 0.95 : 1 }] },
          ]}
        >
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Dải ảnh của bạn</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Preview Strip */}
      <View style={styles.previewArea}>
        <View
          style={[
            styles.stripCard,
            { backgroundColor: frameColor },
            layout === 'grid' && styles.stripCardGrid,
          ]}
        >
          <View style={layout === 'grid' ? styles.gridContainer : styles.verticalContainer}>
            {displayPhotos.map((uri, idx) => (
              <View
                key={idx}
                style={[
                  styles.photoFrame,
                  layout === 'grid' && styles.photoFrameGrid,
                ]}
              >
                <Image
                  source={{ uri }}
                  style={[styles.photo, getFilterStyle()]}
                />
                {filter === 'warm' && <View style={styles.warmOverlay} />}
                {filter === 'cool' && <View style={styles.coolOverlay} />}
              </View>
            ))}
          </View>
          <Text style={styles.stripTitleText}>{stripTitle}</Text>
        </View>
      </View>

      {/* Customization Options Bottom Sheet */}
      <View style={styles.optionsSheet}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Màu khung */}
          <Text style={styles.optionSectionTitle}>Màu khung</Text>
          <View style={styles.colorRow}>
            {COLOR_OPTIONS.map((c, i) => {
              const isSelected = frameColor === c;
              return (
                <Pressable
                  key={i}
                  onPress={() => setFrameColor(c)}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: c },
                    isSelected && styles.colorCircleSelected,
                  ]}
                />
              );
            })}
          </View>

          {/* Bố cục */}
          <Text style={styles.optionSectionTitle}>Bố cục</Text>
          <View style={styles.layoutRow}>
            {/* 4 Dọc */}
            <Pressable
              onPress={() => setLayout('vertical')}
              style={[
                styles.layoutButton,
                layout === 'vertical' && styles.layoutButtonSelected,
              ]}
            >
              <View style={styles.verticalIcon}>
                <View style={styles.verticalBar} />
              </View>
            </Pressable>

            {/* Lưới 2x2 */}
            <Pressable
              onPress={() => setLayout('grid')}
              style={[
                styles.layoutButton,
                layout === 'grid' && styles.layoutButtonSelected,
              ]}
            >
              <View style={styles.gridIcon}>
                <View style={styles.gridDot} />
                <View style={styles.gridDot} />
                <View style={styles.gridDot} />
                <View style={styles.gridDot} />
              </View>
            </Pressable>
          </View>

          {/* Bộ lọc ảnh */}
          <Text style={styles.optionSectionTitle}>Bộ lọc ảnh</Text>
          <View style={styles.filtersRow}>
            {FILTER_OPTIONS.map((opt) => {
              const isSelected = filter === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => setFilter(opt.id)}
                  style={styles.filterItem}
                >
                  <View
                    style={[
                      styles.filterPreviewBox,
                      isSelected && styles.filterPreviewBoxSelected,
                    ]}
                  >
                    <View
                      style={[
                        styles.filterColorSwatch,
                        opt.id === 'bw' && { backgroundColor: '#9CA3AF' },
                        opt.id === 'warm' && { backgroundColor: '#FDBA74' },
                        opt.id === 'cool' && { backgroundColor: '#93C5FD' },
                        opt.id === 'original' && { backgroundColor: '#F87171' },
                      ]}
                    />
                  </View>
                  <Text style={[styles.filterLabel, isSelected && styles.filterLabelSelected]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Banner dẫn vào Studio trang trí chuyên sâu */}
          <Pressable
            onPress={() => {
              useStudioStore.getState().setSlotPhotos(displayPhotos);
              useStudioStore.getState().setBackgroundColor(frameColor);
              if (stripTitle) {
                useStudioStore.getState().setCustomText(stripTitle);
              }
              router.push('/studio' as any);
            }}
            style={({ pressed }) => [
              styles.studioBanner,
              { transform: [{ scale: pressed ? 0.98 : 1 }] },
            ]}
          >
            <View style={styles.studioBannerIconBox}>
              <Text style={{ fontSize: 20 }}>🎨</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.studioBannerTitle}>Studio Trang Trí Độc Lạ</Text>
              <Text style={styles.studioBannerDesc}>Dán 180+ sticker, kiểu chữ & mép viền đặc biệt</Text>
            </View>
            <Text style={styles.studioBannerArrow}>➔</Text>
          </Pressable>

          {/* Bottom Action Buttons */}
          <View style={styles.actionRow}>
            <PillButton
              title="Lưu vào máy"
              onPress={() => router.replace('/booth/result' as any)}
              variant="white"
              style={styles.halfBtn}
            />
            <PillButton
              title="Xong"
              onPress={() => router.replace('/booth/result' as any)}
              variant="secondary"
              style={styles.halfBtn}
            />
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.yellow,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xl,
    marginBottom: 8,
  },
  backButton: {
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
  backIcon: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.ink,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.ink,
  },
  previewArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    maxHeight: 280,
  },
  stripCard: {
    width: 140,
    borderRadius: 12,
    borderWidth: 2.5,
    borderColor: colors.ink,
    padding: 8,
    ...theme.shadows.hard,
  },
  stripCardGrid: {
    width: 180,
  },
  verticalContainer: {
    gap: 6,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  photoFrame: {
    width: '100%',
    aspectRatio: 1.35,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.ink,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  photoFrameGrid: {
    width: '47%',
    aspectRatio: 1,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  warmOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 160, 50, 0.15)',
  },
  coolOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(50, 160, 255, 0.15)',
  },
  stripTitleText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.ink,
    textAlign: 'center',
    marginTop: 6,
  },
  optionsSheet: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 2.5,
    borderColor: colors.ink,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    ...theme.shadows.hard,
  },
  optionSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 10,
    marginTop: 6,
  },
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  colorCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2.5,
    borderColor: colors.ink,
  },
  colorCircleSelected: {
    borderWidth: 4,
    transform: [{ scale: 1.1 }],
    ...theme.shadows.hardSmall,
  },
  layoutRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 16,
  },
  layoutButton: {
    width: 68,
    height: 52,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.hardSmall,
  },
  layoutButtonSelected: {
    backgroundColor: colors.lime,
  },
  verticalIcon: {
    width: 20,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verticalBar: {
    width: 10,
    height: 28,
    backgroundColor: colors.ink,
    borderRadius: 3,
  },
  gridIcon: {
    width: 26,
    height: 26,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridDot: {
    width: 10,
    height: 10,
    backgroundColor: colors.ink,
    borderRadius: 2,
  },
  filtersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  filterItem: {
    alignItems: 'center',
    width: '22%',
  },
  filterPreviewBox: {
    width: 58,
    height: 58,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: colors.ink,
    padding: 3,
    backgroundColor: colors.white,
    marginBottom: 6,
    ...theme.shadows.hardSmall,
  },
  filterPreviewBoxSelected: {
    borderColor: colors.ink,
    backgroundColor: colors.lime,
    borderWidth: 3,
  },
  filterColorSwatch: {
    flex: 1,
    borderRadius: 8,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.ink,
    textAlign: 'center',
  },
  filterLabelSelected: {
    fontWeight: '900',
  },
  studioBanner: {
    backgroundColor: colors.pink,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: colors.ink,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    ...theme.shadows.hard,
  },
  studioBannerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studioBannerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.ink,
  },
  studioBannerDesc: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
    marginTop: 2,
  },
  studioBannerArrow: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.ink,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    marginBottom: 10,
  },
  halfBtn: {
    flex: 1,
  },
});

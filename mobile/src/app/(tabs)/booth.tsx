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

export default function BoothScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { selectBackdrop, resetBooth } = useBoothStore();

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
    backgroundColor: colors.orange,
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
    color: colors.ink,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.ink,
    marginTop: 4,
    opacity: 0.9,
  },
  featuredCard: {
    backgroundColor: colors.yellow,
    borderRadius: theme.borders.radius.card,
    borderWidth: theme.borders.width,
    borderColor: colors.ink,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
    ...theme.shadows.hard,
  },
  featuredLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  nearDatePill: {
    backgroundColor: colors.pink,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 10,
    ...theme.shadows.hardSmall,
  },
  nearDateText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.ink,
  },
  featuredTitle: {
    fontSize: 40,
    fontWeight: '900',
    color: colors.ink,
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
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 2.5,
    borderColor: colors.ink,
    padding: 6,
    gap: 6,
    transform: [{ rotate: '4deg' }],
    ...theme.shadows.hardSmall,
  },
  featuredStripBox: {
    height: 38,
    backgroundColor: '#FFCC80',
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.ink,
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
    fontWeight: '800',
    color: colors.ink,
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
    borderWidth: theme.borders.width,
    borderColor: colors.ink,
    padding: 10,
    gap: 6,
    ...theme.shadows.hard,
  },
  thumbnailSlot: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.ink,
  },
  backdropName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.ink,
    marginTop: 8,
    textAlign: 'center',
  },
});

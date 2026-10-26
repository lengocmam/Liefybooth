import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
} from 'react-native';
import { colors } from '../../../core/theme/colors';
import { theme } from '../../../core/theme/theme';
import { REACTION_ICONS } from '../../../core/constants';
import { useMomentsStore } from '../hooks/useMomentsStore';

const REACTION_BG_COLORS: Record<string, string> = {
  '❤️': colors.yellow,
  '😊': colors.lime,
  '🔥': colors.orange,
  '⭐': colors.sky,
  '😮': colors.white,
};

export const PickView: React.FC = () => {
  const {
    moments,
    activeMomentIndex,
    setActiveMomentIndex,
    addReaction,
    setViewMode,
  } = useMomentsStore();

  const currentMoment = moments[activeMomentIndex] || moments[0];
  const unreadCount = moments.filter(m => !m.isSeen).length;

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.topLeftRow}>
          <Text style={styles.topTitle}>Pick</Text>
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>
              {unreadCount > 0 ? `${unreadCount} ảnh mới` : 'Hộp ảnh'}
            </Text>
          </View>
        </View>

        {/* Nút quay lại Camera Plant */}
        <Pressable
          onPress={() => setViewMode('plant')}
          style={({ pressed }) => [
            styles.switchCameraPill,
            { transform: [{ scale: pressed ? 0.95 : 1 }] },
          ]}
        >
          <Text style={styles.switchCameraPillText}>📸 Chụp</Text>
        </Pressable>
      </View>

      {/* Hero Polaroid Card */}
      <View style={styles.heroPolaroidArea}>
        <View style={styles.polaroidCard}>
          {/* Sender Badge top-left */}
          <View style={styles.senderPill}>
            <Text style={styles.senderPillText}>
              {currentMoment.senderName} · {currentMoment.timeAgo}
            </Text>
          </View>

          {/* Star sticker top-right */}
          <View style={styles.starSticker}>
            <Text style={styles.starIcon}>★</Text>
          </View>

          {/* Square Photo */}
          <View style={styles.photoContainer}>
            <Image
              source={{ uri: currentMoment.photoUrl }}
              style={styles.photo}
              resizeMode="cover"
            />
          </View>

          {/* Caption */}
          <Text style={styles.captionText}>{currentMoment.caption}</Text>
        </View>
      </View>

      {/* 5 One-Tap Reaction Buttons */}
      <View style={styles.reactionsSection}>
        <View style={styles.reactionButtonsRow}>
          {REACTION_ICONS.map((emoji) => {
            const isMyReaction = currentMoment.myReaction === emoji;
            const count = currentMoment.reactions[emoji] || 0;
            const bgColor = REACTION_BG_COLORS[emoji] || colors.white;

            return (
              <Pressable
                key={emoji}
                onPress={() => addReaction(currentMoment.id, emoji)}
                style={({ pressed }) => [
                  styles.reactionButton,
                  { backgroundColor: bgColor },
                  isMyReaction && styles.reactionButtonActive,
                  { transform: [{ scale: pressed ? 0.9 : isMyReaction ? 1.08 : 1 }] },
                ]}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
                {count > 0 && (
                  <View style={styles.reactionCountBadge}>
                    <Text style={styles.reactionCountText}>{count}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Section: Gần đây */}
      <View style={styles.recentSection}>
        <Text style={styles.recentSectionTitle}>Gần đây</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recentScroll}
        >
          {moments.map((item, idx) => {
            const isActive = idx === activeMomentIndex;
            return (
              <Pressable
                key={item.id}
                onPress={() => setActiveMomentIndex(idx)}
                style={({ pressed }) => [
                  styles.miniPolaroid,
                  isActive && styles.miniPolaroidActive,
                  { transform: [{ scale: pressed ? 0.95 : 1 }] },
                ]}
              >
                <Image
                  source={{ uri: item.photoUrl }}
                  style={styles.miniPhoto}
                />
                <Text style={styles.miniSenderText} numberOfLines={1}>
                  {item.senderName}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.pink, // Nền hồng đặc trưng của Pick
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  topLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  topTitle: {
    fontSize: 40,
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: -1,
  },
  newBadge: {
    backgroundColor: colors.yellow,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.ink,
    paddingHorizontal: 12,
    paddingVertical: 5,
    ...theme.shadows.hardSmall,
  },
  newBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.ink,
  },
  switchCameraPill: {
    backgroundColor: colors.lime,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.ink,
    paddingHorizontal: 14,
    paddingVertical: 6,
    ...theme.shadows.hardSmall,
  },
  switchCameraPillText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink,
  },
  heroPolaroidArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  polaroidCard: {
    width: 270,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: colors.ink,
    padding: 14,
    position: 'relative',
    ...theme.shadows.hard,
  },
  senderPill: {
    position: 'absolute',
    top: -14,
    left: 10,
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.ink,
    paddingHorizontal: 12,
    paddingVertical: 4,
    zIndex: 5,
    ...theme.shadows.hardSmall,
  },
  senderPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.ink,
  },
  starSticker: {
    position: 'absolute',
    top: -15,
    right: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lime,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
    transform: [{ rotate: '12deg' }],
    ...theme.shadows.hardSmall,
  },
  starIcon: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.ink,
  },
  photoContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.ink,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    marginTop: 6,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  captionText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.ink,
    marginTop: 12,
    marginBottom: 2,
  },
  reactionsSection: {
    marginVertical: 4,
  },
  reactionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  reactionButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...theme.shadows.hardSmall,
  },
  reactionButtonActive: {
    borderWidth: 3.5,
  },
  reactionEmoji: {
    fontSize: 26,
  },
  reactionCountBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    backgroundColor: colors.ink,
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  reactionCountText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.white,
  },
  recentSection: {
    marginBottom: 8,
  },
  recentSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 8,
  },
  recentScroll: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 4,
  },
  miniPolaroid: {
    width: 68,
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.ink,
    padding: 5,
    alignItems: 'center',
    ...theme.shadows.hardSmall,
  },
  miniPolaroidActive: {
    borderColor: colors.ink,
    borderWidth: 3,
    backgroundColor: colors.lime,
  },
  miniPhoto: {
    width: 54,
    height: 54,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.ink,
  },
  miniSenderText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.ink,
    marginTop: 4,
    textAlign: 'center',
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '../../core/theme/colors';
import { theme } from '../../core/theme/theme';
import { useGardenStore, GardenItem } from '../../features/garden/hooks/useGardenStore';

export default function GardenListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const { events, joinEventByCode, setActiveEventId } = useGardenStore();

  const handleJoin = () => {
    if (!joinCodeInput.trim()) return;
    const found = joinEventByCode(joinCodeInput);
    if (found) {
      setJoinCodeInput('');
      router.push(`/garden/${found.id}` as any);
    } else {
      Alert.alert('Không tìm thấy', 'Mã mời không chính xác hoặc đã hết hạn.');
    }
  };

  const handleOpenEvent = (event: GardenItem) => {
    setActiveEventId(event.id);
    router.push(`/garden/${event.id}` as any);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top, 20), paddingBottom: insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Title and Create Button (+) */}
        <View style={styles.headerRow}>
          <Text style={styles.mainTitle}>Garden</Text>
          <Pressable
            onPress={() => router.push('/garden/create' as any)}
            style={({ pressed }) => [
              styles.createButton,
              { transform: [{ scale: pressed ? 0.95 : 1 }] },
            ]}
          >
            <Text style={styles.plusIcon}>+</Text>
          </Pressable>
        </View>

        {/* Join Code Box */}
        <View style={styles.joinCodeBox}>
          <TextInput
            style={styles.joinInput}
            placeholder="Nhập mã mời 6 ký tự"
            placeholderTextColor="#9CA3AF"
            value={joinCodeInput}
            onChangeText={setJoinCodeInput}
            autoCapitalize="characters"
            maxLength={6}
          />
          <Pressable
            onPress={handleJoin}
            style={({ pressed }) => [
              styles.joinButton,
              { transform: [{ scale: pressed ? 0.95 : 1 }] },
            ]}
          >
            <Text style={styles.joinButtonText}>Vào</Text>
          </Pressable>
        </View>

        {/* Garden Cards List */}
        <View style={styles.eventsList}>
          {events.map((event) => {
            const isSharedMode = event.mode === 'shared';
            const isArchived = event.status === 'archived';

            return (
              <Pressable
                key={event.id}
                onPress={() => handleOpenEvent(event)}
                style={({ pressed }) => [
                  styles.eventCard,
                  isArchived && styles.eventCardArchived,
                  { transform: [{ scale: pressed ? 0.98 : 1 }] },
                ]}
              >
                {/* Left: Mini Strip Graphic */}
                <View style={[styles.miniStrip, { backgroundColor: event.backdropColor }]}>
                  {[0, 1, 2, 3].map((i) => (
                    <View key={i} style={styles.miniStripSlot} />
                  ))}
                </View>

                {/* Center: Event Info */}
                <View style={styles.eventInfo}>
                  <Text style={styles.eventName}>{event.name}</Text>
                  <Text style={styles.eventMeta}>
                    {isSharedMode
                      ? `${event.date} · Còn 2 ô trống`
                      : `${event.date} · ${event.memberCount} người · ${isArchived ? 'Đã lưu trữ' : 'Album chung'}`}
                  </Text>

                  {/* Mode Pill Badge */}
                  <View style={styles.modeBadgeRow}>
                    <View
                      style={[
                        styles.modeBadge,
                        isSharedMode && styles.sharedModeBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.modeBadgeText,
                          isSharedMode && styles.sharedModeBadgeText,
                        ]}
                      >
                        {isSharedMode ? 'Dải chung · Đang diễn ra' : 'Chế độ A'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Right: Member Avatars */}
                <View style={styles.avatarsGroup}>
                  {event.members.slice(0, 2).map((m, idx) => (
                    <View
                      key={m.id}
                      style={[
                        styles.avatarCircle,
                        { backgroundColor: m.color, marginLeft: idx > 0 ? -12 : 0 },
                      ]}
                    >
                      <Text style={styles.avatarLetter}>{m.letter}</Text>
                    </View>
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cobalt, // Màu Cobalt đặc trưng của danh sách Garden
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: -1,
  },
  createButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.lime,
    borderWidth: 2.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.hard,
  },
  plusIcon: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.ink,
    lineHeight: 32,
  },
  joinCodeBox: {
    backgroundColor: colors.white,
    borderRadius: 30,
    borderWidth: 2.5,
    borderColor: colors.ink,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingLeft: 18,
    paddingRight: 6,
    marginBottom: 24,
    ...theme.shadows.hard,
  },
  joinInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
  },
  joinButton: {
    backgroundColor: colors.lime,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.ink,
    paddingHorizontal: 22,
    paddingVertical: 10,
    ...theme.shadows.hardSmall,
  },
  joinButtonText: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.ink,
  },
  eventsList: {
    gap: 16,
  },
  eventCard: {
    backgroundColor: colors.white,
    borderRadius: theme.borders.radius.card,
    borderWidth: theme.borders.width,
    borderColor: colors.ink,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.hard,
  },
  eventCardArchived: {
    backgroundColor: '#E2E8F0',
  },
  miniStrip: {
    width: 44,
    height: 86,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.ink,
    padding: 4,
    gap: 3,
    marginRight: 14,
  },
  miniStripSlot: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: colors.ink,
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: 19,
    fontWeight: '900',
    color: colors.ink,
    marginBottom: 4,
  },
  eventMeta: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
  },
  modeBadgeRow: {
    flexDirection: 'row',
  },
  modeBadge: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.ink,
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: colors.white,
  },
  modeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.ink,
  },
  sharedModeBadge: {
    backgroundColor: colors.lime,
  },
  sharedModeBadgeText: {
    color: colors.ink,
    fontWeight: '900',
  },
  avatarsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.hardSmall,
  },
  avatarLetter: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.ink,
  },
});

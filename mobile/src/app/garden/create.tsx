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
import { PillButton } from '../../core/components/PillButton';
import { useGardenStore, GardenMode } from '../../features/garden/hooks/useGardenStore';

const BACKDROP_COLORS = [
  { id: 'pink', color: colors.pink, name: 'Hồng' },
  { id: 'sky', color: colors.sky, name: 'Xanh trời' },
  { id: 'mint', color: colors.mint, name: 'Bạc hà' },
  { id: 'white', color: colors.white, name: 'Trắng' },
];

export default function CreateGardenScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { createEvent } = useGardenStore();

  const [name, setName] = useState('Sinh nhật Mai');
  const [date, setDate] = useState('20/10/2026');
  const [selectedColor, setSelectedColor] = useState<string>(colors.pink);
  const [mode, setMode] = useState<GardenMode>('album');
  const [maxMembers, setMaxMembers] = useState(30);

  const handleCreate = () => {
    if (!name.trim()) {
      Alert.alert('Chưa nhập tên', 'Vui lòng nhập tên sự kiện.');
      return;
    }

    const newId = createEvent({
      name: name.trim(),
      date: date.trim() || 'Hôm nay',
      mode,
      backdropColor: selectedColor,
      maxMembers,
    });

    router.replace(`/garden/${newId}` as any);
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 20) }]}>
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
        <Text style={styles.headerTitle}>Tạo sự kiện</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Main Info Card */}
        <View style={styles.card}>
          <Text style={styles.inputLabel}>Tên sự kiện</Text>
          <TextInput
            style={styles.textInput}
            value={name}
            onChangeText={setName}
            placeholder="Nhập tên sự kiện..."
            placeholderTextColor="#9CA3AF"
          />

          <Text style={[styles.inputLabel, { marginTop: 16 }]}>Ngày</Text>
          <TextInput
            style={styles.textInput}
            value={date}
            onChangeText={setDate}
            placeholder="Ví dụ: 20/10/2026"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Nền */}
        <Text style={styles.sectionTitle}>Nền</Text>
        <View style={styles.backdropsRow}>
          {BACKDROP_COLORS.map((item) => {
            const isSelected = selectedColor === item.color;
            return (
              <Pressable
                key={item.id}
                onPress={() => setSelectedColor(item.color)}
                style={[
                  styles.miniStripCard,
                  { backgroundColor: item.color },
                  isSelected && styles.miniStripCardSelected,
                ]}
              >
                {[0, 1, 2, 3].map((i) => (
                  <View key={i} style={styles.miniStripBox} />
                ))}
              </Pressable>
            );
          })}
        </View>

        {/* Chế độ chụp */}
        <Text style={styles.sectionTitle}>Chế độ chụp</Text>
        <View style={styles.modeRow}>
          {/* Chế độ A */}
          <Pressable
            onPress={() => setMode('album')}
            style={[
              styles.modeCard,
              mode === 'album' && styles.modeCardSelected,
            ]}
          >
            <Text style={styles.modeCardTitle}>Album chung</Text>
            <Text style={styles.modeCardDesc}>
              Mỗi người chụp dải 4 khung riêng, tất cả vào album
            </Text>
          </Pressable>

          {/* Chế độ B */}
          <Pressable
            onPress={() => setMode('shared')}
            style={[
              styles.modeCard,
              mode === 'shared' && styles.modeCardSelected,
            ]}
          >
            <Text style={styles.modeCardTitle}>Dải chung</Text>
            <Text style={styles.modeCardDesc}>
              Mỗi người chụp 1 ô, đủ 4 ô thì ghép thành dải
            </Text>
          </Pressable>
        </View>

        {/* Số người tối đa */}
        <View style={styles.membersCountCard}>
          <Text style={styles.membersCountLabel}>Số người tối đa</Text>
          <View style={styles.counterGroup}>
            <Pressable
              onPress={() => setMaxMembers((prev) => Math.max(2, prev - 5))}
              style={styles.counterBtn}
            >
              <Text style={styles.counterBtnText}>–</Text>
            </Pressable>
            <Text style={styles.counterValue}>{maxMembers}</Text>
            <Pressable
              onPress={() => setMaxMembers((prev) => Math.min(100, prev + 5))}
              style={[styles.counterBtn, styles.counterBtnLime]}
            >
              <Text style={styles.counterBtnText}>+</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.bottomBar}>
        <PillButton
          title="Tạo và lấy mã mời"
          onPress={handleCreate}
          variant="secondary"
          textStyle={{ color: colors.lime }}
          style={styles.createBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.purple, // Nền tím đặc trưng của Tạo sự kiện
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
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
    fontSize: 28,
    fontWeight: '900',
    color: colors.ink,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: theme.borders.radius.card,
    borderWidth: theme.borders.width,
    borderColor: colors.ink,
    padding: 18,
    marginBottom: 18,
    ...theme.shadows.hard,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 8,
  },
  textInput: {
    height: 48,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.ink,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
    backgroundColor: '#F9FAFB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 10,
    marginLeft: 4,
  },
  backdropsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  miniStripCard: {
    width: '22%',
    height: 110,
    borderRadius: 12,
    borderWidth: 2.5,
    borderColor: colors.ink,
    padding: 6,
    gap: 4,
    ...theme.shadows.hardSmall,
  },
  miniStripCardSelected: {
    borderWidth: 4,
    transform: [{ scale: 1.05 }],
  },
  miniStripBox: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.ink,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  modeCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: colors.ink,
    padding: 14,
    ...theme.shadows.hardSmall,
  },
  modeCardSelected: {
    backgroundColor: colors.lime,
  },
  modeCardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.ink,
    marginBottom: 6,
  },
  modeCardDesc: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink,
    lineHeight: 16,
    opacity: 0.85,
  },
  membersCountCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: colors.ink,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...theme.shadows.hard,
  },
  membersCountLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.ink,
  },
  counterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  counterBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnLime: {
    backgroundColor: colors.lime,
  },
  counterBtnText: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.ink,
    lineHeight: 22,
  },
  counterValue: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.ink,
    minWidth: 30,
    textAlign: 'center',
  },
  bottomBar: {
    paddingHorizontal: theme.spacing.lg,
    marginTop: 'auto',
  },
  createBtn: {
    width: '100%',
  },
});

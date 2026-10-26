import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '../core/theme/colors';
import { theme } from '../core/theme/theme';
import { PillButton } from '../core/components/PillButton';

export default function WidgetGuideScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 20) },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            { transform: [{ scale: pressed ? 0.95 : 1 }] },
          ]}
        >
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Widget màn hình chính</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* iOS Home Screen Simulation */}
        <View style={styles.phoneMockup}>
          {/* Status bar mock */}
          <View style={styles.statusBarMock}>
            <Text style={styles.statusTime}>9:41</Text>
            <View style={styles.statusIcons}>
              <Text style={styles.statusText}>􀐫 􀙇 􀛨</Text>
            </View>
          </View>

          {/* Widgets Container */}
          <View style={styles.widgetsGrid}>
            {/* Small Widget (Chi · Mưa rồi) */}
            <View style={styles.smallWidget}>
              <View style={styles.widgetHeaderRow}>
                <Text style={styles.widgetAppName}>🌿 LeafyBooth</Text>
                <Text style={styles.widgetTime}>5m</Text>
              </View>

              <View style={styles.widgetPhotoFrame}>
                <Image
                  source={{ uri: 'https://picsum.photos/seed/widget_chi/200/200' }}
                  style={styles.widgetImg}
                />
                <View style={styles.widgetCaptionOverlay}>
                  <Text style={styles.widgetAuthor}>Chi</Text>
                  <Text style={styles.widgetCaption}>Mưa rồi 🌧️</Text>
                </View>
              </View>
            </View>

            {/* Simulated App Icons 2x2 next to small widget */}
            <View style={styles.appIconsColumn}>
              <View style={styles.appIconRow}>
                <View style={[styles.appIconBox, { backgroundColor: '#FFD93D' }]}>
                  <Text style={styles.appIconEmoji}>🖼️</Text>
                </View>
                <View style={[styles.appIconBox, { backgroundColor: '#FF8FC7' }]}>
                  <Text style={styles.appIconEmoji}>📅</Text>
                </View>
              </View>
              <View style={styles.appIconRow}>
                <View style={[styles.appIconBox, { backgroundColor: '#7EE8B8' }]}>
                  <Text style={styles.appIconEmoji}>📝</Text>
                </View>
                <View style={[styles.appIconBox, { backgroundColor: '#6EC6FF' }]}>
                  <Text style={styles.appIconEmoji}>🌤️</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Medium Widget (Bình & An · Khoảnh khắc gần đây) */}
          <View style={styles.mediumWidget}>
            <View style={styles.widgetHeaderRow}>
              <Text style={styles.widgetAppName}>🌿 LeafyBooth</Text>
              <Text style={styles.widgetBadge}>2 khoảnh khắc mới</Text>
            </View>

            <View style={styles.mediumWidgetContent}>
              <View style={styles.mediumMomentItem}>
                <Image
                  source={{ uri: 'https://picsum.photos/seed/binh_coffee/200/200' }}
                  style={styles.mediumPhoto}
                />
                <Text style={styles.mediumAuthor}>Bình: Cà phê sáng ☕</Text>
              </View>

              <View style={styles.mediumMomentItem}>
                <Image
                  source={{ uri: 'https://picsum.photos/seed/an_moment/200/200' }}
                  style={styles.mediumPhoto}
                />
                <Text style={styles.mediumAuthor}>An: Trưa nay ăn gì 🍜</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 4-Step Setup Guide Card */}
        <View style={styles.guideCard}>
          <Text style={styles.guideCardTitle}>4 bước cài đặt Widget trên iPhone</Text>

          <View style={styles.stepItem}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>1</Text>
            </View>
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepHeading}>Chạm và giữ màn hình</Text>
              <Text style={styles.stepDesc}>
                Nhấn giữ vào một vùng trống trên màn hình chính cho tới khi các ứng dụng rung rinh.
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={[styles.stepBadge, { backgroundColor: colors.pink }]}>
              <Text style={styles.stepBadgeText}>2</Text>
            </View>
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepHeading}>Nhấn nút (+) góc trên</Text>
              <Text style={styles.stepDesc}>
                Nhấn vào biểu tượng dấu cộng <Text style={{ fontWeight: '800' }}>[ + ]</Text> ở góc trên cùng bên trái màn hình.
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={[styles.stepBadge, { backgroundColor: colors.yellow }]}>
              <Text style={styles.stepBadgeText}>3</Text>
            </View>
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepHeading}>Tìm kiếm LeafyBooth</Text>
              <Text style={styles.stepDesc}>
                Gõ tìm kiếm <Text style={{ fontWeight: '800' }}>LeafyBooth</Text> trong danh sách các ứng dụng hỗ trợ tiện ích.
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={[styles.stepBadge, { backgroundColor: colors.sky }]}>
              <Text style={styles.stepBadgeText}>4</Text>
            </View>
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepHeading}>Chọn kích thước & Thêm</Text>
              <Text style={styles.stepDesc}>
                Vuốt chọn kích thước <Text style={{ fontWeight: '800' }}>Vuông nhỏ</Text> hoặc <Text style={{ fontWeight: '800' }}>Ngang vừa</Text> rồi nhấn <Text style={{ fontWeight: '800' }}>Thêm tiện ích</Text>.
              </Text>
            </View>
          </View>
        </View>

        {/* Back Button */}
        <View style={{ marginTop: 20 }}>
          <PillButton
            title="Đã hiểu, quay lại trang cá nhân"
            variant="primary"
            onPress={() => router.back()}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sky,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.ink,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  phoneMockup: {
    backgroundColor: '#0F172A',
    borderRadius: 36,
    borderWidth: 4,
    borderColor: colors.ink,
    padding: 16,
    marginBottom: 20,
    ...theme.shadows.hard,
  },
  statusBarMock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 14,
  },
  statusTime: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  statusIcons: {
    flexDirection: 'row',
  },
  statusText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  widgetsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  smallWidget: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.ink,
    padding: 10,
    aspectRatio: 1,
    justifyContent: 'space-between',
  },
  widgetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  widgetAppName: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.ink,
  },
  widgetTime: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
  },
  widgetBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.ink,
    backgroundColor: colors.lime,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  widgetPhotoFrame: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  widgetImg: {
    width: '100%',
    height: '100%',
  },
  widgetCaptionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  widgetAuthor: {
    color: colors.lime,
    fontSize: 10,
    fontWeight: '800',
  },
  widgetCaption: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  appIconsColumn: {
    flex: 1,
    justifyContent: 'space-between',
  },
  appIconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  appIconBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appIconEmoji: {
    fontSize: 24,
  },
  mediumWidget: {
    backgroundColor: colors.white,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.ink,
    padding: 12,
  },
  mediumWidgetContent: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  mediumMomentItem: {
    flex: 1,
  },
  mediumPhoto: {
    width: '100%',
    height: 72,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.ink,
    marginBottom: 4,
  },
  mediumAuthor: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.ink,
  },
  guideCard: {
    backgroundColor: colors.white,
    borderRadius: theme.borders.radius.card,
    borderWidth: theme.borders.width,
    borderColor: colors.ink,
    padding: 20,
    ...theme.shadows.hard,
  },
  guideCardTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.ink,
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  stepBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.lime,
    borderWidth: 2,
    borderColor: colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBadgeText: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.ink,
  },
  stepTextContainer: {
    flex: 1,
  },
  stepHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 17,
  },
});

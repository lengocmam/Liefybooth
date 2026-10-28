import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '../core/theme/colors';
import { theme } from '../core/theme/theme';
import { PillButton } from '../core/components/PillButton';
import { useMomentsStore } from '../features/moments/hooks/useMomentsStore';
import { playShutterSound } from '../features/booth/services/soundService';

export default function WidgetGuideScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { moments } = useMomentsStore();
  const [widgetTab, setWidgetTab] = useState<'booth' | 'square' | 'medium'>('booth');
  const [demoIndex, setDemoIndex] = useState(0);
  const widgetAnim = useRef(new Animated.Value(1)).current;

  const currentMoment = moments[demoIndex % Math.max(1, moments.length)] || {
    senderName: 'An',
    caption: 'Dải ảnh Photobooth 4 ô ✨',
    photoUrl: 'https://picsum.photos/seed/moment_demo/500/500',
    timeAgo: '2m',
    stripPhotos: [
      'https://picsum.photos/seed/cut1/300/300',
      'https://picsum.photos/seed/cut2/300/300',
      'https://picsum.photos/seed/cut3/300/300',
      'https://picsum.photos/seed/cut4/300/300',
    ],
    frameColor: '#FF8FC7',
    frameName: 'Pink Pastel 4-Cut',
  };

  const handleSwitchTab = (tab: 'booth' | 'square' | 'medium') => {
    if (tab === widgetTab) return;
    playShutterSound();
    Animated.sequence([
      Animated.timing(widgetAnim, { toValue: 0.88, duration: 80, useNativeDriver: true }),
      Animated.spring(widgetAnim, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
    ]).start();
    setWidgetTab(tab);
  };

  const handleCycleDemo = () => {
    playShutterSound();
    Animated.sequence([
      Animated.timing(widgetAnim, { toValue: 0.9, duration: 80, useNativeDriver: true }),
      Animated.spring(widgetAnim, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }),
    ]).start();
    setDemoIndex((prev) => (prev + 1) % Math.max(1, moments.length));
  };

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
        {/* Widget Size / Mode Selector */}
        <View style={styles.tabSelector}>
          <Pressable
            onPress={() => handleSwitchTab('booth')}
            style={({ pressed }) => [
              styles.tabPill,
              widgetTab === 'booth' && styles.tabPillActive,
              { transform: [{ scale: pressed ? 0.96 : 1 }] },
            ]}
          >
            <Text style={[styles.tabPillText, widgetTab === 'booth' && styles.tabPillTextActive]}>
              🎞️ Photobooth 4 Ô
            </Text>
          </Pressable>
          <Pressable
            onPress={() => handleSwitchTab('square')}
            style={({ pressed }) => [
              styles.tabPill,
              widgetTab === 'square' && styles.tabPillActive,
              { transform: [{ scale: pressed ? 0.96 : 1 }] },
            ]}
          >
            <Text style={[styles.tabPillText, widgetTab === 'square' && styles.tabPillTextActive]}>
              🖼️ Vuông Locket
            </Text>
          </Pressable>
          <Pressable
            onPress={() => handleSwitchTab('medium')}
            style={({ pressed }) => [
              styles.tabPill,
              widgetTab === 'medium' && styles.tabPillActive,
              { transform: [{ scale: pressed ? 0.96 : 1 }] },
            ]}
          >
            <Text style={[styles.tabPillText, widgetTab === 'medium' && styles.tabPillTextActive]}>
              📱 Ngang Đôi
            </Text>
          </Pressable>
        </View>

        {/* iOS Home Screen Simulation */}
        <View style={styles.phoneMockup}>
          {/* Status bar mock */}
          <View style={styles.statusBarMock}>
            <Text style={styles.statusTime}>9:41</Text>
            <View style={styles.statusIcons}>
              <Text style={styles.statusText}>􀐫 􀙇 􀛨</Text>
            </View>
          </View>

          <Animated.View
            style={{
              transform: [{ scale: widgetAnim }],
              opacity: widgetAnim.interpolate({
                inputRange: [0.85, 1],
                outputRange: [0.85, 1],
              }),
            }}
          >
            {widgetTab === 'booth' ? (
              /* Photobooth 4 Ô Widget Mockup */
              <View style={styles.boothWidgetCard}>
                <View style={styles.widgetHeaderRow}>
                  <Text style={styles.widgetAppName}>🌿 LeafyBooth · Photobooth 4 Ô</Text>
                  <Text style={styles.widgetTime}>{currentMoment.timeAgo || 'Vừa xong'}</Text>
                </View>

                <View
                  style={[
                    styles.boothWidgetFrame,
                    { backgroundColor: currentMoment.frameColor || '#FF8FC7' },
                  ]}
                >
                  <View style={styles.boothWidgetGrid}>
                    {(currentMoment.stripPhotos || [
                      'https://picsum.photos/seed/cut1/200/200',
                      'https://picsum.photos/seed/cut2/200/200',
                      'https://picsum.photos/seed/cut3/200/200',
                      'https://picsum.photos/seed/cut4/200/200',
                    ]).slice(0, 4).map((pUrl, pIdx) => (
                      <View key={pIdx} style={styles.boothWidgetPhotoBox}>
                        <Image source={{ uri: pUrl }} style={styles.boothWidgetImg} resizeMode="cover" />
                      </View>
                    ))}
                  </View>

                  <View style={styles.boothWidgetFooter}>
                    <Text style={styles.boothWidgetAuthor}>{currentMoment.senderName}: </Text>
                    <Text style={styles.boothWidgetCaption} numberOfLines={1}>{currentMoment.caption}</Text>
                  </View>
                </View>
              </View>
            ) : widgetTab === 'square' ? (
              /* Small Widget (Vuông Locket 1:1) */
              <View style={styles.widgetsGrid}>
                <View style={styles.smallWidget}>
                  <View style={styles.widgetHeaderRow}>
                    <Text style={styles.widgetAppName}>🌿 LeafyBooth</Text>
                    <Text style={styles.widgetTime}>{currentMoment.timeAgo || 'Vừa xong'}</Text>
                  </View>

                  <View style={styles.widgetPhotoFrame}>
                    <Image
                      source={{ uri: currentMoment.photoUrl }}
                      style={styles.widgetImg}
                    />
                    <View style={styles.widgetCaptionOverlay}>
                      <Text style={styles.widgetAuthor}>{currentMoment.senderName}</Text>
                      <Text style={styles.widgetCaption}>{currentMoment.caption}</Text>
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
            ) : (
              /* Medium Widget (Ngang Đôi) */
              <View style={styles.mediumWidget}>
                <View style={styles.widgetHeaderRow}>
                  <Text style={styles.widgetAppName}>🌿 LeafyBooth</Text>
                  <Text style={styles.widgetBadge}>Khoảnh khắc bạn bè</Text>
                </View>

                <View style={styles.mediumWidgetContent}>
                  <View style={styles.mediumMomentItem}>
                    <Image
                      source={{ uri: moments[0]?.photoUrl || 'https://picsum.photos/seed/binh_coffee/200/200' }}
                      style={styles.mediumPhoto}
                    />
                    <Text style={styles.mediumAuthor}>{moments[0]?.senderName || 'An'}: {moments[0]?.caption || 'Cà phê sáng ☕'}</Text>
                  </View>

                  <View style={styles.mediumMomentItem}>
                    <Image
                      source={{ uri: moments[1]?.photoUrl || 'https://picsum.photos/seed/an_moment/200/200' }}
                      style={styles.mediumPhoto}
                    />
                    <Text style={styles.mediumAuthor}>{moments[1]?.senderName || 'Chi'}: {moments[1]?.caption || 'Mưa rồi 🌧️'}</Text>
                  </View>
                </View>
              </View>
            )}
          </Animated.View>
        </View>

        {/* Nút trải nghiệm thử đổi ảnh ngay trên Widget */}
        <View style={styles.demoControlRow}>
          <Pressable
            onPress={handleCycleDemo}
            style={({ pressed }) => [
              styles.demoCycleBtn,
              { transform: [{ scale: pressed ? 0.95 : 1 }] },
            ]}
          >
            <Text style={styles.demoCycleBtnText}>🔄 Thử đổi ảnh bạn bè trên Widget</Text>
          </Pressable>
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
  tabSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  tabPill: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.hardSmall,
  },
  tabPillActive: {
    backgroundColor: colors.yellow,
    borderColor: colors.ink,
  },
  tabPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4B5563',
  },
  tabPillTextActive: {
    color: colors.ink,
    fontWeight: '900',
  },
  boothWidgetCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.ink,
    padding: 12,
    marginBottom: 8,
  },
  boothWidgetFrame: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.ink,
    padding: 8,
    alignItems: 'center',
  },
  boothWidgetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    width: '100%',
  },
  boothWidgetPhotoBox: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.ink,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  boothWidgetImg: {
    width: '100%',
    height: '100%',
  },
  boothWidgetFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  boothWidgetAuthor: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.ink,
  },
  boothWidgetCaption: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
    flex: 1,
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
  demoControlRow: {
    marginTop: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  demoCycleBtn: {
    backgroundColor: colors.yellow,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.ink,
    ...theme.shadows.hardSmall,
  },
  demoCycleBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.ink,
  },
});

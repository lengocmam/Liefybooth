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

  const getFilterImgStyle = (f?: string) => {
    if (f === 'bw') return { opacity: 0.9, tintColor: '#6B7280' as any };
    if (f === 'warm' || f === 'cool' || f === 'vintage' || f === 'pastel') return { opacity: 0.95 };
    return {};
  };

  const renderFilterOverlay = (f?: string) => {
    switch (f) {
      case 'warm': return <View style={styles.widgetFilterWarm} pointerEvents="none" />;
      case 'cool': return <View style={styles.widgetFilterCool} pointerEvents="none" />;
      case 'vintage': return <View style={styles.widgetFilterVintage} pointerEvents="none" />;
      case 'pastel': return <View style={styles.widgetFilterPastel} pointerEvents="none" />;
      default: return null;
    }
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

                {currentMoment.layout === 'grid' || currentMoment.layout === 'grid_4' ? (
                  /* Bố cục Lưới 2x2 */
                  <View
                    style={[
                      styles.boothWidgetFrame,
                      { backgroundColor: currentMoment.frameColor || '#FF8FC7' },
                      currentMoment.edgeStyle === 'film_perforated' && styles.widgetFilmBorder,
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
                          <Image
                            source={{ uri: pUrl }}
                            style={[styles.boothWidgetImg, getFilterImgStyle(currentMoment.filter)]}
                            resizeMode="cover"
                          />
                          {renderFilterOverlay(currentMoment.filter)}
                        </View>
                      ))}
                    </View>

                    {/* Floating stickers & text nếu có trên khung */}
                    {currentMoment.stickers && currentMoment.stickers.length > 0 && (
                      <View style={StyleSheet.absoluteFill} pointerEvents="none">
                        {currentMoment.stickers.map((st, sIdx) => {
                          const leftPos = st.x > 1 ? `${Math.min(Math.max((st.x / 200) * 100, 4), 86)}%` : `${Math.min(Math.max(st.x, 4), 86)}%`;
                          const topPos = st.y > 1 ? `${Math.min(Math.max((st.y / 580) * 100, 4), 92)}%` : `${Math.min(Math.max(st.y, 4), 92)}%`;
                          return (
                            <Text
                              key={sIdx}
                              style={{
                                position: 'absolute',
                                left: leftPos as any,
                                top: topPos as any,
                                fontSize: st.size ? Math.min(st.size * 0.55, 18) : 16,
                                transform: [{ rotate: `${st.rotation || 0}deg` }],
                              }}
                            >
                              {st.emoji}
                            </Text>
                          );
                        })}
                      </View>
                    )}

                    <View style={styles.boothWidgetFooter}>
                      <Text style={styles.boothWidgetAuthor}>{currentMoment.senderName}: </Text>
                      <Text style={styles.boothWidgetCaption} numberOfLines={1}>{currentMoment.caption}</Text>
                    </View>
                  </View>
                ) : (
                  /* Bố cục Dải Dọc 4 Ô Chuẩn */
                  <View
                    style={[
                      styles.boothWidgetFrameVertical,
                      { backgroundColor: currentMoment.frameColor || '#FF8FC7' },
                      currentMoment.edgeStyle === 'film_perforated' && styles.widgetFilmBorder,
                    ]}
                  >
                    {/* Hiệu ứng viền cuộn phim nếu có */}
                    {currentMoment.edgeStyle === 'film_perforated' && (
                      <>
                        <View style={styles.widgetFilmSprocketsLeft} pointerEvents="none">
                          {[0, 1, 2, 3, 4].map((k) => (
                            <View key={k} style={styles.widgetFilmHole} />
                          ))}
                        </View>
                        <View style={styles.widgetFilmSprocketsRight} pointerEvents="none">
                          {[0, 1, 2, 3, 4].map((k) => (
                            <View key={k} style={styles.widgetFilmHole} />
                          ))}
                        </View>
                      </>
                    )}

                    <View style={styles.boothWidgetVerticalPhotos}>
                      {(currentMoment.stripPhotos || [
                        'https://picsum.photos/seed/cut1/200/200',
                        'https://picsum.photos/seed/cut2/200/200',
                        'https://picsum.photos/seed/cut3/200/200',
                        'https://picsum.photos/seed/cut4/200/200',
                      ]).slice(0, 4).map((pUrl, pIdx) => (
                        <View key={pIdx} style={styles.boothWidgetVerticalSlot}>
                          <Image
                            source={{ uri: pUrl }}
                            style={[styles.boothWidgetImg, getFilterImgStyle(currentMoment.filter)]}
                            resizeMode="cover"
                          />
                          {renderFilterOverlay(currentMoment.filter)}
                        </View>
                      ))}
                    </View>

                    {/* Floating stickers & text nếu có trên khung */}
                    {currentMoment.stickers && currentMoment.stickers.length > 0 && (
                      <View style={StyleSheet.absoluteFill} pointerEvents="none">
                        {currentMoment.stickers.map((st, sIdx) => {
                          const leftPos = st.x > 1 ? `${Math.min(Math.max((st.x / 200) * 100, 4), 86)}%` : `${Math.min(Math.max(st.x, 4), 86)}%`;
                          const topPos = st.y > 1 ? `${Math.min(Math.max((st.y / 580) * 100, 4), 92)}%` : `${Math.min(Math.max(st.y, 4), 92)}%`;
                          return (
                            <Text
                              key={sIdx}
                              style={{
                                position: 'absolute',
                                left: leftPos as any,
                                top: topPos as any,
                                fontSize: st.size ? Math.min(st.size * 0.55, 18) : 16,
                                transform: [{ rotate: `${st.rotation || 0}deg` }],
                              }}
                            >
                              {st.emoji}
                            </Text>
                          );
                        })}
                      </View>
                    )}

                    <View style={styles.boothWidgetFooter}>
                      <Text style={styles.boothWidgetAuthor}>{currentMoment.senderName}: </Text>
                      <Text style={styles.boothWidgetCaption} numberOfLines={1}>{currentMoment.caption}</Text>
                    </View>
                  </View>
                )}
              </View>
            ) : widgetTab === 'square' ? (
              /* Small Widget (Vuông Locket 1:1) */
              <View style={styles.widgetsGrid}>
                <View style={styles.smallWidget}>
                  <View style={styles.widgetHeaderRow}>
                    <Text style={styles.widgetAppName}>🌿 LeafyBooth</Text>
                    <Text style={styles.widgetTime}>{currentMoment.timeAgo || 'Vừa xong'}</Text>
                  </View>

                  <View
                    style={[
                      styles.widgetPhotoFrame,
                      currentMoment.stripPhotos && currentMoment.stripPhotos.length > 1 && {
                        backgroundColor: currentMoment.frameColor || '#FF8FC7',
                        padding: 4,
                      },
                    ]}
                  >
                    {currentMoment.stripPhotos && currentMoment.stripPhotos.length > 1 ? (
                      <View style={styles.widgetSmallStripGrid}>
                        {currentMoment.stripPhotos.slice(0, 4).map((pUrl, pIdx) => (
                          <View key={pIdx} style={styles.widgetSmallStripCell}>
                            <Image
                              source={{ uri: pUrl }}
                              style={[styles.widgetImg, getFilterImgStyle(currentMoment.filter)]}
                              resizeMode="cover"
                            />
                            {renderFilterOverlay(currentMoment.filter)}
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Image
                        source={{ uri: currentMoment.photoUrl }}
                        style={[styles.widgetImg, getFilterImgStyle(currentMoment.filter)]}
                      />
                    )}
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
    backgroundColor: colors.darkBg, // Pure Midnight OLED Dark
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
    backgroundColor: colors.darkSurfaceElevated,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.darkSoft,
  },
  backArrow: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.white,
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
    backgroundColor: colors.darkSurfaceElevated,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.darkSoft,
  },
  tabPillActive: {
    backgroundColor: colors.accentYellow,
    borderColor: colors.accentYellow,
  },
  tabPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  tabPillTextActive: {
    color: colors.ink,
    fontWeight: '900',
  },
  boothWidgetCard: {
    backgroundColor: colors.darkSurface,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    padding: 12,
    marginBottom: 8,
    ...theme.shadows.darkSoft,
  },
  boothWidgetFrame: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.ink,
    padding: 8,
    alignItems: 'center',
  },
  boothWidgetFrameVertical: {
    width: '100%',
    maxWidth: 210,
    alignSelf: 'center',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.ink,
    padding: 8,
    alignItems: 'center',
    position: 'relative',
  },
  boothWidgetVerticalPhotos: {
    width: '100%',
    gap: 5,
  },
  boothWidgetVerticalSlot: {
    width: '100%',
    aspectRatio: 1.35,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.ink,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  widgetFilmBorder: {
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderColor: '#111827',
  },
  widgetFilmSprocketsLeft: {
    position: 'absolute',
    left: -8,
    top: 8,
    bottom: 8,
    width: 6,
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  widgetFilmSprocketsRight: {
    position: 'absolute',
    right: -8,
    top: 8,
    bottom: 8,
    width: 6,
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  widgetFilmHole: {
    width: 4,
    height: 6,
    borderRadius: 1,
    backgroundColor: colors.white,
    marginVertical: 3,
  },
  widgetFilterWarm: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(234,88,12,0.14)',
  },
  widgetFilterCool: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(2,132,199,0.12)',
  },
  widgetFilterVintage: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(120,53,15,0.18)',
  },
  widgetFilterPastel: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(244,63,94,0.12)',
  },
  widgetSmallStripGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  widgetSmallStripCell: {
    width: '47%',
    height: '47%',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.ink,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    position: 'relative',
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
    backgroundColor: colors.darkSurface,
    borderRadius: theme.borders.radius.card,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    padding: 20,
    ...theme.shadows.darkSoft,
  },
  guideCardTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.textPrimary,
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
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
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
    color: colors.textPrimary,
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  demoControlRow: {
    marginTop: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  demoCycleBtn: {
    backgroundColor: colors.accentYellow,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    ...theme.shadows.darkSoft,
  },
  demoCycleBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.ink,
  },
});

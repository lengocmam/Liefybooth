import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors } from '../../core/theme/colors';
import { theme } from '../../core/theme/theme';
import { PillButton } from '../../core/components/PillButton';
import { useGardenStore, StripItem } from '../../features/garden/hooks/useGardenStore';

export default function GardenDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { events, fillSheetSlot, addStripToAlbum } = useGardenStore();
  const event = events.find((e) => e.id === id) || events[0];

  const [activeTab, setActiveTab] = useState<'album' | 'members'>('album');
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  const isSharedMode = event?.mode === 'shared';

  const handleShare = () => {
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  // Chế độ B: Chụp 1 ô co-op
  const handleShootSharedSlot = () => {
    // Tìm ô trống đầu tiên của người dùng
    const emptySlotIdx = event.sheetSlots.findIndex((s) => !s.photoUrl);
    const targetIdx = emptySlotIdx !== -1 ? emptySlotIdx : 2;

    const mockPhoto = `https://picsum.photos/seed/coop_${Date.now()}/400/400`;
    fillSheetSlot(event.id, targetIdx, mockPhoto);
    Alert.alert('Thành công', `Đã chụp và ghép ảnh vào ô số ${targetIdx + 1}!`);
  };

  // Chế độ A: Chụp dải ảnh vào album
  const handleShootForAlbum = () => {
    const mockPhotos = [
      `https://picsum.photos/seed/my_s1_${Date.now()}/300/300`,
      `https://picsum.photos/seed/my_s2_${Date.now()}/300/300`,
      `https://picsum.photos/seed/my_s3_${Date.now()}/300/300`,
      `https://picsum.photos/seed/my_s4_${Date.now()}/300/300`,
    ];
    addStripToAlbum(event.id, mockPhotos, colors.pink);
    Alert.alert('Thành công', 'Đã chụp dải 4 khung và đăng lên album chung!');
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isSharedMode ? colors.yellow : colors.purple,
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: Math.max(insets.bottom, 16),
        },
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
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle}>{event.name}</Text>
          <Text style={styles.headerSub}>
            {isSharedMode
              ? `${event.date} · ${event.memberCount} thành viên · Dải chung`
              : `${event.date} · ${event.memberCount} thành viên · Album chung`}
          </Text>
        </View>
      </View>

      {/* --- GIAO DIỆN CHẾ ĐỘ A: ALBUM CHUNG --- */}
      {!isSharedMode && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Black Invite Code Card */}
          <View style={styles.inviteCard}>
            <View>
              <Text style={styles.inviteLabel}>Mã mời</Text>
              <Text style={styles.inviteCodeText}>{event.joinCode}</Text>
            </View>
            <View style={styles.inviteActions}>
              <Pressable onPress={handleShare} style={styles.inviteBtnLime}>
                <Text style={styles.inviteBtnLimeText}>
                  {copiedToast ? 'Đã chép!' : 'Chia sẻ'}
                </Text>
              </Pressable>
              <Pressable onPress={() => setShowQrModal(true)} style={styles.inviteBtnWhite}>
                <Text style={styles.inviteBtnWhiteText}>Hiện QR</Text>
              </Pressable>
            </View>
          </View>

          {/* Segmented Switcher: Album | Thành viên */}
          <View style={styles.tabSwitchCard}>
            <Pressable
              onPress={() => setActiveTab('album')}
              style={[
                styles.tabSwitchBtn,
                activeTab === 'album' && styles.tabSwitchBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.tabSwitchText,
                  activeTab === 'album' && styles.tabSwitchTextActive,
                ]}
              >
                Album
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab('members')}
              style={[
                styles.tabSwitchBtn,
                activeTab === 'members' && styles.tabSwitchBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.tabSwitchText,
                  activeTab === 'members' && styles.tabSwitchTextActive,
                ]}
              >
                Thành viên
              </Text>
            </Pressable>
          </View>

          {/* Album Feed */}
          {activeTab === 'album' ? (
            <View style={styles.stripsGrid}>
              {event.strips.map((strip) => (
                <View
                  key={strip.id}
                  style={[styles.stripFeedCard, { backgroundColor: strip.stripColor }]}
                >
                  <View style={styles.stripPhotosStack}>
                    {strip.photos.map((url, i) => (
                      <View key={i} style={styles.miniPhotoSlot}>
                        <Image source={{ uri: url }} style={styles.slotImg} />
                      </View>
                    ))}
                  </View>
                  <Text style={styles.authorBadgeText}>{strip.authorName}</Text>
                </View>
              ))}
            </View>
          ) : (
            /* Members List */
            <View style={styles.membersListCard}>
              {event.members.map((m) => (
                <View key={m.id} style={styles.memberRow}>
                  <View style={[styles.memberAvatar, { backgroundColor: m.color }]}>
                    <Text style={styles.memberAvatarLetter}>{m.letter}</Text>
                  </View>
                  <Text style={styles.memberRowName}>{m.name}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* --- GIAO DIỆN CHẾ ĐỘ B: DẢI CHUNG CO-OP --- */}
      {isSharedMode && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.sharedScrollContent}
        >
          <View style={styles.coopRow}>
            {/* Cột trái: Dải ảnh 4 ô đang ghép */}
            <View style={styles.coopStripFrame}>
              {event.sheetSlots.map((slot) => {
                const isFilled = !!slot.photoUrl;
                const isUserSlot = !isFilled && slot.index === 2;

                return (
                  <View
                    key={slot.index}
                    style={[
                      styles.coopSlotBox,
                      isUserSlot && styles.coopSlotUserBox,
                      !isFilled && !isUserSlot && styles.coopSlotEmptyBox,
                    ]}
                  >
                    {isFilled ? (
                      <View style={{ flex: 1, position: 'relative' }}>
                        <Image source={{ uri: slot.photoUrl }} style={styles.coopSlotImage} />
                        <View style={styles.coopAuthorPill}>
                          <Text style={styles.coopAuthorText}>{slot.userName}</Text>
                        </View>
                      </View>
                    ) : isUserSlot ? (
                      <View style={styles.userSlotContent}>
                        <Text style={styles.userSlotTitle}>Ô của bạn</Text>
                      </View>
                    ) : (
                      <View style={styles.emptySlotContent}>
                        <Text style={styles.emptySlotDot}>•</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Cột phải: Tiến độ và thành viên */}
            <View style={styles.coopStatusCol}>
              {/* Thẻ 2/4 ô */}
              <View style={styles.coopCountCard}>
                <Text style={styles.coopCountBig}>
                  {event.sheetSlots.filter((s) => s.photoUrl).length}/4
                </Text>
                <Text style={styles.coopCountLabel}>ô đã có người chụp</Text>
              </View>

              {/* Đồng hồ đếm ngược */}
              <View style={styles.timeLeftPill}>
                <Text style={styles.timeLeftText}>Còn 23 giờ</Text>
              </View>

              {/* Danh sách người chụp */}
              <View style={styles.coopMembersCard}>
                {event.sheetSlots
                  .filter((s) => s.photoUrl)
                  .map((s) => (
                    <View key={s.index} style={styles.coopMemberStatusRow}>
                      <View style={[styles.miniAvatarCirc, { backgroundColor: s.userColor }]}>
                        <Text style={styles.miniAvatarLetter}>{s.userLetter}</Text>
                      </View>
                      <Text style={styles.coopMemberName}>{s.userName}</Text>
                      <Text style={styles.coopCheckmark}>✓</Text>
                    </View>
                  ))}
                <Text style={styles.coopRemainingText}>
                  Còn {4 - event.sheetSlots.filter((s) => s.photoUrl).length} ô trống
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Bottom Sticky Action Button */}
      <View style={styles.bottomBar}>
        {isSharedMode ? (
          <PillButton
            title="Chụp ô số 3"
            onPress={handleShootSharedSlot}
            variant="secondary"
            textStyle={{ color: colors.lime }}
            style={styles.actionBtn}
          />
        ) : (
          <PillButton
            title="Chụp vào album"
            onPress={handleShootForAlbum}
            variant="primary"
            style={styles.actionBtn}
          />
        )}
      </View>

      {/* Modal QR Code */}
      <Modal
        visible={showQrModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQrModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Mã QR sự kiện</Text>
            <Text style={styles.modalEventName}>{event.name}</Text>

            {/* Simulated QR Graphic */}
            <View style={styles.qrBox}>
              <View style={styles.qrInner}>
                <View style={[styles.qrCorner, { top: 10, left: 10 }]} />
                <View style={[styles.qrCorner, { top: 10, right: 10 }]} />
                <View style={[styles.qrCorner, { bottom: 10, left: 10 }]} />
                <Text style={styles.qrCenterCode}>{event.joinCode}</Text>
              </View>
            </View>

            <Text style={styles.qrHelpText}>
              Bạn bè mở LeafyBooth, quét QR hoặc nhập mã {event.joinCode} để vào cùng chụp.
            </Text>

            <PillButton
              title="Đóng"
              onPress={() => setShowQrModal(false)}
              variant="secondary"
              style={{ width: '100%', marginTop: 14 }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: 12,
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
    marginRight: 12,
    ...theme.shadows.hardSmall,
  },
  backIcon: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.ink,
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.ink,
  },
  headerSub: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink,
    opacity: 0.85,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 20,
  },
  inviteCard: {
    backgroundColor: colors.ink,
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: colors.ink,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    ...theme.shadows.hard,
  },
  inviteLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  inviteCodeText: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.lime,
    letterSpacing: 2,
  },
  inviteActions: {
    flexDirection: 'row',
    gap: 8,
  },
  inviteBtnLime: {
    backgroundColor: colors.lime,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.ink,
    paddingHorizontal: 14,
    paddingVertical: 8,
    ...theme.shadows.hardSmall,
  },
  inviteBtnLimeText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.ink,
  },
  inviteBtnWhite: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.ink,
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...theme.shadows.hardSmall,
  },
  inviteBtnWhiteText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.ink,
  },
  tabSwitchCard: {
    backgroundColor: colors.white,
    borderRadius: 22,
    borderWidth: 2.5,
    borderColor: colors.ink,
    padding: 4,
    flexDirection: 'row',
    marginBottom: 18,
    ...theme.shadows.hard,
  },
  tabSwitchBtn: {
    flex: 1,
    height: 42,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabSwitchBtnActive: {
    backgroundColor: colors.ink,
  },
  tabSwitchText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.ink,
  },
  tabSwitchTextActive: {
    color: colors.white,
  },
  stripsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'space-between',
  },
  stripFeedCard: {
    width: '47%',
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: colors.ink,
    padding: 8,
    alignItems: 'center',
    ...theme.shadows.hard,
  },
  stripPhotosStack: {
    width: '100%',
    gap: 6,
    marginBottom: 6,
  },
  miniPhotoSlot: {
    width: '100%',
    height: 58,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.ink,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  slotImg: {
    width: '100%',
    height: '100%',
  },
  authorBadgeText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.ink,
    marginTop: 2,
  },
  membersListCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: colors.ink,
    padding: 16,
    gap: 12,
    ...theme.shadows.hard,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarLetter: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.ink,
  },
  memberRowName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
  },

  /* Chế độ B Co-op Styles */
  sharedScrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 20,
  },
  coopRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  coopStripFrame: {
    width: 140,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: colors.ink,
    padding: 8,
    gap: 8,
    ...theme.shadows.hard,
  },
  coopSlotBox: {
    width: '100%',
    height: 85,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.ink,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  coopSlotUserBox: {
    backgroundColor: colors.lime,
    borderWidth: 2.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coopSlotEmptyBox: {
    backgroundColor: '#E5E7EB',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coopSlotImage: {
    width: '100%',
    height: '100%',
  },
  coopAuthorPill: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.ink,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  coopAuthorText: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.ink,
  },
  userSlotContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userSlotTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.ink,
  },
  emptySlotContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySlotDot: {
    fontSize: 24,
    color: '#9CA3AF',
  },
  coopStatusCol: {
    flex: 1,
    gap: 12,
  },
  coopCountCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: colors.ink,
    padding: 16,
    alignItems: 'center',
    ...theme.shadows.hard,
  },
  coopCountBig: {
    fontSize: 44,
    fontWeight: '900',
    color: colors.ink,
    lineHeight: 46,
  },
  coopCountLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.ink,
    marginTop: 2,
  },
  timeLeftPill: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.ink,
    paddingVertical: 8,
    alignItems: 'center',
    ...theme.shadows.hardSmall,
  },
  timeLeftText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.ink,
  },
  coopMembersCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: colors.ink,
    padding: 14,
    gap: 8,
    ...theme.shadows.hard,
  },
  coopMemberStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniAvatarCirc: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAvatarLetter: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.ink,
  },
  coopMemberName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink,
  },
  coopCheckmark: {
    fontSize: 16,
    fontWeight: '900',
    color: '#10B981',
  },
  coopRemainingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    marginTop: 4,
  },

  bottomBar: {
    paddingHorizontal: theme.spacing.lg,
    marginTop: 'auto',
  },
  actionBtn: {
    width: '100%',
  },

  /* Modal QR */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 26,
    borderWidth: 3,
    borderColor: colors.ink,
    padding: 24,
    alignItems: 'center',
    ...theme.shadows.hard,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.ink,
  },
  modalEventName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 16,
  },
  qrBox: {
    width: 200,
    height: 200,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: colors.ink,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  qrInner: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCorner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderWidth: 5,
    borderColor: colors.ink,
  },
  qrCenterCode: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: 2,
  },
  qrHelpText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
    textAlign: 'center',
    lineHeight: 18,
  },
});

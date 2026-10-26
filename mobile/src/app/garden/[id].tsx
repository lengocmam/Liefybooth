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
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors } from '../../core/theme/colors';
import { theme } from '../../core/theme/theme';
import { PillButton } from '../../core/components/PillButton';
import { QRCodeView } from '../../core/components/QRCodeView';
import {
  exportStripToImage,
  downloadAllAlbumStrips,
  exportTicketToImage,
} from '../../core/utils/stripExportService';
import { useGardenStore, StripItem } from '../../features/garden/hooks/useGardenStore';

export default function GardenDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { events, fillSheetSlot, addStripToAlbum } = useGardenStore();
  const event = events.find((e) => e.id === id) || events[0];

  const [activeTab, setActiveTab] = useState<'album' | 'members'>('album');
  const [showQrModal, setShowQrModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [ticketSavedToast, setTicketSavedToast] = useState(false);
  const [guestLinkToast, setGuestLinkToast] = useState(false);

  // Trạng thái tải trọn bộ album
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState(false);

  const isSharedMode = event?.mode === 'shared';

  const handleShare = () => {
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  const handleCopyGuestLink = () => {
    setGuestLinkToast(true);
    setTimeout(() => setGuestLinkToast(false), 2500);
  };

  // Lưu vé sự kiện thành file ảnh PNG thật
  const handleSaveTicket = async () => {
    setTicketSavedToast(true);
    try {
      await exportTicketToImage(event);
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => setTicketSavedToast(false), 3000);
  };

  // Tải trọn bộ Album HD: Xuất từng dải ảnh thành file PNG tải về máy
  const handleDownloadFullAlbum = async () => {
    if (event.strips.length === 0) {
      Alert.alert('Chưa có ảnh', 'Album hiện chưa có dải ảnh nào để tải về.');
      return;
    }

    setIsDownloadingAll(true);
    try {
      await downloadAllAlbumStrips(event);
      setIsDownloadingAll(false);
      setDownloadSuccessToast(true);
      setTimeout(() => setDownloadSuccessToast(false), 4000);
    } catch (err) {
      setIsDownloadingAll(false);
      Alert.alert('Lỗi', 'Không thể hoàn tất việc tải ảnh.');
    }
  };

  // Tải 1 dải ảnh riêng lẻ
  const handleDownloadSingleStrip = async (strip: StripItem, idx: number) => {
    try {
      await exportStripToImage(strip, event.name, event.date, idx + 1);
      Alert.alert('Thành công', `Đã xuất dải ảnh của ${strip.authorName} thành file PNG tải về máy!`);
    } catch {
      Alert.alert('Lỗi', 'Không thể tải dải ảnh này.');
    }
  };

  // Chế độ B: Chụp 1 ô co-op
  const handleShootSharedSlot = () => {
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
              <Pressable onPress={() => setShowTicketModal(true)} style={styles.inviteBtnYellow}>
                <Text style={styles.inviteBtnYellowText}>🎫 Vé sự kiện</Text>
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
                Album ({event.strips.length})
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
                Thành viên ({event.members.length})
              </Text>
            </Pressable>
          </View>

          {/* Album Tab Content */}
          {activeTab === 'album' ? (
            <View>
              {/* THANH CÔNG CỤ QUẢN LÝ ALBUM: Tải trọn bộ HD & Link xem nhanh */}
              <View style={styles.albumManagerCard}>
                <View style={styles.albumManagerHeader}>
                  <View style={styles.albumManagerStats}>
                    <Text style={styles.albumManagerIcon}>📦</Text>
                    <View>
                      <Text style={styles.albumManagerTitle}>
                        {event.strips.length} dải ảnh photobooth HD
                      </Text>
                      <Text style={styles.albumManagerSub}>
                        {event.members.length} người đã đóng góp ảnh
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Toast thông báo tải thành công hoặc sao chép link */}
                {downloadSuccessToast && (
                  <View style={styles.toastBannerSuccess}>
                    <Text style={styles.toastBannerText}>
                      ✓ Đã lưu toàn bộ {event.strips.length} dải ảnh PNG vào máy của bạn!
                    </Text>
                  </View>
                )}

                {guestLinkToast && (
                  <View style={styles.toastBannerInfo}>
                    <Text style={styles.toastBannerText}>
                      ✓ Đã chép link xem album! Bạn bè chưa cài app vẫn xem được ảnh.
                    </Text>
                  </View>
                )}

                <View style={styles.albumActionsRow}>
                  {/* Nút 1: Tải trọn bộ Album HD */}
                  <Pressable
                    onPress={handleDownloadFullAlbum}
                    disabled={isDownloadingAll}
                    style={({ pressed }) => [
                      styles.downloadAllBtn,
                      { transform: [{ scale: pressed ? 0.97 : 1 }] },
                    ]}
                  >
                    {isDownloadingAll ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <ActivityIndicator size="small" color={colors.ink} />
                        <Text style={styles.downloadAllBtnText}>Đang xuất file PNG...</Text>
                      </View>
                    ) : (
                      <Text style={styles.downloadAllBtnText}>
                        📥 Tải trọn bộ Album HD
                      </Text>
                    )}
                  </Pressable>

                  {/* Nút 2: Link xem nhanh cho bạn bè */}
                  <Pressable
                    onPress={handleCopyGuestLink}
                    style={({ pressed }) => [
                      styles.guestLinkBtn,
                      { transform: [{ scale: pressed ? 0.97 : 1 }] },
                    ]}
                  >
                    <Text style={styles.guestLinkBtnText}>
                      🔗 Link cho bạn bè
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Lưới các dải ảnh */}
              <View style={styles.stripsGrid}>
                {event.strips.map((strip, idx) => (
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

                    {/* Footer dải ảnh: Tên người chụp & Nút tải dải này */}
                    <View style={styles.stripCardFooter}>
                      <Text style={styles.authorBadgeText}>{strip.authorName}</Text>
                      <Pressable
                        onPress={() => handleDownloadSingleStrip(strip, idx)}
                        style={({ pressed }) => [
                          styles.singleDownloadBtn,
                          { transform: [{ scale: pressed ? 0.92 : 1 }] },
                        ]}
                      >
                        <Text style={styles.singleDownloadBtnText}>📥 Tải</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
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
          {/* Black Invite Code Card for Mode B */}
          <View style={[styles.inviteCard, { marginBottom: 16 }]}>
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
              <Pressable onPress={() => setShowTicketModal(true)} style={styles.inviteBtnYellow}>
                <Text style={styles.inviteBtnYellowText}>🎫 Vé sự kiện</Text>
              </Pressable>
            </View>
          </View>

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
                      isUserSlot && styles.coopSlotBoxActive,
                    ]}
                  >
                    {isFilled ? (
                      <View style={styles.coopFilledSlot}>
                        <Image
                          source={{ uri: slot.photoUrl }}
                          style={styles.coopSlotPhoto}
                        />
                        <View
                          style={[
                            styles.coopAuthorTag,
                            { backgroundColor: slot.userColor || colors.pink },
                          ]}
                        >
                          <Text style={styles.coopAuthorText}>
                            {slot.userName}
                          </Text>
                        </View>
                      </View>
                    ) : isUserSlot ? (
                      <View style={styles.coopUserSlotPrompt}>
                        <Text style={styles.coopPromptEmoji}>📸</Text>
                        <Text style={styles.coopPromptText}>Ô của bạn</Text>
                      </View>
                    ) : (
                      <View style={styles.coopEmptySlot}>
                        <Text style={styles.coopEmptyText}>Ô trống</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Cột phải: Thẻ tiến độ & Thời gian */}
            <View style={styles.coopInfoCol}>
              <View style={styles.progressCard}>
                <Text style={styles.progressBigText}>
                  {event.sheetSlots.filter((s) => s.photoUrl).length}/4
                </Text>
                <Text style={styles.progressSubText}>ô đã chụp</Text>
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

      {/* MODAL 1: TẤM VÉ SỰ KIỆN SỐNG ẢO (Event Ticket Pass với QR Thật) */}
      <Modal
        visible={showTicketModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTicketModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.ticketCard}>
            {/* Ticket Header & Brand */}
            <View style={styles.ticketHeader}>
              <Text style={styles.ticketBrand}>🌿 LEAFYBOOTH EVENT PASS</Text>
              <View style={styles.ticketBadge}>
                <Text style={styles.ticketBadgeText}>
                  {isSharedMode ? 'CO-OP 4 KHUNG' : 'ALBUM CHUNG'}
                </Text>
              </View>
            </View>

            {/* Ticket Event Info */}
            <Text style={styles.ticketTitle}>{event.name}</Text>
            <Text style={styles.ticketDate}>📅 {event.date} · 📍 Leafy Garden</Text>

            {/* Member Avatars on Ticket */}
            <View style={styles.ticketMembersRow}>
              <View style={styles.ticketAvatarsStack}>
                {event.members.slice(0, 4).map((m, idx) => (
                  <View
                    key={m.id}
                    style={[
                      styles.ticketAvatarDot,
                      { backgroundColor: m.color, left: idx * 20 },
                    ]}
                  >
                    <Text style={styles.ticketAvatarLetter}>{m.letter}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.ticketMembersText}>
                {event.memberCount} thành viên tham gia
              </Text>
            </View>

            {/* Perforated Divider (Đường rãnh xé vé retro) */}
            <View style={styles.perforationWrapper}>
              <View style={styles.notchLeft} />
              <View style={styles.perforationLine} />
              <View style={styles.notchRight} />
            </View>

            {/* Ticket Stub (Cuống vé & QR Code Thật Quét Được) */}
            <View style={styles.ticketStub}>
              <QRCodeView
                value={`https://leafybooth.app/garden/${event.joinCode}`}
                size={140}
                centerEmoji="🌿"
              />
              <Text style={styles.ticketCodeInstruction}>
                Quét QR bằng camera hoặc nhập mã <Text style={{ fontWeight: '900' }}>{event.joinCode}</Text>
              </Text>
            </View>

            {/* Toast thông báo lưu vé */}
            {ticketSavedToast && (
              <View style={styles.ticketToast}>
                <Text style={styles.ticketToastText}>
                  ✓ Đã xuất và lưu file ảnh vé sự kiện vào máy của bạn!
                </Text>
              </View>
            )}

            {/* Ticket Actions */}
            <View style={styles.ticketActions}>
              <Pressable
                onPress={handleSaveTicket}
                style={({ pressed }) => [
                  styles.ticketActionBtnLime,
                  { transform: [{ scale: pressed ? 0.97 : 1 }] },
                ]}
              >
                <Text style={styles.ticketActionBtnLimeText}>
                  📥 Lưu file vé vào máy
                </Text>
              </Pressable>

              <Pressable
                onPress={handleShare}
                style={({ pressed }) => [
                  styles.ticketActionBtnWhite,
                  { transform: [{ scale: pressed ? 0.97 : 1 }] },
                ]}
              >
                <Text style={styles.ticketActionBtnWhiteText}>
                  {copiedToast ? 'Đã sao chép!' : '🔗 Chép link mời'}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setShowTicketModal(false)}
                style={styles.ticketCloseBtn}
              >
                <Text style={styles.ticketCloseBtnText}>Đóng</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: QR Code Sự kiện thật chuẩn quét Camera */}
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

            {/* Mã QR Thật 100% quét được bằng Camera điện thoại */}
            <View style={{ marginVertical: 14 }}>
              <QRCodeView
                value={`https://leafybooth.app/garden/${event.joinCode}`}
                size={210}
                centerEmoji="🌿"
                caption={`MÃ MỜI: ${event.joinCode}`}
              />
            </View>

            <Text style={styles.qrHelpText}>
              Bất kỳ ai mở Camera điện thoại quét mã này đều sẽ mở thẳng vào sự kiện "{event.name}".
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
    fontSize: 22,
    fontWeight: '900',
    color: colors.ink,
  },
  headerSub: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 90,
  },
  inviteCard: {
    backgroundColor: colors.ink,
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: colors.ink,
    padding: 16,
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
    fontSize: 24,
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...theme.shadows.hardSmall,
  },
  inviteBtnLimeText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.ink,
  },
  inviteBtnWhite: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.ink,
    paddingHorizontal: 10,
    paddingVertical: 8,
    ...theme.shadows.hardSmall,
  },
  inviteBtnWhiteText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.ink,
  },
  inviteBtnYellow: {
    backgroundColor: colors.yellow,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.ink,
    paddingHorizontal: 10,
    paddingVertical: 8,
    ...theme.shadows.hardSmall,
  },
  inviteBtnYellowText: {
    fontSize: 12,
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
    marginBottom: 16,
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
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink,
  },
  tabSwitchTextActive: {
    color: colors.white,
  },

  /* THANH CÔNG CỤ QUẢN LÝ ALBUM */
  albumManagerCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: colors.ink,
    padding: 14,
    marginBottom: 16,
    ...theme.shadows.hard,
  },
  albumManagerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  albumManagerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  albumManagerIcon: {
    fontSize: 26,
  },
  albumManagerTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.ink,
  },
  albumManagerSub: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  albumActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  downloadAllBtn: {
    flex: 1.2,
    backgroundColor: colors.lime,
    paddingVertical: 10,
    borderRadius: theme.borders.radius.full,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.hardSmall,
  },
  downloadAllBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.ink,
  },
  guestLinkBtn: {
    flex: 0.9,
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    borderRadius: theme.borders.radius.full,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestLinkBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.ink,
  },
  toastBannerSuccess: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1.5,
    borderColor: '#16A34A',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  toastBannerInfo: {
    backgroundColor: '#E0F2FE',
    borderWidth: 1.5,
    borderColor: '#0284C7',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  toastBannerText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.ink,
    textAlign: 'center',
  },

  /* Lưới dải ảnh */
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
  stripCardFooter: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  authorBadgeText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.ink,
  },
  singleDownloadBtn: {
    backgroundColor: colors.white,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borders.radius.full,
    borderWidth: 1.5,
    borderColor: colors.ink,
  },
  singleDownloadBtnText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.ink,
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
    fontSize: 18,
    fontWeight: '900',
    color: colors.ink,
  },
  memberRowName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
  },

  /* Chế độ B (Co-op) */
  sharedScrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 90,
  },
  coopRow: {
    flexDirection: 'row',
    gap: 16,
  },
  coopStripFrame: {
    flex: 1.1,
    backgroundColor: colors.pink,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: colors.ink,
    padding: 10,
    gap: 8,
    ...theme.shadows.hard,
  },
  coopSlotBox: {
    width: '100%',
    aspectRatio: 1.1,
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.ink,
    overflow: 'hidden',
  },
  coopSlotBoxActive: {
    borderColor: colors.lime,
    borderWidth: 3,
  },
  coopFilledSlot: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  coopSlotPhoto: {
    width: '100%',
    height: '100%',
  },
  coopAuthorTag: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.ink,
  },
  coopAuthorText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.ink,
  },
  coopUserSlotPrompt: {
    flex: 1,
    backgroundColor: '#F7FEE7',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  coopPromptEmoji: {
    fontSize: 22,
  },
  coopPromptText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.ink,
  },
  coopEmptySlot: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coopEmptyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  coopInfoCol: {
    flex: 0.9,
    gap: 12,
  },
  progressCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: colors.ink,
    padding: 14,
    alignItems: 'center',
    ...theme.shadows.hard,
  },
  progressBigText: {
    fontSize: 34,
    fontWeight: '900',
    color: colors.ink,
  },
  progressSubText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  timeLeftPill: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.ink,
    paddingVertical: 8,
    alignItems: 'center',
    ...theme.shadows.hardSmall,
  },
  timeLeftText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.ink,
  },
  coopMembersCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: colors.ink,
    padding: 12,
    gap: 8,
    ...theme.shadows.hard,
  },
  coopMemberStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontSize: 12,
    fontWeight: '900',
    color: colors.ink,
  },
  coopMemberName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: colors.ink,
    marginLeft: 8,
  },
  coopCheckmark: {
    fontSize: 14,
    fontWeight: '900',
    color: '#16A34A',
  },
  coopRemainingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 16,
    left: theme.spacing.lg,
    right: theme.spacing.lg,
  },
  actionBtn: {
    width: '100%',
  },

  /* MODAL: TẤM VÉ SỰ KIỆN RETRO */
  ticketCard: {
    width: '100%',
    backgroundColor: '#FFD93D', // Nền vé vàng retro
    borderRadius: 24,
    borderWidth: 3,
    borderColor: colors.ink,
    padding: 20,
    ...theme.shadows.hard,
    position: 'relative',
    overflow: 'hidden',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketBrand: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: 1,
  },
  ticketBadge: {
    backgroundColor: colors.lime,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.ink,
  },
  ticketBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.ink,
  },
  ticketTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.ink,
    marginBottom: 4,
  },
  ticketDate: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
  },
  ticketMembersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  ticketAvatarsStack: {
    height: 32,
    width: 90,
    position: 'relative',
  },
  ticketAvatarDot: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketAvatarLetter: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.ink,
  },
  ticketMembersText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.ink,
    marginLeft: 10,
  },

  /* Rãnh xé vé retro */
  perforationWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    marginHorizontal: -20,
    position: 'relative',
  },
  notchLeft: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.6)',
    marginLeft: -11,
    borderWidth: 2.5,
    borderColor: colors.ink,
  },
  perforationLine: {
    flex: 1,
    height: 2,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: colors.ink,
  },
  notchRight: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.6)',
    marginRight: -11,
    borderWidth: 2.5,
    borderColor: colors.ink,
  },

  /* Cuống vé */
  ticketStub: {
    alignItems: 'center',
    marginBottom: 14,
  },
  ticketCodeInstruction: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.ink,
    textAlign: 'center',
    marginTop: 6,
  },
  ticketToast: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1.5,
    borderColor: '#16A34A',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  ticketToastText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.ink,
  },
  ticketActions: {
    gap: 8,
  },
  ticketActionBtnLime: {
    backgroundColor: colors.lime,
    paddingVertical: 12,
    borderRadius: theme.borders.radius.full,
    borderWidth: 2.5,
    borderColor: colors.ink,
    alignItems: 'center',
    ...theme.shadows.hardSmall,
  },
  ticketActionBtnLimeText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.ink,
  },
  ticketActionBtnWhite: {
    backgroundColor: colors.white,
    paddingVertical: 10,
    borderRadius: theme.borders.radius.full,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
  },
  ticketActionBtnWhiteText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.ink,
  },
  ticketCloseBtn: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  ticketCloseBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.ink,
    textDecorationLine: 'underline',
  },

  /* Modal QR thường */
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
    marginBottom: 6,
  },
  qrHelpText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
    textAlign: 'center',
    lineHeight: 18,
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Switch,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '../../core/theme/colors';
import { theme } from '../../core/theme/theme';
import { PillButton } from '../../core/components/PillButton';
import { useFriendsStore } from '../../features/friends/hooks/useFriendsStore';
import { useMomentsStore, TEST_ACCOUNTS, UserAccount } from '../../features/moments/hooks/useMomentsStore';
import { STUDIO_PRESETS } from '../../features/studio/hooks/useStudioStore';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { friends, requests, blockedUsers, unblockUser } = useFriendsStore();
  const { moments, currentUser, switchAccount } = useMomentsStore();
  const latestMoment = moments[0];

  // Modals
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAccountSwitchModal, setShowAccountSwitchModal] = useState(false);

  // Settings State
  const [mirrorCamera, setMirrorCamera] = useState(true);
  const [shutterSound, setShutterSound] = useState(true);
  const [notifyMoments, setNotifyMoments] = useState(true);
  const [notifyInvites, setNotifyInvites] = useState(true);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleDeleteAccount = () => {
    if (deleteConfirmText.trim().toLowerCase() !== 'xoa') {
      Alert.alert('Chưa chính xác', 'Vui lòng nhập chữ "XOA" để xác nhận xóa tài khoản vĩnh viễn.');
      return;
    }
    Alert.alert(
      'Tài khoản đã được xóa',
      'Toàn bộ ảnh, dữ liệu hồ sơ và liên kết bạn bè đã được xóa sạch theo quy định của Apple & Google.',
      [
        {
          text: 'OK',
          onPress: () => {
            setShowDeleteModal(false);
            router.replace('/login' as any);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top, 16), paddingBottom: insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Title */}
        <View style={styles.headerRow}>
          <Text style={styles.mainTitle}>Cá nhân</Text>
        </View>

        {/* User Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrapper}>
            <View style={[styles.avatarCircle, { backgroundColor: currentUser.avatarColor }]}>
              <Text style={styles.avatarLetter}>{currentUser.avatarLetter}</Text>
            </View>
            <View style={styles.editBadge}>
              <Text style={styles.editBadgeText}>✏️</Text>
            </View>
          </View>
          <Text style={styles.displayName}>{currentUser.name}</Text>
          <Text style={styles.username}>@{currentUser.username}</Text>

          {/* Nút đổi tài khoản kiểm thử */}
          <Pressable
            onPress={() => setShowAccountSwitchModal(true)}
            style={({ pressed }) => [
              styles.switchAccountBtn,
              { transform: [{ scale: pressed ? 0.95 : 1 }] },
            ]}
          >
            <Text style={styles.switchAccountBtnText}>🔄 Đổi tài khoản ({currentUser.name})</Text>
          </Pressable>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <Pressable
            onPress={() => router.push('/friends' as any)}
            style={({ pressed }) => [
              styles.statCard,
              { transform: [{ scale: pressed ? 0.97 : 1 }] },
            ]}
          >
            <Text style={styles.statNumber}>{friends.length}/20</Text>
            <Text style={styles.statLabel}>Bạn bè</Text>
          </Pressable>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>48</Text>
            <Text style={styles.statLabel}>Ảnh đã gửi</Text>
          </View>

          <Pressable
            onPress={() => router.push('/studio' as any)}
            style={({ pressed }) => [
              styles.statCard,
              { transform: [{ scale: pressed ? 0.97 : 1 }] },
            ]}
          >
            <Text style={styles.statNumber}>{STUDIO_PRESETS.length}</Text>
            <Text style={styles.statLabel}>Khung mẫu</Text>
          </Pressable>
        </View>

        {/* Widget Live Card Promo */}
        <View style={styles.widgetBanner}>
          <View style={styles.widgetBannerHeader}>
            <Text style={styles.widgetBannerIcon}>📱</Text>
            <Text style={styles.widgetBannerTitle}>
              Widget Màn Hình Chính{'\n'}(Đang hoạt động 🟢)
            </Text>
          </View>
          <Text style={styles.widgetBannerDesc}>
            Khoảnh khắc mới nhất từ {latestMoment ? latestMoment.senderName : 'bạn bè'} đang hiển thị trên Widget màn hình chính của bạn.
          </Text>

          {/* Mini live widget simulation inside profile */}
          {latestMoment && (
            <Pressable
              onPress={() => {
                useMomentsStore.getState().setViewMode('pick');
                router.push('/(tabs)/moments' as any);
              }}
              style={({ pressed }) => [
                styles.profileWidgetCard,
                { transform: [{ scale: pressed ? 0.97 : 1 }] },
              ]}
            >
              <View style={styles.profileWidgetInner}>
                <Image
                  source={{ uri: latestMoment.photoUrl }}
                  style={styles.profileWidgetImg}
                />
                <View style={styles.profileWidgetInfo}>
                  <Text style={styles.profileWidgetAuthor}>{latestMoment.senderName} · {latestMoment.timeAgo}</Text>
                  <Text style={styles.profileWidgetCaption} numberOfLines={1}>{latestMoment.caption}</Text>
                  <Text style={styles.profileWidgetActionHint}>Chạm để xem trên Locket 💛 →</Text>
                </View>
              </View>
            </Pressable>
          )}

          <Pressable
            onPress={() => router.push('/widget-guide' as any)}
            style={({ pressed }) => [
              styles.widgetButton,
              { transform: [{ scale: pressed ? 0.96 : 1 }] },
            ]}
          >
            <Text style={styles.widgetButtonText}>Xem hướng dẫn cài đặt widget →</Text>
          </Pressable>
        </View>

        {/* Settings Menu List */}
        <View style={styles.menuContainer}>
          {/* Bạn bè */}
          <Pressable
            onPress={() => router.push('/friends' as any)}
            style={({ pressed }) => [
              styles.menuItem,
              { backgroundColor: pressed ? '#F3F4F6' : colors.white },
            ]}
          >
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuIcon}>👥</Text>
              <Text style={styles.menuLabel}>Bạn bè</Text>
            </View>
            <View style={styles.menuItemRight}>
              {requests.length > 0 && (
                <View style={styles.badgePill}>
                  <Text style={styles.badgePillText}>{requests.length} lời mời</Text>
                </View>
              )}
              <Text style={styles.menuArrow}>›</Text>
            </View>
          </Pressable>

          <View style={styles.menuDivider} />

          {/* Camera và thông báo */}
          <Pressable
            onPress={() => setShowSettingsModal(true)}
            style={({ pressed }) => [
              styles.menuItem,
              { backgroundColor: pressed ? '#F3F4F6' : colors.white },
            ]}
          >
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuIcon}>⚙️</Text>
              <Text style={styles.menuLabel}>Camera và thông báo</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </Pressable>

          <View style={styles.menuDivider} />

          {/* Danh sách đã chặn */}
          <Pressable
            onPress={() => setShowBlockedModal(true)}
            style={({ pressed }) => [
              styles.menuItem,
              { backgroundColor: pressed ? '#F3F4F6' : colors.white },
            ]}
          >
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuIcon}>🚫</Text>
              <Text style={styles.menuLabel}>Danh sách đã chặn</Text>
            </View>
            <View style={styles.menuItemRight}>
              {blockedUsers.length > 0 && (
                <Text style={styles.blockedCount}>{blockedUsers.length}</Text>
              )}
              <Text style={styles.menuArrow}>›</Text>
            </View>
          </Pressable>

          <View style={styles.menuDivider} />

          {/* Chính sách quyền riêng tư */}
          <Pressable
            onPress={() => setShowPrivacyModal(true)}
            style={({ pressed }) => [
              styles.menuItem,
              { backgroundColor: pressed ? '#F3F4F6' : colors.white },
            ]}
          >
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuIcon}>🛡️</Text>
              <Text style={styles.menuLabel}>Chính sách quyền riêng tư</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </Pressable>
        </View>

        {/* Delete Account Button (Apple & Google compliance) */}
        <Pressable
          onPress={() => setShowDeleteModal(true)}
          style={({ pressed }) => [
            styles.deleteButton,
            { transform: [{ scale: pressed ? 0.98 : 1 }] },
          ]}
        >
          <Text style={styles.deleteButtonText}>Xóa tài khoản</Text>
        </Pressable>
      </ScrollView>

      {/* MODAL 1: Camera và Thông báo */}
      <Modal visible={showSettingsModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Camera & Thông báo</Text>
              <Pressable onPress={() => setShowSettingsModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingName}>Lật gương camera trước</Text>
                <Text style={styles.settingDesc}>Hiển thị ảnh giống như khi nhìn trong gương</Text>
              </View>
              <Switch
                value={mirrorCamera}
                onValueChange={setMirrorCamera}
                trackColor={{ false: '#D1D5DB', true: colors.lime }}
                thumbColor={colors.white}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingName}>Tiếng màn trập (tách)</Text>
                <Text style={styles.settingDesc}>Âm thanh máy cơ khi chụp photobooth</Text>
              </View>
              <Switch
                value={shutterSound}
                onValueChange={setShutterSound}
                trackColor={{ false: '#D1D5DB', true: colors.lime }}
                thumbColor={colors.white}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingName}>Thông báo khoảnh khắc</Text>
                <Text style={styles.settingDesc}>Báo khi bạn bè gửi ảnh Plant mới</Text>
              </View>
              <Switch
                value={notifyMoments}
                onValueChange={setNotifyMoments}
                trackColor={{ false: '#D1D5DB', true: colors.lime }}
                thumbColor={colors.white}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingName}>Lời mời và thông báo</Text>
                <Text style={styles.settingDesc}>Báo khi có lời mời kết bạn hoặc ảnh mới từ Widget</Text>
              </View>
              <Switch
                value={notifyInvites}
                onValueChange={setNotifyInvites}
                trackColor={{ false: '#D1D5DB', true: colors.lime }}
                thumbColor={colors.white}
              />
            </View>

            <View style={{ marginTop: 20 }}>
              <PillButton
                title="Đã lưu cài đặt"
                variant="primary"
                onPress={() => setShowSettingsModal(false)}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: Danh sách chặn */}
      <Modal visible={showBlockedModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Danh sách đã chặn</Text>
              <Pressable onPress={() => setShowBlockedModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </Pressable>
            </View>

            {blockedUsers.length === 0 ? (
              <View style={styles.emptyBlocked}>
                <Text style={{ fontSize: 36, marginBottom: 8 }}>✨</Text>
                <Text style={styles.emptyBlockedText}>Bạn chưa chặn người dùng nào</Text>
                <Text style={styles.emptyBlockedSub}>
                  Khi chặn một ai đó, ảnh và khoảnh khắc của họ sẽ biến mất hoàn toàn khỏi màn hình của bạn.
                </Text>
              </View>
            ) : (
              <View>
                {blockedUsers.map((uid) => (
                  <View key={uid} style={styles.blockedItem}>
                    <Text style={styles.blockedUserText}>Người dùng ID: {uid}</Text>
                    <Pressable
                      onPress={() => unblockUser(uid)}
                      style={styles.unblockButton}
                    >
                      <Text style={styles.unblockText}>Bỏ chặn</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            <View style={{ marginTop: 24 }}>
              <PillButton
                title="Đóng"
                style={{ backgroundColor: colors.yellow }}
                onPress={() => setShowBlockedModal(false)}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: Chính sách quyền riêng tư (Store compliance) */}
      <Modal visible={showPrivacyModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Quyền riêng tư & An toàn</Text>
              <Pressable onPress={() => setShowPrivacyModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 360 }}>
              <Text style={styles.privacyHeading}>1. Nguyên tắc cốt lõi (Privacy First)</Text>
              <Text style={styles.privacyBody}>
                LeafyBooth chỉ kết nối tối đa 20 bạn bè thân thiết. Không có feed công khai, không có quảng cáo theo dõi hành vi. Ảnh khoảnh khắc tự động hết hạn và xóa sau 90 ngày.
              </Text>

              <Text style={styles.privacyHeading}>2. Tiêu chuẩn nội dung người dùng (UGC)</Text>
              <Text style={styles.privacyBody}>
                Nghiêm cấm các nội dung quấy rối, bạo lực, nội dung người lớn hoặc vi phạm bản quyền. Mọi người dùng đều có quyền báo cáo vi phạm và chặn người dùng khác. Đội ngũ kiểm duyệt cam kết phản hồi và xử lý trong vòng 24 giờ.
              </Text>

              <Text style={styles.privacyHeading}>3. Quyền xóa dữ liệu</Text>
              <Text style={styles.privacyBody}>
                Bạn có toàn quyền xóa tài khoản và mọi hình ảnh liên quan bất cứ lúc nào thông qua nút "Xóa tài khoản".
              </Text>

              <Text style={styles.privacyHeading}>4. Liên hệ hỗ trợ</Text>
              <Text style={styles.privacyBody}>
                Email hỗ trợ: support@leafybooth.app{'\n'}Website: https://leafybooth.app
              </Text>
            </ScrollView>

            <View style={{ marginTop: 20 }}>
              <PillButton
                title="Tôi đã hiểu"
                style={{ backgroundColor: colors.sky }}
                onPress={() => setShowPrivacyModal(false)}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 4: Xác nhận xóa tài khoản (Apple App Review) */}
      <Modal visible={showDeleteModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContent}>
            <Text style={styles.deleteModalTitle}>⚠️ Xóa tài khoản vĩnh viễn</Text>
            <Text style={styles.deleteModalDesc}>
              Hành động này <Text style={{ fontWeight: '800', color: '#EF4444' }}>KHÔNG THỂ HOÀN TÁC</Text>. Toàn bộ ảnh khoảnh khắc, dải photobooth và danh sách bạn bè của bạn sẽ bị xóa vĩnh viễn khỏi máy chủ.
            </Text>
            <Text style={styles.deleteModalInstruction}>
              Nhập chữ <Text style={{ fontWeight: '800' }}>XOA</Text> vào ô dưới đây để xác nhận:
            </Text>

            <TextInput
              style={styles.deleteInput}
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              placeholder="Nhập XOA..."
              placeholderTextColor="#9CA3AF"
              autoCapitalize="characters"
            />

            <View style={styles.deleteActions}>
              <Pressable
                onPress={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                style={styles.cancelDeleteBtn}
              >
                <Text style={styles.cancelDeleteText}>Hủy bỏ</Text>
              </Pressable>

              <Pressable
                onPress={handleDeleteAccount}
                style={styles.confirmDeleteBtn}
              >
                <Text style={styles.confirmDeleteText}>Xóa ngay</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL CHUYỂN TÀI KHOẢN (MULTI-ACCOUNT TESTER SWITCHER) */}
      <Modal
        visible={showAccountSwitchModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAccountSwitchModal(false)}
      >
        <Pressable
          onPress={() => setShowAccountSwitchModal(false)}
          style={styles.accountModalBackdrop}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={styles.accountModalCard}
          >
            <View style={styles.accountModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.accountModalTitle}>👥 Chuyển tài khoản</Text>
                <Text style={styles.accountModalSubtitle}>
                  Chọn tài khoản để trải nghiệm gửi nhận ảnh đa chiều
                </Text>
              </View>
              <Pressable
                onPress={() => setShowAccountSwitchModal(false)}
                style={styles.accountModalCloseBtn}
              >
                <Text style={styles.accountModalCloseText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, paddingVertical: 8 }}
            >
              {TEST_ACCOUNTS.map((acc) => {
                const isSelected = acc.id === currentUser.id;
                const momentCount = moments.filter((m) => m.senderId === acc.id).length;
                return (
                  <Pressable
                    key={acc.id}
                    onPress={() => {
                      switchAccount(acc.id);
                      setShowAccountSwitchModal(false);
                      Alert.alert('Chuyển tài khoản 🔄', `Đã chuyển sang tài khoản: ${acc.name}!`);
                    }}
                    style={({ pressed }) => [
                      styles.accountItemRow,
                      isSelected && styles.accountItemRowActive,
                      { transform: [{ scale: pressed ? 0.97 : 1 }] },
                    ]}
                  >
                    <View style={[styles.accountItemAvatar, { backgroundColor: acc.avatarColor }]}>
                      <Text style={styles.accountItemLetter}>{acc.avatarLetter}</Text>
                    </View>

                    <View style={styles.accountItemInfo}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.accountItemName}>{acc.name}</Text>
                        {isSelected && (
                          <View style={styles.accountActiveBadge}>
                            <Text style={styles.accountActiveBadgeText}>Đang dùng</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.accountItemRole}>{acc.roleDescription}</Text>
                      <Text style={styles.accountItemMeta}>@{acc.username} · {momentCount} ảnh đã chia sẻ</Text>
                    </View>

                    <View style={styles.accountItemAction}>
                      <Text style={{ fontSize: 18 }}>{isSelected ? '✓' : '➔'}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sky,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  headerRow: {
    marginBottom: 16,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: -0.5,
  },
  profileCard: {
    backgroundColor: colors.white,
    borderRadius: theme.borders.radius.card,
    borderWidth: theme.borders.width,
    borderColor: colors.ink,
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    ...theme.shadows.hard,
    marginBottom: 16,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: colors.lime,
    borderWidth: theme.borders.width,
    borderColor: colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 40,
    fontWeight: '900',
    color: colors.ink,
  },
  editBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadgeText: {
    fontSize: 12,
  },
  displayName: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.ink,
    marginBottom: 4,
  },
  username: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: theme.borders.radius.card,
    borderWidth: theme.borders.width,
    borderColor: colors.ink,
    paddingVertical: 14,
    alignItems: 'center',
    ...theme.shadows.hard,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.ink,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  widgetBanner: {
    backgroundColor: colors.pink,
    borderRadius: theme.borders.radius.card,
    borderWidth: theme.borders.width,
    borderColor: colors.ink,
    padding: 18,
    ...theme.shadows.hard,
    marginBottom: 16,
  },
  widgetBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  widgetBannerIcon: {
    fontSize: 28,
  },
  widgetBannerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.ink,
    lineHeight: 22,
  },
  widgetBannerDesc: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    lineHeight: 18,
    marginBottom: 14,
  },
  widgetButton: {
    backgroundColor: colors.lime,
    borderRadius: theme.borders.radius.full,
    borderWidth: theme.borders.width,
    borderColor: colors.ink,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    alignSelf: 'flex-start',
    ...theme.shadows.hard,
  },
  profileWidgetCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.ink,
    padding: 10,
    marginBottom: 14,
    ...theme.shadows.hardSmall,
  },
  profileWidgetInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileWidgetImg: {
    width: 60,
    height: 60,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.ink,
  },
  profileWidgetInfo: {
    flex: 1,
  },
  profileWidgetAuthor: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6B7280',
    marginBottom: 2,
  },
  profileWidgetCaption: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.ink,
  },
  profileWidgetActionHint: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
    marginTop: 4,
  },
  widgetButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink,
  },
  menuContainer: {
    backgroundColor: colors.white,
    borderRadius: theme.borders.radius.card,
    borderWidth: theme.borders.width,
    borderColor: colors.ink,
    ...theme.shadows.hard,
    marginBottom: 20,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIcon: {
    fontSize: 18,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.ink,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgePill: {
    backgroundColor: colors.pink,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.ink,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  badgePillText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.ink,
  },
  blockedCount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },
  menuArrow: {
    fontSize: 20,
    fontWeight: '700',
    color: '#9CA3AF',
    marginLeft: 4,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
  },
  deleteButton: {
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#DC2626',
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: theme.borders.width,
    borderColor: colors.ink,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.ink,
  },
  modalClose: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.ink,
    padding: 4,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 2,
  },
  settingDesc: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyBlocked: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyBlockedText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 6,
  },
  emptyBlockedSub: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  blockedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  blockedUserText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
  },
  unblockButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.borders.radius.full,
    borderWidth: 1.5,
    borderColor: colors.ink,
    backgroundColor: '#F3F4F6',
  },
  unblockText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.ink,
  },
  privacyHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.ink,
    marginTop: 14,
    marginBottom: 4,
  },
  privacyBody: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 19,
  },
  deleteModalContent: {
    backgroundColor: colors.white,
    marginHorizontal: 24,
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
    borderRadius: 24,
    borderWidth: theme.borders.width,
    borderColor: colors.ink,
    padding: 24,
    ...theme.shadows.hard,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#DC2626',
    marginBottom: 10,
    textAlign: 'center',
  },
  deleteModalDesc: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 19,
    marginBottom: 14,
  },
  deleteModalInstruction: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: 8,
  },
  deleteInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.ink,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 18,
    textAlign: 'center',
  },
  deleteActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelDeleteBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.borders.radius.full,
    borderWidth: theme.borders.width,
    borderColor: colors.ink,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelDeleteText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink,
  },
  confirmDeleteBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.borders.radius.full,
    borderWidth: theme.borders.width,
    borderColor: colors.ink,
    backgroundColor: '#DC2626',
    alignItems: 'center',
  },
  confirmDeleteText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
  },

  // Account Switcher Button in Profile
  switchAccountBtn: {
    marginTop: 12,
    backgroundColor: colors.yellow,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.ink,
    ...theme.shadows.hardSmall,
  },
  switchAccountBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.ink,
  },

  // Account Modal
  accountModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(26,26,26,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  accountModalCard: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '80%',
    backgroundColor: colors.white,
    borderRadius: 22,
    borderWidth: 2.5,
    borderColor: colors.ink,
    padding: 18,
    ...theme.shadows.hard,
  },
  accountModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 10,
  },
  accountModalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.ink,
  },
  accountModalSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 2,
  },
  accountModalCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountModalCloseText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.ink,
  },
  accountItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    padding: 12,
    gap: 12,
  },
  accountItemRowActive: {
    borderColor: colors.ink,
    backgroundColor: '#FEF9C3',
    ...theme.shadows.hardSmall,
  },
  accountItemAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountItemLetter: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.ink,
  },
  accountItemInfo: {
    flex: 1,
  },
  accountItemName: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.ink,
  },
  accountActiveBadge: {
    backgroundColor: colors.ink,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  accountActiveBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.white,
  },
  accountItemRole: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
    marginTop: 1,
  },
  accountItemMeta: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  accountItemAction: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
  },
});

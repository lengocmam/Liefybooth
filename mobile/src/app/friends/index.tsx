import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '../../core/theme/colors';
import { theme } from '../../core/theme/theme';
import { PillButton } from '../../core/components/PillButton';
import { QRCodeView } from '../../core/components/QRCodeView';
import { useFriendsStore, FriendUser } from '../../features/friends/hooks/useFriendsStore';

export default function FriendsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    friends,
    requests,
    maxFriends,
    acceptRequest,
    declineRequest,
    sendRequest,
    removeFriend,
    blockUser,
  } = useFriendsStore();

  const [searchUsername, setSearchUsername] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<FriendUser | null>(null);

  const handleSendFriendRequest = () => {
    if (!searchUsername.trim()) {
      Alert.alert('Chưa nhập username', 'Vui lòng nhập @username của bạn bè để gửi lời mời.');
      return;
    }

    if (friends.length >= maxFriends) {
      Alert.alert(
        'Đã đạt giới hạn 20 bạn',
        'LeafyBooth giới hạn tối đa 20 người bạn thân thiết. Bạn cần hủy bớt kết bạn trước khi thêm người mới.'
      );
      return;
    }

    const success = sendRequest(searchUsername);
    if (success) {
      Alert.alert('Đã gửi lời mời', `Đã gửi lời mời kết bạn tới @${searchUsername.replace('@', '')}!`);
      setSearchUsername('');
    } else {
      Alert.alert('Không thể gửi', 'Người này đã có trong danh sách bạn bè của bạn.');
    }
  };

  const handleShareLink = () => {
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
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
        <Text style={styles.headerTitle}>Bạn bè và lời mời</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Card (12/20) */}
        <View style={styles.limitCard}>
          <View style={styles.limitHeader}>
            <Text style={styles.limitTitle}>
              {friends.length} / {maxFriends} bạn
            </Text>
            <Text style={styles.limitBadge}>
              Còn {maxFriends - friends.length} chỗ
            </Text>
          </View>

          {/* Progress bar */}
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${(friends.length / maxFriends) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.limitDesc}>
            Giới hạn tối đa 20 người bạn thân để giữ trọn sự gắn kết và ấm cúng trên Leafybooth.
          </Text>
        </View>

        {/* Search / Add Friend by Username */}
        <View style={styles.searchSection}>
          <Text style={styles.sectionTitle}>Thêm bạn qua @username</Text>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              value={searchUsername}
              onChangeText={setSearchUsername}
              placeholder="Nhập @username..."
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              onPress={handleSendFriendRequest}
              style={({ pressed }) => [
                styles.addBtn,
                { transform: [{ scale: pressed ? 0.95 : 1 }] },
              ]}
            >
              <Text style={styles.addBtnText}>Thêm</Text>
            </Pressable>
          </View>
        </View>

        {/* QR & Share Row */}
        <View style={styles.quickShareRow}>
          <Pressable
            onPress={() => setShowQrModal(true)}
            style={({ pressed }) => [
              styles.shareActionCard,
              { transform: [{ scale: pressed ? 0.97 : 1 }] },
            ]}
          >
            <Text style={styles.shareActionIcon}>📱</Text>
            <Text style={styles.shareActionLabel}>Mã QR của tôi</Text>
          </Pressable>

          <Pressable
            onPress={handleShareLink}
            style={({ pressed }) => [
              styles.shareActionCard,
              { backgroundColor: colors.yellow, transform: [{ scale: pressed ? 0.97 : 1 }] },
            ]}
          >
            <Text style={styles.shareActionIcon}>🔗</Text>
            <Text style={styles.shareActionLabel}>
              {copiedToast ? 'Đã sao chép!' : 'Chia sẻ liên kết'}
            </Text>
          </Pressable>
        </View>

        {/* Friend Requests Section */}
        {requests.length > 0 && (
          <View style={styles.requestsSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Lời mời kết bạn</Text>
              <View style={styles.requestsCountBadge}>
                <Text style={styles.requestsCountText}>{requests.length}</Text>
              </View>
            </View>

            {requests.map((req) => (
              <View key={req.id} style={styles.requestCard}>
                <View style={styles.requestLeft}>
                  <View style={[styles.avatarCircle, { backgroundColor: req.color }]}>
                    <Text style={styles.avatarLetter}>{req.letter}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.requestName}>{req.name}</Text>
                    <Text style={styles.requestUsername}>@{req.username} · {req.sentAt}</Text>
                  </View>
                </View>

                <View style={styles.requestActions}>
                  <Pressable
                    onPress={() => acceptRequest(req.id)}
                    style={({ pressed }) => [
                      styles.acceptBtn,
                      { transform: [{ scale: pressed ? 0.95 : 1 }] },
                    ]}
                  >
                    <Text style={styles.acceptBtnText}>Nhận</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => declineRequest(req.id)}
                    style={({ pressed }) => [
                      styles.declineBtn,
                      { transform: [{ scale: pressed ? 0.95 : 1 }] },
                    ]}
                  >
                    <Text style={styles.declineBtnText}>Bỏ qua</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Existing Friends List */}
        <View style={styles.friendsSection}>
          <Text style={styles.sectionTitle}>
            Danh sách bạn bè ({friends.length})
          </Text>

          <View style={styles.friendsCardList}>
            {friends.map((f, idx) => (
              <React.Fragment key={f.id}>
                <Pressable
                  onPress={() => setSelectedFriend(f)}
                  style={({ pressed }) => [
                    styles.friendItem,
                    { backgroundColor: pressed ? colors.darkSurfaceHighlight : colors.darkSurface },
                  ]}
                >
                  <View style={styles.friendLeft}>
                    <View style={[styles.avatarCircleSmall, { backgroundColor: f.color }]}>
                      <Text style={styles.avatarLetterSmall}>{f.letter}</Text>
                    </View>
                    <View>
                      <Text style={styles.friendName}>{f.name}</Text>
                      <Text style={styles.friendUsername}>@{f.username}</Text>
                    </View>
                  </View>
                  <Text style={styles.friendActionDot}>⋮</Text>
                </Pressable>
                {idx < friends.length - 1 && <View style={styles.friendDivider} />}
              </React.Fragment>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* MODAL: QR Code kết bạn */}
      <Modal visible={showQrModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.qrModalContent}>
            <Text style={styles.qrTitle}>Mã QR của bạn</Text>
            <Text style={styles.qrSubtitle}>Quét để kết bạn ngay với @ten_ban</Text>

            {/* QR Pattern thật quét được */}
            <View style={{ marginVertical: 14 }}>
              <QRCodeView
                value="https://leafybooth.app/u/ten_ban"
                size={180}
                centerEmoji="🌿"
              />
            </View>

            <View style={styles.qrLinkPill}>
              <Text style={styles.qrLinkText}>leafybooth.app/u/ten_ban</Text>
            </View>

            <View style={{ width: '100%', gap: 10 }}>
              <PillButton
                title={copiedToast ? '✓ Đã sao chép liên kết!' : 'Sao chép liên kết'}
                variant="primary"
                onPress={handleShareLink}
              />
              <PillButton
                title="Đóng"
                variant="white"
                onPress={() => setShowQrModal(false)}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: Friend Actions (Unfriend, Block) */}
      <Modal visible={!!selectedFriend} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.actionModalContent}>
            <View style={styles.actionFriendHeader}>
              <View style={[styles.avatarCircle, { backgroundColor: selectedFriend?.color || colors.lime }]}>
                <Text style={styles.avatarLetter}>{selectedFriend?.letter}</Text>
              </View>
              <Text style={styles.actionFriendName}>{selectedFriend?.name}</Text>
              <Text style={styles.actionFriendUser}>@{selectedFriend?.username}</Text>
            </View>

            <Pressable
              onPress={() => {
                if (selectedFriend) {
                  removeFriend(selectedFriend.id);
                  setSelectedFriend(null);
                  Alert.alert('Đã hủy kết bạn', `Bạn đã hủy kết bạn với ${selectedFriend.name}.`);
                }
              }}
              style={styles.actionOption}
            >
              <Text style={styles.actionOptionText}>Hủy kết bạn</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                if (selectedFriend) {
                  blockUser(selectedFriend.id);
                  setSelectedFriend(null);
                  Alert.alert(
                    'Đã chặn người dùng',
                    `Đã chặn ${selectedFriend.name}. Ảnh và khoảnh khắc của họ sẽ biến mất khỏi màn hình của bạn.`
                  );
                }
              }}
              style={styles.actionOptionDanger}
            >
              <Text style={styles.actionOptionTextDanger}>Chặn người này (Báo cáo vi phạm)</Text>
            </Pressable>

            <View style={{ marginTop: 14 }}>
              <PillButton
                title="Đóng"
                variant="white"
                onPress={() => setSelectedFriend(null)}
              />
            </View>
          </View>
        </View>
      </Modal>
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
    fontSize: 20,
    fontWeight: '900',
    color: colors.white,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  limitCard: {
    backgroundColor: colors.darkSurface,
    borderRadius: theme.borders.radius.card,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    padding: 18,
    ...theme.shadows.darkSoft,
    marginBottom: 16,
  },
  limitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  limitTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.ink,
  },
  limitBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.ink,
    backgroundColor: colors.lime,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.ink,
  },
  progressBarBg: {
    height: 14,
    backgroundColor: '#E5E7EB',
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.ink,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.lime,
  },
  limitDesc: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    lineHeight: 16,
  },
  searchSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.ink,
    marginBottom: 8,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    backgroundColor: colors.white,
    borderRadius: theme.borders.radius.full,
    borderWidth: theme.borders.width,
    borderColor: colors.ink,
    paddingHorizontal: 18,
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
    ...theme.shadows.hard,
  },
  addBtn: {
    height: 50,
    paddingHorizontal: 22,
    backgroundColor: colors.lime,
    borderRadius: theme.borders.radius.full,
    borderWidth: theme.borders.width,
    borderColor: colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.hard,
  },
  addBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.ink,
  },
  quickShareRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  shareActionCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.white,
    paddingVertical: 14,
    borderRadius: theme.borders.radius.card,
    borderWidth: theme.borders.width,
    borderColor: colors.ink,
    ...theme.shadows.hard,
  },
  shareActionIcon: {
    fontSize: 18,
  },
  shareActionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.ink,
  },
  requestsSection: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  requestsCountBadge: {
    backgroundColor: colors.pink,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.ink,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  requestsCountText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.ink,
  },
  requestCard: {
    backgroundColor: colors.darkSurface,
    borderRadius: theme.borders.radius.card,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    padding: 14,
    ...theme.shadows.darkSoft,
    marginBottom: 10,
  },
  requestLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.ink,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  requestUsername: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 10,
  },
  acceptBtn: {
    flex: 1,
    backgroundColor: colors.accentYellow,
    paddingVertical: 10,
    borderRadius: theme.borders.radius.full,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    alignItems: 'center',
    ...theme.shadows.darkSoft,
  },
  acceptBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.ink,
  },
  declineBtn: {
    flex: 1,
    backgroundColor: colors.darkSurfaceElevated,
    paddingVertical: 10,
    borderRadius: theme.borders.radius.full,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    alignItems: 'center',
  },
  declineBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  friendsSection: {
    marginBottom: 20,
  },
  friendsCardList: {
    backgroundColor: colors.darkSurface,
    borderRadius: theme.borders.radius.card,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    ...theme.shadows.darkSoft,
    overflow: 'hidden',
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  friendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircleSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetterSmall: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.ink,
  },
  friendName: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  friendUsername: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  friendActionDot: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textSecondary,
    paddingHorizontal: 8,
  },
  friendDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  qrModalContent: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 28,
    borderWidth: theme.borders.width,
    borderColor: colors.ink,
    padding: 24,
    alignItems: 'center',
    ...theme.shadows.hard,
  },
  qrTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.ink,
    marginBottom: 4,
  },
  qrSubtitle: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 20,
  },
  qrBox: {
    width: 200,
    height: 200,
    backgroundColor: '#FAFAFA',
    borderWidth: 3,
    borderColor: colors.ink,
    borderRadius: 20,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  qrCornerTL: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 38,
    height: 38,
    borderWidth: 5,
    borderColor: colors.ink,
  },
  qrCornerTR: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 38,
    height: 38,
    borderWidth: 5,
    borderColor: colors.ink,
  },
  qrCornerBL: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    width: 38,
    height: 38,
    borderWidth: 5,
    borderColor: colors.ink,
  },
  qrCenterAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.lime,
    borderWidth: 2,
    borderColor: colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrCenterLetter: {
    fontSize: 22,
  },
  qrSimulatedText: {
    position: 'absolute',
    bottom: 14,
    fontSize: 8,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 1,
  },
  qrLinkPill: {
    backgroundColor: '#F3F4F6',
    borderRadius: theme.borders.radius.full,
    borderWidth: 1.5,
    borderColor: colors.ink,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 20,
  },
  qrLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink,
  },
  actionModalContent: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 28,
    borderWidth: theme.borders.width,
    borderColor: colors.ink,
    padding: 24,
    ...theme.shadows.hard,
  },
  actionFriendHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  actionFriendName: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.ink,
    marginTop: 8,
  },
  actionFriendUser: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  actionOption: {
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.ink,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    marginBottom: 10,
  },
  actionOptionText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink,
  },
  actionOptionDanger: {
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#DC2626',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
  },
  actionOptionTextDanger: {
    fontSize: 14,
    fontWeight: '800',
    color: '#DC2626',
  },
});

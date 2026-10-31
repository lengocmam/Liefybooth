import React, { useState, useMemo } from 'react';
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
import { useAuthStore, formatPhoneNumber } from '../../features/auth/hooks/useAuthStore';
import { playShutterSound } from '../../features/booth/services/soundService';
import { useChatStore } from '../../features/chat/hooks/useChatStore';
import { ChatModal } from '../../features/chat/components/ChatModal';

export default function FriendsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.currentUser);

  const {
    friends,
    requests,
    directoryUsers,
    maxFriends,
    acceptRequest,
    declineRequest,
    sendRequest,
    searchFriendsAndDirectory,
    removeFriend,
    blockUser,
  } = useFriendsStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<FriendUser | null>(null);

  // Kết quả tìm kiếm trực tiếp theo số điện thoại hoặc @username
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchFriendsAndDirectory(searchQuery);
  }, [searchQuery, searchFriendsAndDirectory]);

  // Danh sách gợi ý từ danh bạ số điện thoại (chưa kết bạn)
  const contactSuggestions = useMemo(() => {
    return directoryUsers.filter((u) => !friends.some((f) => f.id === u.id));
  }, [directoryUsers, friends]);

  const handleSendFriendRequest = (identifier: string) => {
    const target = identifier || searchQuery;
    if (!target.trim()) {
      Alert.alert(
        'Chưa nhập thông tin',
        'Vui lòng nhập số điện thoại hoặc @username để kết bạn.'
      );
      return;
    }

    if (friends.length >= maxFriends) {
      Alert.alert(
        'Đã đạt giới hạn 20 bạn',
        'LeafyBooth giới hạn tối đa 20 người bạn thân thiết. Bạn cần hủy bớt kết bạn trước khi thêm người mới.'
      );
      return;
    }

    playShutterSound();
    const success = sendRequest(target);
    if (success) {
      Alert.alert(
        'Đã gửi lời mời 🌱',
        `Đã gửi lời mời kết bạn tới "${target}". Khi họ chấp nhận, hai bạn có thể chia sẻ ảnh và gắn widget!`
      );
      setSearchQuery('');
    } else {
      Alert.alert('Thông báo', 'Người này đã có trong danh sách bạn bè của bạn.');
    }
  };

  const handleShareLink = () => {
    playShutterSound();
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  const handleAcceptRequestWithSound = (reqId: string, name: string) => {
    playShutterSound();
    acceptRequest(reqId);
    Alert.alert('Đã kết bạn 🎉', `Bạn và ${name} đã trở thành bạn thân! Giờ hai bạn có thể gửi ảnh lên widget của nhau.`);
  };

  const userPhoneDisplay = currentUser?.phone ? formatPhoneNumber(currentUser.phone) : '0989 999 999';

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
        <Text style={styles.headerTitle}>Bạn bè & Kết nối</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Card (12/20) */}
        <View style={styles.limitCard}>
          <View style={styles.limitHeader}>
            <Text style={styles.limitTitle}>
              {friends.length} / {maxFriends} bạn thân
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
            Giới hạn tối đa 20 người bạn thân để giữ trọn sự ấm cúng và an toàn trên màn hình chính của bạn.
          </Text>
        </View>

        {/* ==============================================================
            SEARCH / ADD FRIEND BY PHONE OR USERNAME
           ============================================================== */}
        <View style={styles.searchSection}>
          <Text style={styles.sectionTitle}>🔍 Tìm bạn qua Số điện thoại hoặc @username</Text>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Nhập 09x... hoặc @username..."
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.trim() ? (
              <Pressable
                onPress={() => handleSendFriendRequest(searchQuery)}
                style={({ pressed }) => [
                  styles.addBtn,
                  { transform: [{ scale: pressed ? 0.95 : 1 }] },
                ]}
              >
                <Text style={styles.addBtnText}>Gửi</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* LIVE SEARCH RESULTS LIST */}
        {searchQuery.trim() !== '' && (
          <View style={styles.searchResultsBox}>
            <Text style={styles.searchResultsHeader}>
              Kết quả tìm kiếm ({searchResults.length})
            </Text>
            {searchResults.length === 0 ? (
              <View style={styles.emptySearchResult}>
                <Text style={styles.emptySearchEmoji}>🔎</Text>
                <Text style={styles.emptySearchTitle}>Chưa thấy trong danh bạ</Text>
                <Text style={styles.emptySearchSub}>
                  Bạn có thể gửi lời mời trực tiếp đến "{searchQuery}"
                </Text>
                <Pressable
                  onPress={() => handleSendFriendRequest(searchQuery)}
                  style={styles.inviteNewBtn}
                >
                  <Text style={styles.inviteNewBtnText}>+ Gửi lời mời kết bạn</Text>
                </Pressable>
              </View>
            ) : (
              searchResults.map((user) => (
                <View key={user.id} style={styles.searchResultItem}>
                  <View style={styles.searchResultLeft}>
                    <View style={[styles.avatarCircleSmall, { backgroundColor: user.color }]}>
                      <Text style={styles.avatarLetterSmall}>{user.letter}</Text>
                    </View>
                    <View>
                      <Text style={styles.searchResultName}>{user.name}</Text>
                      <Text style={styles.searchResultMeta}>
                        @{user.username} · 📱 {formatPhoneNumber(user.phone)}
                      </Text>
                    </View>
                  </View>

                  {user.isFriend ? (
                    <View style={styles.alreadyFriendBadge}>
                      <Text style={styles.alreadyFriendText}>✓ Bạn bè</Text>
                    </View>
                  ) : user.hasPendingRequest ? (
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingText}>Đã gửi ⏳</Text>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => handleSendFriendRequest(user.phone || user.username)}
                      style={({ pressed }) => [
                        styles.addFriendMiniBtn,
                        { transform: [{ scale: pressed ? 0.95 : 1 }] },
                      ]}
                    >
                      <Text style={styles.addFriendMiniBtnText}>+ Kết bạn</Text>
                    </Pressable>
                  )}
                </View>
              ))
            )}
          </View>
        )}

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
            <Text style={styles.shareActionLabel}>Mã QR & SĐT của tôi</Text>
          </Pressable>

          <Pressable
            onPress={handleShareLink}
            style={({ pressed }) => [
              styles.shareActionCard,
              { backgroundColor: colors.accentYellow, transform: [{ scale: pressed ? 0.97 : 1 }] },
            ]}
          >
            <Text style={styles.shareActionIcon}>🔗</Text>
            <Text style={styles.shareActionLabel}>
              {copiedToast ? 'Đã sao chép liên kết!' : 'Chia sẻ liên kết'}
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
                    <Text style={styles.requestUsername}>
                      @{req.username}
                      {req.phone ? ` · 📱 ${formatPhoneNumber(req.phone)}` : ''} · {req.sentAt}
                    </Text>
                  </View>
                </View>

                <View style={styles.requestActions}>
                  <Pressable
                    onPress={() => handleAcceptRequestWithSound(req.id, req.name)}
                    style={({ pressed }) => [
                      styles.acceptBtn,
                      { transform: [{ scale: pressed ? 0.95 : 1 }] },
                    ]}
                  >
                    <Text style={styles.acceptBtnText}>Chấp nhận</Text>
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

        {/* ==============================================================
            GỢI Ý TỪ DANH BẠ SỐ ĐIỆN THOẠI (CONTACT SUGGESTIONS)
           ============================================================== */}
        {contactSuggestions.length > 0 && (
          <View style={styles.suggestionsSection}>
            <Text style={styles.sectionTitle}>
              🌱 Gợi ý từ danh bạ số điện thoại ({contactSuggestions.length})
            </Text>
            <View style={styles.suggestionsCard}>
              {contactSuggestions.map((user, idx) => (
                <View key={user.id}>
                  <View style={styles.suggestionRow}>
                    <View style={styles.suggestionLeft}>
                      <View style={[styles.avatarCircleSmall, { backgroundColor: user.color }]}>
                        <Text style={styles.avatarLetterSmall}>{user.letter}</Text>
                      </View>
                      <View>
                        <Text style={styles.suggestionName}>{user.name}</Text>
                        <Text style={styles.suggestionPhone}>
                          📱 {user.phone ? formatPhoneNumber(user.phone) : ''} · @{user.username}
                        </Text>
                      </View>
                    </View>

                    <Pressable
                      onPress={() => handleSendFriendRequest(user.phone || user.username)}
                      style={({ pressed }) => [
                        styles.addContactBtn,
                        { transform: [{ scale: pressed ? 0.95 : 1 }] },
                      ]}
                    >
                      <Text style={styles.addContactBtnText}>+ Kết bạn</Text>
                    </Pressable>
                  </View>
                  {idx < contactSuggestions.length - 1 && <View style={styles.friendDivider} />}
                </View>
              ))}
            </View>
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
                      <Text style={styles.friendUsername}>
                        @{f.username} {f.phone ? `· 📱 ${formatPhoneNumber(f.phone)}` : ''}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.friendRightActions}>
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        playShutterSound();
                        useChatStore.getState().openChatWithFriend(f.id);
                      }}
                      style={styles.friendChatBtn}
                    >
                      <Text style={styles.friendChatBtnText}>💬</Text>
                    </Pressable>
                    <Text style={styles.friendActionDot}>⋮</Text>
                  </View>
                </Pressable>
                {idx < friends.length - 1 && <View style={styles.friendDivider} />}
              </React.Fragment>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* MODAL: QR Code & SĐT kết bạn */}
      <Modal visible={showQrModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.qrModalContent}>
            <Text style={styles.qrTitle}>Mã QR của bạn</Text>
            <Text style={styles.qrSubtitle}>
              Quét hoặc tìm số điện thoại để kết bạn với @{currentUser?.username || 'ten_ban'}
            </Text>

            {/* QR Pattern thật quét được */}
            <View style={{ marginVertical: 14 }}>
              <QRCodeView
                value={`https://leafybooth.app/u/${currentUser?.username || 'ten_ban'}`}
                size={180}
                centerEmoji="🌿"
              />
            </View>

            {/* Khung hiển thị Số Điện Thoại & Liên Kết */}
            <View style={styles.qrInfoBox}>
              <Text style={styles.qrPhoneLabel}>📱 Số điện thoại của bạn:</Text>
              <Text style={styles.qrPhoneNumber}>{userPhoneDisplay}</Text>
            </View>

            <View style={styles.qrLinkPill}>
              <Text style={styles.qrLinkText}>leafybooth.app/u/{currentUser?.username || 'ten_ban'}</Text>
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
              <Text style={styles.actionFriendUser}>
                @{selectedFriend?.username}
                {selectedFriend?.phone ? ` · 📱 ${formatPhoneNumber(selectedFriend.phone)}` : ''}
              </Text>
            </View>

            <Pressable
              onPress={() => {
                if (selectedFriend) {
                  const fid = selectedFriend.id;
                  setSelectedFriend(null);
                  playShutterSound();
                  useChatStore.getState().openChatWithFriend(fid);
                }
              }}
              style={styles.actionOptionChat}
            >
              <Text style={styles.actionOptionChatText}>💬 Nhắn tin ngay</Text>
            </Pressable>

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
      {/* MODAL TRÒ CHUYỆN / NHẮN TIN TRỰC TIẾP VỚI BẠN BÈ */}
      <ChatModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.darkBg, // Pure Midnight OLED Dark (#0D0F12)
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
    color: colors.white,
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
    backgroundColor: colors.darkSurfaceElevated,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.lime,
  },
  limitDesc: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 16,
  },
  searchSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.white,
    marginBottom: 8,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    backgroundColor: colors.darkSurface,
    borderRadius: theme.borders.radius.full,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    paddingHorizontal: 18,
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
    ...theme.shadows.darkSoft,
  },
  addBtn: {
    height: 50,
    paddingHorizontal: 20,
    backgroundColor: colors.lime,
    borderRadius: theme.borders.radius.full,
    borderWidth: 1.5,
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
  searchResultsBox: {
    backgroundColor: colors.darkSurface,
    borderRadius: theme.borders.radius.card,
    borderWidth: 1.5,
    borderColor: colors.lime,
    padding: 14,
    marginBottom: 16,
    ...theme.shadows.darkSoft,
  },
  searchResultsHeader: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.accentYellow,
    textTransform: 'uppercase',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchResultLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  searchResultName: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.white,
  },
  searchResultMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 2,
  },
  alreadyFriendBadge: {
    backgroundColor: 'rgba(200, 241, 53, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.lime,
  },
  alreadyFriendText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.lime,
  },
  pendingBadge: {
    backgroundColor: 'rgba(255, 217, 61, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.accentYellow,
  },
  pendingText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.accentYellow,
  },
  addFriendMiniBtn: {
    backgroundColor: colors.accentYellow,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: theme.borders.radius.full,
    borderWidth: 1.5,
    borderColor: colors.ink,
    ...theme.shadows.hardSmall,
  },
  addFriendMiniBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.ink,
  },
  emptySearchResult: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 4,
  },
  emptySearchEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  emptySearchTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
  },
  emptySearchSub: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  inviteNewBtn: {
    marginTop: 8,
    backgroundColor: colors.lime,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.ink,
  },
  inviteNewBtnText: {
    fontSize: 13,
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
    backgroundColor: colors.darkSurface,
    paddingVertical: 14,
    borderRadius: theme.borders.radius.card,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    ...theme.shadows.darkSoft,
  },
  shareActionIcon: {
    fontSize: 18,
  },
  shareActionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
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
  suggestionsSection: {
    marginBottom: 20,
  },
  suggestionsCard: {
    backgroundColor: colors.darkSurface,
    borderRadius: theme.borders.radius.card,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    ...theme.shadows.darkSoft,
    overflow: 'hidden',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  suggestionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  suggestionName: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.white,
  },
  suggestionPhone: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 2,
  },
  addContactBtn: {
    backgroundColor: colors.lime,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borders.radius.full,
    borderWidth: 1.5,
    borderColor: colors.ink,
  },
  addContactBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.ink,
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
  friendRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  friendChatBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.darkSurfaceElevated,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendChatBtnText: {
    fontSize: 16,
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
    backgroundColor: 'rgba(0,0,0,0.7)',
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
    marginBottom: 16,
    textAlign: 'center',
  },
  qrInfoBox: {
    backgroundColor: '#FEF08A',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.ink,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
  },
  qrPhoneLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.ink,
  },
  qrPhoneNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.ink,
    marginTop: 2,
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
  actionOptionChat: {
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    backgroundColor: colors.lime,
    marginBottom: 10,
    ...theme.shadows.hardSmall,
  },
  actionOptionChatText: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.ink,
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

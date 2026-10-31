import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../core/theme/colors';
import { theme } from '../../../core/theme/theme';
import { useChatStore, ChatMessage, ReplyMomentRef } from '../hooks/useChatStore';
import { useFriendsStore, FriendUser } from '../../friends/hooks/useFriendsStore';
import { playShutterSound } from '../../booth/services/soundService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const QUICK_STICKERS = ['❤️', '🌿', '🔥', '⭐', '😂', '🥰'];

export interface ChatModalProps {
  initialReplyMoment?: ReplyMomentRef | null;
  onClearInitialReplyMoment?: () => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  initialReplyMoment,
  onClearInitialReplyMoment,
}) => {
  const insets = useSafeAreaInsets();
  const {
    messages,
    activeChatFriendId,
    isChatModalOpen,
    typingFriends,
    openChatWithFriend,
    closeChatModal,
    sendMessage,
    addReactionToMessage,
    getConversationList,
  } = useChatStore();

  const { friends } = useFriendsStore();

  const [inputText, setInputText] = useState('');
  const [inboxSearch, setInboxSearch] = useState('');
  const [activeQuotedMoment, setActiveQuotedMoment] = useState<ReplyMomentRef | null>(
    initialReplyMoment || null
  );

  const scrollViewRef = useRef<any>(null);

  // Đồng bộ quote moment từ props khi mở từ PickView
  useEffect(() => {
    if (initialReplyMoment) {
      setActiveQuotedMoment(initialReplyMoment);
    }
  }, [initialReplyMoment]);

  // Tự động cuộn xuống đáy khi có tin nhắn mới
  useEffect(() => {
    if (activeChatFriendId) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  }, [messages, activeChatFriendId]);

  // Tìm thông tin bạn bè đang trò chuyện
  const activeFriend = friends.find((f) => f.id === activeChatFriendId);

  // Danh sách tin nhắn của cuộc trò chuyện hiện tại
  const currentConversationMessages = messages.filter(
    (m) => m.friendId === activeChatFriendId
  );

  // Danh sách cuộc trò chuyện trong Inbox
  const conversations = getConversationList(friends).filter((c) => {
    if (!inboxSearch.trim()) return true;
    const q = inboxSearch.toLowerCase();
    return (
      c.friendName.toLowerCase().includes(q) ||
      c.friendUsername.toLowerCase().includes(q)
    );
  });

  const isFriendTyping = activeChatFriendId ? !!typingFriends[activeChatFriendId] : false;

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || !activeChatFriendId) return;

    playShutterSound();
    sendMessage(activeChatFriendId, text, activeQuotedMoment || undefined);
    setInputText('');
    setActiveQuotedMoment(null);
    if (onClearInitialReplyMoment) onClearInitialReplyMoment();

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleQuickStickerPress = (sticker: string) => {
    handleSend(sticker);
  };

  if (!isChatModalOpen) return null;

  return (
    <Modal visible={isChatModalOpen} animationType="slide" transparent>
      <View style={styles.modalBackdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
        >
          <View
            style={[
              styles.chatContainer,
              {
                paddingTop: Math.max(insets.top, 16),
                paddingBottom: Math.max(insets.bottom, 12),
              },
            ]}
          >
            {/* ==========================================================
                1. GIAO DIỆN HỘP THOẠI TRỰC TIẾP VỚI 1 NGƯỜI BẠN
               ========================================================== */}
            {activeChatFriendId && activeFriend ? (
              <View style={styles.directChatWrapper}>
                {/* Header thanh trên cùng */}
                <View style={styles.chatHeader}>
                  <Pressable
                    onPress={() => useChatStore.getState().openInbox()}
                    style={({ pressed }) => [
                      styles.headerCircleBtn,
                      { transform: [{ scale: pressed ? 0.92 : 1 }] },
                    ]}
                  >
                    <Text style={styles.headerBtnIcon}>←</Text>
                  </Pressable>

                  <View style={styles.headerFriendInfo}>
                    <View
                      style={[
                        styles.headerAvatar,
                        { backgroundColor: activeFriend.color },
                      ]}
                    >
                      <Text style={styles.headerAvatarLetter}>
                        {activeFriend.letter}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.headerFriendName}>
                        {activeFriend.name}
                      </Text>
                      <Text style={styles.headerFriendStatus}>
                        {isFriendTyping
                          ? 'Đang nhập tin nhắn... ✍️'
                          : `@${activeFriend.username}`}
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    onPress={closeChatModal}
                    style={({ pressed }) => [
                      styles.headerCircleBtn,
                      { transform: [{ scale: pressed ? 0.92 : 1 }] },
                    ]}
                  >
                    <Text style={styles.headerBtnIcon}>✕</Text>
                  </Pressable>
                </View>

                {/* Quoted Moment Thumbnail (nếu đang reply một ảnh Photobooth) */}
                {activeQuotedMoment && (
                  <View style={styles.quoteMomentBanner}>
                    <Image
                      source={{ uri: activeQuotedMoment.photoUrl }}
                      style={styles.quoteThumbnail}
                      resizeMode="cover"
                    />
                    <View style={styles.quoteInfo}>
                      <Text style={styles.quoteAuthor}>
                        Đang trả lời khoảnh khắc của {activeQuotedMoment.senderName}
                      </Text>
                      <Text style={styles.quoteCaption} numberOfLines={1}>
                        "{activeQuotedMoment.caption}"
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => {
                        setActiveQuotedMoment(null);
                        if (onClearInitialReplyMoment) onClearInitialReplyMoment();
                      }}
                      style={styles.quoteCloseBtn}
                    >
                      <Text style={styles.quoteCloseText}>✕</Text>
                    </Pressable>
                  </View>
                )}

                {/* Danh sách tin nhắn cuộn mượt mà */}
                <ScrollView
                  ref={scrollViewRef}
                  contentContainerStyle={styles.messagesScrollContent}
                  showsVerticalScrollIndicator={false}
                  onContentSizeChange={() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                  }}
                >
                  <View style={styles.conversationIntro}>
                    <View
                      style={[
                        styles.introAvatar,
                        { backgroundColor: activeFriend.color },
                      ]}
                    >
                      <Text style={styles.introAvatarLetter}>
                        {activeFriend.letter}
                      </Text>
                    </View>
                    <Text style={styles.introTitle}>
                      Trò chuyện với {activeFriend.name}
                    </Text>
                    <Text style={styles.introSubtitle}>
                      Các bạn đã kết bạn trên LeafyBooth 🌱{'\n'}Mọi khoảnh khắc & tin nhắn đều được chia sẻ trực tiếp tới widget màn hình chính.
                    </Text>
                  </View>

                  {currentConversationMessages.map((msg) => {
                    const isMe = msg.senderId === 'me';
                    return (
                      <View
                        key={msg.id}
                        style={[
                          styles.messageRow,
                          isMe ? styles.messageRowMe : styles.messageRowFriend,
                        ]}
                      >
                        {!isMe && (
                          <View
                            style={[
                              styles.miniBubbleAvatar,
                              { backgroundColor: activeFriend.color },
                            ]}
                          >
                            <Text style={styles.miniBubbleAvatarLetter}>
                              {activeFriend.letter}
                            </Text>
                          </View>
                        )}

                        <View style={{ maxWidth: '78%' }}>
                          {/* Khung ảnh thumbnail nếu tin nhắn reply một khoảnh khắc */}
                          {msg.replyToMoment && (
                            <View
                              style={[
                                styles.embeddedMomentCard,
                                isMe
                                  ? styles.embeddedMomentCardMe
                                  : styles.embeddedMomentCardFriend,
                              ]}
                            >
                              <Image
                                source={{ uri: msg.replyToMoment.photoUrl }}
                                style={styles.embeddedMomentImg}
                                resizeMode="cover"
                              />
                              <View style={styles.embeddedMomentInfo}>
                                <Text
                                  style={[
                                    styles.embeddedMomentAuthor,
                                    isMe && { color: colors.ink },
                                  ]}
                                >
                                  📷 {msg.replyToMoment.senderName}
                                </Text>
                                <Text
                                  style={[
                                    styles.embeddedMomentCaption,
                                    isMe && { color: colors.ink },
                                  ]}
                                  numberOfLines={1}
                                >
                                  {msg.replyToMoment.caption}
                                </Text>
                              </View>
                            </View>
                          )}

                          {/* Bong bóng tin nhắn chính */}
                          <Pressable
                            onLongPress={() => {
                              addReactionToMessage(msg.id, '❤️');
                            }}
                            style={[
                              styles.messageBubble,
                              isMe ? styles.bubbleMe : styles.bubbleFriend,
                            ]}
                          >
                            <Text
                              style={[
                                styles.messageText,
                                isMe ? styles.messageTextMe : styles.messageTextFriend,
                              ]}
                            >
                              {msg.text}
                            </Text>

                            <View style={styles.messageMetaRow}>
                              <Text
                                style={[
                                  styles.messageTime,
                                  isMe ? styles.messageTimeMe : styles.messageTimeFriend,
                                ]}
                              >
                                {msg.timeDisplay}
                              </Text>
                              {isMe && (
                                <Text style={styles.readCheckText}>✓✓</Text>
                              )}
                            </View>
                          </Pressable>

                          {/* Dãy icon thả cảm xúc dưới bong bóng nếu có */}
                          {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                            <View
                              style={[
                                styles.reactionsBadgeRow,
                                isMe && { alignSelf: 'flex-end' },
                              ]}
                            >
                              {Object.entries(msg.reactions).map(
                                ([emoji, count]) => (
                                  <Pressable
                                    key={emoji}
                                    onPress={() => addReactionToMessage(msg.id, emoji)}
                                    style={styles.reactionChip}
                                  >
                                    <Text style={styles.reactionChipEmoji}>
                                      {emoji}
                                    </Text>
                                    <Text style={styles.reactionChipCount}>
                                      {count}
                                    </Text>
                                  </Pressable>
                                )
                              )}
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })}

                  {/* Hiệu ứng bạn bè đang gõ tin nhắn */}
                  {isFriendTyping && (
                    <View style={styles.typingIndicatorRow}>
                      <View
                        style={[
                          styles.miniBubbleAvatar,
                          { backgroundColor: activeFriend.color },
                        ]}
                      >
                        <Text style={styles.miniBubbleAvatarLetter}>
                          {activeFriend.letter}
                        </Text>
                      </View>
                      <View style={styles.typingBubble}>
                        <Text style={styles.typingDot}>●</Text>
                        <Text style={styles.typingDot}>●</Text>
                        <Text style={styles.typingDot}>●</Text>
                      </View>
                    </View>
                  )}
                </ScrollView>

                {/* Thanh chọn nhanh sticker/emoji */}
                <View style={styles.quickStickersBar}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8, paddingHorizontal: 12 }}
                  >
                    {QUICK_STICKERS.map((stk) => (
                      <Pressable
                        key={stk}
                        onPress={() => handleQuickStickerPress(stk)}
                        style={({ pressed }) => [
                          styles.stickerPill,
                          { transform: [{ scale: pressed ? 0.88 : 1 }] },
                        ]}
                      >
                        <Text style={styles.stickerPillText}>{stk}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>

                {/* Thanh nhập tin nhắn dưới đáy */}
                <View style={styles.inputBar}>
                  <TextInput
                    style={styles.chatTextInput}
                    placeholder={`Nhắn tin cho ${activeFriend.name}...`}
                    placeholderTextColor="#6B7280"
                    value={inputText}
                    onChangeText={setInputText}
                    onSubmitEditing={() => handleSend()}
                    returnKeyType="send"
                  />

                  <Pressable
                    onPress={() => handleSend()}
                    disabled={!inputText.trim()}
                    style={({ pressed }) => [
                      styles.sendButton,
                      !inputText.trim() && styles.sendButtonDisabled,
                      { transform: [{ scale: pressed ? 0.92 : 1 }] },
                    ]}
                  >
                    <Text style={styles.sendButtonText}>➔</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              /* ==========================================================
                  2. GIAO DIỆN HỘP THƯ CHUNG (CONVERSATIONS INBOX)
                 ========================================================== */
              <View style={styles.inboxWrapper}>
                <View style={styles.inboxHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.inboxHeaderIcon}>💬</Text>
                    <Text style={styles.inboxHeaderTitle}>Hộp thư bạn bè</Text>
                  </View>
                  <Pressable
                    onPress={closeChatModal}
                    style={({ pressed }) => [
                      styles.headerCircleBtn,
                      { transform: [{ scale: pressed ? 0.92 : 1 }] },
                    ]}
                  >
                    <Text style={styles.headerBtnIcon}>✕</Text>
                  </Pressable>
                </View>

                {/* Search in Inbox */}
                <View style={styles.inboxSearchBox}>
                  <TextInput
                    style={styles.inboxSearchInput}
                    placeholder="Tìm tin nhắn bạn bè..."
                    placeholderTextColor="#6B7280"
                    value={inboxSearch}
                    onChangeText={setInboxSearch}
                  />
                </View>

                {/* Danh sách cuộc trò chuyện */}
                <ScrollView
                  contentContainerStyle={styles.inboxListContent}
                  showsVerticalScrollIndicator={false}
                >
                  {conversations.map((item) => (
                    <Pressable
                      key={item.friendId}
                      onPress={() => openChatWithFriend(item.friendId)}
                      style={({ pressed }) => [
                        styles.conversationCard,
                        { transform: [{ scale: pressed ? 0.98 : 1 }] },
                      ]}
                    >
                      <View style={styles.conversationLeft}>
                        <View
                          style={[
                            styles.conversationAvatar,
                            { backgroundColor: item.friendAvatarColor },
                          ]}
                        >
                          <Text style={styles.conversationAvatarLetter}>
                            {item.friendAvatarLetter}
                          </Text>
                        </View>

                        <View style={styles.conversationMeta}>
                          <View
                            style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <Text style={styles.conversationName}>
                              {item.friendName}
                            </Text>
                            <Text style={styles.conversationTime}>
                              {item.lastMessageTime}
                            </Text>
                          </View>
                          <Text
                            style={[
                              styles.conversationSnippet,
                              item.unreadCount > 0 && styles.conversationSnippetUnread,
                            ]}
                            numberOfLines={1}
                          >
                            {item.lastMessageText}
                          </Text>
                        </View>
                      </View>

                      {item.unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadBadgeText}>
                            {item.unreadCount}
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  keyboardContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  chatContainer: {
    height: '92%',
    backgroundColor: colors.darkBg, // Pure Midnight OLED Dark (#0D0F12)
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    overflow: 'hidden',
  },
  directChatWrapper: {
    flex: 1,
    justifyContent: 'space-between',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.darkSurfaceElevated,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnIcon: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.white,
  },
  headerFriendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingHorizontal: 10,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  headerAvatarLetter: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.ink,
  },
  onlineBadgeDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: colors.darkBg,
  },
  headerFriendName: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.white,
  },
  headerFriendStatus: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 1,
  },
  quoteMomentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.darkSurfaceElevated,
    borderWidth: 1,
    borderColor: colors.lime,
    borderRadius: 14,
    marginHorizontal: 14,
    marginTop: 10,
    padding: 8,
    gap: 10,
  },
  quoteThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.darkBorder,
  },
  quoteInfo: {
    flex: 1,
  },
  quoteAuthor: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.lime,
  },
  quoteCaption: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
    marginTop: 1,
  },
  quoteCloseBtn: {
    padding: 6,
  },
  quoteCloseText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  messagesScrollContent: {
    paddingHorizontal: 14,
    paddingVertical: 16,
    gap: 12,
  },
  conversationIntro: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    gap: 6,
  },
  introAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: colors.darkBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  introAvatarLetter: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.ink,
  },
  introTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.white,
  },
  introSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 4,
  },
  messageRowMe: {
    justifyContent: 'flex-end',
  },
  messageRowFriend: {
    justifyContent: 'flex-start',
  },
  miniBubbleAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  miniBubbleAvatarLetter: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.ink,
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
  },
  bubbleMe: {
    backgroundColor: colors.lime,
    borderColor: colors.ink,
    borderBottomRightRadius: 4,
  },
  bubbleFriend: {
    backgroundColor: colors.darkSurfaceElevated,
    borderColor: colors.darkBorder,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  messageTextMe: {
    color: colors.ink,
    fontWeight: '700',
  },
  messageTextFriend: {
    color: colors.white,
    fontWeight: '600',
  },
  messageMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  messageTime: {
    fontSize: 10,
    fontWeight: '600',
  },
  messageTimeMe: {
    color: 'rgba(0,0,0,0.5)',
  },
  messageTimeFriend: {
    color: colors.textSecondary,
  },
  readCheckText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.ink,
  },
  embeddedMomentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 4,
    gap: 8,
  },
  embeddedMomentCardMe: {
    backgroundColor: 'rgba(200, 241, 53, 0.4)',
    borderColor: colors.ink,
  },
  embeddedMomentCardFriend: {
    backgroundColor: colors.darkSurface,
    borderColor: colors.darkBorder,
  },
  embeddedMomentImg: {
    width: 36,
    height: 36,
    borderRadius: 6,
  },
  embeddedMomentInfo: {
    flex: 1,
  },
  embeddedMomentAuthor: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.accentYellow,
  },
  embeddedMomentCaption: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  reactionsBadgeRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 2,
  },
  reactionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.darkSurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 2,
  },
  reactionChipEmoji: {
    fontSize: 12,
  },
  reactionChipCount: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.white,
  },
  typingIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.darkSurfaceElevated,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.darkBorder,
  },
  typingDot: {
    fontSize: 10,
    color: colors.accentYellow,
  },
  quickStickersBar: {
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  stickerPill: {
    backgroundColor: colors.darkSurfaceElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  stickerPillText: {
    fontSize: 16,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 8,
    gap: 10,
  },
  chatTextInput: {
    flex: 1,
    height: 48,
    backgroundColor: colors.darkSurface,
    borderRadius: theme.borders.radius.full,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.lime,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.hardSmall,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonText: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.ink,
  },

  // STYLES CHO INBOX (HỘP THƯ CHUNG)
  inboxWrapper: {
    flex: 1,
  },
  inboxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  inboxHeaderIcon: {
    fontSize: 22,
  },
  inboxHeaderTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.white,
  },
  inboxSearchBox: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inboxSearchInput: {
    height: 44,
    backgroundColor: colors.darkSurface,
    borderRadius: theme.borders.radius.full,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  inboxListContent: {
    paddingHorizontal: 16,
    gap: 10,
    paddingBottom: 24,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.darkSurface,
    borderRadius: theme.borders.radius.card,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    padding: 14,
    ...theme.shadows.darkSoft,
  },
  conversationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  conversationAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  conversationAvatarLetter: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.ink,
  },
  conversationMeta: {
    flex: 1,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.white,
  },
  conversationTime: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  conversationSnippet: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 2,
  },
  conversationSnippetUnread: {
    color: colors.accentYellow,
    fontWeight: '800',
  },
  unreadBadge: {
    backgroundColor: colors.accentYellow,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.ink,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  unreadBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.ink,
  },
});

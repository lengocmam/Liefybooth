import { create } from 'zustand';
import { playShutterSound } from '../../booth/services/soundService';

export interface ReplyMomentRef {
  id: string;
  photoUrl: string;
  caption: string;
  senderName: string;
}

export interface ChatMessage {
  id: string;
  friendId: string;
  senderId: string; // 'me' | friendId
  senderName: string;
  text: string;
  createdAt: string;
  timeDisplay: string;
  replyToMoment?: ReplyMomentRef;
  reactions?: Record<string, number>;
  myReaction?: string;
  isRead: boolean;
}

export interface ConversationItem {
  friendId: string;
  friendName: string;
  friendUsername: string;
  friendAvatarLetter: string;
  friendAvatarColor: string;
  friendPhone?: string;
  lastMessageText: string;
  lastMessageTime: string;
  unreadCount: number;
}

interface ChatState {
  messages: ChatMessage[];
  activeChatFriendId: string | null;
  isChatModalOpen: boolean;
  typingFriends: Record<string, boolean>; // friendId -> boolean

  openChatWithFriend: (friendId: string) => void;
  openInbox: () => void;
  closeChatModal: () => void;
  sendMessage: (friendId: string, text: string, replyToMoment?: ReplyMomentRef) => ChatMessage;
  receiveMessage: (friendId: string, text: string) => void;
  addReactionToMessage: (messageId: string, emoji: string) => void;
  deleteMessage: (messageId: string) => void;
  markConversationRead: (friendId: string) => void;
  getConversationList: (friendsList: any[]) => ConversationItem[];
  totalUnreadCount: () => number;
}

// Dữ liệu tin nhắn khởi tạo sinh động và ấm cúng
const INITIAL_MESSAGES: ChatMessage[] = [
  // Cuộc trò chuyện với u3 (Chi)
  {
    id: 'msg_c1',
    friendId: 'u3',
    senderId: 'u3',
    senderName: 'Chi',
    text: 'Cậu ơi, dải ảnh chụp đợt đi Đà Lạt tớ ghim lên widget nhìn thơ ghê 🌿',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    timeDisplay: '14:30',
    isRead: true,
  },
  {
    id: 'msg_c2',
    friendId: 'u3',
    senderId: 'me',
    senderName: 'Bạn (Tôi)',
    text: 'Mưa rồi nè mọi người ☔️',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    timeDisplay: '15:35',
    replyToMoment: {
      id: 'm2',
      photoUrl: 'https://picsum.photos/seed/rain_chi/500/500',
      caption: 'Mưa rồi nè mọi người ☔️',
      senderName: 'Chi',
    },
    reactions: { '❤️': 1 },
    isRead: true,
  },
  {
    id: 'msg_c3',
    friendId: 'u3',
    senderId: 'u3',
    senderName: 'Chi',
    text: 'Mưa mát ghê á! Tối nay nhớ gửi dải ảnh mới lên widget tớ ngắm với nha ✨',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    timeDisplay: '16:05',
    isRead: false,
  },

  // Cuộc trò chuyện với u1 (An)
  {
    id: 'msg_a1',
    friendId: 'u1',
    senderId: 'u1',
    senderName: 'An',
    text: 'Dải ảnh 4 ô chúng mình chụp ở Hongdae 📸',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    timeDisplay: '11:15',
    replyToMoment: {
      id: 'm0',
      photoUrl: 'https://picsum.photos/seed/kpop_an/500/500',
      caption: 'Dải ảnh 4 ô chúng mình chụp ở Hongdae 📸',
      senderName: 'An',
    },
    reactions: { '🔥': 2 },
    isRead: true,
  },
  {
    id: 'msg_a2',
    friendId: 'u1',
    senderId: 'me',
    senderName: 'Bạn (Tôi)',
    text: 'Xịn xò dã man luôn bồ ơi! Hôm nào đi chụp tiếp set Kpop nữa đê ❤️',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    timeDisplay: '12:20',
    isRead: true,
  },
  {
    id: 'msg_a3',
    friendId: 'u1',
    senderId: 'u1',
    senderName: 'An',
    text: 'Deal luôn! Đang canh studio có frame pastel mới nè 🌸',
    createdAt: new Date(Date.now() - 600000).toISOString(),
    timeDisplay: 'Vừa xong',
    isRead: false,
  },

  // Cuộc trò chuyện với u2 (Bình)
  {
    id: 'msg_b1',
    friendId: 'u2',
    senderId: 'u2',
    senderName: 'Bình',
    text: 'Cà phê sáng không bạn ơi ☕️',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    timeDisplay: '08:30',
    replyToMoment: {
      id: 'm1',
      photoUrl: 'https://picsum.photos/seed/coffee_binh/500/500',
      caption: 'Cà phê sáng',
      senderName: 'Bình',
    },
    isRead: true,
  },
  {
    id: 'msg_b2',
    friendId: 'u2',
    senderId: 'me',
    senderName: 'Bạn (Tôi)',
    text: 'Quán cũ chỗ hồ Tây hả? Tớ đang qua nè!',
    createdAt: new Date(Date.now() - 3600000 * 2.5).toISOString(),
    timeDisplay: '09:00',
    isRead: true,
  },
];

// Danh sách câu trả lời tự động thông minh và gần gũi của bạn bè
const FRIEND_AUTO_REPLIES: Record<string, string[]> = {
  u3: [
    'Aww ảnh xinh quá bồ ơi! 🌿 Để tớ ghim ngay lên widget chính nhé!',
    'Màu frame này cưng ghê, hôm nào chỉ tớ cách làm với nha ✨',
    'Hehe thấy ảnh cậu gửi là thấy vui cả ngày rồi 🥰',
    'Hôm nào tụi mình ra bờ hồ chụp dải photobooth đôi nữa nha!',
  ],
  u1: [
    'Cháy quá bạn ơii! 🔥 Nhìn như idol Kpop luôn á haha!',
    'Uiii dải này góc chụp đẹp xuất sắc, chấm 10 điểm không có nhưng 💯',
    'Tớ vừa set widget to đùng giữa màn hình khóa rồi nè 📸',
    'Tối nay rảnh chụp thêm vài tấm dải 4 ô gửi tớ tiếp nhá bồ!',
  ],
  u2: [
    'Duyệt luôn bạn ơi! Đúng gu tớ thích ☕️',
    'Ảnh chụp bằng camera Leafy nét căng luôn, đẹp thật sự!',
    'Lát ghé cafe tớ chụp tặng cậu một dải retro film nha!',
    'Đang ngồi ngắm widget của cậu nè, chill phết 🌿',
  ],
  default: [
    'Tớ nhận được ảnh rồi nè! Đẹp và dễ thương xỉu 🌿✨',
    'Cảm ơn cậu nha, tớ thả tim và ghim lên widget rồi nè ❤️',
    'Bao giờ gặp nhau làm dải ảnh kỷ niệm tiếp nhé!',
  ],
};

const formatTimeNow = (): string => {
  const d = new Date();
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export const useChatStore = create<ChatState>((set, get) => ({
  messages: INITIAL_MESSAGES,
  activeChatFriendId: null,
  isChatModalOpen: false,
  typingFriends: {},

  openChatWithFriend: (friendId) => {
    set({
      activeChatFriendId: friendId,
      isChatModalOpen: true,
    });
    get().markConversationRead(friendId);
  },

  openInbox: () => {
    set({
      activeChatFriendId: null,
      isChatModalOpen: true,
    });
  },

  closeChatModal: () => {
    set({
      isChatModalOpen: false,
    });
  },

  sendMessage: (friendId, text, replyToMoment) => {
    const cleanText = text.trim();
    if (!cleanText) return null as any;

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      friendId,
      senderId: 'me',
      senderName: 'Bạn (Tôi)',
      text: cleanText,
      createdAt: new Date().toISOString(),
      timeDisplay: formatTimeNow(),
      replyToMoment,
      isRead: true,
    };

    set((state) => ({
      messages: [...state.messages, newMsg],
    }));

    // Kích hoạt mô phỏng bạn bè gõ tin nhắn và trả lời tự động sau 1.2s - 2.0s
    setTimeout(() => {
      set((state) => ({
        typingFriends: { ...state.typingFriends, [friendId]: true },
      }));

      setTimeout(() => {
        set((state) => ({
          typingFriends: { ...state.typingFriends, [friendId]: false },
        }));

        const repliesPool = FRIEND_AUTO_REPLIES[friendId] || FRIEND_AUTO_REPLIES.default;
        const randomReply = repliesPool[Math.floor(Math.random() * repliesPool.length)];

        const replyMsg: ChatMessage = {
          id: `reply_${Date.now()}`,
          friendId,
          senderId: friendId,
          senderName: friendId === 'u1' ? 'An' : friendId === 'u2' ? 'Bình' : friendId === 'u3' ? 'Chi' : 'Bạn thân',
          text: randomReply,
          createdAt: new Date().toISOString(),
          timeDisplay: formatTimeNow(),
          isRead: get().activeChatFriendId === friendId,
        };

        playShutterSound();
        set((state) => ({
          messages: [...state.messages, replyMsg],
        }));
      }, 1400);
    }, 600);

    return newMsg;
  },

  receiveMessage: (friendId, text) => {
    const newMsg: ChatMessage = {
      id: `msg_recv_${Date.now()}`,
      friendId,
      senderId: friendId,
      senderName: 'Bạn',
      text,
      createdAt: new Date().toISOString(),
      timeDisplay: formatTimeNow(),
      isRead: false,
    };

    set((state) => ({
      messages: [...state.messages, newMsg],
    }));
  },

  addReactionToMessage: (messageId, emoji) => {
    playShutterSound();
    set((state) => ({
      messages: state.messages.map((m) => {
        if (m.id !== messageId) return m;
        const currentReactions = { ...(m.reactions || {}) };
        if (m.myReaction === emoji) {
          // Bỏ reaction nếu ấn lại
          currentReactions[emoji] = Math.max(0, (currentReactions[emoji] || 1) - 1);
          if (currentReactions[emoji] === 0) delete currentReactions[emoji];
          return { ...m, reactions: currentReactions, myReaction: undefined };
        } else {
          // Thêm reaction mới
          currentReactions[emoji] = (currentReactions[emoji] || 0) + 1;
          return { ...m, reactions: currentReactions, myReaction: emoji };
        }
      }),
    }));
  },

  deleteMessage: (messageId) => {
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== messageId),
    }));
  },

  markConversationRead: (friendId) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.friendId === friendId && !m.isRead ? { ...m, isRead: true } : m
      ),
    }));
  },

  getConversationList: (friendsList) => {
    const { messages } = get();
    const result: ConversationItem[] = [];

    for (const f of friendsList) {
      const friendMsgs = messages.filter((m) => m.friendId === f.id);
      const lastMsg = friendMsgs[friendMsgs.length - 1];
      const unreadCount = friendMsgs.filter((m) => !m.isRead && m.senderId !== 'me').length;

      result.push({
        friendId: f.id,
        friendName: f.name,
        friendUsername: f.username,
        friendAvatarLetter: f.letter || f.avatarLetter || f.name[0] || '?',
        friendAvatarColor: f.color || f.avatarColor || '#C8F135',
        friendPhone: f.phone,
        lastMessageText: lastMsg ? lastMsg.text : 'Chưa có tin nhắn nào',
        lastMessageTime: lastMsg ? lastMsg.timeDisplay : '',
        unreadCount,
      });
    }

    // Sắp xếp: cuộc trò chuyện có tin nhắn mới hoặc có tin chưa đọc lên đầu
    return result.sort((a, b) => b.unreadCount - a.unreadCount);
  },

  totalUnreadCount: () => {
    return get().messages.filter((m) => !m.isRead && m.senderId !== 'me').length;
  },
}));

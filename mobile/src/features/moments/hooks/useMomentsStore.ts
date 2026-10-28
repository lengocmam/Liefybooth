import { create } from 'zustand';

export interface FriendItem {
  id: string;
  name: string;
  username: string;
  avatarLetter: string;
  avatarColor: string;
}

export interface UserAccount {
  id: string; // 'me' | 'u1' | 'u2' | 'u3' | 'u4' | 'u5'
  name: string;
  username: string;
  avatarLetter: string;
  avatarColor: string;
  roleDescription: string;
}

export const TEST_ACCOUNTS: UserAccount[] = [
  { id: 'me', name: 'Bạn (Tôi)', username: 'ten_ban', avatarLetter: 'T', avatarColor: '#C8F135', roleDescription: 'Tài khoản chính của bạn' },
  { id: 'u1', name: 'An', username: 'an_leafy', avatarLetter: 'A', avatarColor: '#FF8FC7', roleDescription: 'Bạn thân Photobooth Kpop' },
  { id: 'u2', name: 'Bình', username: 'binh_leafy', avatarLetter: 'B', avatarColor: '#FFD93D', roleDescription: 'Bạn thân Cafe sáng' },
  { id: 'u3', name: 'Chi', username: 'chi_leafy', avatarLetter: 'C', avatarColor: '#6EC6FF', roleDescription: 'Bạn thân Y2K & Mưa' },
  { id: 'u4', name: 'Hà', username: 'ha_nguyen', avatarLetter: 'H', avatarColor: '#7EE8B8', roleDescription: 'Bạn thân Ăn trưa' },
  { id: 'u5', name: 'Em', username: 'em_leafy', avatarLetter: 'E', avatarColor: '#FF7A3D', roleDescription: 'Bạn thân Trà sữa' },
];

export interface MomentItem {
  id: string;
  senderId: string;
  senderName: string;
  senderColor: string;
  senderLetter: string;
  timestamp: string;
  timeAgo: string;
  caption: string;
  photoUrl: string;
  stripPhotos?: string[];
  frameColor?: string;
  frameName?: string;
  recipientIds?: string[];
  reactions: Record<string, number>;
  myReaction?: string;
  userReactions?: Record<string, string>;
  isSeen: boolean;
}

interface MomentsState {
  // Tài khoản đang đăng nhập & tính năng chuyển đổi nhiều account cho tester
  currentUser: UserAccount;
  switchAccount: (accountId: string) => void;

  // Chế độ xem: 'plant' (Camera chụp gửi) hoặc 'pick' (Xem hộp ảnh)
  viewMode: 'plant' | 'pick';
  setViewMode: (mode: 'plant' | 'pick') => void;

  // Danh sách bạn bè (mock ban đầu)
  friends: FriendItem[];
  maxFriends: number;

  // Chọn người nhận khi gửi khoảnh khắc
  selectedRecipientIds: string[]; // Rỗng nghĩa là 'Tất cả'
  isAllSelected: boolean;
  toggleSelectAll: () => void;
  toggleSelectFriend: (friendId: string) => void;

  // Hộp ảnh Pick
  moments: MomentItem[];
  activeMomentIndex: number;
  setActiveMomentIndex: (index: number) => void;
  activeSenderFilter: string; // 'all' | 'me' | friendId
  setActiveSenderFilter: (filter: string) => void;
  deleteMoment: (momentId: string) => void;
  pinToWidget: (momentId: string) => void;
  markSeen: (momentId: string) => void;
  addReaction: (momentId: string, emoji: string) => void;
  sendMoment: (
    photoUrl: string,
    caption: string,
    extra?: {
      stripPhotos?: string[];
      frameColor?: string;
      frameName?: string;
      recipientIds?: string[];
    }
  ) => void;
}

const INITIAL_FRIENDS: FriendItem[] = [
  { id: 'u1', name: 'An', username: 'an_leafy', avatarLetter: 'A', avatarColor: '#FF8FC7' },
  { id: 'u2', name: 'Bình', username: 'binh_leafy', avatarLetter: 'B', avatarColor: '#FFD93D' },
  { id: 'u3', name: 'Chi', username: 'chi_leafy', avatarLetter: 'C', avatarColor: '#6EC6FF' },
  { id: 'u4', name: 'Hà', username: 'ha_nguyen', avatarLetter: 'H', avatarColor: '#7EE8B8' },
  { id: 'u5', name: 'Em', username: 'em_leafy', avatarLetter: 'E', avatarColor: '#FF7A3D' },
];

const INITIAL_MOMENTS: MomentItem[] = [
  {
    id: 'm0',
    senderId: 'u1',
    senderName: 'An',
    senderColor: '#FF8FC7',
    senderLetter: 'A',
    timestamp: '2026-10-26T16:20:00Z',
    timeAgo: 'Vừa xong',
    caption: 'Dải ảnh 4 ô chúng mình chụp ở Hongdae 📸',
    photoUrl: 'https://picsum.photos/seed/kpop_an/500/500',
    stripPhotos: [
      'https://picsum.photos/seed/cut1_an/300/300',
      'https://picsum.photos/seed/cut2_an/300/300',
      'https://picsum.photos/seed/cut3_an/300/300',
      'https://picsum.photos/seed/cut4_an/300/300',
    ],
    frameColor: '#FF8FC7',
    frameName: 'Pink Pastel 4-Cut',
    reactions: { '❤️': 8, '🔥': 4, '⭐': 3 },
    myReaction: '❤️',
    isSeen: false,
  },
  {
    id: 'm1',
    senderId: 'u2',
    senderName: 'Bình',
    senderColor: '#FFD93D',
    senderLetter: 'B',
    timestamp: '2026-10-26T16:00:00Z',
    timeAgo: '2 phút trước',
    caption: 'Cà phê sáng',
    photoUrl: 'https://picsum.photos/seed/coffee_binh/500/500',
    reactions: { '❤️': 3, '😊': 1 },
    myReaction: undefined,
    isSeen: false,
  },
  {
    id: 'm2',
    senderId: 'u3',
    senderName: 'Chi',
    senderColor: '#6EC6FF',
    senderLetter: 'C',
    timestamp: '2026-10-26T15:30:00Z',
    timeAgo: '30 phút trước',
    caption: 'Mưa rồi nè mọi người ☔️',
    photoUrl: 'https://picsum.photos/seed/rain_chi/500/500',
    reactions: { '😮': 2, '❤️': 4 },
    myReaction: '❤️',
    isSeen: true,
  },
  {
    id: 'm3',
    senderId: 'u1',
    senderName: 'An',
    senderColor: '#FF8FC7',
    senderLetter: 'A',
    timestamp: '2026-10-26T14:15:00Z',
    timeAgo: '2 giờ trước',
    caption: 'Góc học tập hôm nay ✨',
    photoUrl: 'https://picsum.photos/seed/study_an/500/500',
    reactions: { '🔥': 5, '⭐': 2 },
    myReaction: undefined,
    isSeen: true,
  },
  {
    id: 'm4',
    senderId: 'u4',
    senderName: 'Hà',
    senderColor: '#7EE8B8',
    senderLetter: 'H',
    timestamp: '2026-10-26T12:00:00Z',
    timeAgo: '4 giờ trước',
    caption: 'Ăn trưa thôi!',
    photoUrl: 'https://picsum.photos/seed/lunch_ha/500/500',
    reactions: { '😊': 4 },
    myReaction: undefined,
    isSeen: true,
  },
  {
    id: 'm_me_1',
    senderId: 'me',
    senderName: 'Bạn',
    senderColor: '#C8F135',
    senderLetter: 'T',
    timestamp: '2026-10-26T10:30:00Z',
    timeAgo: '5 giờ trước',
    caption: 'Dải photobooth 4 ô hoa cúc mình tự thiết kế 🌼',
    photoUrl: 'https://picsum.photos/seed/cut_me_main/500/500',
    stripPhotos: [
      'https://picsum.photos/seed/cut_me_1/300/300',
      'https://picsum.photos/seed/cut_me_2/300/300',
      'https://picsum.photos/seed/cut_me_3/300/300',
      'https://picsum.photos/seed/cut_me_4/300/300',
    ],
    frameColor: '#FEF08A',
    frameName: 'Daisy Blossom 4-Cut',
    reactions: { '❤️': 6, '🔥': 2 },
    myReaction: '❤️',
    isSeen: true,
  },
  {
    id: 'm_me_2',
    senderId: 'me',
    senderName: 'Bạn',
    senderColor: '#C8F135',
    senderLetter: 'T',
    timestamp: '2026-10-25T17:30:00Z',
    timeAgo: 'Hôm qua',
    caption: 'Chiều hoàng hôn hồ Tây 🌅',
    photoUrl: 'https://picsum.photos/seed/sunset_me/500/500',
    reactions: { '❤️': 9, '⭐': 5 },
    myReaction: undefined,
    isSeen: true,
  },
  {
    id: 'm5',
    senderId: 'u5',
    senderName: 'Em',
    senderColor: '#FF7A3D',
    senderLetter: 'E',
    timestamp: '2026-10-25T14:00:00Z',
    timeAgo: 'Hôm qua',
    caption: 'Trà sữa chiều tan làm 🧋',
    photoUrl: 'https://picsum.photos/seed/boba_em/500/500',
    reactions: { '🔥': 3, '😊': 4 },
    myReaction: '😊',
    isSeen: true,
  },
];

export const useMomentsStore = create<MomentsState>((set, get) => ({
  currentUser: TEST_ACCOUNTS[0],

  switchAccount: (accountId) => {
    const target = TEST_ACCOUNTS.find((a) => a.id === accountId);
    if (!target) return;
    const otherFriends: FriendItem[] = TEST_ACCOUNTS.filter((a) => a.id !== accountId).map((a) => ({
      id: a.id,
      name: a.name,
      username: a.username,
      avatarLetter: a.avatarLetter,
      avatarColor: a.avatarColor,
    }));
    set({
      currentUser: target,
      friends: otherFriends,
      activeSenderFilter: 'all',
      activeMomentIndex: 0,
      selectedRecipientIds: [],
      isAllSelected: true,
    });
  },

  viewMode: 'plant',
  // Bỏ qua nếu giá trị không đổi để không phát thông báo re-render thừa
  setViewMode: (mode) => set((s) => (s.viewMode === mode ? s : { viewMode: mode })),

  friends: INITIAL_FRIENDS,
  maxFriends: 20,

  selectedRecipientIds: [],
  isAllSelected: true,

  toggleSelectAll: () =>
    set({
      isAllSelected: true,
      selectedRecipientIds: [],
    }),

  toggleSelectFriend: (friendId) =>
    set((state) => {
      let newSelected: string[];
      if (state.isAllSelected) {
        newSelected = [friendId];
      } else if (state.selectedRecipientIds.includes(friendId)) {
        newSelected = state.selectedRecipientIds.filter((id) => id !== friendId);
        if (newSelected.length === 0) {
          return { isAllSelected: true, selectedRecipientIds: [] };
        }
      } else {
        newSelected = [...state.selectedRecipientIds, friendId];
      }

      return {
        isAllSelected: false,
        selectedRecipientIds: newSelected,
      };
    }),

  moments: INITIAL_MOMENTS,
  activeMomentIndex: 0,
  setActiveMomentIndex: (index) => set({ activeMomentIndex: index }),

  activeSenderFilter: 'all',
  setActiveSenderFilter: (filter) =>
    set({
      activeSenderFilter: filter,
      activeMomentIndex: 0,
    }),

  deleteMoment: (momentId) =>
    set((state) => ({
      moments: state.moments.filter((m) => m.id !== momentId),
      activeMomentIndex: 0,
    })),

  pinToWidget: (momentId) =>
    set((state) => {
      const target = state.moments.find((m) => m.id === momentId);
      if (!target) return state;
      const rest = state.moments.filter((m) => m.id !== momentId);
      return {
        moments: [target, ...rest],
        activeMomentIndex: 0,
      };
    }),

  markSeen: (momentId) =>
    set((state) => ({
      moments: state.moments.map((m) =>
        m.id === momentId ? { ...m, isSeen: true } : m
      ),
    })),

  addReaction: (momentId, emoji) =>
    set((state) => {
      const currentUserId = state.currentUser?.id || 'me';
      return {
        moments: state.moments.map((m) => {
          if (m.id !== momentId) return m;

          const currentReactions = { ...m.reactions };
          const userReactions = { ...(m.userReactions || {}) };
          const prevReaction =
            userReactions[currentUserId] || (currentUserId === 'me' ? m.myReaction : undefined);

          // Nếu đã thả emoji này rồi thì thu hồi
          if (prevReaction === emoji) {
            currentReactions[emoji] = Math.max(0, (currentReactions[emoji] || 1) - 1);
            delete userReactions[currentUserId];
            return {
              ...m,
              reactions: currentReactions,
              userReactions,
              myReaction: currentUserId === 'me' ? undefined : m.myReaction,
            };
          }

          // Bỏ reaction cũ nếu có
          if (prevReaction && currentReactions[prevReaction]) {
            currentReactions[prevReaction] = Math.max(0, currentReactions[prevReaction] - 1);
          }

          // Thêm reaction mới
          currentReactions[emoji] = (currentReactions[emoji] || 0) + 1;
          userReactions[currentUserId] = emoji;

          return {
            ...m,
            reactions: currentReactions,
            userReactions,
            myReaction: currentUserId === 'me' ? emoji : m.myReaction,
          };
        }),
      };
    }),

  sendMoment: (photoUrl, caption, extra) =>
    set((state) => {
      const user = state.currentUser;
      const newMoment: MomentItem = {
        id: `m_${Date.now()}`,
        senderId: user.id,
        senderName: user.name,
        senderColor: user.avatarColor,
        senderLetter: user.avatarLetter,
        timestamp: new Date().toISOString(),
        timeAgo: 'Vừa xong',
        caption: caption.trim() || 'Dải ảnh Photobooth mới ✨',
        photoUrl,
        stripPhotos: extra?.stripPhotos,
        frameColor: extra?.frameColor,
        frameName: extra?.frameName,
        recipientIds: extra?.recipientIds || state.selectedRecipientIds,
        reactions: {},
        userReactions: {},
        isSeen: true,
      };

      return {
        moments: [newMoment, ...state.moments],
        activeMomentIndex: 0,
      };
    }),
}));

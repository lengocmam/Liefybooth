import { create } from 'zustand';

export interface FriendItem {
  id: string;
  name: string;
  username: string;
  avatarLetter: string;
  avatarColor: string;
}

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
  reactions: Record<string, number>;
  myReaction?: string;
  isSeen: boolean;
}

interface MomentsState {
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
  addReaction: (momentId: string, emoji: string) => void;
  sendMoment: (photoUrl: string, caption: string) => void;
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
];

export const useMomentsStore = create<MomentsState>((set) => ({
  viewMode: 'plant',
  setViewMode: (mode) => set({ viewMode: mode }),

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

  addReaction: (momentId, emoji) =>
    set((state) => ({
      moments: state.moments.map((m) => {
        if (m.id !== momentId) return m;

        const currentReactions = { ...m.reactions };
        const prevReaction = m.myReaction;

        // Nếu đã thả emoji này rồi thì thu hồi
        if (prevReaction === emoji) {
          currentReactions[emoji] = Math.max(0, (currentReactions[emoji] || 1) - 1);
          return {
            ...m,
            reactions: currentReactions,
            myReaction: undefined,
          };
        }

        // Bỏ reaction cũ nếu có
        if (prevReaction && currentReactions[prevReaction]) {
          currentReactions[prevReaction] = Math.max(0, currentReactions[prevReaction] - 1);
        }

        // Thêm reaction mới
        currentReactions[emoji] = (currentReactions[emoji] || 0) + 1;
        return {
          ...m,
          reactions: currentReactions,
          myReaction: emoji,
        };
      }),
    })),

  sendMoment: (photoUrl, caption) =>
    set((state) => {
      const newMoment: MomentItem = {
        id: `m_${Date.now()}`,
        senderId: 'me',
        senderName: 'Bạn',
        senderColor: '#C8F135',
        senderLetter: 'T',
        timestamp: new Date().toISOString(),
        timeAgo: 'Vừa xong',
        caption: caption.trim() || 'Khoảnh khắc mới',
        photoUrl,
        reactions: {},
        isSeen: true,
      };

      return {
        moments: [newMoment, ...state.moments],
        activeMomentIndex: 0,
      };
    }),
}));

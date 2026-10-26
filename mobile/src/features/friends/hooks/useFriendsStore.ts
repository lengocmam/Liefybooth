import { create } from 'zustand';
import { colors } from '../../../core/theme/colors';

export interface FriendUser {
  id: string;
  name: string;
  username: string;
  letter: string;
  color: string;
}

export interface FriendRequest {
  id: string;
  name: string;
  username: string;
  letter: string;
  color: string;
  sentAt: string;
}

interface FriendsState {
  friends: FriendUser[];
  requests: FriendRequest[];
  maxFriends: number;
  blockedUsers: string[];
  acceptRequest: (requestId: string) => void;
  declineRequest: (requestId: string) => void;
  sendRequest: (username: string) => boolean;
  removeFriend: (friendId: string) => void;
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
}

const INITIAL_FRIENDS: FriendUser[] = [
  { id: 'u2', name: 'Bình', username: 'binh_leafy', letter: 'B', color: colors.yellow },
  { id: 'u3', name: 'Chi', username: 'chi_leafy', letter: 'C', color: colors.sky },
  { id: 'u1', name: 'An', username: 'an_leafy', letter: 'A', color: colors.pink },
  { id: 'u6', name: 'Dũng', username: 'dung_tran', letter: 'D', color: colors.mint },
  { id: 'u7', name: 'Giang', username: 'giang_hoang', letter: 'G', color: colors.orange },
  { id: 'u8', name: 'Khánh', username: 'khanh_le', letter: 'K', color: colors.purple },
  { id: 'u9', name: 'Linh', username: 'linh_nguyen', letter: 'L', color: colors.pink },
  { id: 'u10', name: 'Minh', username: 'minh_vu', letter: 'M', color: colors.yellow },
  { id: 'u11', name: 'Nam', username: 'nam_phung', letter: 'N', color: colors.sky },
  { id: 'u12', name: 'Phúc', username: 'phuc_do', letter: 'P', color: colors.mint },
  { id: 'u13', name: 'Quân', username: 'quan_bui', letter: 'Q', color: colors.orange },
  { id: 'u14', name: 'Sơn', username: 'son_doan', letter: 'S', color: colors.purple },
];

const INITIAL_REQUESTS: FriendRequest[] = [
  { id: 'req_1', name: 'Em', username: 'em_leafy', letter: 'E', color: colors.pink, sentAt: '10 phút trước' },
  { id: 'req_2', name: 'Hà', username: 'ha_nguyen', letter: 'H', color: colors.yellow, sentAt: '1 giờ trước' },
];

export const useFriendsStore = create<FriendsState>((set, get) => ({
  friends: INITIAL_FRIENDS,
  requests: INITIAL_REQUESTS,
  maxFriends: 20,
  blockedUsers: [],

  acceptRequest: (requestId) => {
    const req = get().requests.find((r) => r.id === requestId);
    if (!req) return;

    if (get().friends.length >= get().maxFriends) {
      return; // Giới hạn 20 bạn
    }

    const newFriend: FriendUser = {
      id: `u_${Date.now()}`,
      name: req.name,
      username: req.username,
      letter: req.letter,
      color: req.color,
    };

    set((state) => ({
      friends: [newFriend, ...state.friends],
      requests: state.requests.filter((r) => r.id !== requestId),
    }));
  },

  declineRequest: (requestId) => {
    set((state) => ({
      requests: state.requests.filter((r) => r.id !== requestId),
    }));
  },

  sendRequest: (username) => {
    const clean = username.trim().toLowerCase().replace('@', '');
    if (!clean) return false;
    // Kiểm tra đã là bạn chưa
    if (get().friends.some((f) => f.username.toLowerCase() === clean)) {
      return false;
    }
    return true;
  },

  removeFriend: (friendId) => {
    set((state) => ({
      friends: state.friends.filter((f) => f.id !== friendId),
    }));
  },

  blockUser: (userId) => {
    set((state) => ({
      blockedUsers: [...state.blockedUsers, userId],
      friends: state.friends.filter((f) => f.id !== userId),
    }));
  },

  unblockUser: (userId) => {
    set((state) => ({
      blockedUsers: state.blockedUsers.filter((id) => id !== userId),
    }));
  },
}));

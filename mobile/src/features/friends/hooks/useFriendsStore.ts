import { create } from 'zustand';
import { colors } from '../../../core/theme/colors';

export interface FriendUser {
  id: string;
  name: string;
  username: string;
  letter: string;
  color: string;
  phone?: string;
}

export interface FriendRequest {
  id: string;
  name: string;
  username: string;
  letter: string;
  color: string;
  sentAt: string;
  phone?: string;
}

export interface SearchResultUser {
  id: string;
  name: string;
  username: string;
  letter: string;
  color: string;
  phone: string;
  isFriend: boolean;
  hasPendingRequest: boolean;
}

interface FriendsState {
  friends: FriendUser[];
  requests: FriendRequest[];
  sentRequests: string[]; // Danh sách username hoặc phone đã gửi lời mời
  maxFriends: number;
  blockedUsers: string[];
  directoryUsers: FriendUser[];

  acceptRequest: (requestId: string) => void;
  declineRequest: (requestId: string) => void;
  sendRequest: (identifier: string) => boolean;
  searchFriendsAndDirectory: (query: string) => SearchResultUser[];
  removeFriend: (friendId: string) => void;
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
}

const INITIAL_FRIENDS: FriendUser[] = [
  { id: 'u2', name: 'Bình', username: 'binh_leafy', letter: 'B', color: colors.yellow, phone: '0912345678' },
  { id: 'u3', name: 'Chi', username: 'chi_leafy', letter: 'C', color: colors.sky, phone: '0903112233' },
  { id: 'u1', name: 'An', username: 'an_leafy', letter: 'A', color: colors.pink, phone: '0988123456' },
  { id: 'u6', name: 'Dũng', username: 'dung_tran', letter: 'D', color: colors.mint, phone: '0971223344' },
  { id: 'u7', name: 'Giang', username: 'giang_hoang', letter: 'G', color: colors.orange, phone: '0962334455' },
  { id: 'u8', name: 'Khánh', username: 'khanh_le', letter: 'K', color: colors.purple, phone: '0983445566' },
  { id: 'u9', name: 'Linh', username: 'linh_nguyen', letter: 'L', color: colors.pink, phone: '0914556677' },
  { id: 'u10', name: 'Minh', username: 'minh_vu', letter: 'M', color: colors.yellow, phone: '0935667788' },
  { id: 'u11', name: 'Nam', username: 'nam_phung', letter: 'N', color: colors.sky, phone: '0946778899' },
  { id: 'u12', name: 'Phúc', username: 'phuc_do', letter: 'P', color: colors.mint, phone: '0907889900' },
  { id: 'u13', name: 'Quân', username: 'quan_bui', letter: 'Q', color: colors.orange, phone: '0918990011' },
  { id: 'u14', name: 'Sơn', username: 'son_doan', letter: 'S', color: colors.purple, phone: '0989001122' },
];

const INITIAL_REQUESTS: FriendRequest[] = [
  { id: 'req_1', name: 'Em', username: 'em_leafy', letter: 'E', color: colors.pink, sentAt: '10 phút trước', phone: '0977654321' },
  { id: 'req_2', name: 'Hà', username: 'ha_nguyen', letter: 'H', color: colors.yellow, sentAt: '1 giờ trước', phone: '0934567890' },
];

// Danh bạ người dùng mở rộng trong cộng đồng LeafyBooth để tìm kiếm và kết bạn
const DIRECTORY_USERS: FriendUser[] = [
  { id: 'dir_1', name: 'Bảo Trâm', username: 'tram_booth', letter: 'T', color: colors.pink, phone: '0968112233' },
  { id: 'dir_2', name: 'Hoàng Long', username: 'hoang_vlog', letter: 'H', color: colors.lime, phone: '0901999888' },
  { id: 'dir_3', name: 'Mai Phương', username: 'mai_flower', letter: 'M', color: colors.yellow, phone: '0913888777' },
  { id: 'dir_4', name: 'Tuấn Anh', username: 'tuan_le', letter: 'T', color: colors.sky, phone: '0975666555' },
  { id: 'dir_5', name: 'Hạ Vy', username: 'vy_cute', letter: 'V', color: colors.orange, phone: '0936555444' },
  { id: 'dir_6', name: 'Đăng Khoa', username: 'khoa_design', letter: 'K', color: colors.mint, phone: '0947444333' },
];

export const useFriendsStore = create<FriendsState>((set, get) => ({
  friends: INITIAL_FRIENDS,
  requests: INITIAL_REQUESTS,
  sentRequests: [],
  maxFriends: 20,
  blockedUsers: [],
  directoryUsers: DIRECTORY_USERS,

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
      phone: req.phone,
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

  sendRequest: (identifier) => {
    const raw = identifier.trim();
    if (!raw) return false;

    const cleanUser = raw.toLowerCase().replace('@', '');
    const cleanDigits = raw.replace(/\D/g, '');

    // Kiểm tra đã là bạn bè chưa
    const isAlreadyFriend = get().friends.some((f) => {
      const matchUsername = f.username.toLowerCase() === cleanUser;
      const matchPhone = f.phone && cleanDigits && f.phone.replace(/\D/g, '') === cleanDigits;
      return matchUsername || matchPhone;
    });

    if (isAlreadyFriend) {
      return false;
    }

    // Ghi nhận đã gửi lời mời
    set((state) => ({
      sentRequests: [...state.sentRequests, raw],
    }));

    return true;
  },

  searchFriendsAndDirectory: (query) => {
    const clean = query.trim().toLowerCase().replace('@', '');
    const digits = query.replace(/\D/g, '');
    if (!clean && !digits) return [];

    const { friends, directoryUsers, sentRequests } = get();
    const allUsers = [...friends, ...directoryUsers];
    const seenIds = new Set<string>();
    const results: SearchResultUser[] = [];

    for (const u of allUsers) {
      if (seenIds.has(u.id)) continue;

      const matchName = u.name.toLowerCase().includes(clean);
      const matchUsername = u.username.toLowerCase().includes(clean);
      const uDigits = u.phone ? u.phone.replace(/\D/g, '') : '';
      const matchPhone = digits.length >= 3 && uDigits.includes(digits);

      if (matchName || matchUsername || matchPhone) {
        seenIds.add(u.id);
        const isFriend = friends.some((f) => f.id === u.id);
        const hasPending = sentRequests.includes(u.username) || (!!u.phone && sentRequests.includes(u.phone));

        results.push({
          id: u.id,
          name: u.name,
          username: u.username,
          letter: u.letter,
          color: u.color,
          phone: u.phone || 'Chưa cập nhật',
          isFriend,
          hasPendingRequest: hasPending,
        });
      }
    }

    // Nếu người dùng nhập 10 số điện thoại nhưng chưa có trong danh bạ, cho phép tạo lời mời tới số này
    if (digits.length >= 9 && !results.some((r) => r.phone.replace(/\D/g, '') === digits)) {
      results.push({
        id: `phone_${digits}`,
        name: `Người dùng ${digits.slice(-4)}`,
        username: `user_${digits.slice(-4)}`,
        letter: '📱',
        color: colors.lime,
        phone: digits,
        isFriend: false,
        hasPendingRequest: sentRequests.includes(digits),
      });
    }

    return results;
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

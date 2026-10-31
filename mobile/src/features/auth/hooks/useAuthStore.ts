import { create } from 'zustand';
import { useMomentsStore } from '../../moments/hooks/useMomentsStore';

export interface AuthUser {
  id: string;
  phone: string;
  name: string;
  username: string;
  avatarLetter: string;
  avatarColor: string;
  roleDescription?: string;
  createdAt?: string;
}

export type AuthStep = 'phone' | 'otp' | 'profile_setup' | 'authenticated';

// Danh bạ tài khoản mẫu có sẵn trong hệ thống
export const SEED_USERS: Record<string, AuthUser> = {
  '0989999999': {
    id: 'me',
    phone: '0989999999',
    name: 'Bạn (Tôi)',
    username: 'ten_ban',
    avatarLetter: 'T',
    avatarColor: '#C8F135',
    roleDescription: 'Tài khoản chính của bạn',
  },
  '0988123456': {
    id: 'u1',
    phone: '0988123456',
    name: 'An',
    username: 'an_leafy',
    avatarLetter: 'A',
    avatarColor: '#FF8FC7',
    roleDescription: 'Bạn thân Photobooth Kpop',
  },
  '0912345678': {
    id: 'u2',
    phone: '0912345678',
    name: 'Bình',
    username: 'binh_leafy',
    avatarLetter: 'B',
    avatarColor: '#FFD93D',
    roleDescription: 'Bạn thân Cafe sáng',
  },
  '0903112233': {
    id: 'u3',
    phone: '0903112233',
    name: 'Chi',
    username: 'chi_leafy',
    avatarLetter: 'C',
    avatarColor: '#6EC6FF',
    roleDescription: 'Bạn thân Y2K & Mưa',
  },
  '0934567890': {
    id: 'u4',
    phone: '0934567890',
    name: 'Hà',
    username: 'ha_nguyen',
    avatarLetter: 'H',
    avatarColor: '#7EE8B8',
    roleDescription: 'Bạn thân Ăn trưa',
  },
  '0977654321': {
    id: 'u5',
    phone: '0977654321',
    name: 'Em',
    username: 'em_leafy',
    avatarLetter: 'E',
    avatarColor: '#FF7A3D',
    roleDescription: 'Bạn thân Trà sữa',
  },
};

interface AuthState {
  phone: string;
  otp: string;
  generatedOtp: string;
  timer: number;
  isTimerActive: boolean;
  step: AuthStep;
  currentUser: AuthUser | null;
  userDatabase: Record<string, AuthUser>;
  isLoading: boolean;
  errorMessage: string | null;

  setPhone: (phone: string) => void;
  setOtp: (otp: string) => void;
  sendOtp: (phoneInput?: string) => Promise<{ success: boolean; otp: string; isKnownUser: boolean }>;
  resendOtp: () => Promise<string>;
  verifyOtp: (codeInput?: string) => { success: boolean; isNewUser: boolean; error?: string };
  completeProfile: (name: string, username: string, avatarColor?: string) => AuthUser;
  logout: () => void;
  resetStep: () => void;
  decrementTimer: () => void;
}

// Hàm chuẩn hóa số điện thoại Việt Nam (09x, +849x, 9x -> 09x)
export const normalizePhoneNumber = (rawPhone: string): string => {
  let cleaned = rawPhone.replace(/\D/g, '');
  if (cleaned.startsWith('84') && cleaned.length >= 11) {
    cleaned = '0' + cleaned.slice(2);
  }
  return cleaned;
};

// Định dạng hiển thị đẹp: 0988 123 456
export const formatPhoneNumber = (phone: string): string => {
  const c = phone.replace(/\D/g, '');
  if (c.length <= 4) return c;
  if (c.length <= 7) return `${c.slice(0, 4)} ${c.slice(4)}`;
  return `${c.slice(0, 4)} ${c.slice(4, 7)} ${c.slice(7, 10)}`;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  phone: '',
  otp: '',
  generatedOtp: '123456',
  timer: 60,
  isTimerActive: false,
  step: 'phone',
  currentUser: SEED_USERS['0989999999'], // Mặc định là tài khoản Bạn (Tôi)
  userDatabase: { ...SEED_USERS },
  isLoading: false,
  errorMessage: null,

  setPhone: (phone) => set({ phone, errorMessage: null }),
  setOtp: (otp) => set({ otp, errorMessage: null }),

  sendOtp: async (phoneInput) => {
    const rawPhone = phoneInput || get().phone;
    const cleanPhone = normalizePhoneNumber(rawPhone);

    if (!cleanPhone || cleanPhone.length < 10) {
      set({ errorMessage: 'Vui lòng nhập số điện thoại hợp lệ (10 chữ số)' });
      return { success: false, otp: '', isKnownUser: false };
    }

    set({ isLoading: true, errorMessage: null });

    // Mô phỏng độ trễ mạng SMS thực tế (500ms)
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Sinh mã OTP 6 số (để test thuận tiện, tạo mã 6 số ngẫu nhiên hoặc 123456)
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const isKnown = !!get().userDatabase[cleanPhone];

    set({
      phone: cleanPhone,
      generatedOtp: newOtp,
      otp: '',
      step: 'otp',
      timer: 60,
      isTimerActive: true,
      isLoading: false,
      errorMessage: null,
    });

    return { success: true, otp: newOtp, isKnownUser: isKnown };
  },

  resendOtp: async () => {
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    set({
      generatedOtp: newOtp,
      otp: '',
      timer: 60,
      isTimerActive: true,
      errorMessage: null,
    });
    return newOtp;
  },

  verifyOtp: (codeInput) => {
    const code = (codeInput || get().otp).trim();
    const { generatedOtp, phone, userDatabase } = get();

    // Chấp nhận mã vừa sinh hoặc mã dự phòng tiện test '123456'
    if (code !== generatedOtp && code !== '123456') {
      set({ errorMessage: 'Mã OTP không chính xác. Vui lòng thử lại!' });
      return { success: false, isNewUser: false, error: 'Mã OTP không chính xác' };
    }

    const cleanPhone = normalizePhoneNumber(phone);
    const existingUser = userDatabase[cleanPhone];

    if (existingUser) {
      // Đăng nhập thành công với tài khoản đã tồn tại
      set({
        currentUser: existingUser,
        step: 'authenticated',
        isTimerActive: false,
        errorMessage: null,
      });

      // Đồng bộ sang useMomentsStore
      try {
        useMomentsStore.getState().switchAccount(existingUser.id);
      } catch {
        // Fallback an toàn
      }

      return { success: true, isNewUser: false };
    } else {
      // Số mới chưa có tài khoản -> Chuyển sang bước tạo hồ sơ (Profile Setup)
      set({
        step: 'profile_setup',
        isTimerActive: false,
        errorMessage: null,
      });
      return { success: true, isNewUser: true };
    }
  },

  completeProfile: (name, username, avatarColor = '#C8F135') => {
    const { phone, userDatabase } = get();
    const cleanPhone = normalizePhoneNumber(phone);
    const cleanUsername = username.trim().toLowerCase().replace('@', '');
    const cleanName = name.trim();
    const letter = (cleanName[0] || 'L').toUpperCase();

    const newUser: AuthUser = {
      id: `u_${Date.now()}`,
      phone: cleanPhone,
      name: cleanName || 'Bạn mới',
      username: cleanUsername || `user_${cleanPhone.slice(-4)}`,
      avatarLetter: letter,
      avatarColor: avatarColor,
      roleDescription: 'Thành viên mới LeafyBooth 🌱',
      createdAt: new Date().toISOString(),
    };

    const updatedDb = {
      ...userDatabase,
      [cleanPhone]: newUser,
    };

    set({
      currentUser: newUser,
      userDatabase: updatedDb,
      step: 'authenticated',
      errorMessage: null,
    });

    // Đồng bộ sang useMomentsStore
    try {
      const momentsStore = useMomentsStore.getState();
      momentsStore.currentUser = {
        id: newUser.id,
        name: newUser.name,
        username: newUser.username,
        avatarLetter: newUser.avatarLetter,
        avatarColor: newUser.avatarColor,
        roleDescription: newUser.roleDescription || 'Tài khoản chính của bạn',
      };
    } catch {
      // Fallback an toàn
    }

    return newUser;
  },

  logout: () => {
    set({
      currentUser: null,
      phone: '',
      otp: '',
      step: 'phone',
      isTimerActive: false,
      errorMessage: null,
    });
  },

  resetStep: () => {
    set({
      step: 'phone',
      otp: '',
      isTimerActive: false,
      errorMessage: null,
    });
  },

  decrementTimer: () => {
    const currentTimer = get().timer;
    if (currentTimer <= 1) {
      set({ timer: 0, isTimerActive: false });
    } else {
      set({ timer: currentTimer - 1 });
    }
  },
}));

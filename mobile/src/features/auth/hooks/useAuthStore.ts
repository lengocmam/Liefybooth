import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMomentsStore } from '../../moments/hooks/useMomentsStore';
import { supabaseService } from '../../../core/supabase/supabaseService';
import { isSupabaseConfigured, supabase } from '../../../core/supabase/supabaseClient';

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
export type CloudSyncStatus = 'synced' | 'local' | 'syncing' | 'error';

export const STORAGE_KEY_USER = '@leafybooth_session_user';
export const STORAGE_KEY_REMEMBER = '@leafybooth_remember_me';

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
  realSmsSent: boolean;
  smsMessage: string;
  timer: number;
  isTimerActive: boolean;
  step: AuthStep;
  currentUser: AuthUser | null;
  userDatabase: Record<string, AuthUser>;
  isLoading: boolean;
  errorMessage: string | null;

  // Supabase Cloud & Ghi nhớ phiên đăng nhập (Remember Me)
  isInitialized: boolean;
  rememberMe: boolean;
  cloudSyncStatus: CloudSyncStatus;
  setRememberMe: (remember: boolean) => void;
  initAuthSession: () => Promise<AuthUser | null>;
  quickLoginAs: (user: AuthUser) => Promise<void>;

  setPhone: (phone: string) => void;
  setOtp: (otp: string) => void;
  sendOtp: (phoneInput?: string) => Promise<{ success: boolean; otp: string; isKnownUser: boolean; realSmsSent: boolean }>;
  resendOtp: () => Promise<string>;
  verifyOtp: (codeInput?: string) => Promise<{ success: boolean; isNewUser: boolean; error?: string }>;
  completeProfile: (name: string, username: string, avatarColor?: string) => AuthUser;
  logout: () => Promise<void>;
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
  realSmsSent: false,
  smsMessage: '',
  timer: 60,
  isTimerActive: false,
  step: 'phone',
  currentUser: SEED_USERS['0989999999'], // Khởi đầu mặc định an toàn
  userDatabase: { ...SEED_USERS },
  isLoading: false,
  errorMessage: null,

  // Ghi nhớ & Cloud state
  isInitialized: false,
  rememberMe: true,
  cloudSyncStatus: isSupabaseConfigured() ? 'synced' : 'local',

  setRememberMe: (remember) => {
    set({ rememberMe: remember });
    AsyncStorage.setItem(STORAGE_KEY_REMEMBER, remember ? 'true' : 'false').catch(() => {});
  },

  /**
   * Khởi tạo và khôi phục phiên đăng nhập từ AsyncStorage / Supabase Cloud
   */
  initAuthSession: async () => {
    try {
      const savedRemember = await AsyncStorage.getItem(STORAGE_KEY_REMEMBER);
      const isRememberEnabled = savedRemember !== 'false';
      set({ rememberMe: isRememberEnabled });

      if (isRememberEnabled) {
        const savedUserStr = await AsyncStorage.getItem(STORAGE_KEY_USER);
        if (savedUserStr) {
          const user: AuthUser = JSON.parse(savedUserStr);
          set({
            currentUser: user,
            step: 'authenticated',
            isInitialized: true,
            cloudSyncStatus: isSupabaseConfigured() ? 'synced' : 'local',
          });

          // Đồng bộ với useMomentsStore
          try {
            useMomentsStore.getState().switchAccount(user.id);
          } catch {}

          // Tải hồ sơ mới nhất từ Supabase Cloud chạy nền
          if (isSupabaseConfigured()) {
            supabaseService.fetchUserProfile(user.id).then((cloudProfile) => {
              if (cloudProfile) {
                set({ currentUser: cloudProfile });
                AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(cloudProfile)).catch(() => {});
              }
            }).catch(() => {});
          }

          return user;
        }
      }
    } catch (err) {
      console.warn('[useAuthStore] Không thể khôi phục phiên đăng nhập:', err);
    }

    set({ isInitialized: true });
    return null;
  },

  /**
   * Đăng nhập nhanh 1 chạm với tài khoản demo có sẵn và tự động lưu phiên
   */
  quickLoginAs: async (user: AuthUser) => {
    set({
      currentUser: user,
      step: 'authenticated',
      errorMessage: null,
      cloudSyncStatus: isSupabaseConfigured() ? 'syncing' : 'local',
    });

    try {
      useMomentsStore.getState().switchAccount(user.id);
    } catch {}

    if (get().rememberMe) {
      await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user)).catch(() => {});
    }

    if (isSupabaseConfigured()) {
      await supabaseService.upsertUserProfile(user);
      set({ cloudSyncStatus: 'synced' });
    }
  },

  setPhone: (phone) => set({ phone, errorMessage: null }),
  setOtp: (otp) => set({ otp, errorMessage: null }),

  /**
   * Gửi mã OTP xác nhận về số điện thoại (Hỗ trợ SMS qua Supabase Phone Gateway)
   */
  sendOtp: async (phoneInput) => {
    const rawPhone = phoneInput || get().phone;
    const cleanPhone = normalizePhoneNumber(rawPhone);

    if (!cleanPhone || cleanPhone.length < 10) {
      set({ errorMessage: 'Vui lòng nhập số điện thoại hợp lệ (10 chữ số)' });
      return { success: false, otp: '', isKnownUser: false, realSmsSent: false };
    }

    set({ isLoading: true, errorMessage: null });

    let cloudUser: AuthUser | null = null;
    let realSms = false;
    let smsFeedback = '';

    if (isSupabaseConfigured()) {
      try {
        // Tải thông tin người dùng nếu đã đăng ký trên Supabase
        cloudUser = await supabaseService.fetchUserProfile(cleanPhone);
      } catch {}

      try {
        // Kích hoạt gửi SMS thực tế qua Supabase Phone Auth
        const smsRes = await supabaseService.sendPhoneOtp(cleanPhone);
        realSms = smsRes.realSmsSent;
        smsFeedback = smsRes.message || '';
      } catch (smsErr: any) {
        console.log('[useAuthStore] SMS trigger:', smsErr.message);
      }
    }

    // Sinh mã OTP 6 số dự phòng / test
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const isKnown = Boolean(cloudUser || get().userDatabase[cleanPhone]);

    // Nếu tìm thấy trên Supabase mà local chưa có, lưu vào local DB
    if (cloudUser) {
      set((state) => ({
        userDatabase: { ...state.userDatabase, [cleanPhone]: cloudUser! },
      }));
    }

    set({
      phone: cleanPhone,
      generatedOtp: newOtp,
      realSmsSent: realSms,
      smsMessage: smsFeedback,
      otp: '',
      step: 'otp',
      timer: 60,
      isTimerActive: true,
      isLoading: false,
      errorMessage: null,
    });

    return { success: true, otp: newOtp, isKnownUser: isKnown, realSmsSent: realSms };
  },

  resendOtp: async () => {
    const { phone } = get();
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    let realSms = false;
    let smsMsg = '';

    if (isSupabaseConfigured() && phone) {
      try {
        const smsRes = await supabaseService.sendPhoneOtp(phone);
        realSms = smsRes.realSmsSent;
        smsMsg = smsRes.message || '';
      } catch {}
    }

    set({
      generatedOtp: newOtp,
      realSmsSent: realSms,
      smsMessage: smsMsg,
      otp: '',
      timer: 60,
      isTimerActive: true,
      errorMessage: null,
    });
    return newOtp;
  },

  verifyOtp: async (codeInput) => {
    const code = (codeInput || get().otp).trim();
    const { generatedOtp, phone, userDatabase, rememberMe, realSmsSent } = get();

    let verified = false;

    // 1. Nếu SMS đã gửi thật qua Supabase Phone Gateway, kiểm tra với Supabase
    if (realSmsSent && isSupabaseConfigured()) {
      try {
        const verifyRes = await supabaseService.verifyPhoneOtp(phone, code);
        if (verifyRes.success) {
          verified = true;
        }
      } catch {}
    }

    // 2. Chấp nhận mã vừa sinh hoặc mã dự phòng tiện test '123456'
    if (!verified && (code === generatedOtp || code === '123456')) {
      verified = true;
    }

    if (!verified) {
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
        cloudSyncStatus: isSupabaseConfigured() ? 'syncing' : 'local',
      });

      // Đồng bộ sang useMomentsStore
      try {
        useMomentsStore.getState().switchAccount(existingUser.id);
      } catch {}

      // Tự động ghi nhớ phiên đăng nhập (Persistent Session)
      if (rememberMe) {
        AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(existingUser)).catch(() => {});
      }

      // Lưu/Cập nhật profile lên Supabase Cloud
      if (isSupabaseConfigured()) {
        supabaseService.upsertUserProfile(existingUser).then(() => {
          set({ cloudSyncStatus: 'synced' });
        }).catch(() => {
          set({ cloudSyncStatus: 'error' });
        });
      }

      return { success: true, isNewUser: false };
    } else {
      // Số mới chưa có tài khoản -> Chuyển sang bước tạo hồ sơ (Đăng ký)
      set({
        step: 'profile_setup',
        isTimerActive: false,
        errorMessage: null,
      });
      return { success: true, isNewUser: true };
    }
  },

  completeProfile: (name, username, avatarColor = '#C8F135') => {
    const { phone, userDatabase, rememberMe } = get();
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
      cloudSyncStatus: isSupabaseConfigured() ? 'syncing' : 'local',
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
    } catch {}

    // Ghi nhớ phiên đăng nhập
    if (rememberMe) {
      AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser)).catch(() => {});
    }

    // Lưu vào Supabase Cloud
    if (isSupabaseConfigured()) {
      supabaseService.upsertUserProfile(newUser).then(() => {
        set({ cloudSyncStatus: 'synced' });
      }).catch(() => {
        set({ cloudSyncStatus: 'error' });
      });
    }

    return newUser;
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY_USER);
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut().catch(() => {});
      }
    } catch (e) {
      console.warn('[useAuthStore] Lỗi đăng xuất:', e);
    }

    set({
      currentUser: null,
      phone: '',
      otp: '',
      step: 'phone',
      isTimerActive: false,
      errorMessage: null,
      cloudSyncStatus: isSupabaseConfigured() ? 'synced' : 'local',
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

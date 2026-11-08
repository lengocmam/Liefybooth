import { supabase, isSupabaseConfigured } from './supabaseClient';
import type { AuthUser } from '../../features/auth/hooks/useAuthStore';

export interface CloudMomentRecord {
  id: string;
  user_id: string;
  image_url: string;
  type: string;
  caption?: string;
  created_at?: string;
}

/**
 * Chuẩn hóa số điện thoại Việt Nam sang định dạng quốc tế E.164 (+84...) cho cổng SMS
 */
export const toE164 = (rawPhone: string): string => {
  let cleaned = rawPhone.replace(/\D/g, '');
  if (cleaned.startsWith('84') && cleaned.length >= 11) {
    return '+' + cleaned;
  }
  if (cleaned.startsWith('0')) {
    return '+84' + cleaned.slice(1);
  }
  if (!cleaned.startsWith('+')) {
    return '+84' + cleaned;
  }
  return cleaned;
};

export const supabaseService = {
  /**
   * Kiểm tra trạng thái kết nối tới Supabase Cloud
   */
  async checkCloudStatus(): Promise<{ connected: boolean; message: string }> {
    if (!isSupabaseConfigured()) {
      return {
        connected: false,
        message: 'Chế độ Local Offline (Chưa nhập API Keys Supabase trong file .env)',
      };
    }

    try {
      const { data, error } = await supabase.from('profiles').select('id').limit(1);
      if (error && error.code !== 'PGRST116') {
        return {
          connected: false,
          message: `Lỗi kết nối Supabase: ${error.message}`,
        };
      }
      return {
        connected: true,
        message: 'Đã kết nối Supabase Cloud thời gian thực ⚡',
      };
    } catch (err: any) {
      return {
        connected: false,
        message: `Không thể kết nối mạng: ${err.message || 'Offline'}`,
      };
    }
  },

  /**
   * Đồng bộ hoặc tạo User trên Supabase Authentication (bảng auth.users)
   * Giúp tài khoản hiện diện lập tức trên tab Users của Supabase Dashboard mà không cần cấu hình Twilio
   */
  async syncAuthUserToSupabase(
    user: AuthUser,
    customEmail?: string,
    customPassword?: string
  ): Promise<{ success: boolean; session?: any; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: true };
    }

    try {
      const userEmail = customEmail || `${user.phone}@leafybooth.local`;
      const userPassword = customPassword || `Leafy@${user.phone}!2026`;

      // 1. Thử đăng nhập nếu user đã tồn tại trong auth.users
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: userPassword,
      });

      if (!signInError && signInData?.user) {
        const authUserId = signInData.user.id;
        await this.upsertUserProfile({
          ...user,
          id: authUserId,
        });
        return { success: true, session: signInData.session };
      }

      // 2. Nếu chưa có, tiến hành Đăng ký (SignUp) vào auth.users
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: userEmail,
        password: userPassword,
        options: {
          data: {
            phone: user.phone,
            name: user.name,
            username: user.username,
            avatar_letter: user.avatarLetter,
            avatar_color: user.avatarColor,
          },
        },
      });

      if (signUpError) {
        console.warn('[Supabase Auth] SignUp warning:', signUpError.message);
        await this.upsertUserProfile(user);
        return { success: false, error: signUpError.message };
      }

      const newAuthId = signUpData.user?.id || user.id;
      await this.upsertUserProfile({
        ...user,
        id: newAuthId,
      });

      return { success: true, session: signUpData.session };
    } catch (err: any) {
      console.warn('[Supabase Auth] Error:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Đăng ký tài khoản bằng Email & Mật khẩu chuẩn Supabase (100% Miễn phí, không cần Twilio)
   */
  async signUpWithEmail(
    email: string,
    password: string,
    metadata: { name: string; username: string; phone?: string; avatarColor?: string }
  ): Promise<{ success: boolean; user?: any; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Chưa cấu hình Supabase URL & Key' };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: metadata.name,
            username: metadata.username,
            phone: metadata.phone || '',
            avatar_letter: (metadata.name[0] || 'L').toUpperCase(),
            avatar_color: metadata.avatarColor || '#C8F135',
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        await this.upsertUserProfile({
          id: data.user.id,
          phone: metadata.phone || '',
          name: metadata.name,
          username: metadata.username,
          avatarLetter: (metadata.name[0] || 'L').toUpperCase(),
          avatarColor: metadata.avatarColor || '#C8F135',
          roleDescription: 'Thành viên LeafyBooth 🌱',
        });
      }

      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Đăng nhập tài khoản bằng Email & Mật khẩu chuẩn Supabase
   */
  async signInWithEmail(email: string, password: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Chưa cấu hình Supabase URL & Key' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        return { success: false, error: error?.message || 'Đăng nhập không thành công' };
      }

      const meta = data.user.user_metadata || {};
      const authUser: AuthUser = {
        id: data.user.id,
        phone: meta.phone || data.user.email?.split('@')[0] || '',
        name: meta.name || data.user.email?.split('@')[0] || 'Người dùng',
        username: meta.username || data.user.email?.split('@')[0] || 'user',
        avatarLetter: meta.avatar_letter || meta.name?.[0]?.toUpperCase() || 'L',
        avatarColor: meta.avatar_color || '#C8F135',
        roleDescription: 'Thành viên LeafyBooth 🌱',
      };

      const profile = await this.fetchUserProfile(data.user.id);
      return { success: true, user: profile || authUser };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Gửi mã xác thực OTP về số điện thoại thực tế qua Supabase Phone Auth (Twilio / MessageBird)
   */
  async sendPhoneOtp(phone: string): Promise<{ success: boolean; realSmsSent: boolean; message?: string; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: true, realSmsSent: false, message: 'Chế độ Local' };
    }

    try {
      const e164Phone = toE164(phone);
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: e164Phone,
      });

      if (error) {
        console.log('[Supabase SMS Auth] Gateway status:', error.message);
        // Supabase báo lỗi ví dụ chưa bật SMS provider (Twilio/Vonage)
        return {
          success: true,
          realSmsSent: false,
          error: error.message,
          message: 'Phone Provider chưa kích hoạt trong Supabase (Chuyển sang mã OTP xác thực)',
        };
      }

      return {
        success: true,
        realSmsSent: true,
        message: `Đã gửi mã SMS về số ${e164Phone}`,
      };
    } catch (err: any) {
      return {
        success: true,
        realSmsSent: false,
        error: err.message,
      };
    }
  },

  /**
   * Xác thực mã OTP qua Supabase
   */
  async verifyPhoneOtp(phone: string, token: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: true };
    }

    try {
      const e164Phone = toE164(phone);
      const { data, error } = await supabase.auth.verifyOtp({
        phone: e164Phone,
        token: token,
        type: 'sms',
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Lấy thông tin hồ sơ người dùng từ bảng `profiles` trên Supabase
   */
  async fetchUserProfile(userIdOrPhone: string): Promise<AuthUser | null> {
    if (!isSupabaseConfigured()) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`id.eq.${userIdOrPhone},phone.eq.${userIdOrPhone}`)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        phone: data.phone,
        name: data.name,
        username: data.username,
        avatarLetter: data.avatar_letter || data.name[0]?.toUpperCase() || 'L',
        avatarColor: data.avatar_color || '#C8F135',
        roleDescription: data.role_description || 'Thành viên LeafyBooth 🌱',
        createdAt: data.created_at,
      };
    } catch {
      return null;
    }
  },

  /**
   * Lưu hoặc cập nhật hồ sơ người dùng (Upsert Profile) lên Supabase
   */
  async upsertUserProfile(user: AuthUser): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: true };
    }

    try {
      const { error } = await supabase.from('profiles').upsert(
        {
          id: user.id,
          phone: user.phone,
          name: user.name,
          username: user.username,
          avatar_letter: user.avatarLetter,
          avatar_color: user.avatarColor,
          role_description: user.roleDescription || 'Thành viên LeafyBooth 🌱',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

      if (error) {
        console.warn('[Supabase] Lỗi khi lưu profile:', error.message);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      console.warn('[Supabase] Lỗi kết nối khi lưu profile:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Tải danh sách ảnh / moments của người dùng từ Supabase
   */
  async fetchUserMoments(userId: string): Promise<CloudMomentRecord[]> {
    if (!isSupabaseConfigured()) return [];

    try {
      const { data, error } = await supabase
        .from('user_moments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      return data as CloudMomentRecord[];
    } catch {
      return [];
    }
  },

  /**
   * Lưu một khoảnh khắc / dải ảnh photobooth lên Supabase
   */
  async saveUserMoment(record: CloudMomentRecord): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: true };
    }

    try {
      const { error } = await supabase.from('user_moments').insert({
        id: record.id,
        user_id: record.user_id,
        image_url: record.image_url,
        type: record.type,
        caption: record.caption || '',
        created_at: record.created_at || new Date().toISOString(),
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },
};

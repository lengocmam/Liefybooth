import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Đọc cấu hình từ biến môi trường của Expo (.env)
// Nếu chưa có file .env, fallback về URL giả lập để app vẫn chạy mượt mà không crash
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://leafybooth-demo.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-key-placeholder';

/**
 * Kiểm tra xem Supabase đã được điền thông tin thật hay đang ở chế độ Local / Fallback
 */
export const isSupabaseConfigured = (): boolean => {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
    key &&
    !url.includes('placeholder') &&
    !url.includes('your-project-id') &&
    !url.includes('leafybooth-demo') &&
    url.startsWith('https://')
  );
};

/**
 * Supabase Client với cơ chế tự động ghi nhớ phiên đăng nhập (Session Persistence)
 * bằng AsyncStorage của React Native
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

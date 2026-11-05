import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Bộ nhớ tạm in-memory dùng cho môi trường Server-Side Rendering (Node.js SSR)
 * khi chạy web mà không có đối tượng toàn cục `window`
 */
const inMemoryStore: Record<string, string> = {};

/**
 * Adapter lưu trữ an toàn đa nền tảng (iOS, Android, Web Client, Node.js SSR Server)
 * Giải quyết triệt để lỗi "ReferenceError: window is not defined" khi build hoặc render web server
 */
export const safeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        if (typeof window === 'undefined' || !window.localStorage) {
          return inMemoryStore[key] || null;
        }
        return window.localStorage.getItem(key);
      }
      return await AsyncStorage.getItem(key);
    } catch {
      return inMemoryStore[key] || null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    try {
      inMemoryStore[key] = value;
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
        return;
      }
      await AsyncStorage.setItem(key, value);
    } catch {
      inMemoryStore[key] = value;
    }
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      delete inMemoryStore[key];
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
        return;
      }
      await AsyncStorage.removeItem(key);
    } catch {
      delete inMemoryStore[key];
    }
  },
};

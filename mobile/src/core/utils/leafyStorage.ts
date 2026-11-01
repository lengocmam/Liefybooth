import { Platform } from 'react-native';

const inMemoryStore: Record<string, string> = {};

export const leafyStorage = {
  getItem: (key: string): string | null => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return inMemoryStore[key] || null;
    } catch {
      return inMemoryStore[key] || null;
    }
  },

  setItem: (key: string, value: string): void => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
      inMemoryStore[key] = value;
    } catch {
      inMemoryStore[key] = value;
    }
  },

  removeItem: (key: string): void => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
      delete inMemoryStore[key];
    } catch {
      delete inMemoryStore[key];
    }
  },

  getObject: <T>(key: string, fallback: T): T => {
    try {
      const val = leafyStorage.getItem(key);
      if (!val) return fallback;
      return JSON.parse(val) as T;
    } catch {
      return fallback;
    }
  },

  setObject: <T>(key: string, value: T): void => {
    try {
      leafyStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore serialization error
    }
  },
};

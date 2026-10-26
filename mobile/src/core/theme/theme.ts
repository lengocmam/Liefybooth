import { ViewStyle, TextStyle } from 'react-native';
import { colors } from './colors';

export const theme = {
  colors,

  // Quy chuẩn bo góc và viền theo phong cách Sticker Pop
  borders: {
    width: 2.5,
    color: colors.ink,
    radius: {
      card: 22,
      button: 26,
      chip: 18,
      full: 9999,
    },
  },

  // Bóng đổ cứng (Hard Shadow) đặc trưng
  shadows: {
    hard: {
      shadowColor: colors.ink,
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 0,
      elevation: 4,
    } as ViewStyle,
    hardSmall: {
      shadowColor: colors.ink,
      shadowOffset: { width: 2, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 0,
      elevation: 2,
    } as ViewStyle,
  },

  // Kích thước chuẩn
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },

  // Kích thước nút và touch target
  components: {
    buttonHeight: 52,
    minTouchTarget: 44,
  },

  // Kiểu chữ chuẩn
  typography: {
    titleScreen: {
      fontSize: 36,
      fontWeight: '800',
      color: colors.ink,
    } as TextStyle,
    titleSection: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.ink,
    } as TextStyle,
    body: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.ink,
    } as TextStyle,
    caption: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.ink,
    } as TextStyle,
    button: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.ink,
    } as TextStyle,
  },
} as const;

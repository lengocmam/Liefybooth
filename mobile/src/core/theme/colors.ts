/**
 * LeafyBooth Design System Color Tokens (Sticker Pop)
 * Theo đặc tả kỹ thuật mục 18
 */

export const colors = {
  // Màu chính
  ink: '#111111',         // Viền đen, chữ, bóng đổ cứng
  lime: '#C8F135',        // Nút chính, nút chụp, tab active
  white: '#FFFFFF',       // Nền thẻ, nút phụ

  // Màu nền theo từng màn hình
  forestGreen: '#0B3D2E', // Nền Plant (Camera)
  pink: '#FF8FC7',        // Nền Pick (Hộp ảnh)
  orange: '#FF7A3D',      // Nền tab Booth (Chọn nền)
  yellow: '#FFD93D',      // Nền Tùy chỉnh dải ảnh
  purple: '#B9A4FF',      // Nền Garden sự kiện
  cobalt: '#3D5AFE',      // Nền danh sách Garden
  sky: '#6EC6FF',         // Nền Cá nhân / Bạn bè
  mint: '#7EE8B8',        // Nền Frame Studio
  deepPink: '#FF4F8B',    // Nền Xu hướng

  // Trạng thái & phụ trợ
  grayLight: '#F3F4F6',
  grayBorder: '#E5E7EB',
  error: '#EF4444',
  success: '#10B981',
} as const;

export type ColorToken = keyof typeof colors;

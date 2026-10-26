/**
 * LeafyBooth App Constants
 * Quy định theo đặc tả kỹ thuật bản 1.0
 */

export const APP_CONFIG = {
  NAME: 'LeafyBooth',
  SLOGAN: 'Plant a moment',
  SCHEME: 'leafybooth',
  MAX_FRIENDS: 20,              // Giới hạn 20 bạn bè để đảm bảo tính riêng tư
  MOMENT_EXPIRY_DAYS: 90,       // Ảnh khoảnh khắc tự hủy sau 90 ngày
  MAX_CAPTION_LENGTH: 80,       // Tối đa 80 ký tự cho chú thích ảnh
  BOOTH_COUNTDOWN_SECONDS: 3,   // Đếm ngược 3s mỗi khung photobooth
  BOOTH_TOTAL_FRAMES: 4,        // 4 khung ảnh liên tiếp
  COOP_SHEET_SLOTS: 4,          // Dải chung Chế độ B gồm 4 ô
} as const;

export const DEFAULT_BACKDROPS = [
  { id: 'halloween', name: 'Halloween', dateLabel: '31/10', color: '#FF7A3D' },
  { id: 'birthday', name: 'Sinh nhật', dateLabel: 'Dịp sinh nhật', color: '#FF8FC7' },
  { id: 'graduation', name: 'Tốt nghiệp', dateLabel: 'Lễ tốt nghiệp', color: '#6EC6FF' },
  { id: 'christmas', name: 'Giáng sinh', dateLabel: '24/12', color: '#10B981' },
  { id: 'outing', name: 'Đi chơi', dateLabel: 'Cuối tuần', color: '#FFD93D' },
  { id: 'tet', name: 'Tết Nguyên Đán', dateLabel: 'Xuân về', color: '#EF4444' },
  { id: 'mid_autumn', name: 'Trung thu', dateLabel: 'Rằm tháng 8', color: '#F59E0B' },
  { id: 'women_day', name: '20/10', dateLabel: 'Ngày phụ nữ', color: '#EC4899' },
  { id: 'valentine', name: 'Valentine', dateLabel: '14/02', color: '#F43F5E' },
  { id: 'default', name: 'Mặc định', dateLabel: 'Hằng ngày', color: '#C8F135' },
] as const;

export const REACTION_ICONS = ['❤️', '😊', '🔥', '⭐', '😮'] as const;

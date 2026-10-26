export const MAX_FRIENDS = 20;
export const MOMENT_EXPIRY_DAYS = 90;

/**
 * Tạo ID cho cặp bạn bè theo thứ tự từ điển alphabet để tránh trùng lặp 2 chiều
 */
export function getFriendshipPairId(uidA: string, uidB: string): string {
  return uidA < uidB ? `${uidA}_${uidB}` : `${uidB}_${uidA}`;
}

/**
 * Sinh mã mời sự kiện gồm 6 ký tự chữ hoa và số dễ đọc (không chứa ký tự dễ nhầm 0, O, 1, I)
 */
export function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

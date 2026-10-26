import * as admin from 'firebase-admin';
import { MOMENT_EXPIRY_DAYS } from '../utils/types';

/**
 * Scheduled Cron Job: Tự động dọn dẹp các ảnh khoảnh khắc quá hạn 90 ngày (M3 lifecycle)
 * Chạy mỗi ngày lúc 3:00 sáng
 */
export async function cleanupExpiredMoments() {
  const db = admin.firestore();
  const storage = admin.storage().bucket();

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - MOMENT_EXPIRY_DAYS);

  const snapshot = await db
    .collection('moments')
    .where('createdAt', '<', ninetyDaysAgo)
    .limit(500)
    .get();

  if (snapshot.empty) {
    console.log('Không có khoảnh khắc nào quá hạn 90 ngày.');
    return;
  }

  console.log(`Tìm thấy ${snapshot.size} khoảnh khắc quá hạn. Bắt đầu xóa...`);

  const batch = db.batch();
  const deletePromises: Promise<any>[] = [];

  snapshot.forEach((doc) => {
    batch.delete(doc.ref);

    // Xóa file ảnh gốc và thumbnail trong Storage
    deletePromises.push(
      storage.file(`moments/${doc.id}.jpg`).delete().catch(() => {}),
      storage.file(`moments/${doc.id}_thumb.jpg`).delete().catch(() => {})
    );
  });

  await Promise.all([...deletePromises, batch.commit()]);
  console.log(`Đã dọn dẹp thành công ${snapshot.size} khoảnh khắc hết hạn 90 ngày.`);
}

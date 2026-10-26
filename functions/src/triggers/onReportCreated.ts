import * as admin from 'firebase-admin';
import { FirestoreEvent, QueryDocumentSnapshot } from 'firebase-functions/v2/firestore';

/**
 * Trigger khi có Báo cáo vi phạm (UGC Safety - Xử lý trong vòng 24 giờ theo cam kết App Review)
 */
export async function onReportCreatedHandler(
  event: FirestoreEvent<QueryDocumentSnapshot | undefined>
) {
  const snapshot = event.data;
  if (!snapshot) return;

  const report = snapshot.data();
  const { targetType, targetPath, reason, reporterId } = report;

  console.warn(
    `[UGC ALERT 24H] Báo cáo mới từ user ${reporterId} đối với mục ${targetType} (${targetPath}): Lý do - "${reason}"`
  );

  const db = admin.firestore();

  // Tăng biến đếm reportCount trên tài liệu bị báo cáo
  if (targetPath) {
    const targetRef = db.doc(targetPath);
    try {
      await targetRef.update({
        reportCount: admin.firestore.FieldValue.increment(1),
      });

      const updatedDoc = await targetRef.get();
      const count = updatedDoc.data()?.reportCount || 0;

      // Nếu bị báo cáo từ 3 lần trở lên, tự động tạm ẩn ngay lập tức để bảo vệ cộng đồng
      if (count >= 3) {
        await targetRef.update({ hidden: true });
        console.warn(`[UGC AUTO-MODERATE] Mục ${targetPath} đã bị tự động ẩn do nhận ${count} lượt báo cáo.`);
      }
    } catch (err) {
      console.error('Không thể cập nhật mục tiêu bị báo cáo:', err);
    }
  }
}

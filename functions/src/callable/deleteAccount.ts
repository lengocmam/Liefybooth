import * as admin from 'firebase-admin';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';

/**
 * Xóa tài khoản vĩnh viễn (Tuân thủ yêu cầu xét duyệt bắt buộc của Apple App Store & Google Play)
 */
export async function deleteAccountHandler(request: CallableRequest) {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Yêu cầu đăng nhập');
  }

  const uid = request.auth.uid;
  const db = admin.firestore();
  const storage = admin.storage().bucket();

  // 1. Lấy thông tin user để xóa username
  const userDoc = await db.collection('users').doc(uid).get();
  const username = userDoc.data()?.username;

  const batch = db.batch();

  // 2. Xóa hồ sơ và username
  batch.delete(db.collection('users').doc(uid));
  if (username) {
    batch.delete(db.collection('usernames').doc(username.toLowerCase()));
  }

  // 3. Xóa các quan hệ bạn bè (friendships)
  const friendships = await db
    .collection('friendships')
    .where('members', 'array-contains', uid)
    .get();

  friendships.forEach((doc) => {
    batch.delete(doc.ref);
  });

  // 4. Xóa các moments do người này gửi
  const moments = await db
    .collection('moments')
    .where('senderId', '==', uid)
    .get();

  moments.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();

  // 5. Rút khỏi các sự kiện Garden (xử lý quyền chủ sự kiện)
  const ownedEvents = await db.collection('events').where('ownerId', '==', uid).get();
  for (const eventDoc of ownedEvents.docs) {
    const data = eventDoc.data();
    const remainingMembers: string[] = (data.memberIds || []).filter((m: string) => m !== uid);
    if (remainingMembers.length > 0) {
      // Chuyển quyền chủ phòng cho thành viên lâu nhất tiếp theo
      await eventDoc.ref.update({
        ownerId: remainingMembers[0],
        memberIds: remainingMembers,
        memberCount: remainingMembers.length,
      });
    } else {
      // Nếu không còn ai, xóa sự kiện và mã mời
      if (data.joinCode) {
        await db.collection('joinCodes').doc(data.joinCode).delete();
      }
      await eventDoc.ref.delete();
    }
  }

  // 6. Xóa avatar trong Storage nếu có
  try {
    await storage.file(`users/${uid}/avatar.jpg`).delete();
  } catch (err) {
    // Bỏ qua nếu không có tệp
  }

  // 7. Xóa tài khoản trong Firebase Auth
  await admin.auth().deleteUser(uid);

  return { success: true, message: 'Tài khoản và toàn bộ dữ liệu đã được xóa hoàn tất.' };
}

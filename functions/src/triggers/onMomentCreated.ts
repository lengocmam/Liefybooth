import * as admin from 'firebase-admin';
import { FirestoreEvent, QueryDocumentSnapshot } from 'firebase-functions/v2/firestore';

/**
 * Trigger khi có Moment mới: Bắn thông báo đẩy FCM và Silent Push để cập nhật Widget iOS
 */
export async function onMomentCreatedHandler(
  event: FirestoreEvent<QueryDocumentSnapshot | undefined>
) {
  const snapshot = event.data;
  if (!snapshot) return;

  const moment = snapshot.data();
  const senderId: string = moment.senderId;
  const recipientIds: string[] = moment.recipientIds || [];

  if (recipientIds.length === 0) return;

  const db = admin.firestore();
  const messaging = admin.messaging();

  // Lấy tên người gửi
  const senderDoc = await db.collection('users').doc(senderId).get();
  const senderName = senderDoc.data()?.displayName || 'Một người bạn';

  // Lấy danh sách FCM tokens của người nhận
  const tokens: string[] = [];
  for (const recipientId of recipientIds) {
    const userDoc = await db.collection('users').doc(recipientId).get();
    const userTokens: string[] = userDoc.data()?.fcmTokens || [];
    tokens.push(...userTokens);
  }

  if (tokens.length === 0) return;

  // Gửi thông báo đẩy kèm Silent Push cho iOS Widget
  const message: admin.messaging.MulticastMessage = {
    tokens,
    notification: {
      title: '🌿 Khoảnh khắc mới',
      body: `${senderName} vừa gửi cho bạn một khoảnh khắc mới!`,
    },
    data: {
      momentId: snapshot.id,
      senderId,
      photoUrl: moment.photoUrl,
      type: 'MOMENT_NEW',
    },
    apns: {
      payload: {
        aps: {
          'content-available': 1, // Silent Push đánh thức iOS Widget cập nhật ảnh
          badge: 1,
          sound: 'default',
        },
      },
    },
  };

  try {
    const response = await messaging.sendEachForMulticast(message);
    console.log(`Đã gửi thông báo thành công: ${response.successCount}/${tokens.length}`);
  } catch (error) {
    console.error('Lỗi gửi thông báo FCM:', error);
  }
}

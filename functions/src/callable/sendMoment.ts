import * as admin from 'firebase-admin';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { getFriendshipPairId } from '../utils/types';

interface SendMomentData {
  photoUrl: string;
  thumbUrl?: string;
  caption?: string;
  recipientIds: string[];
}

/**
 * Gửi khoảnh khắc Plant: Kiểm tra tính hợp lệ của người nhận (phải là bạn bè đã kết nối)
 */
export async function sendMomentHandler(request: CallableRequest<SendMomentData>) {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Yêu cầu đăng nhập');
  }

  const senderId = request.auth.uid;
  const { photoUrl, thumbUrl, caption, recipientIds } = request.data;

  if (!photoUrl) {
    throw new HttpsError('invalid-argument', 'Thiếu đường dẫn ảnh');
  }

  if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
    throw new HttpsError('invalid-argument', 'Danh sách người nhận không được để trống');
  }

  // Chú thích tối đa 80 ký tự theo đặc tả M3
  const cleanCaption = (caption || '').trim().slice(0, 80);

  const db = admin.firestore();

  // Xác thực từng người nhận phải là bạn bè đã chấp nhận
  const friendCheckPromises = recipientIds.map(async (recipientUid) => {
    const pairId = getFriendshipPairId(senderId, recipientUid);
    const pairDoc = await db.collection('friendships').doc(pairId).get();
    return pairDoc.exists && pairDoc.data()?.status === 'accepted';
  });

  const checkResults = await Promise.all(friendCheckPromises);
  const validRecipients = recipientIds.filter((_, idx) => checkResults[idx]);

  if (validRecipients.length === 0) {
    throw new HttpsError(
      'failed-precondition',
      'Không có người nhận nào là bạn bè hợp lệ'
    );
  }

  const newMomentRef = db.collection('moments').doc();
  const momentData = {
    senderId,
    type: 'photo',
    photoUrl,
    thumbUrl: thumbUrl || photoUrl,
    caption: cleanCaption,
    recipientIds: validRecipients,
    seenBy: [],
    reactions: {},
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await newMomentRef.set(momentData);

  return {
    success: true,
    momentId: newMomentRef.id,
    sentCount: validRecipients.length,
  };
}

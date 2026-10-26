import * as admin from 'firebase-admin';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { MAX_FRIENDS, getFriendshipPairId } from '../utils/types';

/**
 * Gửi lời mời kết bạn (kiểm tra giới hạn 20 bạn bè và danh sách chặn)
 */
export async function sendFriendRequestHandler(
  request: CallableRequest<{ targetUid?: string; username?: string }>
) {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Yêu cầu đăng nhập');
  }

  const senderUid = request.auth.uid;
  let targetUid = request.data.targetUid;

  const db = admin.firestore();

  // Tìm UID qua username nếu được cung cấp
  if (!targetUid && request.data.username) {
    const cleanUser = request.data.username.trim().toLowerCase().replace('@', '');
    const userDoc = await db.collection('usernames').doc(cleanUser).get();
    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'Không tìm thấy người dùng với username này');
    }
    targetUid = userDoc.data()?.uid;
  }

  if (!targetUid || targetUid === senderUid) {
    throw new HttpsError('invalid-argument', 'Mục tiêu kết bạn không hợp lệ');
  }

  // 1. Kiểm tra giới hạn 20 bạn của người gửi
  const senderFriendships = await db
    .collection('friendships')
    .where('members', 'array-contains', senderUid)
    .where('status', '==', 'accepted')
    .get();

  if (senderFriendships.size >= MAX_FRIENDS) {
    throw new HttpsError(
      'failed-precondition',
      `Bạn đã đạt giới hạn tối đa ${MAX_FRIENDS} bạn bè thân thiết.`
    );
  }

  // 2. Kiểm tra danh sách chặn
  const targetUserDoc = await db.collection('users').doc(targetUid).get();
  const blockedUids: string[] = targetUserDoc.data()?.blockedUids || [];
  if (blockedUids.includes(senderUid)) {
    throw new HttpsError('permission-denied', 'Không thể gửi lời mời kết bạn');
  }

  // 3. Tạo hoặc cập nhật quan hệ kết bạn
  const pairId = getFriendshipPairId(senderUid, targetUid);
  const pairRef = db.collection('friendships').doc(pairId);
  const pairDoc = await pairRef.get();

  if (pairDoc.exists && pairDoc.data()?.status === 'accepted') {
    throw new HttpsError('already-exists', 'Hai bạn đã là bạn bè');
  }

  await pairRef.set({
    members: [senderUid, targetUid].sort(),
    requestedBy: senderUid,
    status: 'pending',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true, message: 'Đã gửi lời mời kết bạn' };
}

/**
 * Chấp nhận hoặc từ chối lời mời kết bạn
 */
export async function respondFriendRequestHandler(
  request: CallableRequest<{ friendshipId: string; accept: boolean }>
) {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Yêu cầu đăng nhập');
  }

  const currentUid = request.auth.uid;
  const { friendshipId, accept } = request.data;
  const db = admin.firestore();

  const pairRef = db.collection('friendships').doc(friendshipId);
  const pairDoc = await pairRef.get();

  if (!pairDoc.exists) {
    throw new HttpsError('not-found', 'Không tìm thấy lời mời');
  }

  const data = pairDoc.data()!;
  if (!data.members.includes(currentUid) || data.requestedBy === currentUid) {
    throw new HttpsError('permission-denied', 'Không có quyền thao tác trên lời mời này');
  }

  if (!accept) {
    await pairRef.delete();
    return { success: true, status: 'declined' };
  }

  // Kiểm tra giới hạn 20 bạn của cả 2 bên trước khi chấp nhận
  const myFriends = await db
    .collection('friendships')
    .where('members', 'array-contains', currentUid)
    .where('status', '==', 'accepted')
    .get();

  if (myFriends.size >= MAX_FRIENDS) {
    throw new HttpsError(
      'failed-precondition',
      `Bạn đã đạt giới hạn tối đa ${MAX_FRIENDS} bạn bè thân thiết.`
    );
  }

  const otherUid = data.members.find((m: string) => m !== currentUid);
  const otherFriends = await db
    .collection('friendships')
    .where('members', 'array-contains', otherUid)
    .where('status', '==', 'accepted')
    .get();

  if (otherFriends.size >= MAX_FRIENDS) {
    throw new HttpsError(
      'failed-precondition',
      'Người gửi đã đạt giới hạn 20 bạn bè'
    );
  }

  await pairRef.update({
    status: 'accepted',
    acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true, status: 'accepted' };
}

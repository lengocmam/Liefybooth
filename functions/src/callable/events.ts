import * as admin from 'firebase-admin';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { generateJoinCode } from '../utils/types';

interface CreateEventData {
  name: string;
  date: string;
  backdropId: string;
  mode: 'album' | 'shared';
  maxMembers?: number;
}

/**
 * Tạo sự kiện Garden và sinh mã mời 6 ký tự duy nhất
 */
export async function createEventHandler(request: CallableRequest<CreateEventData>) {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Yêu cầu đăng nhập');
  }

  const ownerId = request.auth.uid;
  const { name, date, backdropId, mode, maxMembers = 30 } = request.data;

  if (!name || name.trim().length === 0) {
    throw new HttpsError('invalid-argument', 'Tên sự kiện không được để trống');
  }

  const cleanName = name.trim().slice(0, 40);
  const db = admin.firestore();

  const eventRef = db.collection('events').doc();
  let joinCode = generateJoinCode();

  // Đảm bảo mã mời duy nhất
  let codeDoc = await db.collection('joinCodes').doc(joinCode).get();
  while (codeDoc.exists) {
    joinCode = generateJoinCode();
    codeDoc = await db.collection('joinCodes').doc(joinCode).get();
  }

  const batch = db.batch();

  batch.set(eventRef, {
    name: cleanName,
    date: date || 'Hôm nay',
    backdropId: backdropId || 'pink',
    mode,
    ownerId,
    memberIds: [ownerId],
    memberCount: 1,
    maxMembers,
    joinCode,
    status: 'active',
    stripCount: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  batch.set(db.collection('joinCodes').doc(joinCode), {
    eventId: eventRef.id,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await batch.commit();

  return {
    success: true,
    eventId: eventRef.id,
    joinCode,
  };
}

/**
 * Tham gia sự kiện Garden bằng mã mời 6 ký tự
 */
export async function joinEventHandler(request: CallableRequest<{ code: string }>) {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Yêu cầu đăng nhập');
  }

  const uid = request.auth.uid;
  const rawCode = request.data.code?.trim().toUpperCase();

  if (!rawCode || rawCode.length !== 6) {
    throw new HttpsError('invalid-argument', 'Mã mời phải gồm đúng 6 ký tự');
  }

  const db = admin.firestore();
  const codeDoc = await db.collection('joinCodes').doc(rawCode).get();

  if (!codeDoc.exists) {
    throw new HttpsError('not-found', 'Mã mời không chính xác hoặc đã hết hạn');
  }

  const eventId = codeDoc.data()?.eventId;
  const eventRef = db.collection('events').doc(eventId);
  const eventDoc = await eventRef.get();

  if (!eventDoc.exists) {
    throw new HttpsError('not-found', 'Sự kiện không tồn tại');
  }

  const eventData = eventDoc.data()!;

  if (eventData.status !== 'active') {
    throw new HttpsError('failed-precondition', 'Sự kiện này đã kết thúc hoặc lưu trữ');
  }

  const memberIds: string[] = eventData.memberIds || [];
  if (memberIds.includes(uid)) {
    return { success: true, eventId, message: 'Bạn đã là thành viên' };
  }

  if (memberIds.length >= (eventData.maxMembers || 30)) {
    throw new HttpsError('resource-exhausted', 'Sự kiện đã đạt số lượng thành viên tối đa');
  }

  await eventRef.update({
    memberIds: admin.firestore.FieldValue.arrayUnion(uid),
    memberCount: admin.firestore.FieldValue.increment(1),
  });

  return { success: true, eventId, message: 'Đã tham gia sự kiện' };
}

/**
 * Đổi mã mời sự kiện (vô hiệu mã cũ) - Chỉ chủ sự kiện (Owner) được thực hiện
 */
export async function regenerateJoinCodeHandler(request: CallableRequest<{ eventId: string }>) {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Yêu cầu đăng nhập');
  }

  const uid = request.auth.uid;
  const { eventId } = request.data;
  const db = admin.firestore();

  const eventRef = db.collection('events').doc(eventId);
  const eventDoc = await eventRef.get();

  if (!eventDoc.exists) {
    throw new HttpsError('not-found', 'Không tìm thấy sự kiện');
  }

  if (eventDoc.data()?.ownerId !== uid) {
    throw new HttpsError('permission-denied', 'Chỉ chủ phòng mới có quyền đổi mã mời');
  }

  const oldCode = eventDoc.data()?.joinCode;
  const newCode = generateJoinCode();

  const batch = db.batch();

  if (oldCode) {
    batch.delete(db.collection('joinCodes').doc(oldCode));
  }

  batch.set(db.collection('joinCodes').doc(newCode), {
    eventId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  batch.update(eventRef, { joinCode: newCode });

  await batch.commit();

  return { success: true, newCode };
}

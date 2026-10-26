import * as admin from 'firebase-admin';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';

interface PublishFrameData {
  name: string;
  config: {
    backgroundColor: string;
    borderColor?: string;
    stickers: any[];
    customText?: string;
  };
  assetUrls?: string[];
  isPublic: boolean;
}

/**
 * Đăng tải Frame Studio do người dùng tự thiết kế
 */
export async function publishFrameHandler(request: CallableRequest<PublishFrameData>) {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Yêu cầu đăng nhập');
  }

  const ownerId = request.auth.uid;
  const { name, config, assetUrls = [], isPublic } = request.data;

  if (!name || name.trim().length === 0) {
    throw new HttpsError('invalid-argument', 'Tên frame không được để trống');
  }

  const db = admin.firestore();

  // Kiểm tra giới hạn 10 frame cá nhân
  const userFrames = await db.collection('frames').where('ownerId', '==', ownerId).get();
  if (userFrames.size >= 10) {
    throw new HttpsError('resource-exhausted', 'Mỗi người dùng được lưu tối đa 10 frame cá nhân.');
  }

  const frameRef = db.collection('frames').doc();
  await frameRef.set({
    ownerId,
    name: name.trim().slice(0, 40),
    config,
    assetUrls,
    visibility: isPublic ? 'public' : 'private',
    status: 'approved',
    usesCount: 0,
    savesCount: 0,
    reportCount: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true, frameId: frameRef.id };
}

/**
 * Ghi nhận một lượt sử dụng frame (Chống spam bằng ID frameId_uid_YYYYMMDD)
 */
export async function recordFrameUseHandler(request: CallableRequest<{ frameId: string }>) {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Yêu cầu đăng nhập');
  }

  const uid = request.auth.uid;
  const { frameId } = request.data;
  if (!frameId) {
    throw new HttpsError('invalid-argument', 'Thiếu frameId');
  }

  const db = admin.firestore();
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const useKey = `${frameId}_${uid}_${today}`;

  const useRef = db.collection('frameUses').doc(useKey);
  const useDoc = await useRef.get();

  if (useDoc.exists) {
    return { success: true, counted: false, message: 'Đã tính lượt dùng trong ngày hôm nay' };
  }

  const batch = db.batch();
  batch.set(useRef, {
    frameId,
    uid,
    day: today,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  const frameRef = db.collection('frames').doc(frameId);
  batch.update(frameRef, {
    usesCount: admin.firestore.FieldValue.increment(1),
  });

  await batch.commit();

  return { success: true, counted: true };
}

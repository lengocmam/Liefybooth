import * as admin from 'firebase-admin';
import { onCall } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

// Khởi tạo Firebase Admin SDK
admin.initializeApp();

// 1. Friendships (Bạn bè & Giới hạn 20 người)
import {
  sendFriendRequestHandler,
  respondFriendRequestHandler,
} from './callable/friendships';

export const sendFriendRequest = onCall({ region: 'asia-southeast1' }, sendFriendRequestHandler);
export const respondFriendRequest = onCall({ region: 'asia-southeast1' }, respondFriendRequestHandler);

// 2. Moments (Khoảnh khắc 1:1)
import { sendMomentHandler } from './callable/sendMoment';
export const sendMoment = onCall({ region: 'asia-southeast1' }, sendMomentHandler);

// 3. Garden Events (Sự kiện nhóm)
import {
  createEventHandler,
  joinEventHandler,
  regenerateJoinCodeHandler,
} from './callable/events';

export const createEvent = onCall({ region: 'asia-southeast1' }, createEventHandler);
export const joinEvent = onCall({ region: 'asia-southeast1' }, joinEventHandler);
export const regenerateJoinCode = onCall({ region: 'asia-southeast1' }, regenerateJoinCodeHandler);

// 4. Delete Account (Xóa tài khoản - Apple App Store requirement)
import { deleteAccountHandler } from './callable/deleteAccount';
export const deleteAccount = onCall({ region: 'asia-southeast1' }, deleteAccountHandler);

// 5. Frame Studio & Trending (v1.1)
import {
  publishFrameHandler,
  recordFrameUseHandler,
} from './callable/frames';

export const publishFrame = onCall({ region: 'asia-southeast1' }, publishFrameHandler);
export const recordFrameUse = onCall({ region: 'asia-southeast1' }, recordFrameUseHandler);

// 6. Scheduled Cron: Dọn dẹp ảnh quá hạn 90 ngày (Chạy lúc 3:00 sáng hằng ngày)
import { cleanupExpiredMoments } from './scheduled/cleanupMoments';
export const cleanupMoments = onSchedule(
  {
    schedule: '0 3 * * *',
    timeZone: 'Asia/Ho_Chi_Minh',
    region: 'asia-southeast1',
  },
  async () => {
    await cleanupExpiredMoments();
  }
);

// 7. Triggers: Cập nhật Widget iOS qua Silent Push & Xử lý báo cáo an toàn 24h
import { onMomentCreatedHandler } from './triggers/onMomentCreated';
import { onReportCreatedHandler } from './triggers/onReportCreated';

export const onMomentCreated = onDocumentCreated(
  { document: 'moments/{momentId}', region: 'asia-southeast1' },
  onMomentCreatedHandler
);

export const onReportCreated = onDocumentCreated(
  { document: 'reports/{reportId}', region: 'asia-southeast1' },
  onReportCreatedHandler
);

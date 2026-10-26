/**
 * LeafyBooth Data Models
 * Khớp hoàn toàn với mô hình dữ liệu Firestore trong đặc tả mục 9
 */

export interface UserProfile {
  uid: string;
  displayName: string;
  username: string;
  photoUrl?: string;
  createdAt: number;
  locale: string;
  blockedUids: string[];
  fcmTokens: string[];
}

export type FriendshipStatus = 'pending' | 'accepted';

export interface Friendship {
  id: string; // uidA_uidB sắp xếp chữ cái
  members: [string, string];
  status: FriendshipStatus;
  requestedBy: string;
  createdAt: number;
}

export type MomentType = 'photo' | 'strip';

export interface Moment {
  id: string;
  senderId: string;
  type: MomentType;
  photoUrl: string;
  thumbUrl: string;
  caption?: string;
  recipientIds: string[];
  createdAt: number;
  seenBy: string[];
  reactions: Record<string, string>; // uid -> reaction icon
}

export type GardenMode = 'album' | 'shared'; // Chế độ A (Album chung) hoặc Chế độ B (Dải chung)
export type GardenStatus = 'active' | 'archived';

export interface GardenEvent {
  id: string;
  name: string;
  date: string;
  backdropId: string;
  mode: GardenMode;
  ownerId: string;
  memberIds: string[];
  memberCount: number;
  maxMembers: number;
  joinCode: string; // Mã 6 ký tự
  status: GardenStatus;
  allowMemberSheets?: boolean;
  stripCount: number;
  coverThumbUrl?: string;
  createdAt: number;
}

export interface Strip {
  id: string;
  eventId?: string;
  ownerId: string;
  mode: GardenMode;
  photoUrl: string;
  thumbUrl: string;
  backdropId: string;
  createdAt: number;
  hidden?: boolean;
  reportCount?: number;
}

export interface SheetSlot {
  index: number;
  uid?: string;
  photoUrl?: string;
  filledAt?: number;
}

export interface Sheet {
  id: string;
  eventId: string;
  status: 'open' | 'complete';
  createdBy: string;
  createdAt: number;
  slots: [SheetSlot, SheetSlot, SheetSlot, SheetSlot];
  stripUrl?: string;
  thumbUrl?: string;
}

export interface ReportItem {
  id: string;
  reporterId: string;
  targetType: 'moment' | 'strip' | 'user';
  targetPath: string;
  reason: string;
  status: 'open' | 'resolved';
  createdAt: number;
}

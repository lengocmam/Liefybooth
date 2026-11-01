export interface PoseStep {
  step: number;
  title: string;
  emoji: string;
  tip: string;
  silhouette: 'head_tilt' | 'heart_cheeks' | 'wink_peace' | 'cute_chin';
}

export interface PoseCollection {
  id: 'besties' | 'kpop' | 'y2k' | 'solo';
  name: string;
  icon: string;
  badge: string;
  desc: string;
  steps: PoseStep[];
}

export const POSE_COLLECTIONS: PoseCollection[] = [
  {
    id: 'besties',
    name: 'Đôi Bạn Thân',
    icon: '👯',
    badge: 'Hot nhất',
    desc: 'Bộ dáng cho 2 bạn thân cực kỳ ăn ý',
    steps: [
      { step: 1, title: 'Dựa vai mỉm cười', emoji: '😊', tip: 'Hai người nghiêng đầu tựa nhẹ vào nhau', silhouette: 'head_tilt' },
      { step: 2, title: 'Bắn tim má đôi', emoji: '🫶', tip: 'Mỗi người áp 1 nửa trái tim vào má đối phương', silhouette: 'heart_cheeks' },
      { step: 3, title: 'Nháy mắt V-sign', emoji: '✌️', tip: 'Một bạn giơ chữ V, một bạn nháy mắt tinh nghịch', silhouette: 'wink_peace' },
      { step: 4, title: 'Cụng trán vui nhộn', emoji: '🥰', tip: 'Cười tươi hết cỡ nhìn thẳng ống kính', silhouette: 'cute_chin' },
    ],
  },
  {
    id: 'kpop',
    name: 'K-Pop Idol',
    icon: '🫰',
    badge: 'Chuẩn Hàn',
    desc: 'Bộ dáng thần thái chuẩn thần tượng Hongdae',
    steps: [
      { step: 1, title: 'Má bánh bao phúng phính', emoji: '🥟', tip: 'Chống ngón tay đẩy nhẹ má phồng dễ thương', silhouette: 'heart_cheeks' },
      { step: 2, title: 'Khung ảnh bằng tay', emoji: '📸', tip: 'Dùng ngón trỏ và ngón cái tạo khung quanh mắt', silhouette: 'wink_peace' },
      { step: 3, title: 'Bắn tim Hàn Quốc', emoji: '🫰', tip: 'Bắt chéo ngón cái và ngón trỏ tạo tim mini', silhouette: 'head_tilt' },
      { step: 4, title: 'Xòe tay dưới cằm nở hoa', emoji: '🌸', tip: 'Hai bàn tay xòe như cánh hoa đỡ khuôn mặt', silhouette: 'cute_chin' },
    ],
  },
  {
    id: 'y2k',
    name: 'Y2K Cyber',
    icon: '🕶️',
    badge: 'Cực ngầu',
    desc: 'Phong cách nổi loạn Retro 2000s cá tính',
    steps: [
      { step: 1, title: 'Góc nghiêng 45 độ', emoji: '🕶️', tip: 'Hạ nhẹ cằm, ánh mắt sắc sảo nhìn camera', silhouette: 'head_tilt' },
      { step: 2, title: 'Bàn tay che ống kính', emoji: '🖐️', tip: 'Đưa bàn tay gần ống kính tạo chiều sâu', silhouette: 'wink_peace' },
      { step: 3, title: 'Góc máy từ trên cao', emoji: '⚡', tip: 'Mắt ngước lên ống kính thần thái bí ẩn', silhouette: 'head_tilt' },
      { step: 4, title: 'Bắn súng ngón tay', emoji: '🔫', tip: 'Chỉ tay về phía trước và nháy mắt cực ngầu', silhouette: 'wink_peace' },
    ],
  },
  {
    id: 'solo',
    name: 'Cute Selfie',
    icon: '🐱',
    badge: 'Tự sướng',
    desc: 'Tự chụp một mình đáng yêu không góc chết',
    steps: [
      { step: 1, title: 'Nụ cười mắt híp', emoji: '✨', tip: 'Mỉm cười tươi tắn tự nhiên nhất', silhouette: 'head_tilt' },
      { step: 2, title: 'Tai mèo xinh xắn', emoji: '🐱', tip: 'Giơ hai tay lên đỉnh đầu làm tai mèo nhỏ', silhouette: 'cute_chin' },
      { step: 3, title: 'Đỡ cằm suy tư', emoji: '💭', tip: 'Đặt cằm lên lòng bàn tay mơ màng', silhouette: 'heart_cheeks' },
      { step: 4, title: 'Nháy mắt chúc ngủ ngon', emoji: '😉', tip: 'Nháy một bên mắt và chu môi nhẹ', silhouette: 'wink_peace' },
    ],
  },
];

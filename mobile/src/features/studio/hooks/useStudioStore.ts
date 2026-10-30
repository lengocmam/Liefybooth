import { create } from 'zustand';
import { colors } from '../../../core/theme/colors';

export interface CustomSticker {
  id: string;
  emoji: string;
  x: number;
  y: number;
  size?: number;
  rotation?: number;
}

export type FontStyleType =
  | 'modern_bold'
  | 'handwriting'
  | 'typewriter'
  | 'aesthetic_serif'
  | 'bubble_cute'
  | 'neon_cyber';

export interface CustomTextItem {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize?: number;
  rotation?: number;
  color?: string;
  bgColor?: string;
  fontStyleType?: FontStyleType;
}

export type FramePattern = 'solid' | 'dots' | 'stripes' | 'stars';
export type TextPosition = 'top' | 'bottom' | 'middle';
export type TextStyleType = 'badge' | 'minimal' | 'pop';
export type PhotoFilter = 'none' | 'vintage' | 'bw' | 'warm' | 'cool' | 'pastel';
export type FrameLayoutType = 'strip_4' | 'grid_4' | 'strip_3' | 'duo_note' | 'polaroid_1';
export type FrameEdgeStyle =
  | 'classic'
  | 'film_perforated'
  | 'stamp_scallop'
  | 'washi_corners'
  | 'neon_glow'
  | 'ticket_stub'
  | 'vhs_camcorder'
  | 'heart_cutout';
export type SealStampType = 'none' | 'leafy_certified' | 'special_edition' | 'besties' | 'love_wax' | 'vintage_post';
export type WashiTapeStyle = 'none' | 'gingham' | 'vintage_tape' | 'caution' | 'hologram' | 'strawberry';
export type GradientTheme =
  | 'none'
  | 'sunset'
  | 'ocean'
  | 'cyber'
  | 'kraft'
  | 'gingham'
  | 'cherry'
  | 'lavender'
  | 'matcha'
  | 'midnight';

export type TemplateCategory = 'all' | 'life4cuts' | 'vintage' | 'party' | 'y2k' | 'besties';

export interface StudioPresetItem {
  id: string;
  name: string;
  category: 'life4cuts' | 'vintage' | 'party' | 'y2k' | 'besties';
  icon: string;
  badge: string;
  desc: string;
  previewColor: string;
  backgroundColor: string;
  borderColor: string;
  pattern: FramePattern;
  frameLayout: FrameLayoutType;
  frameEdgeStyle: FrameEdgeStyle;
  sealStamp: SealStampType;
  washiTapeStyle?: WashiTapeStyle;
  gradientTheme?: GradientTheme;
  stickers: CustomSticker[];
  textItems: CustomTextItem[];
  customText: string;
  textColor: string;
  locationTag?: string;
  photoFilter?: PhotoFilter;
}

export interface SavedCustomFrame {
  id: string;
  name: string;
  createdAt: number;
  previewColor: string;
  frameLayout: FrameLayoutType;
  backgroundColor: string;
  borderColor: string;
  pattern: FramePattern;
  frameEdgeStyle: FrameEdgeStyle;
  sealStamp: SealStampType;
  washiTapeStyle?: WashiTapeStyle;
  gradientTheme?: GradientTheme;
  stickers: CustomSticker[];
  textItems: CustomTextItem[];
  customText?: string;
  photoFilter?: PhotoFilter;
  stickersCount: number;
}

export const DEFAULT_SLOT_PHOTOS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
];

export interface TrendingFrameItem {
  id: string;
  name: string;
  authorName: string;
  authorLetter: string;
  authorColor: string;
  usesCount: string;
  savesCount: string;
  backgroundColor: string;
  borderColor: string;
  stickers: string[];
  bannerText: string;
  rank: number;
  isHero?: boolean;
}

interface StudioState {
  // Studio form state
  frameName: string;
  backgroundColor: string;
  pattern: FramePattern;
  uploadedImage: string | null;
  imageOpacity: number;
  stickers: CustomSticker[];
  selectedStickerId: string | null;
  textItems: CustomTextItem[];
  selectedTextId: string | null;
  customText: string;
  textPosition: TextPosition;
  textStyleType: TextStyleType;
  textColor: string;
  borderColor: string;
  isPublic: boolean;

  // Instagram Photo & Post features
  slotPhotos: (string | null)[];
  photoFilter: PhotoFilter;
  postCaption: string;
  postHashtags: string[];

  // Distinctive Personalization ("Sự riêng biệt")
  frameLayout: FrameLayoutType;
  frameEdgeStyle: FrameEdgeStyle;
  creatorName: string;
  serialNumber: string;
  showTimestamp: boolean;
  timestampText: string;
  locationTag: string;
  sealStamp: SealStampType;
  washiTapeStyle: WashiTapeStyle;
  gradientTheme: GradientTheme;

  // Actions
  setSlotPhoto: (index: number, uri: string | null) => void;
  setAllSlotPhotos: (photos: (string | null)[]) => void;
  setSlotPhotos: (photos: (string | null)[]) => void;
  setPhotoFilter: (filter: PhotoFilter) => void;
  setPostCaption: (caption: string) => void;
  toggleHashtag: (tag: string) => void;
  setFrameLayout: (layout: FrameLayoutType) => void;
  setFrameEdgeStyle: (style: FrameEdgeStyle) => void;
  setCreatorName: (name: string) => void;
  setSerialNumber: (serial: string) => void;
  setShowTimestamp: (show: boolean) => void;
  setTimestampText: (text: string) => void;
  setLocationTag: (tag: string) => void;
  setSealStamp: (stamp: SealStampType) => void;
  setWashiTapeStyle: (tape: WashiTapeStyle) => void;
  setGradientTheme: (theme: GradientTheme) => void;
  setFrameName: (name: string) => void;
  setBackgroundColor: (color: string) => void;
  setPattern: (pattern: FramePattern) => void;
  setUploadedImage: (uri: string | null) => void;
  setImageOpacity: (opacity: number) => void;
  addSticker: (emoji: string) => void;
  addStickerAt: (emoji: string, x: number, y: number) => void;
  removeSticker: (id: string) => void;
  updateSticker: (id: string, updates: Partial<CustomSticker>) => void;
  setStickerPosition: (id: string, x: number, y: number) => void;
  setSelectedStickerId: (id: string | null) => void;
  moveSelectedSticker: (dx: number, dy: number) => void;
  resizeSelectedSticker: (delta: number) => void;
  setStickerSize: (id: string, size: number) => void;
  rotateSelectedSticker: (delta: number) => void;
  duplicateSelectedSticker: () => void;
  addTextItem: (text: string, color?: string, bgColor?: string, fontStyleType?: FontStyleType, fontSize?: number) => void;
  addTextItemAt: (text: string, x: number, y: number, color?: string, bgColor?: string, fontStyleType?: FontStyleType, fontSize?: number) => void;
  removeTextItem: (id: string) => void;
  updateTextItem: (id: string, updates: Partial<CustomTextItem>) => void;
  setTextItemPosition: (id: string, x: number, y: number) => void;
  setSelectedTextId: (id: string | null) => void;
  moveSelectedTextItem: (dx: number, dy: number) => void;
  resizeSelectedTextItem: (delta: number) => void;
  setTextItemFontSize: (id: string, fontSize: number) => void;
  rotateSelectedTextItem: (delta: number) => void;
  duplicateSelectedTextItem: () => void;
  clearAllCanvasItems: () => void;
  clearAllStickers: () => void;
  applyPreset: (preset: StudioPresetItem) => void;
  createNewBlankFrame: () => void;
  savedCustomFrames: SavedCustomFrame[];
  saveCurrentFrame: () => SavedCustomFrame;
  loadSavedFrame: (frameId: string) => boolean;
  deleteSavedFrame: (frameId: string) => void;
  setCustomText: (text: string) => void;
  setTextPosition: (pos: TextPosition) => void;
  setTextStyleType: (type: TextStyleType) => void;
  setTextColor: (color: string) => void;
  setBorderColor: (color: string) => void;
  setIsPublic: (isPublic: boolean) => void;
  resetStudio: () => void;

  // Trending items
  trendingFrames: TrendingFrameItem[];
}


export const STUDIO_PRESETS: StudioPresetItem[] = [
  // --- 1. LIFE4CUTS HÀN QUỐC ---
  {
    id: 'preset-sakura-dream',
    name: 'Sakura Dream 🌸',
    category: 'life4cuts',
    icon: '🌸',
    badge: 'Life4Cuts',
    desc: 'Hồng phấn hoa đào Life4Cuts Hongdae mơ màng',
    previewColor: '#FF8FC7',
    backgroundColor: '#FF8FC7',
    borderColor: colors.ink,
    pattern: 'dots',
    frameLayout: 'strip_4',
    frameEdgeStyle: 'classic',
    sealStamp: 'leafy_certified',
    stickers: [
      { id: 'stk-s1', emoji: '🌸', x: 14, y: 35, size: 28, rotation: 0 },
      { id: 'stk-s2', emoji: '🐰', x: 126, y: 155, size: 28, rotation: 12 },
      { id: 'stk-s3', emoji: '💖', x: 18, y: 440, size: 26, rotation: -10 },
    ],
    textItems: [
      {
        id: 'txt-s1',
        text: 'Sakura Vibes 🌸',
        x: 18,
        y: 505,
        fontSize: 12,
        rotation: 0,
        color: '#111111',
        bgColor: '#FFFFFF',
      },
    ],
    customText: 'Sakura Vibes 🌸',
    textColor: colors.ink,
    locationTag: '📍 Hongdae, Seoul',
    photoFilter: 'pastel',
  },
  {
    id: 'preset-pink-idol',
    name: 'Pink Idol Star 👑',
    category: 'life4cuts',
    icon: '👑',
    badge: 'K-Pop',
    desc: 'Viền Neon phát sáng & vương miện Idol',
    previewColor: '#FF4F8B',
    backgroundColor: '#FF4F8B',
    borderColor: colors.ink,
    pattern: 'stars',
    frameLayout: 'strip_4',
    frameEdgeStyle: 'neon_glow',
    sealStamp: 'special_edition',
    stickers: [
      { id: 'stk-pi1', emoji: '👑', x: 16, y: 36, size: 28, rotation: -8 },
      { id: 'stk-pi2', emoji: '✨', x: 128, y: 150, size: 28, rotation: 15 },
      { id: 'stk-pi3', emoji: '⭐', x: 18, y: 442, size: 26, rotation: 10 },
    ],
    textItems: [
      {
        id: 'txt-pi1',
        text: 'Shine Like An Idol ✨',
        x: 14,
        y: 505,
        fontSize: 12,
        rotation: 0,
        color: '#111111',
        bgColor: '#FEF08A',
      },
    ],
    customText: 'Shine Like An Idol ✨',
    textColor: colors.ink,
    locationTag: '📍 Gangnam, Seoul',
    photoFilter: 'pastel',
  },
  {
    id: 'preset-cute-ribbon',
    name: 'Cute Ribbon 🎀',
    category: 'life4cuts',
    icon: '🎀',
    badge: 'Lưới 2x2',
    desc: 'Lưới vuông 4 ô dán nơ & dâu tây xinh xắn',
    previewColor: '#FEF08A',
    backgroundColor: '#FEF08A',
    borderColor: colors.ink,
    pattern: 'dots',
    frameLayout: 'grid_4',
    frameEdgeStyle: 'washi_corners',
    sealStamp: 'leafy_certified',
    stickers: [
      { id: 'stk-cr1', emoji: '🎀', x: 14, y: 35, size: 30, rotation: 10 },
      { id: 'stk-cr2', emoji: '🍓', x: 126, y: 140, size: 28, rotation: -12 },
    ],
    textItems: [
      {
        id: 'txt-cr1',
        text: 'Super Cute Besties 🎀',
        x: 14,
        y: 375,
        fontSize: 12,
        rotation: 0,
        color: '#111111',
        bgColor: '#FFFFFF',
      },
    ],
    customText: 'Super Cute Besties 🎀',
    textColor: colors.ink,
    photoFilter: 'pastel',
  },
  {
    id: 'preset-daily-seoul',
    name: 'Daily Seoul 🏙️',
    category: 'life4cuts',
    icon: '🏙️',
    badge: 'Cinematic',
    desc: '3 ô góc rộng điện ảnh tối giản thanh lịch',
    previewColor: '#FFFBEB',
    backgroundColor: '#FFFBEB',
    borderColor: colors.ink,
    pattern: 'solid',
    frameLayout: 'strip_3',
    frameEdgeStyle: 'classic',
    sealStamp: 'none',
    stickers: [
      { id: 'stk-ds1', emoji: '☕', x: 16, y: 35, size: 26, rotation: 0 },
      { id: 'stk-ds2', emoji: '🌿', x: 128, y: 140, size: 26, rotation: 15 },
    ],
    textItems: [
      {
        id: 'txt-ds1',
        text: 'Seoul Daily Moment 🎬',
        x: 12,
        y: 475,
        fontSize: 12,
        rotation: 0,
        color: '#111111',
        bgColor: '#FFFFFF',
      },
    ],
    customText: 'Seoul Daily Moment 🎬',
    textColor: colors.ink,
    locationTag: '📍 Seoul, Korea',
    photoFilter: 'none',
  },

  // --- 2. VINTAGE FILM 90S ---
  {
    id: 'preset-film-35mm',
    name: 'Cuộn Phim 35mm 🎞️',
    category: 'vintage',
    icon: '🎞️',
    badge: 'Film 35mm',
    desc: 'Răng cưa đục lỗ cuộn phim nhựa 90s',
    previewColor: '#374151',
    backgroundColor: '#374151',
    borderColor: colors.white,
    pattern: 'solid',
    frameLayout: 'strip_4',
    frameEdgeStyle: 'film_perforated',
    sealStamp: 'special_edition',
    stickers: [
      { id: 'stk-f1', emoji: '💿', x: 14, y: 35, size: 28, rotation: 0 },
      { id: 'stk-f2', emoji: '✨', x: 128, y: 150, size: 26, rotation: 15 },
    ],
    textItems: [
      {
        id: 'txt-f1',
        text: 'Film Roll No.35 🎞️',
        x: 16,
        y: 505,
        fontSize: 12,
        rotation: 0,
        color: '#111111',
        bgColor: '#FEF08A',
      },
    ],
    customText: 'Film Roll No.35 🎞️',
    textColor: colors.white,
    photoFilter: 'vintage',
  },
  {
    id: 'preset-stamp-90s',
    name: 'Tem Thư 90s 📮',
    category: 'vintage',
    icon: '📮',
    badge: 'Tem Thư',
    desc: 'Viền răng cưa tem bưu ảnh & thiệp ghi nhớ',
    previewColor: '#F4E8C1',
    backgroundColor: '#F4E8C1',
    borderColor: colors.ink,
    pattern: 'solid',
    frameLayout: 'duo_note',
    frameEdgeStyle: 'stamp_scallop',
    sealStamp: 'vintage_post',
    gradientTheme: 'kraft',
    stickers: [
      { id: 'stk-st1', emoji: '🍂', x: 16, y: 35, size: 28, rotation: -12 },
      { id: 'stk-st2', emoji: '📮', x: 128, y: 140, size: 26, rotation: 10 },
    ],
    textItems: [
      {
        id: 'txt-st1',
        text: 'Gửi bạn thân mến ✉️',
        x: 14,
        y: 390,
        fontSize: 12,
        rotation: 0,
        color: '#111111',
        bgColor: '#FFFFFF',
      },
    ],
    customText: 'Gửi bạn thân mến ✉️',
    textColor: colors.ink,
    locationTag: '📍 Bưu điện Hà Nội',
    photoFilter: 'vintage',
  },
  {
    id: 'preset-polaroid-cafe',
    name: 'Polaroid Cafe ☕',
    category: 'vintage',
    icon: '☕',
    badge: 'Polaroid',
    desc: 'Khung đơn Polaroid nâu caramel ấm cúng',
    previewColor: '#D97706',
    backgroundColor: '#D97706',
    borderColor: colors.ink,
    pattern: 'solid',
    frameLayout: 'polaroid_1',
    frameEdgeStyle: 'classic',
    sealStamp: 'none',
    stickers: [
      { id: 'stk-pc1', emoji: '🥐', x: 16, y: 35, size: 28, rotation: 12 },
      { id: 'stk-pc2', emoji: '☕', x: 126, y: 180, size: 28, rotation: -8 },
    ],
    textItems: [
      {
        id: 'txt-pc1',
        text: 'Coffee & Chill ☕',
        x: 18,
        y: 310,
        fontSize: 12,
        rotation: 0,
        color: '#111111',
        bgColor: '#FFFFFF',
      },
    ],
    customText: 'Coffee & Chill ☕',
    textColor: colors.ink,
    photoFilter: 'vintage',
  },

  // --- 3. SINH NHẬT & PARTY ---
  {
    id: 'preset-happy-birthday',
    name: 'Happy Birthday 🎂',
    category: 'party',
    icon: '🎂',
    badge: 'Sinh Nhật',
    desc: 'Vàng chanh rực rỡ bóng bay & bánh kem',
    previewColor: '#FFE600',
    backgroundColor: '#FFE600',
    borderColor: colors.ink,
    pattern: 'stripes',
    frameLayout: 'grid_4',
    frameEdgeStyle: 'classic',
    sealStamp: 'special_edition',
    stickers: [
      { id: 'stk-hb1', emoji: '🎂', x: 16, y: 35, size: 28, rotation: 0 },
      { id: 'stk-hb2', emoji: '🎉', x: 126, y: 140, size: 28, rotation: 15 },
      { id: 'stk-hb3', emoji: '🎈', x: 18, y: 340, size: 28, rotation: -10 },
    ],
    textItems: [
      {
        id: 'txt-hb1',
        text: 'Happy Birthday to You 🎂',
        x: 12,
        y: 375,
        fontSize: 12,
        rotation: 0,
        color: '#111111',
        bgColor: '#FFFFFF',
      },
    ],
    customText: 'Happy Birthday to You 🎂',
    textColor: colors.ink,
    photoFilter: 'warm',
  },
  {
    id: 'preset-confetti-night',
    name: 'Confetti Night 🥂',
    category: 'party',
    icon: '🥂',
    badge: 'Party',
    desc: 'Tím mộng mơ pháo hoa & ly mừng tiệc',
    previewColor: '#C084FC',
    backgroundColor: '#C084FC',
    borderColor: colors.ink,
    pattern: 'stars',
    frameLayout: 'strip_4',
    frameEdgeStyle: 'classic',
    sealStamp: 'special_edition',
    stickers: [
      { id: 'stk-cn1', emoji: '🥂', x: 16, y: 35, size: 28, rotation: -10 },
      { id: 'stk-cn2', emoji: '✨', x: 128, y: 150, size: 28, rotation: 12 },
      { id: 'stk-cn3', emoji: '🎁', x: 18, y: 440, size: 28, rotation: 8 },
    ],
    textItems: [
      {
        id: 'txt-cn1',
        text: 'Cheers to Tonight 🥂',
        x: 16,
        y: 505,
        fontSize: 12,
        rotation: 0,
        color: '#111111',
        bgColor: '#FFFFFF',
      },
    ],
    customText: 'Cheers to Tonight 🥂',
    textColor: colors.ink,
    photoFilter: 'pastel',
  },
  {
    id: 'preset-sweet-candy',
    name: 'Sweet Candy 🍓',
    category: 'party',
    icon: '🍓',
    badge: 'Ngọt Ngào',
    desc: 'Cam tươi ngọt lịm dâu tây & bánh ngọt',
    previewColor: '#FF7A3D',
    backgroundColor: '#FF7A3D',
    borderColor: colors.ink,
    pattern: 'dots',
    frameLayout: 'strip_4',
    frameEdgeStyle: 'classic',
    sealStamp: 'leafy_certified',
    stickers: [
      { id: 'stk-sc1', emoji: '🍓', x: 14, y: 35, size: 28, rotation: -10 },
      { id: 'stk-sc2', emoji: '🍰', x: 128, y: 150, size: 28, rotation: 12 },
      { id: 'stk-sc3', emoji: '🍒', x: 18, y: 440, size: 28, rotation: 0 },
    ],
    textItems: [
      {
        id: 'txt-sc1',
        text: 'Sweet Like Candy 🍓',
        x: 16,
        y: 505,
        fontSize: 12,
        rotation: 0,
        color: '#111111',
        bgColor: '#FEF08A',
      },
    ],
    customText: 'Sweet Like Candy 🍓',
    textColor: colors.ink,
    photoFilter: 'warm',
  },

  // --- 4. Y2K & CYBER STREET ---
  {
    id: 'preset-cyber-2026',
    name: 'Cyber 2026 ⚡',
    category: 'y2k',
    icon: '⚡',
    badge: 'Cyber',
    desc: 'Cobalt phát sáng Neon & sticker tia chớp',
    previewColor: '#3D5AFE',
    backgroundColor: '#3D5AFE',
    borderColor: colors.lime,
    pattern: 'stripes',
    frameLayout: 'strip_4',
    frameEdgeStyle: 'neon_glow',
    sealStamp: 'special_edition',
    gradientTheme: 'cyber',
    stickers: [
      { id: 'stk-cy1', emoji: '⚡', x: 16, y: 35, size: 28, rotation: 12 },
      { id: 'stk-cy2', emoji: '🤖', x: 126, y: 150, size: 28, rotation: -10 },
      { id: 'stk-cy3', emoji: '👾', x: 18, y: 440, size: 28, rotation: 0 },
    ],
    textItems: [
      {
        id: 'txt-cy1',
        text: 'Cyberpunk 2026 ⚡',
        x: 16,
        y: 505,
        fontSize: 12,
        rotation: 0,
        color: '#C8F135',
        bgColor: '#111111',
      },
    ],
    customText: 'Cyberpunk 2026 ⚡',
    textColor: colors.lime,
    photoFilter: 'cool',
  },
  {
    id: 'preset-silver-chrome',
    name: 'Silver Chrome 💿',
    category: 'y2k',
    icon: '💿',
    badge: 'Y2K',
    desc: 'Bạc kim loại đốm lửa & đĩa CD Y2K',
    previewColor: '#CBD5E1',
    backgroundColor: '#CBD5E1',
    borderColor: colors.ink,
    pattern: 'dots',
    frameLayout: 'grid_4',
    frameEdgeStyle: 'classic',
    sealStamp: 'none',
    stickers: [
      { id: 'stk-sv1', emoji: '🔥', x: 14, y: 35, size: 28, rotation: 15 },
      { id: 'stk-sv2', emoji: '💿', x: 126, y: 140, size: 28, rotation: -15 },
    ],
    textItems: [
      {
        id: 'txt-sv1',
        text: 'Y2K Silver Club 💿',
        x: 16,
        y: 375,
        fontSize: 12,
        rotation: 0,
        color: '#111111',
        bgColor: '#FFFFFF',
      },
    ],
    customText: 'Y2K Silver Club 💿',
    textColor: colors.ink,
    photoFilter: 'cool',
  },
  {
    id: 'preset-matrix-lime',
    name: 'Matrix Lime 🌊',
    category: 'y2k',
    icon: '🌊',
    badge: 'Cinematic',
    desc: 'Xanh chanh Lime 3 ô điện ảnh cá tính',
    previewColor: '#C8F135',
    backgroundColor: '#C8F135',
    borderColor: colors.ink,
    pattern: 'solid',
    frameLayout: 'strip_3',
    frameEdgeStyle: 'film_perforated',
    sealStamp: 'leafy_certified',
    stickers: [
      { id: 'stk-ml1', emoji: '💎', x: 14, y: 35, size: 28, rotation: 0 },
      { id: 'stk-ml2', emoji: '👑', x: 128, y: 140, size: 28, rotation: 12 },
    ],
    textItems: [
      {
        id: 'txt-ml1',
        text: 'Matrix Lime Vibe 🌊',
        x: 14,
        y: 475,
        fontSize: 12,
        rotation: 0,
        color: '#111111',
        bgColor: '#FFFFFF',
      },
    ],
    customText: 'Matrix Lime Vibe 🌊',
    textColor: colors.ink,
    photoFilter: 'bw',
  },

  // --- 5. TÌNH BẠN & BESTIES ---
  {
    id: 'preset-forever-besties',
    name: 'Forever Besties ❤️',
    category: 'besties',
    icon: '❤️',
    badge: 'Dấu Sáp',
    desc: 'Thiệp kỷ niệm niêm phong con dấu sáp đỏ',
    previewColor: '#FDA4AF',
    backgroundColor: '#FDA4AF',
    borderColor: colors.ink,
    pattern: 'solid',
    frameLayout: 'duo_note',
    frameEdgeStyle: 'classic',
    sealStamp: 'love_wax',
    stickers: [
      { id: 'stk-fb1', emoji: '💖', x: 14, y: 35, size: 28, rotation: -10 },
      { id: 'stk-fb2', emoji: '🧸', x: 128, y: 140, size: 28, rotation: 12 },
    ],
    textItems: [
      {
        id: 'txt-fb1',
        text: 'Forever Best Friends 💖',
        x: 12,
        y: 390,
        fontSize: 12,
        rotation: 0,
        color: '#111111',
        bgColor: '#FFFFFF',
      },
    ],
    customText: 'Forever Best Friends 💖',
    textColor: colors.ink,
    photoFilter: 'pastel',
  },
  {
    id: 'preset-washi-memory',
    name: 'Washi Memory 🍀',
    category: 'besties',
    icon: '🍀',
    badge: 'Washi',
    desc: 'Băng dính Washi 4 góc xanh bạc hà tươi mát',
    previewColor: '#7EE8B8',
    backgroundColor: '#7EE8B8',
    borderColor: colors.ink,
    pattern: 'dots',
    frameLayout: 'grid_4',
    frameEdgeStyle: 'washi_corners',
    sealStamp: 'besties',
    stickers: [
      { id: 'stk-wm1', emoji: '🍀', x: 14, y: 35, size: 28, rotation: 10 },
      { id: 'stk-wm2', emoji: '🦋', x: 126, y: 140, size: 28, rotation: -12 },
    ],
    textItems: [
      {
        id: 'txt-wm1',
        text: 'Lucky to Have You 🍀',
        x: 16,
        y: 375,
        fontSize: 12,
        rotation: 0,
        color: '#111111',
        bgColor: '#FFFFFF',
      },
    ],
    customText: 'Lucky to Have You 🍀',
    textColor: colors.ink,
    photoFilter: 'none',
  },
  {
    id: 'preset-sunset-date',
    name: 'Sunset Date 🌅',
    category: 'besties',
    icon: '🌅',
    badge: 'Hoàng Hôn',
    desc: 'Gradient hoàng hôn ấm áp & lá thu bay',
    previewColor: '#FB923C',
    backgroundColor: '#FB923C',
    borderColor: colors.ink,
    pattern: 'solid',
    frameLayout: 'strip_4',
    frameEdgeStyle: 'classic',
    sealStamp: 'besties',
    gradientTheme: 'sunset',
    stickers: [
      { id: 'stk-sd1', emoji: '🍂', x: 14, y: 35, size: 28, rotation: -15 },
      { id: 'stk-sd2', emoji: '⭐', x: 128, y: 150, size: 28, rotation: 15 },
      { id: 'stk-sd3', emoji: '🍁', x: 18, y: 440, size: 28, rotation: 0 },
    ],
    textItems: [
      {
        id: 'txt-sd1',
        text: 'Sunset With You 🌅',
        x: 16,
        y: 505,
        fontSize: 12,
        rotation: 0,
        color: '#111111',
        bgColor: '#FEF08A',
      },
    ],
    customText: 'Sunset With You 🌅',
    textColor: colors.ink,
    locationTag: '📍 Hoàn Kiếm, Hà Nội',
    photoFilter: 'warm',
  },

  // --- CÁC MẪU BỔ SUNG MỚI (PHONG PHÚ ĐA DẠNG KIỂU DÁNG) ---
  // 6. THẺ BO GÓC IDOL & PHỐ ĐÊM KPOP
  {
    id: 'preset-kpop-photocard',
    name: 'Idol Photocard 🌸',
    category: 'life4cuts',
    icon: '🌸',
    badge: 'Card Bo Góc',
    desc: 'Viền thẻ idol Kpop bo góc tròn, tone hồng sữa hologram và bướm xinh',
    previewColor: '#FFB6C1',
    backgroundColor: '#FFB6C1',
    borderColor: colors.ink,
    pattern: 'stars',
    frameLayout: 'polaroid_1',
    frameEdgeStyle: 'classic',
    sealStamp: 'leafy_certified',
    gradientTheme: 'cherry',
    stickers: [
      { id: 'stk-kp1', emoji: '🌸', x: 14, y: 30, size: 28, rotation: 10 },
      { id: 'stk-kp2', emoji: '🦋', x: 126, y: 160, size: 26, rotation: -12 },
      { id: 'stk-kp3', emoji: '✨', x: 18, y: 280, size: 24, rotation: 15 },
    ],
    textItems: [
      {
        id: 'txt-kp1',
        text: 'My Lovely Idol 🌸',
        x: 16,
        y: 310,
        fontSize: 12,
        rotation: 0,
        color: '#111111',
        bgColor: '#FFFFFF',
      },
    ],
    customText: 'My Lovely Idol 🌸',
    textColor: colors.ink,
    locationTag: '📍 Hongdae Photocard Cafe',
    photoFilter: 'pastel',
  },
  {
    id: 'preset-hongdae-neon',
    name: 'Hongdae Night 🌆',
    category: 'life4cuts',
    icon: '🌆',
    badge: 'Neon Night',
    desc: 'Phố đêm Hongdae tím neon rực rỡ, dải 4 ô chuẩn Life4Cuts Seoul',
    previewColor: '#8B5CF6',
    backgroundColor: '#8B5CF6',
    borderColor: '#C8F135',
    pattern: 'dots',
    frameLayout: 'strip_4',
    frameEdgeStyle: 'neon_glow',
    sealStamp: 'special_edition',
    stickers: [
      { id: 'stk-hn1', emoji: '🌆', x: 16, y: 35, size: 28, rotation: 0 },
      { id: 'stk-hn2', emoji: '⚡', x: 128, y: 150, size: 28, rotation: 15 },
      { id: 'stk-hn3', emoji: '💫', x: 18, y: 440, size: 26, rotation: -10 },
    ],
    textItems: [
      {
        id: 'txt-hn1',
        text: 'Hongdae 2AM 💫',
        x: 18,
        y: 505,
        fontSize: 12,
        rotation: 0,
        color: '#FFFFFF',
        bgColor: '#111111',
      },
    ],
    customText: 'Hongdae 2AM 💫',
    textColor: colors.white,
    locationTag: '📍 Hongdae Street, Seoul',
    photoFilter: 'cool',
  },

  // 7. VINTAGE RETRO BÁO CŨ, SUPER 8 & ĐÀ LẠT
  {
    id: 'preset-newspaper-vintage',
    name: 'Báo Cũ 1990 📰',
    category: 'vintage',
    icon: '📰',
    badge: 'Retro News',
    desc: 'Tone giấy báo cổ điển kraft 90s, viền tem thư & font chữ hoài niệm',
    previewColor: '#E6D5B8',
    backgroundColor: '#E6D5B8',
    borderColor: colors.ink,
    pattern: 'solid',
    frameLayout: 'grid_4',
    frameEdgeStyle: 'stamp_scallop',
    sealStamp: 'vintage_post',
    gradientTheme: 'kraft',
    stickers: [
      { id: 'stk-np1', emoji: '📰', x: 14, y: 35, size: 28, rotation: -10 },
      { id: 'stk-np2', emoji: '☕', x: 128, y: 140, size: 26, rotation: 12 },
    ],
    textItems: [
      {
        id: 'txt-np1',
        text: 'Daily News 1990 📰',
        x: 16,
        y: 375,
        fontSize: 12,
        rotation: 0,
        color: '#111111',
        bgColor: '#FFFFFF',
      },
    ],
    customText: 'Daily News 1990 📰',
    textColor: colors.ink,
    locationTag: '📍 Phố Cổ Hà Nội',
    photoFilter: 'vintage',
  },
  {
    id: 'preset-super8-grain',
    name: 'Super 8 Cinema 🎬',
    category: 'vintage',
    icon: '🎬',
    badge: 'Super 8',
    desc: 'Khung phim nhựa Super 8 đen trắng hoài cổ, 3 ô điện ảnh góc rộng',
    previewColor: '#1F2937',
    backgroundColor: '#1F2937',
    borderColor: '#9CA3AF',
    pattern: 'solid',
    frameLayout: 'strip_3',
    frameEdgeStyle: 'film_perforated',
    sealStamp: 'special_edition',
    stickers: [
      { id: 'stk-s81', emoji: '🎬', x: 16, y: 35, size: 28, rotation: 0 },
      { id: 'stk-s82', emoji: '🖤', x: 128, y: 140, size: 26, rotation: 10 },
    ],
    textItems: [
      {
        id: 'txt-s81',
        text: 'Super 8 Memories 🎬',
        x: 14,
        y: 475,
        fontSize: 12,
        rotation: 0,
        color: '#111111',
        bgColor: '#FFFFFF',
      },
    ],
    customText: 'Super 8 Memories 🎬',
    textColor: colors.white,
    photoFilter: 'bw',
  },
  {
    id: 'preset-da-lat-autumn',
    name: 'Đà Lạt Sương Mù 🌲',
    category: 'vintage',
    icon: '🌲',
    badge: 'Vintage Mộc',
    desc: 'Tone rừng thông xanh rêu ấm cúng, lá phong thu rơi & thiệp ghi nhớ',
    previewColor: '#2D5A43',
    backgroundColor: '#2D5A43',
    borderColor: colors.ink,
    pattern: 'solid',
    frameLayout: 'duo_note',
    frameEdgeStyle: 'classic',
    sealStamp: 'leafy_certified',
    stickers: [
      { id: 'stk-dl1', emoji: '🌲', x: 16, y: 35, size: 28, rotation: 0 },
      { id: 'stk-dl2', emoji: '🍁', x: 128, y: 140, size: 26, rotation: 15 },
    ],
    textItems: [
      {
        id: 'txt-dl1',
        text: 'Một chiều Đà Lạt 🌲',
        x: 14,
        y: 390,
        fontSize: 12,
        rotation: 0,
        color: '#111111',
        bgColor: '#FEF08A',
      },
    ],
    customText: 'Một chiều Đà Lạt 🌲',
    textColor: colors.white,
    locationTag: '📍 Đà Lạt, Việt Nam',
    photoFilter: 'vintage',
  },

  // 8. DẠ HỘI, GIÁNG SINH & PHÁO HOA PARTY
  {
    id: 'preset-prom-night',
    name: 'Dạ Hội Prom Night 👑',
    category: 'party',
    icon: '👑',
    badge: 'Prom Night',
    desc: 'Khung dạ tiệc đen ánh vàng lộng lẫy, dải 4 ô vương miện và ly mừng',
    previewColor: '#18181B',
    backgroundColor: '#18181B',
    borderColor: '#F59E0B',
    pattern: 'stars',
    frameLayout: 'strip_4',
    frameEdgeStyle: 'classic',
    sealStamp: 'special_edition',
    stickers: [
      { id: 'stk-pn1', emoji: '👑', x: 14, y: 35, size: 28, rotation: -8 },
      { id: 'stk-pn2', emoji: '🥂', x: 128, y: 150, size: 28, rotation: 12 },
      { id: 'stk-pn3', emoji: '✨', x: 18, y: 440, size: 26, rotation: 10 },
    ],
    textItems: [
      {
        id: 'txt-pn1',
        text: 'Golden Prom Night 👑',
        x: 16,
        y: 505,
        fontSize: 12,
        rotation: 0,
        color: '#111111',
        bgColor: '#FBBF24',
      },
    ],
    customText: 'Golden Prom Night 👑',
    textColor: '#FBBF24',
    photoFilter: 'warm',
  },
  {
    id: 'preset-christmas-snow',
    name: 'Giáng Sinh Tuyết Rơi ❄️',
    category: 'party',
    icon: '❄️',
    badge: 'Noel Fest',
    desc: 'Tone đỏ Giáng sinh ấm áp, cây thông Noel & hoa tuyết trắng rơi',
    previewColor: '#DC2626',
    backgroundColor: '#DC2626',
    borderColor: colors.ink,
    pattern: 'stars',
    frameLayout: 'strip_4',
    frameEdgeStyle: 'washi_corners',
    sealStamp: 'special_edition',
    stickers: [
      { id: 'stk-xm1', emoji: '🎄', x: 14, y: 35, size: 28, rotation: 0 },
      { id: 'stk-xm2', emoji: '🎅', x: 128, y: 150, size: 28, rotation: 10 },
      { id: 'stk-xm3', emoji: '❄️', x: 18, y: 440, size: 26, rotation: -12 },
    ],
    textItems: [
      {
        id: 'txt-xm1',
        text: 'Merry Christmas ❄️',
        x: 16,
        y: 505,
        fontSize: 12,
        rotation: 0,
        color: '#111111',
        bgColor: '#FFFFFF',
      },
    ],
    customText: 'Merry Christmas ❄️',
    textColor: colors.white,
    locationTag: '📍 Nhà Thờ Lớn, Hà Nội',
    photoFilter: 'warm',
  },
  {
    id: 'preset-fireworks-fest',
    name: 'Lễ Hội Pháo Hoa 🎆',
    category: 'party',
    icon: '🎆',
    badge: 'Countdown',
    desc: 'Lưới vuông 4 ô rực rỡ pháo hoa đêm giao thừa & hộp quà may mắn',
    previewColor: '#4F46E5',
    backgroundColor: '#4F46E5',
    borderColor: '#FDE047',
    pattern: 'stars',
    frameLayout: 'grid_4',
    frameEdgeStyle: 'neon_glow',
    sealStamp: 'special_edition',
    stickers: [
      { id: 'stk-fw1', emoji: '🎆', x: 14, y: 35, size: 28, rotation: 12 },
      { id: 'stk-fw2', emoji: '🎉', x: 126, y: 140, size: 28, rotation: -10 },
    ],
    textItems: [
      {
        id: 'txt-fw1',
        text: 'Happy New Year 🎆',
        x: 18,
        y: 375,
        fontSize: 12,
        rotation: 0,
        color: '#111111',
        bgColor: '#FDE047',
      },
    ],
    customText: 'Happy New Year 🎆',
    textColor: colors.white,
    photoFilter: 'pastel',
  },

  // 9. HOLOGRAM GLITCH & PIXEL ARCADE Y2K
  {
    id: 'preset-holo-glitch',
    name: 'Hologram Glitch 💿',
    category: 'y2k',
    icon: '💿',
    badge: 'Hologram',
    desc: 'Tone gradient chuyển sắc phản quang cầu vồng, bướm Y2K & đĩa CD',
    previewColor: '#EC4899',
    backgroundColor: '#EC4899',
    borderColor: colors.ink,
    pattern: 'dots',
    frameLayout: 'strip_4',
    frameEdgeStyle: 'classic',
    sealStamp: 'special_edition',
    gradientTheme: 'cyber',
    stickers: [
      { id: 'stk-hg1', emoji: '🦋', x: 14, y: 35, size: 28, rotation: -12 },
      { id: 'stk-hg2', emoji: '💿', x: 128, y: 150, size: 28, rotation: 15 },
      { id: 'stk-hg3', emoji: '✨', x: 18, y: 440, size: 26, rotation: 8 },
    ],
    textItems: [
      {
        id: 'txt-hg1',
        text: 'Y2K Hologram Vibe 💿',
        x: 14,
        y: 505,
        fontSize: 12,
        rotation: 0,
        color: '#111111',
        bgColor: '#FFFFFF',
      },
    ],
    customText: 'Y2K Hologram Vibe 💿',
    textColor: colors.white,
    photoFilter: 'cool',
  },
  {
    id: 'preset-pixel-arcade',
    name: 'Pixel Arcade 8-Bit 👾',
    category: 'y2k',
    icon: '👾',
    badge: 'Arcade',
    desc: 'Máy chơi game thùng retro 8-bit, quái vật pixel và sọc scanline',
    previewColor: '#059669',
    backgroundColor: '#059669',
    borderColor: '#A7F3D0',
    pattern: 'stripes',
    frameLayout: 'grid_4',
    frameEdgeStyle: 'classic',
    sealStamp: 'none',
    stickers: [
      { id: 'stk-pa1', emoji: '👾', x: 14, y: 35, size: 28, rotation: 0 },
      { id: 'stk-pa2', emoji: '🕹️', x: 126, y: 140, size: 28, rotation: 10 },
    ],
    textItems: [
      {
        id: 'txt-pa1',
        text: 'Level 99 Player 👾',
        x: 18,
        y: 375,
        fontSize: 12,
        rotation: 0,
        color: '#059669',
        bgColor: '#FFFFFF',
      },
    ],
    customText: 'Level 99 Player 👾',
    textColor: '#A7F3D0',
    photoFilter: 'cool',
  },

  // 10. COUPLE TÌNH YÊU & HARAJUKU CUTE POP
  {
    id: 'preset-couple-heart',
    name: 'Couple Sweetheart 💖',
    category: 'besties',
    icon: '💖',
    badge: 'Sweetheart',
    desc: 'Hồng đào lãng mạn đính nơ đôi, con dấu sáp đỏ tình yêu ngọt ngào',
    previewColor: '#F472B6',
    backgroundColor: '#F472B6',
    borderColor: colors.ink,
    pattern: 'dots',
    frameLayout: 'duo_note',
    frameEdgeStyle: 'classic',
    sealStamp: 'love_wax',
    stickers: [
      { id: 'stk-ch1', emoji: '🎀', x: 14, y: 35, size: 28, rotation: 10 },
      { id: 'stk-ch2', emoji: '💖', x: 128, y: 140, size: 28, rotation: -10 },
    ],
    textItems: [
      {
        id: 'txt-ch1',
        text: 'Always With You 💖',
        x: 16,
        y: 390,
        fontSize: 12,
        rotation: 0,
        color: '#111111',
        bgColor: '#FFFFFF',
      },
    ],
    customText: 'Always With You 💖',
    textColor: colors.ink,
    locationTag: '📍 Hồ Tây, Hà Nội',
    photoFilter: 'pastel',
  },
  {
    id: 'preset-harajuku-pop',
    name: 'Harajuku Cute Pop 🍭',
    category: 'besties',
    icon: '🍭',
    badge: 'Harajuku',
    desc: 'Phong cách Tokyo kẹo ngọt, sticker mèo chibi, kem dâu & cầu vồng',
    previewColor: '#FDE047',
    backgroundColor: '#FDE047',
    borderColor: colors.ink,
    pattern: 'dots',
    frameLayout: 'strip_4',
    frameEdgeStyle: 'washi_corners',
    sealStamp: 'leafy_certified',
    stickers: [
      { id: 'stk-hp1', emoji: '🐱', x: 14, y: 35, size: 28, rotation: -10 },
      { id: 'stk-hp2', emoji: '🌈', x: 128, y: 150, size: 28, rotation: 12 },
      { id: 'stk-hp3', emoji: '🍭', x: 18, y: 440, size: 28, rotation: 0 },
    ],
    textItems: [
      {
        id: 'txt-hp1',
        text: 'Harajuku Cute Pop 🍭',
        x: 14,
        y: 505,
        fontSize: 12,
        rotation: 0,
        color: '#111111',
        bgColor: '#FFFFFF',
      },
    ],
    customText: 'Harajuku Cute Pop 🍭',
    textColor: colors.ink,
    locationTag: '📍 Takeshita, Tokyo',
    photoFilter: 'pastel',
  },
  {
    id: 'preset-manga-comic',
    name: 'Manga Comic 💥',
    category: 'life4cuts',
    icon: '💥',
    badge: 'Manga B&W',
    desc: 'Truyện tranh Nhật Bản nét tốc độ, hiệu ứng bùng nổ Kpop',
    previewColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
    borderColor: colors.ink,
    pattern: 'stripes',
    frameLayout: 'strip_4',
    frameEdgeStyle: 'classic',
    sealStamp: 'special_edition',
    stickers: [
      { id: 'stk-mc1', emoji: '⚡', x: 12, y: 35, size: 28, rotation: 10 },
      { id: 'stk-mc2', emoji: '💥', x: 130, y: 145, size: 30, rotation: -12 },
      { id: 'stk-mc3', emoji: '🗯️', x: 16, y: 440, size: 28, rotation: 5 },
    ],
    textItems: [
      {
        id: 'txt-mc1',
        text: 'SUGOI EPISODE 01 💥',
        x: 12,
        y: 505,
        fontSize: 12,
        rotation: 0,
        color: '#111111',
        bgColor: '#FEF08A',
      },
    ],
    customText: 'SUGOI EPISODE 01 💥',
    textColor: colors.ink,
    locationTag: '📍 Akihabara, Tokyo',
    photoFilter: 'bw',
  },
  {
    id: 'preset-noir-classic',
    name: 'Film Noir 1950 🖤',
    category: 'vintage',
    icon: '🎬',
    badge: 'Hollywood Noir',
    desc: 'Điện ảnh đen trắng Hollywood cổ điển, tông tro nghệ thuật sâu lắng',
    previewColor: '#18181B',
    backgroundColor: '#18181B',
    borderColor: colors.white,
    pattern: 'solid',
    frameLayout: 'strip_3',
    frameEdgeStyle: 'film_perforated',
    sealStamp: 'vintage_post',
    stickers: [
      { id: 'stk-fn1', emoji: '🎬', x: 16, y: 35, size: 26, rotation: 0 },
      { id: 'stk-fn2', emoji: '🥀', x: 128, y: 150, size: 28, rotation: 15 },
    ],
    textItems: [
      {
        id: 'txt-fn1',
        text: 'CINEMA NOIR · ACT 1 🎬',
        x: 12,
        y: 475,
        fontSize: 12,
        rotation: 0,
        color: '#FFFFFF',
        bgColor: '#27272A',
      },
    ],
    customText: 'CINEMA NOIR · ACT 1 🎬',
    textColor: colors.white,
    locationTag: '📍 Hollywood, 1950',
    photoFilter: 'bw',
  },
  {
    id: 'preset-matrix-code',
    name: 'Matrix Terminal 💻',
    category: 'y2k',
    icon: '💚',
    badge: 'Cyberpunk',
    desc: 'Mã nhị phân xanh neon trên nền đen terminal Hacker 2000s',
    previewColor: '#0D1117',
    backgroundColor: '#0D1117',
    borderColor: colors.lime,
    pattern: 'dots',
    frameLayout: 'grid_4',
    frameEdgeStyle: 'neon_glow',
    sealStamp: 'special_edition',
    gradientTheme: 'cyber',
    stickers: [
      { id: 'stk-mx1', emoji: '👾', x: 14, y: 35, size: 26, rotation: 0 },
      { id: 'stk-mx2', emoji: '⚡', x: 128, y: 140, size: 26, rotation: 15 },
      { id: 'stk-mx3', emoji: '💾', x: 16, y: 330, size: 26, rotation: -8 },
    ],
    textItems: [
      {
        id: 'txt-mx1',
        text: 'SYSTEM_OVERRIDE_OK 💻',
        x: 14,
        y: 375,
        fontSize: 11,
        rotation: 0,
        color: '#000000',
        bgColor: '#C8F135',
      },
    ],
    customText: 'SYSTEM_OVERRIDE_OK 💻',
    textColor: colors.lime,
    locationTag: '📍 Cyber Terminal 2026',
    photoFilter: 'none',
  },
  {
    id: 'preset-dreamy-cloud',
    name: 'Dreamy Cloud ☁️',
    category: 'besties',
    icon: '☁️',
    badge: 'Soft Cloud',
    desc: 'Bầu trời mây bồng bềnh pastel, thiệp ghi nhớ kỷ niệm 2 ô dịu êm',
    previewColor: '#E0F2FE',
    backgroundColor: '#E0F2FE',
    borderColor: colors.ink,
    pattern: 'solid',
    frameLayout: 'duo_note',
    frameEdgeStyle: 'stamp_scallop',
    sealStamp: 'besties',
    gradientTheme: 'lavender',
    stickers: [
      { id: 'stk-dc1', emoji: '☁️', x: 14, y: 35, size: 28, rotation: 0 },
      { id: 'stk-dc2', emoji: '🌙', x: 128, y: 140, size: 26, rotation: 15 },
      { id: 'stk-dc3', emoji: '✨', x: 18, y: 330, size: 24, rotation: -10 },
    ],
    textItems: [
      {
        id: 'txt-dc1',
        text: 'Ngắm mây cùng bạn ☁️',
        x: 14,
        y: 390,
        fontSize: 12,
        rotation: 0,
        color: '#111111',
        bgColor: '#FFFFFF',
      },
    ],
    customText: 'Ngắm mây cùng bạn ☁️',
    textColor: colors.ink,
    locationTag: '📍 Đà Lạt Skyline',
    photoFilter: 'pastel',
  },
  // --- 7. BỘ KHUNG ĐỘC LẠ MỚI (QUIRKY & UNIQUE FRAMES) ---
  {
    id: 'preset-cinema-ticket',
    name: 'Vé Xem Phim Cổ Điển 🎟️',
    category: 'vintage',
    icon: '🎟️',
    badge: 'Độc lạ',
    desc: 'Khung vé xem phim khía cạnh đục lỗ vintage cinema',
    previewColor: '#FFE600',
    backgroundColor: '#FFF4D6',
    borderColor: colors.ink,
    pattern: 'stripes',
    frameLayout: 'strip_4',
    frameEdgeStyle: 'ticket_stub',
    sealStamp: 'special_edition',
    washiTapeStyle: 'vintage_tape',
    gradientTheme: 'kraft',
    stickers: [
      { id: 'stk-ct1', emoji: '🎟️', x: 12, y: 35, size: 28, rotation: -12 },
      { id: 'stk-ct2', emoji: '🎬', x: 130, y: 150, size: 26, rotation: 8 },
      { id: 'stk-ct3', emoji: '🍿', x: 14, y: 380, size: 26, rotation: 5 },
    ],
    textItems: [
      {
        id: 'txt-ct1',
        text: 'ADMIT ONE ★ VIP',
        x: 15,
        y: 470,
        fontSize: 14,
        rotation: 0,
        color: '#111111',
        bgColor: '#FFE600',
        fontStyleType: 'typewriter',
      },
    ],
    customText: 'ADMIT ONE ★ VIP',
    textColor: colors.ink,
    locationTag: '📍 Cinema Paradiso',
    photoFilter: 'vintage',
  },
  {
    id: 'preset-vhs-1998',
    name: 'Máy Quay VHS 1998 📼',
    category: 'vintage',
    icon: '📼',
    badge: 'Retro REC',
    desc: 'Ống ngắm camcorder REC đỏ, timecode hoài niệm 90s',
    previewColor: '#1A1D20',
    backgroundColor: '#181A1B',
    borderColor: '#333333',
    pattern: 'solid',
    frameLayout: 'strip_4',
    frameEdgeStyle: 'vhs_camcorder',
    sealStamp: 'none',
    stickers: [
      { id: 'stk-vhs1', emoji: '🔴', x: 12, y: 32, size: 18, rotation: 0 },
      { id: 'stk-vhs2', emoji: '📼', x: 128, y: 145, size: 26, rotation: -8 },
      { id: 'stk-vhs3', emoji: '⚡', x: 16, y: 340, size: 24, rotation: 10 },
    ],
    textItems: [
      {
        id: 'txt-vhs1',
        text: 'REC [00:19:98] SP',
        x: 12,
        y: 470,
        fontSize: 12,
        rotation: 0,
        color: '#00FF66',
        bgColor: '#000000',
        fontStyleType: 'neon_cyber',
      },
    ],
    customText: 'REC [00:19:98] SP',
    textColor: '#00FF66',
    locationTag: '📍 VHS Studio Cam',
    photoFilter: 'vintage',
  },
  {
    id: 'preset-strawberry-cake',
    name: 'Bánh Kem Dâu Sweet 🍰',
    category: 'besties',
    icon: '🍰',
    badge: 'Cute Edge',
    desc: 'Viền lượn sóng viền kem dâu ngọt ngào đáng yêu',
    previewColor: '#FFD6E8',
    backgroundColor: '#FFEBF3',
    borderColor: '#FF4D8D',
    pattern: 'dots',
    frameLayout: 'strip_4',
    frameEdgeStyle: 'heart_cutout',
    sealStamp: 'besties',
    washiTapeStyle: 'strawberry',
    gradientTheme: 'cherry',
    stickers: [
      { id: 'stk-sc1', emoji: '🍓', x: 14, y: 32, size: 26, rotation: -6 },
      { id: 'stk-sc2', emoji: '🍰', x: 126, y: 155, size: 28, rotation: 10 },
      { id: 'stk-sc3', emoji: '🎀', x: 14, y: 350, size: 26, rotation: -8 },
    ],
    textItems: [
      {
        id: 'txt-sc1',
        text: 'Sweet Love 🍓',
        x: 20,
        y: 470,
        fontSize: 15,
        rotation: 0,
        color: '#FF2E79',
        bgColor: '#FFFFFF',
        fontStyleType: 'bubble_cute',
      },
    ],
    customText: 'Sweet Love 🍓',
    textColor: '#FF2E79',
    locationTag: '📍 Sweet Berry Bakery',
    photoFilter: 'pastel',
  },
  {
    id: 'preset-y2k-cyberpunk',
    name: 'Cyberpunk Matrix 2000 👾',
    category: 'y2k',
    icon: '👾',
    badge: 'Y2K Cyber',
    desc: 'Đèn neon số ma trận tương lai Y2K vũ trụ ảo',
    previewColor: '#0F172A',
    backgroundColor: '#0F172A',
    borderColor: '#00E5FF',
    pattern: 'stripes',
    frameLayout: 'strip_4',
    frameEdgeStyle: 'neon_glow',
    sealStamp: 'leafy_certified',
    washiTapeStyle: 'hologram',
    gradientTheme: 'cyber',
    stickers: [
      { id: 'stk-y2k1', emoji: '👾', x: 14, y: 35, size: 28, rotation: 0 },
      { id: 'stk-y2k2', emoji: '💿', x: 128, y: 148, size: 26, rotation: 18 },
      { id: 'stk-y2k3', emoji: '🛸', x: 15, y: 360, size: 26, rotation: -12 },
    ],
    textItems: [
      {
        id: 'txt-y2k1',
        text: 'CYBER MATRIX 2000',
        x: 10,
        y: 470,
        fontSize: 12,
        rotation: 0,
        color: '#00FFFF',
        bgColor: '#020617',
        fontStyleType: 'neon_cyber',
      },
    ],
    customText: 'CYBER MATRIX 2000',
    textColor: '#00FFFF',
    locationTag: '📍 Neo Tokyo Metaverse',
    photoFilter: 'cool',
  },
  {
    id: 'preset-bullet-journal',
    name: 'Nhật Ký Bullet Journal 📔',
    category: 'life4cuts',
    icon: '📔',
    badge: 'Sổ tay',
    desc: 'Khung dạng sổ tay kẹp ghim giấy ghi nhớ viết tay',
    previewColor: '#F5E6C8',
    backgroundColor: '#FDFBF7',
    borderColor: colors.ink,
    pattern: 'dots',
    frameLayout: 'duo_note',
    frameEdgeStyle: 'washi_corners',
    sealStamp: 'vintage_post',
    washiTapeStyle: 'gingham',
    gradientTheme: 'kraft',
    stickers: [
      { id: 'stk-bj1', emoji: '📎', x: 14, y: 30, size: 26, rotation: -15 },
      { id: 'stk-bj2', emoji: '🌿', x: 125, y: 140, size: 24, rotation: 12 },
      { id: 'stk-bj3', emoji: '☕', x: 18, y: 320, size: 24, rotation: 0 },
    ],
    textItems: [
      {
        id: 'txt-bj1',
        text: 'Dear Diary, peaceful day 🌿',
        x: 12,
        y: 440,
        fontSize: 14,
        rotation: 0,
        color: '#2A2016',
        bgColor: '#FFFBEA',
        fontStyleType: 'handwriting',
      },
    ],
    customText: 'Dear Diary, peaceful day 🌿',
    textColor: '#2A2016',
    locationTag: '📍 Góc Cafe Nhỏ',
    photoFilter: 'warm',
  },
  {
    id: 'preset-tokyo-manga-pop',
    name: 'Truyện Tranh Manga 🗯️',
    category: 'party',
    icon: '🗯️',
    badge: 'Manga Pop',
    desc: 'Khung ô truyện tranh bóng thoại đậm chất manga Nhật',
    previewColor: '#FFFBE6',
    backgroundColor: '#FFFFFF',
    borderColor: '#000000',
    pattern: 'dots',
    frameLayout: 'grid_4',
    frameEdgeStyle: 'classic',
    sealStamp: 'special_edition',
    stickers: [
      { id: 'stk-mg1', emoji: '🗯️', x: 12, y: 30, size: 30, rotation: -10 },
      { id: 'stk-mg2', emoji: '💥', x: 126, y: 150, size: 28, rotation: 15 },
      { id: 'stk-mg3', emoji: '💫', x: 15, y: 350, size: 26, rotation: 0 },
    ],
    textItems: [
      {
        id: 'txt-mg1',
        text: 'CHAPTER 01: TOKYO',
        x: 12,
        y: 460,
        fontSize: 15,
        rotation: 0,
        color: '#000000',
        bgColor: '#FFFF00',
        fontStyleType: 'modern_bold',
      },
    ],
    customText: 'CHAPTER 01: TOKYO',
    textColor: '#000000',
    locationTag: '📍 Akihabara Comics',
    photoFilter: 'bw',
  },
  {
    id: 'preset-retro-polaroid-love',
    name: 'Thư Tình Polaroid 💌',
    category: 'vintage',
    icon: '💌',
    badge: 'Thư tay',
    desc: 'Viền tem thư răng cưa cổ điển gắn mộc sáp đỏ',
    previewColor: '#FFF5EB',
    backgroundColor: '#FFF8F2',
    borderColor: '#6B4226',
    pattern: 'solid',
    frameLayout: 'polaroid_1',
    frameEdgeStyle: 'stamp_scallop',
    sealStamp: 'love_wax',
    washiTapeStyle: 'vintage_tape',
    stickers: [
      { id: 'stk-pl1', emoji: '💌', x: 14, y: 28, size: 28, rotation: -8 },
      { id: 'stk-pl2', emoji: '🌹', x: 124, y: 160, size: 26, rotation: 14 },
      { id: 'stk-pl3', emoji: '🕊️', x: 15, y: 360, size: 26, rotation: 0 },
    ],
    textItems: [
      {
        id: 'txt-pl1',
        text: 'Always & Forever With You',
        x: 12,
        y: 470,
        fontSize: 14,
        rotation: 0,
        color: '#4A2810',
        bgColor: '#FFFFFF',
        fontStyleType: 'aesthetic_serif',
      },
    ],
    customText: 'Always & Forever With You',
    textColor: '#4A2810',
    locationTag: '📍 Paris Mon Amour',
    photoFilter: 'vintage',
  },
  {
    id: 'preset-midnight-vip',
    name: 'Midnight Club VIP 🍸',
    category: 'party',
    icon: '🍸',
    badge: 'Party VIP',
    desc: 'Đêm tiệc ánh đèn huyền ảo vé vào cửa VIP party',
    previewColor: '#1E1B4B',
    backgroundColor: '#1E1B4B',
    borderColor: '#C084FC',
    pattern: 'stars',
    frameLayout: 'strip_3',
    frameEdgeStyle: 'ticket_stub',
    sealStamp: 'special_edition',
    gradientTheme: 'midnight',
    stickers: [
      { id: 'stk-mv1', emoji: '🍸', x: 14, y: 32, size: 28, rotation: 10 },
      { id: 'stk-mv2', emoji: '🪩', x: 128, y: 150, size: 28, rotation: 0 },
      { id: 'stk-mv3', emoji: '✨', x: 16, y: 330, size: 24, rotation: -12 },
    ],
    textItems: [
      {
        id: 'txt-mv1',
        text: 'ALL NIGHT PARTY ★ VIP',
        x: 10,
        y: 460,
        fontSize: 13,
        rotation: 0,
        color: '#E9D5FF',
        bgColor: '#312E81',
        fontStyleType: 'neon_cyber',
      },
    ],
    customText: 'ALL NIGHT PARTY ★ VIP',
    textColor: '#E9D5FF',
    locationTag: '📍 Skybar Rooftop',
    photoFilter: 'cool',
  },
];

const INITIAL_TRENDING: TrendingFrameItem[] = [
  {
    id: 'trend-1',
    name: 'Mùa lá rơi',
    authorName: 'Mai',
    authorLetter: 'M',
    authorColor: colors.pink,
    usesCount: '2,4k',
    savesCount: '860',
    backgroundColor: '#FF8FC7',
    borderColor: colors.ink,
    stickers: ['🍂', '🍁', '✨'],
    bannerText: 'Autumn Memories 🍂',
    rank: 1,
    isHero: true,
  },
  {
    id: 'trend-2',
    name: 'Rừng sương',
    authorName: 'Chi',
    authorLetter: 'C',
    authorColor: colors.sky,
    usesCount: '1,9k',
    savesCount: '520',
    backgroundColor: '#6EC6FF',
    borderColor: colors.ink,
    stickers: ['🌲', '❄️'],
    bannerText: 'Misty Woods 🌲',
    rank: 2,
  },
  {
    id: 'trend-3',
    name: 'Cuối tuần',
    authorName: 'An',
    authorLetter: 'A',
    authorColor: colors.yellow,
    usesCount: '1,3k',
    savesCount: '410',
    backgroundColor: '#FFD93D',
    borderColor: colors.ink,
    stickers: ['☕', '🥐'],
    bannerText: 'Weekend Chill ☕',
    rank: 3,
  },
  {
    id: 'trend-4',
    name: 'Tốt nghiệp vui',
    authorName: 'Bình',
    authorLetter: 'B',
    authorColor: colors.mint,
    usesCount: '980',
    savesCount: '320',
    backgroundColor: '#7EE8B8',
    borderColor: colors.ink,
    stickers: ['🎓', '⭐'],
    bannerText: 'Graduation Day 🎓',
    rank: 4,
  },
  {
    id: 'trend-5',
    name: 'Halloween Party',
    authorName: 'Dũng',
    authorLetter: 'D',
    authorColor: colors.orange,
    usesCount: '850',
    savesCount: '260',
    backgroundColor: '#FF7A3D',
    borderColor: colors.ink,
    stickers: ['🎃', '👻', '🕸️'],
    bannerText: 'Spooky Night 🎃',
    rank: 5,
  },
  {
    id: 'trend-6',
    name: 'Neon Cyber',
    authorName: 'Linh',
    authorLetter: 'L',
    authorColor: colors.cobalt,
    usesCount: '620',
    savesCount: '190',
    backgroundColor: '#3D5AFE',
    borderColor: colors.lime,
    stickers: ['⚡', '🤖', '👾'],
    bannerText: 'Cyberpunk 2026 ⚡',
    rank: 6,
  },
];

let _uniqueStudioCounter = 0;
export const generateStickerId = () =>
  `stk_${Date.now()}_${++_uniqueStudioCounter}_${Math.random().toString(36).substring(2, 7)}`;
export const generateTextId = () =>
  `txt_${Date.now()}_${++_uniqueStudioCounter}_${Math.random().toString(36).substring(2, 7)}`;

export const useStudioStore = create<StudioState>((set, get) => ({
  frameName: 'Khung của tôi',
  backgroundColor: colors.pink,
  pattern: 'solid',
  uploadedImage: null,
  imageOpacity: 1,
  stickers: [],
  selectedStickerId: null,
  textItems: [],
  selectedTextId: null,
  customText: '',
  textPosition: 'bottom',
  textStyleType: 'badge',
  textColor: colors.ink,
  borderColor: colors.ink,
  isPublic: true,
  slotPhotos: [...DEFAULT_SLOT_PHOTOS],
  photoFilter: 'none',
  postCaption: 'Dải ảnh xinh từ Leafy Studio 🌿✨',
  postHashtags: ['#leafybooth', '#photobooth', '#cute'],
  frameLayout: 'strip_4',
  frameEdgeStyle: 'classic',
  creatorName: '',
  serialNumber: '#LB-101',
  showTimestamp: false,
  timestampText: '',
  locationTag: '',
  sealStamp: 'none',
  washiTapeStyle: 'none',
  gradientTheme: 'none',

  setFrameName: (name) => set({ frameName: name }),
  setBackgroundColor: (color) => set({ backgroundColor: color }),
  setPattern: (pattern) => set({ pattern }),
  setUploadedImage: (uri) => set({ uploadedImage: uri }),
  setImageOpacity: (opacity) => set({ imageOpacity: opacity }),

  addSticker: (emoji) => {
    if (get().stickers.length >= 24) return;
    const newId = generateStickerId();
    const count = get().stickers.length;
    const nextStickers = [
      ...get().stickers,
      {
        id: newId,
        emoji,
        x: 18 + ((count * 26) % 120),
        y: 40 + ((count * 48) % 360),
        size: 32,
        rotation: 0,
      },
    ];
    set({ stickers: nextStickers, selectedStickerId: newId, selectedTextId: null });
  },

  addStickerAt: (emoji, x, y) => {
    if (get().stickers.length >= 24) return;
    const newId = generateStickerId();
    const clampedX = Math.max(-15, Math.min(x - 16, 175));
    const clampedY = Math.max(0, Math.min(y - 16, 500));
    set((state) => ({
      stickers: [
        ...state.stickers,
        {
          id: newId,
          emoji,
          x: clampedX,
          y: clampedY,
          size: 32,
          rotation: 0,
        },
      ],
      selectedStickerId: newId,
      selectedTextId: null,
    }));
  },

  removeSticker: (id) =>
    set((state) => ({
      stickers: state.stickers.filter((s) => s.id !== id),
      selectedStickerId: state.selectedStickerId === id ? null : state.selectedStickerId,
    })),

  updateSticker: (id, updates) =>
    set((state) => ({
      stickers: state.stickers.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    })),

  setStickerPosition: (id, x, y) =>
    set((state) => ({
      stickers: state.stickers.map((s) => (s.id === id ? { ...s, x, y } : s)),
    })),

  setSelectedStickerId: (id) =>
    set({
      selectedStickerId: id,
      selectedTextId: id ? null : get().selectedTextId,
    }),

  moveSelectedSticker: (dx, dy) => {
    const id = get().selectedStickerId;
    if (!id) return;
    set((state) => ({
      stickers: state.stickers.map((s) => {
        if (s.id !== id) return s;
        return {
          ...s,
          x: Math.max(-15, Math.min(s.x + dx, 175)),
          y: Math.max(0, Math.min(s.y + dy, 670)),
        };
      }),
    }));
  },

  resizeSelectedSticker: (delta) => {
    const id = get().selectedStickerId;
    if (!id) return;
    set((state) => ({
      stickers: state.stickers.map((s) => {
        if (s.id !== id) return s;
        const currentSize = s.size || 28;
        let nextSize = currentSize + delta;
        if (delta > 0 && nextSize > 56) nextSize = 20;
        else if (delta < 0 && nextSize < 16) nextSize = 16;
        return { ...s, size: nextSize };
      }),
    }));
  },

  setStickerSize: (id, size) => {
    set((state) => ({
      stickers: state.stickers.map((s) =>
        s.id === id ? { ...s, size: Math.max(16, Math.min(Math.round(size), 60)) } : s
      ),
    }));
  },

  rotateSelectedSticker: (delta) => {
    const id = get().selectedStickerId;
    if (!id) return;
    set((state) => ({
      stickers: state.stickers.map((s) => {
        if (s.id !== id) return s;
        const newRot = ((s.rotation || 0) + delta) % 360;
        return { ...s, rotation: newRot };
      }),
    }));
  },

  duplicateSelectedSticker: () => {
    const id = get().selectedStickerId;
    if (!id) return;
    const item = get().stickers.find((s) => s.id === id);
    if (!item) return;
    if (get().stickers.length >= 24) return;
    const newId = generateStickerId();
    const newSticker: CustomSticker = {
      ...item,
      id: newId,
      x: Math.min(item.x + 18, 175),
      y: Math.min(item.y + 18, 670),
    };
    set((state) => ({
      stickers: [...state.stickers, newSticker],
      selectedStickerId: newId,
      selectedTextId: null,
    }));
  },

  addTextItem: (text, color = colors.ink, bgColor = '#FFFFFF', fontStyleType = 'modern_bold', fontSize = 14) => {
    if (!text.trim()) return;
    if (get().textItems.length >= 12) return;
    const newId = generateTextId();
    const count = get().textItems.length;
    const nextTexts = [
      ...get().textItems,
      {
        id: newId,
        text: text.trim(),
        x: 15 + ((count * 15) % 60),
        y: 60 + ((count * 90) % 520),
        fontSize,
        rotation: 0,
        color,
        bgColor,
        fontStyleType,
      },
    ];
    set({ textItems: nextTexts, selectedTextId: newId, selectedStickerId: null });
  },

  addTextItemAt: (text, x, y, color = colors.ink, bgColor = '#FFFFFF', fontStyleType = 'modern_bold', fontSize = 14) => {
    if (!text.trim()) return;
    if (get().textItems.length >= 12) return;
    const newId = generateTextId();
    const clampedX = Math.max(-15, Math.min(x - 30, 175));
    const clampedY = Math.max(0, Math.min(y - 10, 670));
    set((state) => ({
      textItems: [
        ...state.textItems,
        {
          id: newId,
          text: text.trim(),
          x: clampedX,
          y: clampedY,
          fontSize,
          rotation: 0,
          color,
          bgColor,
          fontStyleType,
        },
      ],
      selectedTextId: newId,
      selectedStickerId: null,
    }));
  },

  removeTextItem: (id) =>
    set((state) => ({
      textItems: state.textItems.filter((t) => t.id !== id),
      selectedTextId: state.selectedTextId === id ? null : state.selectedTextId,
    })),

  updateTextItem: (id, updates) =>
    set((state) => ({
      textItems: state.textItems.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),

  setTextItemPosition: (id, x, y) =>
    set((state) => ({
      textItems: state.textItems.map((t) =>
        t.id === id
          ? {
              ...t,
              x: Math.max(-15, Math.min(x, 175)),
              y: Math.max(0, Math.min(y, 670)),
            }
          : t
      ),
    })),

  setSelectedTextId: (id) =>
    set({
      selectedTextId: id,
      selectedStickerId: id ? null : get().selectedStickerId,
    }),

  moveSelectedTextItem: (dx, dy) => {
    const id = get().selectedTextId;
    if (!id) return;
    set((state) => ({
      textItems: state.textItems.map((t) => {
        if (t.id !== id) return t;
        return {
          ...t,
          x: Math.max(-15, Math.min(t.x + dx, 175)),
          y: Math.max(0, Math.min(t.y + dy, 670)),
        };
      }),
    }));
  },

  resizeSelectedTextItem: (delta) => {
    const id = get().selectedTextId;
    if (!id) return;
    set((state) => ({
      textItems: state.textItems.map((t) => {
        if (t.id !== id) return t;
        const currentSize = t.fontSize || 13;
        let nextSize = currentSize + delta;
        if (delta > 0 && nextSize > 28) nextSize = 10;
        else if (delta < 0 && nextSize < 9) nextSize = 9;
        return { ...t, fontSize: nextSize };
      }),
    }));
  },

  setTextItemFontSize: (id, fontSize) => {
    set((state) => ({
      textItems: state.textItems.map((t) =>
        t.id === id ? { ...t, fontSize: Math.max(9, Math.min(Math.round(fontSize), 32)) } : t
      ),
    }));
  },

  rotateSelectedTextItem: (delta) => {
    const id = get().selectedTextId;
    if (!id) return;
    set((state) => ({
      textItems: state.textItems.map((t) => {
        if (t.id !== id) return t;
        const newRot = ((t.rotation || 0) + delta) % 360;
        return { ...t, rotation: newRot };
      }),
    }));
  },

  duplicateSelectedTextItem: () => {
    const id = get().selectedTextId;
    if (!id) return;
    const item = get().textItems.find((t) => t.id === id);
    if (!item) return;
    if (get().textItems.length >= 12) return;
    const newId = generateTextId();
    const newText: CustomTextItem = {
      ...item,
      id: newId,
      x: Math.min(item.x + 15, 175),
      y: Math.min(item.y + 18, 670),
    };
    set((state) => ({
      textItems: [...state.textItems, newText],
      selectedTextId: newId,
      selectedStickerId: null,
    }));
  },

  clearAllCanvasItems: () =>
    set({ stickers: [], textItems: [], selectedStickerId: null, selectedTextId: null }),

  clearAllStickers: () =>
    set({ stickers: [], selectedStickerId: null }),

  savedCustomFrames: [
    {
      id: 'my_frame_y2k_pink',
      name: 'Khung Y2K Trái Tim Hồng',
      createdAt: Date.now() - 86400000,
      previewColor: '#FFB6C1',
      frameLayout: 'strip_4',
      backgroundColor: '#FFB6C1',
      borderColor: '#111827',
      pattern: 'stars',
      frameEdgeStyle: 'stamp_scallop',
      sealStamp: 'love_wax',
      washiTapeStyle: 'strawberry',
      gradientTheme: 'none',
      stickers: [
        { id: 's1', emoji: '💖', x: 20, y: 35, size: 36, rotation: -10 },
        { id: 's2', emoji: '✨', x: 85, y: 15, size: 32, rotation: 15 },
        { id: 's3', emoji: '🎀', x: 75, y: 88, size: 38, rotation: 5 },
      ],
      textItems: [],
      customText: '',
      photoFilter: 'none',
      stickersCount: 3,
    },
    {
      id: 'my_frame_movie_ticket',
      name: 'Vé Xem Phim Retro 1998',
      createdAt: Date.now() - 172800000,
      previewColor: '#FEE2E2',
      frameLayout: 'strip_4',
      backgroundColor: '#FEE2E2',
      borderColor: '#111827',
      pattern: 'solid',
      frameEdgeStyle: 'film_perforated',
      sealStamp: 'vintage_post',
      washiTapeStyle: 'gingham',
      gradientTheme: 'none',
      stickers: [
        { id: 's4', emoji: '🎟️', x: 15, y: 10, size: 34, rotation: -12 },
        { id: 's5', emoji: '🎬', x: 80, y: 18, size: 32, rotation: 8 },
        { id: 's6', emoji: '🍿', x: 82, y: 86, size: 36, rotation: -6 },
      ],
      textItems: [],
      customText: '',
      photoFilter: 'warm',
      stickersCount: 3,
    },
  ],

  saveCurrentFrame: () => {
    const s = get();
    const newFrame: SavedCustomFrame = {
      id: 'frame_' + Date.now(),
      name: s.frameName || 'Khung của tôi',
      createdAt: Date.now(),
      previewColor: s.backgroundColor,
      frameLayout: s.frameLayout,
      backgroundColor: s.backgroundColor,
      borderColor: s.borderColor,
      pattern: s.pattern,
      frameEdgeStyle: s.frameEdgeStyle,
      sealStamp: s.sealStamp,
      washiTapeStyle: s.washiTapeStyle,
      gradientTheme: s.gradientTheme,
      stickers: JSON.parse(JSON.stringify(s.stickers)),
      textItems: JSON.parse(JSON.stringify(s.textItems)),
      customText: s.customText,
      photoFilter: s.photoFilter,
      stickersCount: s.stickers.length + s.textItems.length,
    };
    set((state) => ({
      savedCustomFrames: [newFrame, ...state.savedCustomFrames.filter((f) => f.id !== newFrame.id)],
    }));
    return newFrame;
  },

  loadSavedFrame: (frameId: string) => {
    const frame = get().savedCustomFrames.find((f) => f.id === frameId);
    if (!frame) return false;
    set({
      frameName: frame.name,
      backgroundColor: frame.backgroundColor,
      borderColor: frame.borderColor,
      pattern: frame.pattern,
      frameLayout: frame.frameLayout,
      frameEdgeStyle: frame.frameEdgeStyle,
      sealStamp: frame.sealStamp,
      washiTapeStyle: frame.washiTapeStyle || 'none',
      gradientTheme: frame.gradientTheme || 'none',
      stickers: frame.stickers ? JSON.parse(JSON.stringify(frame.stickers)) : [],
      textItems: frame.textItems ? JSON.parse(JSON.stringify(frame.textItems)) : [],
      customText: frame.customText || '',
      photoFilter: frame.photoFilter || 'none',
      selectedStickerId: null,
      selectedTextId: null,
    });
    return true;
  },

  deleteSavedFrame: (frameId: string) => {
    set((state) => ({
      savedCustomFrames: state.savedCustomFrames.filter((f) => f.id !== frameId),
    }));
  },

  createNewBlankFrame: () => {
    set({
      frameName: 'Khung mới 🌿',
      backgroundColor: colors.pink,
      borderColor: colors.ink,
      pattern: 'solid',
      frameLayout: 'strip_4',
      frameEdgeStyle: 'classic',
      sealStamp: 'none',
      washiTapeStyle: 'none',
      gradientTheme: 'none',
      stickers: [],
      textItems: [],
      customText: '',
      photoFilter: 'none',
      selectedStickerId: null,
      selectedTextId: null,
    });
  },

  applyPreset: (preset) => {
    set({
      frameName: preset.name,
      backgroundColor: preset.backgroundColor,
      borderColor: preset.borderColor,
      pattern: preset.pattern,
      frameLayout: preset.frameLayout,
      frameEdgeStyle: preset.frameEdgeStyle,
      sealStamp: preset.sealStamp,
      washiTapeStyle: preset.washiTapeStyle || 'none',
      gradientTheme: preset.gradientTheme || 'none',
      stickers: preset.stickers.map((stk) => ({
        ...stk,
        id: generateStickerId(),
      })),
      textItems: preset.textItems.map((txt) => ({
        ...txt,
        id: generateTextId(),
      })),
      customText: preset.customText || '',
      textColor: preset.textColor || colors.ink,
      locationTag: preset.locationTag || get().locationTag,
      photoFilter: preset.photoFilter || 'none',
      selectedStickerId: null,
      selectedTextId: null,
    });
  },

  setCustomText: (text) => set({ customText: text }),
  setTextPosition: (pos) => set({ textPosition: pos }),
  setTextStyleType: (type) => set({ textStyleType: type }),
  setTextColor: (color) => set({ textColor: color }),
  setBorderColor: (color) => set({ borderColor: color }),
  setIsPublic: (isPublic) => set({ isPublic }),

  setSlotPhoto: (index, uri) =>
    set((state) => {
      const next = [...state.slotPhotos];
      next[index] = uri;
      return { slotPhotos: next };
    }),

  setAllSlotPhotos: (photos) => set({ slotPhotos: photos }),
  setSlotPhotos: (photos) => set({ slotPhotos: photos }),

  setPhotoFilter: (filter) => set({ photoFilter: filter }),

  setPostCaption: (caption) => set({ postCaption: caption }),

  toggleHashtag: (tag) =>
    set((state) => {
      const exists = state.postHashtags.includes(tag);
      return {
        postHashtags: exists
          ? state.postHashtags.filter((t) => t !== tag)
          : [...state.postHashtags, tag],
      };
    }),

  setFrameLayout: (layout) => set({ frameLayout: layout }),
  setFrameEdgeStyle: (style) => set({ frameEdgeStyle: style }),
  setCreatorName: (name) => set({ creatorName: name }),
  setSerialNumber: (serial) => set({ serialNumber: serial }),
  setShowTimestamp: (show) => set({ showTimestamp: show }),
  setTimestampText: (text) => set({ timestampText: text }),
  setLocationTag: (tag) => set({ locationTag: tag }),
  setSealStamp: (stamp) => set({ sealStamp: stamp }),
  setWashiTapeStyle: (tape) => set({ washiTapeStyle: tape }),
  setGradientTheme: (theme) => set({ gradientTheme: theme }),

  resetStudio: () =>
    set({
      frameName: 'Khung của tôi',
      backgroundColor: colors.pink,
      pattern: 'solid',
      uploadedImage: null,
      imageOpacity: 1,
      stickers: [],
      selectedStickerId: null,
      textItems: [],
      selectedTextId: null,
      customText: '',
      textPosition: 'bottom',
      textStyleType: 'badge',
      textColor: colors.ink,
      borderColor: colors.ink,
      isPublic: true,
      slotPhotos: [...DEFAULT_SLOT_PHOTOS],
      photoFilter: 'none',
      postCaption: 'Dải ảnh xinh từ Leafy Studio 🌿✨',
      postHashtags: ['#leafybooth', '#photobooth', '#cute'],
      frameLayout: 'strip_4',
      frameEdgeStyle: 'classic',
      creatorName: '',
      serialNumber: `#LB-${Math.floor(100 + Math.random() * 900)}`,
      showTimestamp: false,
      timestampText: '',
      locationTag: '',
      sealStamp: 'none',
      washiTapeStyle: 'none',
      gradientTheme: 'none',
    }),

  trendingFrames: INITIAL_TRENDING,
}));

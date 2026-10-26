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

export interface CustomTextItem {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize?: number;
  rotation?: number;
  color?: string;
  bgColor?: string;
}

export type FramePattern = 'solid' | 'dots' | 'stripes' | 'stars';
export type TextPosition = 'top' | 'bottom' | 'middle';
export type TextStyleType = 'badge' | 'minimal' | 'pop';
export type PhotoFilter = 'none' | 'vintage' | 'bw' | 'warm' | 'cool' | 'pastel';
export type FrameLayoutType = 'strip_4' | 'grid_4' | 'strip_3' | 'duo_note' | 'polaroid_1';
export type FrameEdgeStyle = 'classic' | 'film_perforated' | 'stamp_scallop' | 'washi_corners' | 'neon_glow';
export type SealStampType = 'none' | 'leafy_certified' | 'special_edition' | 'besties' | 'love_wax' | 'vintage_post';
export type WashiTapeStyle = 'none' | 'gingham' | 'vintage_tape' | 'caution' | 'hologram' | 'strawberry';
export type GradientTheme = 'none' | 'sunset' | 'ocean' | 'cyber' | 'kraft' | 'gingham';

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
  rotateSelectedSticker: (delta: number) => void;
  duplicateSelectedSticker: () => void;
  addTextItem: (text: string, color?: string, bgColor?: string) => void;
  addTextItemAt: (text: string, x: number, y: number, color?: string, bgColor?: string) => void;
  removeTextItem: (id: string) => void;
  updateTextItem: (id: string, updates: Partial<CustomTextItem>) => void;
  setTextItemPosition: (id: string, x: number, y: number) => void;
  setSelectedTextId: (id: string | null) => void;
  moveSelectedTextItem: (dx: number, dy: number) => void;
  resizeSelectedTextItem: (delta: number) => void;
  rotateSelectedTextItem: (delta: number) => void;
  duplicateSelectedTextItem: () => void;
  clearAllCanvasItems: () => void;
  clearAllStickers: () => void;
  applyPreset: (preset: {
    backgroundColor: string;
    borderColor: string;
    pattern: FramePattern;
    stickers: CustomSticker[];
    textItems: CustomTextItem[];
  }) => void;
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

export const useStudioStore = create<StudioState>((set, get) => ({
  frameName: 'Mùa lá rơi',
  backgroundColor: colors.pink,
  pattern: 'solid',
  uploadedImage: null,
  imageOpacity: 0.85,
  stickers: [
    { id: 'stk-1', emoji: '🍂', x: 20, y: 40, size: 30, rotation: -12 },
    { id: 'stk-2', emoji: '✨', x: 140, y: 130, size: 28, rotation: 15 },
  ],
  selectedStickerId: 'stk-1',
  textItems: [
    {
      id: 'txt-1',
      text: 'Autumn Memories 🍂',
      x: 18,
      y: 635,
      fontSize: 12,
      rotation: 0,
      color: colors.ink,
      bgColor: '#FFFFFF',
    },
  ],
  selectedTextId: null,
  customText: 'Autumn Memories 🍂',
  textPosition: 'bottom',
  textStyleType: 'badge',
  textColor: colors.ink,
  borderColor: colors.ink,
  isPublic: true,
  slotPhotos: [...DEFAULT_SLOT_PHOTOS],
  photoFilter: 'none',
  postCaption: 'Một ngày thật xinh cùng dải ảnh Leafy 📸✨ Cảm ơn bạn vì đã luôn ở bên tui!',
  postHashtags: ['#leafybooth', '#photobooth', '#besties', '#y2k'],
  frameLayout: 'strip_4',
  frameEdgeStyle: 'classic',
  creatorName: 'Mai Anh',
  serialNumber: '#LB-902',
  showTimestamp: true,
  timestampText: "'26 10 26",
  locationTag: '📍 Hanoi, Vietnam',
  sealStamp: 'leafy_certified',
  washiTapeStyle: 'none',
  gradientTheme: 'none',

  setFrameName: (name) => set({ frameName: name }),
  setBackgroundColor: (color) => set({ backgroundColor: color }),
  setPattern: (pattern) => set({ pattern }),
  setUploadedImage: (uri) => set({ uploadedImage: uri }),
  setImageOpacity: (opacity) => set({ imageOpacity: opacity }),

  addSticker: (emoji) => {
    const newId = `stk_${Date.now()}`;
    const nextStickers = [
      ...get().stickers,
      {
        id: newId,
        emoji,
        x: 20 + ((get().stickers.length * 25) % 130),
        y: 40 + ((get().stickers.length * 45) % 320),
        size: 32,
        rotation: 0,
      },
    ];
    set({ stickers: nextStickers, selectedStickerId: newId });
  },

  addStickerAt: (emoji, x, y) => {
    const newId = `stk_${Date.now()}`;
    const clampedX = Math.max(10, Math.min(x - 16, 170));
    const clampedY = Math.max(10, Math.min(y - 16, 400));
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
        const newSize = Math.max(16, Math.min((s.size || 28) + delta, 56));
        return { ...s, size: newSize };
      }),
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
    const newId = `stk_${Date.now()}`;
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

  addTextItem: (text, color = colors.ink, bgColor = '#FFFFFF') => {
    if (!text.trim()) return;
    const newId = `txt_${Date.now()}`;
    const nextTexts = [
      ...get().textItems,
      {
        id: newId,
        text: text.trim(),
        x: 15 + ((get().textItems.length * 15) % 60),
        y: 60 + ((get().textItems.length * 90) % 520),
        fontSize: 13,
        rotation: 0,
        color,
        bgColor,
      },
    ];
    set({ textItems: nextTexts, selectedTextId: newId, selectedStickerId: null });
  },

  addTextItemAt: (text, x, y, color = colors.ink, bgColor = '#FFFFFF') => {
    if (!text.trim()) return;
    const newId = `txt_${Date.now()}`;
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
          fontSize: 13,
          rotation: 0,
          color,
          bgColor,
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
        const newSize = Math.max(9, Math.min((t.fontSize || 13) + delta, 28));
        return { ...t, fontSize: newSize };
      }),
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
    const newId = `txt_${Date.now()}`;
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

  applyPreset: (preset) =>
    set({
      backgroundColor: preset.backgroundColor,
      borderColor: preset.borderColor,
      pattern: preset.pattern,
      stickers: preset.stickers,
      textItems: preset.textItems,
      selectedStickerId: null,
      selectedTextId: null,
    }),

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
      frameName: 'Frame của tôi',
      backgroundColor: colors.pink,
      pattern: 'solid',
      uploadedImage: null,
      imageOpacity: 0.85,
      stickers: [],
      selectedStickerId: null,
      customText: '',
      textPosition: 'bottom',
      textStyleType: 'badge',
      textColor: colors.ink,
      borderColor: colors.ink,
      isPublic: true,
      slotPhotos: [...DEFAULT_SLOT_PHOTOS],
      photoFilter: 'none',
      postCaption: 'Một ngày thật xinh cùng dải ảnh Leafy 📸✨ Cảm ơn bạn vì đã luôn ở bên tui!',
      postHashtags: ['#leafybooth', '#photobooth', '#besties', '#y2k'],
      frameLayout: 'strip_4',
      frameEdgeStyle: 'classic',
      creatorName: 'Mai Anh',
      serialNumber: `#LB-${Math.floor(100 + Math.random() * 900)}`,
      showTimestamp: true,
      timestampText: "'26 10 26",
      locationTag: '📍 Hanoi, Vietnam',
      sealStamp: 'leafy_certified',
      washiTapeStyle: 'none',
      gradientTheme: 'none',
    }),

  trendingFrames: INITIAL_TRENDING,
}));

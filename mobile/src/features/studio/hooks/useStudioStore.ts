import { create } from 'zustand';
import { colors } from '../../../core/theme/colors';

export interface CustomSticker {
  id: string;
  emoji: string;
  x: number;
  y: number;
}

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
  uploadedImage: string | null;
  imageOpacity: number;
  stickers: CustomSticker[];
  customText: string;
  textColor: string;
  borderColor: string;
  isPublic: boolean;

  // Actions
  setFrameName: (name: string) => void;
  setBackgroundColor: (color: string) => void;
  setUploadedImage: (uri: string | null) => void;
  setImageOpacity: (opacity: number) => void;
  addSticker: (emoji: string) => void;
  removeSticker: (id: string) => void;
  setCustomText: (text: string) => void;
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

export const useStudioStore = create<StudioState>((set) => ({
  frameName: 'Mùa lá rơi',
  backgroundColor: colors.pink,
  uploadedImage: null,
  imageOpacity: 0.85,
  stickers: [
    { id: 'stk-1', emoji: '🍂', x: 20, y: 30 },
    { id: 'stk-2', emoji: '✨', x: 140, y: 120 },
  ],
  customText: 'Autumn Memories 🍂',
  textColor: colors.ink,
  borderColor: colors.ink,
  isPublic: true,

  setFrameName: (name) => set({ frameName: name }),
  setBackgroundColor: (color) => set({ backgroundColor: color }),
  setUploadedImage: (uri) => set({ uploadedImage: uri }),
  setImageOpacity: (opacity) => set({ imageOpacity: opacity }),
  addSticker: (emoji) =>
    set((state) => ({
      stickers: [
        ...state.stickers,
        {
          id: `stk_${Date.now()}`,
          emoji,
          x: 20 + (state.stickers.length * 20) % 120,
          y: 20 + (state.stickers.length * 30) % 200,
        },
      ],
    })),
  removeSticker: (id) =>
    set((state) => ({
      stickers: state.stickers.filter((s) => s.id !== id),
    })),
  setCustomText: (text) => set({ customText: text }),
  setTextColor: (color) => set({ textColor: color }),
  setBorderColor: (color) => set({ borderColor: color }),
  setIsPublic: (isPublic) => set({ isPublic }),
  resetStudio: () =>
    set({
      frameName: 'Frame của tôi',
      backgroundColor: colors.pink,
      uploadedImage: null,
      imageOpacity: 0.85,
      stickers: [],
      customText: '',
      textColor: colors.ink,
      borderColor: colors.ink,
      isPublic: true,
    }),

  trendingFrames: INITIAL_TRENDING,
}));

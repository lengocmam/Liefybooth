import { create } from 'zustand';
import { DEFAULT_BACKDROPS } from '../../../core/constants';
import { colors } from '../../../core/theme/colors';

export type StripLayout = 'vertical' | 'grid';
export type StripFilter = 'original' | 'haru_blue' | 'bw' | 'warm' | 'cool' | 'sakura';
export type PoseCategory = 'none' | 'besties' | 'kpop' | 'y2k' | 'solo';

export interface BackdropItem {
  id: string;
  name: string;
  dateLabel: string;
  color: string;
}

export interface ActiveCustomFrameData {
  id: string;
  name: string;
  color: string;
  edgeStyle?: string;
  stickers?: Array<{ id?: string; emoji: string; x: number; y: number; size?: number; rotation?: number }>;
  textItems?: Array<{ id: string; text: string; x: number; y: number; fontSize?: number; rotation?: number; color?: string; bgColor?: string }>;
  customText?: string;
  frameLayout?: string;
  pattern?: string;
  sealStamp?: string;
  washiTapeStyle?: string;
  gradientTheme?: string;
}

interface BoothState {
  // Nền được chọn
  selectedBackdrop: BackdropItem;
  selectBackdrop: (backdrop: BackdropItem) => void;

  // Ảnh đã chụp (tối đa 4 ảnh)
  capturedPhotos: string[];
  addCapturedPhoto: (uri: string) => void;
  replacePhotoAtIndex: (index: number, uri: string) => void;
  resetPhotos: () => void;

  // Chụp lại từng ô (Smart Retake)
  retakeIndex: number | null;
  setRetakeIndex: (index: number | null) => void;

  // Nhịp đếm ngược giữa các shot (3s, 5s, 7s)
  shotInterval: 3 | 5 | 7;
  setShotInterval: (interval: 3 | 5 | 7) => void;

  // Gợi ý dáng chụp (Pose Guide)
  poseCategory: PoseCategory;
  setPoseCategory: (cat: PoseCategory) => void;

  // Xuất dải đôi (Twin Strips)
  twinStripMode: boolean;
  setTwinStripMode: (twin: boolean) => void;

  // Con dấu & Mã vạch kỷ niệm
  barcodeNumber: string;
  stampType: 'leafy_certified' | 'besties' | 'none';
  setStampType: (stamp: 'leafy_certified' | 'besties' | 'none') => void;

  // Cấu hình chụp
  cameraFacing: 'front' | 'back';
  isMirrored: boolean;
  soundEnabled: boolean;
  toggleCameraFacing: () => void;
  toggleMirror: () => void;
  toggleSound: () => void;

  // Tùy chỉnh dải ảnh
  frameColor: string;
  layout: StripLayout;
  filter: StripFilter;
  stripTitle: string;
  setFrameColor: (color: string) => void;
  setLayout: (layout: StripLayout) => void;
  setFilter: (filter: StripFilter) => void;
  setStripTitle: (title: string) => void;

  // Khung tùy biến đang kích hoạt từ Studio
  activeCustomFrame: ActiveCustomFrameData | null;
  setActiveCustomFrame: (frame: ActiveCustomFrameData | null) => void;

  // Reset toàn bộ phiên chụp
  resetBooth: () => void;
}

export const useBoothStore = create<BoothState>((set) => ({
  selectedBackdrop: DEFAULT_BACKDROPS[0], // Mặc định Halloween
  selectBackdrop: (backdrop) =>
    set({
      selectedBackdrop: backdrop,
      frameColor: backdrop.color,
      stripTitle: '', // Trống để người dùng tự do thiết kế chữ!
    }),

  capturedPhotos: [],
  addCapturedPhoto: (uri) =>
    set((state) => ({
      capturedPhotos: [...state.capturedPhotos, uri].slice(0, 4),
    })),
  replacePhotoAtIndex: (index, uri) =>
    set((state) => {
      const next = [...state.capturedPhotos];
      if (index >= 0 && index < 4) {
        next[index] = uri;
      }
      return { capturedPhotos: next };
    }),
  resetPhotos: () => set({ capturedPhotos: [], retakeIndex: null }),

  retakeIndex: null,
  setRetakeIndex: (index) => set({ retakeIndex: index }),

  shotInterval: 3,
  setShotInterval: (interval) => set({ shotInterval: interval }),

  poseCategory: 'none',
  setPoseCategory: (cat) => set({ poseCategory: cat }),

  twinStripMode: false,
  setTwinStripMode: (twin) => set({ twinStripMode: twin }),

  barcodeNumber: `#LB-${Math.floor(1000 + Math.random() * 9000)}`,
  stampType: 'leafy_certified',
  setStampType: (stamp) => set({ stampType: stamp }),

  cameraFacing: 'front',
  isMirrored: true,
  soundEnabled: true,
  toggleCameraFacing: () =>
    set((state) => ({
      cameraFacing: state.cameraFacing === 'front' ? 'back' : 'front',
      isMirrored: state.cameraFacing === 'front' ? false : true,
    })),
  toggleMirror: () => set((state) => ({ isMirrored: !state.isMirrored })),
  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),

  frameColor: DEFAULT_BACKDROPS[0].color,
  layout: 'vertical',
  filter: 'original',
  stripTitle: '', // Trống để người dùng tự do thiết kế chữ!
  setFrameColor: (color) => set({ frameColor: color }),
  setLayout: (layout) => set({ layout }),
  setFilter: (filter) => set({ filter }),
  setStripTitle: (title) => set({ stripTitle: title }),

  activeCustomFrame: null,
  setActiveCustomFrame: (frame) =>
    set((state) => ({
      activeCustomFrame: frame,
      frameColor: frame?.color || state.frameColor,
      layout: frame?.frameLayout === 'grid_4' ? 'grid' : (frame?.frameLayout ? 'vertical' : state.layout),
      stripTitle: frame?.customText || frame?.name || '',
    })),

  resetBooth: () =>
    set({
      capturedPhotos: [],
      retakeIndex: null,
      layout: 'vertical',
      filter: 'original',
      activeCustomFrame: null,
      stripTitle: '',
      twinStripMode: false,
      barcodeNumber: `#LB-${Math.floor(1000 + Math.random() * 9000)}`,
    }),
}));

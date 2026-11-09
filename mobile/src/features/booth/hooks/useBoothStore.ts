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

  // Nhịp đếm ngược giữa các shot (1s siêu tốc, 3s chuẩn, 5s thong thả, 7s nhóm)
  shotInterval: 1 | 3 | 5 | 7;
  setShotInterval: (interval: 1 | 3 | 5 | 7) => void;

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
  pattern: string;
  stripTitle: string;
  setFrameColor: (color: string) => void;
  setLayout: (layout: StripLayout) => void;
  setFilter: (filter: StripFilter) => void;
  setPattern: (pattern: string) => void;
  setStripTitle: (title: string) => void;

  // Khung tùy biến đang kích hoạt từ Studio
  activeCustomFrame: ActiveCustomFrameData | null;
  setActiveCustomFrame: (frame: ActiveCustomFrameData | null) => void;

  // Video quay K-Booth Live Clip
  recordedVideoUri: string | null;
  setRecordedVideoUri: (uri: string | null) => void;

  // Reset toàn bộ phiên chụp
  resetBooth: () => void;
}

export const useBoothStore = create<BoothState>((set) => ({
  selectedBackdrop: DEFAULT_BACKDROPS[0], // Mặc định Halloween
  selectBackdrop: (backdrop) =>
    set((state) => {
      // Tối ưu hiệu năng: Nếu đã là backdrop này và không có khung custom thì bỏ qua re-render
      if (
        state.selectedBackdrop?.id === backdrop.id &&
        state.frameColor === backdrop.color &&
        !state.activeCustomFrame
      ) {
        return state;
      }
      return {
        selectedBackdrop: backdrop,
        frameColor: backdrop.color,
        pattern: 'solid',
        activeCustomFrame: null, // Xóa khung custom để quay về nền mặc định sạch
        stripTitle: '', // Mặc định khung chỉ giữ màu sạch sẽ và thương hiệu app
      };
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
  pattern: 'solid',
  stripTitle: '', // Trống để người dùng tự do thiết kế chữ!
  setFrameColor: (color) =>
    set((state) => ({
      frameColor: color,
      // Luôn đồng bộ màu sang activeCustomFrame nếu đang dùng
      activeCustomFrame: state.activeCustomFrame
        ? { ...state.activeCustomFrame, color }
        : null,
    })),
  setLayout: (layout) =>
    set((state) => ({
      layout,
      activeCustomFrame: state.activeCustomFrame
        ? { ...state.activeCustomFrame, frameLayout: layout === 'grid' ? 'grid_4' : 'strip_4' }
        : null,
    })),
  setFilter: (filter) => set({ filter }),
  setPattern: (pattern) =>
    set((state) => ({
      pattern,
      activeCustomFrame: state.activeCustomFrame
        ? {
            ...state.activeCustomFrame,
            pattern: pattern === 'solid' || pattern === 'none' ? undefined : pattern,
          }
        : pattern === 'solid' || pattern === 'none'
        ? null
        : {
            id: state.selectedBackdrop?.id || 'custom',
            name: state.selectedBackdrop?.name || 'Khung tùy chọn',
            color: state.frameColor,
            pattern,
            edgeStyle: 'straight',
            stickers: [],
            textItems: [],
            customText: state.stripTitle || '',
            frameLayout: state.layout === 'grid' ? 'grid_4' : 'strip_4',
          },
    })),
  setStripTitle: (title) =>
    set((state) => ({
      stripTitle: title,
      activeCustomFrame: state.activeCustomFrame
        ? { ...state.activeCustomFrame, customText: title }
        : null,
    })),

  activeCustomFrame: null,
  setActiveCustomFrame: (frame) =>
    set((state) => {
      const effectiveColor = frame?.color || state.frameColor;
      return {
        activeCustomFrame: frame,
        frameColor: effectiveColor,
        pattern: frame?.pattern || 'solid',
        layout: frame?.frameLayout === 'grid_4' ? 'grid' : (frame?.frameLayout ? 'vertical' : state.layout),
        stripTitle: frame?.customText || '',
        stampType: (frame?.sealStamp as any) || state.stampType,
      };
    }),

  recordedVideoUri: null,
  setRecordedVideoUri: (uri) => set({ recordedVideoUri: uri }),

  resetBooth: () =>
    set({
      capturedPhotos: [],
      recordedVideoUri: null,
      retakeIndex: null,
      layout: 'vertical',
      filter: 'original',
      selectedBackdrop: DEFAULT_BACKDROPS[0],
      frameColor: DEFAULT_BACKDROPS[0].color,
      pattern: 'solid',
      activeCustomFrame: null,
      stripTitle: '',
      twinStripMode: false,
      barcodeNumber: `#LB-${Math.floor(1000 + Math.random() * 9000)}`,
      stampType: 'leafy_certified',
    }),
}));

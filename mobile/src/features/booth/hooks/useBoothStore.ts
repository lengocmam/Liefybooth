import { create } from 'zustand';
import { DEFAULT_BACKDROPS } from '../../../core/constants';
import { colors } from '../../../core/theme/colors';

export type StripLayout = 'vertical' | 'grid';
export type StripFilter = 'original' | 'bw' | 'warm' | 'cool';

export interface BackdropItem {
  id: string;
  name: string;
  dateLabel: string;
  color: string;
}

interface BoothState {
  // Nền được chọn
  selectedBackdrop: BackdropItem;
  selectBackdrop: (backdrop: BackdropItem) => void;

  // Ảnh đã chụp (tối đa 4 ảnh)
  capturedPhotos: string[];
  addCapturedPhoto: (uri: string) => void;
  resetPhotos: () => void;

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
  activeCustomFrame: {
    id: string;
    name: string;
    color: string;
    edgeStyle?: string;
  } | null;
  setActiveCustomFrame: (frame: { id: string; name: string; color: string; edgeStyle?: string } | null) => void;

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
  resetPhotos: () => set({ capturedPhotos: [] }),

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
      stripTitle: '', // Trống để người dùng tự do thiết kế chữ!
    })),

  resetBooth: () =>
    set({
      capturedPhotos: [],
      layout: 'vertical',
      filter: 'original',
      activeCustomFrame: null,
      stripTitle: '',
    }),
}));

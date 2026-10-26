import { create } from 'zustand';
import { colors } from '../../../core/theme/colors';

export type GardenMode = 'album' | 'shared';

export interface StripItem {
  id: string;
  authorName: string;
  authorColor: string;
  authorLetter: string;
  stripColor: string;
  photos: string[];
  createdAt: string;
}

export interface SheetSlotItem {
  index: number;
  userId?: string;
  userName?: string;
  userColor?: string;
  userLetter?: string;
  photoUrl?: string;
  filledAt?: string;
}

export interface GardenItem {
  id: string;
  name: string;
  date: string;
  mode: GardenMode;
  backdropColor: string;
  joinCode: string;
  memberCount: number;
  maxMembers: number;
  status: 'active' | 'archived';
  members: { id: string; name: string; letter: string; color: string }[];
  strips: StripItem[];
  sheetSlots: SheetSlotItem[]; // Dành cho Chế độ B (4 ô)
}

interface GardenState {
  events: GardenItem[];
  activeEventId: string;
  setActiveEventId: (id: string) => void;
  createEvent: (data: {
    name: string;
    date: string;
    mode: GardenMode;
    backdropColor: string;
    maxMembers: number;
  }) => string;
  joinEventByCode: (code: string) => GardenItem | null;
  fillSheetSlot: (eventId: string, slotIndex: number, photoUrl: string) => void;
  addStripToAlbum: (eventId: string, photos: string[], stripColor?: string) => void;
}

const INITIAL_EVENTS: GardenItem[] = [
  {
    id: 'garden-1',
    name: 'Sinh nhật Mai',
    date: '20/10',
    mode: 'album',
    backdropColor: colors.pink,
    joinCode: 'ABC234',
    memberCount: 3,
    maxMembers: 30,
    status: 'active',
    members: [
      { id: 'u1', name: 'Mai', letter: 'M', color: colors.pink },
      { id: 'u2', name: 'Bình', letter: 'B', color: colors.yellow },
      { id: 'u3', name: 'Chi', letter: 'C', color: colors.sky },
    ],
    strips: [
      {
        id: 's1',
        authorName: 'Bình',
        authorColor: colors.yellow,
        authorLetter: 'B',
        stripColor: colors.orange,
        photos: [
          'https://picsum.photos/seed/binh_s1/300/300',
          'https://picsum.photos/seed/binh_s2/300/300',
          'https://picsum.photos/seed/binh_s3/300/300',
          'https://picsum.photos/seed/binh_s4/300/300',
        ],
        createdAt: '10 phút trước',
      },
      {
        id: 's2',
        authorName: 'Chi',
        authorColor: colors.sky,
        authorLetter: 'C',
        stripColor: colors.mint,
        photos: [
          'https://picsum.photos/seed/chi_s1/300/300',
          'https://picsum.photos/seed/chi_s2/300/300',
          'https://picsum.photos/seed/chi_s3/300/300',
          'https://picsum.photos/seed/chi_s4/300/300',
        ],
        createdAt: '30 phút trước',
      },
      {
        id: 's3',
        authorName: 'An',
        authorColor: colors.pink,
        authorLetter: 'A',
        stripColor: colors.sky,
        photos: [
          'https://picsum.photos/seed/an_s1/300/300',
          'https://picsum.photos/seed/an_s2/300/300',
          'https://picsum.photos/seed/an_s3/300/300',
          'https://picsum.photos/seed/an_s4/300/300',
        ],
        createdAt: '1 giờ trước',
      },
      {
        id: 's4',
        authorName: 'Bình',
        authorColor: colors.yellow,
        authorLetter: 'B',
        stripColor: colors.yellow,
        photos: [
          'https://picsum.photos/seed/binh2_s1/300/300',
          'https://picsum.photos/seed/binh2_s2/300/300',
          'https://picsum.photos/seed/binh2_s3/300/300',
          'https://picsum.photos/seed/binh2_s4/300/300',
        ],
        createdAt: '2 giờ trước',
      },
    ],
    sheetSlots: [],
  },
  {
    id: 'garden-2',
    name: 'Đi Đà Lạt',
    date: 'Hôm nay',
    mode: 'shared',
    backdropColor: colors.yellow,
    joinCode: 'DLAT88',
    memberCount: 2,
    maxMembers: 4,
    status: 'active',
    members: [
      { id: 'u2', name: 'Bình', letter: 'B', color: colors.yellow },
      { id: 'u1', name: 'An', letter: 'A', color: colors.pink },
    ],
    strips: [],
    sheetSlots: [
      {
        index: 0,
        userId: 'u2',
        userName: 'Bình',
        userColor: colors.yellow,
        userLetter: 'B',
        photoUrl: 'https://picsum.photos/seed/dalat_binh/400/400',
        filledAt: '1 giờ trước',
      },
      {
        index: 1,
        userId: 'u1',
        userName: 'An',
        userColor: colors.pink,
        userLetter: 'A',
        photoUrl: 'https://picsum.photos/seed/dalat_an/400/400',
        filledAt: '30 phút trước',
      },
      {
        index: 2,
      },
      {
        index: 3,
      },
    ],
  },
  {
    id: 'garden-3',
    name: 'Tốt nghiệp K21',
    date: '15/06',
    mode: 'album',
    backdropColor: colors.sky,
    joinCode: 'K21VIP',
    memberCount: 12,
    maxMembers: 50,
    status: 'archived',
    members: [
      { id: 'u1', name: 'An', letter: 'A', color: colors.pink },
      { id: 'u2', name: 'Bình', letter: 'B', color: colors.yellow },
    ],
    strips: [],
    sheetSlots: [],
  },
];

export const useGardenStore = create<GardenState>((set, get) => ({
  events: INITIAL_EVENTS,
  activeEventId: 'garden-1',
  setActiveEventId: (id) => set({ activeEventId: id }),

  createEvent: (data) => {
    const id = `garden_${Date.now()}`;
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const newEvent: GardenItem = {
      id,
      name: data.name,
      date: data.date,
      mode: data.mode,
      backdropColor: data.backdropColor,
      joinCode: code,
      memberCount: 1,
      maxMembers: data.maxMembers,
      status: 'active',
      members: [{ id: 'me', name: 'Bạn', letter: 'B', color: colors.lime }],
      strips: [],
      sheetSlots:
        data.mode === 'shared'
          ? [
              { index: 0 },
              { index: 1 },
              { index: 2 },
              { index: 3 },
            ]
          : [],
    };

    set((state) => ({
      events: [newEvent, ...state.events],
      activeEventId: id,
    }));

    return id;
  },

  joinEventByCode: (code) => {
    const clean = code.trim().toUpperCase();
    const event = get().events.find((e) => e.joinCode.toUpperCase() === clean);
    if (event) {
      set({ activeEventId: event.id });
      return event;
    }
    return null;
  },

  fillSheetSlot: (eventId, slotIndex, photoUrl) => {
    set((state) => ({
      events: state.events.map((e) => {
        if (e.id !== eventId) return e;

        const updatedSlots = [...e.sheetSlots];
        updatedSlots[slotIndex] = {
          index: slotIndex,
          userId: 'me',
          userName: 'Bạn',
          userColor: colors.lime,
          userLetter: 'B',
          photoUrl,
          filledAt: 'Vừa xong',
        };

        return {
          ...e,
          sheetSlots: updatedSlots,
        };
      }),
    }));
  },

  addStripToAlbum: (eventId, photos, stripColor = colors.pink) => {
    set((state) => ({
      events: state.events.map((e) => {
        if (e.id !== eventId) return e;

        const newStrip: StripItem = {
          id: `strip_${Date.now()}`,
          authorName: 'Bạn',
          authorColor: colors.lime,
          authorLetter: 'B',
          stripColor,
          photos,
          createdAt: 'Vừa xong',
        };

        return {
          ...e,
          strips: [newStrip, ...e.strips],
        };
      }),
    }));
  },
}));

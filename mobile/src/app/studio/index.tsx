import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  Alert,
  Switch,
  GestureResponderEvent,
  PanResponder,
  Platform,
  Modal,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '../../core/theme/colors';
import { theme } from '../../core/theme/theme';
import {
  useStudioStore,
  FramePattern,
  TextPosition,
  TextStyleType,
  CustomSticker,
  CustomTextItem,
  PhotoFilter,
  DEFAULT_SLOT_PHOTOS,
  FrameLayoutType,
  FrameEdgeStyle,
  SealStampType,
  WashiTapeStyle,
  GradientTheme,
  TemplateCategory,
  StudioPresetItem,
  STUDIO_PRESETS,
} from '../../features/studio/hooks/useStudioStore';
import { exportStudioFrameToImage } from '../../core/utils/stripExportService';
import { playShutterSound } from '../../features/booth/services/soundService';

type ActiveSheet =
  | 'none'
  | 'template'
  | 'layout'
  | 'signature'
  | 'border_style'
  | 'sticker'
  | 'text'
  | 'color'
  | 'filter';

type StudioTab = ActiveSheet;

type ViewMode = 'edit' | 'instagram';

const FRAME_LAYOUT_OPTIONS: { id: FrameLayoutType; name: string; icon: string; desc: string; slotCount: number }[] = [
  { id: 'strip_4', name: '4 Ô Dọc Cổ Điển', icon: '🎞️', desc: 'Chuẩn Photobooth Hàn Quốc', slotCount: 4 },
  { id: 'grid_4', name: 'Lưới 2x2 Vuông', icon: '📸', desc: 'Chuẩn Instagram Feed', slotCount: 4 },
  { id: 'strip_3', name: '3 Ô Điện Ảnh', icon: '🎬', desc: 'Góc rộng Cinematic 16:9', slotCount: 3 },
  { id: 'duo_note', name: '2 Ô + Thiệp Ghi Nhớ', icon: '💌', desc: 'Sổ lưu bút & Note tình bạn', slotCount: 2 },
  { id: 'polaroid_1', name: 'Polaroid Nghệ Thuật', icon: '🖼️', desc: 'Khung đơn phóng to', slotCount: 1 },
];

const EDGE_STYLE_OPTIONS: { id: FrameEdgeStyle; name: string; icon: string; desc: string }[] = [
  { id: 'classic', name: 'Bo Góc Sticker Pop', icon: '⬛', desc: 'Viền đen đặc trưng cá tính' },
  { id: 'film_perforated', name: 'Răng Cưa Phim 35mm', icon: '🎞️', desc: 'Lỗ đục cuộn phim nhựa' },
  { id: 'stamp_scallop', name: 'Tem Bưu Chính', icon: '✂️', desc: 'Răng cưa viền tem thư cổ điển' },
  { id: 'washi_corners', name: 'Băng Dính Washi', icon: '📼', desc: 'Dán băng dính chéo 4 góc' },
  { id: 'neon_glow', name: 'Phát Sáng Neon', icon: '✨', desc: 'Hiệu ứng ánh sáng Cyber' },
];

const SEAL_STAMP_OPTIONS: { id: SealStampType; name: string; icon: string; title: string }[] = [
  { id: 'none', name: 'Không dùng', icon: '🚫', title: 'Không đóng dấu' },
  { id: 'leafy_certified', name: 'Leafy Certified', icon: '💮', title: 'Chứng nhận 100% Cute' },
  { id: 'special_edition', name: 'Special Edition', icon: '✨', title: 'Phiên bản đặc biệt' },
  { id: 'besties', name: 'Forever Besties', icon: '💖', title: 'Kỷ niệm bạn thân' },
  { id: 'love_wax', name: 'Dấu Sáp Tình Yêu', icon: '❤️', title: 'Niêm phong tình cảm' },
  { id: 'vintage_post', name: 'Dấu Bưu Điện', icon: '📮', title: 'Bưu điện cổ điển' },
];

const GRADIENT_THEME_OPTIONS: { id: GradientTheme; name: string; preview: string }[] = [
  { id: 'none', name: 'Màu đơn', preview: '#FF8FC7' },
  { id: 'sunset', name: 'Hoàng hôn', preview: '#FFA07A' },
  { id: 'ocean', name: 'Biển xanh', preview: '#6EE7B7' },
  { id: 'cyber', name: 'Cyber Neon', preview: '#818CF8' },
  { id: 'kraft', name: 'Giấy Vintage', preview: '#F4E8C1' },
];

const LOCATION_SUGGESTIONS = [
  '📍 Hanoi, Vietnam',
  '📍 Hoan Kiem Lake, Hanoi',
  '📍 Da Lat, Vietnam',
  '📍 Saigon, Vietnam',
  '📍 Hongdae, Seoul',
  '📍 Shibuya, Tokyo',
];

const INSTAGRAM_FILTERS: { id: PhotoFilter; label: string; icon: string; desc: string }[] = [
  { id: 'none', label: 'Mộc mạc', icon: '🌿', desc: 'Tone gốc tự nhiên sắc nét' },
  { id: 'pastel', label: 'Sakura Glow', icon: '🌸', desc: 'Hồng phấn Life4Cuts mơ màng' },
  { id: 'vintage', label: 'Vintage Cafe', icon: '☕', desc: 'Tone film cafe 90s ấm áp' },
  { id: 'bw', label: 'Film B&W', icon: '🖤', desc: 'Đen trắng điện ảnh sâu lắng' },
  { id: 'warm', label: 'Golden Hour', icon: '🌅', desc: 'Hoàng hôn nắng ấm rực rỡ' },
  { id: 'cool', label: 'Y2K Cool', icon: '🌊', desc: 'Xanh mát lạnh cá tính Y2K' },
];

const SAMPLE_MODEL_SETS = [
  [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  ],
  [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
  ],
];

const POPULAR_HASHTAGS = [
  '#leafybooth',
  '#photobooth',
  '#besties',
  '#koreanvibes',
  '#y2k',
  '#hanoi',
  '#ootd',
  '#vintage',
  '#cute',
];

const getFilterImageStyle = (filter: PhotoFilter) => {
  switch (filter) {
    case 'bw':
      return { filter: 'grayscale(100%) contrast(110%)' } as any;
    case 'vintage':
      return { filter: 'sepia(45%) contrast(105%) brightness(95%)' } as any;
    case 'warm':
      return { filter: 'sepia(20%) saturate(135%) brightness(102%)' } as any;
    case 'cool':
      return { filter: 'saturate(85%) hue-rotate(190deg)' } as any;
    case 'pastel':
      return { filter: 'brightness(110%) saturate(85%) contrast(95%)' } as any;
    default:
      return {};
  }
};

const getFilterOverlayStyle = (filter: PhotoFilter) => {
  switch (filter) {
    case 'bw':
      return { backgroundColor: 'rgba(0,0,0,0.06)' };
    case 'vintage':
      return { backgroundColor: 'rgba(120,53,15,0.18)' };
    case 'warm':
      return { backgroundColor: 'rgba(234,88,12,0.14)' };
    case 'cool':
      return { backgroundColor: 'rgba(2,132,199,0.12)' };
    case 'pastel':
      return { backgroundColor: 'rgba(244,63,94,0.12)' };
    default:
      return null;
  }
};

const PALETTE_COLORS = [
  { id: 'pink', color: colors.pink, name: 'Hồng' },
  { id: 'yellow', color: colors.yellow, name: 'Vàng' },
  { id: 'sky', color: colors.sky, name: 'Xanh trời' },
  { id: 'orange', color: colors.orange, name: 'Cam' },
  { id: 'mint', color: colors.mint, name: 'Bạc hà' },
  { id: 'cobalt', color: colors.cobalt, name: 'Cobalt' },
  { id: 'forest', color: colors.forestGreen, name: 'Xanh rừng' },
  { id: 'white', color: colors.white, name: 'Trắng' },
  { id: 'ink', color: colors.ink, name: 'Đen' },
];

const STICKER_CATEGORIES = [
  {
    id: 'cute',
    name: '🌸 Dễ thương',
    stickers: ['🌸', '🎀', '💖', '🍓', '🐰', '🐱', '🧸', '🍒', '🦋', '🌈'],
  },
  {
    id: 'sparkle',
    name: '✨ Lấp lánh',
    stickers: ['✨', '⭐', '⚡', '💫', '🔥', '💿', '👑', '💎', '🍀'],
  },
  {
    id: 'nature',
    name: '🍂 Thu & Mùa',
    stickers: ['🍂', '🍁', '🌿', '🍃', '🌻', '🍄', '🌵', '☕', '🥐'],
  },
  {
    id: 'party',
    name: '🎂 Sinh nhật',
    stickers: ['🎂', '🎉', '🎁', '🎈', '🥂', '🍰', '🍕', '🍻'],
  },
  {
    id: 'holiday',
    name: '🎃 Dịp lễ',
    stickers: ['🎃', '👻', '🕸️', '🦇', '🎄', '🎅', '❄️', '🎆'],
  },
];

const PREMADE_QUOTES = [
  '💖 Besties',
  '🍂 Autumn Vibes',
  '☕ Coffee & Chill',
  '🎂 Happy Birthday',
  '📸 Say cheese!',
  '🌿 Plant a moment',
  '✨ Xinh xỉu',
  '🖤 Love you',
  '🌻 Sunny day',
  '🍕 Vui hết nấc',
];

// STUDIO_PRESETS and StudioPresetItem imported from useStudioStore

const SAMPLE_TEXTURES = [
  'https://picsum.photos/seed/texture_leaves/400/800',
  'https://picsum.photos/seed/texture_clouds/400/800',
  'https://picsum.photos/seed/texture_stars/400/800',
];

interface DraggableCanvasStickerProps {
  sticker: CustomSticker;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onRotate?: () => void;
  onDuplicate?: () => void;
  onDragStart?: () => void;
  onDragEnd: (x: number, y: number) => void;
  canvasHeight?: number;
}

const DraggableCanvasSticker = React.memo(
  function DraggableCanvasSticker({
    sticker,
    isSelected,
    onSelect,
    onRemove,
    onRotate,
    onDuplicate,
    onDragStart,
    onDragEnd,
    canvasHeight = 700,
  }: DraggableCanvasStickerProps) {
    const [isDragging, setIsDragging] = useState(false);
    const isDraggingRef = useRef(false);
    const [pos, setPos] = useState({ x: sticker.x, y: sticker.y });
    const startPos = useRef({ x: sticker.x, y: sticker.y });
    const currentPos = useRef({ x: sticker.x, y: sticker.y });

    useEffect(() => {
      setPos({ x: sticker.x, y: sticker.y });
      currentPos.current = { x: sticker.x, y: sticker.y };
    }, [sticker.x, sticker.y]);

    const panResponder = useMemo(
      () =>
        PanResponder.create({
          onStartShouldSetPanResponder: () => false,
          onMoveShouldSetPanResponder: (_, gestureState) => {
            return Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3;
          },
          onPanResponderTerminationRequest: () => false,
          onPanResponderGrant: () => {
            onSelect();
            isDraggingRef.current = true;
            setIsDragging(true);
            onDragStart?.();
            startPos.current = { ...currentPos.current };
          },
          onPanResponderMove: (_, gestureState) => {
            const nextX = Math.round(startPos.current.x + gestureState.dx);
            const nextY = Math.round(startPos.current.y + gestureState.dy);
            // Di chuyển khắp frame (rộng ~200, cao đo từ layout)
            const clampedX = Math.max(-15, Math.min(nextX, 175));
            const maxY = Math.max(100, canvasHeight - 35);
            const clampedY = Math.max(0, Math.min(nextY, maxY));
            currentPos.current = { x: clampedX, y: clampedY };
            setPos({ x: clampedX, y: clampedY });
          },
          onPanResponderRelease: (_, gestureState) => {
            isDraggingRef.current = false;
            setIsDragging(false);
            const nextX = Math.round(startPos.current.x + gestureState.dx);
            const nextY = Math.round(startPos.current.y + gestureState.dy);
            const clampedX = Math.max(-15, Math.min(nextX, 175));
            const maxY = Math.max(100, canvasHeight - 35);
            const clampedY = Math.max(0, Math.min(nextY, maxY));
            currentPos.current = { x: clampedX, y: clampedY };
            setPos({ x: clampedX, y: clampedY });
            onDragEnd(clampedX, clampedY);
          },
          onPanResponderTerminate: () => {
            isDraggingRef.current = false;
            setIsDragging(false);
            onDragEnd(currentPos.current.x, currentPos.current.y);
          },
        }),
      [onSelect, onDragStart, onDragEnd, canvasHeight]
    );

    const size = sticker.size || 30;
    const rotation = sticker.rotation || 0;

    return (
      <Pressable
        {...panResponder.panHandlers}
        onPress={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        style={[
          styles.canvasSticker,
          {
            top: pos.y,
            left: pos.x,
            transform: [
              { rotate: `${rotation}deg` },
              { scale: isDragging ? 1.25 : 1 },
            ],
            zIndex: isDragging ? 999 : isSelected ? 50 : 10,
            cursor: isDragging ? 'grabbing' : 'grab',
          } as any,
          isSelected && styles.canvasStickerSelected,
          isDragging && styles.canvasStickerDragging,
        ]}
      >
        <Text style={[{ fontSize: size, userSelect: 'none' } as any]}>
          {sticker.emoji}
        </Text>
        {isSelected && (
          <>
            {/* Nút Xóa (Góc trên phải) */}
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              hitSlop={12}
              style={styles.handleDotRemove}
            >
              <Text style={styles.handleDotRemoveText}>✕</Text>
            </Pressable>

            {/* Nút Xoay 15° (Góc dưới phải) */}
            {onRotate && (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  onRotate();
                }}
                hitSlop={12}
                style={styles.handleDotRotate}
              >
                <Text style={styles.handleDotText}>⟳</Text>
              </Pressable>
            )}

            {/* Nút Nhân bản (Góc dưới trái) */}
            {onDuplicate && (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  onDuplicate();
                }}
                hitSlop={12}
                style={styles.handleDotDuplicate}
              >
                <Text style={styles.handleDotText}>📑</Text>
              </Pressable>
            )}
          </>
        )}
      </Pressable>
    );
  },
  (prev, next) => {
    return (
      prev.isSelected === next.isSelected &&
      prev.sticker.id === next.sticker.id &&
      prev.sticker.x === next.sticker.x &&
      prev.sticker.y === next.sticker.y &&
      prev.sticker.size === next.sticker.size &&
      prev.sticker.rotation === next.sticker.rotation &&
      prev.sticker.emoji === next.sticker.emoji &&
      prev.canvasHeight === next.canvasHeight
    );
  }
);

interface DraggableCanvasTextProps {
  item: CustomTextItem;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onRotate?: () => void;
  onDuplicate?: () => void;
  onDragStart?: () => void;
  onDragEnd: (x: number, y: number) => void;
  canvasHeight?: number;
}

const DraggableCanvasText = React.memo(
  function DraggableCanvasText({
    item,
    isSelected,
    onSelect,
    onRemove,
    onRotate,
    onDuplicate,
    onDragStart,
    onDragEnd,
    canvasHeight = 700,
  }: DraggableCanvasTextProps) {
    const [isDragging, setIsDragging] = useState(false);
    const isDraggingRef = useRef(false);
    const [pos, setPos] = useState({ x: item.x, y: item.y });
    const startPos = useRef({ x: item.x, y: item.y });
    const currentPos = useRef({ x: item.x, y: item.y });

    useEffect(() => {
      setPos({ x: item.x, y: item.y });
      currentPos.current = { x: item.x, y: item.y };
    }, [item.x, item.y]);

    const panResponder = useMemo(
      () =>
        PanResponder.create({
          onStartShouldSetPanResponder: () => false,
          onMoveShouldSetPanResponder: (_, gestureState) => {
            return Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3;
          },
          onPanResponderTerminationRequest: () => false,
          onPanResponderGrant: () => {
            onSelect();
            isDraggingRef.current = true;
            setIsDragging(true);
            onDragStart?.();
            startPos.current = { ...currentPos.current };
          },
          onPanResponderMove: (_, gestureState) => {
            const nextX = Math.round(startPos.current.x + gestureState.dx);
            const nextY = Math.round(startPos.current.y + gestureState.dy);
            // Di chuyển khắp frame (rộng ~200, cao đo từ layout)
            const clampedX = Math.max(-15, Math.min(nextX, 175));
            const maxY = Math.max(100, canvasHeight - 25);
            const clampedY = Math.max(0, Math.min(nextY, maxY));
            currentPos.current = { x: clampedX, y: clampedY };
            setPos({ x: clampedX, y: clampedY });
          },
          onPanResponderRelease: (_, gestureState) => {
            isDraggingRef.current = false;
            setIsDragging(false);
            const nextX = Math.round(startPos.current.x + gestureState.dx);
            const nextY = Math.round(startPos.current.y + gestureState.dy);
            const clampedX = Math.max(-15, Math.min(nextX, 175));
            const maxY = Math.max(100, canvasHeight - 25);
            const clampedY = Math.max(0, Math.min(nextY, maxY));
            currentPos.current = { x: clampedX, y: clampedY };
            setPos({ x: clampedX, y: clampedY });
            onDragEnd(clampedX, clampedY);
          },
          onPanResponderTerminate: () => {
            isDraggingRef.current = false;
            setIsDragging(false);
            onDragEnd(currentPos.current.x, currentPos.current.y);
          },
        }),
      [onSelect, onDragStart, onDragEnd, canvasHeight]
    );

    const fontSize = item.fontSize || 12;
    const rotation = item.rotation || 0;
    const hasBg = item.bgColor && item.bgColor !== 'transparent';

    return (
      <Pressable
        {...panResponder.panHandlers}
        onPress={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        style={[
          styles.canvasTextItem,
          {
            top: pos.y,
            left: pos.x,
            transform: [
              { rotate: `${rotation}deg` },
              { scale: isDragging ? 1.15 : 1 },
            ],
            zIndex: isDragging ? 999 : isSelected ? 50 : 15,
            cursor: isDragging ? 'grabbing' : 'grab',
          } as any,
          hasBg && {
            backgroundColor: item.bgColor,
            paddingVertical: 3,
            paddingHorizontal: 8,
            borderRadius: 8,
            borderWidth: 1.5,
            borderColor: colors.ink,
          },
          isSelected && styles.canvasTextSelected,
          isDragging && styles.canvasTextDragging,
        ]}
      >
        <Text
          style={[
            styles.canvasTextContent,
            {
              fontSize,
              color: item.color || colors.ink,
              userSelect: 'none',
            } as any,
          ]}
        >
          {item.text}
        </Text>
        {isSelected && (
          <>
            {/* Nút Xóa (Góc trên phải) */}
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              hitSlop={12}
              style={styles.handleDotRemove}
            >
              <Text style={styles.handleDotRemoveText}>✕</Text>
            </Pressable>

            {/* Nút Xoay 15° (Góc dưới phải) */}
            {onRotate && (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  onRotate();
                }}
                hitSlop={12}
                style={styles.handleDotRotate}
              >
                <Text style={styles.handleDotText}>⟳</Text>
              </Pressable>
            )}

            {/* Nút Nhân bản (Góc dưới trái) */}
            {onDuplicate && (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  onDuplicate();
                }}
                hitSlop={12}
                style={styles.handleDotDuplicate}
              >
                <Text style={styles.handleDotText}>📑</Text>
              </Pressable>
            )}
          </>
        )}
      </Pressable>
    );
  },
  (prev, next) => {
    return (
      prev.isSelected === next.isSelected &&
      prev.item.id === next.item.id &&
      prev.item.x === next.item.x &&
      prev.item.y === next.item.y &&
      prev.item.text === next.item.text &&
      prev.item.fontSize === next.item.fontSize &&
      prev.item.rotation === next.item.rotation &&
      prev.item.color === next.item.color &&
      prev.item.bgColor === next.item.bgColor &&
      prev.canvasHeight === next.canvasHeight
    );
  }
);

export default function FrameStudioScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    frameName,
    setFrameName,
    backgroundColor,
    setBackgroundColor,
    pattern,
    setPattern,
    uploadedImage,
    setUploadedImage,
    imageOpacity,
    setImageOpacity,
    stickers,
    selectedStickerId,
    setSelectedStickerId,
    addSticker,
    addStickerAt,
    removeSticker,
    setStickerPosition,
    moveSelectedSticker,
    resizeSelectedSticker,
    rotateSelectedSticker,
    duplicateSelectedSticker,
    textItems,
    selectedTextId,
    setSelectedTextId,
    addTextItem,
    addTextItemAt,
    removeTextItem,
    updateTextItem,
    setTextItemPosition,
    moveSelectedTextItem,
    resizeSelectedTextItem,
    rotateSelectedTextItem,
    duplicateSelectedTextItem,
    customText,
    setCustomText,
    textPosition,
    setTextPosition,
    textStyleType,
    setTextStyleType,
    textColor,
    setTextColor,
    borderColor,
    setBorderColor,
    isPublic,
    setIsPublic,
    applyPreset,
    clearAllCanvasItems,
    clearAllStickers,
    slotPhotos,
    setSlotPhoto,
    setAllSlotPhotos,
    photoFilter,
    setPhotoFilter,
    postCaption,
    setPostCaption,
    postHashtags,
    toggleHashtag,
    frameLayout,
    setFrameLayout,
    frameEdgeStyle,
    setFrameEdgeStyle,
    creatorName,
    setCreatorName,
    serialNumber,
    setSerialNumber,
    showTimestamp,
    setShowTimestamp,
    timestampText,
    setTimestampText,
    locationTag,
    setLocationTag,
    sealStamp,
    setSealStamp,
    washiTapeStyle,
    setWashiTapeStyle,
    gradientTheme,
    setGradientTheme,
    createNewBlankFrame,
    saveCurrentFrame,
  } = useStudioStore();

  const [selectedTemplateCategory, setSelectedTemplateCategory] = useState<TemplateCategory>('all');
  const [appliedTemplateId, setAppliedTemplateId] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>('none');
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [tempFrameName, setTempFrameName] = useState(frameName);
  const [selectedStickerCategory, setSelectedStickerCategory] = useState(0);
  const [lastSelectedEmoji, setLastSelectedEmoji] = useState('✨');
  const [newTextInput, setNewTextInput] = useState('');
  const [newTextBgColor, setNewTextBgColor] = useState('#FFFFFF');
  const [canvasHeight, setCanvasHeight] = useState(700);
  const [isExporting, setIsExporting] = useState(false);
  const [isDraggingAny, setIsDraggingAny] = useState(false);

  // Trạng thái chụp & đăng Instagram
  const [slotActionModalIndex, setSlotActionModalIndex] = useState<number | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isShootingSequence, setIsShootingSequence] = useState(false);
  const [shootingStep, setShootingStep] = useState<number | null>(null);
  const [countdownNum, setCountdownNum] = useState<number | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(1428);
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const flashAnim = useRef(new Animated.Value(0)).current;
  const sheetAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (activeSheet !== 'none' && activeSheet !== 'filter') {
      Animated.spring(sheetAnim, {
        toValue: 1,
        friction: 9,
        tension: 65,
        useNativeDriver: true,
      }).start();
    }
  }, [activeSheet]);

  const closeActiveSheet = () => {
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 160,
      useNativeDriver: true,
    }).start(() => {
      setActiveSheet('none');
    });
  };

  const triggerFlash = () => {
    flashAnim.setValue(1);
    Animated.timing(flashAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  };

  // Khởi động chuỗi chụp Photobooth 4 shot tự động kèm âm thanh & flash
  const startPhotoboothSequence = async () => {
    if (isShootingSequence) return;
    setIsShootingSequence(true);

    const sampleSet = SAMPLE_MODEL_SETS[Math.floor(Math.random() * SAMPLE_MODEL_SETS.length)];

    for (let shot = 0; shot < 4; shot++) {
      setShootingStep(shot);
      for (let c = 3; c > 0; c--) {
        setCountdownNum(c);
        await new Promise((r) => setTimeout(r, 800));
      }
      setCountdownNum(null);
      triggerFlash();
      playShutterSound();
      setSlotPhoto(shot, sampleSet[shot]);
      await new Promise((r) => setTimeout(r, 600));
    }

    setShootingStep(null);
    setIsShootingSequence(false);
  };

  // Chọn ảnh từ máy cho 1 ô cụ thể
  const handlePickFileForSlot = (index: number) => {
    setSlotActionModalIndex(null);
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            const dataUrl = ev.target?.result as string;
            if (dataUrl) {
              setSlotPhoto(index, dataUrl);
            }
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      Alert.alert('Chọn ảnh', 'Vui lòng chọn ảnh từ thiết bị của bạn.');
    }
  };

  // Chụp ảnh bằng camera cho 1 ô cụ thể
  const handleCameraCaptureForSlot = (index: number) => {
    setSlotActionModalIndex(null);
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'user';
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            const dataUrl = ev.target?.result as string;
            if (dataUrl) {
              triggerFlash();
              playShutterSound();
              setSlotPhoto(index, dataUrl);
            }
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      Alert.alert('Camera', 'Đang mở máy ảnh chụp trực tiếp...');
    }
  };

  // Dùng ảnh mẫu cho 1 ô cụ thể
  const handleApplyModelPhotoForSlot = (index: number) => {
    setSlotActionModalIndex(null);
    const sampleSet = SAMPLE_MODEL_SETS[0];
    setSlotPhoto(index, sampleSet[index % sampleSet.length]);
  };

  // Thả tim phong cách Instagram
  const handleToggleLike = () => {
    if (isLiked) {
      setIsLiked(false);
      setLikesCount((c) => c - 1);
    } else {
      setIsLiked(true);
      setLikesCount((c) => c + 1);
    }
  };

  // Xuất mẫu Frame thành file PNG HD tải về máy (có chứa ảnh, filter và dấu ấn độc bản)
  const handleExportFrame = async () => {
    setIsExporting(true);
    try {
      const ok = await exportStudioFrameToImage({
        frameName: frameName || 'Khung_cua_toi',
        backgroundColor,
        borderColor,
        pattern,
        customText,
        textPosition,
        textColor,
        stickers,
        textItems,
        slotPhotos,
        photoFilter,
        frameLayout,
        frameEdgeStyle,
        creatorName,
        serialNumber,
        showTimestamp,
        timestampText,
        locationTag,
        sealStamp,
        washiTapeStyle,
        gradientTheme,
      });
      if (ok) {
        Alert.alert('Đã tải thành công! 📥', 'Dải ảnh HD sắc nét của bạn đã được lưu về máy.');
      }
    } catch {
      Alert.alert('Thông báo', 'Không thể xuất ảnh lúc này.');
    } finally {
      setIsExporting(false);
    }
  };

  // Chọn sticker từ thư viện
  const handleSelectSticker = (emoji: string) => {
    if (stickers.length >= 24) {
      Alert.alert(
        'Giới hạn sticker 🌿',
        'Dải ảnh đã đạt tối đa 24 sticker. Bạn có thể xóa bớt các sticker cũ để thêm sticker mới nhé!'
      );
      return;
    }
    setLastSelectedEmoji(emoji);
    addSticker(emoji);
  };

  // Chạm vào canvas: Bỏ chọn đối tượng hoặc đóng drawer
  const handleCanvasPress = (event: GestureResponderEvent) => {
    // 1. Nếu đang chọn sticker hoặc text: chạm vào canvas trống để bỏ chọn
    if (selectedStickerId || selectedTextId) {
      setSelectedStickerId(null);
      setSelectedTextId(null);
      return;
    }
    // 2. Nếu đang gõ text trong sheet và chạm vào canvas: đặt text tại vị trí chạm
    if (activeSheet === 'text' && newTextInput.trim().length > 0) {
      const { locationX, locationY } = event.nativeEvent;
      addTextItemAt(newTextInput.trim(), locationX, locationY, textColor, newTextBgColor);
      setNewTextInput('');
      closeActiveSheet();
      return;
    }
    // 3. Nếu đang mở sheet: chạm canvas đóng sheet
    if (activeSheet !== 'none') {
      closeActiveSheet();
      return;
    }
  };

  const selectedSticker = stickers.find((s) => s.id === selectedStickerId);
  const selectedText = textItems.find((t) => t.id === selectedTextId);

  const handleCanvasSelectSticker = useCallback((id: string) => {
    setSelectedStickerId(id);
  }, [setSelectedStickerId]);

  const handleCanvasRemoveSticker = useCallback((id: string) => {
    removeSticker(id);
  }, [removeSticker]);

  const handleCanvasStickerDragEnd = useCallback((id: string, x: number, y: number) => {
    setIsDraggingAny(false);
    setStickerPosition(id, x, y);
  }, [setStickerPosition]);

  const handleCanvasSelectText = useCallback((id: string) => {
    setSelectedTextId(id);
  }, [setSelectedTextId]);

  const handleCanvasRemoveText = useCallback((id: string) => {
    removeTextItem(id);
  }, [removeTextItem]);

  const handleCanvasTextDragEnd = useCallback((id: string, x: number, y: number) => {
    setIsDraggingAny(false);
    setTextItemPosition(id, x, y);
  }, [setTextItemPosition]);

  const handlePublish = () => {
    if (!frameName.trim()) {
      Alert.alert('Chưa đặt tên', 'Vui lòng nhập tên cho frame của bạn.');
      return;
    }
    setShowShareModal(true);
  };

  const handleConfirmPublish = () => {
    setShowShareModal(false);
    Alert.alert(
      'Xuất bản thành công! 🎉',
      isPublic
        ? `Bài đăng dải ảnh "${frameName}" đã được tải lên và sẵn sàng xuất hiện trên Bảng tin Xu hướng!\n\n"${postCaption}"`
        : `Dải ảnh "${frameName}" đã được lưu vào bộ sưu tập cá nhân của bạn.`,
      [
        {
          text: 'Xem trên Xu hướng',
          onPress: () => router.push('/trending' as any),
        },
        {
          text: 'Xong',
          onPress: () => router.back(),
        },
      ]
    );
  };

  const effectiveBgColor =
    gradientTheme === 'sunset'
      ? '#FFA07A'
      : gradientTheme === 'ocean'
      ? '#6EE7B7'
      : gradientTheme === 'cyber'
      ? '#818CF8'
      : gradientTheme === 'kraft'
      ? '#F4E8C1'
      : backgroundColor;

  const renderSinglePhotoSlot = (slot: number, isInteractive: boolean, customSlotStyle?: any) => {
    const photoUri = slotPhotos[slot - 1];
    return (
      <Pressable
        key={slot}
        onPress={
          isInteractive
            ? (e) => {
                e.stopPropagation();
                setSlotActionModalIndex(slot - 1);
              }
            : undefined
        }
        style={[styles.photoSlot, customSlotStyle]}
      >
        {photoUri ? (
          <View style={styles.photoSlotInner}>
            <Image
              source={{ uri: photoUri }}
              style={[
                StyleSheet.absoluteFill,
                getFilterImageStyle(photoFilter),
              ]}
              resizeMode="cover"
            />
            {getFilterOverlayStyle(photoFilter) && (
              <View
                style={[
                  StyleSheet.absoluteFill,
                  getFilterOverlayStyle(photoFilter),
                ]}
              />
            )}
            {/* Retro Orange Timestamp on photo */}
            {showTimestamp && timestampText ? (
              <View style={styles.slotTimestampBadge}>
                <Text style={styles.slotTimestampText}>{timestampText}</Text>
              </View>
            ) : null}
            {isInteractive && (
              <View style={styles.slotBadgeOverlay}>
                <Text style={styles.slotBadgeText}>📷 Đổi</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.photoSlotInner, styles.photoSlotEmpty]}>
            <Text style={styles.slotEmptyIcon}>📷</Text>
            <Text style={styles.slotEmptyText}>Thêm ảnh #{slot}</Text>
          </View>
        )}
      </Pressable>
    );
  };

  const renderStripCanvas = (isInteractive: boolean) => (
    <Pressable
      onPress={isInteractive ? handleCanvasPress : undefined}
      onLayout={(e) => {
        const h = e.nativeEvent.layout.height;
        if (h > 0) setCanvasHeight(h);
      }}
      style={[
        styles.stripCanvas,
        {
          backgroundColor: effectiveBgColor,
          borderColor,
        },
        frameLayout === 'grid_4' && styles.stripCanvasGrid,
        frameLayout === 'polaroid_1' && styles.stripCanvasPolaroid,
        frameEdgeStyle === 'neon_glow' && styles.stripCanvasNeon,
        !isInteractive && styles.stripCanvasStatic,
      ]}
    >
      {/* Họa tiết nền (Dots / Stripes) */}
      {pattern === 'dots' && (
        <View style={[StyleSheet.absoluteFill, styles.patternDotsOverlay]} />
      )}
      {pattern === 'stripes' && (
        <View style={[StyleSheet.absoluteFill, styles.patternStripesOverlay]} />
      )}

      {/* Background Texture Image Layer */}
      {uploadedImage && (
        <Image
          source={{ uri: uploadedImage }}
          style={[StyleSheet.absoluteFill, { opacity: imageOpacity }]}
          resizeMode="cover"
        />
      )}

      {/* Chữ ở vị trí TOP nếu chọn top */}
      {textPosition === 'top' && customText.trim().length > 0 && (
        <View style={styles.stripTextBannerTop}>
          <Text style={[styles.stripBannerText, { color: textColor }]}>
            {customText}
          </Text>
        </View>
      )}

      {/* Header branding on strip */}
      <View style={styles.stripTopHeader}>
        <Text style={styles.stripBrand}>LEAFYBOOTH</Text>
        {locationTag ? (
          <Text style={[styles.stripLocationSubtitle, { color: textColor }]}>
            {locationTag}
          </Text>
        ) : null}
      </View>

      {/* CÁC KIỂU BỐ CỤC KHUNG ĐỘC LẠ (LAYOUT VARIANTS) */}
      {frameLayout === 'grid_4' ? (
        <View style={styles.grid4Container}>
          {[1, 2, 3, 4].map((slot) => renderSinglePhotoSlot(slot, isInteractive, styles.grid4Slot))}
        </View>
      ) : frameLayout === 'strip_3' ? (
        <View style={styles.framesColumn}>
          {[1, 2, 3].map((slot) => renderSinglePhotoSlot(slot, isInteractive, styles.cinematicSlot))}
        </View>
      ) : frameLayout === 'duo_note' ? (
        <View style={styles.framesColumn}>
          {[1, 2].map((slot) => renderSinglePhotoSlot(slot, isInteractive, styles.duoSlot))}
          <View style={styles.duoNoteCard}>
            <Text style={styles.duoNoteTitle}>💌 Lời nhắn kỷ niệm:</Text>
            <Text style={styles.duoNoteContent}>{customText || 'Mãi bên nhau bạn nhé! 🌿✨'}</Text>
            <Text style={styles.duoNoteFooter}>— {creatorName || 'Leafy Creator'} · {timestampText || '2026'}</Text>
          </View>
        </View>
      ) : frameLayout === 'polaroid_1' ? (
        <View style={styles.polaroidContainer}>
          {renderSinglePhotoSlot(1, isInteractive, styles.polaroidSlot)}
          <View style={styles.polaroidFooterArea}>
            <Text style={[styles.polaroidCaptionText, { color: textColor }]}>
              {customText || 'Khoảnh khắc đáng nhớ 🌸'}
            </Text>
          </View>
        </View>
      ) : (
        /* strip_4 (mặc định) */
        <View style={styles.framesColumn}>
          {[1, 2, 3, 4].map((slot) => (
            <React.Fragment key={slot}>
              {renderSinglePhotoSlot(slot, isInteractive)}
              {slot === 2 && textPosition === 'middle' && customText.trim().length > 0 && (
                <View style={styles.stripTextBannerMiddle}>
                  <Text style={[styles.stripBannerText, { color: textColor }]}>
                    {customText}
                  </Text>
                </View>
              )}
            </React.Fragment>
          ))}
        </View>
      )}

      {/* Chữ ở vị trí BOTTOM nếu chọn bottom */}
      {textPosition === 'bottom' && customText.trim().length > 0 && (
        <View style={styles.stripBottomBanner}>
          <Text style={[styles.stripBannerText, { color: textColor }]}>
            {customText}
          </Text>
        </View>
      )}

      {/* Con dấu sáp / Con dấu niêm phong độc bản */}
      {sealStamp && sealStamp !== 'none' && (
        <View style={styles.sealStampBadge} pointerEvents="none">
          <View style={styles.sealStampInner}>
            <Text style={styles.sealStampTitle}>LEAFY</Text>
            <Text style={styles.sealStampIcon}>
              {sealStamp === 'leafy_certified'
                ? '💮'
                : sealStamp === 'special_edition'
                ? '✨'
                : sealStamp === 'besties'
                ? '💖'
                : sealStamp === 'love_wax'
                ? '❤️'
                : '📮'}
            </Text>
            <Text style={styles.sealStampSub}>100%</Text>
          </View>
        </View>
      )}

      {/* Dấu ấn tác giả & Serial code Limited Edition */}
      <View style={styles.signatureFooter}>
        <Text style={[styles.signatureText, { color: textColor }]} numberOfLines={1}>
          ✦ Designed by {creatorName || 'Leafy Creator'} ✦
        </Text>
        <Text style={[styles.signatureSerial, { color: textColor }]}>
          Limited Edition {serialNumber || '#LB-902'}
        </Text>
      </View>

      {/* Hiệu ứng viền cuộn phim nhựa 35mm nếu chọn film_perforated */}
      {frameEdgeStyle === 'film_perforated' && (
        <>
          <View style={[styles.filmPerforationsColumn, { left: 2 }]} pointerEvents="none">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((k) => (
              <View key={k} style={styles.filmHole} />
            ))}
          </View>
          <View style={[styles.filmPerforationsColumn, { right: 2 }]} pointerEvents="none">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((k) => (
              <View key={k} style={styles.filmHole} />
            ))}
          </View>
        </>
      )}

      {/* Hiệu ứng băng dính Washi nếu chọn washi_corners */}
      {frameEdgeStyle === 'washi_corners' && (
        <>
          <View style={[styles.washiTapeCorner, styles.washiTapeTopLeft]} pointerEvents="none">
            <View style={styles.washiTapeInner} />
          </View>
          <View style={[styles.washiTapeCorner, styles.washiTapeBottomRight]} pointerEvents="none">
            <View style={styles.washiTapeInner} />
          </View>
        </>
      )}

      {/* STICKERS TỰ DO TRÊN DẢI ẢNH */}
      {stickers.map((stk) => {
        if (isInteractive) {
          return (
            <DraggableCanvasSticker
              key={stk.id}
              sticker={stk}
              isSelected={stk.id === selectedStickerId}
              onSelect={() => handleCanvasSelectSticker(stk.id)}
              onRemove={() => handleCanvasRemoveSticker(stk.id)}
              onRotate={() => rotateSelectedSticker(15)}
              onDuplicate={duplicateSelectedSticker}
              onDragStart={() => setIsDraggingAny(true)}
              onDragEnd={(x, y) => handleCanvasStickerDragEnd(stk.id, x, y)}
              canvasHeight={canvasHeight}
            />
          );
        }
        return (
          <View
            key={stk.id}
            style={[
              styles.canvasSticker,
              {
                top: stk.y,
                left: stk.x,
                transform: [{ rotate: `${stk.rotation || 0}deg` }],
                zIndex: 10,
              },
            ]}
          >
            <Text style={{ fontSize: stk.size || 30 }}>{stk.emoji}</Text>
          </View>
        );
      })}

      {/* DÒNG CHỮ TỰ DO TRÊN DẢI ẢNH */}
      {textItems.map((item) => {
        if (isInteractive) {
          return (
            <DraggableCanvasText
              key={item.id}
              item={item}
              isSelected={item.id === selectedTextId}
              onSelect={() => handleCanvasSelectText(item.id)}
              onRemove={() => handleCanvasRemoveText(item.id)}
              onRotate={() => rotateSelectedTextItem(15)}
              onDuplicate={duplicateSelectedTextItem}
              onDragStart={() => setIsDraggingAny(true)}
              onDragEnd={(x, y) => handleCanvasTextDragEnd(item.id, x, y)}
              canvasHeight={canvasHeight}
            />
          );
        }
        const hasBg = item.bgColor && item.bgColor !== 'transparent';
        return (
          <View
            key={item.id}
            style={[
              styles.canvasTextItem,
              {
                top: item.y,
                left: item.x,
                transform: [{ rotate: `${item.rotation || 0}deg` }],
                zIndex: 12,
              },
              hasBg && {
                backgroundColor: item.bgColor,
                paddingVertical: 3,
                paddingHorizontal: 8,
                borderRadius: 8,
                borderWidth: 1.5,
                borderColor: colors.ink,
              },
            ]}
          >
            <Text
              style={[
                styles.canvasTextContent,
                { fontSize: item.fontSize || 12, color: item.color || colors.ink },
              ]}
            >
              {item.text}
            </Text>
          </View>
        );
      })}
    </Pressable>
  );

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 8),
          paddingBottom: Math.max(insets.bottom, 10),
          backgroundColor: '#FF4F8B',
        },
      ]}
    >
      {viewMode === 'instagram' ? (
        /* GIAO DIỆN TRƯNG BÀY TÁC PHẨM (LEAFY SOCIAL SHOWCASE) */
        <View style={{ flex: 1 }}>
          {/* Header Showcase mode */}
          <View style={styles.showcaseTopBar}>
            <Pressable
              onPress={() => setViewMode('edit')}
              style={({ pressed }) => [
                styles.showcaseBackBtn,
                { transform: [{ scale: pressed ? 0.95 : 1 }] },
              ]}
            >
              <Text style={styles.showcaseBackBtnText}>‹ Quay lại Studio</Text>
            </Pressable>

            <View style={styles.showcaseTitleBadge}>
              <Text style={styles.showcaseTitleText}>📸 Trưng Bày Tác Phẩm</Text>
            </View>

            <Pressable
              onPress={handlePublish}
              style={({ pressed }) => [
                styles.showcasePublishBtn,
                { transform: [{ scale: pressed ? 0.95 : 1 }] },
              ]}
            >
              <Text style={styles.showcasePublishBtnText}>🚀 Đăng</Text>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.igScrollContent}
          >
            {/* THẺ BÀI ĐĂNG STICKER POP */}
            <View style={styles.leafySocialCard}>
              {/* Băng dính Washi trang trí trên đầu thiệp */}
              <View style={styles.socialCardWashiTape}>
                <Text style={styles.socialCardWashiText}>🌿 LEAFYBOOTH LIMITED EDITION 🌿</Text>
              </View>

              {/* Header bài đăng */}
              <View style={styles.igHeaderRow}>
                <View style={styles.igUserLeft}>
                  <View style={styles.socialAvatarRing}>
                    <View style={styles.socialAvatarInner}>
                      <Text style={{ fontSize: 18 }}>🌿</Text>
                    </View>
                  </View>
                  <View style={styles.igUserInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <Text style={styles.socialUsername}>leafybooth.daily</Text>
                      <View style={styles.socialVerifiedBadge}>
                        <Text style={styles.socialVerifiedText}>✓</Text>
                      </View>
                    </View>
                    <Text style={styles.socialLocationText}>
                      {locationTag || '📍 Leafy Studio · Hoàn Kiếm, Hà Nội'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.igDotsMenu}>•••</Text>
              </View>

              {/* Dải ảnh thực tế */}
              <View style={styles.socialStripWrapper}>
                {renderStripCanvas(false)}
              </View>

              {/* Thanh tương tác xã hội */}
              <View style={styles.socialActionsBar}>
                <View style={styles.igActionsLeft}>
                  <Pressable
                    onPress={handleToggleLike}
                    style={({ pressed }) => [
                      styles.socialActionBtn,
                      { transform: [{ scale: pressed ? 0.88 : 1 }] },
                    ]}
                  >
                    <Text style={{ fontSize: 24 }}>{isLiked ? '❤️' : '🤍'}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setShowShareModal(true)}
                    style={styles.socialActionBtn}
                  >
                    <Text style={{ fontSize: 22 }}>💬</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setShowShareModal(true)}
                    style={styles.socialActionBtn}
                  >
                    <Text style={{ fontSize: 22 }}>✈️</Text>
                  </Pressable>
                </View>
                <Pressable
                  onPress={() => Alert.alert('Đã lưu! 🔖', 'Đã lưu dải ảnh vào hộp kỷ niệm của bạn.')}
                  style={styles.socialActionBtn}
                >
                  <Text style={{ fontSize: 22 }}>🔖</Text>
                </Pressable>
              </View>

              {/* Lượt thích */}
              <Text style={styles.socialLikesText}>
                {likesCount.toLocaleString()} lượt yêu thích
              </Text>

              {/* Caption */}
              <View style={styles.igCaptionSection}>
                <Text style={styles.igCaptionContent}>
                  <Text style={styles.socialCaptionAuthor}>leafybooth.daily </Text>
                  {postCaption}
                </Text>
              </View>

              {/* Hashtags */}
              <View style={styles.igHashtagsRow}>
                {postHashtags.map((tag) => (
                  <Pressable key={tag} onPress={() => toggleHashtag(tag)}>
                    <Text style={styles.socialHashtagItem}>{tag} </Text>
                  </Pressable>
                ))}
              </View>

              {/* Nút hành động nổi bật */}
              <View style={styles.socialCtaRow}>
                <Pressable
                  onPress={handleExportFrame}
                  disabled={isExporting}
                  style={({ pressed }) => [
                    styles.socialDownloadBtn,
                    { transform: [{ scale: pressed ? 0.96 : 1 }] },
                  ]}
                >
                  <Text style={styles.socialDownloadBtnText}>
                    {isExporting ? '⏳ Đang kết xuất HD...' : '📥 Tải dải ảnh HD siêu nét'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handlePublish}
                  style={({ pressed }) => [
                    styles.socialShareTrendingBtn,
                    { transform: [{ scale: pressed ? 0.96 : 1 }] },
                  ]}
                >
                  <Text style={styles.socialShareTrendingBtnText}>
                    🚀 Đăng lên Bảng tin Xu hướng
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      ) : (
        /* GIAO DIỆN LEAFY SIGNATURE STUDIO */
        <View style={styles.leafyStudioContainer}>
          {/* TOP BAR: STUDIO HEADER */}
          <View style={styles.studioHeader}>
            {/* Left: Exit */}
            <Pressable
              onPress={() => {
                Alert.alert(
                  'Rời khỏi Studio? 🌿',
                  'Các chỉnh sửa chưa lưu sẽ bị hủy.',
                  [
                    { text: 'Ở lại tiếp tục', style: 'cancel' },
                    { text: 'Thoát', style: 'destructive', onPress: () => router.back() },
                  ]
                );
              }}
              style={({ pressed }) => [
                styles.studioHeaderBtn,
                { transform: [{ scale: pressed ? 0.94 : 1 }] },
              ]}
            >
              <Text style={styles.studioHeaderBtnText}>‹ Thoát</Text>
            </Pressable>

            {/* Center: Frame title pill */}
            <Pressable
              onPress={() => {
                setTempFrameName(frameName);
                setShowRenameModal(true);
              }}
              style={({ pressed }) => [
                styles.studioTitlePill,
                { transform: [{ scale: pressed ? 0.96 : 1 }] },
              ]}
            >
              <Text style={styles.studioTitleIcon}>🌿</Text>
              <Text style={styles.studioTitleText} numberOfLines={1}>
                {frameName || 'Khung của tôi'}
              </Text>
              <Text style={styles.studioTitleEditIcon}>✏️</Text>
            </Pressable>

            {/* Center-Right: Quick Template Picker & New Blank Frame */}
            <Pressable
              onPress={() => setActiveSheet('template')}
              style={({ pressed }) => [
                styles.studioHeaderTemplateBtn,
                { transform: [{ scale: pressed ? 0.95 : 1 }] },
              ]}
            >
              <Text style={styles.studioHeaderTemplateText}>🪄 Mẫu</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                Alert.alert(
                  'Tạo khung mới? 🌿',
                  'Làm mới dải ảnh về khung trắng tinh để bạn tự do sáng tạo từ đầu.',
                  [
                    { text: 'Hủy', style: 'cancel' },
                    {
                      text: 'Tạo mới 🎨',
                      onPress: () => {
                        createNewBlankFrame();
                        setAppliedTemplateId(null);
                      },
                    },
                  ]
                );
              }}
              style={({ pressed }) => [
                styles.studioHeaderNewBtn,
                { transform: [{ scale: pressed ? 0.95 : 1 }] },
              ]}
            >
              <Text style={styles.studioHeaderNewBtnText}>➕ Mới</Text>
            </Pressable>

            {/* Right: Actions Row (Chụp ngay + Tiếp tục) */}
            <View style={styles.studioHeaderRightRow}>
              <Pressable
                onPress={() => {
                  saveCurrentFrame();
                  Alert.alert(
                    'Đã lưu khung ảnh! 🌿',
                    'Khung "' + (frameName || 'Khung của tôi') + '" đã sẵn sàng trong thư viện. Chuyển sang Booth để chụp ngay nhé?',
                    [
                      { text: 'Ở lại chỉnh tiếp', style: 'cancel' },
                      {
                        text: 'Chụp ngay 📸',
                        onPress: () => router.push('/(tabs)/booth' as any),
                      },
                    ]
                  );
                }}
                style={({ pressed }) => [
                  styles.studioBoothBtn,
                  { transform: [{ scale: pressed ? 0.95 : 1 }] },
                ]}
              >
                <Text style={styles.studioBoothBtnText}>📸 Chụp</Text>
              </Pressable>

              <Pressable
                onPress={() => setViewMode('instagram')}
                style={({ pressed }) => [
                  styles.studioCtaBtn,
                  { transform: [{ scale: pressed ? 0.95 : 1 }] },
                ]}
              >
                <Text style={styles.studioCtaBtnText}>Tiếp tục ➔</Text>
              </Pressable>
            </View>
          </View>

          {/* MAIN CANVAS: TACTILE CRAFT TABLE */}
          <View style={styles.canvasStudioWrapper}>
            <ScrollView
              contentContainerStyle={styles.canvasScrollContent}
              showsVerticalScrollIndicator={false}
              scrollEnabled={!isDraggingAny}
            >
              {/* Studio Craft Mat: Thảm lót bàn sáng tạo */}
              <View style={styles.canvasCraftMat}>
                {renderStripCanvas(true)}
              </View>

              {/* Quick action chips under canvas */}
              <View style={styles.canvasQuickBar}>
                <Pressable
                  onPress={() => setActiveSheet('template')}
                  style={({ pressed }) => [
                    styles.canvasActionPill,
                    styles.canvasActionPillTemplate,
                    { transform: [{ scale: pressed ? 0.95 : 1 }] },
                  ]}
                >
                  <Text style={styles.canvasActionPillText}>🪄 Chọn Mẫu Khung</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    Alert.alert(
                      'Tạo khung mới? 🌿',
                      'Làm mới dải ảnh về khung trắng tinh để bạn tự do sáng tạo từ đầu.',
                      [
                        { text: 'Hủy', style: 'cancel' },
                        {
                          text: 'Tạo mới 🎨',
                          onPress: () => {
                            createNewBlankFrame();
                            setAppliedTemplateId(null);
                          },
                        },
                      ]
                    );
                  }}
                  style={({ pressed }) => [
                    styles.canvasActionPill,
                    styles.canvasActionPillNew,
                    { transform: [{ scale: pressed ? 0.95 : 1 }] },
                  ]}
                >
                  <Text style={styles.canvasActionPillText}>➕ Khung mới</Text>
                </Pressable>

                <Pressable
                  onPress={startPhotoboothSequence}
                  disabled={isShootingSequence}
                  style={({ pressed }) => [
                    styles.canvasActionPill,
                    styles.canvasActionPillCamera,
                    { transform: [{ scale: pressed ? 0.95 : 1 }] },
                  ]}
                >
                  <Text style={styles.canvasActionPillText}>
                    {isShootingSequence ? '📸 Đang chụp...' : '📸 Chụp 4 shot (3s)'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    const randomSet = SAMPLE_MODEL_SETS[Math.floor(Math.random() * SAMPLE_MODEL_SETS.length)];
                    setAllSlotPhotos([...randomSet]);
                  }}
                  style={({ pressed }) => [
                    styles.canvasActionPill,
                    styles.canvasActionPillModel,
                    { transform: [{ scale: pressed ? 0.95 : 1 }] },
                  ]}
                >
                  <Text style={styles.canvasActionPillText}>🎲 4 Ảnh mẫu</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    Alert.alert(
                      'Làm mới dải ảnh? 🌿',
                      'Xóa tất cả sticker và chữ để trang trí lại từ đầu?',
                      [
                        { text: 'Hủy', style: 'cancel' },
                        { text: 'Làm mới', style: 'destructive', onPress: clearAllCanvasItems },
                      ]
                    );
                  }}
                  style={({ pressed }) => [
                    styles.canvasActionPill,
                    styles.canvasActionPillClear,
                    { transform: [{ scale: pressed ? 0.95 : 1 }] },
                  ]}
                >
                  <Text style={styles.canvasActionPillText}>🗑️ Xóa</Text>
                </Pressable>
              </View>
            </ScrollView>

            </View>

          {/* DOCK CÔNG CỤ NỔI HOẶC THANH ĐIỀU KHIỂN NGỮ CẢNH ĐÁY HOẶC BỘ LỌC HÀN QUỐC */}
          {activeSheet === 'filter' ? (
            /* BĂNG CHUYỀN BỘ LỌC TONE HÀN QUỐC POLAROID */
            <View style={styles.filterStripContainer}>
              <View style={styles.filterStripHeader}>
                <Text style={styles.filterStripTitle}>🌈 Tone màu Photobooth Hàn Quốc</Text>
                <Pressable
                  onPress={() => setActiveSheet('none')}
                  style={styles.filterStripCloseBtn}
                >
                  <Text style={styles.filterStripCloseText}>✓ Xong</Text>
                </Pressable>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterCardsScroll}
              >
                {INSTAGRAM_FILTERS.map((filt) => {
                  const isActive = photoFilter === filt.id;
                  return (
                    <Pressable
                      key={filt.id}
                      onPress={() => setPhotoFilter(filt.id)}
                      style={[
                        styles.koreanFilterCard,
                        isActive && styles.koreanFilterCardActive,
                      ]}
                    >
                      <View style={styles.koreanFilterIconCircle}>
                        <Text style={{ fontSize: 22 }}>{filt.icon}</Text>
                      </View>
                      <Text
                        style={[
                          styles.koreanFilterLabel,
                          isActive && styles.koreanFilterLabelActive,
                        ]}
                        numberOfLines={1}
                      >
                        {filt.label}
                      </Text>
                      {isActive && (
                        <View style={styles.koreanFilterActiveDot} />
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : (selectedSticker || selectedText) ? (
            /* THANH NGỮ CẢNH ĐÁY: TÙY CHỈNH STICKER / CHỮ ĐANG CHỌN (KHÔNG CHE CANVAS) */
            <View style={styles.studioDockWrapper}>
              <View style={styles.contextualBottomBar}>
                {/* Thông tin đối tượng đang chọn */}
                <View style={styles.contextItemBadge}>
                  <Text style={styles.contextItemEmoji}>
                    {selectedSticker ? selectedSticker.emoji : '✍️'}
                  </Text>
                  <Text style={styles.contextItemTitle} numberOfLines={1}>
                    {selectedSticker ? 'Sticker' : selectedText?.text}
                  </Text>
                </View>

                {/* Các nút tùy chỉnh */}
                <View style={styles.contextActionsRow}>
                  {/* Nhỏ hơn */}
                  <Pressable
                    hitSlop={8}
                    onPress={() => {
                      if (selectedSticker) resizeSelectedSticker(-4);
                      else if (selectedText) resizeSelectedTextItem(-2);
                    }}
                    style={({ pressed }) => [
                      styles.contextMiniBtn,
                      { transform: [{ scale: pressed ? 0.92 : 1 }] },
                    ]}
                  >
                    <Text style={styles.contextMiniBtnText}>−</Text>
                  </Pressable>

                  {/* Lớn hơn */}
                  <Pressable
                    hitSlop={8}
                    onPress={() => {
                      if (selectedSticker) resizeSelectedSticker(4);
                      else if (selectedText) resizeSelectedTextItem(2);
                    }}
                    style={({ pressed }) => [
                      styles.contextMiniBtn,
                      { transform: [{ scale: pressed ? 0.92 : 1 }] },
                    ]}
                  >
                    <Text style={styles.contextMiniBtnText}>+</Text>
                  </Pressable>

                  {/* Xoay trái */}
                  <Pressable
                    hitSlop={8}
                    onPress={() => {
                      if (selectedSticker) rotateSelectedSticker(-15);
                      else if (selectedText) rotateSelectedTextItem(-15);
                    }}
                    style={({ pressed }) => [
                      styles.contextMiniBtn,
                      { transform: [{ scale: pressed ? 0.92 : 1 }] },
                    ]}
                  >
                    <Text style={styles.contextMiniBtnText}>⟲</Text>
                  </Pressable>

                  {/* Xoay phải */}
                  <Pressable
                    hitSlop={8}
                    onPress={() => {
                      if (selectedSticker) rotateSelectedSticker(15);
                      else if (selectedText) rotateSelectedTextItem(15);
                    }}
                    style={({ pressed }) => [
                      styles.contextMiniBtn,
                      { transform: [{ scale: pressed ? 0.92 : 1 }] },
                    ]}
                  >
                    <Text style={styles.contextMiniBtnText}>⟳</Text>
                  </Pressable>

                  {/* Nhân bản */}
                  <Pressable
                    hitSlop={8}
                    onPress={() => {
                      if (selectedSticker) duplicateSelectedSticker();
                      else if (selectedText) duplicateSelectedTextItem();
                    }}
                    style={({ pressed }) => [
                      styles.contextMiniBtn,
                      { transform: [{ scale: pressed ? 0.92 : 1 }] },
                    ]}
                  >
                    <Text style={styles.contextMiniBtnText}>📑</Text>
                  </Pressable>

                  {/* Xóa */}
                  <Pressable
                    hitSlop={8}
                    onPress={() => {
                      if (selectedSticker) removeSticker(selectedSticker.id);
                      else if (selectedText) removeTextItem(selectedText.id);
                    }}
                    style={({ pressed }) => [
                      styles.contextMiniBtn,
                      styles.contextDeleteBtn,
                      { transform: [{ scale: pressed ? 0.92 : 1 }] },
                    ]}
                  >
                    <Text style={[styles.contextMiniBtnText, { color: '#DC2626' }]}>🗑️</Text>
                  </Pressable>

                  {/* Xong */}
                  <Pressable
                    hitSlop={8}
                    onPress={() => {
                      setSelectedStickerId(null);
                      setSelectedTextId(null);
                    }}
                    style={({ pressed }) => [
                      styles.contextMiniBtn,
                      styles.contextDoneBtn,
                      { transform: [{ scale: pressed ? 0.92 : 1 }] },
                    ]}
                  >
                    <Text style={[styles.contextMiniBtnText, { color: colors.ink }]}>✓</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ) : (
            /* FLOATING STUDIO DOCK: 8 CÔNG CỤ SÁNG TẠO ĐỘC BẢN */
            <View style={styles.studioDockWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.studioDockScroll}
              >
                {[
                  { id: 'template', label: 'Mẫu khung', icon: '🪄' },
                  { id: 'layout', label: 'Bố cục', icon: '📐' },
                  { id: 'color', label: 'Phối màu', icon: '🎨' },
                  { id: 'sticker', label: 'Sticker', icon: '✨' },
                  { id: 'text', label: 'Thêm chữ', icon: '✍️' },
                  { id: 'border_style', label: 'Viền lạ', icon: '🎞️' },
                  { id: 'signature', label: 'Dấu ấn', icon: '🏷️' },
                  { id: 'filter', label: 'Bộ lọc', icon: '🌈' },
                ].map((item) => {
                  const isActive = activeSheet === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() =>
                        setActiveSheet(activeSheet === item.id ? 'none' : (item.id as ActiveSheet))
                      }
                      style={({ pressed }) => [
                        styles.dockItemBtn,
                        isActive && styles.dockItemBtnActive,
                        { transform: [{ scale: pressed ? 0.92 : 1 }] },
                      ]}
                    >
                      <Text style={styles.dockItemIcon}>{item.icon}</Text>
                      <Text
                        style={[
                          styles.dockItemLabel,
                          isActive && styles.dockItemLabelActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* SLIDE-UP STICKER POP BOTTOM SHEET */}
          {activeSheet !== 'none' && activeSheet !== 'filter' && (
            <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
              {/* Nền mờ phía sau */}
              <Pressable
                onPress={closeActiveSheet}
                style={StyleSheet.absoluteFill}
              >
                <Animated.View
                  style={[
                    styles.sheetBackdrop,
                    {
                      opacity: sheetAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 1],
                      }),
                    },
                  ]}
                />
              </Pressable>

              {/* Ngăn kéo Sticker Pop màu trắng bo góc */}
              <Animated.View
                style={[
                  styles.leafySheetDrawer,
                  {
                    transform: [
                      {
                        translateY: sheetAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [380, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View style={styles.leafySheetHandle} />

                <View style={styles.leafySheetHeader}>
                  <Text style={styles.leafySheetTitle}>
                    {activeSheet === 'template' && '🪄 Kho 16+ Mẫu Khung Có Sẵn'}
                    {activeSheet === 'text' && '✍️ Thêm Chữ Lên Dải Ảnh'}
                    {activeSheet === 'sticker' && '✨ Sticker & Con Dấu Niêm Phong'}
                    {activeSheet === 'color' && '🎨 Phối Màu Nền & Họa Tiết'}
                    {activeSheet === 'border_style' && '🎞️ Kiểu Viền & Mép Khung Độc Lạ'}
                    {activeSheet === 'signature' && '🏷️ Dấu Ấn Tác Giả & Mã Seri'}
                    {activeSheet === 'layout' && '📐 Chọn Bố Cục Dải Ảnh'}
                  </Text>
                  <Pressable
                    onPress={closeActiveSheet}
                    style={styles.leafySheetCloseBtn}
                  >
                    <Text style={styles.leafySheetCloseText}>✕</Text>
                  </Pressable>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.sheetScrollBody}
                >
                  {/* TAB 0: KHO MẪU KHUNG CÓ SẴN (TEMPLATE GALLERY) */}
                  {activeSheet === 'template' && (
                    <View>
                      {/* Nút hành động nhanh: Làm mới về khung trắng */}
                      <View style={styles.templateQuickActionRow}>
                        <Pressable
                          onPress={() => {
                            createNewBlankFrame();
                            setAppliedTemplateId(null);
                            Alert.alert('Khung Trắng 🌿', 'Đã chuyển về khung trắng sạch sẽ để bạn tự do sáng tạo!');
                          }}
                          style={({ pressed }) => [
                            styles.templateBlankBtn,
                            { transform: [{ scale: pressed ? 0.98 : 1 }] },
                          ]}
                        >
                          <Text style={styles.templateBlankIcon}>➕</Text>
                          <Text style={styles.templateBlankText}>Bắt đầu từ khung trắng (Làm lại)</Text>
                        </Pressable>
                      </View>

                      {/* Phân loại thể loại mẫu */}
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.templateCategoryScroll}
                      >
                        {[
                          { id: 'all', label: 'Tất cả (16)' },
                          { id: 'life4cuts', label: '🌸 Life4Cuts (4)' },
                          { id: 'vintage', label: '☕ Vintage (3)' },
                          { id: 'party', label: '🎂 Sinh nhật (3)' },
                          { id: 'y2k', label: '⚡ Y2K Cyber (3)' },
                          { id: 'besties', label: '💌 Besties (3)' },
                        ].map((cat) => {
                          const isCatActive = selectedTemplateCategory === cat.id;
                          return (
                            <Pressable
                              key={cat.id}
                              onPress={() => setSelectedTemplateCategory(cat.id as TemplateCategory)}
                              style={[
                                styles.templateCatChip,
                                isCatActive && styles.templateCatChipActive,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.templateCatChipText,
                                  isCatActive && styles.templateCatChipTextActive,
                                ]}
                              >
                                {cat.label}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </ScrollView>

                      {/* Lưới các mẫu khung */}
                      <View style={styles.templateCardsGrid}>
                        {STUDIO_PRESETS.filter((p) =>
                          selectedTemplateCategory === 'all' ? true : p.category === selectedTemplateCategory
                        ).map((preset) => {
                          const isCurrentApplied =
                            appliedTemplateId === preset.id || frameName === preset.name;
                          return (
                            <Pressable
                              key={preset.id}
                              onPress={() => {
                                applyPreset(preset);
                                setAppliedTemplateId(preset.id);
                                playShutterSound();
                              }}
                              style={({ pressed }) => [
                                styles.templatePresetCard,
                                isCurrentApplied && styles.templatePresetCardActive,
                                { transform: [{ scale: pressed ? 0.96 : 1 }] },
                              ]}
                            >
                              {/* Mini preview banner */}
                              <View
                                style={[
                                  styles.templateCardPreview,
                                  { backgroundColor: preset.previewColor },
                                ]}
                              >
                                <View style={styles.templateCardIconBadge}>
                                  <Text style={{ fontSize: 18 }}>{preset.icon}</Text>
                                </View>
                                <View style={styles.templateCardCategoryBadge}>
                                  <Text style={styles.templateCardCategoryBadgeText}>
                                    {preset.badge}
                                  </Text>
                                </View>
                                <View style={styles.templateCardStickersMiniRow}>
                                  {preset.stickers.slice(0, 3).map((stk, sIdx) => (
                                    <Text key={sIdx} style={{ fontSize: 12 }}>
                                      {stk.emoji}
                                    </Text>
                                  ))}
                                </View>
                              </View>

                              {/* Info area */}
                              <View style={styles.templateCardInfo}>
                                <Text style={styles.templateCardTitle} numberOfLines={1}>
                                  {preset.name}
                                </Text>
                                <Text style={styles.templateCardDesc} numberOfLines={2}>
                                  {preset.desc}
                                </Text>

                                <View
                                  style={[
                                    styles.templateApplyPill,
                                    isCurrentApplied && styles.templateApplyPillActive,
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.templateApplyText,
                                      isCurrentApplied && styles.templateApplyTextActive,
                                    ]}
                                  >
                                    {isCurrentApplied ? '✓ Đang chọn' : 'Áp dụng ➔'}
                                  </Text>
                                </View>
                              </View>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {/* TAB 1: THÊM CHỮ */}
                  {activeSheet === 'text' && (
                    <View>
                      <TextInput
                        style={styles.leafyTextInput}
                        value={newTextInput}
                        onChangeText={setNewTextInput}
                        placeholder="Gõ chữ bạn muốn đặt lên dải ảnh..."
                        placeholderTextColor="#9CA3AF"
                      />

                      {/* Gợi ý quote nhanh 1-chạm */}
                      <Text style={styles.sheetSectionLabel}>Quote hay 1-chạm:</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                        {[
                          'Besties Forever 💖',
                          'Y2K Vibes ✨',
                          'Life4Cuts 🎞️',
                          'Smile Always 😊',
                          'Hanoi 2026 🌸',
                          'Love you to the moon 🌙',
                          'Matcha Date 🍵',
                        ].map((quote) => (
                          <Pressable
                            key={quote}
                            onPress={() => setNewTextInput(quote)}
                            style={styles.leafyQuickChip}
                          >
                            <Text style={styles.leafyQuickChipText}>{quote}</Text>
                          </Pressable>
                        ))}
                      </ScrollView>

                      {/* Bảng màu chữ */}
                      <Text style={styles.sheetSectionLabel}>Màu chữ:</Text>
                      <View style={styles.colorSwatchesGrid}>
                        {PALETTE_COLORS.map((item) => (
                          <Pressable
                            key={item.id}
                            onPress={() => setTextColor(item.color)}
                            style={[
                              styles.colorSwatch,
                              { backgroundColor: item.color },
                              textColor === item.color && styles.colorSwatchSelected,
                            ]}
                          />
                        ))}
                      </View>

                      {/* Nền nhãn dán chữ */}
                      <Text style={[styles.sheetSectionLabel, { marginTop: 12 }]}>Nền nhãn dán chữ:</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                        {[
                          { color: 'transparent', label: 'Không nền' },
                          { color: '#FFFFFF', label: 'Trắng' },
                          { color: '#111111', label: 'Đen' },
                          { color: '#FEF08A', label: 'Vàng bơ' },
                          { color: '#FCE7F3', label: 'Hồng phấn' },
                          { color: colors.lime, label: 'Lime' },
                        ].map((bg) => (
                          <Pressable
                            key={bg.color}
                            onPress={() => setNewTextBgColor(bg.color)}
                            style={[
                              styles.leafyBgChip,
                              newTextBgColor === bg.color && styles.leafyBgChipActive,
                            ]}
                          >
                            <Text
                              style={[
                                styles.leafyBgChipText,
                                newTextBgColor === bg.color && styles.leafyBgChipTextActive,
                              ]}
                            >
                              {bg.label}
                            </Text>
                          </Pressable>
                        ))}
                      </ScrollView>

                      <Pressable
                        onPress={() => {
                          if (newTextInput.trim()) {
                            addTextItem(newTextInput.trim(), textColor, newTextBgColor);
                            setNewTextInput('');
                            closeActiveSheet();
                          } else {
                            Alert.alert('Chưa nhập chữ', 'Vui lòng gõ nội dung chữ bạn muốn thêm.');
                          }
                        }}
                        style={styles.leafyConfirmBtn}
                      >
                        <Text style={styles.leafyConfirmBtnText}>✨ Đặt chữ lên dải ảnh</Text>
                      </Pressable>
                    </View>
                  )}

                  {/* TAB 2: STICKER & CON DẤU */}
                  {activeSheet === 'sticker' && (
                    <View>
                      {/* Phân loại chủ đề */}
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoryScroll}
                      >
                        <Pressable
                          onPress={() => setSelectedStickerCategory(-1)}
                          style={[
                            styles.categoryChip,
                            selectedStickerCategory === -1 && styles.categoryChipActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.categoryChipText,
                              selectedStickerCategory === -1 && styles.categoryChipTextActive,
                            ]}
                          >
                            💮 Dấu sáp & Tag
                          </Text>
                        </Pressable>

                        {STICKER_CATEGORIES.map((cat, idx) => (
                          <Pressable
                            key={cat.id}
                            onPress={() => setSelectedStickerCategory(idx)}
                            style={[
                              styles.categoryChip,
                              selectedStickerCategory === idx && styles.categoryChipActive,
                            ]}
                          >
                            <Text
                              style={[
                                styles.categoryChipText,
                                selectedStickerCategory === idx && styles.categoryChipTextActive,
                              ]}
                            >
                              {cat.name}
                            </Text>
                          </Pressable>
                        ))}
                      </ScrollView>

                      {selectedStickerCategory === -1 ? (
                        /* DẤU SÁP & WIDGET */
                        <View style={{ marginTop: 10 }}>
                          <Text style={styles.sheetSectionLabel}>Con dấu sáp chứng nhận Leafy:</Text>
                          <View style={styles.sealStampsGrid}>
                            {SEAL_STAMP_OPTIONS.map((st) => {
                              const isActive = sealStamp === st.id;
                              return (
                                <Pressable
                                  key={st.id}
                                  onPress={() => setSealStamp(st.id)}
                                  style={[styles.sealStampCard, isActive && styles.sealStampCardActive]}
                                >
                                  <Text style={{ fontSize: 26, marginBottom: 4 }}>{st.icon}</Text>
                                  <Text style={[styles.sealStampCardTitle, isActive && styles.sealStampCardTitleActive]}>
                                    {st.name}
                                  </Text>
                                </Pressable>
                              );
                            })}
                          </View>
                        </View>
                      ) : (
                        /* LƯỚI STICKER */
                        <View style={styles.stickerGrid}>
                          {STICKER_CATEGORIES[selectedStickerCategory].stickers.map((emoji) => (
                            <Pressable
                              key={emoji}
                              onPress={() => handleSelectSticker(emoji)}
                              style={({ pressed }) => [
                                styles.stickerItem,
                                lastSelectedEmoji === emoji && styles.stickerItemSelected,
                                { transform: [{ scale: pressed ? 0.9 : 1 }] },
                              ]}
                            >
                              <Text style={styles.stickerEmojiLarge}>{emoji}</Text>
                            </Pressable>
                          ))}
                        </View>
                      )}
                    </View>
                  )}

                  {/* TAB 3: MÀU NỀN & GRADIENT */}
                  {activeSheet === 'color' && (
                    <View>
                      {/* Gradient */}
                      <Text style={styles.sheetSectionLabel}>Hiệu ứng Gradient Thơ Mộng:</Text>
                      <View style={styles.gradientOptionsRow}>
                        {GRADIENT_THEME_OPTIONS.map((gt) => {
                          const isActive = gradientTheme === gt.id;
                          return (
                            <Pressable
                              key={gt.id}
                              onPress={() => setGradientTheme(gt.id)}
                              style={[
                                styles.gradientOptionChip,
                                { backgroundColor: gt.preview },
                                isActive && styles.gradientOptionChipActive,
                              ]}
                            >
                              <Text style={styles.gradientOptionText}>{gt.name}</Text>
                            </Pressable>
                          );
                        })}
                      </View>

                      {/* Màu nền đơn sắc */}
                      <Text style={[styles.sheetSectionLabel, { marginTop: 12 }]}>Màu nền đơn sắc:</Text>
                      <View style={styles.colorSwatchesGrid}>
                        {PALETTE_COLORS.map((item) => (
                          <Pressable
                            key={item.id}
                            onPress={() => {
                              setGradientTheme('none');
                              setBackgroundColor(item.color);
                            }}
                            style={[
                              styles.colorSwatch,
                              { backgroundColor: item.color },
                              gradientTheme === 'none' && backgroundColor === item.color && styles.colorSwatchSelected,
                            ]}
                          />
                        ))}
                      </View>

                      {/* Họa tiết */}
                      <Text style={[styles.sheetSectionLabel, { marginTop: 12 }]}>Họa tiết nền:</Text>
                      <View style={styles.patternRow}>
                        {(['solid', 'dots', 'stripes'] as const).map((pat) => (
                          <Pressable
                            key={pat}
                            onPress={() => setPattern(pat)}
                            style={[
                              styles.patternBtn,
                              pattern === pat && styles.patternBtnActive,
                            ]}
                          >
                            <Text
                              style={[
                                styles.patternBtnText,
                                pattern === pat && styles.patternBtnTextActive,
                              ]}
                            >
                              {pat === 'solid' ? 'Trơn' : pat === 'dots' ? 'Chấm bi' : 'Kẻ sọc'}
                            </Text>
                          </Pressable>
                        ))}
                      </View>

                      {/* Họa tiết giấy & Texture */}
                      <Text style={[styles.sheetSectionLabel, { marginTop: 12 }]}>Họa tiết giấy & ảnh nền:</Text>
                      <View style={styles.textureRow}>
                        <Pressable
                          onPress={() => setUploadedImage(null)}
                          style={[
                            styles.textureThumb,
                            { justifyContent: 'center', alignItems: 'center' },
                            uploadedImage === null && styles.textureThumbSelected,
                          ]}
                        >
                          <Text style={{ fontSize: 13, fontWeight: '700' }}>Trống</Text>
                        </Pressable>

                        {SAMPLE_TEXTURES.map((url, i) => (
                          <Pressable
                            key={i}
                            onPress={() => setUploadedImage(url)}
                            style={[
                              styles.textureThumb,
                              uploadedImage === url && styles.textureThumbSelected,
                            ]}
                          >
                            <Image source={{ uri: url }} style={StyleSheet.absoluteFill} />
                          </Pressable>
                        ))}
                      </View>

                      {/* Màu viền khung */}
                      <Text style={[styles.sheetSectionLabel, { marginTop: 12 }]}>Màu viền khung:</Text>
                      <View style={styles.colorSwatchesGrid}>
                        {[colors.ink, colors.lime, colors.pink, colors.yellow, colors.white, colors.sky].map(
                          (c, i) => (
                            <Pressable
                              key={i}
                              onPress={() => setBorderColor(c)}
                              style={[
                                styles.colorSwatch,
                                { backgroundColor: c },
                                borderColor === c && styles.colorSwatchSelected,
                              ]}
                            />
                          )
                        )}
                      </View>
                    </View>
                  )}

                  {/* TAB 4: KIỂU VIỀN ĐỘC LẠ */}
                  {activeSheet === 'border_style' && (
                    <View>
                      <View style={styles.edgeStylesGrid}>
                        {EDGE_STYLE_OPTIONS.map((es) => {
                          const isCurrent = frameEdgeStyle === es.id;
                          return (
                            <Pressable
                              key={es.id}
                              onPress={() => setFrameEdgeStyle(es.id)}
                              style={[styles.edgeStyleCard, isCurrent && styles.edgeStyleCardActive]}
                            >
                              <View style={styles.edgeStyleIconBox}>
                                <Text style={{ fontSize: 24 }}>{es.icon}</Text>
                              </View>
                              <Text style={[styles.edgeStyleName, isCurrent && styles.edgeStyleNameActive]}>
                                {es.name}
                              </Text>
                              <Text style={styles.edgeStyleDesc}>{es.desc}</Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {/* TAB 5: DẤU ẤN CÁ NHÂN */}
                  {activeSheet === 'signature' && (
                    <View>
                      {/* Tên tác giả */}
                      <Text style={styles.sheetSectionLabel}>✍️ Tên tác giả khắc lên dải ảnh:</Text>
                      <TextInput
                        style={styles.leafyTextInput}
                        value={creatorName}
                        onChangeText={setCreatorName}
                        placeholder="Nhập tên hoặc bút danh của bạn..."
                        placeholderTextColor="#9CA3AF"
                      />

                      {/* Mã seri */}
                      <Text style={styles.sheetSectionLabel}>🔢 Mã seri Limited Edition:</Text>
                      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                        <TextInput
                          style={[styles.leafyTextInput, { flex: 1, marginBottom: 0 }]}
                          value={serialNumber}
                          onChangeText={setSerialNumber}
                          placeholder="#LB-2026-X89"
                          placeholderTextColor="#9CA3AF"
                        />
                        <Pressable
                          onPress={() => setSerialNumber('#LB-' + Math.floor(100 + Math.random() * 900))}
                          style={styles.randomSerialBtn}
                        >
                          <Text style={styles.randomSerialBtnText}>🎲 Đổi số</Text>
                        </Pressable>
                      </View>

                      {/* Dập ngày giờ máy film (Timestamp) */}
                      <View style={styles.signatureToggleRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.signatureToggleTitle}>Dập ngày giờ máy film 1998</Text>
                          <Text style={styles.signatureToggleDesc}>In ngày chụp màu cam vintage ở góc ảnh</Text>
                        </View>
                        <Switch
                          value={showTimestamp}
                          onValueChange={setShowTimestamp}
                          trackColor={{ false: '#D1D5DB', true: colors.lime }}
                          thumbColor={colors.white}
                        />
                      </View>

                      {showTimestamp && (
                        <View style={{ marginBottom: 12 }}>
                          <Text style={styles.sheetSectionLabel}>Nội dung ngày giờ dập trên ảnh:</Text>
                          <TextInput
                            style={styles.leafyTextInput}
                            value={timestampText}
                            onChangeText={setTimestampText}
                            placeholder="'26 10 26"
                            placeholderTextColor="#9CA3AF"
                          />
                        </View>
                      )}

                      {/* Địa điểm check-in */}
                      <Text style={styles.sheetSectionLabel}>📍 Địa điểm & Tọa độ check-in:</Text>
                      <TextInput
                        style={styles.leafyTextInput}
                        value={locationTag}
                        onChangeText={setLocationTag}
                        placeholder="Ví dụ: 📍 Hanoi, Vietnam"
                        placeholderTextColor="#9CA3AF"
                      />
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                        {LOCATION_SUGGESTIONS.map((loc) => (
                          <Pressable
                            key={loc}
                            onPress={() => setLocationTag(loc)}
                            style={styles.leafyQuickChip}
                          >
                            <Text style={styles.leafyQuickChipText}>{loc}</Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {/* TAB 6: BỐ CỤC KHUNG */}
                  {activeSheet === 'layout' && (
                    <View>
                      <View style={styles.layoutOptionsGrid}>
                        {FRAME_LAYOUT_OPTIONS.map((lo) => {
                          const isCurrent = frameLayout === lo.id;
                          return (
                            <Pressable
                              key={lo.id}
                              onPress={() => setFrameLayout(lo.id)}
                              style={[styles.layoutOptionCard, isCurrent && styles.layoutOptionCardActive]}
                            >
                              <View style={styles.layoutOptionIconCircle}>
                                <Text style={{ fontSize: 24 }}>{lo.icon}</Text>
                              </View>
                              <Text style={[styles.layoutOptionName, isCurrent && styles.layoutOptionNameActive]}>
                                {lo.name}
                              </Text>
                              <Text style={styles.layoutOptionDesc}>{lo.desc}</Text>
                              <View style={styles.layoutSlotCountBadge}>
                                <Text style={styles.layoutSlotCountText}>{lo.slotCount} ô ảnh</Text>
                              </View>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </ScrollView>
              </Animated.View>
            </View>
          )}

          {/* MODAL ĐỔI TÊN FRAME */}
          <Modal
            visible={showRenameModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowRenameModal(false)}
          >
            <Pressable onPress={() => setShowRenameModal(false)} style={styles.modalBackdrop}>
              <Pressable onPress={(e) => e.stopPropagation()} style={styles.renameModalCard}>
                <Text style={styles.renameModalTitle}>✏️ Đổi tên Frame của bạn</Text>
                <TextInput
                  style={styles.renameInput}
                  value={tempFrameName}
                  onChangeText={setTempFrameName}
                  placeholder="Ví dụ: Kỷ niệm mùa thu 🌿"
                  placeholderTextColor="#9CA3AF"
                />
                <View style={styles.renameButtonsRow}>
                  <Pressable
                    onPress={() => setShowRenameModal(false)}
                    style={styles.renameCancelBtn}
                  >
                    <Text style={styles.renameCancelText}>Hủy</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      if (tempFrameName.trim()) setFrameName(tempFrameName.trim());
                      setShowRenameModal(false);
                    }}
                    style={styles.renameSaveBtn}
                  >
                    <Text style={styles.renameSaveText}>Lưu tên</Text>
                  </Pressable>
                </View>
              </Pressable>
            </Pressable>
          </Modal>
        </View>
      )}

      {/* OVERLAY CHỤP 4 SHOT PHOTOBOOTH ĐẾM NGƯỢC 3S */}
      {isShootingSequence && (
        <View style={styles.shootingOverlay}>
          <View style={styles.shootingBox}>
            <Text style={styles.shootingStepLabel}>
              ĐANG CHỤP SHOT #{shootingStep !== null ? shootingStep + 1 : 1} / 4
            </Text>
            <Text style={styles.shootingCountdownNum}>{countdownNum ?? '📸'}</Text>
            <Text style={styles.shootingSubTip}>Tạo dáng thật xinh nào! ✨</Text>
          </View>
          <Animated.View
            pointerEvents="none"
            style={[styles.flashScreen, { opacity: flashAnim }]}
          />
        </View>
      )}

      {/* MODAL TÙY CHỌN Ô ẢNH */}
      <Modal
        visible={slotActionModalIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSlotActionModalIndex(null)}
      >
        <Pressable
          onPress={() => setSlotActionModalIndex(null)}
          style={styles.modalBackdrop}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={styles.slotModalCard}
          >
            <Text style={styles.slotModalTitle}>
              Tùy chọn Ô ảnh #{slotActionModalIndex !== null ? slotActionModalIndex + 1 : 1}
            </Text>
            <Text style={styles.slotModalSubtitle}>
              Chọn cách bạn muốn thêm ảnh vào ô này:
            </Text>

            <Pressable
              onPress={() => {
                if (slotActionModalIndex !== null) handleCameraCaptureForSlot(slotActionModalIndex);
              }}
              style={styles.slotModalItemBtn}
            >
              <Text style={styles.slotModalItemIcon}>📸</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.slotModalItemTitle}>Chụp ảnh bằng Camera</Text>
                <Text style={styles.slotModalItemDesc}>Bật máy ảnh điện thoại chụp ngay</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => {
                if (slotActionModalIndex !== null) handlePickFileForSlot(slotActionModalIndex);
              }}
              style={styles.slotModalItemBtn}
            >
              <Text style={styles.slotModalItemIcon}>🖼️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.slotModalItemTitle}>Chọn ảnh từ thiết bị</Text>
                <Text style={styles.slotModalItemDesc}>Tải ảnh có sẵn từ bộ sưu tập</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => {
                if (slotActionModalIndex !== null) handleApplyModelPhotoForSlot(slotActionModalIndex);
              }}
              style={styles.slotModalItemBtn}
            >
              <Text style={styles.slotModalItemIcon}>🎲</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.slotModalItemTitle}>Dùng ảnh mẫu xinh Gen Z</Text>
                <Text style={styles.slotModalItemDesc}>Ảnh photobooth phong cách Hàn Quốc</Text>
              </View>
            </Pressable>

            {slotActionModalIndex !== null && slotPhotos[slotActionModalIndex] && (
              <Pressable
                onPress={() => {
                  if (slotActionModalIndex !== null) {
                    setSlotPhoto(slotActionModalIndex, null);
                    setSlotActionModalIndex(null);
                  }
                }}
                style={[styles.slotModalItemBtn, { backgroundColor: '#FEE2E2' }]}
              >
                <Text style={styles.slotModalItemIcon}>🗑️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.slotModalItemTitle, { color: '#DC2626' }]}>Xóa ảnh ô này</Text>
                  <Text style={styles.slotModalItemDesc}>Để ô ảnh trống</Text>
                </View>
              </Pressable>
            )}

            <Pressable
              onPress={() => setSlotActionModalIndex(null)}
              style={styles.slotModalCloseBtn}
            >
              <Text style={styles.slotModalCloseText}>Đóng</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* MODAL ĐĂNG LÊN INSTAGRAM / BẢNG TIN XU HƯỚNG */}
      <Modal
        visible={showShareModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowShareModal(false)}
      >
        <Pressable
          onPress={() => setShowShareModal(false)}
          style={styles.modalBackdrop}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={styles.shareSheetCard}
          >
            <View style={styles.shareSheetHeader}>
              <Text style={styles.shareSheetTitle}>🚀 Đăng lên Bảng tin Xu hướng</Text>
              <Pressable onPress={() => setShowShareModal(false)} style={styles.shareSheetCloseBtn}>
                <Text style={{ fontSize: 16, fontWeight: '800' }}>✕</Text>
              </Pressable>
            </View>

            <Text style={styles.shareSheetSubtitle}>
              Khung ảnh độc bản "{frameName}" của bạn sẽ được chia sẻ cho toàn bộ cộng đồng LeafyBooth.
            </Text>

            <Text style={styles.shareSheetSectionLabel}>Lời nhắn / Caption bài đăng:</Text>
            <TextInput
              style={styles.shareCaptionInput}
              value={postCaption}
              onChangeText={setPostCaption}
              placeholder="Viết caption thật thơ mộng..."
              placeholderTextColor="#9CA3AF"
              multiline
            />

            <Text style={styles.shareSheetSectionLabel}>Hashtags thịnh hành (chạm để chọn):</Text>
            <View style={styles.shareTagsWrap}>
              {POPULAR_HASHTAGS.map((tag) => {
                const selected = postHashtags.includes(tag);
                return (
                  <Pressable
                    key={tag}
                    onPress={() => toggleHashtag(tag)}
                    style={[styles.shareTagChip, selected && styles.shareTagChipActive]}
                  >
                    <Text style={[styles.shareTagChipText, selected && styles.shareTagChipTextActive]}>
                      {tag}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.sharePublicToggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sharePublicTitle}>Chia sẻ công khai</Text>
                <Text style={styles.sharePublicDesc}>Ai cũng có thể xem và lưu frame</Text>
              </View>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                trackColor={{ false: '#D1D5DB', true: colors.lime }}
                thumbColor={colors.white}
              />
            </View>

            <Pressable
              onPress={handleConfirmPublish}
              style={styles.shareConfirmBtn}
            >
              <Text style={styles.shareConfirmBtnText}>🚀 Đăng bài ngay</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF4F8B',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: theme.borders.radius.full,
    backgroundColor: colors.white,
    borderWidth: theme.borders.width,
    borderColor: colors.ink,
    ...theme.shadows.hardSmall,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.white,
  },
  publishButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: theme.borders.radius.full,
    backgroundColor: colors.lime,
    borderWidth: theme.borders.width,
    borderColor: colors.ink,
    ...theme.shadows.hardSmall,
  },
  publishText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.ink,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  nameInputContainer: {
    marginBottom: 10,
  },
  nameInput: {
    height: 46,
    backgroundColor: colors.white,
    borderRadius: theme.borders.radius.full,
    borderWidth: theme.borders.width,
    borderColor: colors.ink,
    paddingHorizontal: 18,
    fontSize: 15,
    fontWeight: '800',
    color: colors.ink,
    textAlign: 'center',
    ...theme.shadows.hard,
  },
  hintPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: theme.borders.radius.full,
    borderWidth: 1.5,
    borderColor: colors.ink,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  hintPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.ink,
  },
  canvasContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  canvasActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
  },
  downloadFrameBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.yellow,
    borderRadius: theme.borders.radius.full,
    borderWidth: theme.borders.width,
    borderColor: colors.ink,
    ...theme.shadows.hardSmall,
  },
  downloadFrameBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.ink,
  },
  clearCanvasBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: colors.white,
    borderRadius: theme.borders.radius.full,
    borderWidth: 1.5,
    borderColor: '#DC2626',
    ...theme.shadows.hardSmall,
  },
  clearCanvasBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DC2626',
  },
  stripCanvas: {
    width: 172,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 3,
    ...theme.shadows.hard,
    position: 'relative',
    overflow: 'hidden',
  },
  patternDotsOverlay: {
    backgroundColor: 'transparent',
    opacity: 0.15,
  },
  patternStripesOverlay: {
    backgroundColor: 'transparent',
    opacity: 0.15,
  },
  stripTopHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  stripBrand: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: 2,
  },
  framesColumn: {
    gap: 8,
  },
  photoSlot: {
    width: '100%',
    aspectRatio: 1.15,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.ink,
    overflow: 'hidden',
  },
  photoSlotInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: '#9CA3AF',
  },
  stripTextBannerTop: {
    backgroundColor: colors.white,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.ink,
    alignItems: 'center',
    marginBottom: 6,
  },
  stripTextBannerMiddle: {
    backgroundColor: colors.white,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.ink,
    alignItems: 'center',
    marginVertical: 4,
  },
  stripBottomBanner: {
    marginTop: 10,
    backgroundColor: colors.white,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.ink,
    alignItems: 'center',
  },
  stripBannerText: {
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
  },
  canvasSticker: {
    position: 'absolute',
    zIndex: 10,
    padding: 2,
  },
  canvasStickerSelected: {
    borderWidth: 2,
    borderColor: colors.lime,
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: 'rgba(200, 241, 53, 0.25)',
  },
  canvasStickerDragging: {
    borderWidth: 2,
    borderColor: colors.cobalt,
    borderStyle: 'solid',
    borderRadius: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
    ...theme.shadows.hard,
  },
  canvasTextItem: {
    position: 'absolute',
    zIndex: 15,
  },
  canvasTextSelected: {
    borderWidth: 2,
    borderColor: colors.cobalt,
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  canvasTextDragging: {
    borderWidth: 2,
    borderColor: colors.cobalt,
    borderStyle: 'solid',
    borderRadius: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
    ...theme.shadows.hard,
  },
  canvasTextContent: {
    fontWeight: '900',
  },
  removeTextDot: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.white,
    zIndex: 100,
  },
  removeStickerDot: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.white,
  },
  removeStickerDotText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '900',
  },
  selectedStickerControls: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: colors.ink,
    padding: 12,
    marginBottom: 12,
    ...theme.shadows.hard,
  },
  controlsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  controlsTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.ink,
  },
  controlsDoneBtn: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.ink,
  },
  controlsDoneBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.ink,
  },
  controlsButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  controlGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  controlGroupLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4B5563',
  },
  controlCircleBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.ink,
  },
  deleteStickerBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    borderWidth: 1.5,
    borderColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteStickerBtnText: {
    fontSize: 15,
  },
  tabsScrollView: {
    marginBottom: 12,
  },
  tabsScrollContent: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 2,
    alignItems: 'center',
  },
  toolTab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: colors.white,
    borderRadius: theme.borders.radius.full,
    borderWidth: theme.borders.width,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.hardSmall,
  },
  toolTabActive: {
    backgroundColor: colors.lime,
  },
  toolTabText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.ink,
  },
  toolTabTextActive: {
    fontWeight: '900',
  },
  paletteContainer: {
    backgroundColor: colors.white,
    borderRadius: theme.borders.radius.card,
    borderWidth: theme.borders.width,
    borderColor: colors.ink,
    padding: 16,
    ...theme.shadows.hard,
    marginBottom: 16,
  },
  categoryScroll: {
    gap: 8,
    marginBottom: 10,
  },
  categoryChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.borders.radius.full,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: colors.ink,
  },
  categoryChipActive: {
    backgroundColor: colors.lime,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.ink,
  },
  categoryChipTextActive: {
    fontWeight: '900',
  },
  paletteTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.ink,
    marginBottom: 8,
  },
  paletteSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 10,
  },
  paletteDisclaimer: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '700',
    marginBottom: 12,
  },
  stickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  stickerItem: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stickerItemSelected: {
    backgroundColor: colors.lime,
    borderWidth: 2.5,
  },
  stickerEmojiLarge: {
    fontSize: 24,
  },
  colorSwatchesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorSwatch: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: colors.ink,
  },
  colorSwatchSelected: {
    borderWidth: 3.5,
    borderColor: colors.lime,
    transform: [{ scale: 1.15 }],
  },
  patternRow: {
    flexDirection: 'row',
    gap: 8,
  },
  patternBtn: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.ink,
    alignItems: 'center',
  },
  patternBtnActive: {
    backgroundColor: colors.lime,
    borderWidth: 2,
  },
  patternBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.ink,
  },
  patternBtnTextActive: {
    fontWeight: '900',
  },
  textInputBanner: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.ink,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
  },
  textureRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  textureThumb: {
    width: 60,
    height: 70,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.ink,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  textureThumbSelected: {
    borderColor: colors.lime,
    borderWidth: 3.5,
  },
  opacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  opacityLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink,
  },
  opacityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  opacityBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: theme.borders.radius.full,
    borderWidth: 1.5,
    borderColor: colors.ink,
    backgroundColor: '#F3F4F6',
  },
  opacityBtnActive: {
    backgroundColor: colors.lime,
  },
  opacityBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.ink,
  },
  opacityBtnTextActive: {
    fontWeight: '900',
  },
  shareToggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: theme.borders.radius.card,
    borderWidth: theme.borders.width,
    borderColor: colors.ink,
    padding: 16,
    ...theme.shadows.hard,
  },
  shareToggleTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.ink,
    marginBottom: 2,
  },
  shareToggleDesc: {
    fontSize: 12,
    color: '#6B7280',
    paddingRight: 10,
    lineHeight: 16,
  },
  addTextBtn: {
    marginTop: 14,
    backgroundColor: colors.lime,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: theme.borders.radius.full,
    borderWidth: theme.borders.width,
    borderColor: colors.ink,
    alignItems: 'center',
    ...theme.shadows.hardSmall,
  },
  addTextBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.ink,
  },
  addedTextsContainer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  addedTextsTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 8,
  },
  addedTextsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  addedTextChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: theme.borders.radius.full,
    borderWidth: 1.5,
    borderColor: colors.ink,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 4,
  },
  addedTextChipSelect: {
    marginRight: 6,
    maxWidth: 140,
  },
  addedTextChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.ink,
  },
  addedTextChipRemove: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addedTextChipRemoveText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.ink,
  },
  handleDotRemove: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.white,
    zIndex: 100,
    ...theme.shadows.hardSmall,
  },
  handleDotRemoveText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '900',
  },
  handleDotRotate: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.lime,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.ink,
    zIndex: 100,
    ...theme.shadows.hardSmall,
  },
  handleDotDuplicate: {
    position: 'absolute',
    bottom: -8,
    left: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.yellow,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.ink,
    zIndex: 100,
    ...theme.shadows.hardSmall,
  },
  handleDotText: {
    color: colors.ink,
    fontSize: 10,
    fontWeight: '900',
  },
  duplicateBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.yellow,
    borderWidth: 1.5,
    borderColor: colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.hardSmall,
  },
  duplicateBtnText: {
    fontSize: 13,
  },
  quickQuotesRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 6,
    marginBottom: 10,
  },
  quickQuoteChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.white,
    borderRadius: theme.borders.radius.full,
    borderWidth: 1.5,
    borderColor: colors.ink,
    ...theme.shadows.hardSmall,
  },
  quickQuoteText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.ink,
  },
  inlineEditCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.cobalt,
    padding: 12,
    marginBottom: 14,
    ...theme.shadows.hardSmall,
  },
  inlineEditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inlineEditTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.ink,
    flex: 1,
  },
  inlineEditCloseBtn: {
    backgroundColor: colors.lime,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: theme.borders.radius.full,
    borderWidth: 1.5,
    borderColor: colors.ink,
  },
  inlineEditCloseBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.ink,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  presetCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.ink,
    padding: 10,
    alignItems: 'center',
    ...theme.shadows.hardSmall,
  },
  presetCardActive: {
    borderColor: colors.cobalt,
    borderWidth: 2.5,
    backgroundColor: '#EFF6FF',
  },
  presetCardColorBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.ink,
    marginBottom: 6,
    ...theme.shadows.hardSmall,
  },
  presetCardName: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.ink,
    textAlign: 'center',
  },
  presetCardDesc: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    marginTop: 2,
    textAlign: 'center',
  },

  // Segmented Mode Switcher
  modeSwitchRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: theme.borders.radius.full,
    padding: 3,
    borderWidth: 1.5,
    borderColor: colors.ink,
  },
  modeSwitchBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: theme.borders.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeSwitchBtnActive: {
    backgroundColor: colors.white,
    ...theme.shadows.hardSmall,
  },
  modeSwitchBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.white,
  },
  modeSwitchBtnTextActive: {
    color: colors.ink,
    fontWeight: '900',
  },

  // Instagram Feed View
  igScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  igCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    borderWidth: theme.borders.width,
    borderColor: colors.ink,
    paddingVertical: 14,
    paddingHorizontal: 12,
    ...theme.shadows.hard,
  },
  igHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  igUserLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  igStoryRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    padding: 2.5,
    backgroundColor: '#DD2A7B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  igAvatarCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  igUserInfo: {
    gap: 2,
  },
  igUsername: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.ink,
  },
  igVerifiedBadge: {
    backgroundColor: '#3B82F6',
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  igVerifiedBadgeText: {
    fontSize: 9,
    color: colors.white,
    fontWeight: '900',
  },
  igLocationText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
  },
  igDotsMenu: {
    fontSize: 18,
    color: colors.ink,
    fontWeight: '900',
    paddingHorizontal: 4,
  },
  igStripCanvasContainer: {
    alignItems: 'center',
    marginVertical: 6,
  },
  igActionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    marginTop: 10,
    marginBottom: 6,
  },
  igActionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  igActionBtn: {
    padding: 2,
  },
  igLikesCountText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.ink,
    paddingHorizontal: 6,
    marginBottom: 6,
  },
  igCaptionSection: {
    paddingHorizontal: 6,
    marginBottom: 6,
  },
  igCaptionContent: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.ink,
  },
  igCaptionAuthor: {
    fontWeight: '900',
    color: colors.ink,
  },
  igHashtagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    paddingHorizontal: 6,
    marginBottom: 10,
  },
  igHashtagItem: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
  },
  igCommentsBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 10,
    marginHorizontal: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  igCommentText: {
    fontSize: 11,
    color: colors.ink,
    lineHeight: 16,
    marginBottom: 4,
  },
  igCommentAuthor: {
    fontWeight: '900',
  },
  igTimeAgo: {
    fontSize: 9,
    fontWeight: '800',
    color: '#9CA3AF',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  igButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 4,
    marginBottom: 8,
  },
  igPostNowBtn: {
    flex: 1.2,
    backgroundColor: colors.lime,
    paddingVertical: 11,
    borderRadius: theme.borders.radius.full,
    borderWidth: theme.borders.width,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.hardSmall,
  },
  igPostNowBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.ink,
  },
  igDownloadStripBtn: {
    flex: 1,
    backgroundColor: colors.yellow,
    paddingVertical: 11,
    borderRadius: theme.borders.radius.full,
    borderWidth: theme.borders.width,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.hardSmall,
  },
  igDownloadStripBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.ink,
  },
  igBackToEditBtn: {
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borders.radius.full,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: colors.ink,
    marginHorizontal: 4,
  },
  igBackToEditText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.ink,
  },

  // Strip Canvas helpers
  stripCanvasStatic: {
    transform: [{ scale: 1 }],
  },
  actionChipBtn: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: theme.borders.radius.full,
    borderWidth: 1.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.hardSmall,
  },
  actionChipBtnCamera: {
    backgroundColor: colors.lime,
  },
  actionChipBtnModel: {
    backgroundColor: colors.yellow,
  },
  actionChipBtnIg: {
    backgroundColor: '#FDE047',
  },
  actionChipBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.ink,
  },
  slotBadgeOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  slotBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.white,
  },
  photoSlotEmpty: {
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
  },
  slotEmptyIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  slotEmptyText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6B7280',
  },

  // Photos & Camera Tab
  startBoothBigBtn: {
    backgroundColor: colors.lime,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 8,
    ...theme.shadows.hardSmall,
  },
  startBoothBigBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.ink,
    textAlign: 'center',
  },
  photoToolsQuickRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  photoToolSubBtn: {
    flex: 1,
    backgroundColor: colors.white,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.hardSmall,
  },
  photoToolSubBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.ink,
  },
  filtersScrollContent: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  filterChipCard: {
    width: 90,
    paddingVertical: 8,
    paddingHorizontal: 6,
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.hardSmall,
  },
  filterChipCardActive: {
    backgroundColor: colors.lime,
    borderWidth: 2.5,
    borderColor: colors.ink,
  },
  filterChipLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.ink,
    textAlign: 'center',
  },
  filterChipLabelActive: {
    fontWeight: '900',
  },
  filterChipDesc: {
    fontSize: 8,
    fontWeight: '600',
    color: '#4B5563',
    textAlign: 'center',
    marginTop: 2,
  },
  slotThumbsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  slotThumbCard: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.ink,
    padding: 6,
    alignItems: 'center',
  },
  slotThumbPreview: {
    width: '100%',
    height: 70,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
    borderWidth: 1,
    borderColor: colors.ink,
    marginBottom: 6,
  },
  slotThumbEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotThumbNumberBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: colors.ink,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  slotThumbNumberText: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.white,
  },
  slotThumbActions: {
    flexDirection: 'row',
    gap: 6,
    width: '100%',
  },
  slotThumbActionBtn: {
    flex: 1,
    backgroundColor: colors.white,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.ink,
    alignItems: 'center',
  },
  slotThumbActionBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.ink,
  },

  // Photobooth Countdown Overlay
  shootingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.85)',
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shootingBox: {
    backgroundColor: colors.white,
    paddingVertical: 24,
    paddingHorizontal: 32,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: colors.ink,
    alignItems: 'center',
    ...theme.shadows.hard,
  },
  shootingStepLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: '#6B7280',
    marginBottom: 8,
    letterSpacing: 1,
  },
  shootingCountdownNum: {
    fontSize: 64,
    fontWeight: '900',
    color: colors.pink,
    marginVertical: 4,
  },
  shootingSubTip: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.ink,
  },
  flashScreen: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.white,
  },

  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  slotModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.white,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: colors.ink,
    padding: 20,
    ...theme.shadows.hard,
  },
  slotModalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.ink,
    marginBottom: 4,
  },
  slotModalSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 14,
  },
  slotModalItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.ink,
    marginBottom: 10,
    ...theme.shadows.hardSmall,
  },
  slotModalItemIcon: {
    fontSize: 26,
  },
  slotModalItemTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.ink,
  },
  slotModalItemDesc: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 2,
  },
  slotModalCloseBtn: {
    paddingVertical: 10,
    borderRadius: theme.borders.radius.full,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    marginTop: 4,
  },
  slotModalCloseText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.ink,
  },

  // Instagram Share Modal
  shareSheetCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.white,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: colors.ink,
    padding: 20,
    ...theme.shadows.hard,
  },
  shareSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  shareSheetTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.ink,
  },
  shareSheetCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.ink,
  },
  shareSheetSubtitle: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 16,
    marginBottom: 12,
  },
  shareInputLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 6,
  },
  shareCaptionInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.ink,
    padding: 10,
    fontSize: 13,
    color: colors.ink,
    marginBottom: 12,
    textAlignVertical: 'top',
  },
  shareHashtagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  shareTagChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: theme.borders.radius.full,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  shareTagChipActive: {
    backgroundColor: '#DBEAFE',
    borderColor: '#2563EB',
    borderWidth: 1.5,
  },
  shareTagChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },
  shareTagChipTextActive: {
    color: '#1D4ED8',
    fontWeight: '900',
  },
  sharePublicToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 14,
  },
  sharePublicTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.ink,
  },
  sharePublicDesc: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  shareConfirmBtn: {
    backgroundColor: colors.lime,
    paddingVertical: 12,
    borderRadius: theme.borders.radius.full,
    borderWidth: theme.borders.width,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.hardSmall,
  },
  shareConfirmBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.ink,
  },

  // Canvas Variations for Distinctive Layouts
  stripCanvasGrid: {
    width: 210,
  },
  stripCanvasPolaroid: {
    width: 190,
  },
  stripCanvasNeon: {
    borderColor: colors.lime,
    shadowColor: colors.lime,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  stripLocationSubtitle: {
    fontSize: 8,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 2,
    opacity: 0.8,
  },
  grid4Container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  grid4Slot: {
    width: 76,
    aspectRatio: 1,
  },
  cinematicSlot: {
    aspectRatio: 1.35,
  },
  duoSlot: {
    aspectRatio: 1.15,
  },
  duoNoteCard: {
    backgroundColor: '#FEF9C3',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.ink,
    padding: 8,
    marginTop: 4,
    ...theme.shadows.hardSmall,
  },
  duoNoteTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.ink,
    marginBottom: 4,
  },
  duoNoteContent: {
    fontSize: 9,
    fontStyle: 'italic',
    color: '#374151',
    lineHeight: 13,
  },
  duoNoteFooter: {
    fontSize: 8,
    fontWeight: '800',
    color: '#6B7280',
    marginTop: 6,
    textAlign: 'right',
  },
  polaroidContainer: {
    alignItems: 'center',
  },
  polaroidSlot: {
    width: '100%',
    aspectRatio: 1,
  },
  polaroidFooterArea: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  polaroidCaptionText: {
    fontSize: 11,
    fontWeight: '900',
    fontStyle: 'italic',
  },

  // Timestamp on photos
  slotTimestampBadge: {
    position: 'absolute',
    bottom: 3,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 3,
  },
  slotTimestampText: {
    fontFamily: 'monospace',
    fontSize: 8,
    fontWeight: '900',
    color: '#F97316',
  },

  // Seal Stamp Badge
  sealStampBadge: {
    position: 'absolute',
    bottom: 22,
    right: 6,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#DC2626',
    backgroundColor: 'rgba(254, 226, 226, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-12deg' }],
    zIndex: 25,
  },
  sealStampInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealStampTitle: {
    fontSize: 6,
    fontWeight: '900',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  sealStampIcon: {
    fontSize: 12,
  },
  sealStampSub: {
    fontSize: 6,
    fontWeight: '900',
    color: '#DC2626',
  },

  // Signature Footer
  signatureFooter: {
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 4,
  },
  signatureText: {
    fontSize: 7.5,
    fontWeight: '900',
    letterSpacing: 0.5,
    opacity: 0.85,
  },
  signatureSerial: {
    fontSize: 6.5,
    fontFamily: 'monospace',
    fontWeight: '800',
    opacity: 0.7,
    marginTop: 1,
  },

  // Film Perforations
  filmPerforationsColumn: {
    position: 'absolute',
    top: 30,
    bottom: 30,
    width: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 20,
  },
  filmHole: {
    width: 6,
    height: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.ink,
    borderRadius: 2,
  },

  // Washi Tape Corners
  washiTapeCorner: {
    position: 'absolute',
    width: 36,
    height: 12,
    zIndex: 30,
  },
  washiTapeTopLeft: {
    top: -4,
    left: -4,
    transform: [{ rotate: '-35deg' }],
  },
  washiTapeBottomRight: {
    bottom: -4,
    right: -4,
    transform: [{ rotate: '-35deg' }],
  },
  washiTapeInner: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(253, 224, 71, 0.85)',
    borderWidth: 1,
    borderColor: colors.ink,
    borderRadius: 2,
  },

  // Layout Tab
  layoutOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  layoutOptionCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.ink,
    padding: 10,
    alignItems: 'center',
    ...theme.shadows.hardSmall,
  },
  layoutOptionCardActive: {
    backgroundColor: colors.lime,
    borderWidth: 2.5,
  },
  layoutOptionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  layoutOptionName: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.ink,
    textAlign: 'center',
  },
  layoutOptionNameActive: {
    fontWeight: '900',
  },
  layoutOptionDesc: {
    fontSize: 9,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 2,
  },
  layoutSlotCountBadge: {
    marginTop: 6,
    backgroundColor: colors.ink,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  layoutSlotCountText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.white,
  },

  // Signature Tab
  signatureInputLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 4,
  },
  signatureTextInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.ink,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.ink,
    marginBottom: 10,
  },
  randomSerialBtn: {
    backgroundColor: colors.yellow,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.ink,
    ...theme.shadows.hardSmall,
  },
  randomSerialBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.ink,
  },
  signatureToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    marginBottom: 6,
  },
  signatureToggleTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.ink,
  },
  signatureToggleDesc: {
    fontSize: 10,
    color: '#6B7280',
  },
  locationChipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  locationChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: theme.borders.radius.full,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: colors.ink,
  },
  locationChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.ink,
  },
  sealStampsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
    marginBottom: 10,
  },
  sealStampCard: {
    width: 85,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.hardSmall,
  },
  sealStampCardActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#DC2626',
    borderWidth: 2.5,
  },
  sealStampCardTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.ink,
    textAlign: 'center',
  },
  sealStampCardTitleActive: {
    color: '#DC2626',
    fontWeight: '900',
  },

  // Border Style Tab
  edgeStylesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  edgeStyleCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.ink,
    padding: 10,
    alignItems: 'center',
    ...theme.shadows.hardSmall,
  },
  edgeStyleCardActive: {
    backgroundColor: colors.lime,
    borderWidth: 2.5,
  },
  edgeStyleIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  edgeStyleName: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.ink,
    textAlign: 'center',
  },
  edgeStyleNameActive: {
    fontWeight: '900',
  },
  edgeStyleDesc: {
    fontSize: 9,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 2,
  },

  // Gradient Theme Options
  gradientOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  gradientOptionChip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: theme.borders.radius.full,
    borderWidth: 1.5,
    borderColor: colors.ink,
    ...theme.shadows.hardSmall,
  },
  gradientOptionChipActive: {
    borderWidth: 3,
    borderColor: colors.cobalt,
  },
  gradientOptionText: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.ink,
  },

  // Instagram Studio Styles
  igPostHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderBottomWidth: 1.5,
    borderBottomColor: '#E5E7EB',
  },
  igBackToEditTopBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  igBackToEditTopText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.ink,
  },
  igPostHeaderTopTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.ink,
  },
  igPublishTopBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: colors.lime,
    borderWidth: 1.5,
    borderColor: colors.ink,
    ...theme.shadows.hardSmall,
  },
  igPublishTopText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.ink,
  },
  igStudioMainContainer: {
    flex: 1,
    backgroundColor: '#FF4F8B',
  },
  igTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FF4F8B',
  },
  igTopIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  igTopIconText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  igTitlePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
    maxWidth: 130,
  },
  igTitlePillIcon: {
    fontSize: 13,
  },
  igTitlePillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  igTitlePillEdit: {
    fontSize: 10,
  },
  igTopToolsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  igTopToolBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  igTopToolBtnActive: {
    backgroundColor: colors.lime,
  },
  igTopToolText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  igTopToolIcon: {
    fontSize: 15,
  },
  canvasStudioWrapper: {
    flex: 1,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  canvasScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  canvasInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvasQuickBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 12,
  },
  canvasQuickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  canvasQuickChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F4F4F5',
  },
  igStudioBottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FF4F8B',
    borderTopWidth: 2,
    borderTopColor: colors.ink,
  },
  igBottomLeftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.ink,
  },
  igBottomCenterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.ink,
  },
  igBottomBtnIcon: {
    fontSize: 15,
  },
  igBottomBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.ink,
  },
  igNextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.lime,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.ink,
    ...theme.shadows.hardSmall,
  },
  igNextBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.ink,
  },
  igNextBtnArrow: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.ink,
  },
  igFilterCarouselBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderTopWidth: 2,
    borderTopColor: colors.ink,
  },
  igFilterCarouselScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  igFilterItem: {
    alignItems: 'center',
    marginHorizontal: 6,
  },
  igFilterBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  igFilterBubbleActive: {
    borderColor: colors.ink,
    borderWidth: 2.5,
    backgroundColor: '#FEF08A',
    transform: [{ scale: 1.06 }],
  },
  igFilterLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4B5563',
    marginTop: 3,
  },
  igFilterLabelActive: {
    color: colors.ink,
    fontWeight: '900',
  },
  igFilterCloseBtn: {
    backgroundColor: colors.lime,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.ink,
    marginLeft: 4,
  },
  igFilterCloseText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.ink,
  },
  sheetBackdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
    zIndex: 40,
  },
  sheetDrawer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '56%',
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 2.5,
    borderColor: colors.ink,
    padding: 16,
    paddingBottom: 24,
    zIndex: 50,
    ...theme.shadows.hard,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: colors.ink,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 10,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.ink,
  },
  sheetCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetCloseText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.ink,
  },
  sheetScrollBody: {
    paddingBottom: 20,
  },
  sheetSectionLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.ink,
    marginBottom: 8,
  },
  sheetQuickChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.ink,
    marginRight: 6,
  },
  sheetQuickChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.ink,
  },
  sheetBgChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    marginRight: 6,
  },
  sheetBgChipActive: {
    borderColor: colors.ink,
    backgroundColor: colors.lime,
  },
  sheetBgChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.ink,
  },
  sheetBgChipTextActive: {
    color: colors.ink,
    fontWeight: '900',
  },
  textInputSheet: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.ink,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 12,
  },
  addTextConfirmBtn: {
    backgroundColor: colors.lime,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    marginTop: 10,
    ...theme.shadows.hardSmall,
  },
  addTextConfirmBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.ink,
  },
  sealStampsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  floatingItemToolbar: {
    position: 'absolute',
    bottom: 70,
    left: 14,
    right: 14,
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: colors.ink,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 60,
    ...theme.shadows.hard,
  },
  floatingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 90,
  },
  floatingItemEmoji: {
    fontSize: 16,
  },
  floatingItemTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.ink,
  },
  floatingItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  floatingMiniBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingMiniBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.ink,
  },
  renameModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.white,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: colors.ink,
    padding: 20,
    ...theme.shadows.hard,
  },
  renameModalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.ink,
    marginBottom: 12,
  },
  renameInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.ink,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 16,
  },
  renameButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  renameCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.ink,
    backgroundColor: '#F3F4F6',
  },
  renameCancelText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.ink,
  },
  renameSaveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.ink,
    backgroundColor: colors.lime,
  },
  renameSaveText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.ink,
  },

  // --- LEAFYBOOTH SIGNATURE STUDIO STYLES (STICKER POP) ---
  leafyStudioContainer: {
    flex: 1,
    backgroundColor: '#FF4F8B',
  },
  studioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FF4F8B',
  },
  studioHeaderBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.ink,
    ...theme.shadows.hardSmall,
  },
  studioHeaderBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.ink,
  },
  studioTitlePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.ink,
    maxWidth: 130,
    ...theme.shadows.hardSmall,
  },
  studioTitleIcon: {
    fontSize: 14,
  },
  studioTitleText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.ink,
  },
  studioTitleEditIcon: {
    fontSize: 11,
  },
  studioCtaBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.lime,
    borderWidth: 2,
    borderColor: colors.ink,
    ...theme.shadows.hardSmall,
  },
  studioCtaBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.ink,
  },
  canvasCraftMat: {
    backgroundColor: 'transparent',
    paddingVertical: 6,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvasActionPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.ink,
    ...theme.shadows.hardSmall,
  },
  canvasActionPillCamera: {
    backgroundColor: colors.lime,
  },
  canvasActionPillNew: {
    backgroundColor: '#A7F3D0',
  },
  canvasActionPillModel: {
    backgroundColor: '#E0F2FE',
  },
  canvasActionPillClear: {
    backgroundColor: '#FCE7F3',
  },
  canvasActionPillText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.ink,
  },
  studioDockWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'transparent',
  },
  studioDockScroll: {
    backgroundColor: colors.white,
    borderRadius: 28,
    borderWidth: 2.5,
    borderColor: colors.ink,
    paddingHorizontal: 8,
    paddingVertical: 6,
    ...theme.shadows.hard,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dockItemBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 18,
  },
  dockItemBtnActive: {
    backgroundColor: colors.lime,
    borderWidth: 1.5,
    borderColor: colors.ink,
  },
  dockItemIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  dockItemLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4B5563',
  },
  dockItemLabelActive: {
    color: colors.ink,
    fontWeight: '900',
  },

  // Korean Filter Strip
  filterStripContainer: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: colors.ink,
    padding: 12,
    ...theme.shadows.hard,
  },
  filterStripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  filterStripTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.ink,
  },
  filterStripCloseBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: colors.lime,
    borderWidth: 1.5,
    borderColor: colors.ink,
  },
  filterStripCloseText: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.ink,
  },
  filterCardsScroll: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4,
  },
  koreanFilterCard: {
    width: 78,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  koreanFilterCardActive: {
    backgroundColor: '#FEF08A',
    borderColor: colors.ink,
    borderWidth: 2.5,
    ...theme.shadows.hardSmall,
  },
  koreanFilterIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  koreanFilterLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4B5563',
    textAlign: 'center',
  },
  koreanFilterLabelActive: {
    color: colors.ink,
    fontWeight: '900',
  },
  koreanFilterActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.ink,
    marginTop: 4,
  },

  // Leafy Sheet Drawer
  leafySheetDrawer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '58%',
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 3,
    borderColor: colors.ink,
    padding: 18,
    paddingBottom: 28,
    zIndex: 50,
    ...theme.shadows.hard,
  },
  leafySheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: colors.ink,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 14,
  },
  leafySheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  leafySheetTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.ink,
  },
  leafySheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leafySheetCloseText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.ink,
  },
  leafyTextInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.ink,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 12,
  },
  leafyQuickChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.ink,
    marginRight: 8,
  },
  leafyQuickChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.ink,
  },
  leafyBgChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    marginRight: 8,
  },
  leafyBgChipActive: {
    borderColor: colors.ink,
    borderWidth: 2,
    backgroundColor: colors.lime,
    ...theme.shadows.hardSmall,
  },
  leafyBgChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6B7280',
  },
  leafyBgChipTextActive: {
    color: colors.ink,
    fontWeight: '900',
  },
  leafyConfirmBtn: {
    backgroundColor: colors.lime,
    paddingVertical: 13,
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: colors.ink,
    alignItems: 'center',
    marginTop: 10,
    ...theme.shadows.hardSmall,
  },
  leafyConfirmBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.ink,
  },

  // Social Showcase Mode Styles
  showcaseTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FF4F8B',
    borderBottomWidth: 2.5,
    borderBottomColor: colors.ink,
  },
  showcaseBackBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.ink,
    ...theme.shadows.hardSmall,
  },
  showcaseBackBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.ink,
  },
  showcaseTitleBadge: {
    backgroundColor: '#FEF08A',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.ink,
  },
  showcaseTitleText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.ink,
  },
  showcasePublishBtn: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: colors.lime,
    borderWidth: 1.5,
    borderColor: colors.ink,
    ...theme.shadows.hardSmall,
  },
  showcasePublishBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.ink,
  },
  leafySocialCard: {
    backgroundColor: colors.white,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: colors.ink,
    padding: 18,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 20,
    ...theme.shadows.hard,
  },
  socialCardWashiTape: {
    alignSelf: 'center',
    backgroundColor: '#FEF08A',
    paddingHorizontal: 18,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.ink,
    marginBottom: 14,
    transform: [{ rotate: '-1deg' }],
  },
  socialCardWashiText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: 1,
  },
  socialAvatarRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.lime,
    borderWidth: 2,
    borderColor: colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialAvatarInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialUsername: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.ink,
  },
  socialVerifiedBadge: {
    backgroundColor: '#10B981',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialVerifiedText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '900',
  },
  socialLocationText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '700',
    marginTop: 2,
  },
  socialStripWrapper: {
    alignItems: 'center',
    marginVertical: 14,
  },
  socialActionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  socialActionBtn: {
    padding: 4,
  },
  socialLikesText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.ink,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  socialCaptionAuthor: {
    fontWeight: '900',
    color: colors.ink,
  },
  socialHashtagItem: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284C7',
  },
  socialCtaRow: {
    gap: 10,
    marginTop: 18,
  },
  socialDownloadBtn: {
    backgroundColor: colors.lime,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: colors.ink,
    alignItems: 'center',
    ...theme.shadows.hardSmall,
  },
  socialDownloadBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.ink,
  },
  socialShareTrendingBtn: {
    backgroundColor: '#FF4F8B',
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: colors.ink,
    alignItems: 'center',
    ...theme.shadows.hardSmall,
  },
  socialShareTrendingBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.white,
  },
  shareSheetSectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 8,
  },
  shareTagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  // --- TEMPLATE GALLERY STYLES ---
  studioHeaderTemplateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF08A',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.ink,
    ...theme.shadows.hardSmall,
  },
  studioHeaderTemplateText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.ink,
  },
  studioHeaderNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#A7F3D0',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.ink,
    ...theme.shadows.hardSmall,
  },
  studioHeaderNewBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.ink,
  },
  studioHeaderRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  studioBoothBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.ink,
    ...theme.shadows.hardSmall,
  },
  studioBoothBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.ink,
  },
  canvasActionPillTemplate: {
    backgroundColor: '#FEF08A',
  },
  templateQuickActionRow: {
    marginBottom: 12,
  },
  templateBlankBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.ink,
    borderStyle: 'dashed',
  },
  templateBlankIcon: {
    fontSize: 14,
  },
  templateBlankText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.ink,
  },
  templateCategoryScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 12,
  },
  templateCatChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
  },
  templateCatChipActive: {
    backgroundColor: colors.lime,
    borderColor: colors.ink,
    borderWidth: 2,
    ...theme.shadows.hardSmall,
  },
  templateCatChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4B5563',
  },
  templateCatChipTextActive: {
    color: colors.ink,
    fontWeight: '900',
  },
  templateCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  templatePresetCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.ink,
    overflow: 'hidden',
    ...theme.shadows.hardSmall,
  },
  templatePresetCardActive: {
    borderColor: colors.cobalt,
    borderWidth: 2.5,
    ...theme.shadows.hard,
  },
  templateCardPreview: {
    height: 72,
    padding: 8,
    position: 'relative',
    justifyContent: 'space-between',
    borderBottomWidth: 1.5,
    borderBottomColor: colors.ink,
  },
  templateCardIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  templateCardCategoryBadge: {
    position: 'absolute',
    top: 7,
    right: 7,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.ink,
  },
  templateCardCategoryBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.ink,
  },
  templateCardStickersMiniRow: {
    flexDirection: 'row',
    gap: 3,
    alignSelf: 'flex-end',
  },
  templateCardInfo: {
    padding: 10,
  },
  templateCardTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.ink,
    marginBottom: 2,
  },
  templateCardDesc: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
    lineHeight: 14,
    marginBottom: 8,
    height: 28,
  },
  templateApplyPill: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.ink,
    alignItems: 'center',
  },
  templateApplyPillActive: {
    backgroundColor: colors.lime,
  },
  templateApplyText: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.ink,
  },
  templateApplyTextActive: {
    color: colors.ink,
  },
  // Contextual Bottom Bar (Thay thế Dock khi chọn Sticker/Chữ)
  contextualBottomBar: {
    backgroundColor: colors.white,
    borderRadius: 28,
    borderWidth: 2.5,
    borderColor: colors.ink,
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...theme.shadows.hard,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contextItemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.ink,
    maxWidth: 105,
  },
  contextItemEmoji: {
    fontSize: 16,
  },
  contextItemTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.ink,
  },
  contextActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contextMiniBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contextMiniBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.ink,
  },
  contextDeleteBtn: {
    backgroundColor: '#FEE2E2',
    borderColor: '#DC2626',
  },
  contextDoneBtn: {
    backgroundColor: colors.lime,
    borderColor: colors.ink,
  },
});
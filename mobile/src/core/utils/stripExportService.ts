import { Platform } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import QRCode from 'qrcode';
import { StripItem, GardenItem } from '../../features/garden/hooks/useGardenStore';

/**
 * Tải xuống tệp dữ liệu Data URL trên trình duyệt web
 */
function downloadDataUrlOnWeb(dataUrl: string, filename: string) {
  if (typeof document === 'undefined') return;
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Tạo một Image object và nạp ảnh hỗ trợ CORS an toàn
 */
function loadImageSafe(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(null);
      return;
    }
    const img = new (window as any).Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Thử lại không có crossOrigin nếu server không hỗ trợ CORS
      const retryImg = new (window as any).Image();
      retryImg.onload = () => resolve(retryImg);
      retryImg.onerror = () => resolve(null);
      retryImg.src = src;
    };
    img.src = src;
  });
}

/**
 * Vẽ khung ảnh giả lập nghệ thuật nếu ảnh từ xa bị chặn CORS
 */
function drawStylizedPhotoSlot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  index: number,
  authorName: string
) {
  // Nền gradient pastel phong cách film
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  const colorsList = [
    ['#FEE2E2', '#FECDD3'],
    ['#FEF3C7', '#FDE68A'],
    ['#E0F2FE', '#BAE6FD'],
    ['#DCFCE7', '#BBF7D0'],
  ];
  const pair = colorsList[index % 4];
  grad.addColorStop(0, pair[0]);
  grad.addColorStop(1, pair[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);

  // Sticker trang trí trong ô
  ctx.fillStyle = '#111111';
  ctx.font = '900 24px sans-serif';
  ctx.textAlign = 'center';
  const emojis = ['✨', '🌸', '🌿', '⭐'];
  ctx.fillText(emojis[index % 4], x + w / 2, y + h / 2 - 8);

  ctx.font = '800 13px sans-serif';
  ctx.fillStyle = '#1F2937';
  ctx.fillText(`Khung #${index + 1} · ${authorName}`, x + w / 2, y + h / 2 + 20);
}

/**
 * Xuất dải ảnh Photobooth 4 khung thành file PNG độ nét cao
 */
export async function exportStripToImage(
  strip: StripItem,
  eventName: string,
  eventDate: string,
  index: number = 1
): Promise<boolean> {
  const filename = `leafybooth_${eventName.replace(/\s+/g, '_')}_dai_${strip.authorName}_${index}.png`;

  if (Platform.OS === 'web') {
    const drawAndExport = async (allowExternalImages: boolean): Promise<boolean> => {
      const canvas = document.createElement('canvas');
      canvas.width = 440;
      canvas.height = 1260;
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;

      // 1. Nền dải ảnh Sticker Pop
      ctx.fillStyle = strip.stripColor || '#FF8FC7';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Viền dày Sticker Pop
      ctx.strokeStyle = '#111111';
      ctx.lineWidth = 8;
      ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

      // 2. Header thương hiệu
      ctx.fillStyle = '#111111';
      ctx.font = '900 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🌿 LEAFYBOOTH PHOTOBOOTH', canvas.width / 2, 42);

      ctx.font = '800 13px sans-serif';
      ctx.fillStyle = '#262626';
      ctx.fillText(`${eventName} · ${eventDate}`, canvas.width / 2, 64);

      // 3. 4 khung ảnh
      const photoWidth = 380;
      const photoHeight = 240;
      const startX = 30;
      const startY = 82;
      const gap = 18;

      for (let i = 0; i < 4; i++) {
        const y = startY + i * (photoHeight + gap);

        // Khung trắng đệm cho mỗi ảnh
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(startX, y, photoWidth, photoHeight);

        let imageDrawn = false;
        if (allowExternalImages && strip.photos[i]) {
          const img = await loadImageSafe(strip.photos[i]);
          if (img) {
            try {
              ctx.drawImage(img, startX + 4, y + 4, photoWidth - 8, photoHeight - 8);
              imageDrawn = true;
            } catch {
              imageDrawn = false;
            }
          }
        }

        if (!imageDrawn) {
          drawStylizedPhotoSlot(ctx, startX + 4, y + 4, photoWidth - 8, photoHeight - 8, i, strip.authorName);
        }

        // Viền từng khung ảnh
        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 4;
        ctx.strokeRect(startX, y, photoWidth, photoHeight);
      }

      // 4. Footer & Watermark
      const footerY = startY + 4 * (photoHeight + gap) + 14;

      // Huy hiệu tác giả
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(startX, footerY, 140, 34);
      ctx.strokeStyle = '#111111';
      ctx.lineWidth = 3;
      ctx.strokeRect(startX, footerY, 140, 34);

      ctx.fillStyle = '#111111';
      ctx.font = '900 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`👤 ${strip.authorName}`, startX + 12, footerY + 22);

      // Watermark app
      ctx.textAlign = 'right';
      ctx.font = '900 13px sans-serif';
      ctx.fillStyle = '#111111';
      ctx.fillText('leafybooth.app 🌿', canvas.width - startX, footerY + 22);

      try {
        const dataUrl = canvas.toDataURL('image/png');
        downloadDataUrlOnWeb(dataUrl, filename);
        return true;
      } catch (err) {
        // Nếu canvas bị dính bảo mật do ảnh từ xa, vẽ lại chế độ an toàn nội bộ
        if (allowExternalImages) {
          return drawAndExport(false);
        }
        return false;
      }
    };

    return drawAndExport(true);
  } else {
    // Trên Native thiết bị thật
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        const firstPhoto = strip.photos[0] || 'https://picsum.photos/400/400';
        await MediaLibrary.saveToLibraryAsync(firstPhoto);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}

/**
 * Tải toàn bộ tất cả dải ảnh trong Album sự kiện về máy
 */
export async function downloadAllAlbumStrips(event: GardenItem): Promise<number> {
  let count = 0;
  for (let i = 0; i < event.strips.length; i++) {
    const strip = event.strips[i];
    await exportStripToImage(strip, event.name, event.date, i + 1);
    count++;
    if (Platform.OS === 'web') {
      await new Promise((resolve) => setTimeout(resolve, 350));
    }
  }
  return count;
}

/**
 * Xuất hình ảnh Tấm vé sự kiện (Event Pass) có mã QR thật 100% thành file PNG
 */
export async function exportTicketToImage(event: GardenItem): Promise<boolean> {
  const filename = `leafybooth_ve_su_kien_${event.joinCode}.png`;

  if (Platform.OS === 'web') {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 500;
      canvas.height = 760;
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;

      // 1. Nền vé vàng retro
      ctx.fillStyle = '#FFD93D';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Viền dày Sticker Pop
      ctx.strokeStyle = '#111111';
      ctx.lineWidth = 8;
      ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

      // 2. Header
      ctx.fillStyle = '#111111';
      ctx.font = '900 15px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('🌿 LEAFYBOOTH EVENT PASS', 30, 48);

      // Huy hiệu chế độ
      ctx.fillStyle = '#C8F135';
      ctx.fillRect(canvas.width - 160, 28, 130, 28);
      ctx.strokeStyle = '#111111';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(canvas.width - 160, 28, 130, 28);

      ctx.fillStyle = '#111111';
      ctx.font = '900 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(event.mode === 'shared' ? 'CO-OP 4 KHUNG' : 'ALBUM CHUNG', canvas.width - 95, 46);

      // 3. Tên sự kiện & Thông tin
      ctx.textAlign = 'left';
      ctx.font = '900 28px sans-serif';
      ctx.fillStyle = '#111111';
      ctx.fillText(event.name, 30, 96);

      ctx.font = '700 15px sans-serif';
      ctx.fillStyle = '#374151';
      ctx.fillText(`📅 ${event.date} · 📍 Leafy Garden`, 30, 126);

      ctx.font = '800 14px sans-serif';
      ctx.fillStyle = '#111111';
      ctx.fillText(`👥 ${event.memberCount} thành viên · 📸 ${event.strips.length} dải ảnh`, 30, 154);

      // 4. Rãnh xé vé retro (Perforation line)
      const notchY = 210;
      ctx.fillStyle = '#3D5AFE';
      ctx.beginPath();
      ctx.arc(0, notchY, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(canvas.width, notchY, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Đường kẻ nét đứt
      ctx.setLineDash([8, 6]);
      ctx.strokeStyle = '#111111';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(25, notchY);
      ctx.lineTo(canvas.width - 25, notchY);
      ctx.stroke();
      ctx.setLineDash([]);

      // 5. Sinh mã QR thật 100% bằng thư viện qrcode nội bộ (hoàn toàn an toàn, không tốn mạng)
      const qrDataUrl = await QRCode.toDataURL(
        `https://leafybooth.app/garden/${event.joinCode}`,
        {
          width: 250,
          margin: 1,
          color: {
            dark: '#111111',
            light: '#FFFFFF',
          },
        }
      );

      const qrImg = await loadImageSafe(qrDataUrl);
      const qrSize = 240;
      const qrX = (canvas.width - qrSize) / 2;
      const qrY = 250;

      // Khung nền trắng cho QR
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(qrX, qrY, qrSize, qrSize);
      ctx.strokeStyle = '#111111';
      ctx.lineWidth = 4;
      ctx.strokeRect(qrX, qrY, qrSize, qrSize);

      if (qrImg) {
        ctx.drawImage(qrImg, qrX + 8, qrY + 8, qrSize - 16, qrSize - 16);
      }

      // Huy hiệu lá ở tâm QR
      ctx.fillStyle = '#C8F135';
      ctx.beginPath();
      ctx.arc(canvas.width / 2, qrY + qrSize / 2, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#111111';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🌿', canvas.width / 2, qrY + qrSize / 2 + 8);

      // Mã mời chữ to
      ctx.textAlign = 'center';
      ctx.font = '900 32px sans-serif';
      ctx.fillStyle = '#111111';
      ctx.fillText(`MÃ MỜI: ${event.joinCode}`, canvas.width / 2, 545);

      ctx.font = '700 14px sans-serif';
      ctx.fillStyle = '#4B5563';
      ctx.fillText('Quét QR bằng Camera hoặc nhập mã trong app LeafyBooth', canvas.width / 2, 575);

      // Watermark ở chân vé
      ctx.font = '800 12px sans-serif';
      ctx.fillStyle = '#111111';
      ctx.fillText('leafybooth.app · Plant a moment 🌿', canvas.width / 2, 720);

      const dataUrl = canvas.toDataURL('image/png');
      downloadDataUrlOnWeb(dataUrl, filename);
      return true;
    } catch (e) {
      console.error('Lỗi khi vẽ vé canvas:', e);
      return false;
    }
  }
  return true;
}

/**
 * Xuất Frame do người dùng tự thiết kế từ Studio thành file PNG HD
 */
export async function exportStudioFrameToImage(options: {
  frameName: string;
  backgroundColor: string;
  borderColor: string;
  pattern: 'solid' | 'dots' | 'stripes' | 'stars';
  customText: string;
  textPosition: 'top' | 'middle' | 'bottom';
  textColor: string;
  stickers: { id: string; emoji: string; x: number; y: number; size?: number; rotation?: number }[];
  textItems?: {
    id: string;
    text: string;
    x: number;
    y: number;
    fontSize?: number;
    rotation?: number;
    color?: string;
    bgColor?: string;
    fontStyleType?: 'modern_bold' | 'handwriting' | 'typewriter' | 'aesthetic_serif' | 'bubble_cute' | 'neon_cyber';
  }[];
  slotPhotos?: (string | null)[];
  photoFilter?: string;
  frameLayout?: 'strip_4' | 'grid_4' | 'strip_3' | 'duo_note' | 'polaroid_1';
  frameEdgeStyle?:
    | 'classic'
    | 'film_perforated'
    | 'stamp_scallop'
    | 'washi_corners'
    | 'neon_glow'
    | 'ticket_stub'
    | 'vhs_camcorder'
    | 'heart_cutout';
  creatorName?: string;
  serialNumber?: string;
  showTimestamp?: boolean;
  timestampText?: string;
  locationTag?: string;
  sealStamp?: string;
  washiTapeStyle?: string;
  gradientTheme?: string;
}): Promise<boolean> {
  const safeName = (options.frameName.trim() || 'my_frame').replace(/\s+/g, '_');
  const filename = `leafybooth_frame_${safeName}.png`;

  if (Platform.OS === 'web') {
    try {
      const layout = options.frameLayout || 'strip_4';
      const canvas = document.createElement('canvas');

      // Thiết lập kích thước canvas dựa theo bố cục khung
      if (layout === 'grid_4') {
        canvas.width = 560;
        canvas.height = 700;
      } else if (layout === 'strip_3') {
        canvas.width = 440;
        canvas.height = 1240;
      } else if (layout === 'duo_note') {
        canvas.width = 440;
        canvas.height = 1120;
      } else if (layout === 'polaroid_1') {
        canvas.width = 440;
        canvas.height = 600;
      } else {
        // Mặc định strip_4
        canvas.width = 440;
        canvas.height = 1540;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return false;

      const scale = canvas.width / 172; // Tỷ lệ phóng to

      // 1. Nền dải ảnh (Gradient hoặc Màu đơn)
      if (options.gradientTheme === 'sunset') {
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, '#FF8DA1');
        grad.addColorStop(0.5, '#FFA07A');
        grad.addColorStop(1, '#FFD166');
        ctx.fillStyle = grad;
      } else if (options.gradientTheme === 'ocean') {
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, '#A7F3D0');
        grad.addColorStop(0.5, '#6EE7B7');
        grad.addColorStop(1, '#60A5FA');
        ctx.fillStyle = grad;
      } else if (options.gradientTheme === 'cyber') {
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, '#C084FC');
        grad.addColorStop(0.5, '#818CF8');
        grad.addColorStop(1, '#1E1B4B');
        ctx.fillStyle = grad;
      } else if (options.gradientTheme === 'cherry') {
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, '#FFE4E6');
        grad.addColorStop(0.5, '#FDA4AF');
        grad.addColorStop(1, '#FB7185');
        ctx.fillStyle = grad;
      } else if (options.gradientTheme === 'lavender') {
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, '#F3E8FF');
        grad.addColorStop(0.5, '#D8B4FE');
        grad.addColorStop(1, '#A855F7');
        ctx.fillStyle = grad;
      } else if (options.gradientTheme === 'matcha') {
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, '#DCFCE7');
        grad.addColorStop(0.5, '#86EFAC');
        grad.addColorStop(1, '#22C55E');
        ctx.fillStyle = grad;
      } else if (options.gradientTheme === 'midnight') {
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, '#312E81');
        grad.addColorStop(0.5, '#1E1B4B');
        grad.addColorStop(1, '#0F172A');
        ctx.fillStyle = grad;
      } else if (options.gradientTheme === 'kraft') {
        ctx.fillStyle = '#F4E8C1';
      } else {
        ctx.fillStyle = options.backgroundColor || '#FF8FC7';
      }
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Họa tiết nền nếu có
      if (options.pattern === 'dots') {
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        for (let x = 15; x < canvas.width; x += 30) {
          for (let y = 15; y < canvas.height; y += 30) {
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else if (options.pattern === 'stripes') {
        ctx.fillStyle = 'rgba(0,0,0,0.06)';
        for (let i = -canvas.height; i < canvas.width; i += 36) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i + 18, 0);
          ctx.lineTo(i + 18 + canvas.height, canvas.height);
          ctx.lineTo(i + canvas.height, canvas.height);
          ctx.closePath();
          ctx.fill();
        }
      }

      // 3. Tiêu đề thương hiệu LEAFYBOOTH & Tọa độ
      ctx.textAlign = 'center';
      ctx.fillStyle = options.textColor || '#111111';
      ctx.font = '900 16px sans-serif';
      ctx.fillText('LEAFYBOOTH', canvas.width / 2, 42);

      if (options.locationTag) {
        ctx.font = '700 11px sans-serif';
        ctx.fillStyle = options.textColor || '#4B5563';
        ctx.fillText(options.locationTag, canvas.width / 2, 58);
      }

      // 4. Nếu có chữ ở vị trí TOP
      if (options.textPosition === 'top' && options.customText?.trim()) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(40, 70, canvas.width - 80, 36);
        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 3;
        ctx.strokeRect(40, 70, canvas.width - 80, 36);

        ctx.fillStyle = options.textColor || '#111111';
        ctx.font = '900 16px sans-serif';
        ctx.fillText(options.customText, canvas.width / 2, 94);
      }

      // 5. Tính toán vị trí các ô ảnh theo bố cục (Layout Coordinates)
      interface SlotCoord {
        x: number;
        y: number;
        w: number;
        h: number;
      }
      const slotCoords: SlotCoord[] = [];

      if (layout === 'grid_4') {
        const slotW = (canvas.width - 70 - 16) / 2;
        const slotH = slotW;
        const startY = 85;
        slotCoords.push({ x: 35, y: startY, w: slotW, h: slotH });
        slotCoords.push({ x: 35 + slotW + 16, y: startY, w: slotW, h: slotH });
        slotCoords.push({ x: 35, y: startY + slotH + 16, w: slotW, h: slotH });
        slotCoords.push({ x: 35 + slotW + 16, y: startY + slotH + 16, w: slotW, h: slotH });
      } else if (layout === 'strip_3') {
        const slotW = canvas.width - 70;
        const slotH = slotW * 0.75;
        const startY = 85;
        const gapY = 22;
        for (let i = 0; i < 3; i++) {
          slotCoords.push({ x: 35, y: startY + i * (slotH + gapY), w: slotW, h: slotH });
        }
      } else if (layout === 'duo_note') {
        const slotW = canvas.width - 70;
        const slotH = slotW * 0.82;
        const startY = 85;
        const gapY = 20;
        slotCoords.push({ x: 35, y: startY, w: slotW, h: slotH });
        slotCoords.push({ x: 35, y: startY + slotH + gapY, w: slotW, h: slotH });
      } else if (layout === 'polaroid_1') {
        const slotW = canvas.width - 70;
        const slotH = slotW;
        slotCoords.push({ x: 35, y: 75, w: slotW, h: slotH });
      } else {
        // strip_4 (mặc định)
        const slotW = canvas.width - 70;
        const slotH = slotW * 0.85;
        const startY = 110;
        const gapY = 24;
        for (let i = 0; i < 4; i++) {
          slotCoords.push({ x: 35, y: startY + i * (slotH + gapY), w: slotW, h: slotH });
        }
      }

      // Vẽ từng ô ảnh
      for (let i = 0; i < slotCoords.length; i++) {
        const { x: slotX, y: slotY, w: slotW, h: slotH } = slotCoords[i];
        const photoUri = options.slotPhotos?.[i];
        let photoDrawn = false;

        if (photoUri) {
          try {
            const img = await loadImageSafe(photoUri);
            if (img) {
              ctx.save();
              ctx.beginPath();
              ctx.rect(slotX, slotY, slotW, slotH);
              ctx.clip();

              // Bộ lọc màu phong cách Film / Instagram
              if (options.photoFilter === 'bw') {
                ctx.filter = 'grayscale(100%) contrast(110%)';
              } else if (options.photoFilter === 'vintage') {
                ctx.filter = 'sepia(45%) contrast(105%) brightness(95%)';
              } else if (options.photoFilter === 'warm') {
                ctx.filter = 'sepia(20%) saturate(135%) brightness(102%)';
              } else if (options.photoFilter === 'cool') {
                ctx.filter = 'saturate(85%) hue-rotate(190deg)';
              } else if (options.photoFilter === 'pastel') {
                ctx.filter = 'brightness(110%) saturate(85%) contrast(95%)';
              }

              const imgAspect = img.width / img.height;
              const slotAspect = slotW / slotH;
              let renderW = slotW;
              let renderH = slotH;
              let renderX = slotX;
              let renderY = slotY;
              if (imgAspect > slotAspect) {
                renderW = slotH * imgAspect;
                renderX = slotX - (renderW - slotW) / 2;
              } else {
                renderH = slotW / imgAspect;
                renderY = slotY - (renderH - slotH) / 2;
              }
              ctx.drawImage(img, renderX, renderY, renderW, renderH);

              // Timestamp màu cam vintage góc phải dưới ô ảnh
              if (options.showTimestamp && options.timestampText) {
                ctx.restore();
                ctx.save();
                ctx.font = '900 13px monospace';
                ctx.fillStyle = '#F97316';
                ctx.textAlign = 'right';
                ctx.fillText(options.timestampText, slotX + slotW - 8, slotY + slotH - 8);
              }

              ctx.restore();
              photoDrawn = true;
            }
          } catch {
            photoDrawn = false;
          }
        }

        if (!photoDrawn) {
          ctx.fillStyle = '#F3F4F6';
          ctx.fillRect(slotX, slotY, slotW, slotH);

          ctx.fillStyle = '#9CA3AF';
          ctx.font = '900 36px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(String(i + 1), slotX + slotW / 2, slotY + slotH / 2 + 12);
        }

        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 4;
        ctx.strokeRect(slotX, slotY, slotW, slotH);

        // Chữ ở vị trí MIDDLE nếu là strip_4
        if (layout === 'strip_4' && i === 1 && options.textPosition === 'middle' && options.customText?.trim()) {
          const midY = slotY + slotH + 4;
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(40, midY, canvas.width - 80, 28);
          ctx.strokeStyle = '#111111';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(40, midY, canvas.width - 80, 28);

          ctx.fillStyle = options.textColor || '#111111';
          ctx.font = '900 14px sans-serif';
          ctx.fillText(options.customText, canvas.width / 2, midY + 19);
        }
      }

      // Phần thiệp ghi chú tình bạn nếu là layout duo_note
      if (layout === 'duo_note') {
        const noteY = 85 + 2 * ( (canvas.width - 70) * 0.82 + 20 );
        ctx.fillStyle = '#FEF9C3';
        ctx.fillRect(35, noteY, canvas.width - 70, 180);
        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 3;
        ctx.strokeRect(35, noteY, canvas.width - 70, 180);

        // Các đường kẻ ngang kiểu sổ lưu bút
        ctx.strokeStyle = '#FDE047';
        ctx.lineWidth = 1.5;
        for (let l = 1; l <= 4; l++) {
          ctx.beginPath();
          ctx.moveTo(45, noteY + l * 34);
          ctx.lineTo(canvas.width - 45, noteY + l * 34);
          ctx.stroke();
        }

        ctx.fillStyle = '#111111';
        ctx.font = '800 13px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`💌 Lời nhắn kỷ niệm:`, 50, noteY + 28);
        ctx.font = '600 12px sans-serif';
        ctx.fillText(options.customText || 'Mãi bên nhau bạn nhé! 🌿✨', 50, noteY + 62);
      }

      // 6. Nếu có chữ ở vị trí BOTTOM
      if (options.textPosition === 'bottom' && options.customText?.trim()) {
        const bottomY = canvas.height - 90;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(40, bottomY, canvas.width - 80, 36);
        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 3;
        ctx.strokeRect(40, bottomY, canvas.width - 80, 36);

        ctx.fillStyle = options.textColor || '#111111';
        ctx.font = '900 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(options.customText, canvas.width / 2, bottomY + 24);
      }

      // 7. Con dấu sáp / Con dấu niêm phong độc bản (Seal Stamp)
      if (options.sealStamp && options.sealStamp !== 'none') {
        const stampX = canvas.width - 65;
        const stampY = canvas.height - 75;
        ctx.save();
        ctx.translate(stampX, stampY);
        ctx.rotate(-0.15);

        // Vòng tròn ngoài
        ctx.beginPath();
        ctx.arc(0, 0, 32, 0, Math.PI * 2);
        ctx.strokeStyle = '#DC2626';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, 28, 0, Math.PI * 2);
        ctx.strokeStyle = '#DC2626';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#DC2626';
        ctx.font = '900 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('LEAFYBOOTH', 0, -12);
        ctx.font = '900 11px sans-serif';
        ctx.fillText('★ 100% ★', 0, 0);
        ctx.font = '800 8px sans-serif';
        ctx.fillText('CERTIFIED', 0, 12);
        ctx.restore();
      }

      // 8. Chân trang dấu ấn độc bản tác giả & Serial Code (chỉ vẽ nếu người dùng tự nhập tên)
      if (options.creatorName && options.creatorName.trim().length > 0) {
        ctx.textAlign = 'center';
        ctx.fillStyle = options.textColor || '#111111';
        ctx.font = '800 10px monospace';
        ctx.fillText(
          `✦ Designed by ${options.creatorName} · Limited Edition ${options.serialNumber || '#LB-902'} ✦`,
          canvas.width / 2,
          canvas.height - 18
        );
      }

      // 9. Vẽ các sticker tự do theo vị trí, cỡ và góc xoay
      for (const stk of options.stickers) {
        const stkSize = (stk.size || 30) * scale;
        const stkX = stk.x * scale + stkSize / 2;
        const stkY = stk.y * scale + stkSize / 2;
        const rotation = (stk.rotation || 0) * (Math.PI / 180);

        ctx.save();
        ctx.translate(stkX, stkY);
        if (rotation !== 0) {
          ctx.rotate(rotation);
        }
        ctx.font = `${Math.round(stkSize)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(stk.emoji, 0, 0);
        ctx.restore();
      }

      // 10. Vẽ các dòng chữ tự do
      if (options.textItems && options.textItems.length > 0) {
        for (const t of options.textItems) {
          const fontSize = (t.fontSize || 13) * scale;
          const textX = t.x * scale;
          const textY = t.y * scale;
          const rotation = (t.rotation || 0) * (Math.PI / 180);

          ctx.save();
          ctx.translate(textX, textY);
          if (rotation !== 0) {
            ctx.rotate(rotation);
          }

          const px = Math.round(fontSize);
          let fontSpec = `900 ${px}px sans-serif`;
          switch (t.fontStyleType) {
            case 'handwriting':
              fontSpec = `italic 600 ${px}px "Brush Script MT", cursive, sans-serif`;
              break;
            case 'typewriter':
              fontSpec = `bold ${px}px "Courier New", Courier, monospace`;
              break;
            case 'aesthetic_serif':
              fontSpec = `italic 600 ${px}px "Georgia", "Times New Roman", serif`;
              break;
            case 'bubble_cute':
              fontSpec = `900 ${px}px "Comic Sans MS", "Chalkboard SE", sans-serif`;
              break;
            case 'neon_cyber':
              fontSpec = `900 ${px}px "Trebuchet MS", "Impact", monospace, sans-serif`;
              break;
            case 'modern_bold':
            default:
              fontSpec = `900 ${px}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
              break;
          }
          ctx.font = fontSpec;
          const metrics = ctx.measureText(t.text);
          const textWidth = metrics.width;
          const textHeight = fontSize;

          if (t.bgColor && t.bgColor !== 'transparent') {
            ctx.fillStyle = t.bgColor;
            ctx.fillRect(-6, -textHeight + 2, textWidth + 12, textHeight + 6);
            ctx.strokeStyle = '#111111';
            ctx.lineWidth = 2.5;
            ctx.strokeRect(-6, -textHeight + 2, textWidth + 12, textHeight + 6);
          }

          ctx.fillStyle = t.color || '#111111';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'alphabetic';
          ctx.fillText(t.text, 0, 0);
          ctx.restore();
        }
      }

      // 11. Hiệu ứng viền đặc biệt (Cuộn phim Film Sprocket / Răng cưa Tem / Băng dính Washi / Vé xem phim / Camcorder / Viền bánh kem)
      if (options.frameEdgeStyle === 'film_perforated') {
        // Lỗ răng cưa cuộn phim nhựa dọc 2 bên lề
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 1.5;
        for (let py = 30; py < canvas.height - 30; py += 36) {
          // Lỗ bên trái
          ctx.fillRect(8, py, 12, 18);
          ctx.strokeRect(8, py, 12, 18);
          // Lỗ bên phải
          ctx.fillRect(canvas.width - 20, py, 12, 18);
          ctx.strokeRect(canvas.width - 20, py, 12, 18);
        }
      } else if (options.frameEdgeStyle === 'washi_corners') {
        // Băng dính dán 2 góc chéo
        ctx.save();
        ctx.fillStyle = 'rgba(254, 240, 138, 0.85)';
        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 2;
        // Góc trên trái
        ctx.translate(40, 20);
        ctx.rotate(-0.4);
        ctx.fillRect(-45, -12, 90, 24);
        ctx.strokeRect(-45, -12, 90, 24);
        ctx.restore();

        ctx.save();
        ctx.fillStyle = 'rgba(254, 240, 138, 0.85)';
        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 2;
        // Góc dưới phải
        ctx.translate(canvas.width - 40, canvas.height - 20);
        ctx.rotate(-0.4);
        ctx.fillRect(-45, -12, 90, 24);
        ctx.strokeRect(-45, -12, 90, 24);
        ctx.restore();
      } else if (options.frameEdgeStyle === 'stamp_scallop') {
        // Răng cưa tem bưu chính cổ điển
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 1.5;
        for (let py = 16; py < canvas.height - 16; py += 24) {
          ctx.beginPath();
          ctx.arc(5, py, 6, -Math.PI / 2, Math.PI / 2);
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(canvas.width - 5, py, 6, Math.PI / 2, -Math.PI / 2);
          ctx.fill();
          ctx.stroke();
        }
        for (let px = 16; px < canvas.width - 16; px += 24) {
          ctx.beginPath();
          ctx.arc(px, 5, 6, 0, Math.PI);
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(px, canvas.height - 5, 6, Math.PI, 0);
          ctx.fill();
          ctx.stroke();
        }
      } else if (options.frameEdgeStyle === 'neon_glow') {
        ctx.save();
        ctx.shadowColor = '#C8F135';
        ctx.shadowBlur = 18;
        ctx.strokeStyle = '#C8F135';
        ctx.lineWidth = 4;
        ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
        ctx.restore();
      } else if (options.frameEdgeStyle === 'ticket_stub') {
        // Khía cạnh cuống vé xem phim cinema
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 2.5;
        const notchRadius = 14;
        const notchY1 = canvas.height * 0.28;
        const notchY2 = canvas.height * 0.72;
        [notchY1, notchY2].forEach((ny) => {
          ctx.beginPath();
          ctx.arc(0, ny, notchRadius, -Math.PI / 2, Math.PI / 2);
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(canvas.width, ny, notchRadius, Math.PI / 2, (3 * Math.PI) / 2);
          ctx.fill();
          ctx.stroke();
        });
        // Đường gạch đứt cuống vé
        ctx.save();
        ctx.setLineDash([8, 6]);
        ctx.strokeStyle = '#555555';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(18, notchY2);
        ctx.lineTo(canvas.width - 18, notchY2);
        ctx.stroke();
        ctx.restore();
      } else if (options.frameEdgeStyle === 'vhs_camcorder') {
        // Ống ngắm camcorder REC 1998
        ctx.strokeStyle = '#00FF66';
        ctx.lineWidth = 3;
        const bSize = 24;
        // Top-left
        ctx.beginPath();
        ctx.moveTo(18, 18 + bSize); ctx.lineTo(18, 18); ctx.lineTo(18 + bSize, 18);
        ctx.stroke();
        // Top-right
        ctx.beginPath();
        ctx.moveTo(canvas.width - 18 - bSize, 18); ctx.lineTo(canvas.width - 18, 18); ctx.lineTo(canvas.width - 18, 18 + bSize);
        ctx.stroke();
        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(18, canvas.height - 18 - bSize); ctx.lineTo(18, canvas.height - 18); ctx.lineTo(18 + bSize, canvas.height - 18);
        ctx.stroke();
        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(canvas.width - 18 - bSize, canvas.height - 18); ctx.lineTo(canvas.width - 18, canvas.height - 18); ctx.lineTo(canvas.width - 18, canvas.height - 18 - bSize);
        ctx.stroke();
        // REC indicator
        ctx.fillStyle = '#FF0033';
        ctx.beginPath();
        ctx.arc(34, 38, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '900 13px monospace';
        ctx.fillText('REC', 46, 43);
      } else if (options.frameEdgeStyle === 'heart_cutout') {
        // Viền lượn sóng bánh kem dâu
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#FF4D8D';
        ctx.lineWidth = 2;
        for (let py = 20; py < canvas.height - 20; py += 28) {
          ctx.beginPath();
          ctx.arc(6, py, 7, -Math.PI / 2, Math.PI / 2);
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(canvas.width - 6, py, 7, Math.PI / 2, -Math.PI / 2);
          ctx.fill();
          ctx.stroke();
        }
      }

      // 12. Viền ngoài bo khung dải ảnh
      ctx.strokeStyle = options.borderColor || '#111111';
      ctx.lineWidth = 10;
      ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);

      const dataUrl = canvas.toDataURL('image/png');
      downloadDataUrlOnWeb(dataUrl, filename);
      return true;
    } catch (e) {
      console.error('Lỗi khi tải ảnh frame:', e);
      return false;
    }
  }
  return true;
}

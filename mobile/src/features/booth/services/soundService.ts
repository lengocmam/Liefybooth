import { Platform, Vibration } from 'react-native';

/**
 * Kích hoạt rung phản hồi xúc giác nhẹ (Haptic feedback)
 */
export const triggerHaptic = (duration = 18) => {
  try {
    if (Platform.OS !== 'web') {
      Vibration.vibrate(duration);
    }
  } catch {
    // Bỏ qua nếu thiết bị không hỗ trợ rung
  }
};

/**
 * Phát âm thanh photobooth "tách" kèm rung phản hồi xúc giác
 */
export const playShutterSound = () => {
  triggerHaptic(18);
  if (Platform.OS === 'web') {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      // Tạo âm thanh tiếng tách cơ khí photobooth (shutter click)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch {
      // Bỏ qua nếu trình duyệt chặn autoplay
    }
  }
};

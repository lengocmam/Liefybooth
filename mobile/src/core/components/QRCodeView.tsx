import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import QRCode from 'qrcode';
import { colors } from '../theme/colors';

interface QRCodeViewProps {
  value: string;
  size?: number;
  centerEmoji?: string;
  caption?: string;
}

export const QRCodeView: React.FC<QRCodeViewProps> = ({
  value,
  size = 180,
  centerEmoji = '🌿',
  caption,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    // Sinh mã QR thật 100% hoàn toàn offline bằng thư viện qrcode chuẩn quốc tế
    QRCode.toDataURL(value, {
      width: size * 2,
      margin: 2,
      color: {
        dark: '#111111',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H', // Mức sửa lỗi cao để chèn icon ở tâm vẫn quét được 100%
    })
      .then((url) => {
        if (isMounted) {
          setQrDataUrl(url);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Lỗi sinh mã QR:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [value, size]);

  return (
    <View style={[styles.container, { width: size + 20 }]}>
      <View style={[styles.qrWrapper, { width: size, height: size }]}>
        {qrDataUrl && !loading ? (
          <Image
            source={{ uri: qrDataUrl }}
            style={{ width: size - 8, height: size - 8, borderRadius: 10 }}
            resizeMode="contain"
          />
        ) : (
          <ActivityIndicator size="small" color={colors.ink} />
        )}

        {/* Huy hiệu tròn ở tâm mã QR (Sticker Pop style) */}
        {!loading && centerEmoji && (
          <View style={styles.centerBadge}>
            <Text style={styles.centerBadgeEmoji}>{centerEmoji}</Text>
          </View>
        )}
      </View>

      {/* Dòng chữ phụ đề */}
      {caption && <Text style={styles.captionText}>{caption}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrWrapper: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: colors.ink,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.ink,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  centerBadge: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.lime,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.ink,
    shadowOffset: { width: 1.5, height: 1.5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  centerBadgeEmoji: {
    fontSize: 18,
  },
  captionText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '800',
    color: colors.ink,
    textAlign: 'center',
    letterSpacing: 1,
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '../../../core/theme/colors';
import { theme } from '../../../core/theme/theme';
import { TopHeader } from '../../../core/components/TopHeader';
import { PillButton } from '../../../core/components/PillButton';
import { PaginationDots } from '../components/PaginationDots';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingStepData {
  backgroundColor: string;
  title: string;
  description: string;
  buttonLabel: string;
}

const STEPS: OnboardingStepData[] = [
  {
    backgroundColor: colors.lime,
    title: 'Gửi khoảnh khắc\ntrong vài chạm',
    description:
      'Mở app là thấy camera. Chụp, chọn bạn bè, gửi. Ảnh hiện ngay trên màn hình chính của họ.',
    buttonLabel: 'Tiếp',
  },
  {
    backgroundColor: colors.pink,
    title: 'Photobooth 4\nkhung của riêng bạn',
    description:
      'Đếm ngược 3-2-1, đèn flash, tiếng tách. Chọn nền theo dịp, đổi màu và bộ lọc theo ý bạn.',
    buttonLabel: 'Tiếp',
  },
  {
    backgroundColor: colors.purple,
    title: 'Cả nhóm cùng\nchụp trong một sự kiện',
    description:
      'Tạo Garden, chia sẻ mã mời. Mọi người cùng chụp, ảnh gom về một album chung.',
    buttonLabel: 'Bắt đầu',
  },
];

export const OnboardingScreen: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    router.replace('/login');
  };

  const step = STEPS[currentStep];

  return (
    <View style={[styles.container, { backgroundColor: step.backgroundColor }]}>
      {/* Header */}
      <TopHeader
        brandTitle="LeafyBooth"
        rightActionLabel="Bỏ qua"
        onRightActionPress={handleSkip}
      />

      {/* Graphic Illustration Container */}
      <View style={styles.illustrationArea}>
        {currentStep === 0 && (
          <View style={styles.step1Art}>
            {/* Polaroid Photo Frame */}
            <View style={styles.polaroidFrame}>
              <View style={styles.photoCanvas}>
                <View style={styles.sunCircle} />
                <View style={styles.waveMountain} />
              </View>
              <Text style={styles.photoCaption}>Cà phê sáng</Text>
            </View>

            {/* Sender Badge */}
            <View style={styles.senderBadge}>
              <Text style={styles.senderBadgeText}>Bình · 2 phút trước</Text>
            </View>

            {/* Star Sticker */}
            <View style={styles.pinkStarSticker}>
              <Text style={styles.starText}>★</Text>
            </View>
          </View>
        )}

        {currentStep === 1 && (
          <View style={styles.step2Art}>
            {/* 4-Frame Strip */}
            <View style={styles.stripFrame}>
              {[0, 1, 2, 3].map(i => (
                <View key={i} style={styles.stripPhotoBox}>
                  <View style={styles.stripPhotoInner}>
                    <View style={styles.miniSun} />
                    <View style={styles.miniWave} />
                  </View>
                </View>
              ))}
              <Text style={styles.stripDate}>Sinh nhật Mai</Text>
            </View>

            {/* Countdown Badge Circle '3' */}
            <View style={styles.countdownBadge}>
              <Text style={styles.countdownText}>3</Text>
            </View>

            {/* Yellow Star Sticker */}
            <View style={styles.yellowStarSticker}>
              <Text style={styles.yellowStarText}>★</Text>
            </View>
          </View>
        )}

        {currentStep === 2 && (
          <View style={styles.step3Art}>
            {/* 2 Strips Co-op Illustration */}
            <View style={styles.stripsGroup}>
              {/* Strip Left (Yellow) */}
              <View style={[styles.miniStrip, { backgroundColor: colors.yellow }]}>
                {[0, 1, 2, 3].map(i => (
                  <View key={i} style={styles.miniStripBox} />
                ))}
              </View>

              {/* Strip Right (Mint) */}
              <View style={[styles.miniStrip, { backgroundColor: colors.mint }]}>
                {[0, 1, 2, 3].map(i => (
                  <View key={i} style={styles.miniStripBox} />
                ))}
              </View>
            </View>

            {/* Invite Code Box */}
            <View style={styles.codeCard}>
              <View>
                <Text style={styles.codeLabel}>Mã mời</Text>
                <Text style={styles.codeText}>ABC234</Text>
              </View>
              <View style={styles.avatarGroup}>
                <View style={[styles.avatarCircle, { backgroundColor: colors.pink }]}>
                  <Text style={styles.avatarLetter}>A</Text>
                </View>
                <View style={[styles.avatarCircle, { backgroundColor: colors.yellow }]}>
                  <Text style={styles.avatarLetter}>B</Text>
                </View>
                <View style={[styles.avatarCircle, { backgroundColor: colors.sky }]}>
                  <Text style={styles.avatarLetter}>C</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Bottom Content Area */}
      <View style={[styles.bottomArea, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <View style={styles.textContent}>
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.description}>{step.description}</Text>
        </View>

        {/* Footer: Pagination & Button */}
        <View style={styles.footerRow}>
          <PaginationDots total={STEPS.length} current={currentStep} />
          <PillButton
            title={step.buttonLabel}
            onPress={handleNext}
            variant="secondary"
            style={styles.actionButton}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  illustrationArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  /* Step 1 Styles */
  step1Art: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  polaroidFrame: {
    width: 240,
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: colors.ink,
    padding: 14,
    transform: [{ rotate: '-3deg' }],
    ...theme.shadows.hard,
  },
  photoCanvas: {
    height: 190,
    backgroundColor: '#FF7A3D',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.ink,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end',
  },
  sunCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFE57F',
    position: 'absolute',
    top: 25,
    right: 40,
  },
  waveMountain: {
    height: 80,
    backgroundColor: '#FF5722',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 70,
  },
  photoCaption: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
    marginTop: 10,
  },
  senderBadge: {
    position: 'absolute',
    bottom: -15,
    left: -10,
    backgroundColor: colors.white,
    borderWidth: 2.5,
    borderColor: colors.ink,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    transform: [{ rotate: '-2deg' }],
    ...theme.shadows.hardSmall,
  },
  senderBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.ink,
  },
  pinkStarSticker: {
    position: 'absolute',
    top: -20,
    right: -15,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.pink,
    borderWidth: 2.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '15deg' }],
    ...theme.shadows.hardSmall,
  },
  starText: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.ink,
  },

  /* Step 2 Styles */
  step2Art: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stripFrame: {
    width: 170,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 2.5,
    borderColor: colors.ink,
    padding: 10,
    gap: 8,
    transform: [{ rotate: '2deg' }],
    ...theme.shadows.hard,
  },
  stripPhotoBox: {
    height: 54,
    backgroundColor: '#D1C4E9',
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.ink,
    overflow: 'hidden',
  },
  stripPhotoInner: {
    flex: 1,
    position: 'relative',
  },
  miniSun: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFE082',
    position: 'absolute',
    top: 6,
    right: 20,
  },
  miniWave: {
    height: 24,
    backgroundColor: '#7E57C2',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 12,
  },
  stripDate: {
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    color: colors.ink,
    paddingTop: 2,
  },
  countdownBadge: {
    position: 'absolute',
    top: -10,
    right: -30,
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.lime,
    borderWidth: 2.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.hard,
  },
  countdownText: {
    fontSize: 42,
    fontWeight: '900',
    color: colors.ink,
  },
  yellowStarSticker: {
    position: 'absolute',
    bottom: 30,
    left: -20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.yellow,
    borderWidth: 2.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.hardSmall,
  },
  yellowStarText: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.ink,
  },

  /* Step 3 Styles */
  step3Art: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 280,
  },
  stripsGroup: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  miniStrip: {
    width: 100,
    borderRadius: 12,
    borderWidth: 2.5,
    borderColor: colors.ink,
    padding: 8,
    gap: 6,
    ...theme.shadows.hard,
  },
  miniStripBox: {
    height: 38,
    backgroundColor: colors.white,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.ink,
  },
  codeCard: {
    width: '100%',
    backgroundColor: colors.ink,
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: colors.ink,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...theme.shadows.hard,
  },
  codeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  codeText: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.lime,
    letterSpacing: 2,
  },
  avatarGroup: {
    flexDirection: 'row',
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  avatarLetter: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.ink,
  },

  /* Bottom Area */
  bottomArea: {
    paddingHorizontal: theme.spacing.xl,
  },
  textContent: {
    marginBottom: 28,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: colors.ink,
    lineHeight: 40,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.ink,
    lineHeight: 22,
    opacity: 0.9,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButton: {
    minWidth: 120,
  },
});

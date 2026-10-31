import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '../../../core/theme/colors';
import { theme } from '../../../core/theme/theme';
import { PillButton } from '../../../core/components/PillButton';
import {
  useAuthStore,
  formatPhoneNumber,
  normalizePhoneNumber,
} from '../hooks/useAuthStore';
import { playShutterSound } from '../../booth/services/soundService';

const AVATAR_COLORS = [
  { color: '#C8F135', name: 'Chanh cốm' },
  { color: '#FF8FC7', name: 'Hồng pastel' },
  { color: '#FFD93D', name: 'Vàng nắng' },
  { color: '#6EC6FF', name: 'Xanh trời' },
  { color: '#7EE8B8', name: 'Xanh mint' },
  { color: '#FF7A3D', name: 'Cam đào' },
];

export const LoginScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    phone,
    otp,
    generatedOtp,
    timer,
    isTimerActive,
    step,
    isLoading,
    errorMessage,
    setPhone,
    setOtp,
    sendOtp,
    resendOtp,
    verifyOtp,
    completeProfile,
    resetStep,
    decrementTimer,
  } = useAuthStore();

  // State cho 6 ô nhập mã OTP
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const otpInputRefs = useRef<any[]>([]);

  // State cho bước thiết lập hồ sơ (Profile Setup)
  const [profileName, setProfileName] = useState('');
  const [profileUsername, setProfileUsername] = useState('');
  const [selectedAvatarColor, setSelectedAvatarColor] = useState(AVATAR_COLORS[0].color);

  // Hiệu ứng nhịp đập cho banner thông báo mã OTP
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Đếm ngược 60s cho mã OTP
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerActive && timer > 0) {
      interval = setInterval(() => {
        decrementTimer();
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerActive, timer, decrementTimer]);

  // Hiệu ứng pulse cho banner SMS OTP
  useEffect(() => {
    if (step === 'otp') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.03,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [step, pulseAnim]);

  // Xử lý gửi mã OTP từ số điện thoại
  const handleSendOtp = async (overridePhone?: string) => {
    const targetPhone = overridePhone || phone;
    if (!targetPhone.trim()) return;

    playShutterSound();
    const result = await sendOtp(targetPhone);
    if (result.success) {
      setOtpDigits(['', '', '', '', '', '']);
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 200);
    }
  };

  // Tự động điền mã OTP demo nhanh
  const handleAutoFillOtp = (codeToFill?: string) => {
    const code = codeToFill || generatedOtp || '123456';
    const digits = code.split('').slice(0, 6);
    while (digits.length < 6) digits.push('');
    setOtpDigits(digits);
    setOtp(code);
    playShutterSound();

    // Tự động xác thực luôn sau 250ms
    setTimeout(() => {
      handleVerifyCode(code);
    }, 250);
  };

  // Nhập từng ô OTP
  const handleOtpDigitChange = (value: string, index: number) => {
    // Chỉ lấy chữ số
    const cleanDigit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = cleanDigit;
    setOtpDigits(newDigits);

    const fullCode = newDigits.join('');
    setOtp(fullCode);

    // Tự động nhảy sang ô tiếp theo nếu đã nhập
    if (cleanDigit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Nếu đã nhập đủ 6 số, tự động xác thực
    if (cleanDigit && index === 5 && newDigits.every((d) => d !== '')) {
      handleVerifyCode(fullCode);
    }
  };

  // Xử lý phím Backspace khi ô rỗng -> nhảy lùi về ô trước
  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Xác thực mã OTP
  const handleVerifyCode = (codeToVerify?: string) => {
    const code = codeToVerify || otpDigits.join('');
    if (code.length < 6) return;

    playShutterSound();
    const result = verifyOtp(code);
    if (result.success) {
      if (!result.isNewUser) {
        // Đã là tài khoản cũ -> Vào thẳng Moments Feed
        router.replace('/(tabs)/moments');
      }
      // Nếu là isNewUser, useAuthStore tự động chuyển step sang 'profile_setup'
    }
  };

  // Hoàn tất bước tạo hồ sơ người dùng mới
  const handleFinishProfileSetup = () => {
    if (!profileName.trim()) return;
    playShutterSound();

    const username = profileUsername.trim() || `user_${phone.slice(-4)}`;
    completeProfile(profileName, username, selectedAvatarColor);
    router.replace('/(tabs)/moments');
  };

  // Thử ngay chế độ khách không cần tài khoản
  const handleGuestBooth = () => {
    playShutterSound();
    router.push('/(tabs)/booth');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
    >
      <View
        style={[
          styles.container,
          {
            paddingTop: Math.max(insets.top, 20),
            paddingBottom: Math.max(insets.bottom, 20),
          },
        ]}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ==============================================================
              BƯỚC 1: NHẬP SỐ ĐIỆN THOẠI (STEP = 'phone')
             ============================================================== */}
          {step === 'phone' && (
            <View style={styles.stepContainer}>
              {/* Brand Header */}
              <View style={styles.brandSection}>
                <View style={styles.brandLogoRow}>
                  <Text style={styles.brandLeaf}>🌿</Text>
                  <Text style={styles.brandTitle}>LeafyBooth</Text>
                </View>
                <View style={styles.taglinePill}>
                  <Text style={styles.taglineText}>Màn hình widget & Photobooth bạn bè</Text>
                </View>
              </View>

              {/* Title & Description */}
              <View style={styles.introSection}>
                <Text style={styles.mainHeading}>Đăng nhập bằng{'\n'}số điện thoại</Text>
                <Text style={styles.subHeading}>
                  LeafyBooth sẽ gửi mã OTP gồm 6 chữ số để xác thực tài khoản của bạn.
                </Text>
              </View>

              {/* Phone Input Box */}
              <View style={styles.inputWrapper}>
                <View style={styles.countryCodeBadge}>
                  <Text style={styles.flagIcon}>🇻🇳</Text>
                  <Text style={styles.countryCodeText}>+84</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="0988 123 456"
                  placeholderTextColor="#6B7280"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={(val) => setPhone(val)}
                  maxLength={13}
                  autoFocus
                />
              </View>

              {/* Error Message */}
              {errorMessage && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
                </View>
              )}

              {/* CTA Send OTP Button */}
              <Pressable
                onPress={() => handleSendOtp()}
                disabled={isLoading || !phone.trim()}
                style={({ pressed }) => [
                  styles.primaryCtaBtn,
                  (!phone.trim() || isLoading) && styles.ctaBtnDisabled,
                  { transform: [{ scale: pressed ? 0.98 : 1 }] },
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.ink} />
                ) : (
                  <Text style={styles.primaryCtaText}>Gửi mã OTP ➔</Text>
                )}
              </Pressable>

              {/* Quick Pick Test Accounts (Mẫu kiểm thử nhanh 1 chạm) */}
              <View style={styles.testSection}>
                <Text style={styles.testSectionTitle}>⚡ Tài khoản mẫu thử nghiệm (chạm để điền):</Text>
                <View style={styles.testChipsRow}>
                  <Pressable
                    onPress={() => {
                      setPhone('0988 123 456');
                      handleSendOtp('0988 123 456');
                    }}
                    style={styles.testChip}
                  >
                    <Text style={styles.testChipLetter}>A</Text>
                    <Text style={styles.testChipText}>An (0988...)</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      setPhone('0912 345 678');
                      handleSendOtp('0912 345 678');
                    }}
                    style={styles.testChip}
                  >
                    <Text style={styles.testChipLetter}>B</Text>
                    <Text style={styles.testChipText}>Bình (0912...)</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      setPhone('0903 112 233');
                      handleSendOtp('0903 112 233');
                    }}
                    style={styles.testChip}
                  >
                    <Text style={styles.testChipLetter}>C</Text>
                    <Text style={styles.testChipText}>Chi (0903...)</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      setPhone('0966 888 999');
                      handleSendOtp('0966 888 999');
                    }}
                    style={[styles.testChip, { backgroundColor: '#FEF08A' }]}
                  >
                    <Text style={styles.testChipLetter}>🌱</Text>
                    <Text style={styles.testChipText}>Số mới (Đăng ký)</Text>
                  </Pressable>
                </View>
              </View>

              {/* Guest Photobooth Option */}
              <View style={styles.footerSection}>
                <Pressable
                  onPress={handleGuestBooth}
                  style={({ pressed }) => [
                    styles.guestLink,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Text style={styles.guestLinkText}>
                    📸 Chụp Photobooth ngay không cần đăng nhập
                  </Text>
                </Pressable>

                <Text style={styles.disclaimerText}>
                  Bằng việc đăng nhập, bạn đồng ý với{' '}
                  <Text style={styles.disclaimerLink}>Điều khoản dịch vụ</Text> và{' '}
                  <Text style={styles.disclaimerLink}>Quy chế bảo mật</Text> của LeafyBooth.
                </Text>
              </View>
            </View>
          )}

          {/* ==============================================================
              BƯỚC 2: NHẬP MÃ OTP 6 CHỮ SỐ (STEP = 'otp')
             ============================================================== */}
          {step === 'otp' && (
            <View style={styles.stepContainer}>
              {/* Back button */}
              <Pressable
                onPress={resetStep}
                style={({ pressed }) => [
                  styles.backBtn,
                  { transform: [{ scale: pressed ? 0.95 : 1 }] },
                ]}
              >
                <Text style={styles.backBtnText}>← Đổi số điện thoại</Text>
              </Pressable>

              {/* Header */}
              <View style={styles.introSection}>
                <Text style={styles.mainHeading}>Xác thực mã OTP</Text>
                <Text style={styles.subHeading}>
                  Mã OTP đã được gửi đến số{' '}
                  <Text style={styles.boldHighlight}>{formatPhoneNumber(phone)}</Text>.
                </Text>
              </View>

              {/* Demo Simulated SMS Toast / Banner */}
              <Animated.View
                style={[
                  styles.smsSimulationCard,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <Pressable
                  onPress={() => handleAutoFillOtp(generatedOtp)}
                  style={styles.smsSimulationInner}
                >
                  <View style={styles.smsHeaderRow}>
                    <Text style={styles.smsIcon}>💬</Text>
                    <Text style={styles.smsSender}>SMS · LeafyBooth OTP</Text>
                    <View style={styles.smsNowBadge}>
                      <Text style={styles.smsNowText}>Vừa xong</Text>
                    </View>
                  </View>
                  <Text style={styles.smsBody}>
                    Mã xác thực của bạn là: <Text style={styles.smsCodeBold}>{generatedOtp}</Text>
                  </Text>
                  <Text style={styles.smsAutoFillHint}>
                    ⚡ Chạm vào đây để tự động điền mã ({generatedOtp})
                  </Text>
                </Pressable>
              </Animated.View>

              {/* 6 OTP Input Boxes */}
              <View style={styles.otpBoxesRow}>
                {otpDigits.map((digit, idx) => {
                  const isFocused = otpDigits.findIndex((d) => d === '') === idx;
                  const hasValue = !!digit;
                  return (
                    <View
                      key={idx}
                      style={[
                        styles.otpBox,
                        hasValue && styles.otpBoxFilled,
                        isFocused && styles.otpBoxFocused,
                      ]}
                    >
                      <TextInput
                        ref={(r) => {
                          otpInputRefs.current[idx] = r;
                        }}
                        style={styles.otpInputDigit}
                        keyboardType="number-pad"
                        maxLength={1}
                        value={digit}
                        onChangeText={(val) => handleOtpDigitChange(val, idx)}
                        onKeyPress={(e) => handleOtpKeyPress(e, idx)}
                        selectTextOnFocus
                      />
                    </View>
                  );
                })}
              </View>

              {/* Error Message */}
              {errorMessage && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
                </View>
              )}

              {/* CTA Verify Button */}
              <Pressable
                onPress={() => handleVerifyCode()}
                disabled={otpDigits.join('').length < 6}
                style={({ pressed }) => [
                  styles.primaryCtaBtn,
                  otpDigits.join('').length < 6 && styles.ctaBtnDisabled,
                  { transform: [{ scale: pressed ? 0.98 : 1 }] },
                ]}
              >
                <Text style={styles.primaryCtaText}>Xác thực & Tiếp tục ➔</Text>
              </Pressable>

              {/* Resend Timer Row */}
              <View style={styles.resendRow}>
                {timer > 0 ? (
                  <Text style={styles.resendTimerText}>
                    Gửi lại mã sau <Text style={styles.boldTimer}>{timer}s</Text>
                  </Text>
                ) : (
                  <Pressable
                    onPress={async () => {
                      playShutterSound();
                      const newCode = await resendOtp();
                      handleAutoFillOtp(newCode);
                    }}
                    style={styles.resendBtn}
                  >
                    <Text style={styles.resendBtnText}>↻ Gửi lại mã OTP ngay</Text>
                  </Pressable>
                )}
              </View>
            </View>
          )}

          {/* ==============================================================
              BƯỚC 3: THIẾT LẬP HỒ SƠ TÀI KHOẢN MỚI (STEP = 'profile_setup')
             ============================================================== */}
          {step === 'profile_setup' && (
            <View style={styles.stepContainer}>
              {/* Header */}
              <View style={styles.introSection}>
                <View style={styles.newBadgePill}>
                  <Text style={styles.newBadgeText}>Tài khoản mới</Text>
                </View>
                <Text style={styles.mainHeading}>Tạo hồ sơ Leafy 🌱</Text>
                <Text style={styles.subHeading}>
                  Đặt tên hiển thị và màu đại diện để bạn bè dễ dàng nhận ra bạn trên widget.
                </Text>
              </View>

              {/* Avatar Preview */}
              <View style={styles.avatarPreviewSection}>
                <View
                  style={[
                    styles.avatarBigCircle,
                    { backgroundColor: selectedAvatarColor },
                  ]}
                >
                  <Text style={styles.avatarBigLetter}>
                    {(profileName.trim()[0] || 'L').toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.avatarColorHint}>Chọn màu đại diện yêu thích:</Text>

                {/* Color Palette */}
                <View style={styles.paletteRow}>
                  {AVATAR_COLORS.map((item) => {
                    const isSelected = selectedAvatarColor === item.color;
                    return (
                      <Pressable
                        key={item.color}
                        onPress={() => setSelectedAvatarColor(item.color)}
                        style={[
                          styles.colorDot,
                          { backgroundColor: item.color },
                          isSelected && styles.colorDotSelected,
                        ]}
                      >
                        {isSelected && <Text style={styles.colorCheckMark}>✓</Text>}
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Name Input */}
              <View style={styles.profileInputGroup}>
                <Text style={styles.inputLabel}>Tên của bạn</Text>
                <TextInput
                  style={styles.profileTextInput}
                  placeholder="Ví dụ: Bảo Trâm, Hoàng Long..."
                  placeholderTextColor="#6B7280"
                  value={profileName}
                  onChangeText={setProfileName}
                  maxLength={24}
                  autoFocus
                />
              </View>

              {/* Username Input */}
              <View style={styles.profileInputGroup}>
                <Text style={styles.inputLabel}>@username (để bạn bè tìm kiếm)</Text>
                <TextInput
                  style={styles.profileTextInput}
                  placeholder="Ví dụ: tram_booth, hoang_long..."
                  placeholderTextColor="#6B7280"
                  value={profileUsername}
                  onChangeText={(val) => setProfileUsername(val.toLowerCase())}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={20}
                />
              </View>

              {/* Complete CTA Button */}
              <Pressable
                onPress={handleFinishProfileSetup}
                disabled={!profileName.trim()}
                style={({ pressed }) => [
                  styles.primaryCtaBtn,
                  !profileName.trim() && styles.ctaBtnDisabled,
                  { transform: [{ scale: pressed ? 0.98 : 1 }] },
                ]}
              >
                <Text style={styles.primaryCtaText}>Vào LeafyBooth ngay 🌿</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.darkBg, // Pure Midnight OLED Dark (#0D0F12)
    paddingHorizontal: 20,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 16,
  },
  stepContainer: {
    width: '100%',
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  brandLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandLeaf: {
    fontSize: 32,
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: -0.5,
  },
  taglinePill: {
    backgroundColor: colors.darkSurfaceElevated,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginTop: 8,
  },
  taglineText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.accentYellow,
  },
  introSection: {
    marginBottom: 24,
  },
  mainHeading: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: -0.5,
    lineHeight: 34,
    marginBottom: 8,
  },
  subHeading: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 20,
  },
  boldHighlight: {
    color: colors.accentYellow,
    fontWeight: '800',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.darkSurface,
    borderRadius: theme.borders.radius.card,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    paddingHorizontal: 12,
    height: 60,
    marginBottom: 16,
    ...theme.shadows.darkSoft,
  },
  countryCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.darkSurfaceElevated,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    marginRight: 10,
  },
  flagIcon: {
    fontSize: 18,
  },
  countryCodeText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.white,
  },
  phoneInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: colors.white,
    height: '100%',
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 14,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F87171',
  },
  primaryCtaBtn: {
    height: 56,
    backgroundColor: colors.lime,
    borderRadius: theme.borders.radius.full,
    borderWidth: 2,
    borderColor: colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.hard,
    marginBottom: 20,
  },
  ctaBtnDisabled: {
    opacity: 0.45,
  },
  primaryCtaText: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.ink,
  },
  testSection: {
    backgroundColor: colors.darkSurface,
    borderRadius: theme.borders.radius.card,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    padding: 16,
    marginBottom: 24,
    ...theme.shadows.darkSoft,
  },
  testSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.accentYellow,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  testChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  testChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.darkSurfaceElevated,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  testChipLetter: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.accentYellow,
  },
  testChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  footerSection: {
    alignItems: 'center',
    gap: 14,
  },
  guestLink: {
    paddingVertical: 8,
  },
  guestLinkText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.accentYellow,
    textDecorationLine: 'underline',
  },
  disclaimerText: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 12,
  },
  disclaimerLink: {
    color: colors.white,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  // STYLES CHO BƯỚC OTP
  backBtn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.darkSurfaceElevated,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 20,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  smsSimulationCard: {
    backgroundColor: colors.darkSurfaceElevated,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.lime,
    padding: 14,
    marginBottom: 24,
    ...theme.shadows.darkSoft,
  },
  smsSimulationInner: {
    gap: 4,
  },
  smsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  smsIcon: {
    fontSize: 16,
  },
  smsSender: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.lime,
    flex: 1,
  },
  smsNowBadge: {
    backgroundColor: 'rgba(200, 241, 53, 0.15)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  smsNowText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.lime,
  },
  smsBody: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
    marginTop: 2,
  },
  smsCodeBold: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.accentYellow,
    letterSpacing: 2,
  },
  smsAutoFillHint: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.lime,
    marginTop: 4,
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 24,
  },
  otpBox: {
    flex: 1,
    aspectRatio: 0.9,
    backgroundColor: colors.darkSurface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.darkSoft,
  },
  otpBoxFilled: {
    borderColor: colors.lime,
    backgroundColor: colors.darkSurfaceElevated,
  },
  otpBoxFocused: {
    borderColor: colors.accentYellow,
    borderWidth: 2,
  },
  otpInputDigit: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.white,
    textAlign: 'center',
    width: '100%',
    height: '100%',
  },
  resendRow: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  resendTimerText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  boldTimer: {
    color: colors.accentYellow,
    fontWeight: '900',
  },
  resendBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  resendBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.accentYellow,
    textDecorationLine: 'underline',
  },

  // STYLES CHO BƯỚC PROFILE SETUP
  newBadgePill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentYellow,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.ink,
    marginBottom: 8,
  },
  newBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.ink,
  },
  avatarPreviewSection: {
    alignItems: 'center',
    backgroundColor: colors.darkSurface,
    borderRadius: theme.borders.radius.card,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    padding: 20,
    marginBottom: 20,
    ...theme.shadows.darkSoft,
  },
  avatarBigCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2.5,
    borderColor: colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    ...theme.shadows.hardSmall,
  },
  avatarBigLetter: {
    fontSize: 38,
    fontWeight: '900',
    color: colors.ink,
  },
  avatarColorHint: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 10,
  },
  paletteRow: {
    flexDirection: 'row',
    gap: 12,
  },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.darkBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorDotSelected: {
    borderColor: colors.white,
    borderWidth: 3,
    transform: [{ scale: 1.15 }],
  },
  colorCheckMark: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.ink,
  },
  profileInputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  profileTextInput: {
    height: 54,
    backgroundColor: colors.darkSurface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
    ...theme.shadows.darkSoft,
  },
});

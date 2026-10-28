import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
  Modal,
  Alert,
  Animated,
  PanResponder,
} from 'react-native';
import { colors } from '../../../core/theme/colors';
import { theme } from '../../../core/theme/theme';
import { REACTION_ICONS } from '../../../core/constants';
import { useMomentsStore, MomentItem, TEST_ACCOUNTS, UserAccount } from '../hooks/useMomentsStore';
import { playShutterSound } from '../../booth/services/soundService';

const REACTION_BG_COLORS: Record<string, string> = {
  '❤️': colors.yellow,
  '😊': colors.lime,
  '🔥': colors.orange,
  '⭐': colors.sky,
  '😮': colors.white,
};

export const PickView: React.FC = () => {
  const {
    moments,
    friends,
    currentUser,
    switchAccount,
    activeMomentIndex,
    setActiveMomentIndex,
    activeSenderFilter,
    setActiveSenderFilter,
    addReaction,
    deleteMoment,
    pinToWidget,
    markSeen,
    setViewMode,
  } = useMomentsStore();

  const [showMemoriesModal, setShowMemoriesModal] = useState(false);
  const [showAccountSwitchModal, setShowAccountSwitchModal] = useState(false);
  const [selectedMemoryMoment, setSelectedMemoryMoment] = useState<MomentItem | null>(null);
  const [memoriesTab, setMemoriesTab] = useState<'all' | 'me' | 'friends'>('all');
  const [memoryFriendFilter, setMemoryFriendFilter] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Hiệu ứng hạt emoji bay lên khi thả reaction (Tactile reaction pop)
  const [poppingEmoji, setPoppingEmoji] = useState<{ emoji: string; id: number } | null>(null);
  const popAnim = useRef(new Animated.Value(0)).current;

  // Hiệu ứng tim to khi chạm đúp vào ảnh (Double tap to heart)
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);
  const doubleTapAnim = useRef(new Animated.Value(0)).current;
  const lastTapRef = useRef<number>(0);

  // Hiệu ứng cử chỉ vuốt lướt ảnh mượt mà chuẩn Locket
  const isSwipingRef = useRef(false);
  const panAnim = useRef(new Animated.Value(0)).current;
  const cardScaleAnim = useRef(new Animated.Value(1)).current;
  const avatarScrollRef = useRef<any>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 2500);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Danh sách khoảnh khắc đã lọc theo người đăng trên Feed
  const filteredMoments = useMemo(() => {
    if (activeSenderFilter === 'all') return moments;
    if (activeSenderFilter === 'me') return moments.filter((m) => m.senderId === currentUser.id);
    return moments.filter((m) => m.senderId === activeSenderFilter);
  }, [moments, activeSenderFilter, currentUser.id]);

  const safeIndex = Math.min(activeMomentIndex, Math.max(0, filteredMoments.length - 1));
  const currentMoment: MomentItem | undefined = filteredMoments[safeIndex];

  // Đếm số lượng ảnh của từng đối tượng
  const myMomentsCount = useMemo(
    () => moments.filter((m) => m.senderId === currentUser.id).length,
    [moments, currentUser.id]
  );

  const friendCounts = useMemo(() => {
    const map: Record<string, number> = {};
    friends.forEach((f) => {
      map[f.id] = moments.filter((m) => m.senderId === f.id).length;
    });
    return map;
  }, [moments, friends]);

  // Tên bộ lọc đang chọn
  const activeFilterName = useMemo(() => {
    if (activeSenderFilter === 'all') return 'Tất cả bạn bè';
    if (activeSenderFilter === 'me') return `Của ${currentUser.name}`;
    const found = friends.find((f) => f.id === activeSenderFilter);
    return found ? found.name : 'Người dùng';
  }, [activeSenderFilter, friends, currentUser.name]);

  // Tự động đánh dấu đã xem khi ảnh hiển thị
  useEffect(() => {
    if (currentMoment && !currentMoment.isSeen) {
      markSeen(currentMoment.id);
    }
  }, [currentMoment?.id, currentMoment?.isSeen, markSeen]);

  // Hiệu ứng spring nảy nhẹ khi đổi ảnh (chỉ khi không đang vuốt thủ công)
  useEffect(() => {
    if (!isSwipingRef.current) {
      cardScaleAnim.setValue(0.95);
      panAnim.setValue(0);
      Animated.spring(cardScaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 65,
        useNativeDriver: true,
      }).start();
    }
  }, [currentMoment?.id]);

  // Danh sách ảnh hiển thị trong Modal Kỷ Niệm
  const memoriesList = useMemo(() => {
    let list = moments;
    if (memoriesTab === 'me') {
      list = list.filter((m) => m.senderId === currentUser.id);
    } else if (memoriesTab === 'friends') {
      list = list.filter((m) => m.senderId !== currentUser.id);
    }

    if (memoriesTab !== 'me' && memoryFriendFilter !== 'all') {
      list = list.filter((m) => m.senderId === memoryFriendFilter);
    }
    return list;
  }, [moments, memoriesTab, memoryFriendFilter, currentUser.id]);

  const handleSelectAccount = (acc: UserAccount) => {
    playShutterSound();
    switchAccount(acc.id);
    setShowAccountSwitchModal(false);
    showToast(`🔄 Đã chuyển sang tài khoản ${acc.name}!`);
  };

  const filteredMomentsRef = useRef(filteredMoments);
  filteredMomentsRef.current = filteredMoments;

  const safeIndexRef = useRef(safeIndex);
  safeIndexRef.current = safeIndex;

  const handlePrevPhoto = useCallback(() => {
    const list = filteredMomentsRef.current;
    if (list.length <= 1) return;
    const current = safeIndexRef.current;
    const newIdx = current > 0 ? current - 1 : list.length - 1;
    setActiveMomentIndex(newIdx);
  }, [setActiveMomentIndex]);

  const handleNextPhoto = useCallback(() => {
    const list = filteredMomentsRef.current;
    if (list.length <= 1) return;
    const current = safeIndexRef.current;
    const newIdx = current < list.length - 1 ? current + 1 : 0;
    setActiveMomentIndex(newIdx);
  }, [setActiveMomentIndex]);

  // Cử chỉ vuốt tay ngang (Swipe PanResponder)
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return Math.abs(gestureState.dx) > 12 && Math.abs(gestureState.dy) < 30;
        },
        onPanResponderMove: (_, gestureState) => {
          panAnim.setValue(gestureState.dx);
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx < -55 && filteredMomentsRef.current.length > 1) {
            // Vuốt sang trái -> xem ảnh tiếp theo
            isSwipingRef.current = true;
            Animated.timing(panAnim, {
              toValue: -320,
              duration: 130,
              useNativeDriver: true,
            }).start(() => {
              handleNextPhoto();
              panAnim.setValue(220);
              Animated.spring(panAnim, {
                toValue: 0,
                friction: 7,
                tension: 70,
                useNativeDriver: true,
              }).start(() => {
                isSwipingRef.current = false;
              });
            });
          } else if (gestureState.dx > 55 && filteredMomentsRef.current.length > 1) {
            // Vuốt sang phải -> xem ảnh trước đó
            isSwipingRef.current = true;
            Animated.timing(panAnim, {
              toValue: 320,
              duration: 130,
              useNativeDriver: true,
            }).start(() => {
              handlePrevPhoto();
              panAnim.setValue(-220);
              Animated.spring(panAnim, {
                toValue: 0,
                friction: 7,
                tension: 70,
                useNativeDriver: true,
              }).start(() => {
                isSwipingRef.current = false;
              });
            });
          } else {
            // Nhả tay nhưng chưa đủ lực -> lò xo đàn hồi về tâm
            Animated.spring(panAnim, {
              toValue: 0,
              friction: 6,
              tension: 70,
              useNativeDriver: true,
            }).start();
          }
        },
      }),
    [handleNextPhoto, handlePrevPhoto]
  );

  // Chạm đúp vào ảnh để thả tim ❤️ (Double tap to heart)
  const handlePhotoDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 320) {
      if (currentMoment) {
        playShutterSound();
        addReaction(currentMoment.id, '❤️');
        setShowDoubleTapHeart(true);
        doubleTapAnim.setValue(0);
        Animated.sequence([
          Animated.spring(doubleTapAnim, {
            toValue: 1,
            friction: 4,
            tension: 90,
            useNativeDriver: true,
          }),
          Animated.timing(doubleTapAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setShowDoubleTapHeart(false);
        });
      }
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  const handlePinMoment = (moment: MomentItem) => {
    playShutterSound();
    pinToWidget(moment.id);
    showToast(`📌 Đã ghim ảnh của ${moment.senderName} lên Widget chính!`);
  };

  const handleDeleteMoment = (momentId: string) => {
    Alert.alert(
      'Xóa khoảnh khắc này? 🗑️',
      'Ảnh sẽ được gỡ khỏi Widget và Feed của bạn.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa vĩnh viễn',
          style: 'destructive',
          onPress: () => {
            deleteMoment(momentId);
            showToast('✓ Đã xóa khoảnh khắc thành công!');
            if (selectedMemoryMoment?.id === momentId) {
              setSelectedMemoryMoment(null);
            }
          },
        },
      ]
    );
  };

  const handleOpenFromMemory = (moment: MomentItem) => {
    if (moment.senderId === currentUser.id) {
      setActiveSenderFilter('me');
      const myMoments = moments.filter((m) => m.senderId === currentUser.id);
      const myIdx = myMoments.findIndex((m) => m.id === moment.id);
      setActiveMomentIndex(myIdx !== -1 ? myIdx : 0);
    } else {
      setActiveSenderFilter(moment.senderId);
      const friendMoments = moments.filter((m) => m.senderId === moment.senderId);
      const friendIdx = friendMoments.findIndex((m) => m.id === moment.id);
      setActiveMomentIndex(friendIdx !== -1 ? friendIdx : 0);
    }
    setSelectedMemoryMoment(null);
    setShowMemoriesModal(false);
  };

  const handleEmojiPress = (emoji: string) => {
    if (!currentMoment) return;
    playShutterSound();
    addReaction(currentMoment.id, emoji);

    // Kích hoạt hiệu ứng emoji bay lên
    setPoppingEmoji({ emoji, id: Date.now() });
    popAnim.setValue(0);
    Animated.timing(popAnim, {
      toValue: 1,
      duration: 650,
      useNativeDriver: true,
    }).start(() => {
      setPoppingEmoji(null);
    });
  };

  const handleSelectFilter = (filterId: string, idx: number) => {
    setActiveSenderFilter(filterId);
    setActiveMomentIndex(0);
    avatarScrollRef.current?.scrollTo({
      x: Math.max(0, idx * 64 - 40),
      animated: true,
    });
  };

  return (
    <View style={styles.container}>
      {/* 1. TOP BAR CÓ NÚT ĐỔI TÀI KHOẢN (MULTI-ACCOUNT TESTER SWITCHER) */}
      <View style={styles.topBar}>
        <View style={styles.topLeftRow}>
          <Text style={styles.topTitle}>Locket</Text>
          {/* Nút chuyển đổi tài khoản */}
          <Pressable
            onPress={() => setShowAccountSwitchModal(true)}
            style={({ pressed }) => [
              styles.accountSwitchPill,
              { backgroundColor: currentUser.avatarColor, transform: [{ scale: pressed ? 0.94 : 1 }] },
            ]}
          >
            <View style={styles.accountSwitchLetterBox}>
              <Text style={styles.accountSwitchLetter}>{currentUser.avatarLetter}</Text>
            </View>
            <Text style={styles.accountSwitchName} numberOfLines={1}>
              {currentUser.name} ▾
            </Text>
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {/* Nút mở hộp kỷ niệm */}
          <Pressable
            onPress={() => setShowMemoriesModal(true)}
            style={({ pressed }) => [
              styles.memoriesPillBtn,
              { transform: [{ scale: pressed ? 0.94 : 1 }] },
            ]}
          >
            <Text style={styles.memoriesPillIcon}>📖</Text>
            <Text style={styles.memoriesPillText}>({moments.length})</Text>
          </Pressable>

          {/* Nút chụp nhanh camera */}
          <Pressable
            onPress={() => setViewMode('plant')}
            style={({ pressed }) => [
              styles.switchCameraPill,
              { transform: [{ scale: pressed ? 0.94 : 1 }] },
            ]}
          >
            <Text style={styles.switchCameraPillText}>📸</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollFeedContent}
      >
        {/* 2. DẢI AVATAR LỌC THEO NGƯỜI (TẤT CẢ / CỦA TÔI / TỪNG BẠN BÈ) */}
        <View style={styles.senderFilterContainer}>
          <ScrollView
            ref={avatarScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.senderFilterScroll}
          >
            {/* Tất cả */}
            <Pressable
              onPress={() => handleSelectFilter('all', 0)}
              style={({ pressed }) => [
                styles.senderFilterChip,
                activeSenderFilter === 'all' && styles.senderFilterChipActive,
                { transform: [{ scale: pressed ? 0.92 : activeSenderFilter === 'all' ? 1.05 : 1 }] },
              ]}
            >
              <View
                style={[
                  styles.senderAvatarRing,
                  activeSenderFilter === 'all' && styles.senderAvatarRingActive,
                ]}
              >
                <View style={[styles.senderAvatarCircle, { backgroundColor: '#FFD93D' }]}>
                  <Text style={{ fontSize: 15 }}>🌟</Text>
                </View>
                {moments.length > 0 && (
                  <View style={styles.senderCountBadge}>
                    <Text style={styles.senderCountBadgeText}>{moments.length}</Text>
                  </View>
                )}
              </View>
              <Text
                style={[
                  styles.senderFilterName,
                  activeSenderFilter === 'all' && styles.senderFilterNameActive,
                ]}
              >
                Tất cả
              </Text>
            </Pressable>

            {/* Của tôi (Ảnh mình đăng - hiển thị theo account đang active) */}
            <Pressable
              onPress={() => handleSelectFilter('me', 1)}
              style={({ pressed }) => [
                styles.senderFilterChip,
                activeSenderFilter === 'me' && styles.senderFilterChipActive,
                { transform: [{ scale: pressed ? 0.92 : activeSenderFilter === 'me' ? 1.05 : 1 }] },
              ]}
            >
              <View
                style={[
                  styles.senderAvatarRing,
                  activeSenderFilter === 'me' && styles.senderAvatarRingActive,
                ]}
              >
                <View style={[styles.senderAvatarCircle, { backgroundColor: currentUser.avatarColor }]}>
                  <Text style={styles.senderAvatarLetter}>{currentUser.avatarLetter}</Text>
                </View>
                {myMomentsCount > 0 && (
                  <View style={styles.senderCountBadge}>
                    <Text style={styles.senderCountBadgeText}>{myMomentsCount}</Text>
                  </View>
                )}
              </View>
              <Text
                style={[
                  styles.senderFilterName,
                  activeSenderFilter === 'me' && styles.senderFilterNameActive,
                ]}
                numberOfLines={1}
              >
                {currentUser.name}
              </Text>
            </Pressable>

            {/* Từng bạn bè */}
            {friends.map((friend, fIdx) => {
              const count = friendCounts[friend.id] || 0;
              const isSelected = activeSenderFilter === friend.id;
              return (
                <Pressable
                  key={friend.id}
                  onPress={() => handleSelectFilter(friend.id, fIdx + 2)}
                  style={({ pressed }) => [
                    styles.senderFilterChip,
                    isSelected && styles.senderFilterChipActive,
                    { transform: [{ scale: pressed ? 0.92 : isSelected ? 1.05 : 1 }] },
                  ]}
                >
                  <View
                    style={[
                      styles.senderAvatarRing,
                      isSelected && styles.senderAvatarRingActive,
                    ]}
                  >
                    <View style={[styles.senderAvatarCircle, { backgroundColor: friend.avatarColor }]}>
                      <Text style={styles.senderAvatarLetter}>{friend.avatarLetter}</Text>
                    </View>
                    {count > 0 && (
                      <View style={styles.senderCountBadge}>
                        <Text style={styles.senderCountBadgeText}>{count}</Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.senderFilterName,
                      isSelected && styles.senderFilterNameActive,
                    ]}
                    numberOfLines={1}
                  >
                    {friend.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* 3. HERO POLAROID CARD KÈM CỬ CHỈ VUỐT TAY LƯỚT ẢNH (SWIPE PANRESPONDER) */}
        <View style={styles.heroPolaroidArea}>
          {currentMoment ? (
            <Animated.View
              {...panResponder.panHandlers}
              style={[
                styles.polaroidCard,
                {
                  transform: [
                    { translateX: panAnim },
                    {
                      rotate: panAnim.interpolate({
                        inputRange: [-200, 0, 200],
                        outputRange: ['-7deg', '0deg', '7deg'],
                      }),
                    },
                    { scale: cardScaleAnim },
                  ],
                },
              ]}
            >
              {/* Header dải ảnh: Tên người gửi + Thời gian */}
              <View style={styles.senderPill}>
                <View
                  style={[
                    styles.senderPillAvatar,
                    { backgroundColor: currentMoment.senderColor },
                  ]}
                >
                  <Text style={styles.senderPillLetter}>{currentMoment.senderLetter}</Text>
                </View>
                <Text style={styles.senderPillText}>
                  {currentMoment.senderName} · {currentMoment.timeAgo}
                </Text>
              </View>

              {/* Quick Actions góc trên phải: Ghim Widget / Xóa */}
              <View style={styles.cardTopRightActions}>
                {currentMoment.senderId === currentUser.id && (
                  <Pressable
                    hitSlop={10}
                    onPress={() => handleDeleteMoment(currentMoment.id)}
                    style={styles.cardMiniActionBtn}
                  >
                    <Text style={{ fontSize: 13 }}>🗑️</Text>
                  </Pressable>
                )}
                <Pressable
                  hitSlop={10}
                  onPress={() => handlePinMoment(currentMoment)}
                  style={[styles.cardMiniActionBtn, { backgroundColor: colors.yellow }]}
                >
                  <Text style={{ fontSize: 13 }}>📌</Text>
                </Pressable>
                <View style={styles.starSticker}>
                  <Text style={styles.starIcon}>★</Text>
                </View>
              </View>

              {/* Điều hướng chuyển ảnh Trước/Sau */}
              {filteredMoments.length > 1 && (
                <>
                  <Pressable
                    onPress={handlePrevPhoto}
                    style={styles.navChevronLeft}
                    hitSlop={14}
                  >
                    <Text style={styles.navChevronText}>‹</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleNextPhoto}
                    style={styles.navChevronRight}
                    hitSlop={14}
                  >
                    <Text style={styles.navChevronText}>›</Text>
                  </Pressable>
                </>
              )}

              {/* KHUNG ẢNH: DẢI PHOTOBOOTH 4 Ô HOẶC ẢNH VUÔNG LOCKET (CHẠM ĐÚP ĐỂ THẢ TIM ❤️) */}
              <Pressable onPress={handlePhotoDoubleTap} style={{ position: 'relative' }}>
                {currentMoment.stripPhotos && currentMoment.stripPhotos.length > 1 ? (
                  <View
                    style={[
                      styles.photoboothCardStrip,
                      { backgroundColor: currentMoment.frameColor || '#FF8FC7' },
                    ]}
                  >
                    <View style={styles.photoboothGridPhotos}>
                      {currentMoment.stripPhotos.slice(0, 4).map((imgUri, pIdx) => (
                        <View key={pIdx} style={styles.photoboothMiniSlot}>
                          <Image
                            source={{ uri: imgUri }}
                            style={styles.photoboothMiniImg}
                            resizeMode="cover"
                          />
                        </View>
                      ))}
                    </View>
                    {currentMoment.frameName && (
                      <Text style={styles.photoboothFrameTitle} numberOfLines={1}>
                        🌿 {currentMoment.frameName}
                      </Text>
                    )}
                  </View>
                ) : (
                  <View style={styles.photoContainer}>
                    <Image
                      source={{ uri: currentMoment.photoUrl }}
                      style={styles.photo}
                      resizeMode="cover"
                    />
                  </View>
                )}

                {/* TIM TO BAY LÊN KHI CHẠM ĐÚP VÀO ẢNH */}
                {showDoubleTapHeart && (
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.doubleTapHeartOverlay,
                      {
                        opacity: doubleTapAnim,
                        transform: [
                          {
                            scale: doubleTapAnim.interpolate({
                              inputRange: [0, 0.4, 1],
                              outputRange: [0.3, 1.4, 1.1],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <Text style={styles.doubleTapHeartText}>❤️</Text>
                  </Animated.View>
                )}
              </Pressable>

              {/* Lời nhắn / Caption */}
              <Text style={styles.captionText}>{currentMoment.caption}</Text>

              {/* Dải chấm chỉ báo ảnh (Dots Carousel Indicator) */}
              {filteredMoments.length > 1 && (
                <View style={styles.paginationDotsRow}>
                  {filteredMoments.slice(0, 10).map((_, dotIdx) => {
                    const isCur = dotIdx === safeIndex;
                    return (
                      <Pressable
                        key={dotIdx}
                        onPress={() => setActiveMomentIndex(dotIdx)}
                        hitSlop={8}
                        style={[
                          styles.paginationDot,
                          isCur && styles.paginationDotActive,
                        ]}
                      />
                    );
                  })}
                </View>
              )}

              {/* Chỉ báo thứ tự ảnh & gợi ý tương tác */}
              {filteredMoments.length > 1 ? (
                <Text style={styles.photoIndexBadge}>
                  {safeIndex + 1}/{filteredMoments.length} · {activeFilterName} (chạm đúp ❤️ · vuốt ‹ ›)
                </Text>
              ) : null}
            </Animated.View>
          ) : (
            /* EMPTY STATE KHI CHƯA CÓ ẢNH */
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardEmoji}>🌱</Text>
              <Text style={styles.emptyCardTitle}>Chưa có ảnh từ {activeFilterName}</Text>
              <Text style={styles.emptyCardDesc}>
                {activeSenderFilter === 'me'
                  ? 'Bạn chưa đăng ảnh nào lên Widget. Hãy chụp một bức ảnh hoặc tạo khung photobooth để gửi tặng bạn bè nhé!'
                  : `${activeFilterName} chưa gửi ảnh nào cho bạn. Hãy gửi khoảnh khắc đầu tiên để rủ bạn ấy cùng chơi!`}
              </Text>
              <Pressable
                onPress={() => setViewMode('plant')}
                style={({ pressed }) => [
                  styles.emptyCardBtn,
                  { transform: [{ scale: pressed ? 0.95 : 1 }] },
                ]}
              >
                <Text style={styles.emptyCardBtnText}>📸 Chụp & Gửi ngay</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* 4. THANH 5 REACTION EMOJI KÈM HIỆU ỨNG TACTILE POP & FLOATING PARTICLE */}
        <View style={styles.reactionsSection}>
          {/* Floating Emoji Particle khi bấm thả reaction */}
          {poppingEmoji && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.floatingPopEmojiContainer,
                {
                  opacity: popAnim.interpolate({
                    inputRange: [0, 0.7, 1],
                    outputRange: [1, 1, 0],
                  }),
                  transform: [
                    {
                      translateY: popAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -65],
                      }),
                    },
                    {
                      scale: popAnim.interpolate({
                        inputRange: [0, 0.3, 1],
                        outputRange: [0.6, 1.4, 1.8],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={{ fontSize: 36 }}>{poppingEmoji.emoji}</Text>
            </Animated.View>
          )}

          <View style={styles.reactionButtonsRow}>
            {REACTION_ICONS.map((emoji) => {
              const userReaction = currentMoment
                ? currentMoment.userReactions?.[currentUser.id] ||
                  (currentUser.id === 'me' ? currentMoment.myReaction : undefined)
                : undefined;
              const isMyReaction = userReaction === emoji;
              const count = currentMoment?.reactions[emoji] || 0;
              const bgColor = REACTION_BG_COLORS[emoji] || colors.white;

              return (
                <Pressable
                  key={emoji}
                  disabled={!currentMoment}
                  onPress={() => handleEmojiPress(emoji)}
                  style={({ pressed }) => [
                    styles.reactionButton,
                    { backgroundColor: bgColor },
                    isMyReaction && styles.reactionButtonActive,
                    { transform: [{ scale: pressed ? 0.88 : isMyReaction ? 1.08 : 1 }] },
                    !currentMoment && { opacity: 0.4 },
                  ]}
                >
                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                  {count > 0 && (
                    <View style={styles.reactionCountBadge}>
                      <Text style={styles.reactionCountText}>{count}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 5. PHẦN GẦN ĐÂY (CAROUSEL THU NHỎ CỦA BỘ LỌC ĐANG CHỌN) */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeaderRow}>
            <Text style={styles.recentSectionTitle}>
              Gần đây · {activeFilterName} ({filteredMoments.length})
            </Text>
            <Pressable onPress={() => setShowMemoriesModal(true)}>
              <Text style={styles.viewAllHistoryLink}>Xem tất cả ➔</Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentScroll}
          >
            {filteredMoments.map((item, idx) => {
              const isActive = idx === safeIndex;
              const isStrip = item.stripPhotos && item.stripPhotos.length > 1;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setActiveMomentIndex(idx)}
                  style={({ pressed }) => [
                    styles.miniPolaroid,
                    isActive && styles.miniPolaroidActive,
                    { transform: [{ scale: pressed ? 0.93 : 1 }] },
                  ]}
                >
                  <View style={styles.miniPhotoWrapper}>
                    <Image
                      source={{ uri: isStrip && item.stripPhotos ? item.stripPhotos[0] : item.photoUrl }}
                      style={styles.miniPhoto}
                    />
                    {isStrip && (
                      <View style={styles.miniStripBadge}>
                        <Text style={styles.miniStripBadgeText}>4-Cut</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.miniSenderText} numberOfLines={1}>
                    {item.senderName}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </ScrollView>

      {/* 6. TOAST THÔNG BÁO GHIM WIDGET */}
      {toastMessage && (
        <View style={styles.floatingToast}>
          <Text style={styles.floatingToastText}>{toastMessage}</Text>
        </View>
      )}

      {/* 7. MODAL HỘP KỶ NIỆM TOÀN DIỆN (FULL MEMORIES / ARCHIVE GRID) */}
      <Modal
        visible={showMemoriesModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowMemoriesModal(false)}
      >
        <View style={styles.memoriesModalContainer}>
          {/* Header */}
          <View style={styles.memoriesHeader}>
            <View>
              <Text style={styles.memoriesTitle}>📖 Hộp Kỷ Niệm Locket</Text>
              <Text style={styles.memoriesSubtitle}>
                Xem lại toàn bộ ảnh bạn bè và bạn đã chia sẻ
              </Text>
            </View>
            <Pressable
              onPress={() => setShowMemoriesModal(false)}
              style={styles.memoriesCloseBtn}
            >
              <Text style={styles.memoriesCloseText}>✕</Text>
            </Pressable>
          </View>

          {/* 3 Tab phân loại chính: Tất cả / Của tôi / Bạn bè */}
          <View style={styles.memoriesTabsRow}>
            <Pressable
              onPress={() => {
                setMemoriesTab('all');
                setMemoryFriendFilter('all');
              }}
              style={[
                styles.memoryTabBtn,
                memoriesTab === 'all' && styles.memoryTabBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.memoryTabBtnText,
                  memoriesTab === 'all' && styles.memoryTabBtnTextActive,
                ]}
              >
                🌟 Tất cả ({moments.length})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setMemoriesTab('me');
                setMemoryFriendFilter('all');
              }}
              style={[
                styles.memoryTabBtn,
                memoriesTab === 'me' && styles.memoryTabBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.memoryTabBtnText,
                  memoriesTab === 'me' && styles.memoryTabBtnTextActive,
                ]}
              >
                👤 Của tôi ({myMomentsCount})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setMemoriesTab('friends');
                setMemoryFriendFilter('all');
              }}
              style={[
                styles.memoryTabBtn,
                memoriesTab === 'friends' && styles.memoryTabBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.memoryTabBtnText,
                  memoriesTab === 'friends' && styles.memoryTabBtnTextActive,
                ]}
              >
                👥 Bạn bè ({moments.length - myMomentsCount})
              </Text>
            </Pressable>
          </View>

          {/* Bộ lọc phụ: Chọn bạn bè cụ thể khi ở tab Bạn bè hoặc Tất cả */}
          {memoriesTab !== 'me' && (
            <View style={styles.memoriesFriendFilterRow}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
              >
                <Pressable
                  onPress={() => setMemoryFriendFilter('all')}
                  style={[
                    styles.memorySubFilterChip,
                    memoryFriendFilter === 'all' && styles.memorySubFilterChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.memorySubFilterText,
                      memoryFriendFilter === 'all' && styles.memorySubFilterTextActive,
                    ]}
                  >
                    Tất cả bạn ({friends.length})
                  </Text>
                </Pressable>

                {friends.map((f) => {
                  const isSel = memoryFriendFilter === f.id;
                  const c = friendCounts[f.id] || 0;
                  return (
                    <Pressable
                      key={f.id}
                      onPress={() => setMemoryFriendFilter(f.id)}
                      style={[
                        styles.memorySubFilterChip,
                        isSel && styles.memorySubFilterChipActive,
                      ]}
                    >
                      <View
                        style={[
                          styles.memorySubDot,
                          { backgroundColor: f.avatarColor },
                        ]}
                      />
                      <Text
                        style={[
                          styles.memorySubFilterText,
                          isSel && styles.memorySubFilterTextActive,
                        ]}
                      >
                        {f.name} ({c})
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* LƯỚI ẢNH KỶ NIỆM (3 CỘT) */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.memoriesGridContainer}
          >
            {memoriesList.length > 0 ? (
              <View style={styles.memoriesGrid}>
                {memoriesList.map((item) => {
                  const isStrip = item.stripPhotos && item.stripPhotos.length > 1;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => setSelectedMemoryMoment(item)}
                      style={({ pressed }) => [
                        styles.gridItemCard,
                        { transform: [{ scale: pressed ? 0.96 : 1 }] },
                      ]}
                    >
                      <Image
                        source={{
                          uri: isStrip && item.stripPhotos ? item.stripPhotos[0] : item.photoUrl,
                        }}
                        style={styles.gridItemImg}
                      />

                      {/* Badge photobooth nếu là dải 4 ô */}
                      {isStrip && (
                        <View style={styles.gridStripBadge}>
                          <Text style={styles.gridStripBadgeText}>🎞️ 4-Cut</Text>
                        </View>
                      )}

                      {/* Tên người gửi và thời gian */}
                      <View style={styles.gridItemFooter}>
                        <View
                          style={[
                            styles.gridAuthorCircle,
                            { backgroundColor: item.senderColor },
                          ]}
                        >
                          <Text style={styles.gridAuthorLetter}>{item.senderLetter}</Text>
                        </View>
                        <Text style={styles.gridAuthorText} numberOfLines={1}>
                          {item.senderName}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyGridArea}>
                <Text style={{ fontSize: 40, marginBottom: 10 }}>📭</Text>
                <Text style={styles.emptyGridTitle}>Chưa có ảnh nào phù hợp</Text>
                <Text style={styles.emptyGridDesc}>
                  Hãy thử chọn người bạn khác hoặc chụp khoảnh khắc mới!
                </Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* 8. MODAL CHI TIẾT KHOẢNH KHẮC ĐÃ CHỌN TRONG ALBUM */}
        {selectedMemoryMoment && (
          <Modal
            visible={!!selectedMemoryMoment}
            transparent
            animationType="fade"
            onRequestClose={() => setSelectedMemoryMoment(null)}
          >
            <Pressable
              onPress={() => setSelectedMemoryMoment(null)}
              style={styles.detailBackdrop}
            >
              <Pressable
                onPress={(e) => e.stopPropagation()}
                style={styles.detailCard}
              >
                {/* Header chi tiết */}
                <View style={styles.detailHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View
                      style={[
                        styles.detailAvatarCircle,
                        { backgroundColor: selectedMemoryMoment.senderColor },
                      ]}
                    >
                      <Text style={styles.detailAvatarLetter}>
                        {selectedMemoryMoment.senderLetter}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.detailAuthorName}>
                        {selectedMemoryMoment.senderName}
                      </Text>
                      <Text style={styles.detailTimeText}>
                        {selectedMemoryMoment.timeAgo}
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => setSelectedMemoryMoment(null)}
                    style={styles.detailCloseBtn}
                  >
                    <Text style={{ fontSize: 16, fontWeight: '900' }}>✕</Text>
                  </Pressable>
                </View>

                {/* Khung ảnh chi tiết */}
                {selectedMemoryMoment.stripPhotos && selectedMemoryMoment.stripPhotos.length > 1 ? (
                  <View
                    style={[
                      styles.photoboothCardStrip,
                      {
                        backgroundColor: selectedMemoryMoment.frameColor || '#FF8FC7',
                        marginVertical: 10,
                      },
                    ]}
                  >
                    <View style={styles.photoboothGridPhotos}>
                      {selectedMemoryMoment.stripPhotos.slice(0, 4).map((pUrl, idx) => (
                        <View key={idx} style={styles.photoboothMiniSlot}>
                          <Image
                            source={{ uri: pUrl }}
                            style={styles.photoboothMiniImg}
                            resizeMode="cover"
                          />
                        </View>
                      ))}
                    </View>
                    {selectedMemoryMoment.frameName && (
                      <Text style={styles.photoboothFrameTitle} numberOfLines={1}>
                        🌿 {selectedMemoryMoment.frameName}
                      </Text>
                    )}
                  </View>
                ) : (
                  <View style={[styles.photoContainer, { marginVertical: 10 }]}>
                    <Image
                      source={{ uri: selectedMemoryMoment.photoUrl }}
                      style={styles.photo}
                      resizeMode="cover"
                    />
                  </View>
                )}

                {/* Caption */}
                <Text style={styles.detailCaptionText}>
                  "{selectedMemoryMoment.caption}"
                </Text>

                {/* Action buttons */}
                <View style={styles.detailActionsRow}>
                  <Pressable
                    onPress={() => handlePinMoment(selectedMemoryMoment)}
                    style={styles.detailPinBtn}
                  >
                    <Text style={styles.detailPinBtnText}>📱 Ghim lên Widget</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => handleOpenFromMemory(selectedMemoryMoment)}
                    style={styles.detailOpenFeedBtn}
                  >
                    <Text style={styles.detailOpenFeedBtnText}>✓ Mở trên Feed</Text>
                  </Pressable>
                </View>

                {selectedMemoryMoment.senderId === currentUser.id && (
                  <Pressable
                    onPress={() => handleDeleteMoment(selectedMemoryMoment.id)}
                    style={styles.detailDeleteBtn}
                  >
                    <Text style={styles.detailDeleteText}>🗑️ Xóa khoảnh khắc này</Text>
                  </Pressable>
                )}
              </Pressable>
            </Pressable>
          </Modal>
        )}
      </Modal>

      {/* 9. MODAL CHUYỂN TÀI KHOẢN (MULTI-ACCOUNT TESTER SWITCHER) */}
      <Modal
        visible={showAccountSwitchModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAccountSwitchModal(false)}
      >
        <Pressable
          onPress={() => setShowAccountSwitchModal(false)}
          style={styles.accountModalBackdrop}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={styles.accountModalCard}
          >
            <View style={styles.accountModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.accountModalTitle}>👥 Chuyển tài khoản kiểm thử</Text>
                <Text style={styles.accountModalSubtitle}>
                  Truy cập nhiều account để test gửi nhận ảnh & phản hồi Widget
                </Text>
              </View>
              <Pressable
                onPress={() => setShowAccountSwitchModal(false)}
                style={styles.accountModalCloseBtn}
              >
                <Text style={styles.accountModalCloseText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, paddingVertical: 8 }}
            >
              {TEST_ACCOUNTS.map((acc) => {
                const isSelected = acc.id === currentUser.id;
                const momentCount = moments.filter((m) => m.senderId === acc.id).length;
                return (
                  <Pressable
                    key={acc.id}
                    onPress={() => handleSelectAccount(acc)}
                    style={({ pressed }) => [
                      styles.accountItemRow,
                      isSelected && styles.accountItemRowActive,
                      { transform: [{ scale: pressed ? 0.97 : 1 }] },
                    ]}
                  >
                    <View style={[styles.accountItemAvatar, { backgroundColor: acc.avatarColor }]}>
                      <Text style={styles.accountItemLetter}>{acc.avatarLetter}</Text>
                    </View>

                    <View style={styles.accountItemInfo}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.accountItemName}>{acc.name}</Text>
                        {isSelected && (
                          <View style={styles.accountActiveBadge}>
                            <Text style={styles.accountActiveBadgeText}>Đang dùng</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.accountItemRole}>{acc.roleDescription}</Text>
                      <Text style={styles.accountItemMeta}>@{acc.username} · {momentCount} ảnh đã chia sẻ</Text>
                    </View>

                    <View style={styles.accountItemAction}>
                      <Text style={{ fontSize: 18 }}>{isSelected ? '✓' : '➔'}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.pink,
    paddingHorizontal: 16,
  },
  scrollFeedContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingBottom: 6,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  topLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: -1,
  },
  memoriesPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.yellow,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.ink,
    paddingHorizontal: 10,
    paddingVertical: 5,
    ...theme.shadows.hardSmall,
  },
  memoriesPillIcon: {
    fontSize: 13,
  },
  memoriesPillText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.ink,
  },
  switchCameraPill: {
    backgroundColor: colors.lime,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.ink,
    paddingHorizontal: 12,
    paddingVertical: 6,
    ...theme.shadows.hardSmall,
  },
  switchCameraPillText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.ink,
  },

  // Dải lọc theo người đăng
  senderFilterContainer: {
    marginBottom: 8,
  },
  senderFilterScroll: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  senderFilterChip: {
    alignItems: 'center',
    width: 60,
  },
  senderFilterChipActive: {},
  senderAvatarRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 4,
  },
  senderAvatarRingActive: {
    borderColor: colors.ink,
    backgroundColor: colors.white,
    ...theme.shadows.hardSmall,
  },
  senderAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  senderAvatarLetter: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.ink,
  },
  senderCountBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.ink,
    borderRadius: 9,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  senderCountBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.white,
  },
  senderFilterName: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.ink,
    textAlign: 'center',
  },
  senderFilterNameActive: {
    fontWeight: '900',
  },

  // Hero Polaroid Card Area
  heroPolaroidArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  polaroidCard: {
    width: 280,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: colors.ink,
    padding: 12,
    position: 'relative',
    ...theme.shadows.hard,
  },
  senderPill: {
    position: 'absolute',
    top: -14,
    left: 10,
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.ink,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 5,
    ...theme.shadows.hardSmall,
  },
  senderPillAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  senderPillLetter: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.ink,
  },
  senderPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.ink,
  },
  cardTopRightActions: {
    position: 'absolute',
    top: -14,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 5,
  },
  cardMiniActionBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.hardSmall,
  },
  starSticker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.lime,
    borderWidth: 1.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '12deg' }],
    ...theme.shadows.hardSmall,
  },
  starIcon: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.ink,
  },

  // Điều hướng chuyển ảnh Trước/Sau
  navChevronLeft: {
    position: 'absolute',
    left: -16,
    top: '45%',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...theme.shadows.hardSmall,
  },
  navChevronRight: {
    position: 'absolute',
    right: -16,
    top: '45%',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...theme.shadows.hardSmall,
  },
  navChevronText: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.ink,
    lineHeight: 22,
  },

  photoContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.ink,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    marginTop: 6,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoboothCardStrip: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: colors.ink,
    padding: 8,
    marginTop: 6,
    ...theme.shadows.hardSmall,
  },
  photoboothGridPhotos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  photoboothMiniSlot: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.ink,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  photoboothMiniImg: {
    width: '100%',
    height: '100%',
  },
  photoboothFrameTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.ink,
    textAlign: 'center',
    marginTop: 6,
  },
  captionText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
    marginTop: 10,
    marginBottom: 2,
    textAlign: 'center',
  },
  photoIndexBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  doubleTapHeartOverlay: {
    position: 'absolute',
    top: '38%',
    alignSelf: 'center',
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doubleTapHeartText: {
    fontSize: 68,
  },
  paginationDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 6,
    marginBottom: 2,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
  },
  paginationDotActive: {
    width: 16,
    backgroundColor: colors.ink,
  },

  // Empty State Card
  emptyCard: {
    width: 280,
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: colors.ink,
    padding: 24,
    alignItems: 'center',
    ...theme.shadows.hard,
  },
  emptyCardEmoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  emptyCardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.ink,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyCardDesc: {
    fontSize: 12,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyCardBtn: {
    backgroundColor: colors.lime,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.ink,
    ...theme.shadows.hardSmall,
  },
  emptyCardBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.ink,
  },

  // Reaction Section
  reactionsSection: {
    marginVertical: 4,
    position: 'relative',
    alignItems: 'center',
  },
  floatingPopEmojiContainer: {
    position: 'absolute',
    top: -20,
    alignSelf: 'center',
    zIndex: 99,
  },
  reactionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    width: '100%',
  },
  reactionButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...theme.shadows.hardSmall,
  },
  reactionButtonActive: {
    borderWidth: 3.5,
  },
  reactionEmoji: {
    fontSize: 24,
  },
  reactionCountBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    backgroundColor: colors.ink,
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  reactionCountText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.white,
  },

  // Recent Section
  recentSection: {
    marginBottom: 4,
  },
  recentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  recentSectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.ink,
  },
  viewAllHistoryLink: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.ink,
    textDecorationLine: 'underline',
  },
  recentScroll: {
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 4,
  },
  miniPolaroid: {
    width: 66,
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.ink,
    padding: 4,
    alignItems: 'center',
    ...theme.shadows.hardSmall,
  },
  miniPolaroidActive: {
    borderColor: colors.ink,
    borderWidth: 3,
    backgroundColor: colors.lime,
  },
  miniPhotoWrapper: {
    width: 54,
    height: 54,
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  miniPhoto: {
    width: '100%',
    height: '100%',
  },
  miniStripBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: colors.yellow,
    borderRadius: 4,
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: colors.ink,
  },
  miniStripBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: colors.ink,
  },
  miniSenderText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.ink,
    marginTop: 4,
    textAlign: 'center',
  },

  // Floating Toast
  floatingToast: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: colors.ink,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    zIndex: 99,
    ...theme.shadows.hard,
  },
  floatingToastText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
  },

  // MODAL KỶ NIỆM TOÀN DIỆN
  memoriesModalContainer: {
    flex: 1,
    backgroundColor: '#FFFBEB',
    paddingTop: 50,
  },
  memoriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  memoriesTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.ink,
  },
  memoriesSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '600',
  },
  memoriesCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.hardSmall,
  },
  memoriesCloseText: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.ink,
  },
  memoriesTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  memoryTabBtn: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memoryTabBtnActive: {
    backgroundColor: colors.lime,
    borderColor: colors.ink,
    borderWidth: 2,
    ...theme.shadows.hardSmall,
  },
  memoryTabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  memoryTabBtnTextActive: {
    color: colors.ink,
    fontWeight: '900',
  },
  memoriesFriendFilterRow: {
    marginBottom: 12,
  },
  memorySubFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  memorySubFilterChipActive: {
    backgroundColor: colors.yellow,
    borderColor: colors.ink,
    borderWidth: 2,
    ...theme.shadows.hardSmall,
  },
  memorySubDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  memorySubFilterText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },
  memorySubFilterTextActive: {
    color: colors.ink,
    fontWeight: '900',
  },
  memoriesGridContainer: {
    paddingHorizontal: 14,
    paddingBottom: 40,
  },
  memoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridItemCard: {
    width: '31%',
    aspectRatio: 0.95,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.ink,
    overflow: 'hidden',
    position: 'relative',
    ...theme.shadows.hardSmall,
  },
  gridItemImg: {
    width: '100%',
    height: '76%',
  },
  gridStripBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: colors.yellow,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.ink,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  gridStripBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: colors.ink,
  },
  gridItemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
    paddingVertical: 3,
    backgroundColor: colors.white,
  },
  gridAuthorCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridAuthorLetter: {
    fontSize: 8,
    fontWeight: '900',
    color: colors.ink,
  },
  gridAuthorText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.ink,
    flex: 1,
  },
  emptyGridArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyGridTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.ink,
    marginBottom: 4,
  },
  emptyGridDesc: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },

  // Modal Chi Tiết Khoảnh Khắc
  detailBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  detailCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: colors.white,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: colors.ink,
    padding: 16,
    ...theme.shadows.hard,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailAvatarLetter: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.ink,
  },
  detailAuthorName: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.ink,
  },
  detailTimeText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  detailCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailCaptionText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.ink,
    textAlign: 'center',
    marginBottom: 14,
  },
  detailActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  detailPinBtn: {
    flex: 1,
    backgroundColor: colors.yellow,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.hardSmall,
  },
  detailPinBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.ink,
  },
  detailOpenFeedBtn: {
    flex: 1,
    backgroundColor: colors.lime,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.hardSmall,
  },
  detailOpenFeedBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.ink,
  },
  detailDeleteBtn: {
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  detailDeleteText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DC2626',
  },

  // Account Switcher Pill in Top Bar
  accountSwitchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.ink,
    paddingHorizontal: 8,
    paddingVertical: 4,
    ...theme.shadows.hardSmall,
  },
  accountSwitchLetterBox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountSwitchLetter: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.white,
  },
  accountSwitchName: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.ink,
    maxWidth: 80,
  },

  // Account Modal
  accountModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(26,26,26,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  accountModalCard: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '80%',
    backgroundColor: colors.white,
    borderRadius: 22,
    borderWidth: 2.5,
    borderColor: colors.ink,
    padding: 18,
    ...theme.shadows.hard,
  },
  accountModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 10,
  },
  accountModalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.ink,
  },
  accountModalSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 2,
  },
  accountModalCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountModalCloseText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.ink,
  },
  accountItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    padding: 12,
    gap: 12,
  },
  accountItemRowActive: {
    borderColor: colors.ink,
    backgroundColor: '#FEF9C3',
    ...theme.shadows.hardSmall,
  },
  accountItemAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountItemLetter: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.ink,
  },
  accountItemInfo: {
    flex: 1,
  },
  accountItemName: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.ink,
  },
  accountActiveBadge: {
    backgroundColor: colors.ink,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  accountActiveBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.white,
  },
  accountItemRole: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
    marginTop: 1,
  },
  accountItemMeta: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  accountItemAction: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
  },
});

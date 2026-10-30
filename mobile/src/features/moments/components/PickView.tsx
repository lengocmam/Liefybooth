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

export interface PickViewProps {
  onCloseFeed?: () => void;
  pullDownPanResponder?: any;
}

export const PickView: React.FC<PickViewProps> = ({ onCloseFeed, pullDownPanResponder }) => {
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

  // Danh sách khoảnh khắc đã lọc theo người đăng trên Feed (luôn sắp xếp thời gian mới nhất lên đầu)
  const filteredMoments = useMemo(() => {
    let list = moments;
    if (activeSenderFilter === 'me') {
      list = moments.filter((m) => m.senderId === currentUser.id);
    } else if (activeSenderFilter !== 'all') {
      list = moments.filter((m) => m.senderId === activeSenderFilter);
    }
    // Sắp xếp giảm dần theo timestamp (mới nhất lên đầu)
    return [...list].sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeB - timeA;
    });
  }, [moments, activeSenderFilter, currentUser.id]);

  const [doubleTapMomentId, setDoubleTapMomentId] = useState<string | null>(null);

  const handlePhotoDoubleTapOnCard = (momentId: string) => {
    const now = Date.now();
    if (now - lastTapRef.current < 350) {
      playShutterSound();
      addReaction(momentId, '❤️');
      setDoubleTapMomentId(momentId);
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
        setDoubleTapMomentId(null);
      });
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  const handleEmojiPressOnCard = (momentId: string, emoji: string) => {
    playShutterSound();
    addReaction(momentId, emoji);
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

  // Helper render dải ảnh Photobooth chuẩn kích thước dọc/lưới + giữ nguyên filter và hiệu ứng viền
  const renderMomentStrip = (momentItem: MomentItem, isDetailModal = false) => {
    const photos = (momentItem.stripPhotos || [momentItem.photoUrl]).slice(0, 4);
    const isGrid = momentItem.layout === 'grid' || momentItem.layout === 'grid_4';
    const filter = momentItem.filter || 'original';
    const frameColor = momentItem.frameColor || '#FF8FC7';
    const edgeStyle = momentItem.edgeStyle || 'classic';

    const getFilterImgStyle = () => {
      if (filter === 'bw') {
        return { opacity: 0.9, tintColor: '#6B7280' as any };
      }
      if (filter === 'warm' || filter === 'cool' || filter === 'vintage' || filter === 'pastel') {
        return { opacity: 0.95 };
      }
      return {};
    };

    const renderFilterOverlay = () => {
      switch (filter) {
        case 'warm':
          return <View style={styles.feedFilterWarm} pointerEvents="none" />;
        case 'cool':
          return <View style={styles.feedFilterCool} pointerEvents="none" />;
        case 'vintage':
          return <View style={styles.feedFilterVintage} pointerEvents="none" />;
        case 'pastel':
          return <View style={styles.feedFilterPastel} pointerEvents="none" />;
        default:
          return null;
      }
    };

    if (isGrid) {
      return (
        <View
          style={[
            styles.photoboothCardStripGrid,
            { backgroundColor: frameColor },
            edgeStyle === 'film_perforated' && styles.filmPerforatedBorder,
            isDetailModal && { marginVertical: 10 },
          ]}
        >
          <View style={styles.photoboothGridPhotos}>
            {photos.map((imgUri, pIdx) => (
              <View key={pIdx} style={styles.photoboothGridSlot}>
                <Image
                  source={{ uri: imgUri }}
                  style={[styles.photoboothMiniImg, getFilterImgStyle()]}
                  resizeMode="cover"
                />
                {renderFilterOverlay()}
              </View>
            ))}
          </View>

          {momentItem.customText ? (
            <Text style={styles.photoboothCustomText} numberOfLines={2}>
              {momentItem.customText}
            </Text>
          ) : momentItem.frameName ? (
            <Text style={styles.photoboothFrameTitle} numberOfLines={1}>
              {momentItem.frameName}
            </Text>
          ) : null}

          {/* Floating stickers nếu có */}
          {momentItem.stickers && momentItem.stickers.length > 0 && (
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              {momentItem.stickers.map((st, sIdx) => (
                <Text
                  key={sIdx}
                  style={{
                    position: 'absolute',
                    left: `${Math.min(Math.max(st.x, 6), 84)}%`,
                    top: `${Math.min(Math.max(st.y, 6), 88)}%`,
                    fontSize: st.size ? Math.min(st.size * 0.65, 26) : 20,
                    transform: [{ rotate: `${st.rotation || 0}deg` }],
                  }}
                >
                  {st.emoji}
                </Text>
              ))}
            </View>
          )}
        </View>
      );
    }

    // Classic Vertical 4-Cut Strip (Dải photobooth 4 ô dọc truyền thống)
    return (
      <View style={styles.photoboothVerticalCenterWrapper}>
        <View
          style={[
            styles.photoboothCardStripVertical,
            { backgroundColor: frameColor },
            edgeStyle === 'film_perforated' && styles.filmPerforatedBorder,
            isDetailModal && { width: '100%', maxWidth: 240, marginVertical: 8 },
          ]}
        >
          {/* Lỗ cuộn phim nếu chọn film_perforated */}
          {edgeStyle === 'film_perforated' && (
            <>
              <View style={styles.feedFilmSprocketsLeft} pointerEvents="none">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => (
                  <View key={k} style={styles.feedFilmHole} />
                ))}
              </View>
              <View style={styles.feedFilmSprocketsRight} pointerEvents="none">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => (
                  <View key={k} style={styles.feedFilmHole} />
                ))}
              </View>
            </>
          )}

          {/* 4 ô ảnh xếp dọc */}
          <View style={styles.photoboothVerticalCol}>
            {photos.map((imgUri, pIdx) => (
              <View key={pIdx} style={styles.photoboothVerticalSlot}>
                <Image
                  source={{ uri: imgUri }}
                  style={[styles.photoboothMiniImg, getFilterImgStyle()]}
                  resizeMode="cover"
                />
                {renderFilterOverlay()}
              </View>
            ))}
          </View>

          {momentItem.customText ? (
            <Text style={styles.photoboothCustomText} numberOfLines={2}>
              {momentItem.customText}
            </Text>
          ) : momentItem.frameName ? (
            <Text style={styles.photoboothFrameTitle} numberOfLines={1}>
              {momentItem.frameName}
            </Text>
          ) : null}

          {/* Floating stickers nếu có */}
          {momentItem.stickers && momentItem.stickers.length > 0 && (
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              {momentItem.stickers.map((st, sIdx) => (
                <Text
                  key={sIdx}
                  style={{
                    position: 'absolute',
                    left: `${Math.min(Math.max(st.x, 8), 82)}%`,
                    top: `${Math.min(Math.max(st.y, 6), 90)}%`,
                    fontSize: st.size ? Math.min(st.size * 0.65, 26) : 20,
                    transform: [{ rotate: `${st.rotation || 0}deg` }],
                  }}
                >
                  {st.emoji}
                </Text>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Locket Pull-Down Handle Bar (Thanh kéo xuống chuẩn Locket) */}
      <View
        {...(pullDownPanResponder ? pullDownPanResponder.panHandlers : {})}
        style={styles.pullDownHeader}
      >
        <View style={styles.dragPillHandle} />
        <Pressable
          onPress={onCloseFeed || (() => setViewMode('plant'))}
          style={({ pressed }) => [
            styles.pullDownHintBtn,
            { transform: [{ scale: pressed ? 0.96 : 1 }] },
          ]}
        >
          <Text style={styles.pullDownHintIcon}>▼</Text>
          <Text style={styles.pullDownHintText}>Kéo xuống để chụp ảnh</Text>
        </Pressable>
      </View>

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
            onPress={onCloseFeed || (() => setViewMode('plant'))}
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

        {/* 3. DÒNG THỜI GIAN LƯỚT DỌC CHUẨN LOCKET (ẢNH MỚI NHẤT HIỆN LÊN TRÊN ĐẦU) */}
        <View style={styles.verticalFeedContainer}>
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
              <Text style={{ fontSize: 40 }}>{poppingEmoji.emoji}</Text>
            </Animated.View>
          )}

          {filteredMoments.length > 0 ? (
            filteredMoments.map((moment, idx) => {
              const isFirst = idx === 0;
              const isStrip = moment.stripPhotos && moment.stripPhotos.length > 1;

              return (
                <View key={moment.id} style={styles.feedCardWrapper}>
                  {/* Header thẻ: Tên người gửi + Thời gian + Badge Mới nhất */}
                  <View style={styles.feedCardTopHeader}>
                    <View style={styles.feedSenderRow}>
                      <View
                        style={[
                          styles.feedSenderAvatar,
                          { backgroundColor: moment.senderColor },
                        ]}
                      >
                        <Text style={styles.feedSenderLetter}>{moment.senderLetter}</Text>
                      </View>
                      <View>
                        <Text style={styles.feedSenderName}>{moment.senderName}</Text>
                        <Text style={styles.senderPillTime}>⏱️ {moment.timeAgo}</Text>
                      </View>
                    </View>

                    <View style={styles.feedCardActions}>
                      {isFirst && (
                        <View style={styles.newestBadge}>
                          <Text style={styles.newestBadgeText}>✨ MỚI NHẤT</Text>
                        </View>
                      )}
                      {moment.senderId === currentUser.id && (
                        <Pressable
                          hitSlop={10}
                          onPress={() => handleDeleteMoment(moment.id)}
                          style={styles.cardMiniActionBtn}
                        >
                          <Text style={{ fontSize: 13 }}>🗑️</Text>
                        </Pressable>
                      )}
                      <Pressable
                        hitSlop={10}
                        onPress={() => handlePinMoment(moment)}
                        style={[styles.cardMiniActionBtn, { backgroundColor: colors.yellow }]}
                      >
                        <Text style={{ fontSize: 13 }}>📌</Text>
                      </Pressable>
                    </View>
                  </View>

                  {/* KHUNG ẢNH: DẢI PHOTOBOOTH 4 Ô HOẶC ẢNH VUÔNG LOCKET (CHẠM ĐÚP ĐỂ THẢ TIM ❤️) */}
                  <Pressable
                    onPress={() => handlePhotoDoubleTapOnCard(moment.id)}
                    style={styles.cardPhotoPressable}
                  >
                    {isStrip && moment.stripPhotos ? (
                      renderMomentStrip(moment)
                    ) : (
                      <View style={styles.photoContainer}>
                        <Image
                          source={{ uri: moment.photoUrl }}
                          style={styles.photo}
                          resizeMode="cover"
                        />
                      </View>
                    )}

                    {/* TIM TO KHI CHẠM ĐÚP */}
                    {doubleTapMomentId === moment.id && (
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
                  {moment.caption ? (
                    <Text style={styles.captionText}>{moment.caption}</Text>
                  ) : null}

                  {/* THANH 5 REACTION EMOJI */}
                  <View style={styles.cardReactionsRow}>
                    {REACTION_ICONS.map((emoji) => {
                      const userReaction = moment.userReactions?.[currentUser.id] ||
                        (currentUser.id === 'me' ? moment.myReaction : undefined);
                      const isMyReaction = userReaction === emoji;
                      const count = moment.reactions[emoji] || 0;
                      const bgColor = REACTION_BG_COLORS[emoji] || colors.white;

                      return (
                        <Pressable
                          key={emoji}
                          onPress={() => handleEmojiPressOnCard(moment.id, emoji)}
                          style={({ pressed }) => [
                            styles.reactionButton,
                            { backgroundColor: bgColor },
                            isMyReaction && styles.reactionButtonActive,
                            { transform: [{ scale: pressed ? 0.9 : isMyReaction ? 1.06 : 1 }] },
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
              );
            })
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
                onPress={onCloseFeed || (() => setViewMode('plant'))}
                style={styles.emptyCardBtn}
              >
                <Text style={styles.emptyCardBtnText}>📸 Chụp & Gửi ngay</Text>
              </Pressable>
            </View>
          )}
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
                  renderMomentStrip(selectedMemoryMoment, true)
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
    backgroundColor: '#0D0E13', // Midnight Dark Feed
    paddingHorizontal: 16,
  },
  pullDownHeader: {
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 8,
    marginBottom: 4,
  },
  dragPillHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    marginBottom: 6,
  },
  pullDownHintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.darkSurfaceElevated,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 3,
    ...theme.shadows.darkSoft,
  },
  pullDownHintIcon: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  pullDownHintText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textPrimary,
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
    color: colors.white,
    letterSpacing: -1,
  },
  memoriesPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentYellow,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    paddingHorizontal: 10,
    paddingVertical: 5,
    ...theme.shadows.darkSoft,
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
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    paddingHorizontal: 12,
    paddingVertical: 6,
    ...theme.shadows.darkSoft,
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
    borderColor: colors.accentYellow,
    backgroundColor: colors.darkSurfaceElevated,
    ...theme.shadows.darkSoft,
  },
  senderAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
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
    backgroundColor: colors.accentYellow,
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
    color: colors.ink,
  },
  senderFilterName: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  senderFilterNameActive: {
    color: colors.white,
    fontWeight: '900',
  },

  // Vertical Locket Feed Styles
  verticalFeedContainer: {
    paddingVertical: 8,
    gap: 16,
  },
  feedCardWrapper: {
    backgroundColor: colors.darkSurface, // Midnight card surface
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    padding: 14,
    ...theme.shadows.darkSoft,
  },
  feedCardTopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  feedSenderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feedSenderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedSenderLetter: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.ink,
  },
  feedSenderName: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  senderPillTime: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: 1,
  },
  feedCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  newestBadge: {
    backgroundColor: colors.accentYellow,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  newestBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.ink,
  },
  cardPhotoPressable: {
    position: 'relative',
    borderRadius: 14,
    overflow: 'hidden',
  },
  cardReactionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
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
  photoboothVerticalCenterWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  photoboothCardStripVertical: {
    width: 220,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: colors.ink,
    padding: 9,
    position: 'relative',
    ...theme.shadows.hard,
  },
  photoboothCardStripGrid: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: colors.ink,
    padding: 8,
    position: 'relative',
    ...theme.shadows.hardSmall,
  },
  photoboothVerticalCol: {
    gap: 7,
  },
  photoboothVerticalSlot: {
    width: '100%',
    aspectRatio: 1.35,
    borderRadius: 6,
    borderWidth: 1.8,
    borderColor: colors.ink,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  photoboothGridSlot: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.ink,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  photoboothCustomText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.ink,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  filmPerforatedBorder: {
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderColor: '#111827',
  },
  feedFilmSprocketsLeft: {
    position: 'absolute',
    left: -10,
    top: 8,
    bottom: 8,
    width: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  feedFilmSprocketsRight: {
    position: 'absolute',
    right: -10,
    top: 8,
    bottom: 8,
    width: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  feedFilmHole: {
    width: 5,
    height: 7,
    borderRadius: 1.5,
    backgroundColor: colors.white,
    marginVertical: 4,
  },
  feedFilterWarm: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(234,88,12,0.14)',
  },
  feedFilterCool: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(2,132,199,0.12)',
  },
  feedFilterVintage: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(120,53,15,0.18)',
  },
  feedFilterPastel: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(244,63,94,0.12)',
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
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: 6,
  },
  captionText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 10,
    marginBottom: 2,
    textAlign: 'center',
  },
  photoIndexBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
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
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  paginationDotActive: {
    width: 16,
    backgroundColor: colors.accentYellow,
  },

  // Empty State Card
  emptyCard: {
    width: 280,
    backgroundColor: colors.darkSurface,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    padding: 24,
    alignItems: 'center',
    ...theme.shadows.darkSoft,
  },
  emptyCardEmoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  emptyCardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyCardDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyCardBtn: {
    backgroundColor: colors.lime,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    ...theme.shadows.darkSoft,
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
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    backgroundColor: colors.darkSurfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...theme.shadows.darkSoft,
  },
  reactionButtonActive: {
    borderWidth: 2,
    borderColor: colors.accentYellow,
    backgroundColor: 'rgba(255, 230, 0, 0.15)',
  },
  reactionEmoji: {
    fontSize: 24,
  },
  reactionCountBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    backgroundColor: colors.accentYellow,
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  reactionCountText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.ink,
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
    color: colors.textPrimary,
  },
  viewAllHistoryLink: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.accentYellow,
    textDecorationLine: 'underline',
  },
  recentScroll: {
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 4,
  },
  miniPolaroid: {
    width: 66,
    backgroundColor: colors.darkSurface,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    padding: 4,
    alignItems: 'center',
    ...theme.shadows.darkSoft,
  },
  miniPolaroidActive: {
    borderColor: colors.accentYellow,
    borderWidth: 2,
    backgroundColor: colors.darkSurfaceElevated,
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
    backgroundColor: colors.accentYellow,
    borderRadius: 4,
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: colors.darkBorder,
  },
  miniStripBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: colors.ink,
  },
  miniSenderText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },

  // Floating Toast
  floatingToast: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: colors.darkSurfaceElevated,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    paddingHorizontal: 16,
    paddingVertical: 8,
    zIndex: 99,
    ...theme.shadows.darkSoft,
  },
  floatingToastText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },

  // MODAL KỶ NIỆM TOÀN DIỆN
  memoriesModalContainer: {
    flex: 1,
    backgroundColor: '#0D0E13',
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
    color: colors.textPrimary,
  },
  memoriesSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  memoriesCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.darkSurfaceElevated,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.darkSoft,
  },
  memoriesCloseText: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textPrimary,
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
    backgroundColor: colors.darkSurfaceElevated,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memoryTabBtnActive: {
    backgroundColor: colors.accentYellow,
    borderColor: colors.accentYellow,
    borderWidth: 1.5,
    ...theme.shadows.darkSoft,
  },
  memoryTabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
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
    backgroundColor: colors.darkSurfaceElevated,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
  },
  memorySubFilterChipActive: {
    backgroundColor: colors.accentYellow,
    borderColor: colors.accentYellow,
    borderWidth: 1.5,
    ...theme.shadows.darkSoft,
  },
  memorySubDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  memorySubFilterText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
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
    backgroundColor: colors.darkSurface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    overflow: 'hidden',
    position: 'relative',
    ...theme.shadows.darkSoft,
  },
  gridItemImg: {
    width: '100%',
    height: '76%',
  },
  gridStripBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: colors.accentYellow,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.darkBorder,
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
    backgroundColor: colors.darkSurfaceElevated,
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
    color: colors.textPrimary,
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
    color: colors.textPrimary,
    marginBottom: 4,
  },
  emptyGridDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Modal Chi Tiết Khoảnh Khắc
  detailBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  detailCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: colors.darkSurface,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    padding: 16,
    ...theme.shadows.darkSoft,
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
    borderColor: colors.darkBorder,
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
    color: colors.textPrimary,
  },
  detailTimeText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  detailCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.darkSurfaceElevated,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailCaptionText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
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
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  accountModalCard: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '80%',
    backgroundColor: colors.darkSurface,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    padding: 18,
    ...theme.shadows.darkSoft,
  },
  accountModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 10,
  },
  accountModalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  accountModalSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 2,
  },
  accountModalCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.darkSurfaceElevated,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountModalCloseText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  accountItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.darkSurfaceElevated,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    padding: 12,
    gap: 12,
  },
  accountItemRowActive: {
    borderColor: colors.accentYellow,
    backgroundColor: 'rgba(255, 230, 0, 0.12)',
    ...theme.shadows.darkSoft,
  },
  accountItemAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
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
    color: colors.textPrimary,
  },
  accountActiveBadge: {
    backgroundColor: colors.accentYellow,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  accountActiveBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.ink,
  },
  accountItemRole: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: 1,
  },
  accountItemMeta: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  accountItemAction: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
  },
});

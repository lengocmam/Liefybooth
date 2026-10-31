import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
  FlatList,
  Dimensions,
  TextInput,
  Modal,
  Alert,
  Animated,
  PanResponder,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH - 24, 380);
import { colors } from '../../../core/theme/colors';
import { theme } from '../../../core/theme/theme';
import { useRouter } from 'expo-router';
import { REACTION_ICONS } from '../../../core/constants';
import { useMomentsStore, MomentItem, TEST_ACCOUNTS, UserAccount } from '../hooks/useMomentsStore';
import { playShutterSound } from '../../booth/services/soundService';
import { useChatStore } from '../../chat/hooks/useChatStore';
import { ChatModal } from '../../chat/components/ChatModal';

const REACTION_BG_COLORS: Record<string, string> = {
  '❤️': colors.yellow,
  '😊': colors.lime,
  '🔥': colors.orange,
  '⭐': colors.sky,
  '😮': colors.white,
};

const WASHI_COLORS = [
  '#F472B6', // Pastel Pink
  '#FBBF24', // Amber Yellow
  '#34D399', // Mint Green
  '#60A5FA', // Sky Blue
  '#A78BFA', // Soft Lavender
  '#FB923C', // Peach Orange
];

const LEAFY_STAMP_CONFIG = [
  { emoji: '❤️', label: 'Yêu', color: '#FFE4E6', borderColor: '#F43F5E', text: '#BE123C' },
  { emoji: '😊', label: 'Cười', color: '#DCFCE7', borderColor: '#22C55E', text: '#15803D' },
  { emoji: '🔥', label: 'Cháy', color: '#FFEDD5', borderColor: '#F97316', text: '#C2410C' },
  { emoji: '⭐', label: 'Sao', color: '#FEF9C3', borderColor: '#EAB308', text: '#A16207' },
  { emoji: '😮', label: 'Wow', color: '#F3E8FF', borderColor: '#A855F7', text: '#7E22CE' },
] as const;

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

  const router = useRouter();
  const [showMemoriesModal, setShowMemoriesModal] = useState(false);
  const [showFriendFilterModal, setShowFriendFilterModal] = useState(false);
  const [showAccountSwitchModal, setShowAccountSwitchModal] = useState(false);
  const [selectedMemoryMoment, setSelectedMemoryMoment] = useState<MomentItem | null>(null);
  const [memoriesTab, setMemoriesTab] = useState<'all' | 'me' | 'friends'>('all');
  const [memoryFriendFilter, setMemoryFriendFilter] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [wallViewMode, setWallViewMode] = useState<'wall' | 'scrapbook'>('wall');

  // Hiệu ứng hạt emoji bay lên khi thả reaction (Tactile reaction pop)
  const [poppingEmoji, setPoppingEmoji] = useState<{ emoji: string; id: number } | null>(null);
  const popAnim = useRef(new Animated.Value(0)).current;

  // Hiệu ứng tim to khi chạm đúp vào ảnh (Double tap to heart)
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);
  const doubleTapAnim = useRef(new Animated.Value(0)).current;
  const lastTapRef = useRef<number>(0);

  // Hiệu ứng cử chỉ vuốt lướt ảnh mượt mà cho Bức tường Leafy
  const isSwipingRef = useRef(false);
  const panAnim = useRef(new Animated.Value(0)).current;
  const cardScaleAnim = useRef(new Animated.Value(1)).current;
  const flatListRef = useRef<FlatList<MomentItem>>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [reelHeight, setReelHeight] = useState<number>(SCREEN_HEIGHT - 120);
  const [replyInput, setReplyInput] = useState<{ [momentId: string]: string }>({});
  const unreadChatCount = useChatStore((s) => s.totalUnreadCount());

  const handleSendReply = (moment: MomentItem) => {
    const text = replyInput[moment.id]?.trim();
    if (!text) return;
    playShutterSound();
    const replyRef = {
      id: moment.id,
      photoUrl: moment.photoUrl,
      caption: moment.caption,
      senderName: moment.senderName,
    };
    useChatStore.getState().sendMessage(moment.senderId, text, replyRef);
    setReplyInput((prev) => ({ ...prev, [moment.id]: '' }));
    showToast(`💬 Đã gửi tin nhắn đến ${moment.senderName}: "${text}"!`);

    // Tự động mở khung chat sau 250ms để tiện xem tiếp
    setTimeout(() => {
      useChatStore.getState().openChatWithFriend(moment.senderId);
    }, 250);
  };

  const formatLeafyDate = (timestamp: string, fallbackTimeAgo: string) => {
    try {
      const d = new Date(timestamp);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      if (isToday) return `Hôm nay · ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      if (d.toDateString() === yesterday.toDateString()) {
        return `Hôm qua · ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
      }
      return `${d.getDate()}/${d.getMonth() + 1} · ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch {
      return fallbackTimeAgo;
    }
  };

  const handleScrollToMoment = (idx: number) => {
    if (idx >= 0 && idx < filteredMoments.length && reelHeight > 0) {
      setActiveMomentIndex(idx);
      flatListRef.current?.scrollToOffset({ offset: idx * reelHeight, animated: true });
    }
  };

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

  // Danh sách khoảnh khắc trên Feed (lọc theo bạn bè nếu chọn, sắp xếp mới nhất lên đầu)
  const filteredMoments = useMemo(() => {
    let list = [...moments];
    if (activeSenderFilter === 'me') {
      list = list.filter((m) => m.senderId === currentUser.id);
    } else if (activeSenderFilter !== 'all') {
      list = list.filter((m) => m.senderId === activeSenderFilter);
    }
    return list.sort((a, b) => {
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
    const targetIdx = filteredMoments.findIndex((m) => m.id === moment.id);
    if (targetIdx !== -1) {
      handleScrollToMoment(targetIdx);
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

  // Helper render dải ảnh Photobooth chuẩn kích thước dọc/lưới + giữ nguyên filter và hiệu ứng viền
  const renderMomentStrip = (momentItem: MomentItem, isDetailModal = false) => {
    const photos = (momentItem.stripPhotos && momentItem.stripPhotos.length > 0
      ? momentItem.stripPhotos
      : [momentItem.photoUrl]).slice(0, 4);
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
              {momentItem.stickers.map((st, sIdx) => {
                const leftPos = st.x > 1 ? `${Math.min(Math.max((st.x / 200) * 100, 4), 86)}%` : `${Math.min(Math.max(st.x, 4), 86)}%`;
                const topPos = st.y > 1 ? `${Math.min(Math.max((st.y / 580) * 100, 4), 92)}%` : `${Math.min(Math.max(st.y, 4), 92)}%`;
                return (
                  <Text
                    key={sIdx}
                    style={{
                      position: 'absolute',
                      left: leftPos as any,
                      top: topPos as any,
                      fontSize: st.size ? Math.min(st.size * 0.7, 26) : 22,
                      transform: [{ rotate: `${st.rotation || 0}deg` }],
                    }}
                  >
                    {st.emoji}
                  </Text>
                );
              })}
            </View>
          )}

          {/* Chữ tự do trên khung nếu có */}
          {momentItem.textItems && momentItem.textItems.length > 0 && (
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              {momentItem.textItems.map((ti, tIdx) => {
                const tLeft = ti.x > 1 ? `${Math.min(Math.max((ti.x / 200) * 100, 6), 84)}%` : `${Math.min(Math.max(ti.x, 6), 84)}%`;
                const tTop = ti.y > 1 ? `${Math.min(Math.max((ti.y / 580) * 100, 4), 92)}%` : `${Math.min(Math.max(ti.y, 4), 92)}%`;
                return (
                  <View
                    key={tIdx}
                    style={{
                      position: 'absolute',
                      left: tLeft as any,
                      top: tTop as any,
                      backgroundColor: ti.bgColor || 'rgba(0,0,0,0.65)',
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 6,
                      transform: [{ rotate: `${ti.rotation || 0}deg` }],
                    }}
                  >
                    <Text
                      style={{
                        fontSize: ti.fontSize ? Math.min(ti.fontSize * 0.75, 16) : 11,
                        fontWeight: '900',
                        color: ti.color || '#FFFFFF',
                      }}
                    >
                      {ti.text}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Con dấu niêm phong nếu có */}
          {momentItem.sealStamp && momentItem.sealStamp !== 'none' && (
            <View style={styles.feedSealStampBadge} pointerEvents="none">
              <Text style={styles.feedSealStampText}>
                {momentItem.sealStamp === 'leafy_certified' ? '🌿 LEAFY' :
                 momentItem.sealStamp === 'special_edition' ? '⭐ VIP' :
                 momentItem.sealStamp === 'besties' ? '👯 BFF' :
                 momentItem.sealStamp === 'love_wax' ? '💌 LOVE' : '✨ SEAL'}
              </Text>
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
              {momentItem.stickers.map((st, sIdx) => {
                const leftPos = st.x > 1 ? `${Math.min(Math.max((st.x / 200) * 100, 4), 86)}%` : `${Math.min(Math.max(st.x, 4), 86)}%`;
                const topPos = st.y > 1 ? `${Math.min(Math.max((st.y / 580) * 100, 4), 92)}%` : `${Math.min(Math.max(st.y, 4), 92)}%`;
                return (
                  <Text
                    key={sIdx}
                    style={{
                      position: 'absolute',
                      left: leftPos as any,
                      top: topPos as any,
                      fontSize: st.size ? Math.min(st.size * 0.7, 26) : 22,
                      transform: [{ rotate: `${st.rotation || 0}deg` }],
                    }}
                  >
                    {st.emoji}
                  </Text>
                );
              })}
            </View>
          )}

          {/* Chữ tự do trên khung nếu có */}
          {momentItem.textItems && momentItem.textItems.length > 0 && (
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              {momentItem.textItems.map((ti, tIdx) => {
                const tLeft = ti.x > 1 ? `${Math.min(Math.max((ti.x / 200) * 100, 6), 84)}%` : `${Math.min(Math.max(ti.x, 6), 84)}%`;
                const tTop = ti.y > 1 ? `${Math.min(Math.max((ti.y / 580) * 100, 4), 92)}%` : `${Math.min(Math.max(ti.y, 4), 92)}%`;
                return (
                  <View
                    key={tIdx}
                    style={{
                      position: 'absolute',
                      left: tLeft as any,
                      top: tTop as any,
                      backgroundColor: ti.bgColor || 'rgba(0,0,0,0.65)',
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 6,
                      transform: [{ rotate: `${ti.rotation || 0}deg` }],
                    }}
                  >
                    <Text
                      style={{
                        fontSize: ti.fontSize ? Math.min(ti.fontSize * 0.75, 16) : 11,
                        fontWeight: '900',
                        color: ti.color || '#FFFFFF',
                      }}
                    >
                      {ti.text}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Con dấu niêm phong nếu có */}
          {momentItem.sealStamp && momentItem.sealStamp !== 'none' && (
            <View style={styles.feedSealStampBadge} pointerEvents="none">
              <Text style={styles.feedSealStampText}>
                {momentItem.sealStamp === 'leafy_certified' ? '🌿 LEAFY' :
                 momentItem.sealStamp === 'special_edition' ? '⭐ VIP' :
                 momentItem.sealStamp === 'besties' ? '👯 BFF' :
                 momentItem.sealStamp === 'love_wax' ? '💌 LOVE' : '✨ SEAL'}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderMomentPage = ({ item: moment, index: idx }: { item: MomentItem; index: number }) => {
    const isFirst = idx === 0;
    const isFramed = Boolean(
      (moment.stripPhotos && moment.stripPhotos.length > 0) ||
      moment.frameColor ||
      moment.frameName ||
      (moment.stickers && moment.stickers.length > 0) ||
      moment.layout
    );

    return (
      <View
        style={[
          styles.reelPageItem,
          { width: SCREEN_WIDTH, height: reelHeight },
        ]}
      >
        {/* 1. KHU VỰC ẢNH CHÍNH (CHUẨN LOCKET: GÓC BO TRÒN 36PX, KHÔNG KHUNG RỐI MẮT) */}
        <Pressable
          onPress={() => handlePhotoDoubleTapOnCard(moment.id)}
          style={styles.locketPhotoPressable}
        >
          {isFramed ? (
            <View style={styles.locketStripContainer}>
              {renderMomentStrip(moment)}
            </View>
          ) : (
            <View style={styles.locketSinglePhotoSlot}>
              <Image
                source={{ uri: moment.photoUrl }}
                style={[
                  styles.locketSinglePhotoImg,
                  moment.isMirrored && { transform: [{ scaleX: -1 }] },
                ]}
                resizeMode="cover"
              />
            </View>
          )}

          {/* Lời nhắn / Caption nổi góc dưới bên trong ảnh chuẩn Locket */}
          {moment.caption ? (
            <View style={styles.locketPhotoCaptionBadge} pointerEvents="none">
              <Text style={styles.locketPhotoCaptionText} numberOfLines={2}>
                "{moment.caption}"
              </Text>
            </View>
          ) : null}

          {/* Tim to nảy lên khi chạm đúp */}
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

        {/* 2. THÔNG TIN NGƯỜI ĐĂNG (NẰM NGAY DƯỚI ẢNH, KHÔNG KHUNG BAO BỌC - CHUẨN LOCKET) */}
        <View style={styles.locketSenderRow}>
          <View style={[styles.locketSenderAvatar, { backgroundColor: moment.senderColor }]}>
            <Text style={styles.locketSenderLetter}>{moment.senderLetter}</Text>
          </View>
          <Text style={styles.locketSenderName}>{moment.senderName}</Text>
          <Text style={styles.locketSenderTime}>
            {formatLeafyDate(moment.timestamp, moment.timeAgo)}
          </Text>
        </View>

        {/* 3. THANH CAPSULE HỢP NHẤT: NHẮN TIN + 4 EMOJI CẢM XÚC TRONG CÙNG 1 KHỐI (CHUẨN LOCKET) */}
        <View style={styles.locketCapsuleBar}>
          <TextInput
            placeholder="Gửi tin nhắn..."
            placeholderTextColor="#8E8E93"
            style={styles.locketCapsuleInput}
            value={replyInput[moment.id] || ''}
            onChangeText={(txt) => setReplyInput((prev) => ({ ...prev, [moment.id]: txt }))}
            onSubmitEditing={() => handleSendReply(moment)}
            returnKeyType="send"
          />

          {Boolean(replyInput[moment.id]?.trim()) ? (
            <Pressable
              onPress={() => handleSendReply(moment)}
              style={({ pressed }) => [
                styles.locketCapsuleSendBtn,
                { transform: [{ scale: pressed ? 0.9 : 1 }] },
              ]}
            >
              <Text style={styles.locketCapsuleSendIcon}>➔</Text>
            </Pressable>
          ) : (
            <View style={styles.locketCapsuleEmojiRow}>
              {['❤️', '🌿', '🔥', '⭐'].map((emoji) => (
                <Pressable
                  key={emoji}
                  onPress={() => handleEmojiPressOnCard(moment.id, emoji)}
                  hitSlop={6}
                  style={({ pressed }) => [
                    styles.locketCapsuleEmojiBtn,
                    { transform: [{ scale: pressed ? 0.85 : 1 }] },
                  ]}
                >
                  <Text style={styles.locketCapsuleEmoji}>{emoji}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 1. TOP BAR CHUẨN LOCKET (👥 Bạn bè - Tất cả bạn bè ▾ - 🎨 Tạo Khung - M 🌳) */}
      <View style={styles.locketTopBar}>
        {/* Nút 👥 Danh sách bạn bè */}
        <Pressable
          onPress={() => {
            playShutterSound();
            router.push('/friends' as any);
          }}
          style={({ pressed }) => [
            styles.locketTopCircleBtn,
            { transform: [{ scale: pressed ? 0.92 : 1 }] },
          ]}
        >
          <Text style={styles.locketTopIcon}>👥</Text>
        </Pressable>

        {/* Nút Dropdown pill "Tất cả bạn bè ▾" - Mở Modal Lọc Người Đăng */}
        <Pressable
          onPress={() => {
            playShutterSound();
            setShowFriendFilterModal(true);
          }}
          style={({ pressed }) => [
            styles.locketTopPill,
            activeSenderFilter !== 'all' && styles.locketTopPillFiltered,
            { transform: [{ scale: pressed ? 0.95 : 1 }] },
          ]}
        >
          <Text style={styles.locketTopPillText}>
            {activeSenderFilter === 'me'
              ? `Của ${currentUser.name}`
              : activeSenderFilter === 'all'
              ? 'Tất cả bạn bè'
              : friends.find((f) => f.id === activeSenderFilter)?.name || 'Bạn bè'}
          </Text>
          <Text style={styles.locketTopPillArrow}>▾</Text>
        </Pressable>

        {/* Nút Chuyển sang Tạo Khung Studio */}
        <Pressable
          onPress={() => {
            playShutterSound();
            router.push('/studio' as any);
          }}
          style={({ pressed }) => [
            styles.locketTopStudioBtn,
            { transform: [{ scale: pressed ? 0.94 : 1 }] },
          ]}
        >
          <Text style={styles.locketTopStudioBtnText}>🎨 Tạo Khung</Text>
        </Pressable>

        {/* Nút Avatar tài khoản "M 🌳" */}
        <Pressable
          onPress={() => setShowAccountSwitchModal(true)}
          style={({ pressed }) => [
            styles.locketTopCircleBtn,
            { backgroundColor: currentUser.avatarColor, transform: [{ scale: pressed ? 0.92 : 1 }] },
          ]}
        >
          <Text style={styles.locketTopAvatarLetter}>{currentUser.avatarLetter}</Text>
        </Pressable>
      </View>

      {/* TRÌNH CHIẾU DẢI ẢNH VUỐT DỌC (LEAFY VERTICAL REEL) */}
      <View
        style={styles.reelContainer}
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h > 50 && Math.abs(h - reelHeight) > 1) {
            setReelHeight(h);
          }
        }}
      >
        {/* Floating Emoji Particle */}
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
          <View style={{ flex: 1, position: 'relative' }}>
            <FlatList
              ref={flatListRef}
              data={filteredMoments}
              horizontal={false}
              pagingEnabled
              showsVerticalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              renderItem={renderMomentPage}
              getItemLayout={reelHeight > 0 ? (_, index) => ({
                length: reelHeight,
                offset: reelHeight * index,
                index,
              }) : undefined}
              snapToInterval={reelHeight > 0 ? reelHeight : undefined}
              snapToAlignment="start"
              decelerationRate="fast"
              onMomentumScrollEnd={(e) => {
                if (reelHeight > 0) {
                  const newIdx = Math.round(e.nativeEvent.contentOffset.y / reelHeight);
                  if (newIdx !== activeMomentIndex && newIdx >= 0 && newIdx < filteredMoments.length) {
                    setActiveMomentIndex(newIdx);
                  }
                }
              }}
              style={styles.reelFlatList}
            />
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyCardEmoji}>🌱</Text>
            <Text style={styles.emptyCardTitle}>Chưa có khoảnh khắc nào</Text>
            <Text style={styles.emptyCardDesc}>
              Hãy chụp photobooth hoặc tạo khung dải ảnh để chia sẻ khoảnh khắc đầu tiên nhé!
            </Text>
            <Pressable
              onPress={onCloseFeed || (() => setViewMode('plant'))}
              style={styles.emptyCardBtn}
            >
              <Text style={styles.emptyCardBtnText}>📸 Chụp & Chia Sẻ Ngay</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* 3. THANH ĐIỀU HƯỚNG DƯỚI ĐÁY CHUẨN LOCKET (BOTTOM NAVIGATION DOCK) */}
      <View style={styles.locketBottomBar}>
        {/* Nút xem lưới ảnh (田) */}
        <Pressable
          onPress={() => setShowMemoriesModal(true)}
          style={({ pressed }) => [
            styles.locketBottomIconBtn,
            { transform: [{ scale: pressed ? 0.9 : 1 }] },
          ]}
        >
          <Text style={styles.locketBottomIconText}>田</Text>
        </Pressable>

        {/* Nút nhảy lên ảnh đầu tiên (⚡) */}
        <Pressable
          onPress={() => handleScrollToMoment(0)}
          style={({ pressed }) => [
            styles.locketBottomIconBtn,
            safeIndex > 0 && styles.locketBottomIconBtnActive,
            { transform: [{ scale: pressed ? 0.9 : 1 }] },
          ]}
        >
          <Text style={[styles.locketBottomIconText, safeIndex > 0 && { color: colors.accentYellow }]}>
            {safeIndex > 0 ? '⚡' : '📅'}
          </Text>
          {safeIndex > 0 && (
            <View style={styles.locketBottomJumpBadge}>
              <Text style={styles.locketBottomJumpBadgeText}>{safeIndex + 1}</Text>
            </View>
          )}
        </Pressable>

        {/* NÚT CHỤP CAMERA TO TRÒN CHUẨN LOCKET (🟡) */}
        <Pressable
          onPress={onCloseFeed || (() => setViewMode('plant'))}
          style={({ pressed }) => [
            styles.locketShutterOuter,
            { transform: [{ scale: pressed ? 0.92 : 1 }] },
          ]}
        >
          <View style={styles.locketShutterInner} />
        </Pressable>

        {/* Nút Trò chuyện / Nhắn tin bạn bè chuẩn Locket (💬) với badge tin nhắn chưa đọc */}
        <Pressable
          onPress={() => {
            playShutterSound();
            if (currentMoment && currentMoment.senderId !== currentUser.id) {
              useChatStore.getState().openChatWithFriend(currentMoment.senderId);
            } else {
              useChatStore.getState().openInbox();
            }
          }}
          style={({ pressed }) => [
            styles.locketBottomIconBtn,
            unreadChatCount > 0 && styles.locketBottomIconBtnActive,
            { transform: [{ scale: pressed ? 0.9 : 1 }] },
          ]}
        >
          <Text style={styles.locketBottomIconText}>💬</Text>
          {unreadChatCount > 0 && (
            <View style={styles.locketBottomChatBadge}>
              <Text style={styles.locketBottomChatBadgeText}>{unreadChatCount}</Text>
            </View>
          )}
        </Pressable>

        {/* Nút chia sẻ hoặc ghim ảnh lên widget (📌 / 🗑️) */}
        <Pressable
          onPress={() => {
            if (currentMoment?.senderId === currentUser.id) {
              handleDeleteMoment(currentMoment.id);
            } else if (currentMoment) {
              handlePinMoment(currentMoment);
            }
          }}
          style={({ pressed }) => [
            styles.locketBottomIconBtn,
            { transform: [{ scale: pressed ? 0.9 : 1 }] },
          ]}
        >
          <Text style={styles.locketBottomIconText}>
            {currentMoment?.senderId === currentUser.id ? '🗑️' : '📌'}
          </Text>
        </Pressable>
      </View>

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
              <Text style={styles.memoriesTitle}>📖 Sổ Lưu Niệm Leafybooth</Text>
              <Text style={styles.memoriesSubtitle}>
                Kho tàng dải ảnh photobooth & khoảnh khắc của tụi mình
              </Text>
            </View>
            <Pressable
              onPress={() => setShowMemoriesModal(false)}
              style={styles.memoriesCloseBtn}
            >
              <Text style={styles.memoriesCloseText}>✕</Text>
            </Pressable>
          </View>

          {/* Banner chuyển nhanh tới Studio Tạo Khung */}
          <Pressable
            onPress={() => {
              setShowMemoriesModal(false);
              playShutterSound();
              router.push('/studio' as any);
            }}
            style={({ pressed }) => [
              styles.memoriesStudioPromoBanner,
              { transform: [{ scale: pressed ? 0.98 : 1 }] },
            ]}
          >
            <View style={styles.memoriesStudioPromoIcon}>
              <Text style={{ fontSize: 20 }}>🎨</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.memoriesStudioPromoTitle}>Tự thiết kế khung độc lạ ✨</Text>
              <Text style={styles.memoriesStudioPromoDesc}>
                Vào Frame Studio sáng tạo khung ảnh với 180+ sticker & font chữ
              </Text>
            </View>
            <Text style={styles.memoriesStudioPromoArrow}>➔</Text>
          </Pressable>

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
                  const isFramed = Boolean(
                    (item.stripPhotos && item.stripPhotos.length > 0) ||
                    item.frameColor ||
                    item.frameName ||
                    (item.stickers && item.stickers.length > 0) ||
                    item.layout
                  );
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => {
                        setShowMemoriesModal(false);
                        const foundIdx = filteredMoments.findIndex((m) => m.id === item.id);
                        if (foundIdx !== -1) {
                          handleScrollToMoment(foundIdx);
                        } else {
                          setActiveSenderFilter('all');
                          setTimeout(() => {
                            const idxAll = moments.findIndex((m) => m.id === item.id);
                            if (idxAll !== -1) {
                              handleScrollToMoment(idxAll);
                            }
                          }, 150);
                        }
                      }}
                      style={({ pressed }) => [
                        styles.gridItemCard,
                        { transform: [{ scale: pressed ? 0.96 : 1 }] },
                      ]}
                    >
                      <Image
                        source={{
                          uri: item.stripPhotos && item.stripPhotos.length > 0 ? item.stripPhotos[0] : item.photoUrl,
                        }}
                        style={styles.gridItemImg}
                      />

                      {/* Badge photobooth nếu là dải hoặc khung */}
                      {isFramed && (
                        <View style={styles.gridStripBadge}>
                          <Text style={styles.gridStripBadgeText}>
                            {item.layout === 'grid' || item.layout === 'grid_4' ? '🎞️ Grid' : '🎞️ Booth'}
                          </Text>
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
                {Boolean(
                  (selectedMemoryMoment.stripPhotos && selectedMemoryMoment.stripPhotos.length > 0) ||
                  selectedMemoryMoment.frameColor ||
                  selectedMemoryMoment.frameName ||
                  (selectedMemoryMoment.stickers && selectedMemoryMoment.stickers.length > 0) ||
                  selectedMemoryMoment.layout
                ) ? (
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

      {/* 10. MODAL LỌC BẠN BÈ CHUẨN LOCKET (FRIEND FEED FILTER) */}
      <Modal
        visible={showFriendFilterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFriendFilterModal(false)}
      >
        <Pressable
          onPress={() => setShowFriendFilterModal(false)}
          style={styles.friendFilterBackdrop}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={styles.friendFilterCard}
          >
            <View style={styles.friendFilterHeader}>
              <View>
                <Text style={styles.friendFilterTitle}>👥 Lọc khoảnh khắc Locket</Text>
                <Text style={styles.friendFilterSubtitle}>Chọn người gửi để lọc ảnh hiển thị trên Feed</Text>
              </View>
              <Pressable
                onPress={() => setShowFriendFilterModal(false)}
                style={styles.friendFilterCloseBtn}
              >
                <Text style={styles.friendFilterCloseText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              {/* Option 1: Tất cả bạn bè */}
              <Pressable
                onPress={() => {
                  playShutterSound();
                  setActiveSenderFilter('all');
                  setActiveMomentIndex(0);
                  setShowFriendFilterModal(false);
                  showToast('🌟 Đang xem tất cả bạn bè');
                }}
                style={[
                  styles.friendFilterItem,
                  activeSenderFilter === 'all' && styles.friendFilterItemActive,
                ]}
              >
                <View style={[styles.friendFilterAvatarCircle, { backgroundColor: colors.yellow }]}>
                  <Text style={styles.friendFilterAvatarLetter}>🌟</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.friendFilterItemName}>Tất cả bạn bè</Text>
                  <Text style={styles.friendFilterItemDesc}>{moments.length} khoảnh khắc trên Feed</Text>
                </View>
                {activeSenderFilter === 'all' && (
                  <Text style={styles.friendFilterCheck}>✓</Text>
                )}
              </Pressable>

              {/* Option 2: Của tôi */}
              <Pressable
                onPress={() => {
                  playShutterSound();
                  setActiveSenderFilter('me');
                  setActiveMomentIndex(0);
                  setShowFriendFilterModal(false);
                  showToast(`👤 Đang xem khoảnh khắc của ${currentUser.name}`);
                }}
                style={[
                  styles.friendFilterItem,
                  activeSenderFilter === 'me' && styles.friendFilterItemActive,
                ]}
              >
                <View style={[styles.friendFilterAvatarCircle, { backgroundColor: currentUser.avatarColor }]}>
                  <Text style={styles.friendFilterAvatarLetter}>{currentUser.avatarLetter}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.friendFilterItemName}>Của tôi ({currentUser.name})</Text>
                  <Text style={styles.friendFilterItemDesc}>{myMomentsCount} khoảnh khắc đã đăng</Text>
                </View>
                {activeSenderFilter === 'me' && (
                  <Text style={styles.friendFilterCheck}>✓</Text>
                )}
              </Pressable>

              {/* Từng bạn bè */}
              {friends.map((f) => {
                const isSelected = activeSenderFilter === f.id;
                const count = friendCounts[f.id] || 0;
                return (
                  <Pressable
                    key={f.id}
                    onPress={() => {
                      playShutterSound();
                      setActiveSenderFilter(f.id);
                      setActiveMomentIndex(0);
                      setShowFriendFilterModal(false);
                      showToast(`🌸 Đang xem ảnh của ${f.name}`);
                    }}
                    style={[
                      styles.friendFilterItem,
                      isSelected && styles.friendFilterItemActive,
                    ]}
                  >
                    <View style={[styles.friendFilterAvatarCircle, { backgroundColor: f.avatarColor }]}>
                      <Text style={styles.friendFilterAvatarLetter}>{f.avatarLetter}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.friendFilterItemName}>{f.name}</Text>
                      <Text style={styles.friendFilterItemDesc}>{count} khoảnh khắc</Text>
                    </View>
                    {isSelected && (
                      <Text style={styles.friendFilterCheck}>✓</Text>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* MODAL TRÒ CHUYỆN / NHẮN TIN TRỰC TIẾP VỚI BẠN BÈ */}
      <ChatModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0C', // Locket Midnight OLED
    paddingHorizontal: 0,
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
  pullDownActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
    paddingVertical: 4,
    ...theme.shadows.darkSoft,
  },
  jumpToInitialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.accentYellow,
    borderWidth: 1.5,
    borderColor: colors.ink,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
    ...theme.shadows.hardSmall,
  },
  jumpToInitialIcon: {
    fontSize: 12,
  },
  jumpToInitialText: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.ink,
  },
  jumpToInitialArrow: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.ink,
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
  brandTitleContainer: {
    justifyContent: 'center',
  },
  topTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: -0.5,
  },
  topSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.2,
    marginTop: 1,
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

  // Leafy Reel Full-screen Styles
  reelContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#0A0A0C',
  },
  reelFlatList: {
    flex: 1,
  },
  reelScrollContent: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
  // Locket Top Bar styles
  locketTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
    height: 52,
    backgroundColor: '#0A0A0C',
  },
  locketTopCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locketTopIcon: {
    fontSize: 18,
  },
  locketTopAvatarLetter: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.ink,
  },
  locketTopPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  locketTopPillFiltered: {
    borderColor: colors.yellow,
  },
  locketTopPillText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  locketTopPillArrow: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8E8E93',
  },
  locketTopStudioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(200, 241, 53, 0.15)',
    borderWidth: 1.5,
    borderColor: colors.yellow,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  locketTopStudioBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.yellow,
  },

  // Locket Photo & Strip Viewport styles
  locketPhotoPressable: {
    width: CARD_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderRadius: 36,
    overflow: 'hidden',
  },
  locketStripContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  locketSinglePhotoSlot: {
    width: CARD_WIDTH,
    aspectRatio: 1,
    borderRadius: 36,
    overflow: 'hidden',
    backgroundColor: '#161922',
  },
  locketSinglePhotoImg: {
    width: '100%',
    height: '100%',
  },
  locketPhotoCaptionBadge: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 7,
    maxWidth: CARD_WIDTH - 40,
  },
  locketPhotoCaptionText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  // Locket Minimal Sender Row directly below photo
  locketSenderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  locketSenderAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locketSenderLetter: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.ink,
  },
  locketSenderName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  locketSenderTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },

  // Locket Unified Capsule Bar (Chat input + Reactions combined)
  locketCapsuleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    width: CARD_WIDTH,
    height: 56,
    backgroundColor: '#1C1C1E',
    borderRadius: 28,
    paddingHorizontal: 16,
    marginTop: 14,
    alignSelf: 'center',
  },
  locketCapsuleInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    paddingVertical: 8,
  },
  locketCapsuleSendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentYellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  locketCapsuleSendIcon: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.ink,
  },
  locketCapsuleEmojiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginLeft: 8,
  },
  locketCapsuleEmojiBtn: {
    padding: 2,
  },
  locketCapsuleEmoji: {
    fontSize: 22,
  },

  // Locket Bottom Bar styles
  locketBottomBar: {
    height: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    backgroundColor: '#0A0A0C',
  },
  locketBottomIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  locketBottomIconBtnActive: {
    borderWidth: 1.5,
    borderColor: colors.accentYellow,
  },
  locketBottomIconText: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  locketBottomJumpBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.accentYellow,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
  },
  locketBottomJumpBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.ink,
  },
  locketBottomChatBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFE600',
    borderRadius: 9,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#0A0A0C',
  },
  locketBottomChatBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.ink,
  },
  locketShutterOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#FFE600',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locketShutterInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
  },
  reelPageItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  reelVerticalNavFloating: {
    position: 'absolute',
    right: 12,
    top: '40%',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(20, 22, 29, 0.88)',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    paddingVertical: 6,
    paddingHorizontal: 4,
    zIndex: 20,
    ...theme.shadows.darkSoft,
  },
  reelVerticalArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.darkSurfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reelVerticalArrowText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  reelVerticalCounterBadge: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  reelVerticalCounterText: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.accentYellow,
  },

  cardPhotoPressable: {
    position: 'relative',
    borderRadius: 14,
    overflow: 'hidden',
  },
  feedCardWrapper: {
    backgroundColor: colors.darkSurface,
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
    paddingVertical: 2,
  },
  photoboothCardStripVertical: {
    width: Math.min(SCREEN_WIDTH - 36, 210),
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.ink,
    padding: 6,
    position: 'relative',
    ...theme.shadows.hard,
  },
  photoboothCardStripGrid: {
    width: CARD_WIDTH,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.ink,
    padding: 8,
    position: 'relative',
    ...theme.shadows.hardSmall,
  },
  photoboothVerticalCol: {
    gap: 4,
  },
  photoboothVerticalSlot: {
    width: '100%',
    height: 86,
    borderRadius: 6,
    borderWidth: 1.2,
    borderColor: colors.ink,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  photoboothGridSlot: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 6,
    borderWidth: 1.2,
    borderColor: colors.ink,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  photoboothCustomText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.ink,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 2,
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
  feedSealStampBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#FFE600',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.ink,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 15,
  },
  feedSealStampText: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.ink,
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
  memoriesStudioPromoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(200, 241, 53, 0.12)',
    borderWidth: 1.5,
    borderColor: colors.yellow,
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    ...theme.shadows.darkSoft,
  },
  memoriesStudioPromoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(200, 241, 53, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memoriesStudioPromoTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.yellow,
  },
  memoriesStudioPromoDesc: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D1D5DB',
    marginTop: 1,
  },
  memoriesStudioPromoArrow: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.yellow,
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

  // Friend Filter Modal
  friendFilterBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  friendFilterCard: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '80%',
    backgroundColor: '#16181F',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    padding: 18,
    ...theme.shadows.darkSoft,
  },
  friendFilterHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 12,
  },
  friendFilterTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  friendFilterSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 2,
  },
  friendFilterCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#242833',
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendFilterCloseText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  friendFilterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E212B',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  friendFilterItemActive: {
    borderColor: colors.yellow,
    backgroundColor: 'rgba(200, 241, 53, 0.12)',
  },
  friendFilterAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendFilterAvatarLetter: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.ink,
  },
  friendFilterItemName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  friendFilterItemDesc: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 2,
  },
  friendFilterCheck: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.yellow,
    marginLeft: 6,
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

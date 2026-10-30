import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../core/theme/colors';
import { theme } from '../../core/theme/theme';
import { useMomentsStore } from '../../features/moments/hooks/useMomentsStore';

interface CustomTabBarProps {
  state: any;
  descriptors?: any;
  navigation?: any;
  navigateToTab?: (routeKey: string) => void;
  emitter?: any;
  insets?: any;
}

const TAB_CONFIG: Record<string, { label: string; icon: string }> = {
  moments: { label: 'Locket', icon: '💛' },
  studio: { label: 'Tạo Khung', icon: '🎨' },
  booth: { label: 'Chụp Booth', icon: '📸' },
  profile: { label: 'Widget & Bạn', icon: '📱' },
};

function StickerPopTabBar({ state, descriptors, navigation, navigateToTab, emitter }: CustomTabBarProps) {
  const insets = useSafeAreaInsets();
  const viewMode = useMomentsStore((s) => s.viewMode);

  const currentRouteName = state.routes[state.index]?.name;
  if (currentRouteName === 'moments' && viewMode === 'pick') {
    return null; // Ẩn tab bar hoàn toàn khi đang lướt Locket Feed toàn màn hình
  }

  return (
    <View style={[styles.tabBarWrapper, { bottom: Math.max(insets.bottom, 16) }]}>
      <View style={styles.tabBarContainer}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors ? descriptors[route.key] || {} : {};
          if (options?.href === null) {
            return null;
          }

          const isFocused = state.index === index;
          const config = TAB_CONFIG[route.name] || { label: route.name, icon: '•' };

          const onPress = () => {
            if (navigation?.emit) {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            } else if (navigateToTab) {
              navigateToTab(route.key);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={[
                styles.tabItem,
                isFocused && styles.tabItemActive,
              ]}
            >
              <Text style={[styles.tabIcon, isFocused && styles.tabIconActive]}>
                {config.icon}
              </Text>
              {isFocused ? (
                <Text style={styles.tabLabelActive} numberOfLines={1}>
                  {config.label}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={props => <StickerPopTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="moments" />
      <Tabs.Screen name="studio" />
      <Tabs.Screen name="booth" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="garden" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  tabBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(20, 22, 29, 0.94)', // Frosted Midnight Floating Dock
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    borderRadius: 36,
    paddingHorizontal: 10,
    paddingVertical: 8,
    width: '100%',
    ...theme.shadows.darkSoft,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 24,
  },
  tabItemActive: {
    backgroundColor: colors.accentYellow,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    paddingHorizontal: 16,
  },
  tabIcon: {
    fontSize: 20,
    color: colors.textSecondary,
  },
  tabIconActive: {
    fontSize: 18,
    marginRight: 6,
    color: colors.ink,
  },
  tabLabelActive: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.ink,
  },
});

import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, shadows, spacing, typography } from "../../constants/theme";
import { useCart } from "../../contexts/CartContext";

interface BottomNavigationBarProps {
  activeTab: string;
  onTabPress: (tab: string) => void;
}

const { width } = Dimensions.get("window");

export const BottomNavigationBar: React.FC<BottomNavigationBarProps> = ({
  activeTab,
  onTabPress,
}) => {
  const insets = useSafeAreaInsets();
  const { getCartItemCount } = useCart();
  const cartItemsCount = getCartItemCount();
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  const tabs = [
    { name: "index", icon: "home-outline", activeIcon: "home", label: "Home" },
    {
      name: "search",
      icon: "search-outline",
      activeIcon: "search",
      label: "Search",
    },
    {
      name: "voice",
      icon: "mic-outline",
      activeIcon: "mic",
      label: "Voice",
      isCenter: true,
    },
    { name: "cart", icon: "cart-outline", activeIcon: "cart", label: "Cart" },
    {
      name: "profile",
      icon: "person-outline",
      activeIcon: "person",
      label: "Profile",
    },
  ];

  React.useEffect(() => {
    const activeIndex = tabs.findIndex((tab) => tab.name === activeTab);
    Animated.spring(animatedValue, {
      toValue: activeIndex,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [activeTab]);

  const handlePress = (tab: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onTabPress(tab);
  };

  const renderTab = (tab: (typeof tabs)[0], index: number) => {
    const isActive = activeTab === tab.name;
    const isCart = tab.name === "cart";
    const isCenter = tab.isCenter;

    return (
      <TouchableOpacity
        key={tab.name}
        onPress={() => handlePress(tab.name)}
        style={[styles.tab, isCenter && styles.centerTab]}
        activeOpacity={0.7}
      >
        <Animated.View
          style={[
            styles.tabContent,
            isActive && styles.activeTabContent,
            isCenter && styles.centerTabContent,
            isActive && isCenter && styles.activeCenterTabContent,
          ]}
        >
          <View style={styles.iconContainer}>
            <Ionicons
              name={(isActive ? tab.activeIcon : tab.icon) as any}
              size={isCenter ? 28 : 24}
              color={
                isActive
                  ? isCenter
                    ? colors.background.light
                    : colors.primary
                  : colors.text.secondary
              }
            />
            {isCart && cartItemsCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {cartItemsCount > 99 ? "99+" : cartItemsCount}
                </Text>
              </View>
            )}
          </View>
          {!isCenter && (
            <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
              {tab.label}
            </Text>
          )}
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const indicatorWidth = width / tabs.length;
  const translateX = animatedValue.interpolate({
    inputRange: tabs.map((_, i) => i),
    outputRange: tabs.map(
      (_, i) => i * indicatorWidth + indicatorWidth / 2 - 20
    ),
  });

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: insets.bottom + spacing.xs,
        },
      ]}
    >
      {/* Active indicator */}
      <Animated.View
        style={[
          styles.activeIndicator,
          {
            transform: [{ translateX }],
          },
        ]}
      />

      {/* Tabs */}
      {tabs.map((tab, index) => renderTab(tab, index))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: colors.background.light,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.xs,
    position: "relative",
    ...shadows.lg,
    // Add subtle gradient effect
    shadowColor: colors.primary,
    shadowOpacity: 0.1,
    elevation: 20,
  },
  activeIndicator: {
    position: "absolute",
    top: 0,
    width: 40,
    height: 3,
    backgroundColor: colors.primary,
    borderRadius: 2,
    zIndex: 1,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
  },
  centerTab: {
    marginTop: -spacing.lg,
  },
  tabContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
    minHeight: 60,
  },
  activeTabContent: {
    backgroundColor: colors.primary + "15", // 15% opacity
    transform: [{ scale: 1.05 }],
  },
  centerTabContent: {
    backgroundColor: colors.background.light,
    borderRadius: 30,
    width: 60,
    height: 60,
    ...shadows.lg,
    elevation: 8,
  },
  activeCenterTabContent: {
    backgroundColor: colors.primary,
    transform: [{ scale: 1.1 }],
  },
  iconContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: "500",
    color: colors.text.secondary,
    marginTop: spacing.xs / 2,
    textAlign: "center",
  },
  activeTabLabel: {
    color: colors.primary,
    fontWeight: "600",
  },
  badge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: colors.status.error,
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.background.light,
  },
  badgeText: {
    color: colors.background.light,
    fontSize: typography.fontSize.xs,
    fontWeight: "bold",
    textAlign: "center",
  },
});

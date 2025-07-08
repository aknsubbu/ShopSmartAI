import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ProductCard } from "../../components/ui/ProductCard";
import { StatusBar } from "../../components/ui/StatusBar";
import { colors, spacing, typography } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/CartContext";
import { Product } from "../../services/cartService";
import { ProductCategory, productService } from "../../services/productService";

const { width, height } = Dimensions.get("window");

// Hero banner data
const heroBanners = [
  {
    id: "1",
    title: "Summer Sale",
    subtitle: "Up to 70% Off",
    description: "Don't miss out on amazing deals",
    backgroundColor: ["#FF6B6B", "#FF8E8E"],
    image: "https://picsum.photos/800/400?random=1",
    cta: "Shop Now",
  },
  {
    id: "2",
    title: "New Arrivals",
    subtitle: "Fresh Collections",
    description: "Discover the latest trends",
    backgroundColor: ["#4ECDC4", "#44A08D"],
    image: "https://picsum.photos/800/400?random=2",
    cta: "Explore",
  },
  {
    id: "3",
    title: "Tech Deals",
    subtitle: "Best Prices",
    description: "Latest gadgets at unbeatable prices",
    backgroundColor: ["#667eea", "#764ba2"],
    image: "https://picsum.photos/800/400?random=3",
    cta: "View Deals",
  },
];

// Quick actions data
const quickActions = [
  { id: "1", icon: "flash", label: "Flash Sale", color: "#FF6B6B" },
  { id: "2", icon: "gift", label: "Daily Deals", color: "#4ECDC4" },
  { id: "3", icon: "star", label: "Top Rated", color: "#FFD93D" },
  { id: "4", icon: "heart", label: "Wishlist", color: "#FF8E8E" },
  { id: "5", icon: "trophy", label: "Best Sellers", color: "#95E1D3" },
  { id: "6", icon: "pricetag", label: "Coupons", color: "#A8E6CF" },
];

// Category icon mapping
const categoryIconMap: Record<string, string> = {
  Electronics: "phone-portrait",
  Fashion: "shirt",
  Home: "home",
  Beauty: "sparkles",
  Sports: "basketball",
  Books: "book",
  Clothing: "shirt-outline",
  "Home & Kitchen": "home-outline",
};

export default function HomeScreen() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const router = useRouter();

  // Data states
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [flashSaleProducts, setFlashSaleProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // UI states
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [showNotification, setShowNotification] = useState(false);

  // Animations
  const fadeInAnimation = useRef(new Animated.Value(0)).current;
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const bannerScrollX = useRef(new Animated.Value(0)).current;
  const quickActionAnimation = useRef(new Animated.Value(0)).current;

  const parseImageUrls = (images: any) => {
    if (!images) {
      return [];
    }

    // Handle string input
    if (typeof images === "string") {
      // Check if it's a JSON string (starts with '[' or '{')
      if (images.trim().startsWith("[") || images.trim().startsWith("{")) {
        try {
          const parsedImages = JSON.parse(images);

          if (!Array.isArray(parsedImages)) {
            return [];
          }

          return parsedImages.filter((url) => {
            if (typeof url !== "string" || !url.trim()) {
              return false;
            }

            // Basic URL validation
            try {
              new URL(url);
              return true;
            } catch {
              return false;
            }
          });
        } catch (error) {
          console.error("Error parsing image URLs:", error);
          return [];
        }
      } else {
        // It's a single URL string
        try {
          new URL(images);
          return [images];
        } catch {
          return [];
        }
      }
    }

    // Handle array input (direct array of URLs)
    if (Array.isArray(images)) {
      return images.filter((url) => {
        if (typeof url !== "string" || !url.trim()) {
          return false;
        }

        // Basic URL validation
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      });
    }

    // Handle any other type
    return [];
  };

  useEffect(() => {
    loadInitialData();
    startAnimations();

    // Auto-scroll banner
    const bannerInterval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % heroBanners.length);
    }, 5000);

    return () => clearInterval(bannerInterval);
  }, []);

  const startAnimations = () => {
    // Stagger animations for different sections
    Animated.stagger(200, [
      Animated.timing(fadeInAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnimation, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(quickActionAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [categoriesData, featuredData] = await Promise.all([
        productService.getCategories(),
        productService.getFeaturedProducts(8),
      ]);

      setCategories(categoriesData.slice(0, 8));
      setFeaturedProducts(featuredData);
      setTrendingProducts(featuredData.slice(0, 6));
      setFlashSaleProducts(featuredData.slice(0, 4));
    } catch (error) {
      console.error("Error loading initial data:", error);
      Alert.alert("Error", "Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const handleAddToCart = async (product: Product) => {
    if (!user) {
      Alert.alert(
        "Sign In Required",
        "Please sign in to add items to your cart.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Sign In", onPress: () => router.push("/auth/login") },
        ]
      );
      return;
    }

    try {
      await addToCart(product, 1);
      setShowNotification(false);
      setTimeout(() => setShowNotification(false), 2000);
    } catch (error) {
      console.error("Error adding to cart:", error);
      Alert.alert("Error", "Failed to add item to cart.");
    }
  };

  const handleQuickAction = (actionId: string) => {
    switch (actionId) {
      case "1": // Flash Sale
        router.push("/(tabs)/search?filter=flash-sale");
        break;
      case "2": // Daily Deals
        router.push("/(tabs)/search?filter=daily-deals");
        break;
      case "3": // Top Rated
        router.push("/(tabs)/search?filter=top-rated");
        break;

      case "5": // Best Sellers
        router.push("/(tabs)/search?filter=best-sellers");
        break;
    }
  };

  const renderHeroBanner = ({ item, index }: { item: any; index: number }) => (
    <View style={[styles.bannerContainer, { width }]}>
      <LinearGradient
        colors={item.backgroundColor}
        style={styles.bannerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.bannerContent}>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>{item.title}</Text>
            <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
            <Text style={styles.bannerDescription}>{item.description}</Text>
            <TouchableOpacity style={styles.bannerCTA}>
              <Text style={styles.bannerCTAText}>{item.cta}</Text>
              <Ionicons name="arrow-forward" size={16} color="white" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.bannerImageContainer}>
          <Image
            source={{ uri: item.image }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
        </View>
      </LinearGradient>
    </View>
  );

  const renderQuickAction = ({ item, index }: { item: any; index: number }) => (
    <Animated.View
      style={[
        styles.quickActionWrapper,
        {
          opacity: quickActionAnimation,
          transform: [
            {
              translateY: quickActionAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0],
              }),
            },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.quickActionCard}
        onPress={() => handleQuickAction(item.id)}
        activeOpacity={0.8}
      >
        <View style={[styles.quickActionIcon, { backgroundColor: item.color }]}>
          <Ionicons name={item.icon as any} size={24} color="white" />
        </View>
        <Text style={styles.quickActionLabel}>{item.label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderCategoryCard = ({
    item,
    index,
  }: {
    item: any;
    index: number;
  }) => (
    <Animated.View
      style={[
        styles.categoryCard,
        {
          opacity: fadeInAnimation,
          transform: [
            {
              scale: fadeInAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              }),
            },
          ],
        },
      ]}
    >
      <TouchableOpacity
        onPress={() => router.push(`/(tabs)/search?category=${item.id}`)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={["#f8fafc", "#ffffff"]}
          style={styles.categoryGradient}
        >
          <View style={styles.categoryIconContainer}>
            <Ionicons
              name={(categoryIconMap[item.name] || "grid-outline") as any}
              size={32}
              color={colors.primary}
            />
          </View>
          <Text style={styles.categoryName}>{item.name}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderFlashSaleCard = ({ item }: { item: Product }) => (
    <View style={styles.flashSaleCard}>
      {(() => {
        // Parse the image URLs from the string
        const imageUrls = parseImageUrls(item.images[0] || "");

        // Get the first image URL or use placeholder
        const imageUrl =
          imageUrls.length > 0 ? imageUrls[0] : "https://picsum.photos/400/400";

        // Return the ProductCard component
        return (
          <ProductCard
            id={item.id}
            title={item.title}
            brand={item.brand}
            onVoicePress={() => {}}
            price={item.price}
            originalPrice={item.originalPrice}
            imageUrl={imageUrl}
            rating={item.rating}
            isNew={
              item.createdAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
            onPress={() => router.push(`/(tabs)/product/${item.id}`)}
            onAddToCart={() => handleAddToCart(item)}
            onAddToWishlist={() => {}}
          />
        );
      })()}

      <View style={styles.flashSaleBadge}>
        <Ionicons name="flash" size={12} color="white" />
        <Text style={styles.flashSaleText}>Flash</Text>
      </View>
    </View>
  );

  const renderTrendingCard = ({ item }: { item: Product }) => (
    <View style={styles.flashSaleCard}>
      {(() => {
        // Parse the image URLs from the string
        const imageUrls = parseImageUrls(item.images[0] || "");

        // Get the first image URL or use placeholder
        const imageUrl =
          imageUrls.length > 0 ? imageUrls[0] : "https://picsum.photos/400/400";

        // Return the ProductCard component
        return (
          <ProductCard
            id={item.id}
            title={item.title}
            brand={item.brand}
            onVoicePress={() => {}}
            price={item.price}
            originalPrice={item.originalPrice}
            imageUrl={imageUrl}
            rating={item.rating}
            isNew={
              item.createdAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
            onPress={() => router.push(`/(tabs)/product/${item.id}`)}
            onAddToCart={() => handleAddToCart(item)}
            onAddToWishlist={() => {}}
          />
        );
      })()}

      <View style={styles.flashSaleBadge}>
        <Ionicons name="trending-up" size={12} color="white" />
        <Text style={styles.flashSaleText}>Trending</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading amazing deals...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar status="idle" isConnected={true} />

      {/* Notification Toast */}
      {showNotification && (
        <Animated.View style={styles.notificationToast}>
          <Ionicons name="checkmark-circle" size={20} color="white" />
          <Text style={styles.notificationText}>Added to cart!</Text>
        </Animated.View>
      )}

      {/* Header */}
      <BlurView intensity={80} style={styles.headerBlur}>
        <LinearGradient
          colors={["rgba(255,255,255,0.9)", "rgba(255,255,255,0.7)"]}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>
                Good{" "}
                {new Date().getHours() < 12
                  ? "Morning"
                  : new Date().getHours() < 17
                  ? "Afternoon"
                  : "Evening"}
              </Text>
              <Text style={styles.userName}>
                {user?.displayName || "Shopper"}!
              </Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.headerButton}>
                <Ionicons
                  name="notifications-outline"
                  size={24}
                  color={colors.text.primary}
                />
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>3</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => router.push("/(tabs)/search")}
              >
                <Ionicons
                  name="search-outline"
                  size={24}
                  color={colors.text.primary}
                />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </BlurView>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {/* Hero Banner */}
        <View style={styles.heroSection}>
          <FlatList
            data={heroBanners}
            renderItem={renderHeroBanner}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: bannerScrollX } } }],
              { useNativeDriver: false }
            )}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(
                event.nativeEvent.contentOffset.x / width
              );
              setCurrentBannerIndex(index);
            }}
          />
          <View style={styles.bannerIndicators}>
            {heroBanners.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.bannerIndicator,
                  currentBannerIndex === index && styles.activeBannerIndicator,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <FlatList
            data={quickActions}
            renderItem={renderQuickAction}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsContainer}
          />
        </View>

        {/* Flash Sale */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="flash" size={24} color="#FF6B6B" />
              <Text style={styles.sectionTitle}>Flash Sale</Text>
              <View style={styles.flashSaleTimer}>
                <Text style={styles.timerText}>23:59:42</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>See All</Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>
          <FlatList
            data={flashSaleProducts}
            renderItem={renderFlashSaleCard}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.flashSaleContainer}
          />
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Shop by Category</Text>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>View All</Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>
          <FlatList
            data={categories}
            renderItem={renderCategoryCard}
            numColumns={4}
            scrollEnabled={false}
            contentContainerStyle={styles.categoriesGrid}
          />
        </View>

        {/* Trending Now */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="trending-up" size={24} color={colors.primary} />
              <Text style={styles.sectionTitle}>Trending Now</Text>
            </View>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>View All</Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>
          <FlatList
            data={trendingProducts}
            renderItem={renderTrendingCard}
            horizontal
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={styles.flashSaleContainer}
          />
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginTop: spacing.base,
  },
  notificationToast: {
    position: "absolute",
    top: Platform.OS === "ios" ? 100 : 80,
    left: spacing.base,
    right: spacing.base,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: spacing.base,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  notificationText: {
    color: "white",
    fontSize: typography.fontSize.base,
    fontWeight: "600",
    marginLeft: spacing.sm,
  },
  headerBlur: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    paddingTop: Platform.OS === "ios" ? 44 : 20,
  },
  headerGradient: {
    paddingBottom: spacing.base,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    fontWeight: "500",
  },
  userName: {
    fontSize: typography.fontSize.xl,
    color: colors.text.primary,
    fontWeight: "800",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.8)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#FF6B6B",
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    marginTop: Platform.OS === "ios" ? 50 : 100,
  },
  heroSection: {
    height: 200,
    marginBottom: spacing.base,
  },
  bannerContainer: {
    height: 200,
  },
  bannerGradient: {
    flex: 1,
    flexDirection: "row",
    marginHorizontal: spacing.base,
    borderRadius: 20,
    overflow: "hidden",
  },
  bannerContent: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: "center",
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: "800",
    color: "white",
    marginBottom: spacing.xs,
  },
  bannerSubtitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
    marginBottom: spacing.sm,
  },
  bannerDescription: {
    fontSize: typography.fontSize.base,
    color: "rgba(255,255,255,0.8)",
    marginBottom: spacing.base,
  },
  bannerCTA: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  bannerCTAText: {
    color: "white",
    fontSize: typography.fontSize.sm,
    fontWeight: "600",
    marginRight: spacing.xs,
  },
  bannerImageContainer: {
    width: 120,
    height: "100%",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
  },
  bannerIndicators: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: spacing.base,
    left: 0,
    right: 0,
  },
  bannerIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.5)",
    marginHorizontal: 4,
  },
  activeBannerIndicator: {
    backgroundColor: "white",
    width: 24,
  },
  quickActionsSection: {
    marginBottom: spacing.lg,
  },
  quickActionsContainer: {
    paddingHorizontal: spacing.base,
    gap: spacing.base,
  },
  quickActionWrapper: {
    alignItems: "center",
  },
  quickActionCard: {
    alignItems: "center",
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.sm,
    backgroundColor: "white",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minWidth: 80,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  quickActionLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: "600",
    color: colors.text.primary,
    textAlign: "center",
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.base,
    marginBottom: spacing.base,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: "800",
    color: colors.text.primary,
    marginLeft: spacing.sm,
  },
  flashSaleTimer: {
    backgroundColor: "#FF6B6B",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: spacing.base,
  },
  timerText: {
    color: "white",
    fontSize: typography.fontSize.xs,
    fontWeight: "700",
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  seeAllText: {
    fontSize: typography.fontSize.sm,
    fontWeight: "600",
    color: colors.primary,
    marginRight: spacing.xs,
  },
  flashSaleContainer: {
    paddingLeft: spacing.base,
    gap: spacing.base,
  },
  flashSaleCard: {
    position: "relative",
    width: 180,
  },
  flashSaleBadge: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: "#FF6B6B",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  flashSaleText: {
    color: "white",
    fontSize: 10,
    fontWeight: "700",
    marginLeft: 4,
  },
  categoriesGrid: {
    paddingHorizontal: spacing.base,
    gap: spacing.base,
  },
  categoryCard: {
    flex: 1,
    margin: spacing.xs,
    aspectRatio: 1,
  },
  categoryGradient: {
    flex: 1,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.base,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: "#f8fafc",
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.base,
  },
  categoryName: {
    fontSize: typography.fontSize.sm,
    fontWeight: "600",
    color: colors.text.primary,
    textAlign: "center",
  },
  categoryImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  productWrapper: {
    flex: 1,
    margin: spacing.xs,
    aspectRatio: 1,
  },
  productImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  productInfo: {
    padding: spacing.sm,
  },
  productTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: "600",
  },
  productPrice: {
    fontSize: typography.fontSize.sm,
    fontWeight: "600",
    color: colors.primary,
  },
  productOriginalPrice: {
    fontSize: typography.fontSize.xs,
    fontWeight: "400",
    color: colors.text.secondary,
    textDecorationLine: "line-through",
    marginRight: spacing.xs,
  },
  productRating: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  ratingIcon: {
    marginRight: 2,
  },
  trendingProductsContainer: {
    paddingHorizontal: spacing.base,
    padding: spacing["2xl"],
    gap: spacing.base,
  },
  trendingProductWrapper: {
    flex: 1,
    margin: spacing.xs,
    aspectRatio: 1,
  },
  trendingProductImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  trendingProductInfo: {
    padding: spacing.sm,
  },
  productsContainer: {
    paddingLeft: spacing.base,
    gap: spacing.base,
  },
  trendingGrid: {
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.lg,
    marginTop: spacing.base,
    gap: spacing.base,
  },
  bottomSpacing: {
    height: 80,
  },
});

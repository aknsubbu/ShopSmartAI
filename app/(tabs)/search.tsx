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
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

const filters = [
  { id: "1", label: "All", count: 1250, icon: "grid-outline" },
  {
    id: "2",
    label: "Hot Deals",
    count: 320,
    icon: "flame-outline",
    trending: true,
  },
  {
    id: "3",
    label: "New",
    count: 150,
    icon: "sparkles-outline",
    badge: "Fresh",
  },
  { id: "4", label: "Top Rated", count: 280, icon: "star-outline" },
  { id: "5", label: "Under $50", count: 420, icon: "pricetag-outline" },
];

const trendingSearches = [
  "iPhone 15",
  "Nike Air Max",
  "Coffee Maker",
  "Gaming Chair",
  "Skincare Set",
];

const parseImageUrls = (imageString: any) => {
  if (!imageString || typeof imageString !== "string") {
    return [];
  }

  try {
    // Parse the stringified JSON array
    const parsedImages = JSON.parse(imageString);

    // Ensure it's an array
    if (!Array.isArray(parsedImages)) {
      return [];
    }

    // Filter out any invalid URLs
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
};

const mockProducts = [
  {
    id: "1",
    title: "AirPods Pro Max",
    brand: "Apple",
    price: 549.99,
    originalPrice: 599.99,
    imageUrl: "https://example.com/airpods.jpg",
    rating: 4.8,
    isNew: true,
    discount: 8,
  },
  {
    id: "2",
    title: 'MacBook Pro 14"',
    brand: "Apple",
    price: 1999.99,
    originalPrice: 2199.99,
    imageUrl: "https://example.com/macbook.jpg",
    rating: 4.9,
    isBestseller: true,
    discount: 9,
  },
];

export default function SearchScreen() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("1");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showTrending, setShowTrending] = useState(true);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Data states
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);

  // Animations
  const searchAnimation = useRef(new Animated.Value(0)).current;
  const listeningPulse = useRef(new Animated.Value(1)).current;
  const categoryAnimation = useRef(new Animated.Value(0)).current;
  const fadeInAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadInitialData();

    // Initial fade in animation
    Animated.timing(fadeInAnimation, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Category cards stagger animation
    Animated.stagger(
      100,
      categories.map((_, index) =>
        Animated.timing(categoryAnimation, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        })
      )
    ).start();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [categoriesData, featuredData] = await Promise.all([
        productService.getCategories(),
        productService.getFeaturedProducts(10),
      ]);

      setCategories(categoriesData);
      setFeaturedProducts(featuredData);
      setProducts(featuredData); // Initially show featured products
    } catch (error) {
      console.error("Error loading initial data:", error);
      Alert.alert("Error", "Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isListening) {
      // Pulsing animation for voice listening
      Animated.loop(
        Animated.sequence([
          Animated.timing(listeningPulse, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(listeningPulse, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      listeningPulse.setValue(1);
    }
  }, [isListening]);

  const handleVoiceSearch = () => {
    setIsListening(!isListening);
    // Haptic feedback simulation
    // Add voice search logic here
  };

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    setShowTrending(searchQuery.length === 0);
    Animated.timing(searchAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleSearchBlur = () => {
    setIsSearchFocused(false);
    if (searchQuery.length === 0) {
      setShowTrending(true);
      Animated.timing(searchAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  const handleCategoryPress = async (categoryId: string) => {
    const newSelectedCategory =
      categoryId === selectedCategory ? null : categoryId;
    setSelectedCategory(newSelectedCategory);

    if (newSelectedCategory) {
      try {
        setLoading(true);
        const category = categories.find((c) => c.id === categoryId);
        if (category) {
          const result = await productService.getProductsByCategory(
            category.name,
            20
          );
          setProducts(result.products);
        }
      } catch (error) {
        console.error("Error loading category products:", error);
        Alert.alert("Error", "Failed to load category products.");
      } finally {
        setLoading(false);
      }
    } else {
      // Show featured products when no category is selected
      setProducts(featuredProducts);
    }
  };

  const handleFilterPress = (filterId: string) => {
    setSelectedFilter(filterId);
    // Add haptic feedback
  };

  const handleTrendingPress = async (term: string) => {
    setSearchQuery(term);
    setShowTrending(false);
    await performSearch(term);
  };

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setProducts(featuredProducts);
      return;
    }

    try {
      setSearchLoading(true);
      const result = await productService.searchProducts(query, {}, 20);
      setProducts(result.products);
    } catch (error) {
      console.error("Error searching products:", error);
      Alert.alert("Error", "Failed to search products.");
    } finally {
      setSearchLoading(false);
    }
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
      Alert.alert("Success", `${product.title} added to cart!`);
    } catch (error) {
      console.error("Error adding to cart:", error);
      Alert.alert("Error", "Failed to add item to cart.");
    }
  };

  const renderCategoryCard = ({
    item,
    index,
  }: {
    item: any;
    index: number;
  }) => (
    <Animated.View
      style={[
        styles.categoryWrapper,
        {
          opacity: fadeInAnimation,
          transform: [
            {
              translateY: fadeInAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.modernCategoryCard,
          selectedCategory === item.id && styles.selectedCategoryCard,
        ]}
        onPress={() => handleCategoryPress(item.id)}
        activeOpacity={0.8}
      >
        <View style={styles.categoryContent}>
          <View style={styles.categoryIconContainer}>
            <Ionicons
              name={(categoryIconMap[item.name] || "grid-outline") as any}
              size={28}
              color={colors.primary}
            />
          </View>
          <Text style={styles.categoryName}>{item.name}</Text>
          <Text style={styles.categoryCount}>Browse {item.name}</Text>
          {selectedCategory === item.id && (
            <View style={styles.selectedIndicator}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={colors.primary}
              />
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderFilterChip = (filter: any) => (
    <TouchableOpacity
      key={filter.id}
      style={[
        styles.modernFilterChip,
        selectedFilter === filter.id && styles.selectedFilterChip,
      ]}
      onPress={() => handleFilterPress(filter.id)}
      activeOpacity={0.8}
    >
      {selectedFilter === filter.id && (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: colors.primary },
          ]}
        />
      )}
      <View style={styles.filterContent}>
        {filter.icon && (
          <Ionicons
            name={filter.icon}
            size={16}
            color={selectedFilter === filter.id ? "white" : colors.text.primary}
            style={styles.filterIcon}
          />
        )}
        <Text
          style={[
            styles.filterLabel,
            selectedFilter === filter.id && styles.selectedFilterLabel,
          ]}
        >
          {filter.label}
        </Text>
        {filter.trending && (
          <View style={styles.trendingBadge}>
            <Ionicons name="trending-up" size={12} color={colors.primary} />
          </View>
        )}
        {filter.badge && (
          <View style={[styles.newBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.badgeText}>{filter.badge}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        status={isListening ? "listening" : "idle"}
        isConnected={true}
      />

      {/* Enhanced Header with Glass Effect */}
      <BlurView intensity={80} style={styles.headerBlur}>
        <LinearGradient
          colors={["rgba(255,255,255,0.9)", "rgba(255,255,255,0.7)"]}
          style={styles.headerGradient}
        >
          <View style={styles.searchHeader}>
            <View style={styles.searchContainer}>
              <Animated.View
                style={[
                  styles.searchBar,
                  {
                    borderColor: searchAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [colors.border, colors.primary],
                    }),
                    shadowOpacity: searchAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.1, 0.3],
                    }),
                  },
                ]}
              >
                <Ionicons
                  name="search"
                  size={20}
                  color={
                    isSearchFocused ? colors.primary : colors.text.secondary
                  }
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="What are you looking for today?"
                  value={searchQuery}
                  onChangeText={(text) => {
                    setSearchQuery(text);
                    setShowTrending(text.length === 0);
                  }}
                  onSubmitEditing={() => performSearch(searchQuery)}
                  onFocus={handleSearchFocus}
                  onBlur={handleSearchBlur}
                  placeholderTextColor={colors.text.secondary}
                  returnKeyType="search"
                />
                <Animated.View
                  style={[
                    styles.voiceButton,
                    {
                      transform: [{ scale: listeningPulse }],
                    },
                  ]}
                >
                  <TouchableOpacity
                    onPress={handleVoiceSearch}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.voiceButtonGradient,
                        {
                          backgroundColor: isListening
                            ? colors.primary
                            : colors.primary,
                        },
                      ]}
                    >
                      <Ionicons
                        name={isListening ? "mic" : "mic-outline"}
                        size={18}
                        color="white"
                      />
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              </Animated.View>

              <TouchableOpacity style={styles.cameraButton} activeOpacity={0.8}>
                <View
                  style={[
                    styles.cameraButtonGradient,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Ionicons name="camera-outline" size={20} color="white" />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </BlurView>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Trending Searches */}
        {showTrending && (
          <Animated.View
            style={[
              styles.trendingContainer,
              {
                opacity: fadeInAnimation,
                transform: [
                  {
                    translateY: fadeInAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.trendingHeader}>
              <View
                style={[
                  styles.trendingIconContainer,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Ionicons name="trending-up" size={16} color="white" />
              </View>
              <Text style={styles.trendingTitle}>Trending Now</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {trendingSearches.map((term, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.trendingChip}
                  onPress={() => handleTrendingPress(term)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.trendingText}>{term}</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={14}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Enhanced Filters */}
        <View style={styles.filtersSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContainer}
          >
            {filters.map(renderFilterChip)}
          </ScrollView>
        </View>

        {/* Categories with Modern Cards */}
        <View style={styles.categoriesContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Shop by Category</Text>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>See All</Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <FlatList
              data={categories}
              renderItem={renderCategoryCard}
              numColumns={2}
              contentContainerStyle={styles.categoriesGrid}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Products with Enhanced Cards */}
        <View style={styles.productsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recommended for You</Text>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>View All</Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>

          {searchLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Searching products...</Text>
            </View>
          ) : products.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="search-outline"
                size={64}
                color={colors.text.secondary}
              />
              <Text style={styles.emptyText}>No products found</Text>
              <Text style={styles.emptySubText}>
                Try adjusting your search or browse categories
              </Text>
            </View>
          ) : (
            <FlatList
              data={products}
              numColumns={2}
              renderItem={({ item }) => (
                <View style={styles.productWrapper}>
                  {(() => {
                    // Parse the image URLs from the string
                    const imageUrls = parseImageUrls(item.images[0] || "");

                    // Get the first image URL or use placeholder
                    const imageUrl =
                      imageUrls.length > 0
                        ? imageUrls[0]
                        : "https://picsum.photos/400/400";

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
                          item.createdAt >
                          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                        }
                        onPress={() =>
                          router.push(`/(tabs)/product/${item.id}`)
                        }
                        onAddToCart={() => handleAddToCart(item)}
                        onAddToWishlist={() => {}}
                      />
                    );
                  })()}
                </View>
              )}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.productsGrid}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  headerBlur: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: Platform.OS === "ios" ? 44 : 24,
  },
  headerGradient: {
    paddingBottom: spacing.base,
  },
  searchHeader: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 24,
    borderWidth: 2,
    paddingHorizontal: spacing.base,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 8,
    minHeight: 52,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontWeight: "500",
  },
  voiceButton: {
    marginLeft: spacing.sm,
  },
  voiceButtonGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  cameraButton: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  cameraButtonGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    marginTop: Platform.OS === "ios" ? 10 : 10,
  },
  trendingContainer: {
    padding: spacing.base,
    backgroundColor: "white",
    marginHorizontal: spacing.base,
    marginTop: spacing.sm,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  trendingHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  trendingIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
  },
  trendingTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: "700",
    color: colors.text.primary,
  },
  trendingChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  trendingText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontWeight: "600",
    marginRight: spacing.xs,
  },
  filtersSection: {
    marginTop: spacing.base,
  },
  filtersContainer: {
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
  },
  modernFilterChip: {
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: "white",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedFilterChip: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
  },
  filterContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  filterIcon: {
    marginRight: spacing.xs,
  },
  filterLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: "600",
    color: colors.text.primary,
  },
  selectedFilterLabel: {
    color: "white",
  },
  trendingBadge: {
    marginLeft: spacing.xs,
  },
  newBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: spacing.xs,
  },
  badgeText: {
    fontSize: 10,
    color: "white",
    fontWeight: "700",
  },
  categoriesContainer: {
    padding: spacing.base,
    marginTop: spacing.base,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.base,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: "800",
    color: colors.text.primary,
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
  categoriesGrid: {
    gap: spacing.base,
  },
  categoryWrapper: {
    flex: 1,
    margin: spacing.xs,
  },
  modernCategoryCard: {
    borderRadius: 20,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: colors.border,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    padding: spacing.sm,
  },
  selectedCategoryCard: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
  },
  categoryGradient: {
    padding: spacing.base,
    minHeight: 120,
    justifyContent: "space-between",
    position: "relative",
  },
  categoryContent: {
    flex: 1,
    justifyContent: "center",
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
    marginBottom: spacing.sm,
  },
  categoryName: {
    fontSize: typography.fontSize.base,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  categoryCount: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontWeight: "500",
  },
  selectedIndicator: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
  },
  productsContainer: {
    padding: spacing.base,
  },
  productWrapper: {
    flex: 1,
    margin: spacing.xs,
  },
  productsGrid: {
    gap: spacing.base,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    minHeight: 200,
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginTop: spacing.base,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    minHeight: 200,
  },
  emptyText: {
    fontSize: typography.fontSize.xl,
    fontWeight: "600",
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  emptySubText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
  },
});

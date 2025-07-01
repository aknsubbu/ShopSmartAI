import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, shadows, spacing, typography } from "../../../constants/theme";
import { Product } from "../../../services/cartService";
import { productService } from "../../../services/productService";
import { useCart } from "../../../contexts/CartContext";
import { useAuth } from "../../../contexts/AuthContext";

const { width } = Dimensions.get("window");

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const productData = await productService.getProduct(id!);
      setProduct(productData);
    } catch (error) {
      console.error('Error loading product:', error);
      Alert.alert('Error', 'Failed to load product details.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to add items to your cart.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/auth/login') },
      ]);
      return;
    }

    if (!product) return;

    try {
      await addToCart(product, quantity);
      Alert.alert('Success', `${product.title} added to cart!`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'Failed to add item to cart.');
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to purchase items.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/auth/login') },
      ]);
      return;
    }

    await handleAddToCart();
    router.push('/(tabs)/cart');
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading product...</Text>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.text.secondary} />
        <Text style={styles.errorText}>Product not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backIcon} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <TouchableOpacity style={styles.shareIcon}>
          <Ionicons name="share-outline" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Product Images */}
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / width);
              setSelectedImageIndex(index);
            }}
          >
            {product.images.map((image, index) => (
              <Image
                key={index}
                source={{ uri: image || "https://picsum.photos/400/400" }}
                style={styles.productImage}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
          
          {/* Image Indicators */}
          {product.images.length > 1 && (
            <View style={styles.imageIndicators}>
              {product.images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    index === selectedImageIndex && styles.activeIndicator,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <View style={styles.brandRow}>
            <Text style={styles.brand}>{product.brand}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.rating}>{product.rating}</Text>
              <Text style={styles.reviewCount}>({product.reviewCount} reviews)</Text>
            </View>
          </View>

          <Text style={styles.title}>{product.title}</Text>
          
          <View style={styles.priceContainer}>
            <Text style={styles.price}>${product.price.toFixed(2)}</Text>
            {product.originalPrice && product.originalPrice > product.price && (
              <>
                <Text style={styles.originalPrice}>${product.originalPrice.toFixed(2)}</Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>
                    {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                  </Text>
                </View>
              </>
            )}
          </View>

          <Text style={styles.description}>{product.description}</Text>

          {/* Specifications */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <View style={styles.specificationsContainer}>
              <Text style={styles.specificationsTitle}>Specifications</Text>
              {Object.entries(product.specifications).map(([key, value]) => (
                <View key={key} style={styles.specificationRow}>
                  <Text style={styles.specificationKey}>{key}:</Text>
                  <Text style={styles.specificationValue}>{value}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Stock Status */}
          <View style={styles.stockContainer}>
            <Ionicons 
              name={product.inStock ? "checkmark-circle" : "close-circle"} 
              size={20} 
              color={product.inStock ? colors.status.success : colors.status.error} 
            />
            <Text style={[
              styles.stockText,
              { color: product.inStock ? colors.status.success : colors.status.error }
            ]}>
              {product.inStock ? `In Stock (${product.stockQuantity} available)` : 'Out of Stock'}
            </Text>
          </View>

          {/* Quantity Selector */}
          {product.inStock && (
            <View style={styles.quantityContainer}>
              <Text style={styles.quantityLabel}>Quantity:</Text>
              <View style={styles.quantitySelector}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Ionicons name="remove" size={18} color={colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{quantity}</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                >
                  <Ionicons name="add" size={18} color={colors.text.primary} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      {product.inStock && (
        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
            <Ionicons name="cart-outline" size={20} color={colors.text.light} />
            <Text style={styles.addToCartText}>Add to Cart</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buyNowButton} onPress={handleBuyNow}>
            <Text style={styles.buyNowText}>Buy Now</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backIcon: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: "600",
    color: colors.text.primary,
  },
  shareIcon: {
    padding: spacing.sm,
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    position: "relative",
  },
  productImage: {
    width: width,
    height: width,
    backgroundColor: colors.background.light,
  },
  imageIndicators: {
    position: "absolute",
    bottom: spacing.base,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    marginHorizontal: spacing.xs / 2,
  },
  activeIndicator: {
    backgroundColor: colors.primary,
  },
  productInfo: {
    padding: spacing.base,
  },
  brandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  brand: {
    fontSize: typography.fontSize.base,
    fontWeight: "600",
    color: colors.text.secondary,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rating: {
    fontSize: typography.fontSize.sm,
    fontWeight: "600",
    color: colors.text.primary,
    marginLeft: spacing.xs,
  },
  reviewCount: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize["2xl"],
    fontWeight: "bold",
    color: colors.text.primary,
    marginBottom: spacing.base,
    lineHeight: 32,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.base,
  },
  price: {
    fontSize: typography.fontSize["2xl"],
    fontWeight: "bold",
    color: colors.primary,
  },
  originalPrice: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    textDecorationLine: "line-through",
    marginLeft: spacing.sm,
  },
  discountBadge: {
    backgroundColor: colors.status.error,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 4,
    marginLeft: spacing.sm,
  },
  discountText: {
    fontSize: typography.fontSize.xs,
    fontWeight: "bold",
    color: colors.text.light,
  },
  description: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  specificationsContainer: {
    marginBottom: spacing.lg,
  },
  specificationsTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: "bold",
    color: colors.text.primary,
    marginBottom: spacing.base,
  },
  specificationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  specificationKey: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    flex: 1,
  },
  specificationValue: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
  stockContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  stockText: {
    fontSize: typography.fontSize.base,
    fontWeight: "600",
    marginLeft: spacing.sm,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  quantityLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: "600",
    color: colors.text.primary,
  },
  quantitySelector: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
  },
  quantityButton: {
    padding: spacing.sm,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityText: {
    fontSize: typography.fontSize.lg,
    fontWeight: "600",
    color: colors.text.primary,
    minWidth: 40,
    textAlign: "center",
  },
  bottomActions: {
    flexDirection: "row",
    padding: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.base,
  },
  addToCartButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.text.secondary,
    padding: spacing.base,
    borderRadius: 8,
    ...shadows.base,
  },
  addToCartText: {
    fontSize: typography.fontSize.base,
    fontWeight: "600",
    color: colors.text.light,
    marginLeft: spacing.sm,
  },
  buyNowButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    padding: spacing.base,
    borderRadius: 8,
    ...shadows.base,
  },
  buyNowText: {
    fontSize: typography.fontSize.base,
    fontWeight: "bold",
    color: colors.text.light,
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginTop: spacing.base,
  },
  errorText: {
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    marginTop: spacing.base,
    marginBottom: spacing.xl,
    textAlign: "center",
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: "600",
    color: colors.text.light,
  },
});
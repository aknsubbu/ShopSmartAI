import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors, shadows, spacing, typography } from "../../constants/theme";

type ProductCardProps = {
  id: string;
  title: string;
  brand: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  rating: number;
  isNew?: boolean;
  onPress: () => void;
  onVoicePress: () => void;
  onAddToCart: () => void;
  onAddToWishlist: () => void;
  isWishlisted?: boolean;
};

const { width } = Dimensions.get("window");
const cardWidth = (width - spacing.base * 3) / 2;

export function ProductCard({
  title,
  brand,
  price,
  originalPrice,
  imageUrl,
  rating,
  onPress,
  onVoicePress,
  onAddToCart,
  onAddToWishlist,
  isWishlisted = false,
}: ProductCardProps) {
  const discount = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUrl }} style={styles.image} />
        {discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discount}% OFF</Text>
          </View>
        )}
        <TouchableOpacity style={styles.voiceButton} onPress={onVoicePress}>
          <Ionicons name="mic-outline" size={16} color={colors.text.light} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.brand} numberOfLines={1}>
          {brand}
        </Text>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>${price.toFixed(2)}</Text>
          {originalPrice && (
            <Text style={styles.originalPrice}>
              ${originalPrice.toFixed(2)}
            </Text>
          )}
        </View>
        <View style={styles.footer}>
          <View style={styles.rating}>
            <Ionicons name="star" size={14} color={colors.status.warning} />
            <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onAddToWishlist}
            >
              <Ionicons
                name={isWishlisted ? "heart" : "heart-outline"}
                size={20}
                color={
                  isWishlisted ? colors.status.error : colors.text.secondary
                }
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={onAddToCart}>
              <Ionicons
                name="cart-outline"
                size={20}
                color={colors.text.secondary}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: cardWidth,
    backgroundColor: colors.background.light,
    borderRadius: 12,
    marginBottom: spacing.base,
    ...shadows.sm,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: cardWidth,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  discountBadge: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.status.error,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  discountText: {
    color: colors.text.light,
    fontSize: typography.fontSize.xs,
    fontWeight: "bold",
  },
  voiceButton: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.sm,
  },
  content: {
    padding: spacing.sm,
  },
  brand: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontWeight: "500",
    marginBottom: spacing.xs,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  price: {
    fontSize: typography.fontSize.base,
    fontWeight: "bold",
    color: colors.text.primary,
    marginRight: spacing.xs,
  },
  originalPrice: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textDecorationLine: "line-through",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rating: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
  actions: {
    flexDirection: "row",
  },
  actionButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
});

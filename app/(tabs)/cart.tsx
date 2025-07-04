import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { colors, spacing, typography } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/CartContext";

// Mock data
const mockCartItems = [
  {
    id: "1",
    title: "Wireless Noise Cancelling Headphones",
    brand: "SoundMax",
    price: 199.99,
    imageUrl: "https://example.com/headphones.jpg",
    quantity: 1,
    color: "Black",
  },
  {
    id: "2",
    title: "Smart Watch Series 5",
    brand: "TechGear",
    price: 299.99,
    imageUrl: "https://example.com/watch.jpg",
    quantity: 1,
    color: "Silver",
  },
];

const suggestedCommands = [
  "Read cart",
  "Remove item",
  "Change qty",
  "Apply coupon",
  "Checkout",
];

export default function CartScreen() {
  const { user } = useAuth();
  const {
    cart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    getCartTotal,
  } = useCart();
  const router = useRouter();
  const [isListening, setIsListening] = useState(false);
  const slideValue = useRef(new Animated.Value(0)).current;
  const [isSliding, setIsSliding] = useState(false);

  const subtotal = getCartTotal();
  const shipping = subtotal > 0 ? 9.99 : 0;
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + shipping + tax;

  const handleVoicePress = () => {
    setIsListening(!isListening);
    // Add voice interaction logic here
  };

  const handleQuantityChange = async (itemId: string, change: number) => {
    if (!cart) return;

    const item = cart.items.find((item) => item.id === itemId);
    if (!item) return;

    const newQuantity = Math.max(1, item.quantity + change);

    try {
      await updateCartItemQuantity(itemId, newQuantity);
    } catch (error) {
      Alert.alert("Error", "Failed to update item quantity");
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeFromCart(itemId);
    } catch (error) {
      Alert.alert("Error", "Failed to remove item from cart");
    }
  };

  const handleSaveForLater = (itemId: string) => {
    // Add save for later logic
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderGrant: () => {
        setIsSliding(true);
      },
      onPanResponderMove: (evt, gestureState) => {
        const newValue = Math.max(0, Math.min(250, gestureState.dx));
        slideValue.setValue(newValue);
      },
      onPanResponderRelease: (evt, gestureState) => {
        setIsSliding(false);
        const slideThreshold = 180;

        if (gestureState.dx >= slideThreshold) {
          // Trigger checkout
          Animated.spring(slideValue, {
            toValue: 250,
            useNativeDriver: false,
          }).start(() => {
            console.log("Proceeding to checkout...");
            // Reset the slider after a brief moment
            setTimeout(() => {
              Animated.spring(slideValue, {
                toValue: 0,
                useNativeDriver: false,
              }).start();
            }, 1000);
          });
        } else {
          // Reset to original position
          Animated.spring(slideValue, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Shopping Cart</Text>
        <TouchableOpacity style={styles.voiceButton} onPress={handleVoicePress}>
          <Ionicons
            name={isListening ? "mic" : "mic-outline"}
            size={22}
            color={colors.primary}
          />
          <Text style={styles.voiceButtonText}>
            {isListening ? "Listening..." : "Voice"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Voice Commands - Reduced size */}
      <View style={styles.commandsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.commandsContainer}
          contentContainerStyle={styles.commandsContent}
        >
          {suggestedCommands.map((command, index) => (
            <TouchableOpacity
              key={index}
              style={styles.commandChip}
              onPress={() => {
                setIsListening(true);
                // Add voice command logic here
              }}
            >
              <Text style={styles.commandText}>{command}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Cart Items */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!user ? (
          <View style={styles.emptyCartContainer}>
            <Ionicons
              name="person-outline"
              size={64}
              color={colors.text.secondary}
            />
            <Text style={styles.emptyCartText}>
              Please sign in to view your cart
            </Text>
            <TouchableOpacity
              style={styles.signInButton}
              onPress={() => router.push("/auth/login")}
            >
              <Text style={styles.signInButtonText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        ) : !cart || cart.items.length === 0 ? (
          <View style={styles.emptyCartContainer}>
            <Ionicons
              name="cart-outline"
              size={64}
              color={colors.text.secondary}
            />
            <Text style={styles.emptyCartText}>Your cart is empty</Text>
            <Text style={styles.emptyCartSubText}>
              Add some items to get started
            </Text>
            <TouchableOpacity
              style={styles.shopButton}
              onPress={() => router.push("/(tabs)/search")}
            >
              <Text style={styles.shopButtonText}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        ) : (
          cart.items.map((item) => (
            <View key={item.id} style={styles.cartItem}>
              <View style={styles.itemImageContainer}>
                <Image
                  source={{
                    uri:
                      item.product.images[0] || "https://picsum.photos/200/200",
                  }}
                  style={styles.itemImage}
                />
              </View>
              <View style={styles.itemDetails}>
                <Text style={styles.itemBrand}>{item.product.brand}</Text>
                <Text style={styles.itemTitle} numberOfLines={2}>
                  {item.product.title}
                </Text>
                {item.selectedVariant && (
                  <Text style={styles.itemColor}>
                    Variant: {item.selectedVariant}
                  </Text>
                )}
                <View style={styles.itemActions}>
                  <View style={styles.quantityContainer}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => handleQuantityChange(item.id, -1)}
                    >
                      <Ionicons
                        name="remove"
                        size={18}
                        color={colors.text.primary}
                      />
                    </TouchableOpacity>
                    <Text style={styles.quantity}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => handleQuantityChange(item.id, 1)}
                    >
                      <Ionicons
                        name="add"
                        size={18}
                        color={colors.text.primary}
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.itemButtons}>
                    <TouchableOpacity
                      style={styles.itemButton}
                      onPress={() => handleSaveForLater(item.id)}
                    >
                      <Ionicons
                        name="bookmark-outline"
                        size={18}
                        color={colors.text.secondary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.itemButton}
                      onPress={() => handleRemoveItem(item.id)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color={colors.status.error}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              <View style={styles.priceContainer}>
                <Text style={styles.itemPrice}>
                  ${(item.product.price * item.quantity).toFixed(2)}
                </Text>
              </View>
            </View>
          ))
        )}

        {/* Order Summary */}
        {cart && cart.items.length > 0 && (
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Order Summary</Text>
            <View style={styles.summaryContent}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Shipping</Text>
                <Text style={styles.summaryValue}>${shipping.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax</Text>
                <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Slide to Checkout Button */}
      {cart && cart.items.length > 0 && (
        <View style={styles.bottomBar}>
          <View style={styles.sliderContainer}>
            <View style={styles.sliderTrack}>
              <Text
                style={[styles.sliderText, isSliding && styles.sliderTextFaded]}
              >
                Slide to Checkout
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.text.secondary}
                style={[styles.sliderIcon, isSliding && styles.sliderIconFaded]}
              />
            </View>
            <Animated.View
              style={[
                styles.sliderButton,
                {
                  transform: [
                    {
                      translateX: slideValue,
                    },
                  ],
                },
              ]}
              {...panResponder.panHandlers}
            >
              <Ionicons name="card" size={24} color="white" />
            </Animated.View>
          </View>
          <Text style={styles.totalSummary}>Total: ${total.toFixed(2)}</Text>
        </View>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.base,
    paddingTop: spacing["2xl"],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background.light,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: "700",
    color: colors.text.primary,
  },
  voiceButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.primary + "15",
    borderRadius: 20,
  },
  voiceButtonText: {
    marginLeft: spacing.xs,
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: "500",
  },
  commandsWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background.light,
  },
  commandsContainer: {
    maxHeight: 40,
  },
  commandsContent: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    alignItems: "center",
  },
  commandChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.background.light,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    minHeight: 28,
    justifyContent: "center",
  },
  commandText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.primary,
    fontWeight: "500",
  },
  content: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  cartItem: {
    flexDirection: "row",
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: "white",
    marginHorizontal: spacing.sm,
    marginTop: spacing.sm,
    borderRadius: 12,
  },
  itemImageContainer: {
    marginRight: spacing.base,
  },
  itemImage: {
    width: 90,
    height: 90,
    borderRadius: 8,
    backgroundColor: colors.background.light,
  },
  itemDetails: {
    flex: 1,
    justifyContent: "space-between",
  },
  itemBrand: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontWeight: "500",
  },
  itemTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: "600",
    color: colors.text.primary,
    marginVertical: spacing.xs / 2,
  },
  itemColor: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  itemActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background.light,
  },
  quantity: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    marginHorizontal: spacing.base,
    fontWeight: "600",
  },
  itemButtons: {
    flexDirection: "row",
  },
  itemButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  priceContainer: {
    justifyContent: "center",
    alignItems: "flex-end",
    marginLeft: spacing.sm,
  },
  itemPrice: {
    fontSize: typography.fontSize.lg,
    fontWeight: "700",
    color: colors.text.primary,
  },
  summaryContainer: {
    margin: spacing.base,
    backgroundColor: "white",
    borderRadius: 12,
    padding: spacing.base,
  },
  summaryTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: spacing.base,
  },
  summaryContent: {
    paddingTop: spacing.sm,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  summaryValue: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontWeight: "500",
  },
  totalRow: {
    marginTop: spacing.base,
    paddingTop: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: {
    fontSize: typography.fontSize.lg,
    fontWeight: "700",
    color: colors.text.primary,
  },
  totalValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: "700",
    color: colors.primary,
  },
  bottomBar: {
    padding: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: "white",
  },
  sliderContainer: {
    position: "relative",
    height: 60,
    backgroundColor: colors.background.light,
    borderRadius: 30,
    borderColor: colors.primary,
    borderWidth: 1,
    marginBottom: spacing.sm,
    overflow: "hidden",
  },
  sliderTrack: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  sliderText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    fontWeight: "600",
    marginRight: spacing.sm,
  },
  sliderIcon: {
    opacity: 0.6,
  },
  sliderTextFaded: {
    opacity: 0.3,
  },
  sliderIconFaded: {
    opacity: 0.2,
  },
  sliderButton: {
    position: "absolute",
    left: 4,
    top: 4,
    width: 52,
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  totalSummary: {
    textAlign: "center",
    fontSize: typography.fontSize.lg,
    fontWeight: "700",
    color: colors.text.primary,
  },
  emptyCartContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    marginTop: spacing["3xl"],
  },
  emptyCartText: {
    fontSize: typography.fontSize.xl,
    fontWeight: "600",
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  emptyCartSubText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  signInButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
    borderRadius: 8,
  },
  signInButtonText: {
    color: colors.text.light,
    fontSize: typography.fontSize.base,
    fontWeight: "600",
  },
  shopButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
    borderRadius: 8,
  },
  shopButtonText: {
    color: colors.text.light,
    fontSize: typography.fontSize.base,
    fontWeight: "600",
  },
});

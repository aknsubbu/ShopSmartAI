import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "../../components/ui/StatusBar";
import { colors, spacing, typography } from "../../constants/theme";

// Mock data
const mockOrder = {
  items: [
    {
      id: "1",
      title: "Wireless Noise Cancelling Headphones",
      price: 199.99,
      quantity: 1,
    },
    {
      id: "2",
      title: "Smart Watch Series 5",
      price: 299.99,
      quantity: 1,
    },
  ],
  subtotal: 499.98,
  shipping: 9.99,
  tax: 49.99,
  total: 559.96,
};

const suggestedCommands = [
  "Add new address",
  "Change payment method",
  "Apply gift card",
  "Review order",
  "Place order",
];

export default function CheckoutScreen() {
  const [isListening, setIsListening] = useState(false);
  const [step, setStep] = useState(1);
  const [useVoiceConfirmation, setUseVoiceConfirmation] = useState(true);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("card");

  const handleVoicePress = () => {
    setIsListening(!isListening);
    // Add voice interaction logic here
  };

  const handleNextStep = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handlePreviousStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const renderShippingAddress = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Shipping Address</Text>
        <TouchableOpacity style={styles.editButton}>
          <Ionicons name="pencil" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
      <View style={styles.addressCard}>
        <Text style={styles.addressName}>John Doe</Text>
        <Text style={styles.addressText}>123 Main Street</Text>
        <Text style={styles.addressText}>Apt 4B</Text>
        <Text style={styles.addressText}>New York, NY 10001</Text>
        <Text style={styles.addressText}>United States</Text>
        <Text style={styles.addressText}>+1 (555) 123-4567</Text>
      </View>
    </View>
  );

  const renderPaymentMethod = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        <TouchableOpacity style={styles.editButton}>
          <Ionicons name="pencil" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
      <View style={styles.paymentCard}>
        <View style={styles.paymentMethod}>
          <TouchableOpacity
            style={[
              styles.paymentOption,
              selectedPaymentMethod === "card" && styles.selectedPayment,
            ]}
            onPress={() => setSelectedPaymentMethod("card")}
          >
            <Ionicons name="card" size={24} color={colors.text.primary} />
            <Text style={styles.paymentText}>Credit Card</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.paymentOption,
              selectedPaymentMethod === "paypal" && styles.selectedPayment,
            ]}
            onPress={() => setSelectedPaymentMethod("paypal")}
          >
            <Ionicons
              name="logo-paypal"
              size={24}
              color={colors.text.primary}
            />
            <Text style={styles.paymentText}>PayPal</Text>
          </TouchableOpacity>
        </View>
        {selectedPaymentMethod === "card" && (
          <View style={styles.cardDetails}>
            <TextInput
              style={styles.input}
              placeholder="Card Number"
              placeholderTextColor={colors.text.secondary}
            />
            <View style={styles.cardRow}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="MM/YY"
                placeholderTextColor={colors.text.secondary}
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="CVC"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
          </View>
        )}
      </View>
    </View>
  );

  const renderOrderReview = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Order Review</Text>
      {mockOrder.items.map((item) => (
        <View key={item.id} style={styles.orderItem}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
          <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
        </View>
      ))}
      <View style={styles.orderSummary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>
            ${mockOrder.subtotal.toFixed(2)}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Shipping</Text>
          <Text style={styles.summaryValue}>
            ${mockOrder.shipping.toFixed(2)}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Tax</Text>
          <Text style={styles.summaryValue}>${mockOrder.tax.toFixed(2)}</Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${mockOrder.total.toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        status={isListening ? "listening" : "idle"}
        isConnected={true}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handlePreviousStep}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Checkout</Text>
        <TouchableOpacity style={styles.voiceButton} onPress={handleVoicePress}>
          <Ionicons
            name={isListening ? "mic" : "mic-outline"}
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Progress Steps */}
      <View style={styles.steps}>
        {[1, 2, 3].map((stepNumber) => (
          <View key={stepNumber} style={styles.stepContainer}>
            <View
              style={[styles.step, stepNumber <= step && styles.activeStep]}
            >
              <Text
                style={[
                  styles.stepNumber,
                  stepNumber <= step && styles.activeStepText,
                ]}
              >
                {stepNumber}
              </Text>
            </View>
            {stepNumber < 3 && (
              <View
                style={[
                  styles.stepLine,
                  stepNumber < step && styles.activeStepLine,
                ]}
              />
            )}
          </View>
        ))}
      </View>

      {/* Voice Commands */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.commandsContainer}
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

      {/* Content */}
      <ScrollView style={styles.content}>
        {step === 1 && renderShippingAddress()}
        {step === 2 && renderPaymentMethod()}
        {step === 3 && renderOrderReview()}

        {/* Voice Confirmation Toggle */}
        <View style={styles.voiceConfirmation}>
          <Text style={styles.voiceConfirmationText}>
            Use voice confirmation
          </Text>
          <Switch
            value={useVoiceConfirmation}
            onValueChange={setUseVoiceConfirmation}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.background.light}
          />
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.placeOrderButton}
          onPress={handleNextStep}
        >
          <Text style={styles.placeOrderText}>
            {step === 3 ? "Place Order" : "Continue"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: "600",
    color: colors.text.primary,
  },
  voiceButton: {
    padding: spacing.sm,
  },
  steps: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.base,
  },
  stepContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  step: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  activeStep: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  stepNumber: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  activeStepText: {
    color: colors.text.light,
  },
  stepLine: {
    width: 60,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  activeStepLine: {
    backgroundColor: colors.primary,
  },
  commandsContainer: {
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  commandChip: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.light,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  commandText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.base,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: "600",
    color: colors.text.primary,
  },
  editButton: {
    padding: spacing.sm,
  },
  addressCard: {
    backgroundColor: colors.background.light,
    borderRadius: 8,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addressName: {
    fontSize: typography.fontSize.base,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  addressText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  paymentCard: {
    backgroundColor: colors.background.light,
    borderRadius: 8,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
  },
  paymentMethod: {
    flexDirection: "row",
    marginBottom: spacing.base,
  },
  paymentOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginRight: spacing.sm,
  },
  selectedPayment: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + "10",
  },
  paymentText: {
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  cardDetails: {
    marginTop: spacing.base,
  },
  input: {
    height: 48,
    backgroundColor: colors.background.light,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfInput: {
    width: "48%",
  },
  orderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemTitle: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  itemQuantity: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginHorizontal: spacing.base,
  },
  itemPrice: {
    fontSize: typography.fontSize.base,
    fontWeight: "600",
    color: colors.text.primary,
  },
  orderSummary: {
    marginTop: spacing.base,
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
  },
  totalRow: {
    marginTop: spacing.base,
    paddingTop: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: {
    fontSize: typography.fontSize.lg,
    fontWeight: "600",
    color: colors.text.primary,
  },
  totalValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: "600",
    color: colors.primary,
  },
  voiceConfirmation: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  voiceConfirmationText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  bottomBar: {
    padding: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background.light,
  },
  placeOrderButton: {
    backgroundColor: colors.primary,
    padding: spacing.base,
    borderRadius: 8,
    alignItems: "center",
  },
  placeOrderText: {
    fontSize: typography.fontSize.base,
    fontWeight: "600",
    color: colors.text.light,
  },
});

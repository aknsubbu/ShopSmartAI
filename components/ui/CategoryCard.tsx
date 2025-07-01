import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors, shadows, spacing, typography } from "../../constants/theme";

type CategoryCardProps = {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  itemCount: number;
  onPress: () => void;
  onVoicePress: () => void;
};

const { width } = Dimensions.get("window");
const cardWidth = (width - spacing.base * 3) / 2;

export function CategoryCard({
  name,
  icon,
  itemCount,
  onPress,
  onVoicePress,
}: CategoryCardProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={32} color={colors.primary} />
      </View>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.itemCount}>{itemCount} items</Text>
      <TouchableOpacity style={styles.voiceButton} onPress={onVoicePress}>
        <Ionicons name="mic-outline" size={16} color={colors.text.light} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: cardWidth,
    height: cardWidth,
    backgroundColor: colors.background.light,
    borderRadius: 12,
    padding: spacing.base,
    marginBottom: spacing.base,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.sm,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.background.light,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: {
    fontSize: typography.fontSize.base,
    fontWeight: "600",
    color: colors.text.primary,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  itemCount: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: "center",
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
});

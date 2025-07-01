import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, spacing, typography } from "../../constants/theme";

type FilterChipProps = {
  label: string;
  isSelected: boolean;
  onPress: () => void;
  onVoicePress?: () => void;
  count?: number;
};

export function FilterChip({
  label,
  isSelected,
  onPress,
  onVoicePress,
  count,
}: FilterChipProps) {
  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.selectedContainer]}
      onPress={onPress}
    >
      <Text style={[styles.label, isSelected && styles.selectedLabel]}>
        {label}
      </Text>
      {count !== undefined && (
        <View
          style={[
            styles.countContainer,
            isSelected && styles.selectedCountContainer,
          ]}
        >
          <Text style={[styles.count, isSelected && styles.selectedCount]}>
            {count}
          </Text>
        </View>
      )}
      {onVoicePress && (
        <TouchableOpacity style={styles.voiceButton} onPress={onVoicePress}>
          <Ionicons
            name="mic-outline"
            size={14}
            color={isSelected ? colors.text.light : colors.primary}
          />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.background.light,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  selectedContainer: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    marginRight: spacing.xs,
  },
  selectedLabel: {
    color: colors.text.light,
  },
  countContainer: {
    backgroundColor: colors.background.light,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: spacing.xs,
  },
  selectedCountContainer: {
    backgroundColor: colors.text.light,
  },
  count: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  selectedCount: {
    color: colors.primary,
  },
  voiceButton: {
    padding: spacing.xs,
  },
});

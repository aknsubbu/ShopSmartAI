import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { animation, colors, spacing, typography } from "../../constants/theme";

type AssistantStatus = "idle" | "listening" | "processing" | "speaking";

interface StatusBarProps {
  status: AssistantStatus;
  isConnected: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  status,
  isConnected,
}) => {
  const insets = useSafeAreaInsets();
  const [pulseAnim] = React.useState(new Animated.Value(1));

  React.useEffect(() => {
    if (status === "listening") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: animation.duration.normal,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: animation.duration.normal,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [status, pulseAnim]);

  const getStatusColor = () => {
    switch (status) {
      case "listening":
        return colors.voice.listening;
      case "processing":
        return colors.voice.processing;
      case "speaking":
        return colors.voice.speaking;
      default:
        return colors.voice.idle;
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "listening":
        return "mic";
      case "processing":
        return "sync";
      case "speaking":
        return "chatbubble";
      default:
        return "mic-outline";
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
        },
      ]}
    >
      <View style={styles.statusContainer}>
        <Animated.View
          style={[
            styles.avatarContainer,
            {
              transform: [{ scale: pulseAnim }],
              backgroundColor: getStatusColor(),
            },
          ]}
        >
          <Ionicons
            name={getStatusIcon() as any}
            size={typography.fontSize.base}
            color={colors.text.light}
          />
        </Animated.View>
        <View style={styles.statusText}>
          {status !== "idle" && (
            <Ionicons
              name="ellipse"
              size={8}
              color={getStatusColor()}
              style={styles.statusDot}
            />
          )}
        </View>
      </View>
      <View style={styles.networkContainer}>
        <Ionicons
          name={isConnected ? "wifi" : "cloud-offline"}
          size={typography.fontSize.base}
          color={isConnected ? colors.status.success : colors.status.error}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.light,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  statusText: {
    marginLeft: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    marginRight: spacing.xs,
  },
  networkContainer: {
    padding: spacing.xs,
  },
});

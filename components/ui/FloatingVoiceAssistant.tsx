import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  animation,
  borderRadius,
  colors,
  shadows,
  spacing,
} from "../../constants/theme";

interface FloatingVoiceAssistantProps {
  onPress: () => void;
  isListening: boolean;
  isSpeaking: boolean;
}

export const FloatingVoiceAssistant: React.FC<FloatingVoiceAssistantProps> = ({
  onPress,
  isListening,
  isSpeaking,
}) => {
  const insets = useSafeAreaInsets();
  const [scale] = useState(new Animated.Value(1));
  const [pulseAnim] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  React.useEffect(() => {
    if (isListening) {
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
  }, [isListening, pulseAnim]);

  return (
    <View
      style={[
        styles.container,
        {
          bottom: insets.bottom + spacing.base,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.pulseRing,
          {
            transform: [{ scale: pulseAnim }],
            opacity: isListening ? 0.5 : 0,
            backgroundColor: colors.voice.listening,
          },
        ]}
      />
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
      >
        <Animated.View
          style={[
            styles.button,
            {
              transform: [{ scale }],
              backgroundColor: isListening
                ? colors.voice.listening
                : colors.primary,
            },
          ]}
        >
          <Ionicons
            name={isSpeaking ? "chatbubble" : "mic"}
            size={24}
            color={colors.text.light}
          />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: spacing.base,
    zIndex: 1000,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.base,
  },
  pulseRing: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: borderRadius.full,
    zIndex: -1,
  },
});

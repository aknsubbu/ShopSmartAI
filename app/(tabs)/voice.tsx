import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Extrapolate,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { StatusBar } from "../../components/ui/StatusBar";
import {
  colors,
  enhancedColors,
  shadows,
  spacing,
  typography,
} from "../../constants/theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type Message = {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean;
};

type VoiceState = "idle" | "listening" | "processing" | "speaking";

const suggestedCommands = [
  { text: "What's new?", icon: "sparkles-outline" },
  { text: "Show my cart", icon: "bag-outline" },
  { text: "Find deals", icon: "pricetag-outline" },
  { text: "Help me choose", icon: "help-circle-outline" },
  { text: "Track order", icon: "location-outline" },
  { text: "My wishlist", icon: "heart-outline" },
];

const welcomeMessages = [
  "Hi! I'm your shopping assistant. How can I help you today?",
  "Ready to find something amazing? What are you looking for?",
  "Hello! I'm here to make your shopping experience better.",
];

export default function VoiceScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [textInput, setTextInput] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);

  const scrollViewRef = useRef<ScrollView>(null);
  const textInputRef = useRef<TextInput>(null);

  // Animation values
  const orbScale = useSharedValue(1);
  const orbOpacity = useSharedValue(0.8);
  const orbRotation = useSharedValue(0);
  const pulseScale = useSharedValue(0);
  const welcomeOpacity = useSharedValue(1);
  const messagesTranslateY = useSharedValue(0);

  // Keyboard handling
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        messagesTranslateY.value = withSpring(-e.endCoordinates.height / 4);
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
        messagesTranslateY.value = withSpring(0);
      }
    );

    return () => {
      keyboardWillShow?.remove();
      keyboardWillHide?.remove();
    };
  }, []);

  // Enhanced orb animations
  useEffect(() => {
    switch (voiceState) {
      case "listening":
        orbScale.value = withRepeat(
          withSequence(
            withTiming(1.3, { duration: 600 }),
            withTiming(1.1, { duration: 600 })
          ),
          -1,
          true
        );
        orbOpacity.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 600 }),
            withTiming(0.7, { duration: 600 })
          ),
          -1,
          true
        );
        pulseScale.value = withRepeat(
          withTiming(1, { duration: 1200 }),
          -1,
          false
        );
        break;

      case "processing":
        orbRotation.value = withRepeat(
          withTiming(360, { duration: 2000 }),
          -1,
          false
        );
        orbScale.value = withTiming(1.1);
        orbOpacity.value = withTiming(0.9);
        break;

      case "speaking":
        orbScale.value = withRepeat(
          withSequence(
            withTiming(1.2, { duration: 300 }),
            withTiming(1, { duration: 300 })
          ),
          -1,
          true
        );
        orbOpacity.value = withTiming(1);
        break;

      default:
        orbScale.value = withSpring(1);
        orbOpacity.value = withTiming(0.8);
        orbRotation.value = withTiming(0);
        pulseScale.value = withTiming(0);
    }
  }, [voiceState]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: orbScale.value },
      { rotate: `${orbRotation.value}deg` },
    ],
    opacity: orbOpacity.value,
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: interpolate(pulseScale.value, [0, 1], [0.8, 0], Extrapolate.CLAMP),
  }));

  const welcomeStyle = useAnimatedStyle(() => ({
    opacity: welcomeOpacity.value,
    transform: [
      { translateY: interpolate(welcomeOpacity.value, [0, 1], [20, 0]) },
    ],
  }));

  const messagesStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: messagesTranslateY.value }],
  }));

  const handleVoicePress = async () => {
    if (voiceState === "listening") {
      setVoiceState("idle");
      return;
    }

    // Haptic feedback
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setVoiceState("listening");
    hideWelcomeMessage();

    // Simulate voice recognition
    setTimeout(() => {
      setVoiceState("processing");

      setTimeout(() => {
        const responses = [
          "I found some great deals for you! Would you like to see them?",
          "Your cart has 3 items totaling $47.99. Ready to checkout?",
          "I can help you find the perfect product. What category interests you?",
          "Here are some personalized recommendations based on your preferences.",
        ];

        const randomResponse =
          responses[Math.floor(Math.random() * responses.length)];

        setVoiceState("speaking");
        addMessage(randomResponse, false);

        setTimeout(() => {
          setVoiceState("idle");
        }, 2500);
      }, 1500);
    }, 2500);
  };

  const hideWelcomeMessage = () => {
    if (showWelcome) {
      welcomeOpacity.value = withTiming(0, { duration: 300 }, () => {
        runOnJS(setShowWelcome)(false);
      });
    }
  };

  const addMessage = (text: string, isUser: boolean, isTyping = false) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser,
      timestamp: new Date(),
      isTyping,
    };

    setMessages((prev) => [...prev, newMessage]);

    // Auto-scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSendMessage = () => {
    if (textInput.trim()) {
      hideWelcomeMessage();
      addMessage(textInput, true);
      setTextInput("");

      // Simulate typing response
      setTimeout(() => {
        addMessage("", false, true);

        setTimeout(() => {
          setMessages((prev) => prev.filter((msg) => !msg.isTyping));

          const responses = [
            "Great choice! I'll help you find that right away.",
            "Let me search for the best options for you.",
            "I understand what you're looking for. Here are some suggestions.",
            "Perfect! I have some recommendations that match your needs.",
          ];

          const randomResponse =
            responses[Math.floor(Math.random() * responses.length)];
          addMessage(randomResponse, false);
        }, 2000);
      }, 1000);
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    setTextInput(suggestion);
    textInputRef.current?.focus();

    if (Platform.OS === "ios") {
      Haptics.selectionAsync();
    }
  };

  const getOrbColor = () => {
    switch (voiceState) {
      case "listening":
        return colors.accent;
      case "processing":
        return enhancedColors.warning;
      case "speaking":
        return enhancedColors.success;
      default:
        return colors.primary;
    }
  };

  const getStatusMessage = () => {
    switch (voiceState) {
      case "listening":
        return "Listening...";
      case "processing":
        return "Processing...";
      case "speaking":
        return "Speaking...";
      default:
        return "Tap to speak";
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar status={voiceState} isConnected={true} />

      {/* Background Gradient */}
      <View style={styles.backgroundGradient} />

      {/* Welcome Message */}
      {showWelcome && (
        <Animated.View style={[styles.welcomeContainer, welcomeStyle]}>
          <View style={styles.welcomeCard}>
            <Ionicons
              name="mic"
              size={32}
              color={colors.primary}
              style={styles.welcomeIcon}
            />
            <Text style={styles.welcomeTitle}>Voice Shopping Assistant</Text>
            <Text style={styles.welcomeSubtitle}>
              {
                welcomeMessages[
                  Math.floor(Math.random() * welcomeMessages.length)
                ]
              }
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Messages Container */}
      <Animated.View style={[styles.messagesWrapper, messagesStyle]}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </ScrollView>
      </Animated.View>

      {/* Voice Orb with Pulse Effect */}
      <View style={[styles.orbContainer, { bottom: 140 + keyboardHeight }]}>
        {/* Pulse rings */}
        {voiceState === "listening" && (
          <>
            <Animated.View
              style={[styles.pulseRing, styles.pulseRing1, pulseStyle]}
            />
            <Animated.View
              style={[styles.pulseRing, styles.pulseRing2, pulseStyle]}
            />
          </>
        )}

        <Animated.View
          style={[styles.orb, orbStyle, { backgroundColor: getOrbColor() }]}
        />

        <TouchableOpacity
          style={[styles.orbButton, { backgroundColor: getOrbColor() }]}
          onPress={handleVoicePress}
          activeOpacity={0.8}
        >
          <Ionicons
            name={
              voiceState === "listening"
                ? "mic"
                : voiceState === "processing"
                ? "settings"
                : "mic-outline"
            }
            size={36}
            color={colors.text.light}
          />
        </TouchableOpacity>

        {/* Status Text */}
        <Text style={styles.statusText}>{getStatusMessage()}</Text>
      </View>

      {/* Bottom Section with Blur Effect */}
      <BlurView
        intensity={95}
        tint="light"
        style={[styles.bottomSection, { paddingBottom: keyboardHeight }]}
      >
        {/* Suggestions */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.suggestionsContainer}
          contentContainerStyle={styles.suggestionsContent}
        >
          {suggestedCommands.map((command, index) => (
            <SuggestionChip
              key={index}
              command={command}
              onPress={() => handleSuggestionPress(command.text)}
            />
          ))}
        </ScrollView>

        {/* Input Container */}
        <View style={styles.inputContainer}></View>
      </BlurView>
    </View>
  );
}

// Message Bubble Component
const MessageBubble = ({ message }: { message: Message }) => {
  const fadeIn = useSharedValue(0);
  const slideY = useSharedValue(20);

  useEffect(() => {
    fadeIn.value = withTiming(1, { duration: 300 });
    slideY.value = withSpring(0);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [{ translateY: slideY.value }],
  }));

  if (message.isTyping) {
    return (
      <Animated.View
        style={[styles.messageBubble, styles.assistantMessage, animatedStyle]}
      >
        <View style={styles.assistantAvatar}>
          <Ionicons
            name="chatbubble-ellipses"
            size={14}
            color={colors.text.light}
          />
        </View>
        <View style={styles.typingContainer}>
          <TypingIndicator />
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.messageBubble,
        message.isUser ? styles.userMessage : styles.assistantMessage,
        animatedStyle,
      ]}
    >
      {!message.isUser && (
        <View style={styles.assistantAvatar}>
          <Ionicons name="mic" size={14} color={colors.text.light} />
        </View>
      )}
      <View style={styles.messageContent}>
        <Text
          style={[
            styles.messageText,
            message.isUser
              ? styles.userMessageText
              : styles.assistantMessageText,
          ]}
        >
          {message.text}
        </Text>
        <Text style={styles.timestamp}>
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    </Animated.View>
  );
};

// Typing Indicator Component
const TypingIndicator = () => {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    const animate = (value: any, delay: number) => {
      setTimeout(() => {
        value.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 400 }),
            withTiming(0, { duration: 400 })
          ),
          -1,
          false
        );
      }, delay);
    };

    animate(dot1, 0);
    animate(dot2, 200);
    animate(dot3, 400);
  }, []);

  const dot1Style = useAnimatedStyle(() => ({
    opacity: interpolate(dot1.value, [0, 1], [0.3, 1]),
  }));

  const dot2Style = useAnimatedStyle(() => ({
    opacity: interpolate(dot2.value, [0, 1], [0.3, 1]),
  }));

  const dot3Style = useAnimatedStyle(() => ({
    opacity: interpolate(dot3.value, [0, 1], [0.3, 1]),
  }));

  return (
    <View style={styles.typingDots}>
      <Animated.View style={[styles.dot, dot1Style]} />
      <Animated.View style={[styles.dot, dot2Style]} />
      <Animated.View style={[styles.dot, dot3Style]} />
    </View>
  );
};

// Suggestion Chip Component
const SuggestionChip = ({
  command,
  onPress,
}: {
  command: any;
  onPress: () => void;
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
    onPress();
  };

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity style={styles.suggestionChip} onPress={handlePress}>
        <Ionicons name={command.icon} size={16} color={colors.primary} />
        <Text style={styles.suggestionText}>{command.text}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
    paddingBottom: spacing.lg,
  },
  backgroundGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.3,
    backgroundColor: `${colors.primary}08`,
  },
  welcomeContainer: {
    position: "absolute",
    top: "25%",
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 10,
  },
  welcomeCard: {
    backgroundColor: colors.background.light,
    padding: spacing.xl,
    borderRadius: 24,
    alignItems: "center",
    ...shadows.base,
    borderWidth: 1,
    borderColor: colors.border,
  },
  welcomeIcon: {
    marginBottom: spacing.base,
  },
  welcomeTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  welcomeSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
  },
  messagesWrapper: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.base,
    paddingTop: spacing.xl * 2,
    paddingBottom: spacing.xl,
  },
  messageBubble: {
    maxWidth: "85%",
    marginBottom: spacing.base,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: colors.primary,
    borderRadius: 20,
    borderBottomRightRadius: 8,
    padding: spacing.base,
    ...shadows.sm,
  },
  assistantMessage: {
    alignSelf: "flex-start",
    backgroundColor: colors.background.light,
    borderRadius: 20,
    borderBottomLeftRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.base,
    paddingLeft: spacing.sm,
    ...shadows.sm,
  },
  assistantAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
    marginBottom: 4,
  },
  messageContent: {
    flex: 1,
  },
  messageText: {
    fontSize: typography.fontSize.base,
    lineHeight: 20,
  },
  userMessageText: {
    color: colors.text.light,
  },
  assistantMessageText: {
    color: colors.text.primary,
  },
  timestamp: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    opacity: 0.7,
  },
  typingContainer: {
    paddingVertical: spacing.sm,
  },
  typingDots: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.text.secondary,
    marginHorizontal: 2,
  },
  orbContainer: {
    position: "absolute",
    alignSelf: "center",
    paddingBottom: spacing["2xl"],
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  pulseRing: {
    position: "absolute",
    borderRadius: 70,
    borderWidth: 2,
  },
  pulseRing1: {
    width: 160,
    height: 160,
    borderColor: `${colors.accent}40`,
  },
  pulseRing2: {
    width: 200,
    height: 200,
    borderColor: `${colors.accent}20`,
  },
  orb: {
    width: 140,
    height: 140,
    paddingBottom: spacing.sm,
    borderRadius: 70,
    position: "absolute",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  orbButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.lg,
    borderWidth: 3,
    borderColor: colors.background.light,
  },
  statusText: {
    marginTop: spacing.base,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontWeight: "500",
  },
  bottomSection: {
    paddingTop: spacing.base,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing["3xl"],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  suggestionsContainer: {
    marginBottom: spacing.lg,
  },
  suggestionsContent: {
    paddingHorizontal: spacing.xs,
  },
  suggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.light,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    ...shadows.sm,
  },
  suggestionText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: "500",
    marginLeft: spacing.xs,
  },
  inputContainer: {
    paddingBottom: spacing["3xl"],
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: colors.background.light,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    ...shadows.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    maxHeight: 100,
    paddingVertical: spacing.sm,
    paddingRight: spacing.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.text.secondary,
  },
  sendButtonActive: {
    backgroundColor: colors.primary,
    ...shadows.sm,
  },
});

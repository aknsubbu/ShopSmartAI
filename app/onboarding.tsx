import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors, spacing, typography } from "../constants/theme";

const { width, height } = Dimensions.get("window");

const onboardingSteps = [
  {
    title: "Welcome to ShopSmart AI",
    description: "Your voice-powered shopping assistant.",
    icon: "chatbubbles-outline",
    button: "Continue",
  },
  {
    title: "Voice Permissions",
    description: "Enable microphone access for hands-free shopping.",
    icon: "mic-outline",
    button: "Continue",
  },
  {
    title: "Try Voice Commands",
    description: 'Say things like "What\'s on sale today?"',
    icon: "bulb-outline",
    button: "Continue",
  },
  {
    title: "Personalize Your Experience",
    description: "Get recommendations tailored just for you.",
    icon: "person-outline",
    button: "Get Started",
  },
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: (currentStep + 1) / onboardingSteps.length,
      useNativeDriver: false,
      tension: 20,
      friction: 7,
    }).start();
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease),
        }),
      ]).start(() => {
        setCurrentStep(currentStep + 1);
        scrollRef.current?.scrollTo({
          x: width * (currentStep + 1),
          animated: true,
        });
      });
    } else {
      router.push("/auth/login");
    }
  };

  const handleSkip = () => {
    router.replace("/auth/login");
  };

  const onScroll = (event: any) => {
    const step = Math.round(event.nativeEvent.contentOffset.x / width);
    if (step !== currentStep) setCurrentStep(step);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.bgCircle} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Welcome</Text>
          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
            <Text style={styles.skip}>Skip</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.scrollContent}
          style={styles.scrollView}
        >
          {onboardingSteps.map((step, idx) => (
            <Animated.View
              key={idx}
              style={[
                styles.step,
                { width },
                { opacity: currentStep === idx ? fadeAnim : 1 },
              ]}
            >
              <Ionicons
                name={step.icon as any}
                size={80}
                color={colors.primary}
                style={styles.icon}
              />
              <Text style={styles.title}>{step.title}</Text>
              <Text style={styles.description}>{step.description}</Text>
            </Animated.View>
          ))}
        </ScrollView>
        <View style={styles.footer}>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBg}>
              <Animated.View
                style={[
                  styles.progressBar,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "100%"],
                    }),
                  },
                ]}
              />
            </View>
          </View>
          {/* <View style={styles.dotsContainer}>
            {onboardingSteps.map((_, idx) => (
              <View
                key={idx}
                style={[styles.dot, currentStep === idx && styles.activeDot]}
              />
            ))}
          </View> */}
          <TouchableOpacity style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>
              {onboardingSteps[currentStep].button}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  bgCircle: {
    position: "absolute",
    top: -width * 0.5,
    right: -width * 0.3,
    width: width * 1.6,
    height: width * 1.6,
    borderRadius: width * 0.8,
    backgroundColor: colors.primary + "10",
    zIndex: 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.base,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: "700",
    color: colors.primary,
  },
  skipBtn: {
    padding: spacing.sm,
  },
  skip: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  step: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    width: width,
    zIndex: 1,
  },
  icon: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: spacing.lg,
    color: colors.text.primary,
  },
  description: {
    fontSize: 18,
    color: colors.text.secondary,
    textAlign: "center",
    marginBottom: spacing.xl,
    marginHorizontal: spacing.base,
    lineHeight: 24,
  },
  footer: {
    paddingBottom: spacing.lg,
    zIndex: 1,
  },
  progressBarContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  progressBarBg: {
    width: "70%",
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
    marginHorizontal: 6,
  },
  activeDot: {
    backgroundColor: colors.primary,
    transform: [{ scale: 1.2 }],
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: colors.text.light,
    fontSize: typography.fontSize.lg,
    fontWeight: "600",
  },
});

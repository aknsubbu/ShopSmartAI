# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `npm start` or `npx expo start`
- **Run on specific platforms**: `npm run android`, `npm run ios`, `npm run web`
- **Lint code**: `npm run lint`
- **Reset project**: `npm run reset-project` (moves starter code to app-example and creates blank app directory)

## Architecture Overview

This is a React Native Expo app built with TypeScript using expo-router for file-based routing. The app is a shopping assistant with AI voice capabilities called "ShopSmartAI".

### Key Architecture Patterns

- **File-based routing**: Uses expo-router with the app directory structure
- **Tab-based navigation**: Main navigation uses custom BottomNavigationBar component with 5 tabs (Home, Search, Voice, Cart, Profile)
- **Theme system**: Centralized theme management in `constants/theme.ts` with colors, typography, spacing, shadows, and animation constants
- **Custom UI components**: All UI components are in `components/ui/` directory with consistent theming
- **Safe area handling**: Uses react-native-safe-area-context throughout

### Directory Structure

- `app/` - Main application screens using expo-router
  - `app/(tabs)/` - Tab-based screens (index, search, voice, cart, profile)
  - `app/(tabs)/product/[id].tsx` - Dynamic product detail route
- `components/` - Reusable components
  - `components/ui/` - Custom UI components (BottomNavigationBar, ProductCard, etc.)
- `constants/` - App-wide constants including theme configuration
- `hooks/` - Custom React hooks

### Navigation Architecture

- Root layout in `app/_layout.tsx` provides theme context and stack navigation
- Tab layout in `app/(tabs)/_layout.tsx` manages bottom tab navigation with custom BottomNavigationBar
- Uses `@react-navigation/native` with expo-router integration

### Theming System

The theme system in `constants/theme.ts` provides:
- Color palette with semantic naming (primary, accent, status colors, voice states)
- Typography scale with consistent font sizes and line heights
- Spacing system using consistent values
- Shadow presets for elevation
- Animation constants for consistent timing

### Voice Features

The app includes voice assistant functionality with:
- Voice tab for speech interactions
- FloatingVoiceAssistant component
- Voice state management (idle, listening, processing, speaking)
- Haptic feedback integration

## Important Notes

- Uses Expo SDK ~53.0.11 with React Native 0.79.3
- TypeScript enabled with strict configuration
- Uses expo-linear-gradient, expo-blur, and other Expo modules
- Haptic feedback is integrated throughout the UI
- The app supports both iOS and Android with platform-specific adaptations
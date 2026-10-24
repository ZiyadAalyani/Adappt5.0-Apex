import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import Svg, {
  Path,
  Rect,
  Defs,
  LinearGradient,
  Stop,
  G,
  Circle,
} from 'react-native-svg';

const { width } = Dimensions.get('window');
const DEFAULT_SIZE = Math.min(width * 0.38, 150);

interface CyberBotProps {
  size?: number;
  mood?: 'happy' | 'alert' | 'scanning' | 'sleeping';
}

export default function CyberBot({ size = DEFAULT_SIZE, mood = 'happy' }: CyberBotProps) {
  // Eye movement
  const eyeX = useSharedValue(0);
  const eyeY = useSharedValue(0);
  // Blink scale
  const blinkScale = useSharedValue(1);
  // Floating animation
  const floatY = useSharedValue(0);
  // Glow pulse
  const glowPulse = useSharedValue(0.7);

  useEffect(() => {
    // Gentle floating bob
    floatY.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(5, { duration: 1800, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    // Soft glow breathing
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.6, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Natural blinking
    const blinkInterval = setInterval(() => {
      blinkScale.value = withSequence(
        withTiming(0.08, { duration: 90, easing: Easing.linear }),
        withTiming(1, { duration: 130, easing: Easing.linear })
      );
      if (Math.random() > 0.65) {
        setTimeout(() => {
          blinkScale.value = withSequence(
            withTiming(0.08, { duration: 80 }),
            withTiming(1, { duration: 120 })
          );
        }, 260);
      }
    }, 3400);

    // Eye wander
    const wanderInterval = setInterval(() => {
      eyeX.value = withSequence(
        withTiming(3, { duration: 500 }),
        withDelay(800, withTiming(-3, { duration: 600 })),
        withDelay(600, withTiming(0, { duration: 400 }))
      );
      eyeY.value = withSequence(
        withTiming(-2, { duration: 500 }),
        withDelay(800, withTiming(2, { duration: 600 })),
        withDelay(600, withTiming(0, { duration: 400 }))
      );
    }, 4800);

    return () => {
      clearInterval(blinkInterval);
      clearInterval(wanderInterval);
    };
  }, []);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
    opacity: glowPulse.value,
  }));

  const animatedEyeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: eyeX.value },
      { translateY: eyeY.value },
      { scaleY: blinkScale.value },
    ],
  }));

  // Palette based on the cute periwinkle reference image
  const strokeColor =
    mood === 'alert'
      ? '#F87171'
      : mood === 'scanning'
      ? '#38BDF8'
      : '#A5B4FC'; // Soft pastel lavender/periwinkle

  const glowShadowColor =
    mood === 'alert'
      ? 'rgba(239, 68, 68, 0.5)'
      : mood === 'scanning'
      ? 'rgba(56, 189, 248, 0.5)'
      : 'rgba(165, 180, 252, 0.45)';

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { width: size, height: size },
        { shadowColor: glowShadowColor },
        animatedContainerStyle,
      ]}
    >
      <Svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
      >
        <Defs>
          <LinearGradient id="botStrokeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={strokeColor} stopOpacity="1" />
            <Stop offset="100%" stopColor="#C7D2FE" stopOpacity="0.85" />
          </LinearGradient>

          <LinearGradient id="botFillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="rgba(165, 180, 252, 0.12)" />
            <Stop offset="100%" stopColor="rgba(99, 102, 241, 0.04)" />
          </LinearGradient>

          <LinearGradient id="eyeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={strokeColor} />
            <Stop offset="100%" stopColor="#818CF8" />
          </LinearGradient>
        </Defs>

        {/* CUTE SECURENEST ICON CONTOUR */}
        {/* Top Loop + Diamond Ears + Rounded Head Box */}
        <Path
          d="
            M 48 26
            A 12 12 0 1 1 72 26
            L 82 26
            Q 92 26 92 36
            L 92 48
            L 106 62
            L 92 76
            L 92 88
            Q 92 98 82 98
            L 38 98
            Q 28 98 28 88
            L 28 76
            L 14 62
            L 28 48
            L 28 36
            Q 28 26 38 26
            L 48 26
            Z
          "
          stroke="url(#botStrokeGrad)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="url(#botFillGrad)"
        />

        {/* EYES (Two Vertical Rounded Pills) */}
        <G>
          {/* Left Eye */}
          <Rect
            x="44"
            y="48"
            width="9"
            height="28"
            rx="4.5"
            fill="url(#eyeGrad)"
          />

          {/* Right Eye */}
          <Rect
            x="67"
            y="48"
            width="9"
            height="28"
            rx="4.5"
            fill="url(#eyeGrad)"
          />
        </G>

        {/* Subtle cute cheek blushes for happy mood */}
        {mood === 'happy' && (
          <G opacity="0.35">
            <Circle cx="35" cy="74" r="3" fill="#F472B6" />
            <Circle cx="85" cy="74" r="3" fill="#F472B6" />
          </G>
        )}
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 6,
  },
});

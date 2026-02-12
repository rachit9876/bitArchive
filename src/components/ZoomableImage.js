import React from 'react';
import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

const SPRING_CFG = { damping: 20, stiffness: 200 };
const MAX_SCALE = 5;
const MIN_DISMISS_VELOCITY = 800;
const MIN_DISMISS_DISTANCE = 120;

const clamp = (value, min, max) => {
  'worklet';
  return Math.min(Math.max(value, min), max);
};

const ZoomableImage = ({ uri, width, height, onDismiss }) => {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const isPinching = useSharedValue(false);

  /* ── helpers ── */

  const getMaxTranslate = (s) => {
    'worklet';
    // how far the image can pan in each axis before hitting the edge
    const maxX = ((s - 1) * width) / 2;
    const maxY = ((s - 1) * height) / 2;
    return { maxX, maxY };
  };

  const clampTranslation = (tx, ty, s) => {
    'worklet';
    const { maxX, maxY } = getMaxTranslate(s);
    return {
      x: clamp(tx, -maxX, maxX),
      y: clamp(ty, -maxY, maxY),
    };
  };

  /* ── Pinch to zoom ── */

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      isPinching.value = true;
    })
    .onUpdate((e) => {
      const nextScale = clamp(savedScale.value * e.scale, 0.5, MAX_SCALE + 1);
      scale.value = nextScale;
    })
    .onEnd(() => {
      isPinching.value = false;
      if (scale.value < 1) {
        scale.value = withSpring(1, SPRING_CFG);
        translateX.value = withSpring(0, SPRING_CFG);
        translateY.value = withSpring(0, SPRING_CFG);
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else if (scale.value > MAX_SCALE) {
        scale.value = withSpring(MAX_SCALE, SPRING_CFG);
        savedScale.value = MAX_SCALE;
        // clamp existing translation
        const clamped = clampTranslation(translateX.value, translateY.value, MAX_SCALE);
        translateX.value = withSpring(clamped.x, SPRING_CFG);
        translateY.value = withSpring(clamped.y, SPRING_CFG);
        savedTranslateX.value = clamped.x;
        savedTranslateY.value = clamped.y;
      } else {
        savedScale.value = scale.value;
        // clamp on end
        const clamped = clampTranslation(translateX.value, translateY.value, scale.value);
        if (clamped.x !== translateX.value || clamped.y !== translateY.value) {
          translateX.value = withSpring(clamped.x, SPRING_CFG);
          translateY.value = withSpring(clamped.y, SPRING_CFG);
        }
        savedTranslateX.value = clamped.x;
        savedTranslateY.value = clamped.y;
      }
    });

  /* ── Pan / drag ── */

  const panGesture = Gesture.Pan()
    .minPointers(1)
    .maxPointers(2)
    .onUpdate((e) => {
      if (savedScale.value > 1) {
        // panning the zoomed image with boundary awareness
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      } else {
        // not zoomed — only allow vertical drag for dismiss gesture
        translateY.value = savedTranslateY.value + e.translationY;
      }
    })
    .onEnd((e) => {
      if (savedScale.value <= 1) {
        // ── Dismiss logic (velocity OR distance) ──
        const shouldDismiss =
          (e.velocityY > MIN_DISMISS_VELOCITY && translateY.value > 40) ||
          translateY.value > MIN_DISMISS_DISTANCE;

        if (shouldDismiss) {
          translateY.value = withTiming(height, { duration: 200 });
          if (onDismiss) runOnJS(onDismiss)();
        } else {
          translateY.value = withSpring(0, SPRING_CFG);
          savedTranslateY.value = 0;
        }
      } else {
        // ── Clamped pan when zoomed ──
        const clamped = clampTranslation(
          translateX.value,
          translateY.value,
          savedScale.value
        );
        if (clamped.x !== translateX.value) {
          translateX.value = withSpring(clamped.x, SPRING_CFG);
        }
        if (clamped.y !== translateY.value) {
          translateY.value = withSpring(clamped.y, SPRING_CFG);
        }
        savedTranslateX.value = clamped.x;
        savedTranslateY.value = clamped.y;
      }
    });

  /* ── Double-tap to toggle zoom ── */

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((e) => {
      if (scale.value > 1) {
        // zoom out
        scale.value = withSpring(1, SPRING_CFG);
        translateX.value = withSpring(0, SPRING_CFG);
        translateY.value = withSpring(0, SPRING_CFG);
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        // zoom in to 2.5x at tap point
        const targetScale = 2.5;
        const focusX = e.x - width / 2;
        const focusY = e.y - height / 2;
        const targetX = -focusX * (targetScale - 1);
        const targetY = -focusY * (targetScale - 1);
        const clamped = clampTranslation(targetX, targetY, targetScale);

        scale.value = withSpring(targetScale, SPRING_CFG);
        translateX.value = withSpring(clamped.x, SPRING_CFG);
        translateY.value = withSpring(clamped.y, SPRING_CFG);
        savedScale.value = targetScale;
        savedTranslateX.value = clamped.x;
        savedTranslateY.value = clamped.y;
      }
    });

  /* ── Compose gestures ── */
  // Double-tap has priority, then simultaneous pinch + pan
  // Removed single-tap-to-dismiss (too sensitive, use swipe-down or Close button)
  const composed = Gesture.Exclusive(
    doubleTapGesture,
    Gesture.Simultaneous(pinchGesture, panGesture)
  );

  /* ── Animated styles ── */

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity:
      savedScale.value <= 1
        ? Math.max(0.3, 1 - Math.abs(translateY.value) / 300)
        : 1,
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[localStyles.container, { width, height }, containerStyle]}>
        <Animated.Image
          source={{ uri }}
          style={[localStyles.image, animatedStyle]}
          resizeMode="contain"
        />
      </Animated.View>
    </GestureDetector>
  );
};

const localStyles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export default ZoomableImage;

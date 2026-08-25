import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import Svg, {
  Rect,
  Circle,
  G,
  Text as SvgText,
  Path,
  Defs,
  Pattern,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { SpatialObject } from '../../lib/services/polyhouse';

interface MapProps {
  objects: SpatialObject[];
  selectedObject: SpatialObject | null;
  onSelectObject: (obj: SpatialObject) => void;
}

const MIN_SCALE = 0.8;
const MAX_SCALE = 5;

export const PolyhouseMap: React.FC<MapProps> = ({
  objects,
  selectedObject,
  onSelectObject,
}) => {
  const structure = objects.find((o) => o.type === 'structure') || {
    dimensions: { width_m: 12, depth_m: 8 },
  };

  const mapW = structure.dimensions.width_m;
  const mapH = structure.dimensions.depth_m;

  // Reanimated shared values for zoom/pan
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Helper functions for UI button zoom control
  const zoomIn = () => {
    const newScale = Math.min(scale.value * 1.3, MAX_SCALE);
    scale.value = withSpring(newScale);
    savedScale.value = newScale;
  };

  const zoomOut = () => {
    const newScale = Math.max(scale.value / 1.3, MIN_SCALE);
    scale.value = withSpring(newScale);
    savedScale.value = newScale;
  };

  const resetZoom = () => {
    scale.value = withSpring(1);
    savedScale.value = 1;
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  // Double-tap gesture to quickly toggle zoom
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1.5) {
        resetZoom();
      } else {
        scale.value = withSpring(2.5);
        savedScale.value = 2.5;
      }
    });

  // Pinch Gesture
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.max(MIN_SCALE, Math.min(savedScale.value * e.scale, MAX_SCALE));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  // Pan Gesture
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const composedGesture = Gesture.Simultaneous(
    Gesture.Race(doubleTapGesture, panGesture),
    pinchGesture
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const getBoxCoords = (obj: SpatialObject) => ({
    x: obj.position.x_m - obj.dimensions.width_m / 2,
    y: obj.position.y_m - obj.dimensions.depth_m / 2,
    w: obj.dimensions.width_m,
    h: obj.dimensions.depth_m,
  });

  const zones = objects.filter((o) => o.type === 'zone');
  const beds = objects.filter((o) => o.type === 'bed');
  const crops = objects.filter((o) => o.type === 'crop');

  const renderCropGraphic = (c: SpatialObject) => {
    const isSelected = selectedObject?.id === c.id;
    const r = Math.max(0.12, c.dimensions.width_m / 2);
    const cx = c.position.x_m;
    const cy = c.position.y_m;

    switch (c.class_name) {
      case 'tomato':
        return (
          <G key={c.id} onPress={() => onSelectObject(c)}>
            <Circle cx={cx} cy={cy} r={r} fill="#2D6A4F" />
            <Circle cx={cx - r * 0.3} cy={cy - r * 0.2} r={r * 0.6} fill="#40916C" />
            <Circle cx={cx - r * 0.2} cy={cy - r * 0.1} r={r * 0.35} fill="#E63946" />
            <Circle cx={cx + r * 0.25} cy={cy + r * 0.2} r={r * 0.3} fill="#EF233C" />
            {isSelected && (
              <Circle cx={cx} cy={cy} r={r + 0.08} stroke="#38BDF8" strokeWidth={0.06} fill="none" />
            )}
          </G>
        );

      case 'bell_pepper':
        return (
          <G key={c.id} onPress={() => onSelectObject(c)}>
            <Circle cx={cx} cy={cy} r={r} fill="#1B4332" />
            <Circle cx={cx + r * 0.2} cy={cy - r * 0.1} r={r * 0.55} fill="#2D6A4F" />
            <Rect x={cx - r * 0.3} y={cy - r * 0.3} width={r * 0.6} height={r * 0.6} rx={r * 0.15} fill="#FFB703" />
            {isSelected && (
              <Circle cx={cx} cy={cy} r={r + 0.08} stroke="#38BDF8" strokeWidth={0.06} fill="none" />
            )}
          </G>
        );

      case 'strawberry':
        return (
          <G key={c.id} onPress={() => onSelectObject(c)}>
            <Circle cx={cx} cy={cy} r={r} fill="#52B788" />
            <Circle cx={cx - r * 0.2} cy={cy + r * 0.1} r={r * 0.3} fill="#D90429" />
            <Circle cx={cx + r * 0.2} cy={cy - r * 0.2} r={r * 0.25} fill="#D90429" />
            {isSelected && (
              <Circle cx={cx} cy={cy} r={r + 0.08} stroke="#38BDF8" strokeWidth={0.06} fill="none" />
            )}
          </G>
        );

      case 'cucumber':
        return (
          <G key={c.id} onPress={() => onSelectObject(c)}>
            <Circle cx={cx} cy={cy} r={r} fill="#2D6A4F" />
            <Path
              d={`M ${cx - r * 0.5} ${cy + r * 0.3} Q ${cx} ${cy - r * 0.6} ${cx + r * 0.5} ${cy - r * 0.2}`}
              stroke="#AACC00"
              strokeWidth={0.12}
              fill="none"
              strokeLinecap="round"
            />
            {isSelected && (
              <Circle cx={cx} cy={cy} r={r + 0.08} stroke="#38BDF8" strokeWidth={0.06} fill="none" />
            )}
          </G>
        );

      default:
        return (
          <G key={c.id} onPress={() => onSelectObject(c)}>
            <Circle cx={cx} cy={cy} r={r} fill="#40916C" />
            {isSelected && (
              <Circle cx={cx} cy={cy} r={r + 0.08} stroke="#38BDF8" strokeWidth={0.06} fill="none" />
            )}
          </G>
        );
    }
  };

  return (
    <View style={styles.container}>
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[styles.canvas, animatedStyle]}>
          <Svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${mapW} ${mapH}`}
            preserveAspectRatio="xMidYMid meet"
          >
            <Defs>
              <Pattern id="dirtPattern" width="0.4" height="0.4" patternUnits="userSpaceOnUse">
                <Rect width="0.4" height="0.4" fill="#8D5B4C" />
                <Circle cx="0.1" cy="0.1" r="0.03" fill="#6F4336" />
                <Circle cx="0.3" cy="0.25" r="0.04" fill="#543127" />
                <Circle cx="0.2" cy="0.35" r="0.02" fill="#A46E5E" />
              </Pattern>

              <Pattern id="soilPattern" width="0.2" height="0.2" patternUnits="userSpaceOnUse">
                <Rect width="0.2" height="0.2" fill="#3D2314" />
                <Circle cx="0.05" cy="0.05" r="0.02" fill="#29160B" />
                <Circle cx="0.15" cy="0.12" r="0.025" fill="#4E2F1C" />
              </Pattern>

              <LinearGradient id="woodBorder" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor="#A67C52" />
                <Stop offset="100%" stopColor="#6E4723" />
              </LinearGradient>
            </Defs>

            {/* Ground / Polyhouse Base */}
            <Rect
              x={0}
              y={0}
              width={mapW}
              height={mapH}
              fill="url(#dirtPattern)"
              stroke="#543127"
              strokeWidth={0.12}
            />

            {/* Polyhouse Frame Perimeter */}
            <Rect
              x={0.05}
              y={0.05}
              width={mapW - 0.1}
              height={mapH - 0.1}
              fill="none"
              stroke="#0284C7"
              strokeWidth={0.08}
              strokeDasharray="0.3,0.15"
              rx={0.2}
            />

            {/* Layer 1: Growing Zones */}
            {zones.map((z) => {
              const { x, y, w, h } = getBoxCoords(z);
              const isSelected = selectedObject?.id === z.id;
              return (
                <G key={z.id} onPress={() => onSelectObject(z)}>
                  <Rect
                    x={x}
                    y={y}
                    width={w}
                    height={h}
                    fill={isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)'}
                    stroke={isSelected ? '#0284C7' : '#94A3B8'}
                    strokeWidth={isSelected ? 0.08 : 0.03}
                    strokeDasharray="0.2,0.1"
                    rx={0.1}
                  />
                  <SvgText
                    x={x + 0.25}
                    y={y + 0.45}
                    fontSize={0.28}
                    fill="#334155"
                    fontWeight="600"
                  >
                    {z.id}
                  </SvgText>
                </G>
              );
            })}

            {/* Layer 2: Wooden Raised Growing Beds with Soil */}
            {beds.map((b) => {
              const { x, y, w, h } = getBoxCoords(b);
              const isSelected = selectedObject?.id === b.id;
              const borderThick = 0.08;

              return (
                <G key={b.id} onPress={() => onSelectObject(b)}>
                  <Rect
                    x={x}
                    y={y}
                    width={w}
                    height={h}
                    fill="url(#woodBorder)"
                    stroke={isSelected ? '#38BDF8' : '#4A2810'}
                    strokeWidth={isSelected ? 0.08 : 0.02}
                    rx={0.06}
                  />
                  <Rect
                    x={x + borderThick}
                    y={y + borderThick}
                    width={w - borderThick * 2}
                    height={h - borderThick * 2}
                    fill="url(#soilPattern)"
                    rx={0.03}
                  />
                  <Rect
                    x={x + w / 2 - 0.4}
                    y={y + 0.1}
                    width={0.8}
                    height={0.25}
                    fill="#F1F5F9"
                    rx={0.04}
                    opacity={0.85}
                  />
                  <SvgText
                    x={x + w / 2}
                    y={y + 0.28}
                    fontSize={0.16}
                    fill="#0F172A"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {b.id}
                  </SvgText>
                </G>
              );
            })}

            {/* Layer 3: Crops */}
            {crops.map((c) => renderCropGraphic(c))}
          </Svg>
        </Animated.View>
      </GestureDetector>

      {/* Floating Zoom Control Panel */}
      <View style={styles.controlsContainer}>
        <Pressable style={styles.controlButton} onPress={zoomIn}>
          <Text style={styles.buttonText}>+</Text>
        </Pressable>
        <Pressable style={styles.controlButton} onPress={zoomOut}>
          <Text style={styles.buttonText}>−</Text>
        </Pressable>
        <Pressable style={[styles.controlButton, styles.resetButton]} onPress={resetZoom}>
          <Text style={styles.resetText}>Reset</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3D2314',
    overflow: 'hidden',
  },
  canvas: {
    flex: 1,
  },
  controlsContainer: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 12,
    padding: 6,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  controlButton: {
    width: 44,
    height: 44,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  buttonText: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 28,
  },
  resetButton: {
    marginTop: 4,
    height: 32,
  },
  resetText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
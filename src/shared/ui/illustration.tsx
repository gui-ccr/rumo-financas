import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import { useThemeColors } from './theme';

/**
 * Rumo illustration set, after the Brankas kit's isometric drawings on a pixel grid,
 * redrawn as money objects: a vault (cofre) for balance/income states and a
 * receipt (boleto) for bills. The object floats, a glyph says what happened.
 *   empty     nothing here yet (activity, lists)
 *   received  money came in (income, scholarship received)
 *   paid      a bill was paid / all done
 *   bills     nothing due
 *   plan      a plan or automation is active
 *   waiting   expected money with no date yet (scholarships)
 * Motion is decorative and stops when the OS asks for reduced motion.
 */
export type IllustrationName = 'empty' | 'received' | 'paid' | 'bills' | 'plan' | 'waiting' | 'moto';

const W = 200;
const H = 160;

export function Illustration({ name, size = 200 }: { name: IllustrationName; size?: number }) {
  const c = useThemeColors();
  const reduce = useReducedMotion();
  const float = useSharedValue(0);
  const glyph = useSharedValue(0);
  const spark = useSharedValue(1);

  // Small spots (cards, rows) stay still: only hero-sized drawings move, to keep lists light.
  const animate = !reduce && size >= 120;

  useEffect(() => {
    if (!animate) return;
    const ease = Easing.inOut(Easing.sin);
    float.set(withRepeat(withSequence(withTiming(-5, { duration: 1800, easing: ease }), withTiming(0, { duration: 1800, easing: ease })), -1));
    glyph.set(
      withDelay(250, withRepeat(withSequence(withTiming(-8, { duration: 1500, easing: ease }), withTiming(0, { duration: 1500, easing: ease })), -1)),
    );
    spark.set(withRepeat(withSequence(withTiming(0.25, { duration: 900 }), withTiming(1, { duration: 900 })), -1));
  }, [float, glyph, spark, animate]);

  const cubeStyle = useAnimatedStyle(() => ({ transform: [{ translateY: float.get() }] }));
  const glyphStyle = useAnimatedStyle(() => ({ transform: [{ translateY: glyph.get() }] }));
  const sparkStyle = useAnimatedStyle(() => ({ opacity: spark.get() }));

  const scale = size / W;
  const box = { width: size, height: H * scale };
  const layer = { position: 'absolute' as const, left: 0, top: 0, width: size, height: H * scale };

  return (
    <View style={box} accessible={false} importantForAccessibility="no-hide-descendants">
      <Svg width={size} height={H * scale} viewBox={`0 0 ${W} ${H}`} style={layer}>
        <PixelGrid accent={c.accent} line={c.border} />
      </Svg>
      <Animated.View style={[layer, sparkStyle]}>
        <Svg width={size} height={H * scale} viewBox={`0 0 ${W} ${H}`}>
          <Sparkle x={38} y={44} color={c.accent} />
          <Sparkle x={168} y={74} color={c.accent} />
          <Sparkle x={150} y={22} color={c.accent} small />
        </Svg>
      </Animated.View>
      <Animated.View style={[layer, cubeStyle]}>
        <Svg width={size} height={H * scale} viewBox={`0 0 ${W} ${H}`}>
          {name === 'bills' || name === 'paid' ? (
            <Receipt face={c.card} ink={c.foreground} accent={c.accent} />
          ) : name === 'moto' ? (
            <Moto face={c.card} side={c.muted} ink={c.foreground} accent={c.accent} />
          ) : (
            <Vault face={c.card} side={c.muted} ink={c.foreground} accent={c.accent} />
          )}
        </Svg>
      </Animated.View>
      <Animated.View style={[layer, glyphStyle]}>
        <Svg width={size} height={H * scale} viewBox={`0 0 ${W} ${H}`}>
          <Glyph name={name} c={c} />
        </Svg>
      </Animated.View>
    </View>
  );
}

/** 7×4 grid of rounded pixels; a few lit in the accent, like the kit. */
function PixelGrid({ accent, line }: { accent: string; line: string }) {
  const lit = new Set(['0-1', '1-3', '5-0', '6-2', '4-3']);
  const cells = [];
  for (let col = 0; col < 7; col++) {
    for (let row = 0; row < 4; row++) {
      const key = `${col}-${row}`;
      const on = lit.has(key);
      cells.push(
        <Rect
          key={key}
          x={14 + col * 26}
          y={24 + row * 26}
          width={18}
          height={18}
          rx={3}
          fill={on ? accent : 'none'}
          fillOpacity={on ? 0.28 : 0}
          stroke={line}
          strokeWidth={1.2}
        />,
      );
    }
  }
  return <G>{cells}</G>;
}

function Sparkle({ x, y, color, small }: { x: number; y: number; color: string; small?: boolean }) {
  const r = small ? 4 : 6;
  return <Path d={`M${x - r} ${y}H${x + r}M${x} ${y - r}V${y + r}`} stroke={color} strokeWidth={small ? 2 : 2.6} strokeLinecap="round" />;
}

/** Isometric vault: lit top with a coin slot, dial and handle on the front face, accent band. */
function Vault({ face, side, ink, accent }: { face: string; side: string; ink: string; accent: string }) {
  const s = { stroke: ink, strokeWidth: 2.2, strokeLinejoin: 'round' as const };
  return (
    <G>
      <Path d="M60 94 L100 114 L100 156 L60 136 Z" fill={side} {...s} />
      <Path d="M100 114 L140 94 L140 136 L100 156 Z" fill={face} {...s} />
      <Path d="M60 94 L100 74 L140 94 L100 114 Z" fill={face} {...s} />
      {/* coin slot */}
      <Path d="M90 92 L108 83" stroke={ink} strokeWidth={4} strokeLinecap="round" />
      {/* dial (an ellipse drawn on the isometric front face) */}
      <Path d="M112 121 C112 114 122 109 126 112 C130 115 128 124 120 128 C114 131 112 127 112 121 Z" fill={accent} stroke={ink} strokeWidth={1.8} />
      <Path d="M119 113 V117 M119 125 V128" stroke={ink} strokeWidth={1.6} strokeLinecap="round" />
      {/* handle + feet on the side face */}
      <Path d="M70 112 L70 124" stroke={ink} strokeWidth={3} strokeLinecap="round" opacity={0.6} />
      <Path d="M66 139 L66 143 M96 154 L96 158 M134 139 L134 143" stroke={ink} strokeWidth={3} strokeLinecap="round" />
    </G>
  );
}

/** Isometric receipt/boleto leaning back: zigzag bottom, text lines, accent amount bar. */
function Receipt({ face, ink, accent }: { face: string; ink: string; accent: string }) {
  const s = { stroke: ink, strokeWidth: 2.2, strokeLinejoin: 'round' as const };
  return (
    <G>
      <Path d="M66 84 L126 70 L134 132 L127 128 L120 136 L113 131 L106 139 L99 134 L92 142 L85 137 L78 145 L74 146 Z" fill={face} {...s} />
      <Path d="M78 96 L118 87 M80 106 L110 99 M81 115 L104 110" stroke={ink} strokeWidth={2} strokeLinecap="round" opacity={0.55} />
      <Path d="M84 126 L122 117" stroke={accent} strokeWidth={6} strokeLinecap="round" />
    </G>
  );
}

/** Isometric motorcycle on the pixel grid. */
function Moto({ face, side, ink, accent }: { face: string; side: string; ink: string; accent: string }) {
  return (
    <G>
      {/* Back wheel */}
      <Circle cx={65} cy={135} r={16} fill={side} stroke={ink} strokeWidth={2.5} />
      <Circle cx={65} cy={135} r={8} fill={face} stroke={ink} strokeWidth={1.8} />
      {/* Front wheel */}
      <Circle cx={135} cy={135} r={16} fill={side} stroke={ink} strokeWidth={2.5} />
      <Circle cx={135} cy={135} r={8} fill={face} stroke={ink} strokeWidth={1.8} />
      {/* Frame */}
      <Path d="M65 135 L90 120 L115 120 L135 135" stroke={ink} strokeWidth={3} strokeLinecap="round" fill="none" />
      {/* Tank & Body */}
      <Path d="M80 120 L88 100 L118 100 L124 116 Z" fill={accent} stroke={ink} strokeWidth={2.2} strokeLinejoin="round" />
      {/* Seat */}
      <Path d="M74 100 L95 100" stroke={ink} strokeWidth={4} strokeLinecap="round" />
      {/* Fork & Handlebars */}
      <Path d="M135 135 L120 88" stroke={ink} strokeWidth={3} strokeLinecap="round" />
      <Path d="M112 88 L126 86" stroke={ink} strokeWidth={3.5} strokeLinecap="round" />
      {/* Headlight */}
      <Circle cx={127} cy={92} r={3.5} fill={accent} stroke={ink} strokeWidth={1.2} />
    </G>
  );
}

function Glyph({ name, c }: { name: IllustrationName; c: ReturnType<typeof useThemeColors> }) {
  const ink = c.accentForeground;
  switch (name) {
    case 'received':
      return (
        <G>
          <Path d="M100 18 V52 M86 40 L100 54 L114 40" stroke={c.income} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </G>
      );
    case 'paid':
      return (
        <G>
          <Circle cx={100} cy={40} r={20} fill={c.income} />
          <Path d="M91 40 L98 47 L110 34" stroke={c.background} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </G>
      );
    case 'bills':
      return (
        <G>
          <Rect x={80} y={20} width={40} height={38} rx={8} fill={c.accent} />
          <Rect x={80} y={20} width={40} height={11} rx={5} fill={ink} opacity={0.25} />
          <Path d="M90 15 V25 M110 15 V25" stroke={c.foreground} strokeWidth={3} strokeLinecap="round" />
          <Path d="M91 44 L97 50 L109 38" stroke={ink} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </G>
      );
    case 'plan':
      return (
        <G>
          <Circle cx={100} cy={40} r={21} fill={c.accent} />
          <Circle cx={100} cy={40} r={15} fill="none" stroke={ink} strokeWidth={2} opacity={0.35} />
          <Path d="M104 31 C100 29 93 30 93 35 C93 41 107 38 107 45 C107 50 99 51 95 48 M100 26 V54" stroke={ink} strokeWidth={2.8} strokeLinecap="round" fill="none" />
        </G>
      );
    case 'waiting':
      return (
        <G>
          <Circle cx={100} cy={40} r={20} fill="none" stroke={c.accent} strokeWidth={4} />
          <Path d="M100 30 V41 L108 46" stroke={c.foreground} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </G>
      );
    case 'moto':
      return (
        <G>
          <Circle cx={100} cy={40} r={20} fill={c.accent} />
          <Path d="M101 28 L94 39 L100 39 L97 51 L107 38 L101 38 Z" fill={c.accentForeground} />
        </G>
      );
    default:
      return (
        <G>
          <Path d="M100 22 L106 34 L119 36 L109 45 L112 58 L100 51 L88 58 L91 45 L81 36 L94 34 Z" fill={c.accent} />
        </G>
      );
  }
}

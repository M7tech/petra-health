import React, { useEffect, useId } from 'react';
import { View, ViewStyle } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

// 3D-style illustrations drawn with vector shapes only (no extra native module): every object has a
// highlight, a core shadow and a soft ground shadow so it reads as a rounded solid. The plate is also
// tilted in perspective and drifts slowly (switched off when Reduce Motion is on).

export type GlyphName = 'broccoli' | 'carrot' | 'apple' | 'avocado' | 'fish' | 'egg' | 'bread' | 'soup' | 'water' | 'nuts' | 'beans' | 'rice' | 'yogurt';

/** Shared gradients. ids are prefixed so several illustrations can sit on one screen. */
function Defs3D({ p }: { p: string }) {
  const rg = (id: string, c0: string, c1: string, cx = '35%', cy = '30%') => (
    <RadialGradient id={`${p}${id}`} cx={cx} cy={cy} rx="75%" ry="75%" fx={cx} fy={cy}>
      <Stop offset="0" stopColor={c0} />
      <Stop offset="1" stopColor={c1} />
    </RadialGradient>
  );
  return (
    <Defs>
      {rg('green', '#7ad06a', '#23802f')}
      {rg('green2', '#a9dc86', '#4c9a3a')}
      {rg('orange', '#ffb066', '#e0661a')}
      {rg('red', '#ff8a7a', '#c2261d')}
      {rg('salmon', '#ffb9a0', '#e46a4c')}
      {rg('yolk', '#ffe27a', '#f0a30a')}
      {rg('bread', '#f3d29a', '#c98d3f')}
      {rg('avo', '#cfe58a', '#5f9a2e')}
      {rg('pit', '#b07a52', '#6e4426')}
      {rg('bowl', '#ffffff', '#cfd4dc')}
      {rg('water', '#bfe6ff', '#4aa3e0')}
      {rg('rice', '#ffffff', '#e4e6ea')}
      {rg('nut', '#d9a066', '#8a5428')}
      {rg('bean', '#d56a58', '#8f2a1f')}
      {rg('cream', '#ffffff', '#e8ecf3')}
      <LinearGradient id={`${p}plateRim`} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#ffffff" />
        <Stop offset="1" stopColor="#dfe3ea" />
      </LinearGradient>
      <LinearGradient id={`${p}plateSide`} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#c9ced8" />
        <Stop offset="1" stopColor="#9aa1af" />
      </LinearGradient>
      {rg('secVeg', '#cdeec2', '#8fcf86', '30%', '30%')}
      {rg('secProt', '#e3d8f7', '#b9a4e6', '30%', '30%')}
      {rg('secGrain', '#fbe6bf', '#e8c07c', '30%', '30%')}
    </Defs>
  );
}

const shadow = (cx: number, cy: number, rx: number, ry: number) => <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#000000" opacity={0.14} />;
const shine = (cx: number, cy: number, rx: number, ry: number, rot = -25) => <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#ffffff" opacity={0.45} transform={`rotate(${rot} ${cx} ${cy})`} />;

/** Each glyph is drawn inside a 48 x 48 box. */
function glyph(name: GlyphName, p: string): React.ReactElement {
  const f = (id: string) => `url(#${p}${id})`;
  switch (name) {
    case 'broccoli':
      return (
        <G>
          {shadow(24, 43, 15, 3.5)}
          <Path d="M20 26 L19 42 Q24 45 29 42 L28 26 Z" fill="#9bcf7f" />
          <Path d="M24 26 L24 43 Q27 43 29 42 L28 26 Z" fill="#6fae56" />
          <Circle cx="14" cy="21" r="9" fill={f('green')} />
          <Circle cx="24" cy="14" r="10.5" fill={f('green')} />
          <Circle cx="34" cy="21" r="9" fill={f('green')} />
          <Circle cx="24" cy="24" r="8" fill={f('green')} />
          {shine(20, 11, 4.5, 2.4)}
          {shine(10, 18, 3, 1.8)}
        </G>
      );
    case 'carrot':
      return (
        <G>
          {shadow(26, 43, 16, 3)}
          <Path d="M10 18 Q30 10 40 22 Q38 30 16 42 Q8 40 8 30 Z" transform="rotate(8 24 28)" fill={f('orange')} />
          <Path d="M16 24 L22 24 M20 31 L27 30 M26 20 L31 22" stroke="#b9500f" strokeWidth="1.4" strokeLinecap="round" opacity={0.55} />
          <Path d="M8 14 Q4 6 10 4 Q13 9 12 14 Z" fill="#4fa83a" />
          <Path d="M13 12 Q13 3 20 3 Q20 9 17 13 Z" fill="#3f9330" />
          {shine(21, 21, 6, 1.8, -20)}
        </G>
      );
    case 'apple':
      return (
        <G>
          {shadow(24, 44, 14, 3)}
          <Path d="M24 14 Q10 8 6 22 Q4 38 18 43 Q24 45 30 43 Q44 38 42 22 Q38 8 24 14 Z" fill={f('red')} />
          <Path d="M24 14 Q25 8 28 5" stroke="#6b3d1f" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          <Path d="M27 9 Q35 3 40 8 Q33 13 27 9 Z" fill="#4fa83a" />
          {shine(16, 22, 4.2, 7, -20)}
        </G>
      );
    case 'avocado':
      return (
        <G>
          {shadow(24, 44, 13, 3)}
          <Path d="M24 3 Q35 3 36 20 Q44 30 38 40 Q32 46 24 46 Q16 46 10 40 Q4 30 12 20 Q13 3 24 3 Z" fill="#3a6f1f" />
          <Path d="M24 7 Q32 8 32.5 21 Q39 29 34.5 37.5 Q30 42.5 24 42.5 Q18 42.5 13.5 37.5 Q9 29 15.5 21 Q16 8 24 7 Z" fill={f('avo')} />
          <Circle cx="24" cy="31" r="8" fill={f('pit')} />
          {shine(21, 28, 2.6, 1.6)}
        </G>
      );
    case 'fish':
      return (
        <G>
          {shadow(24, 40, 18, 3)}
          <Path d="M36 24 L46 14 L46 34 Z" fill="#e0593f" />
          <Ellipse cx="22" cy="24" rx="20" ry="12" fill={f('salmon')} />
          <Path d="M16 14 Q22 24 16 34 M24 13 Q30 24 24 35" stroke="#c4472f" strokeWidth="1.6" fill="none" opacity={0.5} />
          <Circle cx="9" cy="21" r="2.4" fill="#2b2b2b" />
          <Circle cx="8.3" cy="20.3" r="0.8" fill="#ffffff" />
          {shine(18, 17, 8, 2, -8)}
        </G>
      );
    case 'egg':
      return (
        <G>
          {shadow(24, 42, 18, 3.4)}
          <Path d="M8 22 Q6 10 18 8 Q30 4 38 12 Q46 20 40 30 Q36 40 24 40 Q10 40 8 30 Z" fill={f('cream')} stroke="#d5dae3" strokeWidth="1" />
          <Circle cx="24" cy="24" r="9" fill={f('yolk')} />
          {shine(21, 21, 3.4, 2, -30)}
        </G>
      );
    case 'bread':
      return (
        <G>
          {shadow(24, 44, 16, 3)}
          <Path d="M8 22 Q4 12 12 8 Q18 4 24 8 Q30 4 36 8 Q44 12 40 22 L40 40 Q40 43 37 43 L11 43 Q8 43 8 40 Z" fill="#b8742c" />
          <Path d="M11 22 Q8 14 14 11 Q18 8 24 11 Q30 8 34 11 Q40 14 37 22 L37 39 L11 39 Z" fill={f('bread')} />
          <Path d="M16 20 L32 20 M16 26 L32 26 M16 32 L30 32" stroke="#c98d3f" strokeWidth="1.3" strokeLinecap="round" opacity={0.5} />
          {shine(18, 15, 5, 1.8, -10)}
        </G>
      );
    case 'soup':
      return (
        <G>
          {shadow(24, 43, 19, 3.4)}
          <Path d="M4 22 L44 22 Q44 40 24 42 Q4 40 4 22 Z" fill={f('bowl')} stroke="#c3c9d3" strokeWidth="1" />
          <Ellipse cx="24" cy="22" rx="20" ry="6" fill="#f1b25a" />
          <Ellipse cx="24" cy="22" rx="20" ry="6" fill="none" stroke="#c3c9d3" strokeWidth="1.4" />
          <Circle cx="17" cy="21" r="2.1" fill="#6ca84a" />
          <Circle cx="25" cy="23" r="2.1" fill="#e46a3a" />
          <Circle cx="31" cy="21" r="1.8" fill="#6ca84a" />
          <Path d="M17 14 Q19 10 17 6 M24 14 Q26 10 24 6 M31 14 Q33 10 31 6" stroke="#b9bfca" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity={0.7} />
        </G>
      );
    case 'water':
      return (
        <G>
          {shadow(24, 44, 12, 2.8)}
          <Path d="M10 6 L38 6 L34 42 Q24 46 14 42 Z" fill="#e8f4fd" stroke="#bcd7ea" strokeWidth="1" opacity={0.9} />
          <Path d="M11.6 18 L36.4 18 L34 42 Q24 46 14 42 Z" fill={f('water')} />
          <Ellipse cx="24" cy="18" rx="12.4" ry="2.4" fill="#d8f0ff" />
          <Path d="M15 12 L16.6 38" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" opacity={0.6} />
        </G>
      );
    case 'nuts':
      return (
        <G>
          {shadow(24, 43, 17, 3)}
          <Ellipse cx="16" cy="28" rx="9" ry="13" transform="rotate(-25 16 28)" fill={f('nut')} />
          <Ellipse cx="32" cy="27" rx="9" ry="13" transform="rotate(22 32 27)" fill={f('nut')} />
          <Ellipse cx="24" cy="20" rx="9" ry="13" fill={f('nut')} />
          <Path d="M24 9 Q22 20 24 31" stroke="#6f4020" strokeWidth="1.2" fill="none" opacity={0.55} />
          {shine(21, 14, 2, 4.5, 8)}
        </G>
      );
    case 'beans':
      return (
        <G>
          {shadow(24, 42, 17, 3)}
          <Ellipse cx="14" cy="28" rx="8" ry="12" transform="rotate(-30 14 28)" fill={f('bean')} />
          <Ellipse cx="33" cy="28" rx="8" ry="12" transform="rotate(30 33 28)" fill={f('bean')} />
          <Ellipse cx="24" cy="19" rx="8" ry="12" transform="rotate(8 24 19)" fill={f('bean')} />
          {shine(21, 13, 1.8, 5, 10)}
          {shine(11, 23, 1.6, 4.6, -30)}
        </G>
      );
    case 'rice':
      return (
        <G>
          {shadow(24, 43, 19, 3.4)}
          <Path d="M4 24 Q24 18 44 24 Q44 40 24 42 Q4 40 4 24 Z" fill={f('bowl')} stroke="#c3c9d3" strokeWidth="1" />
          <Path d="M7 24 Q10 8 24 7 Q38 8 41 24 Q24 19 7 24 Z" fill={f('rice')} />
          <Path d="M16 14 L19 13 M24 10 L27 11 M30 15 L33 14 M20 18 L23 18" stroke="#c9ced8" strokeWidth="1.4" strokeLinecap="round" />
        </G>
      );
    case 'yogurt':
      return (
        <G>
          {shadow(24, 44, 14, 3)}
          <Path d="M9 14 L39 14 L35 41 Q24 45 13 41 Z" fill="#e9eef7" stroke="#c3c9d3" strokeWidth="1" />
          <Path d="M10 14 Q24 4 38 14 Z" fill={f('cream')} />
          <Path d="M11 22 L37 22 L35 41 Q24 45 13 41 Z" fill="#8f5fc4" opacity={0.85} />
          <Rect x="9" y="12" width="30" height="4" rx="2" fill="#ffffff" stroke="#c3c9d3" strokeWidth="1" />
          {shine(16, 30, 1.6, 6, 8)}
        </G>
      );
  }
}

/** One food, drawn at any size. */
export function FoodGlyph({ name, size = 56 }: { name: GlyphName; size?: number }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const p = `g${name}${uid}_`;
  return (
    <View aria-hidden>
      <Svg width={size} height={size} viewBox="0 0 48 48">
      <Defs3D p={p} />
      {glyph(name, p)}
    </Svg>
    </View>
  );
}

/** Slow perspective tilt + float. Reduce Motion: stays still. */
export function Hover3D({ children, style, tilt = 9 }: { children: React.ReactNode; style?: ViewStyle; tilt?: number }) {
  const reduce = useReducedMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    cancelAnimation(t);
    if (reduce) {
      t.value = 0.5;
      return;
    }
    t.value = withRepeat(withSequence(withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 3200, easing: Easing.inOut(Easing.sin) })), -1, false);
    return () => cancelAnimation(t);
  }, [reduce, t]);
  const anim = useAnimatedStyle(() => ({
    transform: [{ perspective: 700 }, { rotateX: `${10 + (t.value - 0.5) * tilt}deg` }, { rotateZ: `${(t.value - 0.5) * 2.2}deg` }, { translateY: (t.value - 0.5) * 6 }],
  }));
  return (
    <Animated.View aria-hidden style={[{ alignItems: 'center' }, style, anim]}>
      {children}
    </Animated.View>
  );
}

/** The balanced plate in 3D: half vegetables and fruit, a quarter protein, a quarter whole grains. */
export function Plate3D({ width = 320 }: { width?: number }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const p = `plate${uid}_`;
  const clip = `${p}clip`;
  const h = (width * 232) / 320;
  const item = (name: GlyphName, x: number, y: number, s: number) => (
    <G key={`${name}${x}`} transform={`translate(${x} ${y}) scale(${s})`}>
      {glyph(name, p)}
    </G>
  );
  return (
    <Hover3D>
      <Svg width={width} height={h} viewBox="0 0 320 232">
        <Defs3D p={p} />
        <Defs>
          <ClipPath id={clip}>
            <Ellipse cx="160" cy="112" rx="118" ry="62" />
          </ClipPath>
        </Defs>
        {shadow(160, 190, 150, 24)}
        {/* thickness of the plate */}
        <Ellipse cx="160" cy="128" rx="138" ry="74" fill={`url(#${p}plateSide)`} />
        <Ellipse cx="160" cy="120" rx="138" ry="74" fill={`url(#${p}plateRim)`} />
        <Ellipse cx="160" cy="116" rx="124" ry="66" fill="#eef0f5" />
        <Ellipse cx="160" cy="112" rx="118" ry="62" fill="#fafbfd" />
        <G clipPath={`url(#${clip})`}>
          <Path d="M160 50 A118 62 0 0 1 160 174 Z" fill={`url(#${p}secVeg)`} />
          <Path d="M160 50 A118 62 0 0 0 42 112 L160 112 Z" fill={`url(#${p}secProt)`} />
          <Path d="M42 112 A118 62 0 0 0 160 174 L160 112 Z" fill={`url(#${p}secGrain)`} />
          <Path d="M160 50 L160 174 M42 112 L160 112" stroke="#ffffff" strokeWidth="3.5" />
        </G>
        <Ellipse cx="160" cy="112" rx="118" ry="62" fill="none" stroke="#d5d9e2" strokeWidth="1.6" />
        {/* food */}
        {item('broccoli', 178, 56, 0.95)}
        {item('carrot', 222, 84, 0.85)}
        {item('apple', 190, 110, 0.9)}
        {item('avocado', 232, 116, 0.62)}
        {item('fish', 62, 52, 0.95)}
        {item('egg', 112, 70, 0.75)}
        {item('bread', 62, 118, 0.9)}
        {item('rice', 108, 126, 0.78)}
      </Svg>
    </Hover3D>
  );
}

/** Rounded tile that holds a glyph; keeps cards consistent. */
export function GlyphTile({ name, size = 56, bg }: { name: GlyphName; size?: number; bg: string }) {
  return (
    <View style={{ width: size + 16, height: size + 16, borderRadius: 18, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <FoodGlyph name={name} size={size} />
    </View>
  );
}

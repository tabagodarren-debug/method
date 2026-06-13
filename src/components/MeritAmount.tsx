import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, ViewStyle, TextStyle } from 'react-native';

type Props = {
  amount: number;
  animateKey?: number;
  prefix?: string;
  symbolSize?: number;
  textStyle?: TextStyle;
  color?: string;
  style?: ViewStyle;
};

export default function MeritAmount({
  amount,
  animateKey,
  prefix,
  symbolSize = 48,
  textStyle,
  color = '#F5F5F0',
  style,
}: Props) {
  const [display, setDisplay] = useState(amount);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (animateKey === undefined || amount === 0) {
      setDisplay(amount);
      return;
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const duration = 900;
    const startTime = Date.now();

    const tick = () => {
      const progress = Math.min((Date.now() - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(amount * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    setDisplay(0);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animateKey]);

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 6 }, style]}>
      {prefix ? <Text style={[textStyle, { color }]}>{prefix}</Text> : null}
      <Image
        source={require('../../assets/merit-symbol.png')}
        style={{ width: symbolSize, height: symbolSize, tintColor: color }}
        resizeMode="contain"
      />
      <Text style={[textStyle, { color }]}>{display.toLocaleString()}</Text>
    </View>
  );
}

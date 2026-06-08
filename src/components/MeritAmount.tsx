import React from 'react';
import { View, Text, Image, ViewStyle, TextStyle } from 'react-native';

type Props = {
  amount: number;
  prefix?: string;
  symbolSize?: number;
  textStyle?: TextStyle;
  color?: string;
  style?: ViewStyle;
};

export default function MeritAmount({
  amount,
  prefix,
  symbolSize = 48,
  textStyle,
  color = '#F5F5F0',
  style,
}: Props) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 6 }, style]}>
      {prefix ? <Text style={[textStyle, { color }]}>{prefix}</Text> : null}
      <Image
        source={require('../../assets/merit-symbol-method.png')}
        style={{ width: symbolSize, height: symbolSize, tintColor: color }}
        resizeMode="contain"
      />
      <Text style={[textStyle, { color }]}>{amount.toLocaleString()}</Text>
    </View>
  );
}

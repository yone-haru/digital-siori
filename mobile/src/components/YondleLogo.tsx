import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { C, F } from '../lib/colors';

export function YondleLogo() {
  return (
    <View style={s.row}>
      <Image source={require('../../assets/icon.png')} style={s.icon} />
      <Text style={s.name}>Yondle</Text>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 32, height: 32, borderRadius: 4 },
  name: {
    fontFamily: F.cormorant, fontSize: 22, color: C.ink,
    letterSpacing: 1.5,
  },
});

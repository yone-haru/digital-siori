import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Polygon } from 'react-native-svg';
import { C, F } from '../lib/colors';

export function BookmarkLogo() {
  return (
    <View style={s.row}>
      <Svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <Rect width="32" height="32" rx="2" fill={C.ink} />
        <Polygon points="8,26 8,6 24,6 24,22 16,26" fill={C.paper} />
        <Rect x="8" y="6" width="16" height="2" fill={C.ink} />
      </Svg>
      <View>
        <Text style={s.line}>Digital</Text>
        <Text style={s.line}>Bookmark</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  line: {
    fontFamily: F.cormorant, fontSize: 15, color: C.ink,
    letterSpacing: 1.2, lineHeight: 20,
  },
});

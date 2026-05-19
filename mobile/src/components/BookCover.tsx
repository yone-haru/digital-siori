import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { bookColor } from '../lib/utils';
import { F } from '../lib/colors';

type Props = {
  title: string;
  coverUrl?: string | null;
  width?: number;
  height?: number;
};

export function BookCover({ title, coverUrl, width = 104, height = 152 }: Props) {
  const bg = bookColor(title);
  const fontSize = Math.max(8, Math.round(width * 0.11));

  return (
    <View style={[s.wrapper, { width, height }]}>
      {coverUrl ? (
        <Image source={{ uri: coverUrl }} style={s.image} resizeMode="cover" />
      ) : (
        <View style={[s.fallback, { backgroundColor: bg }]}>
          <View style={s.line} />
          <Text style={[s.fallbackTitle, { fontSize }]} numberOfLines={3}>
            {title.slice(0, 12)}
          </Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: {
    borderRadius: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 4,
  },
  image: { width: '100%', height: '100%' },
  fallback: {
    flex: 1,
    padding: 8,
    justifyContent: 'space-between',
  },
  line: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: '100%',
  },
  fallbackTitle: {
    fontFamily: F.shippori,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 16,
  },
});

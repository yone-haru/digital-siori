import React, { useRef, useState } from 'react';
import { View, Text, PanResponder } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const PX_PER_STEP = 8;

function digitFineRatio(value: number, fineRatio: number, digitPos: number): number {
  if (digitPos === 0) return fineRatio;
  const lowerMod = Math.pow(10, digitPos);
  const lower = value % lowerMod;
  if (fineRatio > 0 && lower === lowerMod - 1) return fineRatio;
  if (fineRatio < 0 && lower === 0) return fineRatio;
  return 0;
}

interface Props {
  value: number;
  onChange: (value: number) => void;
  onCommit?: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  slotHeight?: number;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
}

export function DialInput({
  value,
  onChange,
  onCommit,
  min = 0,
  max = 99999,
  disabled = false,
  slotHeight = 44,
  color = '#0A0A0A',
  fontSize = 28,
  fontFamily,
}: Props) {
  const dragStartY = useRef(0);
  const dragStartValue = useRef(0);
  const latestValue = useRef(value);
  const lockedDigits = useRef(1);

  const valueRef = useRef(value); valueRef.current = value;
  const minRef = useRef(min); minRef.current = min;
  const maxRef = useRef(max); maxRef.current = max;
  const onChangeRef = useRef(onChange); onChangeRef.current = onChange;
  const onCommitRef = useRef(onCommit); onCommitRef.current = onCommit;

  const [isDragging, setIsDragging] = useState(false);
  const [fineRatio, setFineRatio] = useState(0);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onShouldBlockNativeResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        dragStartY.current = e.nativeEvent.pageY;
        const v = valueRef.current;
        dragStartValue.current = v;
        latestValue.current = v;
        lockedDigits.current = v <= 0 ? 1 : Math.floor(Math.log10(v)) + 1;
        setIsDragging(true);
        setFineRatio(0);
      },
      onPanResponderMove: (e) => {
        const dy = dragStartY.current - e.nativeEvent.pageY;
        const steps = Math.round(dy / PX_PER_STEP);
        const fine = dy - steps * PX_PER_STEP;
        const next = Math.max(minRef.current, Math.min(maxRef.current, dragStartValue.current + steps));
        latestValue.current = next;
        onChangeRef.current(next);
        setFineRatio(fine / PX_PER_STEP);
      },
      onPanResponderRelease: () => {
        setIsDragging(false);
        setFineRatio(0);
        onCommitRef.current?.(latestValue.current);
      },
      onPanResponderTerminate: () => {
        setIsDragging(false);
        setFineRatio(0);
      },
    })
  ).current;

  const displayFine = value <= min || value >= max ? 0 : fineRatio;
  const baseDigits = value <= 0 ? 1 : Math.floor(Math.log10(value)) + 1;
  const numDigits = isDragging ? Math.max(baseDigits, lockedDigits.current) : baseDigits;
  const digitW = Math.round(fontSize * 0.6);

  return (
    <View
      style={{ height: slotHeight, flexDirection: 'row', alignItems: 'center' }}
      {...pan.panHandlers}
    >
      {Array.from({ length: numDigits }, (_, i) => {
        const pos = numDigits - 1 - i;
        const dv = Math.floor(value / Math.pow(10, pos)) % 10;
        const lf = digitFineRatio(value, displayFine, pos);
        const ty = (-1 + lf) * slotHeight;
        const above = (dv + 1) % 10;
        const below = (dv - 1 + 10) % 10;
        const showAbove = pos === 0 ? value + 1 <= max : true;
        const showBelow = pos === 0 ? value - 1 >= min : true;

        return (
          <View key={pos} style={{ overflow: 'hidden', height: slotHeight, width: digitW }}>
            <View style={{ transform: [{ translateY: ty }] }}>
              <View style={{ height: slotHeight, alignItems: 'center', justifyContent: 'center', opacity: 0.28 }}>
                <Text style={{ fontFamily, fontSize, color }}>{showAbove ? String(above) : ''}</Text>
              </View>
              <View style={{ height: slotHeight, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily, fontSize, color }}>{String(dv)}</Text>
              </View>
              <View style={{ height: slotHeight, alignItems: 'center', justifyContent: 'center', opacity: 0.28 }}>
                <Text style={{ fontFamily, fontSize, color }}>{showBelow ? String(below) : ''}</Text>
              </View>
            </View>
          </View>
        );
      })}

      {!disabled && (
        <View style={{ marginLeft: 5, alignItems: 'center', opacity: isDragging ? 0 : 0.3 }}>
          <Svg width="8" height="5" viewBox="0 0 8 5" fill="none">
            <Path d="M1 4L4 1L7 4" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
          <View style={{ height: 3 }} />
          <Svg width="8" height="5" viewBox="0 0 8 5" fill="none">
            <Path d="M1 1L4 4L7 1" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </View>
      )}
    </View>
  );
}

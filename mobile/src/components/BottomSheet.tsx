import React, { useRef, useEffect, useState } from 'react';
import {
  Animated, PanResponder, Modal, TouchableOpacity,
  View, StyleSheet, Dimensions, KeyboardAvoidingView, Platform,
} from 'react-native';
import { C } from '../lib/colors';

const SCREEN_H = Dimensions.get('screen').height;

type Props = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  sheetStyle?: object | object[];
  disableClose?: boolean;
  keyboardAvoid?: boolean;
};

export function BottomSheet({ visible, onClose, children, sheetStyle, disableClose, keyboardAvoid }: Props) {
  const [modalVisible, setModalVisible] = useState(false);
  const translateY = useRef(new Animated.Value(SCREEN_H)).current;
  const closing = useRef(false);
  const state = useRef({ onClose, disableClose });
  state.current = { onClose, disableClose };

  useEffect(() => {
    if (visible) {
      closing.current = false;
      translateY.setValue(SCREEN_H);
      setModalVisible(true);
      Animated.spring(translateY, {
        toValue: 0,
        tension: 65,
        friction: 12,
        useNativeDriver: true,
      }).start();
    } else if (!closing.current) {
      closing.current = true;
      Animated.timing(translateY, {
        toValue: SCREEN_H,
        duration: 260,
        useNativeDriver: true,
      }).start(() => {
        setModalVisible(false);
        closing.current = false;
      });
    }
  }, [visible]);

  function handleClose() {
    if (state.current.disableClose || closing.current) return;
    closing.current = true;
    Animated.timing(translateY, {
      toValue: SCREEN_H,
      duration: 260,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      closing.current = false;
      state.current.onClose();
    });
  }

  function makePanConfig(immediate: boolean) {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => immediate && !state.current.disableClose,
      onMoveShouldSetPanResponder: (_, { dy }) => !state.current.disableClose && dy > (immediate ? 3 : 15),
      onPanResponderMove: (_, { dy }) => {
        if (!state.current.disableClose && dy > 0) translateY.setValue(dy);
      },
      onPanResponderRelease: (_, { dy, vy }) => {
        if (!state.current.disableClose && (dy > 80 || vy > 0.5)) handleClose();
        else Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
      },
    });
  }
  const handlePan = useRef(makePanConfig(true)).current;
  const sheetPan = useRef(makePanConfig(false)).current;

  const sheet = (
    <Animated.View style={[bs.sheetBase, sheetStyle, { transform: [{ translateY }] }]} {...sheetPan.panHandlers}>
      <View {...handlePan.panHandlers} style={bs.handleArea}>
        <View style={bs.handle} />
      </View>
      {children}
    </Animated.View>
  );

  return (
    <Modal visible={modalVisible} transparent animationType="none" onRequestClose={handleClose}>
      <TouchableOpacity style={bs.overlay} activeOpacity={1} onPress={handleClose} />
      {keyboardAvoid ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={StyleSheet.absoluteFill}
          pointerEvents="box-none"
        >
          {sheet}
        </KeyboardAvoidingView>
      ) : sheet}
    </Modal>
  );
}

const bs = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheetBase: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  handleArea: { alignItems: 'center', paddingTop: 12, paddingBottom: 24, marginBottom: 8 },
  handle: { width: 40, height: 3, backgroundColor: C.line, borderRadius: 2 },
});

import { useRef } from 'react';
import { PanResponder } from 'react-native';
import type { GestureResponderHandlers } from 'react-native';

export function useSwipeToDismiss(
  onClose: () => void,
  disabled = false,
): GestureResponderHandlers {
  const state = useRef({ onClose, disabled });
  state.current = { onClose, disabled };

  return useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !state.current.disabled,
      onMoveShouldSetPanResponder: (_, { dy }) => !state.current.disabled && dy > 5,
      onPanResponderRelease: (_, { dy, vy }) => {
        if (!state.current.disabled && (dy > 60 || vy > 0.5)) {
          state.current.onClose();
        }
      },
    })
  ).current.panHandlers;
}

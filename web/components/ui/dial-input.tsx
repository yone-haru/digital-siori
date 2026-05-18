"use client";

import { useRef, useState, useCallback } from "react";

interface DialInputProps {
  value: number;
  onChange: (value: number) => void;
  onCommit?: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  slotHeight?: number;
}

const PX_PER_STEP = 8;
const MASK = "linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%)";

// Digit at `digitPos` carries only when all lower digits are all-9 (going up) or all-0 (going down).
function digitFineRatio(value: number, fineRatio: number, digitPos: number): number {
  if (digitPos === 0) return fineRatio;
  const lowerMod = Math.pow(10, digitPos);
  const lower = value % lowerMod;
  if (fineRatio > 0 && lower === lowerMod - 1) return fineRatio;
  if (fineRatio < 0 && lower === 0) return fineRatio;
  return 0;
}

export function DialInput({
  value,
  onChange,
  onCommit,
  min = 0,
  max = 99999,
  disabled = false,
  placeholder,
  className = "",
  style,
  slotHeight = 44,
}: DialInputProps) {
  const dragStartY = useRef<number | null>(null);
  const dragStartValue = useRef(value);
  const latestValue = useRef(value);
  const lockedNumDigits = useRef(1);
  const [isDragging, setIsDragging] = useState(false);
  const [fineRatio, setFineRatio] = useState(0);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      dragStartY.current = e.clientY;
      dragStartValue.current = value;
      latestValue.current = value;
      lockedNumDigits.current = value <= 0 ? 1 : Math.floor(Math.log10(value)) + 1;
      setIsDragging(true);
      setFineRatio(0);
    },
    [disabled, value]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (dragStartY.current === null) return;
      const dy = dragStartY.current - e.clientY;
      const steps = Math.round(dy / PX_PER_STEP);
      const fine = dy - steps * PX_PER_STEP;
      const next = Math.max(min, Math.min(max, dragStartValue.current + steps));
      latestValue.current = next;
      onChange(next);
      setFineRatio(fine / PX_PER_STEP);
    },
    [min, max, onChange]
  );

  const onPointerUp = useCallback(() => {
    dragStartY.current = null;
    setIsDragging(false);
    setFineRatio(0);
    onCommit?.(latestValue.current);
  }, [onCommit]);

  // 境界値では一切アニメーションしない
  const displayFineRatio = (value <= min || value >= max) ? 0 : fineRatio;

  // ドラッグ中は桁数を開始時以上に保つ（9→10などの境界でガクつかない）
  const baseNumDigits = value <= 0 ? 1 : Math.floor(Math.log10(value)) + 1;
  const numDigits = isDragging ? Math.max(baseNumDigits, lockedNumDigits.current) : baseNumDigits;
  const showPlaceholder = placeholder && value === 0;

  const slotStyle = (opacity?: number): React.CSSProperties => ({
    height: slotHeight,
    lineHeight: `${slotHeight}px`,
    textAlign: "center",
    ...(opacity !== undefined ? { opacity } : {}),
  });

  return (
    <div
      className={`relative flex items-center ${disabled ? "opacity-50" : "cursor-ns-resize"} ${className}`}
      style={{
        touchAction: "none",
        userSelect: "none",
        height: slotHeight,
        ...style,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {showPlaceholder ? (
        <span style={{ opacity: 0.35, lineHeight: `${slotHeight}px`, height: slotHeight }}>
          {placeholder}
        </span>
      ) : (
        Array.from({ length: numDigits }, (_, i) => {
          const digitPos = numDigits - 1 - i;
          const digitVal = Math.floor(value / Math.pow(10, digitPos)) % 10;
          const localFine = digitFineRatio(value, displayFineRatio, digitPos);
          const columnY = (-1 + localFine) * slotHeight;

          const aboveDigit = (digitVal + 1) % 10;
          const belowDigit = (digitVal - 1 + 10) % 10;
          const showAbove = digitPos === 0 ? value + 1 <= max : true;
          const showBelow = digitPos === 0 ? value - 1 >= min : true;

          return (
            <div
              key={digitPos}
              style={{
                overflow: "hidden",
                height: slotHeight,
                flex: "0 0 auto",
                width: "1ch",
              }}
            >
              <div
                style={{
                  transform: `translateY(${columnY}px)`,
                  transition: (isDragging || value <= min || value >= max) ? "none" : "transform 0.12s ease-out",
                  willChange: "transform",
                  maskImage: MASK,
                  WebkitMaskImage: MASK,
                }}
              >
                <div style={slotStyle(0.28)}>{showAbove ? aboveDigit : ""}</div>
                <div style={slotStyle()}>{digitVal}</div>
                <div style={slotStyle(0.28)}>{showBelow ? belowDigit : ""}</div>
              </div>
            </div>
          );
        })
      )}

      {!disabled && (
        <span
          className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-[2px] pointer-events-none transition-opacity duration-150"
          style={{ opacity: isDragging ? 0 : 0.28 }}
          aria-hidden
        >
          <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
            <path d="M1 4L4 1L7 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
            <path d="M1 1L4 4L7 1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
    </div>
  );
}

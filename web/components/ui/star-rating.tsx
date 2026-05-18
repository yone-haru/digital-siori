"use client";

import { useId, useState } from "react";

const STAR_PATH =
  "M10,1 L12.1,7.1 L18.6,7.2 L13.4,11.1 L15.3,17.3 L10,13.6 L4.7,17.3 L6.6,11.1 L1.4,7.2 L7.9,7.1 Z";

function Star({ fill, size }: { fill: number; size: number }) {
  const clipId = `sc-${useId()}`;
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <defs>
        <clipPath id={clipId}>
          <rect x="0" y="0" width={20 * fill} height="20" />
        </clipPath>
      </defs>
      <path d={STAR_PATH} fill="currentColor" clipPath={`url(#${clipId})`} />
      <path d={STAR_PATH} stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

interface StarRatingInputProps {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
  size?: number;
}

export function StarRatingInput({
  value,
  onChange,
  disabled = false,
  size = 24,
}: StarRatingInputProps) {
  const [hover, setHover] = useState<number | null>(null);
  const displayed = hover ?? value;

  return (
    <div
      className={`flex gap-0.5 ${disabled ? "opacity-50 pointer-events-none" : "cursor-pointer"}`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const fill = Math.min(1, Math.max(0, displayed - (star - 1)));
        return (
          <div key={star} className="relative" style={{ width: size, height: size }}>
            <Star fill={fill} size={size} />
            {/* 左半分: star - 0.5 */}
            <div
              className="absolute inset-0"
              style={{ right: "50%" }}
              onPointerEnter={() => setHover(star - 0.5)}
              onPointerLeave={() => setHover(null)}
              onClick={() => onChange(value === star - 0.5 ? 0 : star - 0.5)}
            />
            {/* 右半分: star */}
            <div
              className="absolute inset-0"
              style={{ left: "50%" }}
              onPointerEnter={() => setHover(star)}
              onPointerLeave={() => setHover(null)}
              onClick={() => onChange(value === star ? 0 : star)}
            />
          </div>
        );
      })}
    </div>
  );
}

interface StarRatingDisplayProps {
  value: number;
  size?: number;
}

export function StarRatingDisplay({ value, size = 14 }: StarRatingDisplayProps) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} fill={Math.min(1, Math.max(0, value - (star - 1)))} size={size} />
      ))}
    </div>
  );
}

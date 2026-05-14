"use client";

import { useState } from "react";

const WEEK_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
const MONTH_NAMES = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月",
];

interface CalendarPickerProps {
  value: string;
  onChange: (date: string) => void;
  max?: string;
  min?: string;
  trigger: React.ReactNode;
  markedDates?: string[];
}

export function CalendarPicker({
  value,
  onChange,
  max,
  min,
  trigger,
  markedDates,
}: CalendarPickerProps) {
  const todayStr = new Date().toLocaleDateString("sv");

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => {
    const ref = value || todayStr;
    return parseInt(ref.slice(0, 4));
  });
  const [viewMonth, setViewMonth] = useState(() => {
    const ref = value || todayStr;
    return parseInt(ref.slice(5, 7)) - 1;
  });

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  function isPrevDisabled() {
    if (!min) return false;
    return viewYear < parseInt(min.slice(0, 4)) ||
      (viewYear === parseInt(min.slice(0, 4)) && viewMonth <= parseInt(min.slice(5, 7)) - 1);
  }
  function isNextDisabled() {
    if (!max) return false;
    return viewYear > parseInt(max.slice(0, 4)) ||
      (viewYear === parseInt(max.slice(0, 4)) && viewMonth >= parseInt(max.slice(5, 7)) - 1);
  }

  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const startOffset = firstDow === 0 ? 6 : firstDow - 1;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  function toStr(day: number) {
    return `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function isDisabled(day: number) {
    const ds = toStr(day);
    if (max && ds > max) return true;
    if (min && ds < min) return true;
    return false;
  }

  function handleSelect(day: number) {
    if (isDisabled(day)) return;
    onChange(toStr(day));
    setOpen(false);
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="w-full text-left">
        {trigger}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div
            className="absolute inset-0 bg-black/20"
            onClick={() => setOpen(false)}
          />
          <div className="relative bg-paper border border-line rounded-sm shadow-[0_8px_40px_rgba(0,0,0,0.14)] p-5 w-full max-w-[316px]">
            {/* Month nav */}
            <div className="flex justify-between items-center mb-5">
              <button
                type="button"
                onClick={prevMonth}
                disabled={isPrevDisabled()}
                className="font-cormorant text-[26px] text-muted hover:text-ink disabled:opacity-20 transition-colors leading-none px-1"
              >
                ‹
              </button>
              <span className="font-zen text-[12px] tracking-[0.12em] text-ink">
                {viewYear}年 {MONTH_NAMES[viewMonth]}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                disabled={isNextDisabled()}
                className="font-cormorant text-[26px] text-muted hover:text-ink disabled:opacity-20 transition-colors leading-none px-1"
              >
                ›
              </button>
            </div>

            {/* Day-of-week labels */}
            <div className="grid grid-cols-7 mb-1">
              {WEEK_LABELS.map((d, i) => (
                <div
                  key={i}
                  className="text-center font-zen text-[10px] text-muted-2 tracking-[0.05em] py-1"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Date grid */}
            <div className="grid grid-cols-7 gap-y-0.5">
              {Array.from({ length: startOffset }).map((_, i) => (
                <div key={`b${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const ds = toStr(day);
                const selected = ds === value;
                const disabled = isDisabled(day);
                const isMarked = markedDates?.includes(ds) ?? false;

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleSelect(day)}
                    disabled={disabled}
                    className={`
                      relative flex items-center justify-center h-9 w-full rounded-[2px]
                      font-cormorant text-[16px] leading-none transition-colors
                      ${selected
                        ? "text-paper"
                        : disabled
                          ? "text-muted-2 opacity-30 cursor-default"
                          : "text-ink hover:bg-line-2 cursor-pointer"
                      }
                    `}
                  >
                    {selected && (
                      <span className="absolute w-8 h-8 rounded-full bg-ink" />
                    )}
                    {isMarked && !selected && (
                      <span className="absolute w-8 h-8 rounded-full bg-line" />
                    )}
                    <span className="relative">{day}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-4 w-full font-zen text-[11px] tracking-[0.1em] text-muted-2 hover:text-ink transition-colors py-1"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </>
  );
}

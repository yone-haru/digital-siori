import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { C, F } from '../lib/colors';
import { todayStr } from '../lib/date';

const WEEK_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTH_NAMES = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月',
];

interface Props {
  value: string;
  onChange: (date: string) => void;
  max?: string;
  min?: string;
  trigger: React.ReactNode;
  markedDates?: string[];
}

export function CalendarPicker({ value, onChange, max, min, trigger, markedDates }: Props) {
  const today = todayStr();
  const { width: screenWidth } = useWindowDimensions();
  const calW = Math.min(screenWidth - 48, 316);
  const cellW = Math.floor((calW - 40) / 7);

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => {
    const ref = value || today;
    return parseInt(ref.slice(0, 4));
  });
  const [viewMonth, setViewMonth] = useState(() => {
    const ref = value || today;
    return parseInt(ref.slice(5, 7)) - 1;
  });

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
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

  function toStr(day: number) {
    return `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
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

  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const startOffset = firstDow === 0 ? 6 : firstDow - 1;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    const row = cells.slice(i, i + 7);
    while (row.length < 7) row.push(null);
    rows.push(row);
  }

  return (
    <>
      <TouchableOpacity onPress={() => setOpen(true)} activeOpacity={0.8}>
        {trigger}
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity
          style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.2)' }]}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        />
        <View
          style={[StyleSheet.absoluteFillObject, s.centered]}
          pointerEvents="box-none"
        >
          <View style={[s.card, { width: calW }]}>
            {/* Month nav */}
            <View style={s.monthNav}>
              <TouchableOpacity onPress={prevMonth} disabled={isPrevDisabled()} hitSlop={12}>
                <Text style={[s.navArrow, isPrevDisabled() && { opacity: 0.2 }]}>‹</Text>
              </TouchableOpacity>
              <Text style={s.monthLabel}>{viewYear}年 {MONTH_NAMES[viewMonth]}</Text>
              <TouchableOpacity onPress={nextMonth} disabled={isNextDisabled()} hitSlop={12}>
                <Text style={[s.navArrow, isNextDisabled() && { opacity: 0.2 }]}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Week labels */}
            <View style={s.weekRow}>
              {WEEK_LABELS.map((d, i) => (
                <View key={i} style={{ width: cellW, alignItems: 'center', paddingVertical: 4 }}>
                  <Text style={s.weekLabel}>{d}</Text>
                </View>
              ))}
            </View>

            {/* Day grid */}
            <View style={{ gap: 2 }}>
              {rows.map((row, ri) => (
                <View key={ri} style={{ flexDirection: 'row' }}>
                  {row.map((day, di) =>
                    day === null ? (
                      <View key={di} style={{ width: cellW }} />
                    ) : (
                      <TouchableOpacity
                        key={di}
                        style={{ width: cellW, height: 36, alignItems: 'center', justifyContent: 'center' }}
                        onPress={() => handleSelect(day)}
                        disabled={isDisabled(day)}
                        activeOpacity={0.7}
                      >
                        {toStr(day) === value && <View style={s.selectedCircle} />}
                        {(markedDates?.includes(toStr(day)) && toStr(day) !== value) && (
                          <View style={s.markedCircle} />
                        )}
                        <Text style={[
                          s.dayText,
                          toStr(day) === value && { color: C.paper },
                          isDisabled(day) && { color: C.muted2, opacity: 0.3 },
                        ]}>
                          {String(day)}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              ))}
            </View>

            {/* Cancel */}
            <TouchableOpacity style={s.cancelBtn} onPress={() => setOpen(false)} activeOpacity={0.7}>
              <Text style={s.cancelText}>キャンセル</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  centered: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  card: {
    backgroundColor: C.paper, borderRadius: 2, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14, shadowRadius: 20, elevation: 12,
  },
  monthNav: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20,
  },
  navArrow: { fontFamily: F.cormorant, fontSize: 26, color: C.muted, lineHeight: 32 },
  monthLabel: { fontFamily: F.zen, fontSize: 12, letterSpacing: 1.5, color: C.ink },
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  weekLabel: { fontFamily: F.zen, fontSize: 10, color: C.muted2, letterSpacing: 0.5 },
  selectedCircle: {
    position: 'absolute', width: 32, height: 32, borderRadius: 16, backgroundColor: C.ink,
  },
  markedCircle: {
    position: 'absolute', width: 32, height: 32, borderRadius: 16, backgroundColor: C.line2,
  },
  dayText: { fontFamily: F.cormorant, fontSize: 16, color: C.ink },
  cancelBtn: { marginTop: 16, alignItems: 'center', paddingVertical: 4 },
  cancelText: { fontFamily: F.zen, fontSize: 11, letterSpacing: 1, color: C.muted2 },
});

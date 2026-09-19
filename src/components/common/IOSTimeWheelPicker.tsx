import React, { useRef, useEffect, useCallback, useState } from 'react';
import { soundEngine } from '../../utils/audio';

interface IOSTimeWheelPickerProps {
  value: string; // "HH:mm", e.g. "17:30"
  onChange: (newValue: string) => void;
}

const ITEM_HEIGHT = 44; // Standard iOS 44px touch target
const VISIBLE_COUNT = 5; // 2 above, 1 center, 2 below
const PADDING_COUNT = Math.floor(VISIBLE_COUNT / 2); // 2 items padding top and bottom

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

interface WheelColumnProps {
  items: string[];
  selectedItem: string;
  onSelect: (item: string) => void;
  label?: string;
}

const WheelColumn: React.FC<WheelColumnProps> = ({
  items,
  selectedItem,
  onSelect,
  label,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isUserScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeIndex, setActiveIndex] = useState(() => {
    const idx = items.indexOf(selectedItem);
    return idx >= 0 ? idx : 0;
  });

  // Sync scroll position when selectedItem changes from parent and user is not scrolling
  useEffect(() => {
    const idx = items.indexOf(selectedItem);
    if (idx >= 0 && idx !== activeIndex) {
      setActiveIndex(idx);
      if (containerRef.current && !isUserScrollingRef.current) {
        containerRef.current.scrollTo({
          top: idx * ITEM_HEIGHT,
          behavior: 'smooth',
        });
      }
    }
  }, [selectedItem, items, activeIndex]);

  // Initial scroll into position
  useEffect(() => {
    const idx = items.indexOf(selectedItem);
    if (containerRef.current && idx >= 0) {
      containerRef.current.scrollTop = idx * ITEM_HEIGHT;
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    isUserScrollingRef.current = true;

    const scrollTop = containerRef.current.scrollTop;
    const rawIndex = Math.round(scrollTop / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(items.length - 1, rawIndex));

    if (clampedIndex !== activeIndex) {
      setActiveIndex(clampedIndex);
      soundEngine.playPop();
    }

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      isUserScrollingRef.current = false;
      const finalScrollTop = containerRef.current?.scrollTop || 0;
      const finalIndex = Math.max(
        0,
        Math.min(items.length - 1, Math.round(finalScrollTop / ITEM_HEIGHT))
      );
      // Snap strictly to the exact pixel offset
      containerRef.current?.scrollTo({
        top: finalIndex * ITEM_HEIGHT,
        behavior: 'smooth',
      });
      if (items[finalIndex] !== selectedItem) {
        onSelect(items[finalIndex]);
      }
    }, 150);
  }, [items, activeIndex, onSelect, selectedItem]);

  const handleItemClick = (index: number) => {
    soundEngine.playPop();
    containerRef.current?.scrollTo({
      top: index * ITEM_HEIGHT,
      behavior: 'smooth',
    });
    onSelect(items[index]);
  };

  return (
    <div className="flex flex-col items-center select-none relative">
      {/* Scrollable list */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="overflow-y-auto scroll-smooth scrollbar-none relative w-20 sm:w-24 text-center cursor-pointer"
        style={{
          height: `${ITEM_HEIGHT * VISIBLE_COUNT}px`,
          scrollSnapType: 'y mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {/* Top Spacer to align first item in center */}
        <div style={{ height: `${ITEM_HEIGHT * PADDING_COUNT}px` }} />

        {items.map((item, idx) => {
          const distance = Math.abs(idx - activeIndex);
          const isSelected = idx === activeIndex;

          let opacity = 0.25;
          let scale = 0.85;
          let fontWeight = 'font-normal';
          let textColor = 'text-slate-400';

          if (isSelected) {
            opacity = 1;
            scale = 1.15;
            fontWeight = 'font-black';
            textColor = 'text-amber-600';
          } else if (distance === 1) {
            opacity = 0.65;
            scale = 0.95;
            fontWeight = 'font-bold';
            textColor = 'text-slate-600';
          }

          return (
            <div
              key={item}
              onClick={() => handleItemClick(idx)}
              style={{
                height: `${ITEM_HEIGHT}px`,
                scrollSnapAlign: 'center',
                transform: `scale(${scale})`,
                opacity,
              }}
              className={`flex items-center justify-center transition-all duration-150 font-mono ${fontWeight} ${textColor}`}
            >
              <span className="text-2xl sm:text-3xl tracking-tight">{item}</span>
            </div>
          );
        })}

        {/* Bottom Spacer to align last item in center */}
        <div style={{ height: `${ITEM_HEIGHT * PADDING_COUNT}px` }} />
      </div>

      {label && (
        <span className="text-[11px] font-bold text-slate-400 mt-1">{label}</span>
      )}
    </div>
  );
};

export const IOSTimeWheelPicker: React.FC<IOSTimeWheelPickerProps> = ({
  value,
  onChange,
}) => {
  const parts = (value || '17:30').split(':');
  const selectedHour = parts[0] ? parts[0].padStart(2, '0') : '17';
  const selectedMinute = parts[1] ? parts[1].padStart(2, '0') : '30';

  const handleHourChange = (newHour: string) => {
    onChange(`${newHour}:${selectedMinute}`);
  };

  const handleMinuteChange = (newMinute: string) => {
    onChange(`${selectedHour}:${newMinute}`);
  };

  return (
    <div className="relative bg-gradient-to-b from-slate-50 to-amber-50/40 p-4 sm:p-5 rounded-3xl border-2 border-amber-200/80 shadow-inner flex flex-col items-center justify-center select-none overflow-hidden max-w-sm mx-auto">
      {/* Visual Center Selection Lens (iOS Cupertino style glass highlight bar) */}
      <div
        className="absolute left-4 right-4 rounded-2xl bg-amber-400/20 border-2 border-amber-400/50 shadow-sm pointer-events-none z-0"
        style={{
          top: `calc(50% - ${ITEM_HEIGHT / 2}px - 10px)`,
          height: `${ITEM_HEIGHT}px`,
        }}
      />

      {/* Top and Bottom Fading Gradient Overlays */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-slate-50 via-slate-50/80 to-transparent pointer-events-none z-10" />
      <div className="absolute bottom-6 left-0 right-0 h-16 bg-gradient-to-t from-amber-50/90 via-amber-50/60 to-transparent pointer-events-none z-10" />

      {/* Wheels Container */}
      <div className="flex items-center justify-center gap-2 sm:gap-4 relative z-0">
        {/* Hours Wheel */}
        <WheelColumn
          items={HOURS}
          selectedItem={selectedHour}
          onSelect={handleHourChange}
          label="小时 (00-23)"
        />

        {/* Colon Divider */}
        <div className="flex flex-col items-center justify-center pb-5">
          <span className="text-2xl sm:text-3xl font-black text-amber-500 font-mono animate-pulse">
            :
          </span>
        </div>

        {/* Minutes Wheel */}
        <WheelColumn
          items={MINUTES}
          selectedItem={selectedMinute}
          onSelect={handleMinuteChange}
          label="分钟 (00-59)"
        />
      </div>

      {/* Selected Time Subtitle */}
      <div className="mt-2 text-xs font-black text-amber-900/90 bg-amber-200/60 px-3 py-1 rounded-full border border-amber-300 font-mono z-10">
        已选时间：{selectedHour}:{selectedMinute}
      </div>
    </div>
  );
};

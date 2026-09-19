import React, { useRef, useEffect, useCallback, useState } from 'react';
import { soundEngine } from '../../utils/audio';

interface IOSTimeWheelPickerProps {
  value: string; // "HH:mm", e.g. "17:30"
  onChange: (newValue: string) => void;
}

const ITEM_HEIGHT = 44; // Standard iOS 44px touch target
const VISIBLE_COUNT = 5; // 2 above, 1 center, 2 below
const PADDING_COUNT = 2; // Math.floor(VISIBLE_COUNT / 2)
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_COUNT; // Exactly 220px
const CENTER_Y = PADDING_COUNT * ITEM_HEIGHT; // Exactly 88px

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
  const isDraggingRef = useRef(false);
  const hasMovedRef = useRef(false);
  const startYRef = useRef(0);
  const startScrollTopRef = useRef(0);
  const lastYRef = useRef(0);
  const lastTimeRef = useRef(0);
  const velocityRef = useRef(0);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() => {
    const idx = items.indexOf(selectedItem);
    return idx >= 0 ? idx : 0;
  });

  // Sync scroll position when selectedItem changes from parent and user is not dragging
  useEffect(() => {
    const idx = items.indexOf(selectedItem);
    if (idx >= 0 && idx !== activeIndex && !isDraggingRef.current) {
      setActiveIndex(idx);
      if (containerRef.current) {
        containerRef.current.scrollTo({
          top: idx * ITEM_HEIGHT,
          behavior: 'smooth',
        });
      }
    }
  }, [selectedItem, items, activeIndex]);

  // Initial scroll into exact position on mount
  useEffect(() => {
    const idx = items.indexOf(selectedItem);
    if (containerRef.current && idx >= 0) {
      containerRef.current.scrollTop = idx * ITEM_HEIGHT;
      setActiveIndex(idx);
    }
  }, []);

  // Update active index during scroll (wheel, momentum, drag)
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const rawIndex = Math.round(scrollTop / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(items.length - 1, rawIndex));

    if (clampedIndex !== activeIndex) {
      setActiveIndex(clampedIndex);
      soundEngine.playPop();
    }

    if (!isDraggingRef.current) {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        const finalScrollTop = containerRef.current?.scrollTop || 0;
        const finalIndex = Math.max(
          0,
          Math.min(items.length - 1, Math.round(finalScrollTop / ITEM_HEIGHT))
        );
        containerRef.current?.scrollTo({
          top: finalIndex * ITEM_HEIGHT,
          behavior: 'smooth',
        });
        if (items[finalIndex] !== selectedItem) {
          onSelect(items[finalIndex]);
        }
      }, 100);
    }
  }, [items, activeIndex, onSelect, selectedItem]);

  // Pointer Drag: Supports Left-Click Drag on Desktop & Touch Drag on Mobile
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Left mouse click or touch only
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    setIsDragging(true);

    startYRef.current = e.clientY;
    startScrollTopRef.current = containerRef.current ? containerRef.current.scrollTop : 0;
    lastYRef.current = e.clientY;
    lastTimeRef.current = performance.now();
    velocityRef.current = 0;

    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    const deltaY = e.clientY - startYRef.current;
    if (Math.abs(deltaY) > 2) {
      hasMovedRef.current = true;
    }

    const now = performance.now();
    const dt = now - lastTimeRef.current;
    if (dt > 10) {
      velocityRef.current = (e.clientY - lastYRef.current) / dt;
      lastYRef.current = e.clientY;
      lastTimeRef.current = now;
    }

    containerRef.current.scrollTop = startScrollTopRef.current - deltaY;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    if (hasMovedRef.current) {
      let momentum = 0;
      if (Math.abs(velocityRef.current) > 0.35) {
        momentum = -velocityRef.current * 110;
      }

      const targetScroll = containerRef.current.scrollTop + momentum;
      const targetIndex = Math.max(
        0,
        Math.min(items.length - 1, Math.round(targetScroll / ITEM_HEIGHT))
      );

      containerRef.current.scrollTo({
        top: targetIndex * ITEM_HEIGHT,
        behavior: 'smooth',
      });
      setActiveIndex(targetIndex);
      onSelect(items[targetIndex]);
      soundEngine.playPop();
    }
  };

  const handleItemClick = (index: number) => {
    if (hasMovedRef.current) return;
    soundEngine.playPop();
    containerRef.current?.scrollTo({
      top: index * ITEM_HEIGHT,
      behavior: 'smooth',
    });
    setActiveIndex(index);
    onSelect(items[index]);
  };

  return (
    <div className="flex flex-col items-center select-none relative">
      {/* Scrollable column with drag capture */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`overflow-y-auto scrollbar-none relative w-20 sm:w-24 text-center select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{
          height: `${WHEEL_HEIGHT}px`,
          scrollSnapType: isDragging ? 'none' : 'y mandatory',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'none', // Critical for pointer drag support
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {/* Top Spacer to align first item in center (y = 88px) */}
        <div style={{ height: `${CENTER_Y}px` }} />

        {items.map((item, idx) => {
          const isSelected = idx === activeIndex;
          const distance = Math.abs(idx - activeIndex);

          let opacity = 0.25;
          let scale = 0.85;
          let fontWeight = 'font-normal';
          let textColor = 'text-slate-400';

          if (isSelected) {
            opacity = 1;
            scale = 1.18;
            fontWeight = 'font-black';
            textColor = 'text-amber-600';
          } else if (distance === 1) {
            opacity = 0.6;
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
              className={`flex items-center justify-center transition-all duration-100 font-mono ${fontWeight} ${textColor}`}
            >
              <span className="text-2xl sm:text-3xl tracking-tight select-none">{item}</span>
            </div>
          );
        })}

        {/* Bottom Spacer to align last item in center */}
        <div style={{ height: `${CENTER_Y}px` }} />
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
      {/* Exact Wheels Area with 220px fixed height */}
      <div
        className="relative w-full max-w-[280px] flex items-center justify-center"
        style={{ height: `${WHEEL_HEIGHT}px` }}
      >
        {/* Visual Center Selection Lens (iOS Cupertino style glass highlight bar) */}
        {/* Exactly aligned with item height 44px at center offset 88px */}
        <div
          className="absolute left-2 right-2 rounded-2xl bg-amber-400/25 border-2 border-amber-400/60 shadow-sm pointer-events-none z-0"
          style={{
            top: `${CENTER_Y}px`,
            height: `${ITEM_HEIGHT}px`,
          }}
        />

        {/* Top and Bottom Fading Gradient Overlays */}
        <div
          className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-slate-50 via-slate-50/80 to-transparent pointer-events-none z-10"
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-amber-50/90 via-amber-50/60 to-transparent pointer-events-none z-10"
        />

        {/* Wheels Row */}
        <div className="flex items-center justify-center gap-3 sm:gap-6 relative z-0 h-full">
          {/* Hours Wheel */}
          <WheelColumn
            items={HOURS}
            selectedItem={selectedHour}
            onSelect={handleHourChange}
            label="时 (00-23)"
          />

          {/* Colon Divider */}
          <div className="flex flex-col items-center justify-center select-none pb-4">
            <span className="text-2xl sm:text-3xl font-black text-amber-500 font-mono animate-pulse">
              :
            </span>
          </div>

          {/* Minutes Wheel */}
          <WheelColumn
            items={MINUTES}
            selectedItem={selectedMinute}
            onSelect={handleMinuteChange}
            label="分 (00-59)"
          />
        </div>
      </div>

      {/* Selected Time Subtitle */}
      <div className="mt-3 text-xs font-black text-amber-900/90 bg-amber-200/60 px-3.5 py-1 rounded-full border border-amber-300 font-mono z-10">
        已选时间：{selectedHour}:{selectedMinute}
      </div>
    </div>
  );
};


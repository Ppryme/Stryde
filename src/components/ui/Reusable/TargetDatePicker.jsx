import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import {
  getDateFromValue,
  formatDateDisplay,
  formatMonthYear,
  getCalendarDays,
  isDateDisabled,
  formatDateISO,
} from '@/lib/date-picker';

export const TargetDatePicker = ({
  value,
  onChange,
  label = 'Target date',
  placeholder = 'Pick a date',
  min,
  max,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => getDateFromValue(value) ?? new Date());
  const containerRef = useRef(null);
  const previousValueRef = useRef(value);

  // Sync view date strictly when external `value` prop changes
  useEffect(() => {
    if (value !== previousValueRef.current) {
      previousValueRef.current = value;
      const externalDate = getDateFromValue(value);
      if (externalDate) {
        setViewDate(externalDate);
      }
    }
  }, [value]);

  // Derived & memoized values
  const selectedDate = useMemo(() => getDateFromValue(value), [value]);
  const displayValue = useMemo(() => (value ? formatDateDisplay(value) : ''), [value]);
  const days = useMemo(() => getCalendarDays(viewDate), [viewDate]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside, { passive: true });
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const handleDateSelect = useCallback(
    (date) => {
      const iso = formatDateISO(date);
      onChange(iso);
      setIsOpen(false);
    },
    [onChange]
  );

  const handleClear = useCallback(
    (e) => {
      e.stopPropagation();
      onChange('');
    },
    [onChange]
  );

  const changeMonth = useCallback((delta) => {
    setViewDate((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + delta);
      return next;
    });
  }, []);

  const changeYear = useCallback((delta) => {
    setViewDate((prev) => {
      const next = new Date(prev);
      next.setFullYear(next.getFullYear() + delta);
      return next;
    });
  }, []);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {label && (
        <label className="block mb-2 text-sm font-medium text-bento-text">
          {label}
        </label>
      )}

      {/* Input trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm rounded-xl
          bg-bento-bg border border-bento-border text-bento-text
          outline-none focus:border-stryde-primary focus:ring-2 focus:ring-stryde-primary/20
          transition-all duration-200 hover:border-stryde-primary/60"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-bento-text/70" />
          <span className={displayValue ? 'text-bento-text' : 'text-bento-text/50'}>
            {displayValue || placeholder}
          </span>
        </span>
        {value && (
          <span
            onClick={handleClear}
            className="p-1 rounded-full hover:bg-bento-text/10 transition-colors"
            aria-label="Clear date"
          >
            <X className="w-3.5 h-3.5 text-bento-text/60" />
          </span>
        )}
      </button>

      {/* Calendar popup */}
      {isOpen && (
        <div
          className="absolute z-50 mt-2 w-[280px] sm:w-[320px] rounded-2xl border border-bento-border
            bg-bento-bg shadow-xl shadow-black/10 animate-fade-in overflow-hidden"
          role="dialog"
          aria-label="Date picker"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-bento-border/60">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => changeYear(-1)}
                className="p-1 rounded-lg hover:bg-bento-text/10 text-bento-text/70 hover:text-bento-text transition-colors"
                aria-label="Previous year"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                className="p-1.5 rounded-lg hover:bg-bento-text/10 text-bento-text transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            <div className="text-sm font-semibold text-bento-text tabular-nums">
              {formatMonthYear(viewDate)}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => changeMonth(1)}
                className="p-1.5 rounded-lg hover:bg-bento-text/10 text-bento-text transition-colors"
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => changeYear(1)}
                className="p-1 rounded-lg hover:bg-bento-text/10 text-bento-text/70 hover:text-bento-text transition-colors"
                aria-label="Next year"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Weekday labels */}
          <div className="grid grid-cols-7 px-3 pt-3 pb-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <div
                key={day}
                className="text-center text-[11px] font-semibold text-bento-text/50 uppercase tracking-wider"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1 p-3 pt-1">
            {days.map((day, index) => {
              const iso = formatDateISO(day.date);
              const isSelected = value === iso;
              const isToday = day.date.getTime() === today.getTime();
              const isCurrentMonth = day.isCurrentMonth;
              const isDisabled = isDateDisabled(day.date, min, max);

              return (
                <button
                  key={index}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleDateSelect(day.date)}
                  className={`
                    relative h-9 w-full rounded-lg text-sm font-medium
                    flex items-center justify-center
                    transition-all duration-150
                    ${isSelected
                      ? 'bg-stryde-primary text-white shadow-md shadow-stryde-primary/25'
                      : 'text-bento-text hover:bg-bento-text/5'}
                    ${!isCurrentMonth && !isSelected ? 'text-bento-text/30' : ''}
                    ${isToday && !isSelected ? 'ring-1 ring-stryde-primary text-stryde-primary font-bold' : ''}
                    ${isDisabled ? 'opacity-40 cursor-not-allowed hover:bg-transparent' : 'cursor-pointer'}
                  `}
                >
                  {day.date.getDate()}
                  {isToday && !isSelected && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-stryde-primary" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-bento-border/60 bg-bento-bg/50">
            <button
              type="button"
              onClick={() => handleDateSelect(new Date())}
              className="text-xs font-semibold text-stryde-primary hover:text-stryde-primary/80 transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs font-medium text-bento-text/60 hover:text-bento-text transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
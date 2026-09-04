import React, { useState, useRef, useEffect } from 'react';
import {
  Monitor,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Check,
  Sparkles,
  Info,
  ChevronDown,
} from 'lucide-react';
import { DisplayInfo } from '../utils/useDisplayResolution';

interface DisplayResolutionMenuProps {
  displayInfo: DisplayInfo;
  scale: number;
  isAuto: boolean;
  setScale: (scale: number) => void;
  setAuto: (auto: boolean) => void;
  toggleFullscreen: () => void;
  increaseScale: () => void;
  decreaseScale: () => void;
  resetScale: () => void;
}

const SCALE_PRESETS = [
  { label: '100% (Native 1:1)', value: 1.0 },
  { label: '125% (Slightly larger)', value: 1.25 },
  { label: '150% (4K Balanced)', value: 1.5 },
  { label: '175% (Comfortable)', value: 1.75 },
  { label: '200% (4K Ultra-Crisp)', value: 2.0 },
  { label: '250% (High Readability)', value: 2.5 },
];

export const DisplayResolutionMenu: React.FC<DisplayResolutionMenuProps> = ({
  displayInfo,
  scale,
  isAuto,
  setScale,
  setAuto,
  toggleFullscreen,
  increaseScale,
  decreaseScale,
  resetScale,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const scalePercent = Math.round(scale * 100);

  return (
    <div className="relative" ref={menuRef}>
      {/* TitleBar Trigger Button */}
      <button
        id="btn-display-resolution"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Display Resolution & 4K UI Scaling"
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
          isOpen
            ? 'bg-blue-600 text-white shadow-xs'
            : displayInfo.is4K
            ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:hover:bg-blue-900/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80'
            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60'
        }`}
      >
        <Monitor className="w-3.5 h-3.5 shrink-0 text-blue-500 dark:text-blue-400" />
        <span className="font-mono text-[11px] whitespace-nowrap">
          {displayInfo.is4K ? '4K' : displayInfo.is1440p ? '1440p' : 'Display'}: {scalePercent}%
        </span>
        {isAuto && (
          <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-blue-500/20 text-blue-600 dark:text-blue-300">
            AUTO
          </span>
        )}
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl z-50 animate-in fade-in-50 zoom-in-95 duration-100 text-neutral-900 dark:text-neutral-100 select-none">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/80 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Monitor className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-xs text-neutral-900 dark:text-white">
                  Display Resolution & 4K Scaling
                </h3>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                  Matches your monitor's native pixels with razor-sharp clarity
                </p>
              </div>
            </div>
          </div>

          {/* Real-time Hardware & Display Metrics */}
          <div className="my-3 p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-neutral-500 dark:text-neutral-400">Detected Monitor:</span>
              <span className="font-semibold font-mono text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                {displayInfo.is4K && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500 text-white leading-none">
                    4K UHD
                  </span>
                )}
                {displayInfo.physicalWidth} × {displayInfo.physicalHeight}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-neutral-500 dark:text-neutral-400">Window Viewport:</span>
              <span className="font-mono text-neutral-700 dark:text-neutral-300">
                {displayInfo.cssWidth} × {displayInfo.cssHeight} px
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-neutral-500 dark:text-neutral-400">System DPI Scaling:</span>
              <span className="font-mono text-neutral-700 dark:text-neutral-300">
                {displayInfo.devicePixelRatio.toFixed(2)}x ({Math.round(displayInfo.devicePixelRatio * 100)}%)
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-neutral-500 dark:text-neutral-400">Antialiasing & Sharpening:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                Hardware Vector Subpixel
              </span>
            </div>
          </div>

          {/* Scale Fine-Tuning & Presets */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                App UI Scale
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={decreaseScale}
                  title="Decrease UI Scale (-10%)"
                  className="p-1 rounded bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono font-bold text-xs text-neutral-900 dark:text-white px-2 min-w-[48px] text-center">
                  {scalePercent}%
                </span>
                <button
                  type="button"
                  onClick={increaseScale}
                  title="Increase UI Scale (+10%)"
                  className="p-1 rounded bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Presets List */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setAuto(true)}
                className={`col-span-2 flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  isAuto
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Auto-Match Display Resolution</span>
                </div>
                {isAuto && <Check className="w-3.5 h-3.5" />}
              </button>

              {SCALE_PRESETS.map((preset) => {
                const isSelected = !isAuto && Math.abs(scale - preset.value) < 0.05;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setScale(preset.value)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
                    }`}
                  >
                    <span>{preset.label}</span>
                    {isSelected && <Check className="w-3 h-3" />}
                  </button>
                );
              })}
            </div>

            {/* Fullscreen Action */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 text-xs font-semibold shadow-xs transition-colors"
            >
              {displayInfo.isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Exit Fullscreen</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Expand to Full 4K Screen (F11)</span>
                </>
              )}
            </button>
          </div>

          {/* 4K Native Windows Guidance */}
          <div className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800 flex items-start gap-1.5 text-[10px] text-neutral-500 dark:text-neutral-400">
            <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
            <span>
              Tip: Run <code className="font-mono text-blue-600 dark:text-blue-400 font-semibold">run.bat</code> or{' '}
              <code className="font-mono text-blue-600 dark:text-blue-400 font-semibold">Organizer-Desktop-App.bat</code>{' '}
              to launch in a native High-DPI Windows window that matches your 4K monitor.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

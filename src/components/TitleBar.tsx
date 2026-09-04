import React from 'react';
import {
  FolderArchive,
  LayoutGrid,
  Terminal,
  History,
  Sun,
  Moon,
  Minus,
  Square,
  X,
  Sparkles,
  Copy,
} from 'lucide-react';
import { ViewMode } from '../types';
import { DisplayInfo } from '../utils/useDisplayResolution';
import { DisplayResolutionMenu } from './DisplayResolutionMenu';

interface TitleBarProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  totalItemsCount: number;
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

export const TitleBar: React.FC<TitleBarProps> = ({
  viewMode,
  setViewMode,
  isDark,
  setIsDark,
  totalItemsCount,
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
  return (
    <header
      id="windows-title-bar"
      className="select-none flex items-center justify-between px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/90 dark:bg-neutral-900/90 backdrop-blur-md transition-colors shrink-0"
    >
      {/* Left: Windows App Icon & Title & Navigation */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 pr-3 border-r border-neutral-300 dark:border-neutral-700">
          <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <FolderArchive className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-xs tracking-tight text-neutral-800 dark:text-neutral-100">
            Desktop File Organizer
          </span>
          <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
            Windows 11
          </span>
        </div>

        {/* View Switcher Tabs */}
        <nav className="flex items-center gap-1">
          <button
            id="tab-organizer"
            type="button"
            onClick={() => setViewMode('manager')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
              viewMode === 'manager'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xs border border-neutral-200 dark:border-neutral-700'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Organizer</span>
          </button>

          <button
            id="tab-desktop-view"
            type="button"
            onClick={() => setViewMode('desktop')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
              viewMode === 'desktop'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xs border border-neutral-200 dark:border-neutral-700'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-indigo-500" />
            <span>Desktop Preview</span>
            <span className="ml-0.5 px-1 py-0.2 rounded-full text-[10px] bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-mono">
              {totalItemsCount}
            </span>
          </button>

          <button
            id="tab-script-gen"
            type="button"
            onClick={() => setViewMode('script')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
              viewMode === 'script'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xs border border-neutral-200 dark:border-neutral-700'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-500" />
            <span>Windows Script (.bat)</span>
          </button>

          <button
            id="tab-history"
            type="button"
            onClick={() => setViewMode('history')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
              viewMode === 'history'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xs border border-neutral-200 dark:border-neutral-700'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50'
            }`}
          >
            <History className="w-3.5 h-3.5 text-amber-500" />
            <span>Undo & History</span>
          </button>
        </nav>
      </div>

      {/* Right: Display Resolution / 4K UI Scale & Theme & Window Controls */}
      <div className="flex items-center gap-2">
        {/* Display Resolution & 4K Scaling Menu */}
        <DisplayResolutionMenu
          displayInfo={displayInfo}
          scale={scale}
          isAuto={isAuto}
          setScale={setScale}
          setAuto={setAuto}
          toggleFullscreen={toggleFullscreen}
          increaseScale={increaseScale}
          decreaseScale={decreaseScale}
          resetScale={resetScale}
        />

        {/* Theme Toggle */}
        <button
          id="btn-theme-toggle"
          type="button"
          onClick={() => setIsDark(!isDark)}
          aria-label="Toggle Theme"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-1.5 rounded text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
        >
          {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        {/* Windows 11 style window buttons */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={decreaseScale}
            className="w-8 h-7 flex items-center justify-center text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors rounded-xs"
            aria-label="Zoom Out"
            title="Decrease UI Zoom (-10%)"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="w-8 h-7 flex items-center justify-center text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors rounded-xs"
            aria-label={displayInfo.isFullscreen ? 'Restore Window' : 'Maximize to 4K Screen'}
            title={displayInfo.isFullscreen ? 'Restore Window (F11)' : 'Maximize to 4K Screen (F11)'}
          >
            {displayInfo.isFullscreen ? <Copy className="w-2.5 h-2.5 rotate-180" /> : <Square className="w-2.5 h-2.5" />}
          </button>
          <button
            type="button"
            onClick={() => {
              if (displayInfo.isFullscreen) {
                toggleFullscreen();
              } else {
                window.close();
              }
            }}
            className="w-8 h-7 flex items-center justify-center text-neutral-500 hover:bg-red-600 hover:text-white transition-colors rounded-xs"
            aria-label="Close"
            title="Close Window"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};

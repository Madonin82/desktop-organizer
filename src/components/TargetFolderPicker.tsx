import React from 'react';
import {
  FolderInput,
  ArrowRight,
  Sparkles,
  FolderPlus,
} from 'lucide-react';
import { FileCategoryKey } from '../types';

interface TargetFolderPickerProps {
  targetFolderName: string;
  setTargetFolderName: (name: string) => void;
  selectedCategory: FileCategoryKey;
  selectedCount: number;
  existingFolders: string[];
  onExecuteMove: () => void;
  isExecuting: boolean;
  currentLocationName?: string;
}

export const TargetFolderPicker: React.FC<TargetFolderPickerProps> = ({
  targetFolderName,
  setTargetFolderName,
  selectedCategory,
  selectedCount,
  existingFolders,
  onExecuteMove,
  isExecuting,
  currentLocationName = 'Current Location',
}) => {
  const cleanTarget = targetFolderName.replace(/^[\\/]+|[\\/]+$/g, '');

  const quickPresets = [
    { label: 'Pictures', value: 'Pictures' },
    { label: 'Documents', value: 'Documents' },
    { label: 'Shortcuts', value: 'Shortcuts' },
    { label: 'Installers', value: 'Installers' },
    { label: 'Archives', value: 'Archives' },
    { label: 'Organized 2026', value: 'Organized 2026' },
    { label: 'Cleaned Up', value: 'Cleaned Up' },
  ];

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900/90 border-t border-neutral-200 dark:border-neutral-800 p-4 transition-colors">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Step 3 Destination Folder Input */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            <span>Step 3</span>
            <span className="text-neutral-300 dark:text-neutral-700">•</span>
            <span className="text-neutral-700 dark:text-neutral-300">Choose Destination Folder</span>
            <span className="text-[11px] font-normal text-neutral-400 dark:text-neutral-500">
              (will be created in {currentLocationName})
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="relative flex-1">
              <FolderInput className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                id="input-target-folder"
                type="text"
                value={targetFolderName}
                onChange={(e) => setTargetFolderName(e.target.value)}
                placeholder="e.g. Pictures or Cleaned Files"
                className="w-full pl-9 pr-3 py-2 rounded-lg text-xs sm:text-sm font-medium bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-xs"
              />
            </div>

            {existingFolders.length > 0 && (
              <div className="shrink-0">
                <select
                  id="select-existing-folder"
                  aria-label="Select existing folder"
                  onChange={(e) => {
                    if (e.target.value) setTargetFolderName(e.target.value);
                  }}
                  defaultValue=""
                  className="px-2.5 py-2 rounded-lg text-xs bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                >
                  <option value="" disabled>
                    Or pick existing folder...
                  </option>
                  {existingFolders.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Quick preset chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-neutral-400 dark:text-neutral-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Presets:
            </span>
            {quickPresets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setTargetFolderName(preset.value)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  targetFolderName.toLowerCase() === preset.value.toLowerCase()
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Button: Execute Move */}
        <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            id="btn-organize-files"
            type="button"
            disabled={selectedCount === 0 || !cleanTarget || isExecuting}
            onClick={onExecuteMove}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all shadow-md ${
              selectedCount === 0 || !cleanTarget || isExecuting
                ? 'bg-neutral-300 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-600 cursor-not-allowed shadow-none'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white shadow-blue-500/20'
            }`}
          >
            <FolderPlus className="w-4 h-4" />
            <span>
              {isExecuting
                ? 'Organizing Files...'
                : selectedCount === 0
                ? 'Select Files to Organize'
                : `Organize ${selectedCount} ${selectedCount === 1 ? 'Item' : 'Items'} into Folder`}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

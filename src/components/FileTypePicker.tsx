import React, { useState } from 'react';
import {
  Image,
  FileText,
  ExternalLink,
  Cpu,
  Archive,
  Video,
  Music,
  Code2,
  Layers,
  Filter,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { FileCategoryKey, DesktopItem } from '../types';
import { FILE_CATEGORIES } from '../data/fileTypes';
import { formatBytes } from '../utils/fileSystem';

interface FileTypePickerProps {
  selectedCategory: FileCategoryKey;
  onSelectCategory: (category: FileCategoryKey, customExts?: string[]) => void;
  items: DesktopItem[];
  customExtensions: string[];
  setCustomExtensions: (exts: string[]) => void;
}

export const FileTypePicker: React.FC<FileTypePickerProps> = ({
  selectedCategory,
  onSelectCategory,
  items,
  customExtensions,
  setCustomExtensions,
}) => {
  const [customInput, setCustomInput] = useState(customExtensions.join(', '));

  // Calculate items count and total size per category for root desktop items
  const categoryStats = React.useMemo(() => {
    const rootItems = items.filter((i) => !i.folderPath || i.folderPath === '');
    const stats: Record<string, { count: number; totalSize: number }> = {
      all: { count: rootItems.length, totalSize: rootItems.reduce((acc, i) => acc + i.size, 0) },
    };

    for (const cat of FILE_CATEGORIES) {
      const matching = rootItems.filter((i) => i.category === cat.id);
      stats[cat.id] = {
        count: matching.length,
        totalSize: matching.reduce((acc, i) => acc + i.size, 0),
      };
    }

    // Custom
    if (customExtensions.length > 0) {
      const customMatching = rootItems.filter((i) =>
        customExtensions.includes(i.extension.toLowerCase())
      );
      stats['custom'] = {
        count: customMatching.length,
        totalSize: customMatching.reduce((acc, i) => acc + i.size, 0),
      };
    } else {
      stats['custom'] = { count: 0, totalSize: 0 };
    }

    return stats;
  }, [items, customExtensions]);

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Image':
        return <Image className="w-4 h-4" />;
      case 'FileText':
        return <FileText className="w-4 h-4" />;
      case 'ExternalLink':
        return <ExternalLink className="w-4 h-4" />;
      case 'Cpu':
        return <Cpu className="w-4 h-4" />;
      case 'Archive':
        return <Archive className="w-4 h-4" />;
      case 'Video':
        return <Video className="w-4 h-4" />;
      case 'Music':
        return <Music className="w-4 h-4" />;
      case 'Code2':
        return <Code2 className="w-4 h-4" />;
      default:
        return <Layers className="w-4 h-4" />;
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = customInput
      .split(',')
      .map((s) => s.trim().replace(/^\./, '').toLowerCase())
      .filter(Boolean);
    setCustomExtensions(parsed);
    onSelectCategory('custom', parsed);
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 p-4 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            <span>Step 1</span>
            <span className="text-neutral-300 dark:text-neutral-700">•</span>
            <span className="text-neutral-700 dark:text-neutral-300">Pick the File Type</span>
          </div>
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5">
            Which items would you like to organize from your desktop?
          </h2>
        </div>
        <div className="text-xs text-neutral-500 dark:text-neutral-400">
          Selecting a type will automatically highlight all matching items
        </div>
      </div>

      {/* Grid of File Type Categories */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {/* All Files Option */}
        <button
          id="cat-all"
          type="button"
          onClick={() => onSelectCategory('all')}
          className={`relative text-left p-2.5 rounded-lg border transition-all ${
            selectedCategory === 'all'
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20 shadow-xs'
              : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-7 h-7 rounded-md bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            {selectedCategory === 'all' && (
              <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            )}
          </div>
          <div className="mt-2 font-medium text-xs text-neutral-900 dark:text-neutral-100">
            All Desktop Files
          </div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 flex items-center justify-between">
            <span>{categoryStats['all']?.count || 0} items</span>
            <span className="font-mono">{formatBytes(categoryStats['all']?.totalSize || 0)}</span>
          </div>
        </button>

        {/* Categories */}
        {FILE_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const stats = categoryStats[cat.id] || { count: 0, totalSize: 0 };
          return (
            <button
              id={`cat-${cat.id}`}
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`relative text-left p-2.5 rounded-lg border transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20 shadow-xs'
                  : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-7 h-7 rounded-md flex items-center justify-center ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  {getCategoryIcon(cat.iconName)}
                </div>
                {isSelected && (
                  <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <div className="mt-2 font-medium text-xs text-neutral-900 dark:text-neutral-100 truncate">
                {cat.name}
              </div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 flex items-center justify-between">
                <span className={stats.count > 0 ? 'font-semibold text-neutral-700 dark:text-neutral-300' : ''}>
                  {stats.count} {stats.count === 1 ? 'file' : 'files'}
                </span>
                <span className="font-mono text-[10px]">
                  {stats.count > 0 ? formatBytes(stats.totalSize) : '0 B'}
                </span>
              </div>
            </button>
          );
        })}

        {/* Custom Extensions Tile */}
        <button
          id="cat-custom"
          type="button"
          onClick={() => onSelectCategory('custom', customExtensions)}
          className={`relative text-left p-2.5 rounded-lg border transition-all ${
            selectedCategory === 'custom'
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20 shadow-xs'
              : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <div
              className={`w-7 h-7 rounded-md flex items-center justify-center ${
                selectedCategory === 'custom'
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
              }`}
            >
              <Filter className="w-4 h-4" />
            </div>
            {selectedCategory === 'custom' && (
              <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            )}
          </div>
          <div className="mt-2 font-medium text-xs text-neutral-900 dark:text-neutral-100">
            Custom Extension
          </div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 flex items-center justify-between">
            <span>{categoryStats['custom']?.count || 0} files</span>
            <span className="font-mono text-[10px]">
              {categoryStats['custom']?.count ? formatBytes(categoryStats['custom'].totalSize) : ''}
            </span>
          </div>
        </button>
      </div>

      {/* Custom Extension Input Bar (expanded when 'custom' is active) */}
      {selectedCategory === 'custom' && (
        <form
          onSubmit={handleCustomSubmit}
          className="mt-3 p-3 rounded-lg bg-neutral-100/80 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 flex flex-col sm:flex-row sm:items-center gap-2"
        >
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 shrink-0">
              Filter by extension(s):
            </span>
            <input
              id="input-custom-extensions"
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="e.g. psd, ai, torrent, log, figma"
              className="flex-1 px-3 py-1.5 rounded-md text-xs bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            id="btn-apply-custom-ext"
            type="submit"
            className="px-3 py-1.5 rounded-md text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Apply Extension Filter
          </button>
        </form>
      )}
    </div>
  );
};

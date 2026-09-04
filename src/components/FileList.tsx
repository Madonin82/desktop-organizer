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
  File,
  Search,
  CheckSquare,
  Square,
  Check,
  Folder,
} from 'lucide-react';
import { DesktopItem, FileCategoryKey } from '../types';
import { formatBytes } from '../utils/fileSystem';

interface FileListProps {
  items: DesktopItem[];
  selectedCategory: FileCategoryKey;
  onToggleItem: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export const FileList: React.FC<FileListProps> = ({
  items,
  selectedCategory,
  onToggleItem,
  onSelectAll,
  onDeselectAll,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter items that belong to the root desktop
  const desktopItems = items.filter((i) => !i.folderPath || i.folderPath === '');

  // Filter by search term
  const displayedItems = desktopItems.filter((item) => {
    if (!searchTerm) return true;
    return item.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const selectedCount = displayedItems.filter((i) => i.selected).length;
  const totalSelectedSize = displayedItems
    .filter((i) => i.selected)
    .reduce((acc, curr) => acc + curr.size, 0);

  const getFileIcon = (item: DesktopItem) => {
    switch (item.iconType) {
      case 'image':
        return <Image className="w-4 h-4 text-blue-500" />;
      case 'pdf':
        return <FileText className="w-4 h-4 text-red-500" />;
      case 'doc':
        return <FileText className="w-4 h-4 text-amber-500" />;
      case 'shortcut':
        return (
          <div className="relative">
            <ExternalLink className="w-4 h-4 text-sky-500" />
            <span className="absolute -bottom-1 -left-1 text-[8px] font-bold text-sky-600 bg-sky-100 rounded-xs px-0.5">
              ↗
            </span>
          </div>
        );
      case 'exe':
        return <Cpu className="w-4 h-4 text-emerald-500" />;
      case 'zip':
        return <Archive className="w-4 h-4 text-purple-500" />;
      case 'video':
        return <Video className="w-4 h-4 text-rose-500" />;
      case 'audio':
        return <Music className="w-4 h-4 text-violet-500" />;
      case 'code':
        return <Code2 className="w-4 h-4 text-teal-500" />;
      default:
        return <File className="w-4 h-4 text-neutral-400" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-neutral-900 transition-colors">
      {/* List Toolbar */}
      <div className="p-3 sm:p-4 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-50/70 dark:bg-neutral-900/70">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              <span>Step 2</span>
              <span className="text-neutral-300 dark:text-neutral-700">•</span>
              <span className="text-neutral-700 dark:text-neutral-300">Selected Items</span>
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {selectedCount} of {displayedItems.length} items selected
              </span>
              {selectedCount > 0 && (
                <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                  ({formatBytes(totalSelectedSize)})
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Selection Buttons */}
          <button
            id="btn-select-all"
            type="button"
            onClick={onSelectAll}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
          >
            <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
            <span>Select All</span>
          </button>

          <button
            id="btn-deselect-all"
            type="button"
            onClick={onDeselectAll}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
          >
            <Square className="w-3.5 h-3.5 text-neutral-400" />
            <span>Clear</span>
          </button>

          {/* Search bar */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              id="input-search-files"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search file name..."
              className="w-full pl-8 pr-2.5 py-1 rounded text-xs bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Items Scrollable Table */}
      <div className="flex-1 overflow-y-auto min-h-[220px] max-h-[360px]">
        {displayedItems.length === 0 ? (
          <div className="p-12 text-center text-neutral-400">
            <Folder className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              No matching files on Desktop
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              Select another file type above or reset the demo to populate items.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-neutral-100 dark:bg-neutral-800/90 backdrop-blur-xs text-neutral-500 dark:text-neutral-400 font-medium border-b border-neutral-200 dark:border-neutral-800 select-none z-10">
              <tr>
                <th className="w-10 px-3 py-2 text-center">
                  <span className="sr-only">Select</span>
                </th>
                <th className="px-3 py-2">Name</th>
                <th className="w-24 px-3 py-2">Type</th>
                <th className="w-24 px-3 py-2 text-right">Size</th>
                <th className="w-36 px-3 py-2 hidden sm:table-cell">Modified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
              {displayedItems.map((item) => {
                const isSelected = !!item.selected;
                return (
                  <tr
                    key={item.id}
                    onClick={() => onToggleItem(item.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50/60 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/30'
                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                    }`}
                  >
                    {/* Checkbox column */}
                    <td className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => onToggleItem(item.id)}
                        className={`w-4 h-4 rounded-xs border flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 hover:border-neutral-400'
                        }`}
                        aria-label={`Select ${item.name}`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>
                    </td>

                    {/* File icon + name */}
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2 max-w-[280px] sm:max-w-md truncate">
                        <div className="shrink-0">{getFileIcon(item)}</div>
                        <span
                          className={`truncate font-medium ${
                            isSelected
                              ? 'text-blue-950 dark:text-blue-200'
                              : 'text-neutral-800 dark:text-neutral-200'
                          }`}
                          title={item.name}
                        >
                          {item.name}
                        </span>
                      </div>
                    </td>

                    {/* Extension pill */}
                    <td className="px-3 py-2">
                      <span className="uppercase font-mono text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                        .{item.extension || 'file'}
                      </span>
                    </td>

                    {/* File Size */}
                    <td className="px-3 py-2 text-right font-mono text-neutral-500 dark:text-neutral-400">
                      {formatBytes(item.size)}
                    </td>

                    {/* Date Modified */}
                    <td className="px-3 py-2 hidden sm:table-cell text-neutral-400 font-mono text-[11px]">
                      {item.modifiedAt}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

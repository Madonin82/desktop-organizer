import React, { useState } from 'react';
import {
  Folder,
  Trash2,
  Image,
  FileText,
  ExternalLink,
  Cpu,
  Archive,
  Video,
  Music,
  Code2,
  File,
  Sparkles,
  ArrowLeft,
  X,
} from 'lucide-react';
import { DesktopItem } from '../types';
import { formatBytes } from '../utils/fileSystem';

interface DesktopViewProps {
  items: DesktopItem[];
  folders: string[];
  currentFolderName?: string;
  onOpenOrganizer: () => void;
}

export const DesktopView: React.FC<DesktopViewProps> = ({
  items,
  folders,
  currentFolderName = 'Desktop',
  onOpenOrganizer,
}) => {
  const [openedFolder, setOpenedFolder] = useState<string | null>(null);

  // Separate root items and folder items
  const rootItems = items.filter((i) => !i.folderPath || i.folderPath === '');

  const getFolderItemCount = (folderName: string) => {
    return items.filter((i) => i.folderPath === folderName).length;
  };

  const getFileIcon = (item: DesktopItem) => {
    switch (item.iconType) {
      case 'image':
        return (
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shadow-xs">
            <Image className="w-5 h-5" />
          </div>
        );
      case 'pdf':
        return (
          <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shadow-xs">
            <FileText className="w-5 h-5" />
          </div>
        );
      case 'doc':
        return (
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-xs">
            <FileText className="w-5 h-5" />
          </div>
        );
      case 'shortcut':
        return (
          <div className="relative w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-500 shadow-xs">
            <ExternalLink className="w-5 h-5" />
            <span className="absolute bottom-0 left-0 bg-white dark:bg-neutral-800 border border-sky-400 rounded-[2px] text-[7px] font-bold text-sky-600 px-0.5 leading-none">
              ↗
            </span>
          </div>
        );
      case 'exe':
        return (
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-xs">
            <Cpu className="w-5 h-5" />
          </div>
        );
      case 'zip':
        return (
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 shadow-xs">
            <Archive className="w-5 h-5" />
          </div>
        );
      case 'video':
        return (
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shadow-xs">
            <Video className="w-5 h-5" />
          </div>
        );
      case 'audio':
        return (
          <div className="w-10 h-10 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-500 shadow-xs">
            <Music className="w-5 h-5" />
          </div>
        );
      case 'code':
        return (
          <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-500 shadow-xs">
            <Code2 className="w-5 h-5" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-lg bg-neutral-500/10 border border-neutral-500/20 flex items-center justify-center text-neutral-400 shadow-xs">
            <File className="w-5 h-5" />
          </div>
        );
    }
  };

  return (
    <div className="relative flex-1 flex flex-col min-h-0 bg-neutral-900 overflow-hidden select-none">
      {/* Windows 11 Desktop Wallpaper Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950/80 to-neutral-950 opacity-95">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Top Desktop Bar */}
      <div className="relative z-10 px-4 py-2 bg-black/40 backdrop-blur-md border-b border-white/10 flex items-center justify-between text-xs text-white">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white/90">{currentFolderName} Visual Explorer</span>
          <span className="text-white/40">•</span>
          <span className="text-white/70">
            {rootItems.length} loose files in {currentFolderName} • {folders.length} organized folders
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenOrganizer}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Organize Loose Files</span>
        </button>
      </div>

      {/* Desktop Grid Canvas */}
      <div className="relative z-10 flex-1 p-6 overflow-y-auto">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 sm:gap-6 auto-rows-max">
          {/* Recycle Bin (System Icon) */}
          <div className="group flex flex-col items-center text-center cursor-default p-2 rounded-lg hover:bg-white/10 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-neutral-700/60 border border-white/20 flex items-center justify-center text-white/80 shadow-md">
              <Trash2 className="w-5 h-5 text-neutral-300" />
            </div>
            <span className="mt-1.5 text-[11px] font-medium text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] truncate max-w-[80px]">
              Recycle Bin
            </span>
          </div>

          {/* User Created Folders on Desktop */}
          {folders.map((folderName) => {
            const count = getFolderItemCount(folderName);
            return (
              <button
                key={folderName}
                type="button"
                onClick={() => setOpenedFolder(folderName)}
                className="group flex flex-col items-center text-center p-2 rounded-lg hover:bg-white/15 focus:bg-white/20 transition-all focus:outline-hidden"
              >
                <div className="relative w-10 h-10 rounded-lg bg-amber-400/90 border border-amber-300 flex items-center justify-center text-amber-900 shadow-md group-hover:scale-105 transition-transform">
                  <Folder className="w-6 h-6 fill-amber-300 text-amber-700" />
                  <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-white shadow-xs">
                    {count}
                  </span>
                </div>
                <span className="mt-1.5 text-[11px] font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] truncate max-w-[84px]">
                  {folderName}
                </span>
                <span className="text-[9px] text-white/60">
                  {count} {count === 1 ? 'file' : 'files'}
                </span>
              </button>
            );
          })}

          {/* Root Desktop Files */}
          {rootItems.map((item) => (
            <div
              key={item.id}
              className="group flex flex-col items-center text-center p-2 rounded-lg hover:bg-white/10 transition-all cursor-default"
              title={`${item.name} (${formatBytes(item.size)})`}
            >
              <div className="group-hover:scale-105 transition-transform">
                {getFileIcon(item)}
              </div>
              <span className="mt-1.5 text-[11px] font-normal text-white/95 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] truncate max-w-[84px] leading-tight">
                {item.name}
              </span>
              <span className="text-[9px] font-mono text-white/60">
                {formatBytes(item.size)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Folder Contents Mini-Explorer Modal */}
      {openedFolder && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-neutral-900 border border-white/20 rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden text-white animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-4 py-3 bg-neutral-800/80 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Folder className="w-5 h-5 text-amber-400 fill-amber-400/30" />
                <div>
                  <h4 className="font-semibold text-sm">Desktop\{openedFolder}</h4>
                  <p className="text-[11px] text-white/50">
                    {getFolderItemCount(openedFolder)} organized items inside
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpenedFolder(null)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Folder Files List */}
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-white/5">
              {items
                .filter((i) => i.folderPath === openedFolder)
                .map((item) => (
                  <div
                    key={item.id}
                    className="py-2 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      {getFileIcon(item)}
                      <span className="truncate font-medium text-white/90">{item.name}</span>
                    </div>
                    <div className="shrink-0 flex items-center gap-3 font-mono text-white/50 text-[11px]">
                      <span>{formatBytes(item.size)}</span>
                      <span className="hidden sm:inline">{item.modifiedAt}</span>
                    </div>
                  </div>
                ))}
            </div>

            <div className="p-3 bg-neutral-800/50 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setOpenedFolder(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                Close Folder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

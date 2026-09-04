import React, { useRef } from 'react';
import {
  FolderOpen,
  Laptop,
  RotateCcw,
  ExternalLink,
  FolderTree,
  AlertCircle,
  FolderGit2,
} from 'lucide-react';
import { isFileSystemAccessSupported, pickRealDirectory } from '../utils/fileSystem';
import { DesktopItem } from '../types';
import { detectCategory } from '../data/fileTypes';

interface SourceFolderSelectorProps {
  currentFolderName: string;
  isRealFolder: boolean;
  onDirectoryLoaded: (items: DesktopItem[], folderName: string, dirHandle?: FileSystemDirectoryHandle) => void;
  onResetToMock: () => void;
  unorganizedCount: number;
  includeSubfolders: boolean;
  onToggleSubfolders: (val: boolean) => void;
}

export const SourceFolderSelector: React.FC<SourceFolderSelectorProps> = ({
  currentFolderName,
  isRealFolder,
  onDirectoryLoaded,
  onResetToMock,
  unorganizedCount,
  includeSubfolders,
  onToggleSubfolders,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handlePickDirectory = async () => {
    setErrorMessage(null);
    try {
      const { directoryHandle, folderName, items } = await pickRealDirectory(includeSubfolders);
      onDirectoryLoaded(items, folderName, directoryHandle);
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          return;
        }
        if (err.name === 'SecurityError') {
          setErrorMessage(
            'Browser security prevented direct folder access inside the preview iframe. Please open the app in a new tab, use "Browse Folder", or run the native Organizer-Desktop-App.bat!'
          );
        } else {
          setErrorMessage(err.message || 'Failed to open directory');
        }
      }
    }
  };

  const handleFallbackFolderUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const items: DesktopItem[] = [];
    const rootName = files[0].webkitRelativePath.split('/')[0] || 'TargetFolder';

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const parts = file.webkitRelativePath.split('/');
      
      // If not including subfolders, only take top-level files (parts.length <= 2)
      if (!includeSubfolders && parts.length > 2) {
        continue;
      }

      // Calculate relative folder path inside root
      const relParts = parts.slice(1, -1);
      const folderPath = relParts.join('/');

      const extMatch = file.name.match(/\.([^.]+)$/);
      const ext = extMatch ? extMatch[1].toLowerCase() : '';
      const category = detectCategory(ext);

      items.push({
        id: `upload-${file.webkitRelativePath}-${file.lastModified}-${i}`,
        name: file.name,
        extension: ext,
        size: file.size,
        modifiedAt: new Date(file.lastModified).toISOString().slice(0, 16).replace('T', ' '),
        category,
        folderPath: folderPath,
        selected: false,
        iconType:
          category === 'images'
            ? 'image'
            : category === 'documents'
            ? ext === 'pdf'
              ? 'pdf'
              : 'doc'
            : 'generic',
      });
    }

    onDirectoryLoaded(items, rootName);
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 p-3 sm:p-4 transition-colors">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Current Folder Path indicator */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
            {isRealFolder ? <FolderTree className="w-5 h-5" /> : <FolderGit2 className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-neutral-400 dark:text-neutral-500">
                Target Folder Location
              </span>
              <span
                className={`inline-flex items-center px-1.5 py-0.2 rounded text-[11px] font-medium ${
                  isRealFolder
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300'
                }`}
              >
                {isRealFolder ? 'Connected Local Directory' : 'Targeting Parent Folder (1 level up)'}
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10.5px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                🛡️ App Folder Excluded
              </span>
            </div>
            <div className="flex flex-wrap items-baseline gap-2 mt-0.5">
              <span className="font-semibold text-sm sm:text-base text-neutral-900 dark:text-neutral-100">
                {isRealFolder
                  ? `C:\\...\\${currentFolderName}`
                  : `C:\\clean these up\\`}
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                ({unorganizedCount} files in parent & subfolders)
              </span>
            </div>
          </div>
        </div>

        {/* Options & Action buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Subfolder recursive toggle */}
          <label className="inline-flex items-center gap-2 cursor-pointer px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-300 select-none">
            <input
              type="checkbox"
              checked={includeSubfolders}
              onChange={(e) => onToggleSubfolders(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-neutral-300 dark:border-neutral-600"
            />
            <span>Scan Sub-folders</span>
          </label>

          {isFileSystemAccessSupported() && (
            <button
              id="btn-pick-native-folder"
              type="button"
              onClick={handlePickDirectory}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors shadow-xs"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Select Any Folder...</span>
            </button>
          )}

          {/* Hidden File Input for Folder Selection fallback */}
          <input
            ref={fileInputRef}
            type="file"
            {...({ webkitdirectory: '', directory: '' } as React.InputHTMLAttributes<HTMLInputElement>)}
            multiple
            onChange={handleFallbackFolderUpload}
            className="hidden"
          />

          <button
            id="btn-upload-folder-fallback"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 transition-colors"
            title="Browse any folder on your computer"
          >
            <FolderOpen className="w-3.5 h-3.5 text-neutral-500" />
            <span>Browse Folder...</span>
          </button>

          <button
            id="btn-reset-sample"
            type="button"
            onClick={onResetToMock}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title="Reset to sample files with sub-folders"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>

      {/* Error / Security Info banner */}
      {errorMessage && (
        <div className="mt-3 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-2 text-xs text-red-700 dark:text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
          <div className="flex-1">
            <p>{errorMessage}</p>
            <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">
              You can also run <code>Organizer-Desktop-App.bat</code> directly in any folder on your PC for 100% native Windows organization!
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.open(window.location.href, '_blank')}
            className="inline-flex items-center gap-1 underline font-medium shrink-0 hover:text-red-800 dark:hover:text-red-200"
          >
            <span>Open in New Tab</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};

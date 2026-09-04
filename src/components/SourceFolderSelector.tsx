import React, { useRef, useState } from 'react';
import {
  FolderOpen,
  Laptop,
  RotateCcw,
  ExternalLink,
  FolderTree,
  AlertCircle,
  FolderSearch,
  CheckCircle2,
  HardDrive,
  Sparkles,
} from 'lucide-react';
import { isFileSystemAccessSupported, pickRealDirectory } from '../utils/fileSystem';
import { DesktopItem } from '../types';
import { detectCategory } from '../data/fileTypes';

interface SourceFolderSelectorProps {
  currentFolderName: string;
  currentFolderPath: string;
  setCurrentFolderPath: (path: string) => void;
  isRealFolder: boolean;
  onDirectoryLoaded: (items: DesktopItem[], folderName: string, dirHandle?: FileSystemDirectoryHandle, fullPath?: string) => void;
  onResetToMock: (presetKey?: string) => void;
  unorganizedCount: number;
}

export const SourceFolderSelector: React.FC<SourceFolderSelectorProps> = ({
  currentFolderName,
  currentFolderPath,
  setCurrentFolderPath,
  isRealFolder,
  onDirectoryLoaded,
  onResetToMock,
  unorganizedCount,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isEditingPath, setIsEditingPath] = useState<boolean>(false);
  const [tempPath, setTempPath] = useState<string>(currentFolderPath);

  const quickLocations = [
    { label: 'Desktop', path: 'C:\\Users\\User\\Desktop', folderName: 'Desktop' },
    { label: 'Downloads', path: 'C:\\Users\\User\\Downloads', folderName: 'Downloads' },
    { label: 'Documents', path: 'C:\\Users\\User\\Documents', folderName: 'Documents' },
  ];

  const handlePickDirectory = async (hint?: 'desktop' | 'downloads' | 'documents' | 'pictures') => {
    setErrorMessage(null);
    try {
      const { directoryHandle, folderName, items } = await pickRealDirectory(hint);
      const computedPath = `C:\\Users\\...\\${folderName}`;
      setCurrentFolderPath(computedPath);
      onDirectoryLoaded(items, folderName, directoryHandle, computedPath);
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          return;
        }
        if (err.name === 'SecurityError') {
          setErrorMessage(
            'Browser sandbox restricted directory access in this iframe. Click "Open in New Tab" to grant permission, or use "Browse Folder" to select any directory.'
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
    const rootName = files[0].webkitRelativePath.split('/')[0] || 'Selected Folder';

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const parts = file.webkitRelativePath.split('/');
      // Top-level files in this scanned directory
      if (parts.length <= 2) {
        const extMatch = file.name.match(/\.([^.]+)$/);
        const ext = extMatch ? extMatch[1].toLowerCase() : '';
        const category = detectCategory(ext);

        items.push({
          id: `upload-${file.name}-${file.lastModified}-${i}`,
          name: file.name,
          extension: ext,
          size: file.size,
          modifiedAt: new Date(file.lastModified).toISOString().slice(0, 16).replace('T', ' '),
          category,
          folderPath: '',
          selected: false,
          iconType:
            category === 'images'
              ? 'image'
              : category === 'documents'
              ? 'doc'
              : category === 'executables'
              ? 'exe'
              : category === 'archives'
              ? 'zip'
              : 'generic',
        });
      }
    }

    const path = `C:\\Users\\...\\${rootName}`;
    setCurrentFolderPath(path);
    onDirectoryLoaded(items, rootName, undefined, path);
  };

  const handleQuickPreset = (loc: typeof quickLocations[0]) => {
    setCurrentFolderPath(loc.path);
    onResetToMock(loc.folderName);
  };

  const handleApplyCustomPath = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = tempPath.trim();
    if (!clean) return;
    setCurrentFolderPath(clean);
    setIsEditingPath(false);
    // Extract base folder name from path
    const parts = clean.split(/[\\/]/).filter(Boolean);
    const folderName = parts.length > 0 ? parts[parts.length - 1] : clean;
    onResetToMock(folderName);
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 p-3 sm:p-4 transition-colors">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Active Source Location Details */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
            {isRealFolder ? <HardDrive className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-neutral-400 dark:text-neutral-500">
                Directory to Scan
              </span>
              <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium ${
                  isRealFolder
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300'
                }`}
              >
                {isRealFolder ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    Connected Local Folder
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" />
                    Interactive Sandbox
                  </>
                )}
              </span>
            </div>

            {/* Editable or clickable path display */}
            <div className="flex items-center gap-2 mt-0.5">
              {isEditingPath ? (
                <form onSubmit={handleApplyCustomPath} className="flex items-center gap-2">
                  <input
                    id="input-source-directory-path"
                    type="text"
                    value={tempPath}
                    onChange={(e) => setTempPath(e.target.value)}
                    placeholder="e.g. C:\Users\YourName\Downloads or D:\Projects"
                    autoFocus
                    className="px-2 py-1 text-xs sm:text-sm font-semibold rounded border border-blue-400 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 w-64 sm:w-80 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-2 py-1 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Set
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTempPath(currentFolderPath);
                      setIsEditingPath(false);
                    }}
                    className="px-2 py-1 text-xs font-medium rounded text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <div className="flex flex-wrap items-baseline gap-2">
                  <span
                    onClick={() => {
                      setTempPath(currentFolderPath);
                      setIsEditingPath(true);
                    }}
                    className="font-semibold text-sm sm:text-base text-neutral-900 dark:text-neutral-100 cursor-pointer hover:underline hover:text-blue-600 dark:hover:text-blue-400 truncate max-w-xs sm:max-w-md"
                    title="Click to type any custom directory path"
                  >
                    {currentFolderPath || `C:\\Users\\User\\${currentFolderName}`}
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                    ({unorganizedCount} loose {unorganizedCount === 1 ? 'file' : 'files'} to scan)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons: Pick any directory */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Native Folder Picker Button */}
          {isFileSystemAccessSupported() && (
            <button
              id="btn-pick-native-folder"
              type="button"
              onClick={() => handlePickDirectory()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors shadow-xs"
              title="Open folder picker to scan any folder on your computer (Desktop, Downloads, Documents, etc.)"
            >
              <FolderSearch className="w-3.5 h-3.5" />
              <span>Select Any Directory to Scan...</span>
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
            title="Select any directory via file selector"
          >
            <FolderOpen className="w-3.5 h-3.5 text-neutral-500" />
            <span>Browse Folder...</span>
          </button>

          {/* Quick presets for common folders */}
          <div className="hidden sm:flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5 border border-neutral-200 dark:border-neutral-700">
            {quickLocations.map((loc) => (
              <button
                key={loc.label}
                type="button"
                onClick={() => handleQuickPreset(loc)}
                className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors ${
                  currentFolderName.toLowerCase() === loc.folderName.toLowerCase()
                    ? 'bg-white dark:bg-neutral-700 text-blue-600 dark:text-blue-300 shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
                title={`Target ${loc.label} folder`}
              >
                {loc.label}
              </button>
            ))}
          </div>

          <button
            id="btn-reset-sample"
            type="button"
            onClick={() => onResetToMock()}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title="Reset to sample files"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Error / Sandbox Info banner */}
      {errorMessage && (
        <div className="mt-3 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-2 text-xs text-red-700 dark:text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
          <div className="flex-1">
            <p>{errorMessage}</p>
            <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">
              You can also use "Browse Folder...", or download the 1-Click Windows Batch/PowerShell script to organize any directory directly on your PC!
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

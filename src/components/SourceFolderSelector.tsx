import React, { useRef } from 'react';
import {
  FolderOpen,
  Laptop,
  RotateCcw,
  ExternalLink,
  FolderTree,
  AlertCircle,
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
}

export const SourceFolderSelector: React.FC<SourceFolderSelectorProps> = ({
  currentFolderName,
  isRealFolder,
  onDirectoryLoaded,
  onResetToMock,
  unorganizedCount,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handlePickDirectory = async () => {
    setErrorMessage(null);
    try {
      const { directoryHandle, folderName, items } = await pickRealDirectory();
      onDirectoryLoaded(items, folderName, directoryHandle);
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          // User canceled the directory picker, no error needed
          return;
        }
        if (err.name === 'SecurityError') {
          setErrorMessage('Browser security prevented folder access inside preview iframe. Please open the app in a new tab or use the folder upload fallback.');
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
    const rootName = files[0].webkitRelativePath.split('/')[0] || 'Desktop';

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Only take top-level files from the selected desktop folder
      const parts = file.webkitRelativePath.split('/');
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
          iconType: category === 'images' ? 'image' : category === 'documents' ? 'doc' : 'generic',
        });
      }
    }

    onDirectoryLoaded(items, rootName);
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 p-3 sm:p-4 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Current Folder Path indicator */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
            {isRealFolder ? <FolderTree className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-neutral-400 dark:text-neutral-500">
                Active Source Location
              </span>
              <span
                className={`inline-flex items-center px-1.5 py-0.2 rounded text-[11px] font-medium ${
                  isRealFolder
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300'
                }`}
              >
                {isRealFolder ? 'Connected to Local PC' : 'Interactive Desktop Sandbox'}
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="font-semibold text-sm sm:text-base text-neutral-900 dark:text-neutral-100">
                {isRealFolder ? `C:\\Users\\...\\${currentFolderName}` : 'C:\\Users\\User\\Desktop'}
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                ({unorganizedCount} items on desktop)
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons to choose folder */}
        <div className="flex flex-wrap items-center gap-2">
          {isFileSystemAccessSupported() && (
            <button
              id="btn-pick-native-folder"
              type="button"
              onClick={handlePickDirectory}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors shadow-xs"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Select Real Desktop Folder</span>
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
            title="Select desktop folder via browser file selector"
          >
            <FolderOpen className="w-3.5 h-3.5 text-neutral-500" />
            <span>Browse Folder...</span>
          </button>

          <button
            id="btn-reset-sample"
            type="button"
            onClick={onResetToMock}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title="Load sample cluttered desktop items to test organization"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo</span>
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
              Tip: You can use the Interactive Desktop mode or the "Windows Script (.bat)" tab to organize desktop files on your computer with a single click!
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

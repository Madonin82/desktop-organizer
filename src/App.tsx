import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TitleBar } from './components/TitleBar';
import { FileTypePicker } from './components/FileTypePicker';
import { FileList } from './components/FileList';
import { TargetFolderPicker } from './components/TargetFolderPicker';
import { DesktopView } from './components/DesktopView';
import { WindowsScriptModal } from './components/WindowsScriptModal';
import { HistoryLog } from './components/HistoryLog';
import { ExecutionModal } from './components/ExecutionModal';
import { SourceFolderSelector } from './components/SourceFolderSelector';
import { DesktopItem, FileCategoryKey, MoveOperation, ViewMode } from './types';
import { INITIAL_MOCK_DESKTOP_ITEMS } from './data/mockDesktop';
import { FILE_CATEGORIES, getCategoryExtensions } from './data/fileTypes';
import { moveRealFile } from './utils/fileSystem';

export function App() {
  const [items, setItems] = useState<DesktopItem[]>(INITIAL_MOCK_DESKTOP_ITEMS);
  const [selectedCategory, setSelectedCategory] = useState<FileCategoryKey>('images');
  const [customExtensions, setCustomExtensions] = useState<string[]>([]);
  const [includeSubfolders, setIncludeSubfolders] = useState<boolean>(true);

  // Folder & Environment State
  const [currentFolderName, setCurrentFolderName] = useState<string>('clean these up');
  const [isRealFolder, setIsRealFolder] = useState<boolean>(false);
  const [rootDirHandle, setRootDirHandle] = useState<FileSystemDirectoryHandle | null>(null);

  // Destination Folder Name
  const [targetFolderName, setTargetFolderName] = useState<string>('Pictures');

  const [viewMode, setViewMode] = useState<ViewMode>('manager');
  const [operations, setOperations] = useState<MoveOperation[]>([]);

  // Dark/light mode
  const [isDark, setIsDark] = useState<boolean>(false);

  // Moving execution modal state
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [currentMovingFile, setCurrentMovingFile] = useState<string>('');
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [lastOperation, setLastOperation] = useState<MoveOperation | null>(null);

  // Synchronize dark mode class to document element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Existing target folders list
  const existingFolders = useMemo(() => {
    const folderSet = new Set<string>();
    items.forEach((item) => {
      if (item.destinationFolder) {
        folderSet.add(item.destinationFolder);
      } else if (item.folderPath && item.folderPath.trim() !== '') {
        folderSet.add(item.folderPath);
      }
    });
    return Array.from(folderSet);
  }, [items]);

  // Unorganized items count
  const unorganizedCount = useMemo(() => {
    return items.filter((i) => {
      if (i.destinationFolder || (i.folderPath && i.folderPath !== '')) return false;
      if (!includeSubfolders && i.sourceSubfolder) return false;
      return true;
    }).length;
  }, [items, includeSubfolders]);

  // Function to auto-select matching items based on category
  const selectMatchingCategoryItems = useCallback(
    (
      category: FileCategoryKey,
      exts: string[] = customExtensions,
      subfolders: boolean = includeSubfolders
    ) => {
      setItems((prev) =>
        prev.map((item) => {
          // Skip if already in a destination cleanup folder
          if (item.destinationFolder || (item.folderPath && item.folderPath !== '')) {
            return { ...item, selected: false };
          }

          // If subfolders disabled, skip items located in subfolders
          if (!subfolders && item.sourceSubfolder) {
            return { ...item, selected: false };
          }

          if (category === 'all') {
            return { ...item, selected: true };
          }

          if (category === 'custom') {
            const isMatch = exts.includes(item.extension.toLowerCase());
            return { ...item, selected: isMatch };
          }

          const catDef = FILE_CATEGORIES.find((c) => c.id === category);
          if (catDef) {
            const isMatch = catDef.extensions.includes(item.extension.toLowerCase());
            return { ...item, selected: isMatch };
          }

          return { ...item, selected: false };
        })
      );
    },
    [customExtensions, includeSubfolders]
  );

  // Initialize selection for default category on first load
  useEffect(() => {
    selectMatchingCategoryItems('images');
  }, []);

  // Handle toggle subfolders
  const handleToggleSubfolders = (val: boolean) => {
    setIncludeSubfolders(val);
    selectMatchingCategoryItems(selectedCategory, customExtensions, val);
  };

  // Handle category change: update selected category, suggested folder, and select all matching
  const handleSelectCategory = (category: FileCategoryKey, exts?: string[]) => {
    setSelectedCategory(category);
    if (exts) {
      setCustomExtensions(exts);
    }

    // Auto-update suggested target folder name based on category
    if (category === 'all') {
      setTargetFolderName('Cleaned Up Files');
    } else if (category === 'custom') {
      const label = exts && exts[0] ? exts[0].toUpperCase() : 'Custom';
      setTargetFolderName(`${label} Files`);
    } else {
      const cat = FILE_CATEGORIES.find((c) => c.id === category);
      if (cat) {
        setTargetFolderName(cat.defaultFolderName.replace(/^Desktop[\\/]/i, ''));
      }
    }

    // Auto-select all matching files ("I run the app, pic the file type, and it selects them all")
    selectMatchingCategoryItems(category, exts || customExtensions, includeSubfolders);
  };

  // Toggle individual item selection
  const handleToggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  // Select all unorganized items currently eligible
  const handleSelectAll = () => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.destinationFolder || (item.folderPath && item.folderPath !== '')) {
          return item;
        }
        if (!includeSubfolders && item.sourceSubfolder) {
          return item;
        }
        return { ...item, selected: true };
      })
    );
  };

  // Deselect all items
  const handleDeselectAll = () => {
    setItems((prev) => prev.map((item) => ({ ...item, selected: false })));
  };

  // Load real folder from File System Access API
  const handleDirectoryLoaded = (
    newItems: DesktopItem[],
    folderName: string,
    dirHandle?: FileSystemDirectoryHandle
  ) => {
    setItems(newItems);
    setCurrentFolderName(folderName);
    if (dirHandle) {
      setRootDirHandle(dirHandle);
      setIsRealFolder(true);
    } else {
      setRootDirHandle(null);
      setIsRealFolder(false);
    }
    // Re-apply current category selection on newly loaded items
    setTimeout(() => {
      selectMatchingCategoryItems(selectedCategory, customExtensions, includeSubfolders);
    }, 50);
  };

  // Reset to sample cluttered folder items
  const handleResetToMock = () => {
    setItems(INITIAL_MOCK_DESKTOP_ITEMS);
    setRootDirHandle(null);
    setIsRealFolder(false);
    setCurrentFolderName('Current Folder');
    setTimeout(() => {
      selectMatchingCategoryItems(selectedCategory, customExtensions, includeSubfolders);
    }, 50);
  };

  // Execute Move operation
  const handleExecuteMove = async () => {
    const selectedItems = items.filter(
      (i) =>
        i.selected &&
        !i.destinationFolder &&
        (!i.folderPath || i.folderPath === '') &&
        (includeSubfolders || !i.sourceSubfolder)
    );
    if (selectedItems.length === 0) return;

    const cleanFolder = targetFolderName.replace(/^[\\/]+|[\\/]+$/g, '');
    if (!cleanFolder) return;

    setIsExecuting(true);
    setIsModalOpen(true);
    setProgress(0);
    setIsCompleted(false);

    const sourceFilesLog: {
      id: string;
      name: string;
      originalFolder: string;
      newFolder: string;
    }[] = [];

    // Process moving sequentially with visual progress
    for (let index = 0; index < selectedItems.length; index++) {
      const item = selectedItems[index];
      setCurrentMovingFile(item.name);

      // If connected to real folder and has fileHandle, execute real move
      if (rootDirHandle && item.fileHandle) {
        try {
          await moveRealFile(
            rootDirHandle,
            item.fileHandle,
            cleanFolder,
            item.name,
            item.parentDirHandle
          );
        } catch (err) {
          console.error(`Failed to move file ${item.name}:`, err);
        }
      } else {
        // Virtual delay for smooth animation feedback
        await new Promise((res) => setTimeout(res, 60));
      }

      sourceFilesLog.push({
        id: item.id,
        name: item.name,
        originalFolder: item.sourceSubfolder || item.folderPath || '',
        newFolder: cleanFolder,
      });

      const currentProgress = ((index + 1) / selectedItems.length) * 100;
      setProgress(currentProgress);
    }

    // Update state to move files into the destination folder
    const selectedIds = new Set(selectedItems.map((i) => i.id));
    setItems((prev) =>
      prev.map((item) => {
        if (selectedIds.has(item.id)) {
          return {
            ...item,
            destinationFolder: cleanFolder,
            folderPath: cleanFolder,
            selected: false,
          };
        }
        return item;
      })
    );

    const operationRecord: MoveOperation = {
      id: `op-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      sourceFiles: sourceFilesLog,
      destinationFolder: cleanFolder,
      fileCount: selectedItems.length,
      category: selectedCategory,
    };

    setOperations((prev) => [operationRecord, ...prev]);
    setLastOperation(operationRecord);
    setIsCompleted(true);
    setIsExecuting(false);
  };

  // Undo an operation
  const handleUndoOperation = (operationId: string) => {
    const op = operations.find((o) => o.id === operationId);
    if (!op) return;

    const fileMap = new Map(op.sourceFiles.map((f) => [f.id, f.originalFolder]));

    setItems((prev) =>
      prev.map((item) => {
        if (fileMap.has(item.id)) {
          const originalSub = fileMap.get(item.id) || '';
          return {
            ...item,
            destinationFolder: undefined,
            folderPath: '',
            sourceSubfolder: originalSub,
            selected: false,
          };
        }
        return item;
      })
    );

    setOperations((prev) => prev.filter((o) => o.id !== operationId));
  };

  const selectedCount = useMemo(() => {
    return items.filter(
      (i) =>
        i.selected &&
        !i.destinationFolder &&
        (!i.folderPath || i.folderPath === '') &&
        (includeSubfolders || !i.sourceSubfolder)
    ).length;
  }, [items, includeSubfolders]);

  return (
    <div
      className={`flex flex-col h-screen w-screen overflow-hidden ${
        isDark ? 'dark bg-neutral-950 text-neutral-100' : 'bg-neutral-100 text-neutral-900'
      }`}
    >
      {/* Windows 11 Acrylic App Frame */}
      <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-neutral-900 shadow-2xl transition-colors">
        {/* Title Bar & Top Navigation */}
        <TitleBar
          viewMode={viewMode}
          setViewMode={setViewMode}
          isDark={isDark}
          setIsDark={setIsDark}
          totalItemsCount={items.length}
        />

        {/* Source Folder Header & Sub-folder toggle */}
        <SourceFolderSelector
          currentFolderName={currentFolderName}
          isRealFolder={isRealFolder}
          onDirectoryLoaded={handleDirectoryLoaded}
          onResetToMock={handleResetToMock}
          unorganizedCount={unorganizedCount}
          includeSubfolders={includeSubfolders}
          onToggleSubfolders={handleToggleSubfolders}
        />

        {/* Main Content Area based on active view mode */}
        {viewMode === 'manager' && (
          <main className="flex-1 flex flex-col min-h-0">
            {/* Step 1: File Type Picker */}
            <FileTypePicker
              selectedCategory={selectedCategory}
              onSelectCategory={handleSelectCategory}
              items={items}
              customExtensions={customExtensions}
              setCustomExtensions={setCustomExtensions}
            />

            {/* Step 2: Selected Files List (with sub-folder badges) */}
            <FileList
              items={items}
              selectedCategory={selectedCategory}
              onToggleItem={handleToggleItem}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              includeSubfolders={includeSubfolders}
            />

            {/* Step 3: Destination Folder & Organize Button */}
            <TargetFolderPicker
              targetFolderName={targetFolderName}
              setTargetFolderName={setTargetFolderName}
              selectedCategory={selectedCategory}
              selectedCount={selectedCount}
              existingFolders={existingFolders}
              onExecuteMove={handleExecuteMove}
              isExecuting={isExecuting}
              currentLocationName={currentFolderName}
            />
          </main>
        )}

        {viewMode === 'desktop' && (
          <DesktopView
            items={items}
            folders={existingFolders}
            onOpenOrganizer={() => setViewMode('manager')}
          />
        )}

        {viewMode === 'script' && (
          <WindowsScriptModal
            selectedCategory={selectedCategory}
            targetFolderName={targetFolderName}
            customExtensions={customExtensions}
          />
        )}

        {viewMode === 'history' && (
          <HistoryLog
            operations={operations}
            onUndoOperation={handleUndoOperation}
            onClearHistory={() => setOperations([])}
          />
        )}

        {/* Moving Execution Progress & Success Modal */}
        <ExecutionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          progress={progress}
          currentMovingFile={currentMovingFile}
          isCompleted={isCompleted}
          lastOperation={lastOperation}
          onUndo={() => {
            if (lastOperation) handleUndoOperation(lastOperation.id);
          }}
          onOpenDesktopView={() => setViewMode('desktop')}
        />
      </div>
    </div>
  );
}

export default App;

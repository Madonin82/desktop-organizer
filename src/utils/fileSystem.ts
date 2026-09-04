import { DesktopItem } from '../types';
import { detectCategory } from '../data/fileTypes';

export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const EXCLUDED_DIR_NAMES = new Set(['node_modules', '.git', 'src', 'public', 'dist']);
const EXCLUDED_FILE_NAMES = new Set([
  'organizer-desktop-app.bat',
  'organizer-desktop-app.ps1',
  'run.bat',
  'package.json',
  'package-lock.json',
  'bun.lock',
  'index.html',
  'vite.config.ts',
  'tsconfig.json',
  'metadata.json',
  'readme.md',
  '.gitignore',
  '.env.example',
]);

async function scanDirectoryEntries(
  dirHandle: FileSystemDirectoryHandle,
  relPath: string,
  includeSubfolders: boolean,
  collectedItems: DesktopItem[]
): Promise<void> {
  // @ts-expect-error - values() is async iterable in modern FileSystemDirectoryHandle
  for await (const entry of dirHandle.values()) {
    if (entry.kind === 'file') {
      const fileNameLower = entry.name.toLowerCase();
      if (EXCLUDED_FILE_NAMES.has(fileNameLower)) continue;

      const fileHandle = entry as FileSystemFileHandle;
      const file = await fileHandle.getFile();
      const extMatch = file.name.match(/\.([^.]+)$/);
      const ext = extMatch ? extMatch[1].toLowerCase() : '';
      const category = detectCategory(ext);

      let iconType: DesktopItem['iconType'] = 'generic';
      if (category === 'images') iconType = 'image';
      else if (category === 'documents') iconType = ext === 'pdf' ? 'pdf' : 'doc';
      else if (category === 'shortcuts') iconType = 'shortcut';
      else if (category === 'executables') iconType = 'exe';
      else if (category === 'archives') iconType = 'zip';
      else if (category === 'audio') iconType = 'audio';
      else if (category === 'video') iconType = 'video';
      else if (category === 'code') iconType = 'code';

      collectedItems.push({
        id: `real-${relPath ? relPath + '/' : ''}${file.name}-${file.lastModified}`,
        name: file.name,
        extension: ext,
        size: file.size,
        modifiedAt: new Date(file.lastModified).toISOString().slice(0, 16).replace('T', ' '),
        category,
        folderPath: relPath,
        selected: false,
        fileHandle,
        parentDirHandle: dirHandle,
        iconType,
      });
    } else if (entry.kind === 'directory' && includeSubfolders) {
      if (EXCLUDED_DIR_NAMES.has(entry.name.toLowerCase())) continue;
      const subDirHandle = entry as FileSystemDirectoryHandle;
      const subPath = relPath ? `${relPath}/${entry.name}` : entry.name;
      await scanDirectoryEntries(subDirHandle, subPath, includeSubfolders, collectedItems);
    }
  }
}

export async function pickRealDirectory(includeSubfolders = true): Promise<{
  directoryHandle: FileSystemDirectoryHandle;
  folderName: string;
  items: DesktopItem[];
}> {
  if (!isFileSystemAccessSupported()) {
    throw new Error('File System Access API is not supported in this browser. Please use Chrome or Edge.');
  }

  // @ts-expect-error - showDirectoryPicker is standard on Chromium
  const directoryHandle: FileSystemDirectoryHandle = await window.showDirectoryPicker({
    mode: 'readwrite',
    startIn: 'desktop',
  });

  const items: DesktopItem[] = [];
  await scanDirectoryEntries(directoryHandle, '', includeSubfolders, items);

  return {
    directoryHandle,
    folderName: directoryHandle.name,
    items,
  };
}

export async function moveRealFile(
  rootDirHandle: FileSystemDirectoryHandle,
  fileHandle: FileSystemFileHandle,
  destinationFolderName: string,
  fileName: string,
  parentDirHandle?: FileSystemDirectoryHandle
): Promise<void> {
  // Strip leading/trailing slashes or Desktop\ prefix if present
  const cleanFolderName = destinationFolderName.replace(/^Desktop[\\/]/i, '').replace(/^[\\/]+|[\\/]+$/g, '');
  
  // Get or create target directory inside root directory
  const targetDirHandle = await rootDirHandle.getDirectoryHandle(cleanFolderName, { create: true });

  // Modern move API (Chromium 111+)
  // @ts-expect-error - move method is supported in Chromium
  if (typeof fileHandle.move === 'function') {
    // @ts-expect-error - move method
    await fileHandle.move(targetDirHandle, fileName);
    return;
  }

  // Fallback: Copy content to target then remove from source parent directory
  const originalFile = await fileHandle.getFile();
  const newFileHandle = await targetDirHandle.getFileHandle(fileName, { create: true });
  const writable = await newFileHandle.createWritable();
  await writable.write(await originalFile.arrayBuffer());
  await writable.close();

  // Remove original entry from its container folder
  const sourceContainer = parentDirHandle || rootDirHandle;
  await sourceContainer.removeEntry(fileName);
}

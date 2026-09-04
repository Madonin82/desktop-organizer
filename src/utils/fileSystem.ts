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

export async function pickRealDirectory(
  startInHint?: 'desktop' | 'downloads' | 'documents' | 'pictures' | 'videos' | 'music'
): Promise<{
  directoryHandle: FileSystemDirectoryHandle;
  folderName: string;
  items: DesktopItem[];
}> {
  if (!isFileSystemAccessSupported()) {
    throw new Error('File System Access API is not supported in this browser. Please use Chrome, Edge, or Chromium.');
  }

  const options: Record<string, unknown> = {
    mode: 'readwrite',
  };
  if (startInHint) {
    options.startIn = startInHint;
  }

  // @ts-expect-error - showDirectoryPicker is standard on Chromium
  const directoryHandle: FileSystemDirectoryHandle = await window.showDirectoryPicker(options);

  const items: DesktopItem[] = [];

  // @ts-expect-error - values() is async iterable in modern FileSystemDirectoryHandle
  for await (const entry of directoryHandle.values()) {
    if (entry.kind === 'file') {
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

      items.push({
        id: `real-${file.name}-${file.lastModified}`,
        name: file.name,
        extension: ext,
        size: file.size,
        modifiedAt: new Date(file.lastModified).toISOString().slice(0, 16).replace('T', ' '),
        category,
        folderPath: '',
        selected: false,
        fileHandle,
        iconType,
      });
    }
  }

  return {
    directoryHandle,
    folderName: directoryHandle.name,
    items,
  };
}

export async function pickRealDestinationDirectory(): Promise<{
  directoryHandle: FileSystemDirectoryHandle;
  folderName: string;
}> {
  if (!isFileSystemAccessSupported()) {
    throw new Error('File System Access API is not supported in this browser.');
  }

  // @ts-expect-error - showDirectoryPicker
  const directoryHandle: FileSystemDirectoryHandle = await window.showDirectoryPicker({
    mode: 'readwrite',
  });

  return {
    directoryHandle,
    folderName: directoryHandle.name,
  };
}

export async function getOrCreateNestedDirectoryHandle(
  baseDirHandle: FileSystemDirectoryHandle,
  folderPath: string
): Promise<FileSystemDirectoryHandle> {
  const segments = folderPath.split(/[\\/]/).map((s) => s.trim()).filter(Boolean);
  let currentDir = baseDirHandle;
  for (const segment of segments) {
    currentDir = await currentDir.getDirectoryHandle(segment, { create: true });
  }
  return currentDir;
}

export async function moveRealFile(
  rootDirHandle: FileSystemDirectoryHandle,
  fileHandle: FileSystemFileHandle,
  destinationFolderName: string,
  fileName: string,
  explicitTargetDirHandle?: FileSystemDirectoryHandle | null
): Promise<void> {
  let targetDirHandle: FileSystemDirectoryHandle;

  if (explicitTargetDirHandle) {
    // If a dedicated target directory handle was picked
    const cleanSub = destinationFolderName
      .replace(new RegExp(`^${explicitTargetDirHandle.name}[\\\\/]`, 'i'), '')
      .replace(/^[\\/]+|[\\/]+$/g, '')
      .trim();

    if (cleanSub && cleanSub !== explicitTargetDirHandle.name) {
      targetDirHandle = await getOrCreateNestedDirectoryHandle(explicitTargetDirHandle, cleanSub);
    } else {
      targetDirHandle = explicitTargetDirHandle;
    }
  } else {
    // Subfolder inside root directory handle
    const cleanFolderName = destinationFolderName
      .replace(/^Desktop[\\/]/i, '')
      .replace(/^[\\/]+|[\\/]+$/g, '')
      .trim();

    if (!cleanFolderName) {
      throw new Error('Destination folder name cannot be empty');
    }

    targetDirHandle = await getOrCreateNestedDirectoryHandle(rootDirHandle, cleanFolderName);
  }

  // Modern move API (Chromium 111+)
  // @ts-expect-error - move method is supported in Chromium
  if (typeof fileHandle.move === 'function') {
    try {
      // @ts-expect-error - move method
      await fileHandle.move(targetDirHandle, fileName);
      return;
    } catch {
      // If move fails across directory boundaries, fallback to copy + remove
    }
  }

  // Fallback: Copy content then remove original
  const originalFile = await fileHandle.getFile();
  const newFileHandle = await targetDirHandle.getFileHandle(fileName, { create: true });
  const writable = await newFileHandle.createWritable();
  await writable.write(await originalFile.arrayBuffer());
  await writable.close();

  // Remove original entry from source
  await rootDirHandle.removeEntry(fileName);
}

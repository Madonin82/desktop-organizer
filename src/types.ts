export type FileCategoryKey =
  | 'all'
  | 'images'
  | 'documents'
  | 'shortcuts'
  | 'executables'
  | 'archives'
  | 'audio'
  | 'video'
  | 'code'
  | 'custom';

export interface FileCategory {
  id: FileCategoryKey;
  name: string;
  description: string;
  extensions: string[];
  defaultFolderName: string;
  badgeColor: string;
  iconName: string;
}

export interface DesktopItem {
  id: string;
  name: string;
  extension: string;
  size: number; // bytes
  modifiedAt: string;
  category: FileCategoryKey;
  isFolder?: boolean;
  folderPath?: string; // e.g. "" (root Desktop) or "Images"
  selected?: boolean;
  // Browser FileSystemHandle if acquired from real folder
  fileHandle?: FileSystemFileHandle;
  // Icon visual metadata
  iconType?: 'image' | 'pdf' | 'doc' | 'shortcut' | 'exe' | 'zip' | 'audio' | 'video' | 'code' | 'folder' | 'generic';
}

export interface MoveOperation {
  id: string;
  timestamp: string;
  sourceDirectory?: string;
  sourceFiles: {
    id: string;
    name: string;
    originalFolder: string;
    newFolder: string;
  }[];
  destinationFolder: string;
  fileCount: number;
  category: string;
}

export type ViewMode = 'manager' | 'desktop' | 'script' | 'history';

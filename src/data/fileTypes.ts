import { FileCategory, FileCategoryKey } from '../types';

export const FILE_CATEGORIES: FileCategory[] = [
  {
    id: 'images',
    name: 'Pictures & Screenshots',
    description: 'Photos, screenshots, icons, and graphic assets',
    extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'ico', 'tiff', 'psd'],
    defaultFolderName: 'Pictures',
    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    iconName: 'Image',
  },
  {
    id: 'documents',
    name: 'Documents & PDFs',
    description: 'PDFs, Word docs, spreadsheets, slides, and notes',
    extensions: ['pdf', 'docx', 'doc', 'txt', 'xlsx', 'xls', 'csv', 'pptx', 'ppt', 'md', 'rtf'],
    defaultFolderName: 'Documents',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    iconName: 'FileText',
  },
  {
    id: 'shortcuts',
    name: 'Shortcuts & Links',
    description: 'Desktop shortcuts, application links, and web URLs',
    extensions: ['lnk', 'url', 'desktop', 'website'],
    defaultFolderName: 'Shortcuts',
    badgeColor: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800',
    iconName: 'ExternalLink',
  },
  {
    id: 'executables',
    name: 'Installers & Programs',
    description: 'Application setups, installers, and batch scripts',
    extensions: ['exe', 'msi', 'bat', 'cmd', 'ps1', 'iso', 'bin'],
    defaultFolderName: 'Installers',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    iconName: 'Cpu',
  },
  {
    id: 'archives',
    name: 'Archives & Zips',
    description: 'Compressed zip folders, rar files, and tarballs',
    extensions: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'],
    defaultFolderName: 'Archives',
    badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    iconName: 'Archive',
  },
  {
    id: 'video',
    name: 'Videos & Recordings',
    description: 'Screen recordings, movie clips, and video edits',
    extensions: ['mp4', 'mkv', 'mov', 'avi', 'wmv', 'webm', 'flv'],
    defaultFolderName: 'Videos',
    badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800',
    iconName: 'Video',
  },
  {
    id: 'audio',
    name: 'Music & Audio',
    description: 'Audio recordings, song tracks, podcasts, and sound FX',
    extensions: ['mp3', 'wav', 'flac', 'm4a', 'aac', 'ogg', 'wma'],
    defaultFolderName: 'Audio',
    badgeColor: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800',
    iconName: 'Music',
  },
  {
    id: 'code',
    name: 'Code & Dev Files',
    description: 'Source code files, configs, scripts, and logs',
    extensions: ['ts', 'js', 'py', 'json', 'html', 'css', 'sql', 'cpp', 'cs', 'java', 'xml', 'log'],
    defaultFolderName: 'Code',
    badgeColor: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800',
    iconName: 'Code2',
  },
];

export function detectCategory(extension: string): FileCategoryKey {
  const ext = extension.toLowerCase().replace(/^\./, '');
  for (const cat of FILE_CATEGORIES) {
    if (cat.extensions.includes(ext)) {
      return cat.id;
    }
  }
  return 'custom';
}

export function getSuggestedDestination(category: FileCategoryKey, sourceFolder: string, exts?: string[]): string {
  let sub = 'Organized';
  if (category === 'all') {
    sub = 'Cleaned Files';
  } else if (category === 'custom') {
    const extName = (exts && exts[0]) ? exts[0].toUpperCase() : 'Custom';
    sub = `${extName} Files`;
  } else {
    const cat = FILE_CATEGORIES.find((c) => c.id === category);
    if (cat) sub = cat.defaultFolderName;
  }

  // If sourceFolder is Desktop, suggest "Desktop\Pictures" or "Pictures"
  // Keep clean path format
  return `${sourceFolder}\\${sub}`;
}

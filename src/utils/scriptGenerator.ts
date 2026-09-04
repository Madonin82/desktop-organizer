import { FileCategoryKey } from '../types';
import { FILE_CATEGORIES } from '../data/fileTypes';

function resolveWindowsSourceBatch(source: string): { label: string; scriptSet: string } {
  const s = source.trim().replace(/[\\/]+$/, '');
  const lower = s.toLowerCase();

  if (lower === 'desktop' || lower.includes('users\\') && lower.endsWith('desktop')) {
    return { label: '%USERPROFILE%\\Desktop', scriptSet: 'set "SOURCE_DIR=%USERPROFILE%\\Desktop"' };
  }
  if (lower === 'downloads' || lower.includes('users\\') && lower.endsWith('downloads')) {
    return { label: '%USERPROFILE%\\Downloads', scriptSet: 'set "SOURCE_DIR=%USERPROFILE%\\Downloads"' };
  }
  if (lower === 'documents' || lower.includes('users\\') && lower.endsWith('documents')) {
    return { label: '%USERPROFILE%\\Documents', scriptSet: 'set "SOURCE_DIR=%USERPROFILE%\\Documents"' };
  }
  if (lower === 'pictures' || lower.includes('users\\') && lower.endsWith('pictures')) {
    return { label: '%USERPROFILE%\\Pictures', scriptSet: 'set "SOURCE_DIR=%USERPROFILE%\\Pictures"' };
  }
  if (lower === 'videos' || lower.includes('users\\') && lower.endsWith('videos')) {
    return { label: '%USERPROFILE%\\Videos', scriptSet: 'set "SOURCE_DIR=%USERPROFILE%\\Videos"' };
  }
  if (lower === 'music' || lower.includes('users\\') && lower.endsWith('music')) {
    return { label: '%USERPROFILE%\\Music', scriptSet: 'set "SOURCE_DIR=%USERPROFILE%\\Music"' };
  }

  // If already contains % or is drive letter like C:\
  if (/^[a-zA-Z]:\\/i.test(s) || s.startsWith('%') || s.startsWith('\\\\')) {
    return { label: s, scriptSet: `set "SOURCE_DIR=${s}"` };
  }

  // Fallback to user profile subdirectory or literal path
  return { label: `%USERPROFILE%\\${s}`, scriptSet: `set "SOURCE_DIR=%USERPROFILE%\\${s}"` };
}

function resolveWindowsTargetBatch(target: string): { label: string; scriptSet: string } {
  const t = target.trim().replace(/^[\\/]+|[\\/]+$/g, '');

  if (/^[a-zA-Z]:\\/i.test(t) || t.startsWith('%') || t.startsWith('\\\\')) {
    return { label: t, scriptSet: `set "TARGET_DIR=${t}"` };
  }

  // If prefixed with Desktop\ or similar, clean it
  const cleanRel = t.replace(/^Desktop[\\/]/i, '').replace(/^[\\/]+|[\\/]+$/g, '') || t;
  return { label: `%SOURCE_DIR%\\${cleanRel}`, scriptSet: `set "TARGET_DIR=%SOURCE_DIR%\\${cleanRel}"` };
}

export function generateBatchScript(
  categoryKey: FileCategoryKey,
  targetFolderName: string,
  customExtensions: string[] = [],
  sourceDirectory = 'Desktop'
): string {
  const sourceResolution = resolveWindowsSourceBatch(sourceDirectory);
  const targetResolution = resolveWindowsTargetBatch(targetFolderName);

  let extensions: string[] = [];
  if (categoryKey === 'custom') {
    extensions = customExtensions;
  } else if (categoryKey === 'all') {
    extensions = ['*'];
  } else {
    const cat = FILE_CATEGORIES.find((c) => c.id === categoryKey);
    extensions = cat ? cat.extensions : [];
  }

  const moves = extensions
    .map((ext) => `move /y "%SOURCE_DIR%\\*.${ext}" "%TARGET_DIR%\\" 2>nul`)
    .join('\r\n');

  return `@echo off
chcp 65001 >nul
title Windows File Organizer
color 0B

echo ================================================================
echo                WINDOWS FILE ORGANIZER
echo ================================================================
echo.
echo Source Directory: ${sourceResolution.label}
echo Target Folder:    ${targetResolution.label}
echo File Filter:      ${extensions.map((e) => (e === '*' ? '* (All Files)' : '.' + e)).join(', ')}
echo.

${sourceResolution.scriptSet}
${targetResolution.scriptSet}

if not exist "%SOURCE_DIR%" (
    echo [!] ERROR: Source directory "%SOURCE_DIR%" was not found.
    echo Please check the path and try again.
    pause
    exit /b 1
)

if not exist "%TARGET_DIR%" (
    echo [*] Creating target folder: "%TARGET_DIR%"
    mkdir "%TARGET_DIR%"
)

echo [*] Scanning and moving files from "%SOURCE_DIR%" to "%TARGET_DIR%"...
echo.

${moves}

echo.
echo ================================================================
echo [SUCCESS] Files have been organized successfully!
echo Target: "%TARGET_DIR%"
echo ================================================================
echo.
pause
`;
}

export function generatePowerShellScript(
  categoryKey: FileCategoryKey,
  targetFolderName: string,
  customExtensions: string[] = [],
  sourceDirectory = 'Desktop'
): string {
  const s = sourceDirectory.trim();
  const t = targetFolderName.trim();

  let sourceSnippet = `$SourcePath = [Environment]::GetFolderPath([Environment+SpecialFolder]::Desktop)`;
  const lower = s.toLowerCase();
  if (lower === 'downloads' || lower.endsWith('\\downloads')) {
    sourceSnippet = `$SourcePath = Join-Path $HOME "Downloads"`;
  } else if (lower === 'documents' || lower.endsWith('\\documents')) {
    sourceSnippet = `$SourcePath = [Environment]::GetFolderPath([Environment+SpecialFolder]::MyDocuments)`;
  } else if (lower === 'pictures' || lower.endsWith('\\pictures')) {
    sourceSnippet = `$SourcePath = [Environment]::GetFolderPath([Environment+SpecialFolder]::MyPictures)`;
  } else if (lower === 'videos' || lower.endsWith('\\videos')) {
    sourceSnippet = `$SourcePath = Join-Path $HOME "Videos"`;
  } else if (lower === 'music' || lower.endsWith('\\music')) {
    sourceSnippet = `$SourcePath = Join-Path $HOME "Music"`;
  } else if (/^[a-zA-Z]:\\/i.test(s) || s.startsWith('\\\\')) {
    sourceSnippet = `$SourcePath = "${s.replace(/"/g, '`"')}"`;
  } else if (lower !== 'desktop' && !lower.endsWith('\\desktop')) {
    sourceSnippet = `$SourcePath = Join-Path $HOME "${s.replace(/"/g, '`"')}"`;
  }

  let extensions: string[] = [];
  if (categoryKey === 'custom') {
    extensions = customExtensions;
  } else if (categoryKey === 'all') {
    extensions = ['*'];
  } else {
    const cat = FILE_CATEGORIES.find((c) => c.id === categoryKey);
    extensions = cat ? cat.extensions : [];
  }

  const extArray = extensions.map((ext) => `'*.${ext}'`).join(', ');

  return `# ================================================================
# Windows File Organizer (PowerShell)
# Run in PowerShell or right-click -> "Run with PowerShell"
# ================================================================

$Host.UI.RawUI.WindowTitle = "File Organizer"

${sourceSnippet}
$TargetInput = "${t.replace(/"/g, '`"')}"

if ([System.IO.Path]::IsPathRooted($TargetInput)) {
    $TargetDir = $TargetInput
} else {
    $cleanRel = $TargetInput.TrimStart('\', '/')
    $TargetDir = Join-Path $SourcePath $cleanRel
}

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "                 WINDOWS FILE ORGANIZER" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "Source Path:   $SourcePath" -ForegroundColor Gray
Write-Host "Target Folder: $TargetDir" -ForegroundColor Gray
Write-Host "Extensions:    ${extensions.map((e) => (e === '*' ? '* (All)' : '.' + e)).join(', ')}" -ForegroundColor Gray
Write-Host ""

if (-not (Test-Path -Path $SourcePath)) {
    Write-Host "[!] ERROR: Source path '$SourcePath' does not exist." -ForegroundColor Red
    Read-Host -Prompt "Press Enter to exit..."
    exit 1
}

if (-not (Test-Path -Path $TargetDir)) {
    Write-Host "[*] Creating target directory: $TargetDir" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
}

$Patterns = @(${extArray})
$MovedCount = 0

foreach ($Pattern in $Patterns) {
    $MatchingFiles = Get-ChildItem -Path $SourcePath -Filter $Pattern -File
    foreach ($File in $MatchingFiles) {
        # Avoid moving files that are already inside target folder or subdirectories
        if ($File.DirectoryName -eq $SourcePath) {
            $destFilePath = Join-Path $TargetDir $File.Name
            if ($File.FullName -ne $destFilePath) {
                Write-Host "  -> Moving: $($File.Name)" -ForegroundColor Green
                Move-Item -Path $File.FullName -Destination $TargetDir -Force
                $MovedCount++
            }
        }
    }
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "[SUCCESS] Moved $MovedCount file(s) into '$TargetDir'!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Read-Host -Prompt "Press Enter to exit..."
`;
}

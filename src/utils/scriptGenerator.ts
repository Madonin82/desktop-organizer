import { FileCategoryKey } from '../types';
import { FILE_CATEGORIES } from '../data/fileTypes';

export function generateBatchScript(
  categoryKey: FileCategoryKey,
  targetFolderName: string,
  customExtensions: string[] = []
): string {
  const cleanTarget = targetFolderName.replace(/^Desktop[\\/]/i, '').replace(/^[\\/]+|[\\/]+$/g, '');
  
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
    .map((ext) => `move /y "%DESKTOP%\\*.${ext}" "%TARGET_DIR%\\" 2>nul`)
    .join('\r\n');

  return `@echo off
chcp 65001 >nul
title Windows Desktop File Organizer
color 0B

echo ================================================================
echo           WINDOWS DESKTOP FILE ORGANIZER
echo ================================================================
echo.
echo Target Folder: %USERPROFILE%\\Desktop\\${cleanTarget}
echo Extensions:    ${extensions.map(e => '.' + e).join(', ')}
echo.

set "DESKTOP=%USERPROFILE%\\Desktop"
set "TARGET_DIR=%DESKTOP%\\${cleanTarget}"

if not exist "%TARGET_DIR%" (
    echo [*] Creating target folder: "%TARGET_DIR%"
    mkdir "%TARGET_DIR%"
)

echo [*] Moving files to %TARGET_DIR%...
echo.

${moves}

echo.
echo ================================================================
echo [SUCCESS] Files have been organized into "${cleanTarget}"!
echo ================================================================
echo.
pause
`;
}

export function generatePowerShellScript(
  categoryKey: FileCategoryKey,
  targetFolderName: string,
  customExtensions: string[] = []
): string {
  const cleanTarget = targetFolderName.replace(/^Desktop[\\/]/i, '').replace(/^[\\/]+|[\\/]+$/g, '');
  
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
# Windows Desktop File Organizer (PowerShell)
# Run in PowerShell or right-click -> "Run with PowerShell"
# ================================================================

$Host.UI.RawUI.WindowTitle = "Desktop File Organizer"

$DesktopPath = [Environment]::GetFolderPath("Desktop")
$TargetFolderName = "${cleanTarget}"
$TargetDir = Join-Path $DesktopPath $TargetFolderName

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "             WINDOWS DESKTOP FILE ORGANIZER" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "Desktop Path:  $DesktopPath" -ForegroundColor Gray
Write-Host "Target Folder: $TargetDir" -ForegroundColor Gray
Write-Host "Extensions:    ${extensions.map(e => '.' + e).join(', ')}" -ForegroundColor Gray
Write-Host ""

if (-not (Test-Path -Path $TargetDir)) {
    Write-Host "[*] Creating folder: $TargetDir" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
}

$Patterns = @(${extArray})
$MovedCount = 0

foreach ($Pattern in $Patterns) {
    $MatchingFiles = Get-ChildItem -Path $DesktopPath -Filter $Pattern -File
    foreach ($File in $MatchingFiles) {
        # Avoid moving files that are already inside target folder or subdirectories
        if ($File.DirectoryName -eq $DesktopPath) {
            Write-Host "  -> Moving: $($File.Name)" -ForegroundColor Green
            Move-Item -Path $File.FullName -Destination $TargetDir -Force
            $MovedCount++
        }
    }
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "[SUCCESS] Moved $MovedCount file(s) into '$TargetFolderName'!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Read-Host -Prompt "Press Enter to exit..."
`;
}

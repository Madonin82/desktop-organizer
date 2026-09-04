import { FileCategoryKey } from '../types';
import { FILE_CATEGORIES } from '../data/fileTypes';

export function generateBatchScript(
  categoryKey: FileCategoryKey,
  targetFolderName: string,
  customExtensions: string[] = [],
  includeSubfolders = true,
  isCurrentLocationMode = true
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

  let moveCommands = '';
  if (includeSubfolders) {
    moveCommands = extensions
      .map(
        (ext) =>
          `for /r "%WORK_DIR%" %%F in (*.${ext}) do (\r\n` +
          `    if /i not "%%~dpF"=="%TARGET_DIR%\\" (\r\n` +
          `        if /i not "%%~nxF"=="%~nx0" (\r\n` +
          `            move /y "%%F" "%TARGET_DIR%\\" >nul 2>&1\r\n` +
          `        )\r\n` +
          `    )\r\n` +
          `)`
      )
      .join('\r\n\r\n');
  } else {
    moveCommands = extensions
      .map((ext) => `for %%F in ("%WORK_DIR%\\*.${ext}") do move /y "%%F" "%TARGET_DIR%\\" >nul 2>&1`)
      .join('\r\n');
  }

  const dirSetup = isCurrentLocationMode
    ? 'set "WORK_DIR=%~dp0"\r\nset "WORK_DIR=%WORK_DIR:~0,-1%"'
    : 'set "WORK_DIR=%USERPROFILE%\\Desktop"';

  return `@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title Folder & Desktop File Organizer
color 0B

echo ================================================================
echo           WINDOWS FOLDER & DESKTOP FILE ORGANIZER
echo ================================================================
echo.
${dirSetup}
set "TARGET_DIR=%WORK_DIR%\\${cleanTarget}"

echo Working Directory: %WORK_DIR%
echo Target Folder:     %TARGET_DIR%
echo Recursive Scan:    ${includeSubfolders ? 'YES (All sub-folders included)' : 'NO (Top-level only)'}
echo Extensions:        ${extensions.map((e) => '.' + e).join(', ')}
echo.

if not exist "%TARGET_DIR%" (
    echo [*] Creating target folder: "%TARGET_DIR%"
    mkdir "%TARGET_DIR%" >nul 2>&1
)

echo [*] Organizing files into %TARGET_DIR%...
echo.

${moveCommands}

echo.
echo ================================================================
echo [SUCCESS] Matching files have been organized into "${cleanTarget}"!
echo ================================================================
echo.
pause
`;
}

export function generatePowerShellScript(
  categoryKey: FileCategoryKey,
  targetFolderName: string,
  customExtensions: string[] = [],
  includeSubfolders = true,
  isCurrentLocationMode = true
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

  const rootPathCode = isCurrentLocationMode
    ? `$WorkDir = $PSScriptRoot\r\nif ([string]::IsNullOrWhiteSpace($WorkDir)) { $WorkDir = (Get-Location).Path }`
    : `$WorkDir = [Environment]::GetFolderPath("Desktop")`;

  const recurseFlag = includeSubfolders ? '-Recurse' : '';

  return `# ================================================================
# Windows Folder & Desktop File Organizer (PowerShell)
# Drop into any folder or run on Desktop
# ================================================================

$Host.UI.RawUI.WindowTitle = "Folder & Desktop File Organizer"

${rootPathCode}
$TargetFolderName = "${cleanTarget}"
$TargetDir = Join-Path $WorkDir $TargetFolderName

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "         WINDOWS FOLDER & DESKTOP FILE ORGANIZER" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "Working Directory: $WorkDir" -ForegroundColor Gray
Write-Host "Destination:       $TargetDir" -ForegroundColor Gray
Write-Host "Recursive Scan:    ${includeSubfolders ? 'YES (All sub-folders included)' : 'NO (Root only)'}" -ForegroundColor Gray
Write-Host "Extensions:        ${extensions.map((e) => '.' + e).join(', ')}" -ForegroundColor Gray
Write-Host ""

if (-not (Test-Path -Path $TargetDir)) {
    Write-Host "[*] Creating folder: $TargetDir" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
}

$Patterns = @(${extArray})
$ExcludedNames = @("Organizer-Desktop-App.bat", "Organizer-Desktop-App.ps1", "run.bat", "package.json", "index.html", "metadata.json", "README.md")
$MovedCount = 0

foreach ($Pattern in $Patterns) {
    $MatchingFiles = Get-ChildItem -Path $WorkDir ${recurseFlag} -Filter $Pattern -File -ErrorAction SilentlyContinue
    foreach ($File in $MatchingFiles) {
        # Avoid moving self or files already in target folder
        if ($ExcludedNames -contains $File.Name) { continue }
        if ($File.FullName.StartsWith($TargetDir, [System.StringComparison]::OrdinalIgnoreCase)) { continue }

        # Collision avoidance
        $DestName = $File.Name
        $DestPath = Join-Path $TargetDir $DestName
        $Counter = 1
        while (Test-Path -Path $DestPath) {
            $Base = [System.IO.Path]::GetFileNameWithoutExtension($File.Name)
            $Ext = $File.Extension
            $DestName = "$Base ($Counter)$Ext"
            $DestPath = Join-Path $TargetDir $DestName
            $Counter++
        }

        try {
            Write-Host "  -> Moving: $($File.FullName.Replace($WorkDir, ''))" -ForegroundColor Green
            Move-Item -Path $File.FullName -Destination $DestPath -Force -ErrorAction Stop
            $MovedCount++
        } catch {
            Write-Host "  [!] Error moving $($File.Name): $_" -ForegroundColor Red
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

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

[System.Windows.Forms.Application]::EnableVisualStyles()

# Determine App Folder and Target Parent Folder:
# The user drops the entire app folder into the messy folder they want organized (e.g. C:\clean these up\Desktop-Organizer).
# The app starts by targeting the parent folder it was dropped into (C:\clean these up\), one level up in hierarchy.
$script:AppDirectory = $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($script:AppDirectory)) {
    $script:AppDirectory = (Get-Location).Path
}
$script:AppDirectory = [System.IO.Path]::GetFullPath($script:AppDirectory).TrimEnd([System.IO.Path]::DirectorySeparatorChar, [System.IO.Path]::AltDirectorySeparatorChar)

# Target the parent folder containing the app folder
$parentDir = Split-Path -Parent $script:AppDirectory
if (-not [string]::IsNullOrWhiteSpace($parentDir) -and (Test-Path -LiteralPath $parentDir)) {
    $initialPath = [System.IO.Path]::GetFullPath($parentDir)
} else {
    $initialPath = $script:AppDirectory
}

# Global State
$script:TargetRootPath = $initialPath
$script:LastMovedFiles = @()
$script:LastTargetFolder = ""
$script:CurrentFiles = @()

# Safety Exclusions - Do NOT touch organizer app files or system dev folders
$script:ExcludedFileNames = @(
    "Organizer-Desktop-App.bat",
    "Organizer-Desktop-App.ps1",
    "run.bat",
    "package.json",
    "package-lock.json",
    "bun.lock",
    "index.html",
    "vite.config.ts",
    "tsconfig.json",
    "tsconfig.node.json",
    "metadata.json",
    "README.md",
    ".env.example",
    ".gitignore",
    "desktop.ini",
    "thumbs.db"
)

$script:ExcludedDirNames = @(
    "node_modules",
    ".git",
    "src",
    "public",
    "dist"
)

# File Type Categories
$script:Categories = @(
    @{
        Name = "Pictures & Screenshots"
        Folder = "Pictures"
        Extensions = @(".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".ico", ".svg", ".tiff")
    },
    @{
        Name = "Documents & PDFs"
        Folder = "Documents"
        Extensions = @(".pdf", ".docx", ".doc", ".txt", ".xlsx", ".xls", ".csv", ".pptx", ".ppt", ".md", ".rtf")
    },
    @{
        Name = "Shortcuts & App Icons"
        Folder = "Shortcuts"
        Extensions = @(".lnk", ".url")
    },
    @{
        Name = "Installers & Executables"
        Folder = "Installers"
        Extensions = @(".exe", ".msi", ".bat", ".cmd", ".iso")
    },
    @{
        Name = "Archives & Zips"
        Folder = "Archives"
        Extensions = @(".zip", ".rar", ".7z", ".tar", ".gz")
    },
    @{
        Name = "Videos & Clips"
        Folder = "Videos"
        Extensions = @(".mp4", ".mkv", ".mov", ".avi", ".wmv", ".webm")
    },
    @{
        Name = "Music & Audio"
        Folder = "Audio"
        Extensions = @(".mp3", ".wav", ".m4a", ".flac", ".aac")
    },
    @{
        Name = "Code & Scripts"
        Folder = "Code"
        Extensions = @(".py", ".js", ".ts", ".json", ".html", ".css", ".sql", ".ps1", ".cpp", ".cs")
    },
    @{
        Name = "All Files (Clean Up Everything)"
        Folder = "Cleaned Files"
        Extensions = @("*")
    }
)

# Helper: Format Bytes
function Format-FileSize([long]$Bytes) {
    if ($Bytes -lt 1024) { return "$Bytes B" }
    elseif ($Bytes -lt 1MB) { return "{0:N1} KB" -f ($Bytes / 1KB) }
    elseif ($Bytes -lt 1GB) { return "{0:N1} MB" -f ($Bytes / 1MB) }
    else { return "{0:N2} GB" -f ($Bytes / 1GB) }
}

# Helper: Check if a path is inside an excluded directory
function Test-IsExcludedFile($fileItem, $destinationPath) {
    $fullPath = $fileItem.FullName

    # CRITICAL: Exclude the entire app folder and all its contents!
    # Because the app folder is located inside the parent folder being organized,
    # none of the app's files or subdirectories should ever be organized.
    if (-not [string]::IsNullOrWhiteSpace($script:AppDirectory)) {
        $appPrefix = $script:AppDirectory + [System.IO.Path]::DirectorySeparatorChar
        if ($fullPath.StartsWith($appPrefix, [System.StringComparison]::OrdinalIgnoreCase) -or
            $fullPath -ieq $script:AppDirectory) {
            return $true
        }
    }

    # Check filename exclusion
    if ($script:ExcludedFileNames -contains $fileItem.Name.ToLower()) {
        return $true
    }
    # Check directory segment exclusion
    foreach ($dir in $script:ExcludedDirNames) {
        $pattern = [regex]::Escape([System.IO.Path]::DirectorySeparatorChar + $dir + [System.IO.Path]::DirectorySeparatorChar)
        $patternEnd = [regex]::Escape([System.IO.Path]::DirectorySeparatorChar + $dir) + "$"
        if ($fullPath -match $pattern -or $fullPath -match $patternEnd) {
            return $true
        }
    }
    # Avoid files already inside destination directory
    if (-not [string]::IsNullOrWhiteSpace($destinationPath)) {
        if ($fullPath.StartsWith($destinationPath, [System.StringComparison]::OrdinalIgnoreCase)) {
            return $true
        }
    }
    return $false
}

# Main Form
$form = New-Object System.Windows.Forms.Form
$form.Text = "Folder & Desktop File Organizer"
$form.Size = New-Object System.Drawing.Size(720, 720)
$form.StartPosition = "CenterScreen"
$form.BackColor = [System.Drawing.Color]::FromArgb(248, 249, 250)
$form.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$form.FormBorderStyle = [System.Windows.Forms.FormBorderStyle]::FixedDialog
$form.MaximizeBox = $false

# Header Panel
$headerPanel = New-Object System.Windows.Forms.Panel
$headerPanel.Size = New-Object System.Drawing.Size(720, 80)
$headerPanel.Location = New-Object System.Drawing.Point(0, 0)
$headerPanel.BackColor = [System.Drawing.Color]::FromArgb(20, 75, 120)
$form.Controls.Add($headerPanel)

$lblTitle = New-Object System.Windows.Forms.Label
$lblTitle.Text = "Folder & Desktop File Organizer"
$lblTitle.Font = New-Object System.Drawing.Font("Segoe UI Semibold", 13, [System.Drawing.FontStyle]::Bold)
$lblTitle.ForeColor = [System.Drawing.Color]::White
$lblTitle.Location = New-Object System.Drawing.Point(20, 10)
$lblTitle.AutoSize = $true
$headerPanel.Controls.Add($lblTitle)

$lblSubtitle = New-Object System.Windows.Forms.Label
$lblSubtitle.Text = "Active: $script:TargetRootPath"
$lblSubtitle.Font = New-Object System.Drawing.Font("Segoe UI", 8.5)
$lblSubtitle.ForeColor = [System.Drawing.Color]::FromArgb(210, 230, 250)
$lblSubtitle.Location = New-Object System.Drawing.Point(21, 38)
$lblSubtitle.Size = New-Object System.Drawing.Size(460, 36)
$lblSubtitle.AutoEllipsis = $true
$headerPanel.Controls.Add($lblSubtitle)

# Folder Quick Switch Buttons in Header
$btnChooseFolder = New-Object System.Windows.Forms.Button
$btnChooseFolder.Text = "Change Folder..."
$btnChooseFolder.Font = New-Object System.Drawing.Font("Segoe UI", 8.5)
$btnChooseFolder.Location = New-Object System.Drawing.Point(490, 24)
$btnChooseFolder.Size = New-Object System.Drawing.Size(105, 30)
$btnChooseFolder.BackColor = [System.Drawing.Color]::FromArgb(235, 242, 250)
$btnChooseFolder.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$headerPanel.Controls.Add($btnChooseFolder)

$btnUseDesktop = New-Object System.Windows.Forms.Button
$btnUseDesktop.Text = "Desktop"
$btnUseDesktop.Font = New-Object System.Drawing.Font("Segoe UI", 8.5)
$btnUseDesktop.Location = New-Object System.Drawing.Point(605, 24)
$btnUseDesktop.Size = New-Object System.Drawing.Size(85, 30)
$btnUseDesktop.BackColor = [System.Drawing.Color]::FromArgb(235, 242, 250)
$btnUseDesktop.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$headerPanel.Controls.Add($btnUseDesktop)

# Step 1: Pick File Type & Scope GroupBox
$grpStep1 = New-Object System.Windows.Forms.GroupBox
$grpStep1.Text = "Step 1: Pick File Type & Scan Options"
$grpStep1.Font = New-Object System.Drawing.Font("Segoe UI Semibold", 9)
$grpStep1.Location = New-Object System.Drawing.Point(20, 90)
$grpStep1.Size = New-Object System.Drawing.Size(665, 95)
$form.Controls.Add($grpStep1)

$cboType = New-Object System.Windows.Forms.ComboBox
$cboType.DropDownStyle = [System.Windows.Forms.ComboBoxStyle]::DropDownList
$cboType.Font = New-Object System.Drawing.Font("Segoe UI", 9.5)
$cboType.Location = New-Object System.Drawing.Point(15, 26)
$cboType.Size = New-Object System.Drawing.Size(370, 28)
foreach ($cat in $script:Categories) {
    [void]$cboType.Items.Add($cat.Name)
}
$cboType.SelectedIndex = 0
$grpStep1.Controls.Add($cboType)

$btnRefresh = New-Object System.Windows.Forms.Button
$btnRefresh.Text = "Scan Folder"
$btnRefresh.Font = New-Object System.Drawing.Font("Segoe UI Semibold", 8.5)
$btnRefresh.Location = New-Object System.Drawing.Point(400, 25)
$btnRefresh.Size = New-Object System.Drawing.Size(110, 29)
$btnRefresh.BackColor = [System.Drawing.Color]::FromArgb(230, 235, 242)
$btnRefresh.FlatStyle = [System.Windows.Forms.FlatStyle]::Standard
$grpStep1.Controls.Add($btnRefresh)

# Recursive Subfolder Checkbox
$chkSubfolders = New-Object System.Windows.Forms.CheckBox
$chkSubfolders.Text = "Include all sub-folders (clean up nested files)"
$chkSubfolders.Checked = $true
$chkSubfolders.Font = New-Object System.Drawing.Font("Segoe UI", 8.5)
$chkSubfolders.Location = New-Object System.Drawing.Point(15, 62)
$chkSubfolders.Size = New-Object System.Drawing.Size(340, 24)
$grpStep1.Controls.Add($chkSubfolders)

$btnUseCurrentLocation = New-Object System.Windows.Forms.Button
$btnUseCurrentLocation.Text = "Parent Folder"
$btnUseCurrentLocation.Font = New-Object System.Drawing.Font("Segoe UI", 8)
$btnUseCurrentLocation.Location = New-Object System.Drawing.Point(520, 25)
$btnUseCurrentLocation.Size = New-Object System.Drawing.Size(130, 29)
$btnUseCurrentLocation.BackColor = [System.Drawing.Color]::FromArgb(240, 243, 246)
$btnUseCurrentLocation.FlatStyle = [System.Windows.Forms.FlatStyle]::Standard
$grpStep1.Controls.Add($btnUseCurrentLocation)

# Step 2: Matching Files GroupBox
$grpStep2 = New-Object System.Windows.Forms.GroupBox
$grpStep2.Text = "Step 2: Auto-Selected Matching Files"
$grpStep2.Font = New-Object System.Drawing.Font("Segoe UI Semibold", 9)
$grpStep2.Location = New-Object System.Drawing.Point(20, 195)
$grpStep2.Size = New-Object System.Drawing.Size(665, 255)
$form.Controls.Add($grpStep2)

$chkListFiles = New-Object System.Windows.Forms.CheckedListBox
$chkListFiles.Location = New-Object System.Drawing.Point(15, 25)
$chkListFiles.Size = New-Object System.Drawing.Size(635, 185)
$chkListFiles.Font = New-Object System.Drawing.Font("Consolas", 8.5)
$chkListFiles.CheckOnClick = $true
$grpStep2.Controls.Add($chkListFiles)

$lblCount = New-Object System.Windows.Forms.Label
$lblCount.Text = "0 files selected"
$lblCount.Font = New-Object System.Drawing.Font("Segoe UI", 8.5)
$lblCount.ForeColor = [System.Drawing.Color]::FromArgb(60, 70, 80)
$lblCount.Location = New-Object System.Drawing.Point(15, 222)
$lblCount.AutoSize = $true
$grpStep2.Controls.Add($lblCount)

$btnSelectAll = New-Object System.Windows.Forms.Button
$btnSelectAll.Text = "Select All"
$btnSelectAll.Font = New-Object System.Drawing.Font("Segoe UI", 8.5)
$btnSelectAll.Location = New-Object System.Drawing.Point(465, 218)
$btnSelectAll.Size = New-Object System.Drawing.Size(90, 27)
$grpStep2.Controls.Add($btnSelectAll)

$btnDeselectAll = New-Object System.Windows.Forms.Button
$btnDeselectAll.Text = "Clear All"
$btnDeselectAll.Font = New-Object System.Drawing.Font("Segoe UI", 8.5)
$btnDeselectAll.Location = New-Object System.Drawing.Point(565, 218)
$btnDeselectAll.Size = New-Object System.Drawing.Size(85, 27)
$grpStep2.Controls.Add($btnDeselectAll)

# Step 3: Destination Folder GroupBox
$grpStep3 = New-Object System.Windows.Forms.GroupBox
$grpStep3.Text = "Step 3: Choose Destination Folder (created inside current location)"
$grpStep3.Font = New-Object System.Drawing.Font("Segoe UI Semibold", 9)
$grpStep3.Location = New-Object System.Drawing.Point(20, 460)
$grpStep3.Size = New-Object System.Drawing.Size(665, 95)
$form.Controls.Add($grpStep3)

$lblFolderPrefix = New-Object System.Windows.Forms.Label
$lblFolderPrefix.Text = "Target Folder Name:"
$lblFolderPrefix.Font = New-Object System.Drawing.Font("Segoe UI", 8.5)
$lblFolderPrefix.Location = New-Object System.Drawing.Point(15, 24)
$lblFolderPrefix.AutoSize = $true
$grpStep3.Controls.Add($lblFolderPrefix)

$txtTargetFolder = New-Object System.Windows.Forms.TextBox
$txtTargetFolder.Location = New-Object System.Drawing.Point(15, 46)
$txtTargetFolder.Size = New-Object System.Drawing.Size(460, 26)
$txtTargetFolder.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$txtTargetFolder.Text = "Pictures"
$grpStep3.Controls.Add($txtTargetFolder)

$btnBrowseFolder = New-Object System.Windows.Forms.Button
$btnBrowseFolder.Text = "Browse..."
$btnBrowseFolder.Font = New-Object System.Drawing.Font("Segoe UI", 8.5)
$btnBrowseFolder.Location = New-Object System.Drawing.Point(485, 45)
$btnBrowseFolder.Size = New-Object System.Drawing.Size(85, 28)
$grpStep3.Controls.Add($btnBrowseFolder)

$chkCleanEmptyDirs = New-Object System.Windows.Forms.CheckBox
$chkCleanEmptyDirs.Text = "Remove empty sub-folders after move"
$chkCleanEmptyDirs.Checked = $false
$chkCleanEmptyDirs.Font = New-Object System.Drawing.Font("Segoe UI", 8)
$chkCleanEmptyDirs.Location = New-Object System.Drawing.Point(15, 74)
$chkCleanEmptyDirs.Size = New-Object System.Drawing.Size(300, 18)
$grpStep3.Controls.Add($chkCleanEmptyDirs)

# Bottom Action Buttons
$btnOrganize = New-Object System.Windows.Forms.Button
$btnOrganize.Text = "Organize Files into Folder"
$btnOrganize.Font = New-Object System.Drawing.Font("Segoe UI Semibold", 10, [System.Drawing.FontStyle]::Bold)
$btnOrganize.BackColor = [System.Drawing.Color]::FromArgb(16, 124, 65)
$btnOrganize.ForeColor = [System.Drawing.Color]::White
$btnOrganize.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$btnOrganize.Location = New-Object System.Drawing.Point(20, 565)
$btnOrganize.Size = New-Object System.Drawing.Size(480, 44)
$form.Controls.Add($btnOrganize)

$btnUndo = New-Object System.Windows.Forms.Button
$btnUndo.Text = "Undo Last Move"
$btnUndo.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$btnUndo.Location = New-Object System.Drawing.Point(510, 565)
$btnUndo.Size = New-Object System.Drawing.Size(175, 44)
$btnUndo.Enabled = $false
$form.Controls.Add($btnUndo)

# Status Label
$lblStatus = New-Object System.Windows.Forms.Label
$lblStatus.Text = "Ready. Scanning current folder..."
$lblStatus.Font = New-Object System.Drawing.Font("Segoe UI", 8.5)
$lblStatus.ForeColor = [System.Drawing.Color]::FromArgb(90, 90, 90)
$lblStatus.Location = New-Object System.Drawing.Point(22, 620)
$lblStatus.Size = New-Object System.Drawing.Size(660, 45)
$form.Controls.Add($lblStatus)

# Function: Scan Folder and Populate CheckedListBox
function Update-FolderFiles {
    $chkListFiles.Items.Clear()
    $script:CurrentFiles = @()

    $isParentOfApp = $false
    if (-not [string]::IsNullOrWhiteSpace($script:AppDirectory) -and $script:AppDirectory.StartsWith($script:TargetRootPath, [System.StringComparison]::OrdinalIgnoreCase) -and $script:AppDirectory -ine $script:TargetRootPath) {
        $isParentOfApp = $true
    }

    if ($isParentOfApp) {
        $appName = Split-Path -Leaf $script:AppDirectory
        $lblSubtitle.Text = "Targeting Parent: $script:TargetRootPath`n[Protected: \$appName\ excluded]"
    } else {
        $lblSubtitle.Text = "Active: $script:TargetRootPath"
    }

    $selectedCategory = $script:Categories[$cboType.SelectedIndex]
    $txtTargetFolder.Text = $selectedCategory.Folder

    if (-not (Test-Path -Path $script:TargetRootPath)) {
        $lblStatus.Text = "Folder does not exist: $script:TargetRootPath"
        return
    }

    $includeSubfolders = $chkSubfolders.Checked

    # Get files based on recursive option
    if ($includeSubfolders) {
        $allFiles = Get-ChildItem -Path $script:TargetRootPath -Recurse -File -ErrorAction SilentlyContinue
    } else {
        $allFiles = Get-ChildItem -Path $script:TargetRootPath -File -ErrorAction SilentlyContinue
    }

    $matchingFiles = @()
    foreach ($file in $allFiles) {
        # Check exclusions
        if (Test-IsExcludedFile $file "") {
            continue
        }

        $ext = $file.Extension.ToLower()
        if ($selectedCategory.Extensions -contains "*" -or $selectedCategory.Extensions -contains $ext) {
            $matchingFiles += $file
        }
    }

    $script:CurrentFiles = $matchingFiles
    $totalSize = 0

    foreach ($file in $matchingFiles) {
        $sizeStr = Format-FileSize $file.Length
        
        # Determine relative path from TargetRootPath
        $relPath = $file.FullName
        if ($relPath.StartsWith($script:TargetRootPath, [System.StringComparison]::OrdinalIgnoreCase)) {
            $relPath = $relPath.Substring($script:TargetRootPath.Length).TrimStart('\', '/')
        }

        $displayText = "$relPath  ($sizeStr)"
        # Auto-check all matching files by default
        [void]$chkListFiles.Items.Add($displayText, $true)
        $totalSize += $file.Length
    }

    $count = $matchingFiles.Count
    $sizeFormatted = Format-FileSize $totalSize
    $scopeText = if ($includeSubfolders) { "and all sub-folders" } else { "root folder only" }
    $lblCount.Text = "$count of $count files selected ($sizeFormatted)"
    $btnOrganize.Text = "Organize $count File(s) into Folder"
    $btnOrganize.Enabled = ($count -gt 0)
    $lblStatus.Text = "Found $count matching file(s) across $scopeText in `"$script:TargetRootPath`"."
}

# ComboBox selection change event
$cboType.Add_SelectedIndexChanged({
    Update-FolderFiles
})

# Subfolder checkbox change event
$chkSubfolders.Add_CheckedChanged({
    Update-FolderFiles
})

# Scan / Refresh Button
$btnRefresh.Add_Click({
    Update-FolderFiles
})

# Reset to Parent Folder
$btnUseCurrentLocation.Add_Click({
    $script:TargetRootPath = $initialPath
    Update-FolderFiles
})

# Use Desktop
$btnUseDesktop.Add_Click({
    $script:TargetRootPath = [Environment]::GetFolderPath([Environment+SpecialFolder]::Desktop)
    Update-FolderFiles
})

# Change Target Folder Dialog
$btnChooseFolder.Add_Click({
    $dlg = New-Object System.Windows.Forms.FolderBrowserDialog
    $dlg.SelectedPath = $script:TargetRootPath
    $dlg.Description = "Select Folder to Scan and Organize"
    if ($dlg.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
        $script:TargetRootPath = $dlg.SelectedPath
        Update-FolderFiles
    }
})

# Select All Button
$btnSelectAll.Add_Click({
    for ($i = 0; $i -lt $chkListFiles.Items.Count; $i++) {
        $chkListFiles.SetItemChecked($i, $true)
    }
    $selected = $chkListFiles.CheckedItems.Count
    $lblCount.Text = "$selected of $($chkListFiles.Items.Count) files selected"
    $btnOrganize.Text = "Organize $selected File(s) into Folder"
    $btnOrganize.Enabled = ($selected -gt 0)
})

# Clear All Button
$btnDeselectAll.Add_Click({
    for ($i = 0; $i -lt $chkListFiles.Items.Count; $i++) {
        $chkListFiles.SetItemChecked($i, $false)
    }
    $lblCount.Text = "0 of $($chkListFiles.Items.Count) files selected"
    $btnOrganize.Text = "Select Files to Organize"
    $btnOrganize.Enabled = $false
})

# Item Check Event
$chkListFiles.Add_ItemCheck({
    $form.BeginInvoke([Action]{
        $selected = $chkListFiles.CheckedIndices.Count
        $lblCount.Text = "$selected of $($chkListFiles.Items.Count) files selected"
        if ($selected -gt 0) {
            $btnOrganize.Text = "Organize $selected File(s) into Folder"
            $btnOrganize.Enabled = $true
        } else {
            $btnOrganize.Text = "Select Files to Organize"
            $btnOrganize.Enabled = $false
        }
    })
})

# Browse Destination Folder Dialog
$btnBrowseFolder.Add_Click({
    $dlg = New-Object System.Windows.Forms.FolderBrowserDialog
    $dlg.SelectedPath = $script:TargetRootPath
    $dlg.Description = "Select Destination Folder"
    if ($dlg.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
        $chosen = $dlg.SelectedPath
        # If inside target root, make relative
        if ($chosen.StartsWith($script:TargetRootPath, [System.StringComparison]::OrdinalIgnoreCase)) {
            $rel = $chosen.Substring($script:TargetRootPath.Length).TrimStart('\', '/')
            if ($rel -ne "") { $txtTargetFolder.Text = $rel }
            else { $txtTargetFolder.Text = $chosen }
        } else {
            $txtTargetFolder.Text = $chosen
        }
    }
})

# Organize Action
$btnOrganize.Add_Click({
    $checkedIndices = $chkListFiles.CheckedIndices
    if ($checkedIndices.Count -eq 0) {
        [System.Windows.Forms.MessageBox]::Show("Please select at least one file to organize.", "No Files Selected", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Warning)
        return
    }

    $folderInput = $txtTargetFolder.Text.Trim().TrimStart('\', '/')
    if ([string]::IsNullOrWhiteSpace($folderInput)) {
        [System.Windows.Forms.MessageBox]::Show("Please specify a target folder name.", "Folder Required", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Warning)
        return
    }

    # Resolve full destination folder path
    if ([System.IO.Path]::IsPathRooted($folderInput)) {
        $destinationPath = $folderInput
    } else {
        $destinationPath = Join-Path $script:TargetRootPath $folderInput
    }

    # Create destination directory if not exists
    if (-not (Test-Path -Path $destinationPath)) {
        try {
            [void](New-Item -ItemType Directory -Path $destinationPath -Force)
        } catch {
            [System.Windows.Forms.MessageBox]::Show("Failed to create folder: $_", "Error", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Error)
            return
        }
    }

    # Move selected files with safe collision handling
    $movedFiles = @()
    $errors = @()

    foreach ($idx in $checkedIndices) {
        $file = $script:CurrentFiles[$idx]

        # Double-check safety exclusions
        if (Test-IsExcludedFile $file $destinationPath) {
            continue
        }

        # Resolve destination path with collision avoidance
        $targetFileName = $file.Name
        $destFilePath = Join-Path $destinationPath $targetFileName

        # Avoid moving into self
        if ($file.FullName -eq $destFilePath) { continue }

        # Collision avoidance: If target already exists, append (1), (2), etc.
        if (Test-Path -Path $destFilePath) {
            $baseName = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
            $ext = $file.Extension
            $counter = 1
            while (Test-Path -Path $destFilePath) {
                $targetFileName = "$baseName ($counter)$ext"
                $destFilePath = Join-Path $destinationPath $targetFileName
                $counter++
            }
        }

        try {
            Move-Item -Path $file.FullName -Destination $destFilePath -Force -ErrorAction Stop
            $movedFiles += @{
                Name = $file.Name
                OriginalPath = $file.FullName
                NewPath = $destFilePath
            }
        } catch {
            $errors += "$($file.Name): $_"
        }
    }

    # Optional: Clean up empty subdirectories if user enabled it
    $cleanedDirsCount = 0
    if ($chkCleanEmptyDirs.Checked -and $chkSubfolders.Checked) {
        $subDirs = Get-ChildItem -Path $script:TargetRootPath -Directory -Recurse -ErrorAction SilentlyContinue | Sort-Object -Property FullName -Descending
        foreach ($dir in $subDirs) {
            if ($dir.FullName.StartsWith($destinationPath, [System.StringComparison]::OrdinalIgnoreCase)) { continue }
            # NEVER delete or touch the app folder or anything inside it!
            if (-not [string]::IsNullOrWhiteSpace($script:AppDirectory)) {
                $appPrefix = $script:AppDirectory + [System.IO.Path]::DirectorySeparatorChar
                if ($dir.FullName.StartsWith($appPrefix, [System.StringComparison]::OrdinalIgnoreCase) -or $dir.FullName -ieq $script:AppDirectory) {
                    continue
                }
            }
            # Do not touch excluded dirs
            $isExcludedDir = $false
            foreach ($ex in $script:ExcludedDirNames) {
                if ($dir.Name -eq $ex) { $isExcludedDir = $true; break }
            }
            if ($isExcludedDir) { continue }

            $remainingItems = Get-ChildItem -Path $dir.FullName -Force -ErrorAction SilentlyContinue
            if ($remainingItems.Count -eq 0) {
                try {
                    Remove-Item -Path $dir.FullName -Force -Recurse -ErrorAction Stop
                    $cleanedDirsCount++
                } catch {
                    # Ignore directory removal errors
                }
            }
        }
    }

    # Save to Undo history
    if ($movedFiles.Count -gt 0) {
        $script:LastMovedFiles = $movedFiles
        $script:LastTargetFolder = $destinationPath
        $btnUndo.Enabled = $true
        $btnUndo.Text = "Undo Last Move ($($movedFiles.Count))"
    }

    # Refresh
    Update-FolderFiles

    $msg = "Successfully organized $($movedFiles.Count) file(s) into:`n$destinationPath"
    if ($cleanedDirsCount -gt 0) {
        $msg += "`n`nCleaned up $cleanedDirsCount empty sub-folder(s)."
    }
    if ($errors.Count -gt 0) {
        $msg += "`n`nErrors encountered on $($errors.Count) file(s):`n" + ($errors -join "`n")
    }

    [System.Windows.Forms.MessageBox]::Show($msg, "Organization Complete", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information)
})

# Undo Action
$btnUndo.Add_Click({
    if ($script:LastMovedFiles.Count -eq 0) { return }

    $restored = 0
    foreach ($item in $script:LastMovedFiles) {
        if (Test-Path -Path $item.NewPath) {
            try {
                # Ensure original directory exists if it was in a subfolder
                $origDir = [System.IO.Path]::GetDirectoryName($item.OriginalPath)
                if (-not (Test-Path -Path $origDir)) {
                    [void](New-Item -ItemType Directory -Path $origDir -Force)
                }
                Move-Item -Path $item.NewPath -Destination $item.OriginalPath -Force -ErrorAction Stop
                $restored++
            } catch {
                # Ignore individual move errors on undo
            }
        }
    }

    [System.Windows.Forms.MessageBox]::Show("Restored $restored file(s) back to original locations.", "Undo Complete", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information)
    $script:LastMovedFiles = @()
    $btnUndo.Enabled = $false
    $btnUndo.Text = "Undo Last Move"
    Update-FolderFiles
})

# Initial Scan
Update-FolderFiles

# Show Form
[void]$form.ShowDialog()

<#
.SYNOPSIS
    Windows File Organizer - Native Interactive Desktop App
.DESCRIPTION
    Scans ANY directory the user specifies (Desktop, Downloads, Documents, or any folder),
    auto-detects files matching the selected category (Pictures, Documents, Shortcuts, Installers,
    Archives, Videos, Audio, Code, or All Loose Files), and organizes them into ANY destination
    folder the user chooses with 1-Click Undo support.
#>

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

[System.Windows.Forms.Application]::EnableVisualStyles()

# Global State
$script:DesktopPath = [Environment]::GetFolderPath([Environment+SpecialFolder]::Desktop)
$script:DownloadsPath = (New-Object -ComObject Shell.Application).Namespace('shell:Downloads').Self.Path
if (-not $script:DownloadsPath) {
    $script:DownloadsPath = Join-Path $env:USERPROFILE "Downloads"
}
$script:DocumentsPath = [Environment]::GetFolderPath([Environment+SpecialFolder]::MyDocuments)

$script:CurrentSourcePath = $script:DesktopPath
$script:LastMovedFiles = @()
$script:LastTargetFolder = ""
$script:CurrentFiles = @()

# File Categories Definition
$script:Categories = @(
    @{
        Name = "Pictures & Screenshots (.png, .jpg, .svg, .gif...)"
        Extensions = @(".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg", ".ico", ".tiff", ".psd")
        Folder = "Pictures"
    },
    @{
        Name = "Documents & PDFs (.pdf, .docx, .xlsx, .txt...)"
        Extensions = @(".pdf", ".docx", ".doc", ".txt", ".xlsx", ".xls", ".csv", ".pptx", ".ppt", ".md", ".rtf")
        Folder = "Documents"
    },
    @{
        Name = "Shortcuts & Web Links (.lnk, .url)"
        Extensions = @(".lnk", ".url", ".desktop", ".website")
        Folder = "Shortcuts"
    },
    @{
        Name = "Installers & Programs (.exe, .msi, .bat, .cmd...)"
        Extensions = @(".exe", ".msi", ".bat", ".cmd", ".ps1", ".iso", ".bin")
        Folder = "Installers"
    },
    @{
        Name = "Archives & Zips (.zip, .rar, .7z, .tar.gz...)"
        Extensions = @(".zip", ".rar", ".7z", ".tar", ".gz", ".bz2", ".xz")
        Folder = "Archives"
    },
    @{
        Name = "Videos & Recordings (.mp4, .mkv, .mov, .avi...)"
        Extensions = @(".mp4", ".mkv", ".mov", ".avi", ".wmv", ".webm", ".flv")
        Folder = "Videos"
    },
    @{
        Name = "Music & Audio (.mp3, .wav, .flac, .m4a...)"
        Extensions = @(".mp3", ".wav", ".flac", ".m4a", ".aac", ".ogg", ".wma")
        Folder = "Audio"
    },
    @{
        Name = "Code & Dev Files (.ts, .js, .py, .json, .html...)"
        Extensions = @(".ts", ".js", ".py", ".json", ".html", ".css", ".sql", ".cpp", ".cs", ".java", ".xml", ".log")
        Folder = "Code"
    },
    @{
        Name = "All Loose Files (Clean entire directory)"
        Extensions = @("*")
        Folder = "Cleaned Files"
    }
)

# Helper: Format Bytes
function Format-FileSize([long]$Bytes) {
    if ($Bytes -lt 1024) { return "$Bytes B" }
    elseif ($Bytes -lt 1MB) { return "{0:N1} KB" -f ($Bytes / 1KB) }
    elseif ($Bytes -lt 1GB) { return "{0:N1} MB" -f ($Bytes / 1MB) }
    else { return "{0:N2} GB" -f ($Bytes / 1GB) }
}

# Main Form
$form = New-Object System.Windows.Forms.Form
$form.Text = "Windows File Organizer - Target Any Directory"
$form.Size = New-Object System.Drawing.Size(700, 710)
$form.StartPosition = "CenterScreen"
$form.BackColor = [System.Drawing.Color]::FromArgb(248, 249, 250)
$form.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$form.FormBorderStyle = [System.Windows.Forms.FormBorderStyle]::FixedDialog
$form.MaximizeBox = $false

# Header Panel
$headerPanel = New-Object System.Windows.Forms.Panel
$headerPanel.Size = New-Object System.Drawing.Size(700, 70)
$headerPanel.Location = New-Object System.Drawing.Point(0, 0)
$headerPanel.BackColor = [System.Drawing.Color]::FromArgb(24, 76, 120)
$form.Controls.Add($headerPanel)

$lblTitle = New-Object System.Windows.Forms.Label
$lblTitle.Text = "Windows File Organizer"
$lblTitle.Font = New-Object System.Drawing.Font("Segoe UI Semibold", 13, [System.Drawing.FontStyle]::Bold)
$lblTitle.ForeColor = [System.Drawing.Color]::White
$lblTitle.Location = New-Object System.Drawing.Point(20, 12)
$lblTitle.AutoSize = $true
$headerPanel.Controls.Add($lblTitle)

$lblSubtitle = New-Object System.Windows.Forms.Label
$lblSubtitle.Text = "Scan any directory on your computer and organize into any destination folder"
$lblSubtitle.Font = New-Object System.Drawing.Font("Segoe UI", 8.5)
$lblSubtitle.ForeColor = [System.Drawing.Color]::FromArgb(200, 220, 240)
$lblSubtitle.Location = New-Object System.Drawing.Point(21, 40)
$lblSubtitle.AutoSize = $true
$headerPanel.Controls.Add($lblSubtitle)

# Section 0: Source Directory Selection
$grpSource = New-Object System.Windows.Forms.GroupBox
$grpSource.Text = "Source Directory to Scan"
$grpSource.Font = New-Object System.Drawing.Font("Segoe UI Semibold", 9)
$grpSource.Location = New-Object System.Drawing.Point(20, 80)
$grpSource.Size = New-Object System.Drawing.Size(645, 80)
$form.Controls.Add($grpSource)

$txtSourceFolder = New-Object System.Windows.Forms.TextBox
$txtSourceFolder.Location = New-Object System.Drawing.Point(15, 25)
$txtSourceFolder.Size = New-Object System.Drawing.Size(370, 26)
$txtSourceFolder.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$txtSourceFolder.Text = $script:CurrentSourcePath
$grpSource.Controls.Add($txtSourceFolder)

$btnBrowseSource = New-Object System.Windows.Forms.Button
$btnBrowseSource.Text = "Browse..."
$btnBrowseSource.Font = New-Object System.Drawing.Font("Segoe UI", 8.5)
$btnBrowseSource.Location = New-Object System.Drawing.Point(395, 24)
$btnBrowseSource.Size = New-Object System.Drawing.Size(80, 28)
$grpSource.Controls.Add($btnBrowseSource)

$btnPresetDesktop = New-Object System.Windows.Forms.Button
$btnPresetDesktop.Text = "Desktop"
$btnPresetDesktop.Font = New-Object System.Drawing.Font("Segoe UI", 8)
$btnPresetDesktop.Location = New-Object System.Drawing.Point(480, 24)
$btnPresetDesktop.Size = New-Object System.Drawing.Size(70, 28)
$grpSource.Controls.Add($btnPresetDesktop)

$btnPresetDownloads = New-Object System.Windows.Forms.Button
$btnPresetDownloads.Text = "Downloads"
$btnPresetDownloads.Font = New-Object System.Drawing.Font("Segoe UI", 8)
$btnPresetDownloads.Location = New-Object System.Drawing.Point(555, 24)
$btnPresetDownloads.Size = New-Object System.Drawing.Size(78, 28)
$grpSource.Controls.Add($btnPresetDownloads)

# Step 1: Pick File Type GroupBox
$grpStep1 = New-Object System.Windows.Forms.GroupBox
$grpStep1.Text = "Step 1: Pick the File Type to Organize"
$grpStep1.Font = New-Object System.Drawing.Font("Segoe UI Semibold", 9)
$grpStep1.Location = New-Object System.Drawing.Point(20, 168)
$grpStep1.Size = New-Object System.Drawing.Size(645, 75)
$form.Controls.Add($grpStep1)

$cboType = New-Object System.Windows.Forms.ComboBox
$cboType.DropDownStyle = [System.Windows.Forms.ComboBoxStyle]::DropDownList
$cboType.Font = New-Object System.Drawing.Font("Segoe UI", 9.5)
$cboType.Location = New-Object System.Drawing.Point(15, 28)
$cboType.Size = New-Object System.Drawing.Size(460, 28)
foreach ($cat in $script:Categories) {
    [void]$cboType.Items.Add($cat.Name)
}
$cboType.SelectedIndex = 0
$grpStep1.Controls.Add($cboType)

$btnRefresh = New-Object System.Windows.Forms.Button
$btnRefresh.Text = "Scan Folder"
$btnRefresh.Font = New-Object System.Drawing.Font("Segoe UI", 8.5)
$btnRefresh.Location = New-Object System.Drawing.Point(485, 27)
$btnRefresh.Size = New-Object System.Drawing.Size(148, 29)
$btnRefresh.BackColor = [System.Drawing.Color]::FromArgb(235, 238, 242)
$grpStep1.Controls.Add($btnRefresh)

# Step 2: Matching Files GroupBox
$grpStep2 = New-Object System.Windows.Forms.GroupBox
$grpStep2.Text = "Step 2: Auto-Selected Files"
$grpStep2.Font = New-Object System.Drawing.Font("Segoe UI Semibold", 9)
$grpStep2.Location = New-Object System.Drawing.Point(20, 250)
$grpStep2.Size = New-Object System.Drawing.Size(645, 220)
$form.Controls.Add($grpStep2)

$chkListFiles = New-Object System.Windows.Forms.CheckedListBox
$chkListFiles.Location = New-Object System.Drawing.Point(15, 25)
$chkListFiles.Size = New-Object System.Drawing.Size(615, 150)
$chkListFiles.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$chkListFiles.CheckOnClick = $true
$grpStep2.Controls.Add($chkListFiles)

$lblCount = New-Object System.Windows.Forms.Label
$lblCount.Text = "0 files selected"
$lblCount.Font = New-Object System.Drawing.Font("Segoe UI", 8.5)
$lblCount.ForeColor = [System.Drawing.Color]::FromArgb(70, 80, 90)
$lblCount.Location = New-Object System.Drawing.Point(15, 186)
$lblCount.AutoSize = $true
$grpStep2.Controls.Add($lblCount)

$btnSelectAll = New-Object System.Windows.Forms.Button
$btnSelectAll.Text = "Select All"
$btnSelectAll.Font = New-Object System.Drawing.Font("Segoe UI", 8.5)
$btnSelectAll.Location = New-Object System.Drawing.Point(445, 182)
$btnSelectAll.Size = New-Object System.Drawing.Size(90, 26)
$grpStep2.Controls.Add($btnSelectAll)

$btnDeselectAll = New-Object System.Windows.Forms.Button
$btnDeselectAll.Text = "Clear All"
$btnDeselectAll.Font = New-Object System.Drawing.Font("Segoe UI", 8.5)
$btnDeselectAll.Location = New-Object System.Drawing.Point(540, 182)
$btnDeselectAll.Size = New-Object System.Drawing.Size(90, 26)
$grpStep2.Controls.Add($btnDeselectAll)

# Step 3: Destination Folder GroupBox
$grpStep3 = New-Object System.Windows.Forms.GroupBox
$grpStep3.Text = "Step 3: Choose Any Destination Folder"
$grpStep3.Font = New-Object System.Drawing.Font("Segoe UI Semibold", 9)
$grpStep3.Location = New-Object System.Drawing.Point(20, 478)
$grpStep3.Size = New-Object System.Drawing.Size(645, 85)
$form.Controls.Add($grpStep3)

$lblFolderPrefix = New-Object System.Windows.Forms.Label
$lblFolderPrefix.Text = "Destination Path (relative subfolder or full absolute path e.g. D:\Sorted):"
$lblFolderPrefix.Font = New-Object System.Drawing.Font("Segoe UI", 8)
$lblFolderPrefix.Location = New-Object System.Drawing.Point(15, 22)
$lblFolderPrefix.AutoSize = $true
$grpStep3.Controls.Add($lblFolderPrefix)

$txtTargetFolder = New-Object System.Windows.Forms.TextBox
$txtTargetFolder.Location = New-Object System.Drawing.Point(15, 45)
$txtTargetFolder.Size = New-Object System.Drawing.Size(515, 26)
$txtTargetFolder.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$txtTargetFolder.Text = "Pictures"
$grpStep3.Controls.Add($txtTargetFolder)

$btnBrowseTargetFolder = New-Object System.Windows.Forms.Button
$btnBrowseTargetFolder.Text = "Browse..."
$btnBrowseTargetFolder.Font = New-Object System.Drawing.Font("Segoe UI", 8.5)
$btnBrowseTargetFolder.Location = New-Object System.Drawing.Point(540, 44)
$btnBrowseTargetFolder.Size = New-Object System.Drawing.Size(90, 28)
$grpStep3.Controls.Add($btnBrowseTargetFolder)

# Bottom Action Buttons
$btnOrganize = New-Object System.Windows.Forms.Button
$btnOrganize.Text = "Organize Files into Folder"
$btnOrganize.Font = New-Object System.Drawing.Font("Segoe UI Semibold", 10, [System.Drawing.FontStyle]::Bold)
$btnOrganize.BackColor = [System.Drawing.Color]::FromArgb(16, 124, 65)
$btnOrganize.ForeColor = [System.Drawing.Color]::White
$btnOrganize.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$btnOrganize.Location = New-Object System.Drawing.Point(20, 575)
$btnOrganize.Size = New-Object System.Drawing.Size(465, 42)
$form.Controls.Add($btnOrganize)

$btnUndo = New-Object System.Windows.Forms.Button
$btnUndo.Text = "Undo Last Move"
$btnUndo.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$btnUndo.Location = New-Object System.Drawing.Point(495, 575)
$btnUndo.Size = New-Object System.Drawing.Size(170, 42)
$btnUndo.Enabled = $false
$form.Controls.Add($btnUndo)

# Status Label
$lblStatus = New-Object System.Windows.Forms.Label
$lblStatus.Text = "Ready. Pick a file type above."
$lblStatus.Font = New-Object System.Drawing.Font("Segoe UI", 8.5)
$lblStatus.ForeColor = [System.Drawing.Color]::FromArgb(100, 100, 100)
$lblStatus.Location = New-Object System.Drawing.Point(22, 628)
$lblStatus.AutoSize = $true
$form.Controls.Add($lblStatus)

# Function: Scan Active Source Folder and Populate CheckedListBox
function Update-FolderFiles {
    $chkListFiles.Items.Clear()
    $script:CurrentFiles = @()

    $src = $txtSourceFolder.Text.Trim()
    if ([string]::IsNullOrWhiteSpace($src) -or (-not (Test-Path -Path $src))) {
        $lblStatus.Text = "Source directory not found: $src"
        $lblCount.Text = "0 files found"
        $btnOrganize.Enabled = $false
        return
    }
    $script:CurrentSourcePath = $src

    $selectedCategory = $script:Categories[$cboType.SelectedIndex]
    $txtTargetFolder.Text = $selectedCategory.Folder

    # Get loose files in current source directory
    $allFiles = Get-ChildItem -Path $script:CurrentSourcePath -File -ErrorAction SilentlyContinue

    $matchingFiles = @()
    foreach ($file in $allFiles) {
        $ext = $file.Extension.ToLower()
        if ($selectedCategory.Extensions -contains "*" -or $selectedCategory.Extensions -contains $ext) {
            $matchingFiles += $file
        }
    }

    $script:CurrentFiles = $matchingFiles
    $totalSize = 0

    foreach ($file in $matchingFiles) {
        $sizeStr = Format-FileSize $file.Length
        $displayText = "$($file.Name)  ($sizeStr)"
        [void]$chkListFiles.Items.Add($displayText, $true)
        $totalSize += $file.Length
    }

    $count = $matchingFiles.Count
    $sizeFormatted = Format-FileSize $totalSize
    $lblCount.Text = "$count of $count files selected ($sizeFormatted)"
    $btnOrganize.Text = "Organize $count File(s) into Folder"
    $btnOrganize.Enabled = ($count -gt 0)
    $lblStatus.Text = "Scanned $script:CurrentSourcePath - found $count matching loose files."
}

# Browse Source Directory
$btnBrowseSource.Add_Click({
    $dlg = New-Object System.Windows.Forms.FolderBrowserDialog
    $dlg.SelectedPath = $script:CurrentSourcePath
    $dlg.Description = "Select ANY Directory to Scan"
    if ($dlg.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
        $txtSourceFolder.Text = $dlg.SelectedPath
        Update-FolderFiles
    }
})

# Quick Source Presets
$btnPresetDesktop.Add_Click({
    $txtSourceFolder.Text = $script:DesktopPath
    Update-FolderFiles
})

$btnPresetDownloads.Add_Click({
    $txtSourceFolder.Text = $script:DownloadsPath
    Update-FolderFiles
})

# ComboBox selection change event
$cboType.Add_SelectedIndexChanged({
    Update-FolderFiles
})

# Scan / Refresh Button
$btnRefresh.Add_Click({
    Update-FolderFiles
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
$btnBrowseTargetFolder.Add_Click({
    $dlg = New-Object System.Windows.Forms.FolderBrowserDialog
    $dlg.SelectedPath = $script:CurrentSourcePath
    $dlg.Description = "Select Destination Folder"
    if ($dlg.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
        $chosen = $dlg.SelectedPath
        # If inside source folder, show relative or absolute
        if ($chosen.StartsWith($script:CurrentSourcePath, [System.StringComparison]::OrdinalIgnoreCase)) {
            $rel = $chosen.Substring($script:CurrentSourcePath.Length).TrimStart('\', '/')
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
        $destinationPath = Join-Path $script:CurrentSourcePath $folderInput
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

    # Move selected files
    $movedFiles = @()
    $errors = @()

    foreach ($idx in $checkedIndices) {
        $file = $script:CurrentFiles[$idx]
        $destFilePath = Join-Path $destinationPath $file.Name

        # Avoid moving into self
        if ($file.FullName -eq $destFilePath) { continue }

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

    # Save to Undo history
    if ($movedFiles.Count -gt 0) {
        $script:LastMovedFiles = $movedFiles
        $script:LastTargetFolder = $destinationPath
        $btnUndo.Enabled = $true
        $btnUndo.Text = "Undo Last Move ($($movedFiles.Count))"
    }

    # Refresh
    Update-FolderFiles

    $msg = "Successfully organized $($movedFiles.Count) file(s) from:`n$script:CurrentSourcePath`n`ninto:`n$destinationPath"
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
                Move-Item -Path $item.NewPath -Destination $item.OriginalPath -Force -ErrorAction Stop
                $restored++
            } catch {
                # Ignore individual move errors on undo
            }
        }
    }

    [System.Windows.Forms.MessageBox]::Show("Restored $restored file(s) back to:`n$script:CurrentSourcePath", "Undo Complete", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information)
    $script:LastMovedFiles = @()
    $btnUndo.Enabled = $false
    $btnUndo.Text = "Undo Last Move"
    Update-FolderFiles
})

# Initial Scan
Update-FolderFiles

# Show Form
[void]$form.ShowDialog()

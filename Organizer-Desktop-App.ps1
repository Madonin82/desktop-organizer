# High-DPI Awareness for Windows 10 & 11 (resolves blurry/pixelated window on 4K displays)
try {
    # Per-Monitor V2 DPI awareness (Windows 10 1703+)
    $shcore = Add-Type -MemberDefinition '[DllImport("Shcore.dll")] public static extern int SetProcessDpiAwareness(int awareness);' -Name 'ShcoreDpi' -Namespace 'DpiUtil' -PassThru -ErrorAction SilentlyContinue
    if ($shcore) { [void]$shcore::SetProcessDpiAwareness(2) }
} catch {
    try {
        $user32 = Add-Type -MemberDefinition '[DllImport("user32.dll")] public static extern bool SetProcessDPIAware();' -Name 'User32Dpi' -Namespace 'DpiUtil' -PassThru -ErrorAction SilentlyContinue
        if ($user32) { [void]$user32::SetProcessDPIAware() }
    } catch {}
}

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

[System.Windows.Forms.Application]::EnableVisualStyles()

# Global State
$script:DesktopPath = [Environment]::GetFolderPath([Environment+SpecialFolder]::Desktop)
$script:LastMovedFiles = @()
$script:LastTargetFolder = ""

# Define File Type Categories
$script:Categories = @(
    @{
        Name = "Pictures & Screenshots"
        Folder = "Pictures"
        Extensions = @(".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".ico", ".svg", ".tiff")
    },
    @{
        Name = "Shortcuts & App Icons"
        Folder = "Shortcuts"
        Extensions = @(".lnk", ".url")
    },
    @{
        Name = "Documents & PDFs"
        Folder = "Documents"
        Extensions = @(".pdf", ".docx", ".doc", ".txt", ".xlsx", ".xls", ".csv", ".pptx", ".ppt", ".md", ".rtf")
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
        Name = "All Loose Desktop Files"
        Folder = "Desktop Cleanup"
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

# Main Form
$form = New-Object System.Windows.Forms.Form
$form.Text = "Windows Desktop File Organizer"
$form.AutoScaleMode = [System.Windows.Forms.AutoScaleMode]::Font
$form.Size = New-Object System.Drawing.Size(680, 640)
$form.StartPosition = "CenterScreen"
$form.BackColor = [System.Drawing.Color]::FromArgb(248, 249, 250)
$form.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$form.FormBorderStyle = [System.Windows.Forms.FormBorderStyle]::FixedDialog
$form.MaximizeBox = $false

# Header Panel
$headerPanel = New-Object System.Windows.Forms.Panel
$headerPanel.Size = New-Object System.Drawing.Size(680, 75)
$headerPanel.Location = New-Object System.Drawing.Point(0, 0)
$headerPanel.BackColor = [System.Drawing.Color]::FromArgb(24, 76, 120)
$form.Controls.Add($headerPanel)

$lblTitle = New-Object System.Windows.Forms.Label
$lblTitle.Text = "Windows Desktop File Organizer"
$lblTitle.Font = New-Object System.Drawing.Font("Segoe UI Semibold", 13, [System.Drawing.FontStyle]::Bold)
$lblTitle.ForeColor = [System.Drawing.Color]::White
$lblTitle.Location = New-Object System.Drawing.Point(20, 12)
$lblTitle.AutoSize = $true
$headerPanel.Controls.Add($lblTitle)

$lblSubtitle = New-Object System.Windows.Forms.Label
$lblSubtitle.Text = "Target: $script:DesktopPath"
$lblSubtitle.Font = New-Object System.Drawing.Font("Segoe UI", 8.5)
$lblSubtitle.ForeColor = [System.Drawing.Color]::FromArgb(200, 220, 240)
$lblSubtitle.Location = New-Object System.Drawing.Point(21, 40)
$lblSubtitle.AutoSize = $true
$headerPanel.Controls.Add($lblSubtitle)

# Step 1: Pick File Type GroupBox
$grpStep1 = New-Object System.Windows.Forms.GroupBox
$grpStep1.Text = "Step 1: Pick the File Type to Organize"
$grpStep1.Font = New-Object System.Drawing.Font("Segoe UI Semibold", 9)
$grpStep1.Location = New-Object System.Drawing.Point(20, 85)
$grpStep1.Size = New-Object System.Drawing.Size(625, 80)
$form.Controls.Add($grpStep1)

$cboType = New-Object System.Windows.Forms.ComboBox
$cboType.DropDownStyle = [System.Windows.Forms.ComboBoxStyle]::DropDownList
$cboType.Font = New-Object System.Drawing.Font("Segoe UI", 9.5)
$cboType.Location = New-Object System.Drawing.Point(15, 30)
$cboType.Size = New-Object System.Drawing.Size(380, 28)
foreach ($cat in $script:Categories) {
    [void]$cboType.Items.Add($cat.Name)
}
$cboType.SelectedIndex = 0
$grpStep1.Controls.Add($cboType)

$btnRefresh = New-Object System.Windows.Forms.Button
$btnRefresh.Text = "Scan Desktop"
$btnRefresh.Font = New-Object System.Drawing.Font("Segoe UI", 8.5)
$btnRefresh.Location = New-Object System.Drawing.Point(405, 29)
$btnRefresh.Size = New-Object System.Drawing.Size(100, 29)
$btnRefresh.BackColor = [System.Drawing.Color]::FromArgb(235, 238, 242)
$btnRefresh.FlatStyle = [System.Windows.Forms.FlatStyle]::Standard
$grpStep1.Controls.Add($btnRefresh)

# Step 2: Matching Files GroupBox
$grpStep2 = New-Object System.Windows.Forms.GroupBox
$grpStep2.Text = "Step 2: Auto-Selected Desktop Files"
$grpStep2.Font = New-Object System.Drawing.Font("Segoe UI Semibold", 9)
$grpStep2.Location = New-Object System.Drawing.Point(20, 175)
$grpStep2.Size = New-Object System.Drawing.Size(625, 240)
$form.Controls.Add($grpStep2)

$chkListFiles = New-Object System.Windows.Forms.CheckedListBox
$chkListFiles.Location = New-Object System.Drawing.Point(15, 25)
$chkListFiles.Size = New-Object System.Drawing.Size(595, 170)
$chkListFiles.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$chkListFiles.CheckOnClick = $true
$grpStep2.Controls.Add($chkListFiles)

$lblCount = New-Object System.Windows.Forms.Label
$lblCount.Text = "0 files selected"
$lblCount.Font = New-Object System.Drawing.Font("Segoe UI", 8.5)
$lblCount.ForeColor = [System.Drawing.Color]::FromArgb(70, 80, 90)
$lblCount.Location = New-Object System.Drawing.Point(15, 205)
$lblCount.AutoSize = $true
$grpStep2.Controls.Add($lblCount)

$btnSelectAll = New-Object System.Windows.Forms.Button
$btnSelectAll.Text = "Select All"
$btnSelectAll.Font = New-Object System.Drawing.Font("Segoe UI", 8.5)
$btnSelectAll.Location = New-Object System.Drawing.Point(425, 201)
$btnSelectAll.Size = New-Object System.Drawing.Size(85, 26)
$grpStep2.Controls.Add($btnSelectAll)

$btnDeselectAll = New-Object System.Windows.Forms.Button
$btnDeselectAll.Text = "Clear All"
$btnDeselectAll.Font = New-Object System.Drawing.Font("Segoe UI", 8.5)
$btnDeselectAll.Location = New-Object System.Drawing.Point(520, 201)
$btnDeselectAll.Size = New-Object System.Drawing.Size(85, 26)
$grpStep2.Controls.Add($btnDeselectAll)

# Step 3: Destination Folder GroupBox
$grpStep3 = New-Object System.Windows.Forms.GroupBox
$grpStep3.Text = "Step 3: Choose Destination Folder"
$grpStep3.Font = New-Object System.Drawing.Font("Segoe UI Semibold", 9)
$grpStep3.Location = New-Object System.Drawing.Point(20, 425)
$grpStep3.Size = New-Object System.Drawing.Size(625, 90)
$form.Controls.Add($grpStep3)

$lblFolderPrefix = New-Object System.Windows.Forms.Label
$lblFolderPrefix.Text = "Folder Name:"
$lblFolderPrefix.Font = New-Object System.Drawing.Font("Segoe UI", 8.5)
$lblFolderPrefix.Location = New-Object System.Drawing.Point(15, 26)
$lblFolderPrefix.AutoSize = $true
$grpStep3.Controls.Add($lblFolderPrefix)

$txtTargetFolder = New-Object System.Windows.Forms.TextBox
$txtTargetFolder.Location = New-Object System.Drawing.Point(15, 48)
$txtTargetFolder.Size = New-Object System.Drawing.Size(430, 26)
$txtTargetFolder.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$txtTargetFolder.Text = "Pictures"
$grpStep3.Controls.Add($txtTargetFolder)

$btnBrowseFolder = New-Object System.Windows.Forms.Button
$btnBrowseFolder.Text = "Browse..."
$btnBrowseFolder.Font = New-Object System.Drawing.Font("Segoe UI", 8.5)
$btnBrowseFolder.Location = New-Object System.Drawing.Point(455, 47)
$btnBrowseFolder.Size = New-Object System.Drawing.Size(85, 27)
$grpStep3.Controls.Add($btnBrowseFolder)

# Bottom Action Buttons
$btnOrganize = New-Object System.Windows.Forms.Button
$btnOrganize.Text = "Organize Files into Folder"
$btnOrganize.Font = New-Object System.Drawing.Font("Segoe UI Semibold", 10, [System.Drawing.FontStyle]::Bold)
$btnOrganize.BackColor = [System.Drawing.Color]::FromArgb(16, 124, 65)
$btnOrganize.ForeColor = [System.Drawing.Color]::White
$btnOrganize.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$btnOrganize.Location = New-Object System.Drawing.Point(20, 530)
$btnOrganize.Size = New-Object System.Drawing.Size(450, 42)
$form.Controls.Add($btnOrganize)

$btnUndo = New-Object System.Windows.Forms.Button
$btnUndo.Text = "Undo Last Move"
$btnUndo.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$btnUndo.Location = New-Object System.Drawing.Point(480, 530)
$btnUndo.Size = New-Object System.Drawing.Size(165, 42)
$btnUndo.Enabled = $false
$form.Controls.Add($btnUndo)

# Status Label
$lblStatus = New-Object System.Windows.Forms.Label
$lblStatus.Text = "Ready. Pick a file type above."
$lblStatus.Font = New-Object System.Drawing.Font("Segoe UI", 8.5)
$lblStatus.ForeColor = [System.Drawing.Color]::FromArgb(100, 100, 100)
$lblStatus.Location = New-Object System.Drawing.Point(22, 578)
$lblStatus.AutoSize = $true
$form.Controls.Add($lblStatus)

# Storage for matching file objects
$script:CurrentFiles = @()

# Function: Scan Desktop and Populate CheckedListBox
function Update-DesktopFiles {
    $chkListFiles.Items.Clear()
    $script:CurrentFiles = @()

    $selectedCategory = $script:Categories[$cboType.SelectedIndex]
    $txtTargetFolder.Text = $selectedCategory.Folder

    # Get loose files on Desktop (not in subfolders)
    $allDesktopFiles = Get-ChildItem -Path $script:DesktopPath -File -ErrorAction SilentlyContinue

    $matchingFiles = @()
    foreach ($file in $allDesktopFiles) {
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
        # Auto-check all matching files by default
        [void]$chkListFiles.Items.Add($displayText, $true)
        $totalSize += $file.Length
    }

    $count = $matchingFiles.Count
    $sizeFormatted = Format-FileSize $totalSize
    $lblCount.Text = "$count of $count files selected ($sizeFormatted)"
    $btnOrganize.Text = "Organize $count File(s) into Folder"
    $btnOrganize.Enabled = ($count -gt 0)
    $lblStatus.Text = "Found $count matching files on Desktop."
}

# ComboBox selection change event
$cboType.Add_SelectedIndexChanged({
    Update-DesktopFiles
})

# Scan / Refresh Button
$btnRefresh.Add_Click({
    Update-DesktopFiles
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

# Browse Folder Dialog
$btnBrowseFolder.Add_Click({
    $dlg = New-Object System.Windows.Forms.FolderBrowserDialog
    $dlg.SelectedPath = $script:DesktopPath
    $dlg.Description = "Select Destination Folder on Desktop"
    if ($dlg.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
        $chosen = $dlg.SelectedPath
        # If inside Desktop, make relative
        if ($chosen.StartsWith($script:DesktopPath, [System.StringComparison]::OrdinalIgnoreCase)) {
            $rel = $chosen.Substring($script:DesktopPath.Length).TrimStart('\', '/')
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
        $destinationPath = Join-Path $script:DesktopPath $folderInput
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
    Update-DesktopFiles

    $msg = "Successfully organized $($movedFiles.Count) file(s) into:`n$destinationPath"
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

    [System.Windows.Forms.MessageBox]::Show("Restored $restored file(s) back to your Desktop.", "Undo Complete", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information)
    $script:LastMovedFiles = @()
    $btnUndo.Enabled = $false
    $btnUndo.Text = "Undo Last Move"
    Update-DesktopFiles
})

# Initial Scan
Update-DesktopFiles

# Show Form
[void]$form.ShowDialog()

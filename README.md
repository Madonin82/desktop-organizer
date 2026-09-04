# Windows Folder & Desktop File Organizer

A fast, visual tool to organize your Windows files, icons, and shortcuts into designated folders by file type.

### 🌟 Portable "Drop-In" Mode (Targets Parent Folder)
You can drop this entire application folder into **ANY folder you want cleaned** (for example, drop it into `C:\clean these up\`).

When you launch `Organizer-Desktop-App.bat`:
- It **automatically targets the parent folder** it was dropped into (`C:\clean these up\`, one level up in hierarchy)
- It **safely protects and excludes itself** (its own files, scripts, and folder will NEVER be moved or touched)
- It scans the parent folder and **all sub-folders** (recursive scanning)
- It groups and organizes files cleanly into destination folders (e.g. `C:\clean these up\Pictures\`)
- Safely handles duplicate filenames (auto-numbers duplicates instead of overwriting)
- Provides 1-click **Undo** to restore files back to their exact original locations

---

## How to Run on Windows

### Option 1: Instant Native Windows App (Zero Setup Required) ⭐ **Recommended**
No Node.js, npm, or installation required! Uses Windows' built-in interface.

1. Copy or drop this folder into the messy directory you want to clean up (or keep it anywhere).
2. Double-click **`Organizer-Desktop-App.bat`**
3. The visual window opens:
   - Shows active folder location (defaults to where the script is located, or switch to Desktop/Custom).
   - **Step 1:** Pick the file type (Pictures, Documents, Shortcuts, Installers, Videos, Archives, All Files, etc.)
   - **Sub-folder toggle:** Checkbox to *"Include all sub-folders (clean up nested files)"* is enabled by default.
   - **Step 2:** All matching files (including relative paths of files in subfolders) are auto-detected and selected.
   - **Step 3:** Choose destination folder name (e.g. `Pictures`, `Documents`, `Cleaned Files`).
   - *(Optional)* Check *"Remove empty sub-folders after move"* to flatten and clean up empty directories.
   - Click **"Organize Files into Folder"** — done!
   - Includes **"Undo Last Move"** to restore all moved files to their original directories.

---

### Option 2: Run Full Web Application (Interactive Dashboard)
If you want to use the full React/web interface:

1. Double-click **`run.bat`**
   - It will automatically install dependencies and launch the browser at `http://localhost:3000`.
   - *(Note: Requires Node.js installed on your computer. If Node.js is not installed, `run.bat` will automatically launch Option 1 for you).*

Or run manually from terminal:
```bash
npm install
npm run dev
```

---

### Why opening `index.html` directly didn't work:
Modern web applications written in React & TypeScript cannot be opened via `file:///index.html` because modern browsers block JavaScript modules from loading directly from the hard drive for security reasons (CORS policy). Running `Organizer-Desktop-App.bat` or `run.bat` solves this!

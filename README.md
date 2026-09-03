# Windows Desktop File Organizer

A fast, visual tool to organize your Windows desktop files, icons, and shortcuts into designated folders by file type.

## How to Run on Windows

You have two easy ways to run this:

---

### Option 1: Instant Native Windows App (Zero Setup Required) ⭐ **Recommended**
No Node.js, npm, or installation required! Uses Windows' built-in interface.

1. Open your downloaded folder in File Explorer.
2. Double-click **`Organizer-Desktop-App.bat`**
3. The visual window opens:
   - **Step 1:** Pick the file type (Pictures, Documents, Shortcuts, Installers, Videos, Archives, etc.)
   - **Step 2:** All matching desktop files are auto-detected and selected with checkboxes.
   - **Step 3:** Enter or browse to your destination folder (e.g. `Pictures`).
   - Click **"Organize Files into Folder"** — done!
   - Includes an **"Undo Last Move"** button to restore files if needed.

---

### Option 2: Run Full Web Application (Interactive Dashboard)
If you want to use the full React/web interface:

1. Double-click **`run.bat`**
   - It will automatically install dependencies and launch the browser at `http://localhost:3000`.
   - *(Note: Requires Node.js installed on your computer. If Node.js is not installed, `run.bat` will automatically launch Option 1 for you).*

Or run manually from the terminal:
```bash
npm install
npm run dev
```

---

### Why opening `index.html` directly didn't work:
Modern web applications written in React & TypeScript cannot be opened via `file:///index.html` because modern browsers block JavaScript modules from loading directly from the hard drive for security reasons (CORS policy). Running `run.bat` or `Organizer-Desktop-App.bat` solves this!

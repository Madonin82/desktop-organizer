import React, { useState } from 'react';
import {
  Terminal,
  Download,
  Copy,
  Check,
  Code2,
  FileCode,
  FolderTree,
  Laptop,
  FolderGit2,
  Info,
} from 'lucide-react';
import { FileCategoryKey } from '../types';
import { generateBatchScript, generatePowerShellScript } from '../utils/scriptGenerator';

interface WindowsScriptModalProps {
  selectedCategory: FileCategoryKey;
  targetFolderName: string;
  customExtensions: string[];
}

export const WindowsScriptModal: React.FC<WindowsScriptModalProps> = ({
  selectedCategory,
  targetFolderName,
  customExtensions,
}) => {
  const [scriptType, setScriptType] = useState<'batch' | 'powershell'>('batch');
  const [copied, setCopied] = useState(false);
  const [isDropInMode, setIsDropInMode] = useState(true);
  const [includeSubfolders, setIncludeSubfolders] = useState(true);

  const batchCode = generateBatchScript(
    selectedCategory,
    targetFolderName,
    customExtensions,
    includeSubfolders,
    isDropInMode
  );
  const powershellCode = generatePowerShellScript(
    selectedCategory,
    targetFolderName,
    customExtensions,
    includeSubfolders,
    isDropInMode
  );

  const currentCode = scriptType === 'batch' ? batchCode : powershellCode;
  const fileName = scriptType === 'batch' ? 'Organize-Folder.bat' : 'Organize-Folder.ps1';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([currentCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-neutral-900 text-neutral-100 overflow-y-auto p-4 sm:p-6">
      <div className="max-w-4xl mx-auto w-full space-y-5">
        {/* Header banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-neutral-800/80 border border-neutral-700">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm sm:text-base text-white">
                  Portable Windows Organizer Scripts
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Drop-in Ready
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1 max-w-xl">
                Drop this script or the program folder into <strong>any directory</strong>. It scans the current folder and all sub-folders to clean up and group files with native Windows speed!
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="btn-copy-script"
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-neutral-700 hover:bg-neutral-600 text-white transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Script'}</span>
            </button>

            <button
              id="btn-download-script"
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download {fileName}</span>
            </button>
          </div>
        </div>

        {/* Script Configuration Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-neutral-800/60 border border-neutral-700/80 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-neutral-400 font-medium">Target Mode:</span>
            <div className="inline-flex rounded-lg bg-neutral-900 p-0.5 border border-neutral-700">
              <button
                type="button"
                onClick={() => setIsDropInMode(true)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  isDropInMode ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <FolderGit2 className="w-3.5 h-3.5" />
                <span>Any Dropped Folder (%~dp0)</span>
              </button>
              <button
                type="button"
                onClick={() => setIsDropInMode(false)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  !isDropInMode ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>Windows Desktop</span>
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-neutral-300 font-medium">
            <input
              type="checkbox"
              checked={includeSubfolders}
              onChange={(e) => setIncludeSubfolders(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-neutral-600"
            />
            <span>Include all sub-folders (Recursive Scan)</span>
          </label>
        </div>

        {/* Script Type Switcher & Code Box */}
        <div className="rounded-xl bg-neutral-950 border border-neutral-800 overflow-hidden shadow-xl">
          <div className="px-4 py-2.5 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setScriptType('batch')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  scriptType === 'batch'
                    ? 'bg-neutral-800 text-white shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                <span>Windows Batch (.bat)</span>
              </button>

              <button
                type="button"
                onClick={() => setScriptType('powershell')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  scriptType === 'powershell'
                    ? 'bg-neutral-800 text-white shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Code2 className="w-3.5 h-3.5 text-blue-400" />
                <span>PowerShell (.ps1)</span>
              </button>
            </div>

            <span className="text-[11px] font-mono text-neutral-500">
              {fileName}
            </span>
          </div>

          {/* Script Code Viewer */}
          <pre className="p-4 font-mono text-xs text-neutral-300 overflow-x-auto leading-relaxed max-h-[380px]">
            <code>{currentCode}</code>
          </pre>
        </div>

        {/* How to use on Windows step-by-step card */}
        <div className="p-4 rounded-xl bg-neutral-800/40 border border-neutral-800 text-xs text-neutral-300 space-y-2">
          <div className="flex items-center gap-1.5 font-semibold text-neutral-200">
            <Info className="w-4 h-4 text-blue-400" />
            <span>How to use the drop-in folder organizer:</span>
          </div>
          <div className="p-3 bg-blue-950/40 border border-blue-800/60 rounded-lg text-blue-200 mb-2">
            <p className="font-semibold mb-1">⚡ Instant Full GUI App (`Organizer-Desktop-App.bat`):</p>
            <p className="text-neutral-300 text-[11.5px] leading-relaxed">
              Copy this program directory into <strong>any folder</strong> (or keep a copy in your Downloads, external drives, or Desktop). Double-click <strong>Organizer-Desktop-App.bat</strong> to open the full Windows graphical window. It automatically targets its current folder, scans all sub-folders, and cleans them up with a full Undo safeguard!
            </p>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-neutral-400 pl-1">
            <li>
              Copy the program folder (or download <strong className="text-white">{fileName}</strong>) into the messy folder you want to organize.
            </li>
            <li>Double-click the script or <strong>Organizer-Desktop-App.bat</strong>.</li>
            <li>
              It scans that folder and all its subfolders, groups the files by your chosen category, and moves them safely into clean subfolders right in that directory!
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};

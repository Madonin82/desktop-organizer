import React, { useState } from 'react';
import {
  Terminal,
  Download,
  Copy,
  Check,
  Code2,
  FileCode,
  Sparkles,
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

  const batchCode = generateBatchScript(selectedCategory, targetFolderName, customExtensions);
  const powershellCode = generatePowerShellScript(selectedCategory, targetFolderName, customExtensions);

  const currentCode = scriptType === 'batch' ? batchCode : powershellCode;
  const fileName = scriptType === 'batch' ? 'Organize-Desktop.bat' : 'Organize-Desktop.ps1';

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
                  Windows Desktop 1-Click Script Generator
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Ready to Run
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1 max-w-xl">
                Prefer running directly from your Windows desktop? Download this pre-configured script.
                Double-click it on your desktop to organize your items anytime with native Windows speed!
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
            <span>How to run this on your Windows PC:</span>
          </div>
          <div className="p-3 bg-blue-950/40 border border-blue-800/60 rounded-lg text-blue-200 mb-2">
            <p className="font-semibold mb-1">⚡ Instant Windows Desktop App in your downloaded GitHub folder:</p>
            <p className="text-neutral-300 text-[11.5px] leading-relaxed">
              If you downloaded this project from GitHub, simply double-click <strong>Organizer-Desktop-App.bat</strong> right inside the folder! It launches the native Windows GUI app directly on your machine without requiring Node.js or npm.
            </p>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-neutral-400 pl-1">
            <li>
              Click <strong className="text-white">Download {fileName}</strong> above.
            </li>
            <li>Move or save the file directly to your Desktop.</li>
            <li>
              {scriptType === 'batch' ? (
                <>Double-click <strong className="text-white">{fileName}</strong> to run it.</>
              ) : (
                <>Right-click <strong className="text-white">{fileName}</strong> and select <strong className="text-white">"Run with PowerShell"</strong>.</>
              )}
            </li>
            <li>
              All files matching your selected category will be automatically moved into your chosen destination folder.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};

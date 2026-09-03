import React from 'react';
import {
  CheckCircle2,
  FolderCheck,
  RotateCcw,
  LayoutGrid,
  X,
  FileCheck,
  Folder,
} from 'lucide-react';
import { MoveOperation } from '../types';

interface ExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: number;
  currentMovingFile: string;
  isCompleted: boolean;
  lastOperation: MoveOperation | null;
  onUndo: () => void;
  onOpenDesktopView: () => void;
}

export const ExecutionModal: React.FC<ExecutionModalProps> = ({
  isOpen,
  onClose,
  progress,
  currentMovingFile,
  isCompleted,
  lastOperation,
  onUndo,
  onOpenDesktopView,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden transition-colors">
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-800/50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              {isCompleted ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Folder className="w-4 h-4" />}
            </div>
            <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
              {isCompleted ? 'Organization Complete' : 'Organizing Desktop Files...'}
            </h3>
          </div>
          {isCompleted && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {!isCompleted ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
                <span className="truncate pr-2 font-medium">
                  Moving: <span className="text-blue-600 dark:text-blue-400 font-mono">{currentMovingFile}</span>
                </span>
                <span className="font-mono font-semibold">{Math.round(progress)}%</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-150 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <p className="text-center text-[11px] text-neutral-400">
                Placing items into destination directory...
              </p>
            </div>
          ) : (
            <div className="space-y-4 text-center py-2">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800 shadow-xs">
                <FolderCheck className="w-7 h-7" />
              </div>

              <div>
                <h4 className="font-semibold text-base text-neutral-900 dark:text-neutral-100">
                  Successfully Cleaned Up!
                </h4>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 max-w-xs mx-auto">
                  Moved{' '}
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                    {lastOperation?.fileCount || 0} items
                  </span>{' '}
                  into{' '}
                  <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                    {lastOperation?.destinationFolder}
                  </span>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenDesktopView();
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>See Desktop Preview</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onUndo();
                    onClose();
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Undo Move</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

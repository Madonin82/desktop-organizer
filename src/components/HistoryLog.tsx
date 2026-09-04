import React from 'react';
import { History, RotateCcw, FolderCheck, ArrowRight, Clock, Trash } from 'lucide-react';
import { MoveOperation } from '../types';

interface HistoryLogProps {
  operations: MoveOperation[];
  onUndoOperation: (operationId: string) => void;
  onClearHistory: () => void;
}

export const HistoryLog: React.FC<HistoryLogProps> = ({
  operations,
  onUndoOperation,
  onClearHistory,
}) => {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-neutral-900 transition-colors p-4 sm:p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base text-neutral-900 dark:text-neutral-100">
                Organization History & Undo
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Review files organized during this session and undo any action if needed.
              </p>
            </div>
          </div>

          {operations.length > 0 && (
            <button
              type="button"
              onClick={onClearHistory}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <Trash className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>

        {operations.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-neutral-300 dark:border-neutral-800 rounded-xl">
            <Clock className="w-10 h-10 mx-auto text-neutral-300 dark:text-neutral-700 mb-2" />
            <p className="font-medium text-sm text-neutral-700 dark:text-neutral-300">
              No organization history yet
            </p>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
              Whenever you pick a file type and organize desktop files into a folder, the operation will be logged here with a 1-click Undo option.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {operations.map((op) => (
              <div
                key={op.id}
                className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                      Moved {op.fileCount} {op.fileCount === 1 ? 'file' : 'files'}
                    </span>
                    <span className="text-neutral-300 dark:text-neutral-700">•</span>
                    <span className="text-xs text-neutral-500 font-mono">{op.timestamp}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                    <span className="font-medium text-neutral-500 truncate max-w-[120px]" title={op.sourceDirectory || 'Source'}>
                      {op.sourceDirectory || 'Source'}
                    </span>
                    <ArrowRight className="w-3 h-3 text-neutral-400 shrink-0" />
                    <span className="font-mono font-semibold text-blue-600 dark:text-blue-400 truncate max-w-[160px]" title={op.destinationFolder}>
                      {op.destinationFolder}
                    </span>
                    <span className="text-neutral-300 dark:text-neutral-700">•</span>
                    <span className="capitalize">{op.category}</span>
                  </div>

                  {/* Sample files list preview */}
                  <div className="text-[11px] text-neutral-400 font-mono truncate max-w-md pt-1">
                    {op.sourceFiles.map((f) => f.name).slice(0, 3).join(', ')}
                    {op.sourceFiles.length > 3 && ` and ${op.sourceFiles.length - 3} more`}
                  </div>
                </div>

                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={() => onUndoOperation(op.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                    <span>Undo Move</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

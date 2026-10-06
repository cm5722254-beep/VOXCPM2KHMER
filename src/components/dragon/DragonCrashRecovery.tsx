/**
 * 🐲 Dragon Crash Recovery — Detects incomplete jobs on startup
 * Shows a prompt to resume or discard unfinished render/batch jobs.
 */
import React, { useState, useEffect } from 'react';
import { AlertTriangle, RotateCcw, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { api } from '../../services/api';

interface DragonCrashRecoveryProps {
  onShowToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const DragonCrashRecovery: React.FC<DragonCrashRecoveryProps> = ({
  onShowToast,
}) => {
  const [incompleteJobs, setIncompleteJobs] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check for incomplete jobs on mount
    const checkIncompleteJobs = async () => {
      try {
        const result = await api.getIncompleteRenderJobs();
        if (result.hasIncomplete && result.jobs.length > 0) {
          setIncompleteJobs(result.jobs);
          setIsVisible(true);
        }
      } catch (_) {
        // Silently ignore - this is a background check
      }
    };

    // Small delay so the app renders first
    const timer = setTimeout(checkIncompleteJobs, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleDiscard = async () => {
    try {
      await Promise.all(
        incompleteJobs.map((job) => api.deleteRenderJob(job.jobId || job.id))
      );
      setIsVisible(false);
      onShowToast?.('🗑️ បានលុប Jobs ចោល', 'info');
    } catch (e) {
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
  };

  if (!isVisible || isDismissed) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] w-full max-w-md px-4 font-khmer">
      <div className="bg-white dark:bg-[#0f1520] border border-amber-500/40 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-amber-500/10">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-sky-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 dark:text-white">
                រកឃើញការងារដែលមិនទាន់បានបញ្ចប់
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {incompleteJobs.length} job{incompleteJobs.length !== 1 ? 's' : ''} — Render/Batch មិនទាន់ Finish
              </p>
            </div>
          </div>
        </div>

        {/* Expandable job list */}
        <div className="px-4 pb-1">
          <button
            onClick={() => setIsExpanded((v) => !v)}
            className="w-full flex items-center justify-between py-2.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-white transition-colors"
          >
            <span>មើល Jobs ({incompleteJobs.length})</span>
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {isExpanded && (
            <div className="space-y-1.5 pb-2">
              {incompleteJobs.map((job, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-slate-100 dark:bg-white/[0.04] rounded-lg px-3 py-2 border border-white/[0.06]"
                >
                  <div className="min-w-0">
                    <p className="text-xs text-slate-800 dark:text-white truncate">
                      {job.episodeId || job.jobId || `Job ${i + 1}`}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Status: {job.status} · {job.startedAt ? new Date(job.startedAt).toLocaleTimeString() : 'Unknown time'}
                    </p>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-sky-600 dark:text-amber-400 ml-2">
                    {job.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 pt-0 flex gap-2">
          <button
            onClick={handleDismiss}
            className="flex-1 py-2 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-white bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:bg-white/[0.08] border border-slate-200 dark:border-slate-200 dark:border-white/[0.08] transition-colors"
          >
            Dismiss
          </button>
          <button
            onClick={handleDiscard}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-blue-600 dark:text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/15 border border-red-500/25 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            Discard
          </button>
        </div>

        <p className="px-4 pb-3 text-[10px] text-slate-500 text-center">
          ចូលទៅ Batch Studio ដើម្បី Retry Episodes ដែលបរាជ័យ
        </p>
      </div>
    </div>
  );
};

export default DragonCrashRecovery;

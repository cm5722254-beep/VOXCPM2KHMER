/**
 * 🐲 Dragon Diagnostics — Full system health check panel
 * Checks: FFmpeg, GPU, AI providers, database, storage, permissions, network
 * Shows: ✅ Healthy / ⚠️ Warning / ❌ Error with Khmer fix recommendations
 */
import React, { useState, useEffect } from 'react';
import {
  Activity, RefreshCw, X, CheckCircle2, AlertTriangle, XCircle,
  Wrench, ChevronDown, ChevronRight
} from 'lucide-react';
import { api } from '../../services/api';

interface DragonDiagnosticsProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const DragonDiagnostics: React.FC<DragonDiagnosticsProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedFix, setExpandedFix] = useState<string | null>(null);

  const runDiagnostics = async () => {
    setIsLoading(true);
    try {
      const result = await api.runDiagnostics();
      setData(result);
    } catch (e: any) {
      onShowToast?.('❌ ពិនិត្យ Diagnostics បរាជ័យ: ' + e.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) runDiagnostics();
  }, [isOpen]);

  if (!isOpen) return null;

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'healthy') return <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />;
    if (status === 'warning') return <AlertTriangle className="w-4 h-4 text-cyan-600 dark:text-yellow-400 flex-shrink-0" />;
    return <XCircle className="w-4 h-4 text-blue-600 dark:text-red-400 flex-shrink-0" />;
  };

  const overallBg = data
    ? data.overallStatus === 'healthy' ? 'bg-green-500/15 border-green-500/30'
    : data.overallStatus === 'warning' ? 'bg-yellow-500/15 border-yellow-500/30'
    : 'bg-red-500/15 border-red-500/30'
    : '';

  return (
    <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-khmer">
      <div className="bg-white dark:bg-[#0b0f19] border border-purple-500/30 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-[0_0_40px_rgba(168,85,247,0.12)] flex flex-col">
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-200 dark:border-slate-200 dark:border-white/[0.08] flex items-center justify-between bg-white dark:bg-[#070a12] rounded-t-2xl sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
              <Activity className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">🐲 Dragon Diagnostics</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">ពិនិត្យ System ទាំងអស់</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={runDiagnostics}
              disabled={isLoading}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-50"
              title="Run again"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-white hover:bg-white/[0.06] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {isLoading && !data && (
            <div className="flex items-center justify-center py-12 text-slate-500 dark:text-slate-400 text-sm">
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              កំពុងពិនិត្យ System Components...
            </div>
          )}

          {/* Overall Status */}
          {data && (
            <div className={`rounded-xl border p-4 ${overallBg}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">ស្ថានភាព System សរុប</p>
                  <p className="text-base font-bold text-slate-800 dark:text-white">
                    {data.overallStatus === 'healthy' && '✅ System ដំណើរការល្អ'}
                    {data.overallStatus === 'warning' && '⚠️ មាន Warning ខ្លះ'}
                    {data.overallStatus === 'error' && '❌ មាន Error — ត្រូវជួសជុល'}
                  </p>
                </div>
                <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                  <p>✅ {data.healthy} OK</p>
                  <p>⚠️ {data.warnings} Warning</p>
                  <p>❌ {data.errors} Error</p>
                </div>
              </div>
            </div>
          )}

          {/* Checks List */}
          {data?.checks?.map((check: any, idx: number) => (
            <div
              key={idx}
              className={`rounded-xl border p-3.5 ${
                check.status === 'healthy'
                  ? 'bg-white/[0.03] border-white/[0.07]'
                  : check.status === 'warning'
                  ? 'bg-yellow-500/10 border-yellow-500/25'
                  : 'bg-red-500/10 border-red-500/25'
              }`}
            >
              <div className="flex items-start gap-3">
                <StatusIcon status={check.status} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">{check.component}</p>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{check.message}</p>

                  {/* Fix recommendation */}
                  {check.fix && (
                    <button
                      onClick={() => setExpandedFix(expandedFix === `${idx}` ? null : `${idx}`)}
                      className="flex items-center gap-1 mt-2 text-[11px] text-orange-400 hover:text-orange-300 transition-colors"
                    >
                      <Wrench className="w-3 h-3" />
                      <span>ដំណោះស្រាយ</span>
                      {expandedFix === `${idx}`
                        ? <ChevronDown className="w-3 h-3" />
                        : <ChevronRight className="w-3 h-3" />
                      }
                    </button>
                  )}
                  {expandedFix === `${idx}` && check.fix && (
                    <div className="mt-2 p-2 bg-orange-500/10 rounded-lg border border-orange-500/20">
                      <p className="text-[11px] text-orange-300">{check.fix}</p>
                    </div>
                  )}

                  {/* Technical detail (collapsed) */}
                  {check.detail && check.status !== 'healthy' && (
                    <p className="text-[10px] text-slate-500 mt-1 truncate">
                      Technical: {check.detail}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {data && (
            <p className="text-[10px] text-slate-500 text-center">
              ពិនិត្យ: {new Date(data.timestamp).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DragonDiagnostics;

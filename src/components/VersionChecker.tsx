import React, { useState, useEffect } from 'react';
import { Download, Check, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import axios from 'axios';

interface VersionInfo {
  current_version: string;
  latest_version: string;
  has_update: boolean;
  release_date: string;
  changelog: Array<{
    type: 'NEW' | 'FIXED' | 'IMPROVED';
    text: string;
  }>;
  patch_size_mb: number;
  download_url?: string;
}

export default function VersionChecker() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const checkVersion = async () => {
    setIsChecking(true);
    setError(null);
    try {
      const response = await axios.get('/api/system/version');
      setVersionInfo(response.data);
      
      if (response.data.has_update) {
        setShowModal(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'មិនអាចពិនិត្យ Version បានទេ');
      console.error('Version check error:', err);
    } finally {
      setIsChecking(false);
    }
  };

  const installUpdate = async () => {
    if (!versionInfo?.has_update) return;
    
    setIsUpdating(true);
    setError(null);
    setUpdateProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUpdateProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 500);

      const response = await axios.post('/api/system/update', {
        target_version: versionInfo.latest_version
      });

      clearInterval(progressInterval);
      setUpdateProgress(100);

      if (response.data.success) {
        // Success! Reload after 2 seconds
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'មិនអាច Update បានទេ');
      console.error('Update error:', err);
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    // Auto-check version on mount
    checkVersion();

    // Check for updates every 30 minutes
    const interval = setInterval(checkVersion, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getChangelogIcon = (type: string) => {
    switch (type) {
      case 'NEW':
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
      case 'FIXED':
        return <Check className="w-4 h-4 text-sky-400" />;
      case 'IMPROVED':
        return <RefreshCw className="w-4 h-4 text-violet-400" />;
      default:
        return <Check className="w-4 h-4" />;
    }
  };

  if (!versionInfo) {
    return (
      <button
        onClick={checkVersion}
        disabled={isChecking}
        className="glass-card px-4 py-2 rounded-lg hover:bg-white/5 transition-all flex items-center gap-2"
      >
        <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
        <span className="text-sm">ពិនិត្យ Version</span>
      </button>
    );
  }

  return (
    <>
      {/* Version Badge */}
      <div className="glass-card px-4 py-2 rounded-lg flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Version:</span>
          <span className="text-sm font-bold gradient-text">{versionInfo.current_version}</span>
        </div>

        {versionInfo.has_update && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.6)]" />
            <span className="text-xs text-emerald-400 font-semibold">Update ថ្មី!</span>
          </div>
        )}

        <button
          onClick={checkVersion}
          disabled={isChecking}
          className="ml-2 p-1.5 rounded-md hover:bg-white/5 transition-all"
          title="ពិនិត្យ Update"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isChecking ? 'animate-spin' : ''}`} />
        </button>

        {versionInfo.has_update && (
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary px-3 py-1 text-xs rounded-md flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Update</span>
          </button>
        )}
      </div>

      {/* Update Modal */}
      {showModal && versionInfo.has_update && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 modal-backdrop">
          <div className="modal-content max-w-2xl w-full p-6 space-y-6 relative">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-sky-500 flex items-center justify-center shadow-[0_0_20px_rgba(52,211,153,0.4)]">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold gradient-text">Version ថ្មីមកដល់!</h2>
                    <p className="text-sm text-slate-400">
                      អាច Update ពី <span className="text-sky-400">{versionInfo.current_version}</span> ទៅ{' '}
                      <span className="text-emerald-400 font-bold">{versionInfo.latest_version}</span>
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-white/5 transition-all"
                disabled={isUpdating}
              >
                <AlertCircle className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Changelog */}
            <div className="glass-card p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-200">អ្វីដែលថ្មី</h3>
                <span className="text-xs text-slate-500">
                  {new Date(versionInfo.release_date).toLocaleDateString('km-KH')}
                </span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin">
                {versionInfo.changelog.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-all"
                  >
                    <div className="mt-0.5 flex-shrink-0">{getChangelogIcon(item.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${
                          item.type === 'NEW' ? 'text-emerald-400' :
                          item.type === 'FIXED' ? 'text-sky-400' :
                          'text-violet-400'
                        }`}>
                          {item.type}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Update Progress */}
            {isUpdating && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">កំពុង Download និង Install...</span>
                  <span className="text-sky-400 font-bold">{updateProgress}%</span>
                </div>
                <div className="progress-bar h-2">
                  <div
                    className="progress-fill"
                    style={{ width: `${updateProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <div className="text-xs text-slate-500">
                ទំហំ: <span className="text-slate-400 font-mono">{versionInfo.patch_size_mb} MB</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="btn-ghost px-4 py-2 text-sm rounded-lg"
                  disabled={isUpdating}
                >
                  ពេលក្រោយ
                </button>

                <button
                  onClick={installUpdate}
                  disabled={isUpdating}
                  className="btn-primary px-6 py-2 text-sm rounded-lg flex items-center gap-2"
                >
                  {isUpdating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>កំពុង Update...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Update ឥឡូវនេះ</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

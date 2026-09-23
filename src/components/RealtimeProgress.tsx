import React, { useEffect, useState, useRef } from 'react';
import { Loader2, CheckCircle2, AlertCircle, Zap } from 'lucide-react';

interface ProgressData {
  status: string;
  progress: number;
  message: string;
  error?: string;
  outputVideo?: string;
  outputAudio?: string;
}

interface RealtimeProgressProps {
  jobId: string;
  onComplete?: (data: ProgressData) => void;
  onError?: (error: string) => void;
}

export default function RealtimeProgress({ jobId, onComplete, onError }: RealtimeProgressProps) {
  const [progress, setProgress] = useState<ProgressData>({
    status: 'pending',
    progress: 0,
    message: 'កំពុងរៀបចំ...'
  });
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!jobId) return;

    // Connect to SSE endpoint for real-time updates
    const eventSource = new EventSource(`/api/progress/stream/${jobId}`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data: ProgressData = JSON.parse(event.data);
        setProgress(data);

        // Handle completion
        if (data.status === 'completed' && onComplete) {
          onComplete(data);
          eventSource.close();
        }

        // Handle errors
        if (data.status === 'failed' && onError) {
          onError(data.error || 'មានបញ្ហាកើតឡើង');
          eventSource.close();
        }

        // Handle not found
        if (data.status === 'not_found') {
          eventSource.close();
        }
      } catch (err) {
        console.error('SSE parse error:', err);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      eventSource.close();
      
      // Fallback to polling if SSE fails
      startPolling();
    };

    // Cleanup on unmount
    return () => {
      if (eventSource.readyState !== EventSource.CLOSED) {
        eventSource.close();
      }
    };
  }, [jobId]);

  // Fallback polling mechanism
  const startPolling = () => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/dubbing/status/${jobId}`);
        if (response.ok) {
          const data: ProgressData = await response.json();
          setProgress(data);

          if (data.status === 'completed' || data.status === 'failed') {
            clearInterval(interval);
            if (data.status === 'completed' && onComplete) {
              onComplete(data);
            } else if (data.status === 'failed' && onError) {
              onError(data.error || 'មានបញ្ហាកើតឡើង');
            }
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 1000);

    return () => clearInterval(interval);
  };

  const getStatusColor = () => {
    switch (progress.status) {
      case 'completed':
        return 'text-emerald-400';
      case 'failed':
        return 'text-red-400';
      case 'processing':
      case 'dubbing_khmer':
      case 'extracting':
        return 'text-sky-400';
      default:
        return 'text-slate-400';
    }
  };

  const getStatusIcon = () => {
    switch (progress.status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'processing':
      case 'dubbing_khmer':
      case 'extracting':
        return <Loader2 className="w-5 h-5 text-sky-400 animate-spin" />;
      default:
        return <Zap className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="glass-card p-6 rounded-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <h3 className="text-sm font-bold text-slate-200">Real-time Processing</h3>
            <p className={`text-xs ${getStatusColor()}`}>{progress.message}</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold gradient-text">{progress.progress}%</div>
          <div className="text-xs text-slate-500">ដំណើរការ</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="progress-bar h-3">
          <div
            className="progress-fill transition-all duration-500 ease-out"
            style={{ width: `${progress.progress}%` }}
          />
        </div>
        
        {/* Status Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className={`badge ${
            progress.progress >= 10 ? 'badge-success' : 'badge-sky'
          } text-[9px]`}>
            Extract Audio
          </div>
          <div className={`badge ${
            progress.progress >= 30 ? 'badge-success' : 'badge-sky'
          } text-[9px]`}>
            AI Analysis
          </div>
          <div className={`badge ${
            progress.progress >= 60 ? 'badge-success' : 'badge-sky'
          } text-[9px]`}>
            Voice Synthesis
          </div>
          <div className={`badge ${
            progress.progress >= 90 ? 'badge-success' : 'badge-sky'
          } text-[9px]`}>
            Final Render
          </div>
        </div>
      </div>

      {/* Error Display */}
      {progress.error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-red-400 font-medium">កំហុស:</p>
            <p className="text-sm text-red-300 mt-1">{progress.error}</p>
          </div>
        </div>
      )}

      {/* Success Display */}
      {progress.status === 'completed' && progress.outputVideo && (
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <p className="text-sm text-emerald-400 font-bold">ជោគជ័យ 100%!</p>
          </div>
          
          <div className="flex items-center gap-3">
            <a
              href={progress.outputVideo}
              download
              className="btn-primary px-4 py-2 text-xs rounded-lg flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Download វីដេអូ</span>
            </a>

            {progress.outputAudio && (
              <a
                href={progress.outputAudio}
                download
                className="btn-ghost px-4 py-2 text-xs rounded-lg flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                <span>Download Audio</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Live Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-3 rounded-lg text-center">
          <div className="text-xs text-slate-500 mb-1">Status</div>
          <div className={`text-sm font-bold ${getStatusColor()}`}>
            {progress.status === 'completed' ? 'រួចរាល់' :
             progress.status === 'failed' ? 'បរាជ័យ' :
             progress.status === 'processing' ? 'កំពុងដំណើរការ' :
             progress.status === 'dubbing_khmer' ? 'AI Dubbing' :
             progress.status === 'extracting' ? 'Extract Audio' :
             'រង់ចាំ'}
          </div>
        </div>

        <div className="glass-card p-3 rounded-lg text-center">
          <div className="text-xs text-slate-500 mb-1">Progress</div>
          <div className="text-sm font-bold text-sky-400">{progress.progress}%</div>
        </div>

        <div className="glass-card p-3 rounded-lg text-center">
          <div className="text-xs text-slate-500 mb-1">Connection</div>
          <div className="flex items-center justify-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
            <span className="text-xs font-bold text-emerald-400">Live</span>
          </div>
        </div>
      </div>
    </div>
  );
}

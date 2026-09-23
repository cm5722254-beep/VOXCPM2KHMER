import React, { useState } from 'react';
import { Languages, Loader2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import axios from 'axios';
import { GlassButton, GlassCard } from './GlassCard';

interface QuickTranslateProps {
  videoFile: File | null;
  onTranslated?: (result: any) => void;
}

export default function QuickTranslate({ videoFile, onTranslated }: QuickTranslateProps) {
  const [isTranslating, setIsTranslating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleQuickTranslate = async () => {
    if (!videoFile) {
      setError('សូមជ្រើសរើសវីដេអូជាមុនសិន');
      return;
    }

    setIsTranslating(true);
    setError(null);
    setProgress(0);

    try {
      // 1. Upload video
      setProgress(10);
      const formData = new FormData();
      formData.append('mediaFile', videoFile);

      const uploadRes = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const filename = uploadRes.data.filename;
      setProgress(20);

      // 2. Quick scan and translate (auto-detect everything)
      setProgress(30);
      const scanRes = await axios.post('/api/dubbing/scan-timeline', {
        filename,
        scope: 'full',
        voiceMode: 'voice_actor_clone'
      });

      setProgress(60);

      // 3. Start auto-dubbing
      const dubbingRes = await axios.post('/api/dubbing/start', {
        filename,
        sourceLang: 'zh',
        targetLang: 'km',
        voiceId: 'voice_actor_clone',
        scope: 'full',
        castingSafetyMode: 'safe_curated',
        characterVoiceMap: scanRes.data.characterVoiceMap || {}
      });

      const jobId = dubbingRes.data.jobId;
      setProgress(70);

      // 4. Poll for completion
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await axios.get(`/api/dubbing/status/${jobId}`);
          const job = statusRes.data;

          setProgress(70 + (job.progress * 0.3)); // 70-100%

          if (job.status === 'completed') {
            clearInterval(pollInterval);
            setProgress(100);
            setResult(job);
            if (onTranslated) {
              onTranslated(job);
            }
            setIsTranslating(false);
          } else if (job.status === 'failed') {
            clearInterval(pollInterval);
            setError(job.error || 'មានបញ្ហាកើតឡើង');
            setIsTranslating(false);
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 2000);

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (isTranslating) {
          setError('ការបកប្រែចំណាយពេលយូរពេក សូមព្យាយាមម្តងទៀត');
          setIsTranslating(false);
        }
      }, 5 * 60 * 1000);

    } catch (err: any) {
      setError(err.response?.data?.detail || 'មានបញ្ហាកើតឡើង');
      setIsTranslating(false);
    }
  };

  return (
    <GlassCard className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
          <Languages className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-slate-200">បកប្រែភ្លាមៗ (Quick Translate)</h3>
          <p className="text-xs text-slate-400">បកប្រែពី ចិន → ខ្មែរ ស្វ័យប្រវត្តិ</p>
        </div>
      </div>

      {/* Quick Translate Button */}
      {!isTranslating && !result && (
        <GlassButton
          variant="primary"
          onClick={handleQuickTranslate}
          disabled={!videoFile}
          className="w-full py-3"
          icon={<Sparkles className="w-5 h-5" />}
        >
          🚀 បកប្រែភ្លាមៗ
        </GlassButton>
      )}

      {/* Progress */}
      {isTranslating && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">កំពុងបកប្រែ...</span>
            <span className="text-sky-400 font-bold">{Math.round(progress)}%</span>
          </div>
          <div className="progress-bar h-2">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>សូមរង់ចាំបន្តិច...</span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Success Result */}
      {result && (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-sm text-emerald-400 font-bold">បានបកប្រែជោគជ័យ! 🎉</span>
          </div>

          {result.outputVideo && (
            <div className="flex gap-2">
              <a
                href={result.outputVideo}
                download
                className="flex-1 btn-primary px-4 py-2 text-xs rounded-lg text-center"
              >
                📥 Download វីដេអូ
              </a>
              {result.outputAudio && (
                <a
                  href={result.outputAudio}
                  download
                  className="flex-1 btn-ghost px-4 py-2 text-xs rounded-lg text-center"
                >
                  🎵 Download Audio
                </a>
              )}
            </div>
          )}

          <GlassButton
            variant="ghost"
            onClick={() => {
              setResult(null);
              setProgress(0);
            }}
            className="w-full"
          >
            បកប្រែថ្មីម្តងទៀត
          </GlassButton>
        </div>
      )}

      {/* Info */}
      <div className="text-xs text-slate-500 space-y-1">
        <div className="flex items-center gap-2">
          <span>✓</span>
          <span>ស្វ័យប្រវត្តិស្កេនតួអង្គ</span>
        </div>
        <div className="flex items-center gap-2">
          <span>✓</span>
          <span>បកប្រែគ្រប់ឃ្លា</span>
        </div>
        <div className="flex items-center gap-2">
          <span>✓</span>
          <span>សំឡេងធម្មជាតិ</span>
        </div>
      </div>
    </GlassCard>
  );
}

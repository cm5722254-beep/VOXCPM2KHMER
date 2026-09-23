import React, { useState, useEffect } from 'react';
import { Upload, Film, Settings, Users, BarChart3 } from 'lucide-react';
import QuickTranslate from './QuickTranslate';
import ProcessingModeSelector from './ProcessingModeSelector';
import AudioMixerControls from './AudioMixerControls';
import CharacterVoiceAssignment from './CharacterVoiceAssignment';
import RealtimeProgress from './RealtimeProgress';
import VersionChecker from './VersionChecker';
import { GlassCard } from './GlassCard';

type TabView = 'upload' | 'processing' | 'characters' | 'audio' | 'progress';
type ProcessingMode = 'local_voxcpm' | 'cloud_gpu' | 'pure_khmer';

export default function MainDubbingStudio() {
  const [activeTab, setActiveTab] = useState<TabView>('upload');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoFilename, setVideoFilename] = useState('');
  const [processingMode, setProcessingMode] = useState<ProcessingMode>('pure_khmer');
  const [audioSettings, setAudioSettings] = useState<any>(null);
  const [characterMapping, setCharacterMapping] = useState<Record<string, string>>({});
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  // Handle video file upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setVideoFilename(file.name);
      setActiveTab('processing');
    }
  };

  const handleTranslateComplete = (result: any) => {
    if (result.jobId) {
      setCurrentJobId(result.jobId);
      setActiveTab('progress');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex flex-col">
      {/* Header - Responsive */}
      <header className="header-root sticky top-0 z-40 px-4 md:px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="brand-logo">
              <Film className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold gradient-text">
                ATITEBDABBERPRO
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">
                AI Khmer Dubbing Studio V2.2PRO
              </p>
            </div>
          </div>
          
          <VersionChecker />
        </div>
      </header>

      {/* Main Content - Responsive Container */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
          
          {/* Tab Navigation - Responsive */}
          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            <div className="flex gap-2 min-w-max md:min-w-0">
              <button
                onClick={() => setActiveTab('upload')}
                className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Upload</span>
              </button>
              <button
                onClick={() => setActiveTab('processing')}
                className={`tab-btn ${activeTab === 'processing' ? 'active' : ''}`}
                disabled={!videoFile}
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Processing</span>
              </button>
              <button
                onClick={() => setActiveTab('characters')}
                className={`tab-btn ${activeTab === 'characters' ? 'active' : ''}`}
                disabled={!videoFilename}
              >
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">តួអង្គ</span>
              </button>
              <button
                onClick={() => setActiveTab('audio')}
                className={`tab-btn ${activeTab === 'audio' ? 'active' : ''}`}
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Audio</span>
              </button>
            </div>
          </div>

          {/* Content Area - Responsive Grid */}
          <div className="space-y-4 md:space-y-6">
            
            {/* Upload Tab */}
            {activeTab === 'upload' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 animate-fade-down">
                {/* Upload Section */}
                <GlassCard className="p-6 md:p-8 space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-sky-500 to-violet-500 flex items-center justify-center">
                      <Upload className="w-8 h-8 md:w-10 md:h-10 text-white" />
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold gradient-text mb-2">
                      ដាក់វីដេអូចូល
                    </h2>
                    <p className="text-sm text-slate-400 mb-6">
                      ជ្រើសរើសវីដេអូដើម្បីចាប់ផ្តើមបកប្រែ
                    </p>
                  </div>

                  <label className="upload-btn block cursor-pointer py-12 md:py-16 text-center">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Film className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-sky-400" />
                    <p className="text-base md:text-lg font-semibold text-sky-400 mb-2">
                      ចុចដើម្បីជ្រើសរើសវីដេអូ
                    </p>
                    <p className="text-xs md:text-sm text-slate-500">
                      MP4, MKV, AVI, MOV ឬ WEBM
                    </p>
                  </label>

                  {videoFile && (
                    <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 animate-scale-in">
                      <div className="flex items-center gap-3">
                        <Film className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-200 truncate">
                            {videoFile.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </GlassCard>

                {/* Quick Translate */}
                <QuickTranslate 
                  videoFile={videoFile}
                  onTranslated={handleTranslateComplete}
                />
              </div>
            )}

            {/* Processing Mode Tab */}
            {activeTab === 'processing' && (
              <div className="animate-fade-down">
                <ProcessingModeSelector
                  selectedMode={processingMode}
                  onModeChange={setProcessingMode}
                />
              </div>
            )}

            {/* Characters Tab */}
            {activeTab === 'characters' && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6 animate-fade-down">
                <CharacterVoiceAssignment
                  videoFilename={videoFilename}
                  onAssignmentComplete={setCharacterMapping}
                />
                
                <GlassCard className="p-6 space-y-4">
                  <h3 className="text-lg font-bold gradient-text">ព័ត៌មានតួអង្គ</h3>
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                      <p className="text-sm text-slate-300">
                        ✅ ស្កេនតួអង្គស្វ័យប្រវត្តិ
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        AI កំណត់ភេទ និងចំណាត់ថ្នាក់តួអង្គ
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                      <p className="text-sm text-slate-300">
                        ✅ រៀបចំសំឡេងដោយស្វ័យប្រវត្តិ
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        តួអង្គមួយប្រើសំឡេងតែមួយ មិនច្រឡំ
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/20">
                      <p className="text-sm text-slate-300">
                        ✅ គ្រប់ភេទ: ប្រុស ស្រី ក្មេង ចាស់
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        បែងចែកតួអង្គយ៉ាងត្រឹមត្រូវ
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </div>
            )}

            {/* Audio Mixer Tab */}
            {activeTab === 'audio' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 animate-fade-down">
                <div className="lg:col-span-2">
                  <AudioMixerControls
                    onSettingsChange={setAudioSettings}
                  />
                </div>

                <GlassCard className="p-6 space-y-4">
                  <h3 className="text-lg font-bold gradient-text">លទ្ធផល</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                      <span className="text-sm text-slate-300">សំឡេងបកប្រែ</span>
                      <span className="text-sm font-bold text-emerald-400">
                        {audioSettings?.dubbedVoiceVolume || 100}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                      <span className="text-sm text-slate-300">សំឡេងដើម</span>
                      <span className={`text-sm font-bold ${audioSettings?.originalVoiceEnabled ? 'text-sky-400' : 'text-slate-500'}`}>
                        {audioSettings?.originalVoiceEnabled ? `${audioSettings.originalVoiceVolume}%` : 'បិទ'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                      <span className="text-sm text-slate-300">BGM</span>
                      <span className={`text-sm font-bold ${audioSettings?.bgmEnabled ? 'text-violet-400' : 'text-slate-500'}`}>
                        {audioSettings?.bgmEnabled ? `${audioSettings.bgmVolume}%` : 'បិទ'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5">
                    <p className="text-xs text-slate-400 text-center">
                      រៀបចំ Audio Mixer តាមតម្រូវការរបស់អ្នក
                    </p>
                  </div>
                </GlassCard>
              </div>
            )}

            {/* Progress Tab */}
            {activeTab === 'progress' && currentJobId && (
              <div className="animate-fade-down">
                <RealtimeProgress
                  jobId={currentJobId}
                  onComplete={(data) => {
                    console.log('Dubbing completed:', data);
                  }}
                  onError={(error) => {
                    console.error('Dubbing error:', error);
                  }}
                />
              </div>
            )}

          </div>

          {/* Info Cards - Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 pt-4">
            <GlassCard className="p-4 hover:scale-105 transition-all" glow="sky">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-500 to-blue-500 flex items-center justify-center">
                  <span className="text-xl">⚡</span>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Mode</p>
                  <p className="text-sm font-bold text-slate-200">
                    {processingMode === 'local_voxcpm' ? 'Local CPU' :
                     processingMode === 'cloud_gpu' ? 'Cloud GPU' : 'Pure Khmer'}
                  </p>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-4 hover:scale-105 transition-all" glow="emerald">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
                  <span className="text-xl">🎬</span>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Status</p>
                  <p className="text-sm font-bold text-slate-200">
                    {videoFile ? 'រួចរាល់' : 'រង់ចាំ'}
                  </p>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-4 hover:scale-105 transition-all sm:col-span-2 lg:col-span-1" glow="violet">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                  <span className="text-xl">🎯</span>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Quality</p>
                  <p className="text-sm font-bold text-slate-200">Professional</p>
                </div>
              </div>
            </GlassCard>
          </div>

        </div>
      </main>

      {/* Footer - Responsive */}
      <footer className="border-t border-white/5 px-4 py-4 md:py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs md:text-sm text-slate-500">
            <p className="text-center sm:text-left">
              © 2026 ATITEBDABBERPRO. All rights reserved.
            </p>
            <p className="text-center sm:text-right">
              Powered by VoxCPM2 & Khmer Neural AI
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

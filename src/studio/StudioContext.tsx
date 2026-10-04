import React, { createContext, useContext } from 'react';
import type {
  User, CharacterVoice, TimelineSegment, ProjectFile, VideoEffects, SubtitleStyle,
  ProjectGroup, VoxcpmStatus, StudioConfig, TabId,
} from '../types';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export type ModalKey =
  | 'settings' | 'classicExport' | 'license' | 'admin' | 'vox' | 'shelf' | 'groups' | 'turbo'
  | 'guide' | 'customizer' | 'update' | 'downloader' | 'shortcuts' | 'systemStatus' | 'trimmer'
  | 'overlay' | 'addVoice' | 'sponsor';

/** Everything the new studio needs from the legacy App state. */
export interface StudioBridge {
  user: User | null;
  uploadedFile: ProjectFile | null;
  recentFiles: ProjectFile[];
  segments: TimelineSegment[];
  setSegments: (next: TimelineSegment[] | ((prev: TimelineSegment[]) => TimelineSegment[]), opts?: { skipHistory?: boolean }) => void;
  characters: CharacterVoice[];
  outputVideo: string | null;
  outputAudio: string | null;
  cleanBgmUrl: string | null;
  setCleanBgmUrl: (url: string | null) => void;
  isDubbing: boolean;
  dubbingProgress: number;
  dubbingMessage: string;
  isUploadingFile: boolean;
  uploadProgress: number;
  videoEffects: VideoEffects;
  setVideoEffects: React.Dispatch<React.SetStateAction<VideoEffects>>;
  subtitleStyle: SubtitleStyle;
  setSubtitleStyle: React.Dispatch<React.SetStateAction<SubtitleStyle>>;
  videoRef: React.RefObject<HTMLVideoElement>;
  projectGroups: ProjectGroup[];
  activeGroupId: string | null;
  setActiveGroupId: (id: string | null) => void;
  voxStatus: VoxcpmStatus | null;
  config: StudioConfig | null;
  engineMode: string;
  switchEngine: (m: string) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  hasUpdate: boolean;
  currentVersion: string;
  activeTab: TabId;
  setActiveTab: (t: TabId) => void;
  showToast: (msg: string, type?: ToastType) => void;
  uploadFile: (f: File) => void;
  selectFile: (f: ProjectFile) => void;
  newProject: () => void;
  scanTimeline: () => Promise<void>;
  isScanning: boolean;
  startDubbing: () => Promise<void>;
  assemble: () => Promise<void>;
  saveProject: () => void;
  isSaving: boolean;
  reloadCharacters: () => void;
  reloadFiles: () => void;
  openModal: (k: ModalKey) => void;
  openThumbnail: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const Ctx = createContext<StudioBridge | null>(null);

export const StudioProvider: React.FC<{ value: StudioBridge; children: React.ReactNode }> = ({ value, children }) => (
  <Ctx.Provider value={value}>{children}</Ctx.Provider>
);

export function useBridge(): StudioBridge {
  const v = useContext(Ctx);
  if (!v) throw new Error('useBridge must be used inside <StudioProvider>');
  return v;
}

/** Resolve a playable URL for the active media. */
export function mediaUrl(b: Pick<StudioBridge, 'outputVideo' | 'uploadedFile'>, preferOutput = false): string {
  if (preferOutput && b.outputVideo) return b.outputVideo;
  const f = b.uploadedFile;
  if (!f) return b.outputVideo || '';
  return f.url || `/media/uploads/${f.filename}`;
}

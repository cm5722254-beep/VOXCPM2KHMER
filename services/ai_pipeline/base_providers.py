"""
🐉 DRAGON DABBER PRO — NEXT VERSION AI DUBBING ENGINE
Base Provider Abstractions & Interfaces
============================================================
Defines the clean abstraction layer separating UI and business logic
from underlying AI models, media engines, and providers.

Architecture:
UI -> State Management -> Dubbing Service -> AI Pipeline Orchestrator
   -> Provider Adapters -> Media Processing Engine -> FFmpeg -> Storage
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field

# =============================================================================
# 1. Core Data Models
# =============================================================================

class DialogueSegment(BaseModel):
    """Structured dialogue segment for sentence-level manipulation."""
    id: str
    episode_id: Optional[str] = "ep_01"
    speaker_id: Optional[str] = "speaker_01"
    character_id: Optional[str] = None
    character_name: Optional[str] = None
    original_text: str = ""
    translated_text: str = ""
    start_time: float = 0.0  # seconds with millisecond precision
    end_time: float = 0.0
    duration: float = 0.0
    confidence: float = 1.0
    voice_id: Optional[str] = None
    emotion: Optional[str] = "neutral"
    speed: float = 1.0
    pitch: float = 0.0
    audio_path: Optional[str] = None
    status: str = "pending"  # pending, translating, generated, synced, failed

class ProviderCapability(BaseModel):
    """Capabilities exposed by a specific provider implementation."""
    provider_id: str
    provider_name: str
    provider_type: str  # asr, translation, tts, separation, lipsync, render
    is_available: bool = True
    is_local: bool = True
    supports_emotions: bool = False
    supports_speed: bool = True
    supports_pitch: bool = False
    supported_languages: List[str] = Field(default_factory=lambda: ["km", "en", "zh", "th", "ja"])
    version: str = "1.0.0"
    notice: Optional[str] = None

class StemMetadata(BaseModel):
    """Audio stems separated from original media."""
    vocals_path: Optional[str] = None
    bgm_path: Optional[str] = None
    sfx_path: Optional[str] = None
    ambience_path: Optional[str] = None
    original_path: str = ""
    engine: str = "ffmpeg-dsp"
    is_multistem: bool = False

# =============================================================================
# 2. Abstract Provider Interfaces
# =============================================================================

class ASRProvider(ABC):
    """Speech recognition and exact sentence timestamp provider."""

    @abstractmethod
    def get_capabilities(self) -> ProviderCapability:
        pass

    @abstractmethod
    def transcribe(self, audio_path: str, language: Optional[str] = None, **kwargs) -> List[DialogueSegment]:
        """Extract spoken words with exact millisecond start/end timestamps."""
        pass


class TranslationProvider(ABC):
    """Contextual translation and Khmer naturalization provider."""

    @abstractmethod
    def get_capabilities(self) -> ProviderCapability:
        pass

    @abstractmethod
    def translate_segment(self, text: str, character_context: Optional[str] = None, **kwargs) -> str:
        """Translate dialogue with natural Khmer phrasing, preservation of personality and emotion."""
        pass

    @abstractmethod
    def translate_batch(self, segments: List[DialogueSegment], **kwargs) -> List[DialogueSegment]:
        """Batch naturalization for cohesive storytelling across dialogue."""
        pass


class TTSProvider(ABC):
    """Khmer voice synthesis provider."""

    @abstractmethod
    def get_capabilities(self) -> ProviderCapability:
        pass

    @abstractmethod
    def generate_speech(
        self,
        text: str,
        voice_id: str,
        output_path: str,
        emotion: str = "neutral",
        speed: float = 1.0,
        pitch: float = 0.0,
        **kwargs
    ) -> str:
        """Synthesize natural Khmer voice matching specified attributes."""
        pass


class SeparationProvider(ABC):
    """Vocal, BGM, and SFX separation provider."""

    @abstractmethod
    def get_capabilities(self) -> ProviderCapability:
        pass

    @abstractmethod
    def separate(self, audio_path: str, output_dir: str, prefer_ai: bool = True) -> StemMetadata:
        """Separate audio while strictly preserving original soundtrack and effects."""
        pass


class LipSyncProvider(ABC):
    """Facial motion and mouth movement synchronization provider."""

    @abstractmethod
    def get_capabilities(self) -> ProviderCapability:
        pass

    @abstractmethod
    def apply_lipsync(self, video_path: str, audio_path: str, output_path: str, **kwargs) -> str:
        """Sync mouth shapes with translated Khmer speech when hardware allows."""
        pass


class RenderProvider(ABC):
    """Final media compositing and encoding provider."""

    @abstractmethod
    def get_capabilities(self) -> ProviderCapability:
        pass

    @abstractmethod
    def render(
        self,
        video_path: str,
        stems: StemMetadata,
        segments: List[DialogueSegment],
        sponsor_config: Optional[Dict[str, Any]],
        output_path: str,
        safe_mode: str = "BALANCED",
        **kwargs
    ) -> str:
        """Composite video, preserved BGM/SFX, Khmer dialogue, and sponsor elements into master output."""
        pass

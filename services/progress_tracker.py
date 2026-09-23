"""
📊 Enhanced Progress Tracker
============================
Real-time progress tracking with detailed % for all operations
"""

import time
from typing import Dict, Optional, Callable, List
from dataclasses import dataclass, asdict
from enum import Enum


class OperationType(Enum):
    """Types of operations to track"""
    UPLOAD = "upload"
    DOWNLOAD = "download"
    VIDEO_PROCESSING = "video_processing"
    AUDIO_EXTRACTION = "audio_extraction"
    AUDIO_SEPARATION = "audio_separation"
    TRANSLATION = "translation"
    VOICE_GENERATION = "voice_generation"
    DUBBING = "dubbing"
    VIDEO_RENDERING = "video_rendering"
    UPDATE_DOWNLOAD = "update_download"
    UPDATE_INSTALL = "update_install"


class ProgressStatus(Enum):
    """Progress status"""
    PENDING = "pending"
    STARTING = "starting"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass
class ProgressStep:
    """Individual progress step"""
    name: str
    description: str
    weight: float  # Weight in overall progress (0-1)
    progress: float = 0.0  # Progress within this step (0-100)
    status: str = "pending"
    start_time: Optional[float] = None
    end_time: Optional[float] = None
    error: Optional[str] = None


class ProgressTracker:
    """Enhanced progress tracker with detailed % tracking"""
    
    def __init__(self, job_id: str, operation_type: OperationType, total_items: int = 1):
        self.job_id = job_id
        self.operation_type = operation_type
        self.total_items = total_items
        self.current_item = 0
        
        self.steps: List[ProgressStep] = []
        self.current_step_index = 0
        
        self.status = ProgressStatus.PENDING
        self.overall_progress = 0.0
        self.start_time = time.time()
        self.end_time: Optional[float] = None
        
        self.callbacks: List[Callable] = []
        self.metadata: Dict = {}
    
    def add_step(self, name: str, description: str, weight: float = 1.0):
        """Add a progress step"""
        step = ProgressStep(
            name=name,
            description=description,
            weight=weight
        )
        self.steps.append(step)
        self._normalize_weights()
    
    def _normalize_weights(self):
        """Normalize step weights to sum to 1.0"""
        if not self.steps:
            return
        
        total_weight = sum(step.weight for step in self.steps)
        if total_weight > 0:
            for step in self.steps:
                step.weight = step.weight / total_weight
    
    def start_step(self, step_index: int = None):
        """Start a progress step"""
        if step_index is None:
            step_index = self.current_step_index
        
        if 0 <= step_index < len(self.steps):
            self.current_step_index = step_index
            step = self.steps[step_index]
            step.status = "processing"
            step.start_time = time.time()
            step.progress = 0.0
            
            if self.status == ProgressStatus.PENDING:
                self.status = ProgressStatus.STARTING
            
            self._update_overall_progress()
            self._notify_callbacks()
    
    def update_step(self, progress: float, step_index: int = None, message: str = None):
        """Update progress of current step (0-100)"""
        if step_index is None:
            step_index = self.current_step_index
        
        if 0 <= step_index < len(self.steps):
            step = self.steps[step_index]
            step.progress = min(100.0, max(0.0, progress))
            
            if message:
                step.description = message
            
            self.status = ProgressStatus.PROCESSING
            self._update_overall_progress()
            self._notify_callbacks()
    
    def complete_step(self, step_index: int = None):
        """Mark step as completed"""
        if step_index is None:
            step_index = self.current_step_index
        
        if 0 <= step_index < len(self.steps):
            step = self.steps[step_index]
            step.status = "completed"
            step.progress = 100.0
            step.end_time = time.time()
            
            self._update_overall_progress()
            
            # Auto-advance to next step
            if step_index == self.current_step_index:
                self.current_step_index += 1
            
            self._notify_callbacks()
    
    def fail_step(self, error: str, step_index: int = None):
        """Mark step as failed"""
        if step_index is None:
            step_index = self.current_step_index
        
        if 0 <= step_index < len(self.steps):
            step = self.steps[step_index]
            step.status = "failed"
            step.error = error
            step.end_time = time.time()
            
            self.status = ProgressStatus.FAILED
            self.end_time = time.time()
            
            self._notify_callbacks()
    
    def _update_overall_progress(self):
        """Calculate overall progress from all steps"""
        if not self.steps:
            self.overall_progress = 0.0
            return
        
        total_progress = 0.0
        for step in self.steps:
            step_contribution = (step.progress / 100.0) * step.weight * 100.0
            total_progress += step_contribution
        
        self.overall_progress = min(100.0, total_progress)
        
        # Check if all completed
        if all(step.status == "completed" for step in self.steps):
            self.status = ProgressStatus.COMPLETED
            self.overall_progress = 100.0
            self.end_time = time.time()
    
    def set_item_progress(self, current: int, total: int = None):
        """Set progress for batch operations (e.g., processing 3/10 items)"""
        self.current_item = current
        if total:
            self.total_items = total
        
        self._notify_callbacks()
    
    def add_callback(self, callback: Callable):
        """Add progress update callback"""
        self.callbacks.append(callback)
    
    def _notify_callbacks(self):
        """Notify all registered callbacks"""
        data = self.to_dict()
        for callback in self.callbacks:
            try:
                callback(self.job_id, data)
            except Exception as e:
                print(f"Progress callback error: {e}")
    
    def set_metadata(self, key: str, value):
        """Set custom metadata"""
        self.metadata[key] = value
        self._notify_callbacks()
    
    def complete(self):
        """Mark entire job as completed"""
        for step in self.steps:
            if step.status != "completed":
                step.status = "completed"
                step.progress = 100.0
        
        self.status = ProgressStatus.COMPLETED
        self.overall_progress = 100.0
        self.end_time = time.time()
        self._notify_callbacks()
    
    def fail(self, error: str):
        """Mark entire job as failed"""
        self.status = ProgressStatus.FAILED
        self.end_time = time.time()
        self.metadata['error'] = error
        self._notify_callbacks()
    
    def cancel(self):
        """Cancel the job"""
        self.status = ProgressStatus.CANCELLED
        self.end_time = time.time()
        self._notify_callbacks()
    
    def get_elapsed_time(self) -> float:
        """Get elapsed time in seconds"""
        if self.end_time:
            return self.end_time - self.start_time
        return time.time() - self.start_time
    
    def get_estimated_remaining_time(self) -> Optional[float]:
        """Estimate remaining time based on current progress"""
        if self.overall_progress <= 0:
            return None
        
        elapsed = self.get_elapsed_time()
        progress_fraction = self.overall_progress / 100.0
        
        if progress_fraction >= 1.0:
            return 0.0
        
        estimated_total = elapsed / progress_fraction
        return estimated_total - elapsed
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for JSON serialization"""
        return {
            'job_id': self.job_id,
            'operation_type': self.operation_type.value,
            'status': self.status.value,
            'overall_progress': round(self.overall_progress, 2),
            'current_item': self.current_item,
            'total_items': self.total_items,
            'steps': [
                {
                    'name': step.name,
                    'description': step.description,
                    'progress': round(step.progress, 2),
                    'status': step.status,
                    'weight': round(step.weight * 100, 1)
                }
                for step in self.steps
            ],
            'current_step': self.steps[self.current_step_index].name if 0 <= self.current_step_index < len(self.steps) else None,
            'elapsed_time': round(self.get_elapsed_time(), 1),
            'estimated_remaining_time': round(self.get_estimated_remaining_time(), 1) if self.get_estimated_remaining_time() else None,
            'metadata': self.metadata
        }


# Global tracker registry
_trackers: Dict[str, ProgressTracker] = {}


def create_tracker(job_id: str, operation_type: OperationType, total_items: int = 1) -> ProgressTracker:
    """Create and register a progress tracker"""
    tracker = ProgressTracker(job_id, operation_type, total_items)
    _trackers[job_id] = tracker
    return tracker


def get_tracker(job_id: str) -> Optional[ProgressTracker]:
    """Get existing progress tracker"""
    return _trackers.get(job_id)


def remove_tracker(job_id: str):
    """Remove tracker from registry"""
    if job_id in _trackers:
        del _trackers[job_id]


def get_all_trackers() -> Dict[str, ProgressTracker]:
    """Get all active trackers"""
    return _trackers.copy()

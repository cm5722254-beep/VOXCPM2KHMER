"""
GPU Initialization Module for Dragon Dabber Pro
Enables CUDA/NVIDIA acceleration across all AI services
"""
import os
import sys

_GPU_INITIALIZED = False
_DEVICE = "cpu"
_GPU_NAME = "CPU"

def initialize_gpu():
    """
    Initialize GPU and configure PyTorch for optimal performance.
    Call this once at application startup.
    """
    global _GPU_INITIALIZED, _DEVICE, _GPU_NAME
    
    if _GPU_INITIALIZED:
        return _DEVICE
    
    try:
        import torch
        
        # Check CUDA availability
        if torch.cuda.is_available():
            _DEVICE = "cuda"
            _GPU_NAME = torch.cuda.get_device_name(0)
            
            # Enable TF32 for faster matrix operations on Ampere GPUs (RTX 30/40 series)
            torch.backends.cuda.matmul.allow_tf32 = True
            torch.backends.cudnn.allow_tf32 = True
            
            # Enable cuDNN autotuner for optimal convolution algorithms
            torch.backends.cudnn.benchmark = True
            
            # Set memory allocator for better performance
            os.environ['PYTORCH_CUDA_ALLOC_CONF'] = 'max_split_size_mb:512'
            
            print("=" * 70)
            print(f"✅ NVIDIA CUDA GPU Initialized: {_GPU_NAME}")
            print(f"   CUDA Version: {torch.version.cuda}")
            print(f"   Total VRAM: {torch.cuda.get_device_properties(0).total_memory / (1024**3):.1f} GB")
            print(f"   Compute Capability: {torch.cuda.get_device_properties(0).major}.{torch.cuda.get_device_properties(0).minor}")
            print("   Performance Optimizations: TF32 ✓ | cuDNN Benchmark ✓")
            print("=" * 70)
            
        else:
            _DEVICE = "cpu"
            _GPU_NAME = "CPU"
            print("=" * 70)
            print("⚪ Running in CPU Mode (No NVIDIA GPU detected)")
            print("   For 5-10x faster processing, install NVIDIA GPU + CUDA Toolkit")
            print("=" * 70)
            
    except ImportError:
        _DEVICE = "cpu"
        _GPU_NAME = "CPU"
        print("⚠️ PyTorch not installed - running in CPU mode")
    
    _GPU_INITIALIZED = True
    return _DEVICE


def get_device():
    """Get the current PyTorch device (cuda or cpu)"""
    if not _GPU_INITIALIZED:
        initialize_gpu()
    return _DEVICE


def get_gpu_name():
    """Get GPU name or 'CPU'"""
    if not _GPU_INITIALIZED:
        initialize_gpu()
    return _GPU_NAME


def get_gpu_info():
    """Get comprehensive GPU information"""
    if not _GPU_INITIALIZED:
        initialize_gpu()
    
    info = {
        "device": _DEVICE,
        "name": _GPU_NAME,
        "has_cuda": _DEVICE == "cuda",
    }
    
    if _DEVICE == "cuda":
        try:
            import torch
            info.update({
                "cuda_version": torch.version.cuda,
                "vram_total_gb": torch.cuda.get_device_properties(0).total_memory / (1024**3),
                "vram_allocated_gb": torch.cuda.memory_allocated(0) / (1024**3),
                "vram_cached_gb": torch.cuda.memory_reserved(0) / (1024**3),
                "compute_capability": f"{torch.cuda.get_device_properties(0).major}.{torch.cuda.get_device_properties(0).minor}",
            })
        except Exception:
            pass
    
    return info


def clear_gpu_cache():
    """Clear GPU memory cache (useful after heavy operations)"""
    if _DEVICE == "cuda":
        try:
            import torch
            torch.cuda.empty_cache()
            torch.cuda.synchronize()
        except Exception as e:
            print(f"GPU cache clear notice: {e}")


if __name__ == "__main__":
    # Test GPU initialization
    device = initialize_gpu()
    print(f"\nActive Device: {device}")
    print("\nGPU Info:")
    import json
    print(json.dumps(get_gpu_info(), indent=2))

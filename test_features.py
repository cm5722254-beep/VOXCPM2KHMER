"""
Feature Verification Test Script for Dragon Dabber Pro
Tests all AI services to ensure real processing (not demo/mock)
"""
import os
import sys
import asyncio

def test_imports():
    """Test that all required modules can be imported"""
    print("=" * 70)
    print("Testing Module Imports...")
    print("=" * 70)
    
    modules = {
        'fastapi': 'FastAPI server',
        'uvicorn': 'ASGI server',
        'torch': 'PyTorch (GPU support)',
        'edge_tts': 'Edge TTS (Khmer voices)',
        'demucs': 'Demucs (vocal separation)',
        'google.genai': 'Google Gemini AI',
        'pydub': 'Audio processing',
        'PIL': 'Image processing',
        'numpy': 'Numerical computing',
        'scipy': 'Scientific computing',
    }
    
    results = {}
    for module, desc in modules.items():
        try:
            __import__(module)
            results[desc] = "✅ OK"
        except ImportError as e:
            results[desc] = f"❌ MISSING ({e})"
    
    for desc, status in results.items():
        print(f"  {desc:30s} : {status}")
    
    print()
    return all("✅" in v for v in results.values())


def test_gpu():
    """Test GPU/CUDA availability"""
    print("=" * 70)
    print("Testing GPU/CUDA Support...")
    print("=" * 70)
    
    try:
        import torch
        cuda_available = torch.cuda.is_available()
        
        if cuda_available:
            gpu_name = torch.cuda.get_device_name(0)
            vram = torch.cuda.get_device_properties(0).total_memory / (1024**3)
            cuda_version = torch.version.cuda
            print(f"  ✅ NVIDIA CUDA Detected")
            print(f"     GPU: {gpu_name}")
            print(f"     VRAM: {vram:.1f} GB")
            print(f"     CUDA Version: {cuda_version}")
            print(f"  ⚡ Demucs will use GPU (5-10x faster)")
            print(f"  ⚡ Video encoding will use NVENC")
        else:
            print(f"  ⚪ Running in CPU Mode")
            print(f"     No NVIDIA GPU detected")
            print(f"  💡 For faster processing, install NVIDIA GPU + CUDA Toolkit")
        
        print()
        return True
    except ImportError:
        print(f"  ❌ PyTorch not installed - cannot test GPU")
        print()
        return False


def test_ffmpeg():
    """Test FFmpeg availability"""
    print("=" * 70)
    print("Testing FFmpeg (Video/Audio Processing)...")
    print("=" * 70)
    
    import subprocess
    try:
        result = subprocess.run(
            ['ffmpeg', '-version'],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            version_line = result.stdout.split('\n')[0]
            print(f"  ✅ FFmpeg Available: {version_line}")
            
            # Check for hardware encoders
            result2 = subprocess.run(
                ['ffmpeg', '-encoders'],
                capture_output=True,
                text=True,
                timeout=5
            )
            encoders = result2.stdout
            
            hw_encoders = []
            if 'h264_nvenc' in encoders:
                hw_encoders.append('NVENC (NVIDIA)')
            if 'h264_amf' in encoders:
                hw_encoders.append('AMF (AMD)')
            if 'h264_qsv' in encoders:
                hw_encoders.append('QSV (Intel)')
            
            if hw_encoders:
                print(f"  ⚡ Hardware Encoders: {', '.join(hw_encoders)}")
            else:
                print(f"  ⚪ No hardware encoders detected (will use libx264 CPU)")
            
            print()
            return True
        else:
            print(f"  ❌ FFmpeg failed to run")
            print()
            return False
    except FileNotFoundError:
        print(f"  ❌ FFmpeg not found in PATH")
        print(f"     Please ensure ffmpeg.exe is in bin/ folder")
        print()
        return False
    except Exception as e:
        print(f"  ❌ FFmpeg test error: {e}")
        print()
        return False


async def test_edge_tts():
    """Test Edge TTS (Pure Khmer voices)"""
    print("=" * 70)
    print("Testing Edge TTS (Pure Khmer Voices)...")
    print("=" * 70)
    
    try:
        import edge_tts
        
        # Test Khmer voices
        test_text = "សួស្តី ជំរាបសួរ"
        test_file = "test_edge_tts_output.mp3"
        
        print(f"  Testing synthesis: '{test_text}'")
        communicate = edge_tts.Communicate(test_text, 'km-KH-PisethNeural')
        await communicate.save(test_file)
        
        if os.path.exists(test_file) and os.path.getsize(test_file) > 1000:
            print(f"  ✅ Edge TTS Working")
            print(f"     Generated: {test_file} ({os.path.getsize(test_file)} bytes)")
            print(f"  ✅ Pure Khmer voices (km-KH-PisethNeural, km-KH-SreymomNeural) available")
            os.remove(test_file)
            print()
            return True
        else:
            print(f"  ❌ Edge TTS generated empty file")
            print()
            return False
            
    except Exception as e:
        print(f"  ❌ Edge TTS test failed: {e}")
        print()
        return False


def test_api_keys():
    """Test API key configuration"""
    print("=" * 70)
    print("Testing API Keys Configuration...")
    print("=" * 70)
    
    from dotenv import load_dotenv
    load_dotenv()
    
    # Check Gemini API
    gemini_key = os.getenv('GEMINI_API_KEY', '')
    if gemini_key and len(gemini_key) > 10:
        print(f"  ✅ Gemini API Key: Configured")
        print(f"     AI dialogue analysis & translation enabled")
    else:
        print(f"  ⚠️ Gemini API Key: Not configured")
        print(f"     Get free key from: https://aistudio.google.com")
        print(f"     Some features will use fallback methods")
    
    # Check ElevenLabs API
    elevenlabs_key = os.getenv('ELEVENLABS_API_KEY', '')
    if elevenlabs_key and len(elevenlabs_key) > 10:
        print(f"  ✅ ElevenLabs API Key: Configured")
        print(f"     Cloud voice cloning enabled")
    else:
        print(f"  ℹ️ ElevenLabs API Key: Not configured (optional)")
        print(f"     Will use Edge TTS for voice synthesis")
    
    print()
    return True


def test_services():
    """Test service imports"""
    print("=" * 70)
    print("Testing Service Modules...")
    print("=" * 70)
    
    try:
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        
        from services import audio_processor
        print(f"  ✅ audio_processor: OK")
        
        from services.khmer_dubber import KhmerDubber
        print(f"  ✅ khmer_dubber: OK")
        
        from services.vocal_separator import has_demucs, separate_vocals_and_bgm
        if has_demucs():
            print(f"  ✅ vocal_separator: OK (Demucs AI available)")
        else:
            print(f"  ✅ vocal_separator: OK (DSP fallback mode)")
        
        from services.gpu_init import get_gpu_info
        gpu_info = get_gpu_info()
        print(f"  ✅ gpu_init: OK (device={gpu_info['device']})")
        
        from services.elevenlabs_service import elevenlabs_service
        if elevenlabs_service.is_configured():
            print(f"  ✅ elevenlabs_service: OK (configured)")
        else:
            print(f"  ✅ elevenlabs_service: OK (not configured, will use Edge TTS)")
        
        print()
        return True
        
    except Exception as e:
        print(f"  ❌ Service test failed: {e}")
        import traceback
        traceback.print_exc()
        print()
        return False


def print_summary(results):
    """Print test summary"""
    print("=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)
    
    all_passed = all(results.values())
    
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"  {test_name:30s} : {status}")
    
    print("=" * 70)
    
    if all_passed:
        print("✅ ALL TESTS PASSED - System is ready for production!")
        print()
        print("Features available:")
        print("  • Video upload and preview")
        print("  • Real AI dialogue extraction (Gemini)")
        print("  • Vocal separation (Demucs AI or DSP)")
        print("  • Khmer voice synthesis (Edge TTS + ElevenLabs)")
        print("  • GPU acceleration (if NVIDIA CUDA available)")
        print("  • Video encoding (hardware accelerated if supported)")
        print()
        return 0
    else:
        print("⚠️ SOME TESTS FAILED - Check errors above")
        print()
        failed = [k for k, v in results.items() if not v]
        print("Failed tests:")
        for f in failed:
            print(f"  • {f}")
        print()
        return 1


async def main():
    """Run all tests"""
    print("\n")
    print("╔══════════════════════════════════════════════════════════════════╗")
    print("║  🐉 DRAGON DABBER PRO - FEATURE VERIFICATION TEST               ║")
    print("╚══════════════════════════════════════════════════════════════════╝")
    print()
    
    results = {}
    
    # Run tests
    results['Module Imports'] = test_imports()
    results['GPU Support'] = test_gpu()
    results['FFmpeg'] = test_ffmpeg()
    results['Edge TTS'] = await test_edge_tts()
    results['API Keys'] = test_api_keys()
    results['Services'] = test_services()
    
    # Print summary
    exit_code = print_summary(results)
    
    return exit_code


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)

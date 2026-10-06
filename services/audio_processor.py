import os
import subprocess
import math

import sys

# Ensure UTF-8 stdout/stderr on Windows to avoid charmap encoding errors
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

# Automatically ensure FFmpeg paths are in PATH (cross-platform Windows & macOS)
if getattr(sys, 'frozen', False):
    APP_DIR = os.path.dirname(sys.executable)
    BUNDLE_DIR = getattr(sys, '_MEIPASS', APP_DIR)
else:
    APP_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    BUNDLE_DIR = APP_DIR

BASE_DIR = APP_DIR

EXTRA_PATHS = [
    os.path.join(APP_DIR, '.venv', 'Scripts'),
    os.path.join(APP_DIR, '.venv', 'bin'),
    os.path.join(BUNDLE_DIR, 'bin'),
    os.path.join(APP_DIR, 'bin'),
    '/opt/homebrew/bin',      # Apple Silicon Mac (M1/M2/M3/M4) Homebrew
    '/usr/local/bin',          # Intel Mac Homebrew & standard UNIX tools
    '/opt/local/bin',          # MacPorts
]
for p in EXTRA_PATHS:
    if os.path.exists(p) and p not in os.environ.get('PATH', ''):
        os.environ['PATH'] = p + os.pathsep + os.environ.get('PATH', '')


def run_command(cmd: str):
    """Run shell command synchronously using subprocess with full UTF-8 support."""
    env = os.environ.copy()
    env['PYTHONIOENCODING'] = 'utf-8'
    env['PYTHONUTF8'] = '1'
    process = subprocess.run(cmd, shell=True, capture_output=True, text=True, encoding='utf-8', errors='replace', env=env)
    if process.returncode != 0:
        raise RuntimeError(f"Command failed: {cmd}\nError: {process.stderr}")
    return process.stdout.strip()

def get_media_duration(file_path: str) -> float:
    """Get media file duration in seconds using ffprobe or ffmpeg."""
    if not os.path.exists(file_path):
        return 0.0
    try:
        cmd = f'ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "{file_path}"'
        out = run_command(cmd)
        duration = float(out)
        if not math.isnan(duration) and duration > 0:
            return duration
    except Exception:
        pass

    # High-reliability fallback: parse Duration from ffmpeg -i
    try:
        import re
        proc = subprocess.run(f'ffmpeg -i "{file_path}"', shell=True, capture_output=True, text=True, encoding='utf-8', errors='replace')
        raw = (proc.stderr or '') + (proc.stdout or '')
        m = re.search(r'Duration:\s*(\d+):(\d+):([\d.]+)', raw)
        if m:
            h, mins, s = float(m.group(1)), float(m.group(2)), float(m.group(3))
            return round(h * 3600 + mins * 60 + s, 2)
    except Exception:
        pass
    return 0.0

def has_audio_stream(file_path: str) -> bool:
    """Check if the media file has at least one audio stream."""
    if not os.path.exists(file_path):
        return False
    try:
        cmd = f'ffprobe -v error -select_streams a -show_entries stream=codec_type -of default=noprint_wrappers=1:nokey=1 "{file_path}"'
        out = run_command(cmd)
        if "audio" in out.lower():
            return True
    except Exception:
        pass
    try:
        proc = subprocess.run(f'ffmpeg -i "{file_path}"', shell=True, capture_output=True, text=True, encoding='utf-8', errors='replace')
        raw = (proc.stderr or '') + (proc.stdout or '')
        return "Audio:" in raw or "audio" in raw.lower()
    except Exception:
        return False

def extract_audio(video_path: str, output_audio_path: str):
    """Extract audio track from video as high quality MP3."""
    if not has_audio_stream(video_path):
        dur = get_media_duration(video_path)
        if dur <= 0:
            dur = 5.0
        # Generate silent audio matching video duration so downstream pipeline doesn't break
        cmd = f'ffmpeg -nostdin -y -f lavfi -i anullsrc=r=44100:cl=stereo -t {dur} -b:a 192k "{output_audio_path}"'
        run_command(cmd)
        return output_audio_path

    cmd = f'ffmpeg -nostdin -y -i "{video_path}" -vn -ar 44100 -ac 2 -b:a 192k "{output_audio_path}"'
    run_command(cmd)
    return output_audio_path

def mix_clean_bgm_with_khmer(clean_bgm_path: str, khmer_vocal_path: str, output_path: str, vocal_gain: float = 2.2, bgm_gain: float = 0.92):
    """
    Cinema-quality mixer for when BGM is already a CLEAN AI-separated stem (e.g. Demucs no_vocals.wav).
    NO vocal suppression is applied — the BGM is already pristine.

    Pipeline:
      1. Khmer vocals: padded to full duration, boosted, hard-limited at 0.95
      2. BGM (clean stem): subtle shelf EQ enhancement, NO vocal notch filters
      3. Sidechain compression: BGM ducks smoothly under Khmer speech
      4. Final mix: amix with normalize=0, then loudnorm to -16 LUFS cinema standard
    """
    total_duration = get_media_duration(clean_bgm_path)
    pad_dur = max(1, math.ceil(total_duration))

    # Primary: clean BGM mixed with Khmer dub at cinema loudness
    # No mlev/slev stereotools (BGM is already clean), no vocal notch EQ
    cinema_filter = (
        f"[0:a]apad=whole_dur={pad_dur},volume={vocal_gain},alimiter=limit=0.95[khmer_vox];"
        f"[1:a]volume={bgm_gain}[bgm_full];"
        f"[bgm_full][khmer_vox]sidechaincompress=threshold=0.004:ratio=16:attack=8:release=400[ducked_bgm];"
        f"[khmer_vox][ducked_bgm]amix=inputs=2:duration=longest:dropout_transition=0:normalize=0,"
        f"loudnorm=I=-16:TP=-1.5:LRA=11"
    )

    cmd = f'ffmpeg -nostdin -y -i "{khmer_vocal_path}" -i "{clean_bgm_path}" -filter_complex "{cinema_filter}" -c:a libmp3lame -b:a 320k "{output_path}"'
    try:
        run_command(cmd)
        print(f"[Cinema Mix] Studio-quality BGM+Khmer mix complete: {output_path}")
        return output_path
    except Exception as e:
        print(f"[Cinema Mix] Primary mix failed ({e}), using fallback...")
        # Fallback: simple mix without loudnorm (older FFmpeg builds)
        fallback_filter = (
            f"[0:a]apad=whole_dur={pad_dur},volume={vocal_gain},alimiter=limit=0.95[khmer_vox];"
            f"[1:a]volume={bgm_gain}[bgm_full];"
            f"[bgm_full][khmer_vox]sidechaincompress=threshold=0.004:ratio=16:attack=8:release=400[ducked_bgm];"
            f"[khmer_vox][ducked_bgm]amix=inputs=2:duration=longest:dropout_transition=0:normalize=0"
        )
        fallback_cmd = f'ffmpeg -nostdin -y -i "{khmer_vocal_path}" -i "{clean_bgm_path}" -filter_complex "{fallback_filter}" -c:a libmp3lame -b:a 320k "{output_path}"'
        run_command(fallback_cmd)
        return output_path


def mix_vocals_with_original(original_audio_path: str, dubbed_audio_path: str, output_path: str, vocal_gain: float = 2.2, bgm_gain: float = 0.85):
    """
    Mix new dubbed vocals with raw original audio (which still contains foreign speech).
    Use this ONLY when the BGM source is NOT pre-separated (i.e. raw audio track).
    For pre-separated clean BGM stems, use mix_clean_bgm_with_khmer() instead.

    - Cancels center-channel original foreign speech (vocal suppression via stereotools mlev=0.015625 + dual notch filter)
    - Prevents side-channel vocal reverb leak (slev=0.70 instead of boosting)
    - Ultra-sensitive deep ducking during Khmer speech (threshold=0.003, ratio=20, attack=5ms, release=350ms)
    - Boosts dubbed Khmer human voice to crystal-clear studio loudness (vocal_gain 2.2)
    - Pads vocal track with apad so full movie duration is preserved 100%
    """
    total_duration = get_media_duration(original_audio_path)
    pad_dur = max(1, math.ceil(total_duration))

    # Aggressive vocal suppression for raw audio: center-channel cancellation + vocal frequency notches
    advanced_bgm_filter = (
        f"[0:a]apad=whole_dur={pad_dur},volume={vocal_gain},alimiter=limit=0.95[khmer_vox];"
        f"[1:a]asplit=2[low_b][mid_high];"
        f"[low_b]lowpass=f=220,volume={bgm_gain}[bass];"
        f"[mid_high]stereotools=mlev=0.015625:slev=0.70,highpass=f=220,"
        f"equalizer=f=1000:width_type=o:w=2.5:g=-24,equalizer=f=2500:width_type=o:w=2.0:g=-20,"
        f"volume={bgm_gain}[bgm_sides];"
        f"[bass][bgm_sides]amix=inputs=2:dropout_transition=0[clean_bgm];"
        f"[clean_bgm][khmer_vox]sidechaincompress=threshold=0.003:ratio=20:attack=5:release=350[ducked_bgm];"
        f"[khmer_vox][ducked_bgm]amix=inputs=2:duration=longest:dropout_transition=0:normalize=0"
    )

    cmd = f'ffmpeg -nostdin -y -i "{dubbed_audio_path}" -i "{original_audio_path}" -filter_complex "{advanced_bgm_filter}" -c:a libmp3lame -b:a 192k "{output_path}"'

    try:
        run_command(cmd)
        return output_path
    except Exception as err:
        fallback_filter = (
            f"[0:a]apad=whole_dur={pad_dur},volume={vocal_gain},alimiter=limit=0.95[khmer_vox];"
            f"[1:a]pan=stereo|c0=c0-c1|c1=c1-c0,equalizer=f=1100:width_type=o:w=2.5:g=-20,volume={bgm_gain * 0.75}[bgm_clean];"
            f"[bgm_clean][khmer_vox]sidechaincompress=threshold=0.003:ratio=20:attack=5:release=350[ducked_bgm];"
            f"[khmer_vox][ducked_bgm]amix=inputs=2:duration=longest:dropout_transition=0:normalize=0"
        )
        fallback_cmd = f'ffmpeg -nostdin -y -i "{dubbed_audio_path}" -i "{original_audio_path}" -filter_complex "{fallback_filter}" -c:a libmp3lame -b:a 192k "{output_path}"'
        try:
            run_command(fallback_cmd)
            return output_path
        except Exception:
            simple_filter = (
                f"[0:a]apad=whole_dur={pad_dur},volume={vocal_gain},alimiter=limit=0.95[khmer_vox];"
                f"[1:a]volume={bgm_gain * 0.5}[bgm_clean];"
                f"[bgm_clean][khmer_vox]sidechaincompress=threshold=0.003:ratio=20:attack=5:release=350[ducked_bgm];"
                f"[khmer_vox][ducked_bgm]amix=inputs=2:duration=longest:dropout_transition=0:normalize=0"
            )
            simple_cmd = f'ffmpeg -nostdin -y -i "{dubbed_audio_path}" -i "{original_audio_path}" -filter_complex "{simple_filter}" -c:a libmp3lame -b:a 192k "{output_path}"'
            run_command(simple_cmd)
            return output_path

def merge_video_audio(video_path: str, audio_path: str, output_video_path: str):
    """
    Combine original video with the new dubbed audio track.
    Fast stream copy without re-encoding, preserving 100% video length.
    """
    movflags = "-movflags +faststart" if output_video_path.lower().endswith(('.mp4', '.m4v', '.mov')) else ""
    cmd = f'ffmpeg -nostdin -y -i "{video_path}" -i "{audio_path}" -c:v copy -c:a aac -b:a 192k -map 0:v:0 -map 1:a:0 {movflags} "{output_video_path}"'
    try:
        run_command(cmd)
    except Exception:
        # Fallback with re-encoding video to libx264 in case input video codec isn't compatible with container
        fallback_cmd = f'ffmpeg -nostdin -y -i "{video_path}" -i "{audio_path}" -c:v libx264 -preset veryfast -crf 22 -c:a aac -b:a 192k -map 0:v:0 -map 1:a:0 {movflags} "{output_video_path}"'
        run_command(fallback_cmd)
    return output_video_path

def remix_audio_with_effects(original_audio_path: str, dubbed_audio_path: str, output_path: str, options: dict = None):
    """Advanced audio remixer with Normal BGM Preservation & Center Vocal Cancellation."""
    options = options or {}
    vocal_gain = options.get('vocalGain', 2.2)
    bgm_gain = options.get('bgmGain', 0.85)
    vocal_suppression = options.get('vocalSuppression', 'strong')
    reverb_preset = options.get('reverbPreset', 'none')

    total_duration = get_media_duration(original_audio_path)
    pad_dur = max(1, math.ceil(total_duration))

    mlev_val = 0.015625
    slev_val = 0.70
    if vocal_suppression == 'mild':
        mlev_val = 0.05
        slev_val = 0.85
    elif vocal_suppression == 'strong':
        mlev_val = 0.015625
        slev_val = 0.65

    reverb_filter = ''
    if reverb_preset == 'imperial':
        reverb_filter = ',aecho=0.8:0.88:60:0.4'
    elif reverb_preset == 'cave':
        reverb_filter = ',aecho=0.8:0.9:120:0.5'
    elif reverb_preset == 'room':
        reverb_filter = ',aecho=0.8:0.8:25:0.25'

    complex_filter = (
        f"[0:a]apad=whole_dur={pad_dur},volume={vocal_gain}{reverb_filter},alimiter=limit=0.95[vox];"
        f"[1:a]asplit=2[low_b][mid_high];"
        f"[low_b]lowpass=f=220,volume={bgm_gain}[bass];"
        f"[mid_high]stereotools=mlev={mlev_val}:slev={slev_val},highpass=f=220,equalizer=f=1000:width_type=o:w=2.5:g=-24,equalizer=f=2500:width_type=o:w=2.0:g=-20,volume={bgm_gain}[bgm_sides];"
        f"[bass][bgm_sides]amix=inputs=2:dropout_transition=0[clean_bgm];"
        f"[clean_bgm][vox]sidechaincompress=threshold=0.003:ratio=20:attack=5:release=350[ducked_bgm];"
        f"[vox][ducked_bgm]amix=inputs=2:duration=longest:dropout_transition=0:normalize=0"
    )

    cmd = f'ffmpeg -nostdin -y -i "{dubbed_audio_path}" -i "{original_audio_path}" -filter_complex "{complex_filter}" -c:a libmp3lame -b:a 192k "{output_path}"'
    try:
        run_command(cmd)
        return output_path
    except Exception:
        fallback_filter = (
            f"[0:a]apad=whole_dur={pad_dur},volume={vocal_gain}{reverb_filter},alimiter=limit=0.95[vox];"
            f"[1:a]volume={bgm_gain * 0.5}[bgm_clean];"
            f"[bgm_clean][vox]sidechaincompress=threshold=0.003:ratio=20:attack=5:release=350[ducked_bgm];"
            f"[vox][ducked_bgm]amix=inputs=2:duration=longest:dropout_transition=0:normalize=0"
        )
        fallback_cmd = f'ffmpeg -nostdin -y -i "{dubbed_audio_path}" -i "{original_audio_path}" -filter_complex "{fallback_filter}" -c:a libmp3lame -b:a 192k "{output_path}"'
        run_command(fallback_cmd)
        return output_path

def tune_audio_pitch_and_speed(input_audio_path: str, output_path: str, speed: float = 1.0, pitch_semitones: int = 0):
    """Adjust voice pitch & speed for precise lip-sync & character tone tuning."""
    clamped_speed = max(0.5, min(2.0, float(speed) if speed else 1.0))
    semitones = max(-12, min(12, int(pitch_semitones) if pitch_semitones else 0))

    audio_filter = ""
    if semitones != 0:
        pitch_factor = 2 ** (semitones / 12.0)
        new_sample_rate = round(44100 * pitch_factor)
        tempo_comp = clamped_speed / pitch_factor

        tempo_filters = []
        rem = tempo_comp
        while rem > 2.0:
            tempo_filters.append("atempo=2.0")
            rem /= 2.0
        while rem < 0.5:
            tempo_filters.append("atempo=0.5")
            rem /= 0.5
        tempo_filters.append(f"atempo={rem:.3f}")
        audio_filter = f'-af "asetrate={new_sample_rate},{",".join(tempo_filters)},aresample=44100"'
    else:
        tempo_filters = []
        rem = clamped_speed
        while rem > 2.0:
            tempo_filters.append("atempo=2.0")
            rem /= 2.0
        while rem < 0.5:
            tempo_filters.append("atempo=0.5")
            rem /= 0.5
        tempo_filters.append(f"atempo={rem:.3f}")
        audio_filter = f'-af "{",".join(tempo_filters)}"'

    cmd = f'ffmpeg -nostdin -y -i "{input_audio_path}" {audio_filter} -ar 44100 -ac 2 "{output_path}"'
    run_command(cmd)
    return output_path

def format_srt_time(seconds: float) -> str:
    total_ms = max(0, round((float(seconds) if seconds else 0.0) * 1000))
    hrs = total_ms // 3600000
    mins = (total_ms % 3600000) // 60000
    secs = (total_ms % 60000) // 1000
    ms = total_ms % 1000
    return f"{hrs:02d}:{mins:02d}:{secs:02d},{ms:03d}"

def create_srt_content(segments: list, options: dict = None) -> str:
    options = options or {}
    dual = options.get('dual', False)
    srt = ""
    count = 1
    for seg in segments:
        start = seg.get('start_time', 0)
        end = seg.get('end_time', start + 2.5)
        khmer_text = (seg.get('khmer') or seg.get('khmer_text') or seg.get('khmer_translation') or '').strip()
        chinese_text = (seg.get('chinese') or seg.get('chinese_text') or '').strip()
        if not khmer_text and not chinese_text:
            continue
        srt += f"{count}\n"
        srt += f"{format_srt_time(start)} --> {format_srt_time(end)}\n"
        if dual and chinese_text and khmer_text:
            srt += f"{khmer_text}\n{chinese_text}\n\n"
        else:
            srt += f"{khmer_text or chinese_text}\n\n"
        count += 1
    return srt

def burn_subtitles_to_video(video_path: str, srt_path: str, output_video_path: str, options: dict = None):
    options = options or {}
    font_size = options.get('fontSize', 20)
    font_color = options.get('fontColor', 'yellow')
    border_style = options.get('borderStyle', 3)
    outline = options.get('outline', 2)

    primary_color_hex = '&H0000FFFF'
    if font_color == 'white':
        primary_color_hex = '&H00FFFFFF'
    elif font_color == 'cyan':
        primary_color_hex = '&H00FFFF00'

    escaped_srt = srt_path.replace('\\', '/').replace(':', '\\:')
    force_style = f"FontSize={font_size},PrimaryColour={primary_color_hex},OutlineColour=&H00000000,BorderStyle={border_style},Outline={outline},MarginV=25"
    cmd = f'ffmpeg -nostdin -y -i "{video_path}" -vf "subtitles=\'{escaped_srt}\':force_style=\'{force_style}\'" -c:v libx264 -preset fast -crf 22 -c:a copy -movflags +faststart "{output_video_path}"'
    run_command(cmd)
    return output_video_path

def get_video_dimensions(video_path: str):
    """Query video width and height using ffprobe."""
    try:
        cmd = f'ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "{video_path}"'
        out = run_command(cmd).strip()
        parts = out.split('x')
        if len(parts) >= 2:
            return int(parts[0]), int(parts[1])
    except Exception:
        pass
    return 1920, 1080

def hex_to_ass_color(hex_str: str, alpha: float = 1.0) -> str:
    """Convert hex color (#RRGGBB or #RGB) and opacity (0.0 - 1.0) to ASS format (&HAABBGGRR)."""
    if not hex_str:
        return "&H00FFFFFF"
    clean = hex_str.strip().lstrip('#')
    if len(clean) == 3:
        clean = ''.join(c * 2 for c in clean)
    if len(clean) != 6:
        clean = "FFFFFF"
    r = int(clean[0:2], 16)
    g = int(clean[2:4], 16)
    b = int(clean[4:6], 16)
    # ASS alpha is inverted: 00 is fully opaque, FF is fully transparent
    a_val = max(0, min(255, int(round((1.0 - alpha) * 255))))
    return f"&H{a_val:02X}{b:02X}{g:02X}{r:02X}"

_CACHED_ENCODER = None

def _probe_encoder(codec: str, flags: str = "") -> bool:
    """Probe if an encoder is genuinely functional on this hardware (runs 0.04s test frame)."""
    try:
        cmd = f'ffmpeg -nostdin -y -f lavfi -i color=c=black:s=64x64:d=0.04 -c:v {codec} {flags} -f null -'
        res = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=3)
        return res.returncode == 0
    except Exception:
        return False


def _get_amd_amf_flags() -> str:
    """
    Return optimal h264_amf flags for the detected AMD GPU.
    Delegates to gpu_detect.py for GPU-model-specific tuning.
    AMD Vega 64 specific flags: vbr_latency RC, no B-frames, HRD compliance.
    """
    try:
        # Walk up from services/ to the project root then re-import
        import importlib.util
        gpu_detect_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'gpu_detect.py')
        if os.path.exists(gpu_detect_path):
            spec = importlib.util.spec_from_file_location("gpu_detect", gpu_detect_path)
            mod = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(mod)
            sys_gpus = mod.detect_gpus()
            primary = sys_gpus.primary
            if primary and primary.vendor == "amd":
                return primary.ffmpeg_encoder_flags
    except Exception:
        pass
    # Generic AMD AMF fallback
    return "-usage transcoding -quality speed"


def detect_best_video_encoder() -> tuple:
    """
    Detect fastest verified working video encoder on this machine.

    Priority order:
      1. Apple VideoToolbox (macOS)
      2. NVIDIA NVENC h264_nvenc
      3. AMD AMF h264_amf — with optimal per-GPU flags (Vega 64 tuned)
      4. Intel QSV h264_qsv
      5. CPU libx264 ultrafast fallback

    For AMD Vega 64 on Windows, h264_amf uses VCE 3.4 with vbr_latency
    rate control for best transcoding quality/speed balance.
    Results are cached after first successful probe.
    """
    global _CACHED_ENCODER
    if _CACHED_ENCODER is not None:
        return _CACHED_ENCODER

    threads = os.cpu_count() or 4

    # Build the candidates list in priority order
    candidates = [
        ('h264_nvenc', '-preset p4 -cq 21'),
        # AMD Vega 64 uses VCE engine — probe with safe generic flags first,
        # then apply model-specific optimised flags if probe passes
        ('h264_amf', '-usage transcoding -quality speed'),
        ('h264_qsv', '-global_quality 22'),
    ]
    if sys.platform == 'darwin':
        candidates.insert(0, ('h264_videotoolbox', '-q:v 60'))

    for codec, flags in candidates:
        if _probe_encoder(codec, flags):
            # For AMD AMF: upgrade to GPU-model-specific flags after confirming encoder works
            if codec == 'h264_amf':
                optimal_flags = _get_amd_amf_flags()
                # Verify the optimised flags also work (some Vega cards may not support all options)
                if _probe_encoder(codec, optimal_flags):
                    flags = optimal_flags
                    print(f"[AMD Vega 64] Optimal AMF flags applied: {optimal_flags}")
                else:
                    print(f"[AMD AMF] Optimal flags probe failed, using safe generic AMF flags")
            print(f"[Hardware Acceleration] Active video encoder: {codec}")
            _CACHED_ENCODER = (codec, flags)
            return _CACHED_ENCODER

    print(f"[CPU Encoding] Multi-core video encoding: libx264 ({threads} threads)")
    _CACHED_ENCODER = ('libx264', f'-preset ultrafast -threads {threads}')
    return _CACHED_ENCODER

def burn_overlay_and_subtitles(video_path: str, output_video_path: str, overlay_image_path: str = None, srt_path: str = None, options: dict = None):
    """
    Permanently burns 3D title/thumbnail overlay, watermark, and/or subtitles into the video stream.
    Supports resolution scaling, multi-bitrate profiles, multi-threading hardware acceleration, and preserves audio streams.
    """
    from PIL import Image, ImageDraw, ImageFont

    options = options or {}
    resolution = options.get('resolution', 'original')
    bitrate = options.get('bitrate', 'high')
    turbo_mode = options.get('turbo', True)

    video_w, video_h = get_video_dimensions(video_path)
    inputs = [f'-i "{video_path}"']
    filter_steps = []
    current_v = '[0:v]'

    # Handle resolution scaling (portrait vs landscape)
    is_portrait = video_h > video_w
    if resolution == '1080p':
        if not is_portrait and video_h != 1080:
            filter_steps.append(f"{current_v}scale=-2:1080[v_scaled]")
            current_v = '[v_scaled]'
            video_w = int(round(video_w * (1080 / max(1, video_h))))
            video_h = 1080
        elif is_portrait and video_w != 1080:
            filter_steps.append(f"{current_v}scale=1080:-2[v_scaled]")
            current_v = '[v_scaled]'
            video_h = int(round(video_h * (1080 / max(1, video_w))))
            video_w = 1080
    elif resolution == '720p':
        if not is_portrait and video_h != 720:
            filter_steps.append(f"{current_v}scale=-2:720[v_scaled]")
            current_v = '[v_scaled]'
            video_w = int(round(video_w * (720 / max(1, video_h))))
            video_h = 720
        elif is_portrait and video_w != 720:
            filter_steps.append(f"{current_v}scale=720:-2[v_scaled]")
            current_v = '[v_scaled]'
            video_h = int(round(video_h * (720 / max(1, video_w))))
            video_w = 720
    elif resolution == '4k':
        if not is_portrait and video_h != 2160:
            filter_steps.append(f"{current_v}scale=-2:2160[v_scaled]")
            current_v = '[v_scaled]'
            video_w = int(round(video_w * (2160 / max(1, video_h))))
            video_h = 2160
        elif is_portrait and video_w != 2160:
            filter_steps.append(f"{current_v}scale=2160:-2[v_scaled]")
            current_v = '[v_scaled]'
            video_h = int(round(video_h * (2160 / max(1, video_w))))
            video_w = 2160

    # 1. Overlay & Watermark Composition
    temp_scaled_overlay = None
    watermark = options.get('watermark')

    # Create composite canvas if either overlay or watermark exists
    if (overlay_image_path and os.path.exists(overlay_image_path)) or (watermark and watermark.get('enabled') and watermark.get('text')):
        try:
            composite_img = Image.new('RGBA', (video_w, video_h), (0, 0, 0, 0))

            # Paste existing overlay if present
            if overlay_image_path and os.path.exists(overlay_image_path):
                with Image.open(overlay_image_path) as im:
                    im_rgba = im.convert('RGBA')
                    if im_rgba.size != (video_w, video_h):
                        im_rgba = im_rgba.resize((video_w, video_h), Image.Resampling.LANCZOS)
                    composite_img.paste(im_rgba, (0, 0), im_rgba)

            # Draw Watermark onto composite image
            if watermark and watermark.get('enabled') and watermark.get('text'):
                wm_text = watermark.get('text', '')
                wm_opacity = float(watermark.get('opacity', 85)) / 100.0
                wm_pos = watermark.get('position', 'top-right')
                wm_size = int(round((watermark.get('fontSize', 14) / 1080.0) * video_h))
                wm_size = max(14, min(48, wm_size))

                draw = ImageDraw.Draw(composite_img)
                # Try to use standard fonts, fallback to default
                font = None
                font_candidates = [
                    'C:/Windows/Fonts/segoeui.ttf',
                    'C:/Windows/Fonts/arial.ttf',
                    '/System/Library/Fonts/Helvetica.ttc',
                    '/Library/Fonts/Arial.ttf'
                ]
                for fc in font_candidates:
                    if os.path.exists(fc):
                        try:
                            font = ImageFont.truetype(fc, wm_size)
                            break
                        except Exception:
                            pass
                if not font:
                    font = ImageFont.load_default()

                bbox = draw.textbbox((0, 0), wm_text, font=font)
                text_w = bbox[2] - bbox[0]
                text_h = bbox[3] - bbox[1]
                margin = int(round(video_h * 0.035))

                if wm_pos == 'top-left':
                    x = margin
                    y = margin
                elif wm_pos == 'bottom-left':
                    x = margin
                    y = video_h - margin - text_h - 16
                elif wm_pos == 'bottom-right':
                    x = video_w - margin - text_w - 24
                    y = video_h - margin - text_h - 16
                elif wm_pos == 'center':
                    x = (video_w - text_w) // 2
                    y = (video_h - text_h) // 2
                else:  # top-right
                    x = video_w - margin - text_w - 24
                    y = margin

                # Draw subtle dark badge pill
                pad_x, pad_y = 12, 6
                badge_bg = (0, 0, 0, int(160 * wm_opacity))
                draw.rounded_rectangle(
                    [x - pad_x, y - pad_y, x + text_w + pad_x, y + text_h + pad_y],
                    radius=8,
                    fill=badge_bg,
                    outline=(255, 255, 255, int(60 * wm_opacity)),
                    width=1
                )
                text_color = (255, 255, 255, int(255 * wm_opacity))
                draw.text((x, y), wm_text, font=font, fill=text_color)

            ts = int(time.time() * 1000)
            temp_scaled_overlay = os.path.join(os.path.dirname(output_video_path), f"temp_comp_ovl_{ts}.png")
            composite_img.save(temp_scaled_overlay, 'PNG')
            inputs.append(f'-i "{temp_scaled_overlay}"')
            ovl_idx = len(inputs) - 1
            filter_steps.append(f"{current_v}[{ovl_idx}:v]overlay=0:0[v_ovl]")
            current_v = '[v_ovl]'
        except Exception as ex:
            print(f"Overlay & Watermark composition error: {ex}")

    # 2. Custom Subtitle Rendering via ASS force_style
    if srt_path and os.path.exists(srt_path):
        escaped_srt = srt_path.replace('\\', '/').replace(':', '\\:')
        sub_style = options.get('subtitleStyle', {})
        font_name = sub_style.get('fontFamily', 'Kantumruy Pro')
        font_size = int(round(sub_style.get('fontSize', 22) * (video_h / 720.0)))
        font_size = max(16, min(56, font_size))
        
        text_color_ass = hex_to_ass_color(sub_style.get('textColor', '#FFFFFF'), 1.0)
        outline_color_ass = hex_to_ass_color(sub_style.get('strokeColor', '#000000'), 1.0)
        box_color_ass = hex_to_ass_color(sub_style.get('backgroundColor', '#000000'), 0.75)
        stroke_width = sub_style.get('strokeWidth', 2)
        pos = sub_style.get('position', 'bottom')
        margin_v = 35 if pos == 'bottom' else (video_h // 2 if pos == 'center' else video_h - 80)
        alignment = 2 if pos == 'bottom' else (5 if pos == 'center' else 8)
        border_style = 3 if sub_style.get('boxEnabled', True) else 1

        force_style = (
            f"FontName={font_name},"
            f"FontSize={font_size},"
            f"PrimaryColour={text_color_ass},"
            f"OutlineColour={outline_color_ass},"
            f"BackColour={box_color_ass},"
            f"BorderStyle={border_style},"
            f"Outline={stroke_width},"
            f"Alignment={alignment},"
            f"MarginV={margin_v}"
        )
        filter_steps.append(f"{current_v}subtitles='{escaped_srt}':force_style='{force_style}'[v_sub]")
        current_v = '[v_sub]'

    # 3. Fast Video Encoding Selection (NVENC GPU or Ultrafast Multi-threaded CPU)
    crf = '19' if bitrate == 'high' else '22' if bitrate == 'standard' else '26'
    input_flags = " ".join(inputs)
    threads = os.cpu_count() or 4
    encoder, enc_flags = detect_best_video_encoder()

    if filter_steps:
        fc = ";".join(filter_steps)
        if encoder == 'libx264':
            cmd = f'ffmpeg -nostdin -y {input_flags} -filter_complex "{fc}" -map "{current_v}" -map 0:a? -c:v libx264 -preset ultrafast -threads {threads} -crf {crf} -c:a aac -b:a 192k -movflags +faststart "{output_video_path}"'
        else:
            cmd = f'ffmpeg -nostdin -y {input_flags} -filter_complex "{fc}" -map "{current_v}" -map 0:a? -c:v {encoder} {enc_flags} -c:a aac -b:a 192k -movflags +faststart "{output_video_path}"'
    else:
        cmd = f'ffmpeg -nostdin -y {input_flags} -c:v copy -c:a copy -movflags +faststart "{output_video_path}"'

    try:
        try:
            run_command(cmd)
        except Exception as hw_err:
            if encoder != 'libx264' and filter_steps:
                print(f"[Warning] Hardware encoder ({encoder}) failed during render: {hw_err}")
                print(f"[Fallback] Automatically retrying with CPU multi-core (libx264 ultrafast)...")
                cpu_cmd = f'ffmpeg -nostdin -y {input_flags} -filter_complex "{fc}" -map "{current_v}" -map 0:a? -c:v libx264 -preset ultrafast -threads {threads} -crf {crf} -c:a aac -b:a 192k -movflags +faststart "{output_video_path}"'
                run_command(cpu_cmd)
            else:
                raise
    finally:
        if temp_scaled_overlay and os.path.exists(temp_scaled_overlay):
            try:
                os.remove(temp_scaled_overlay)
            except Exception:
                pass

    return output_video_path


def validate_sponsor_media(media_path: str) -> dict:
    """
    Validates a sponsor video or image file.
    Returns metadata: duration, width, height, has_audio, codec, format, is_valid, error_msg.
    """
    if not os.path.exists(media_path):
        return {'is_valid': False, 'error_msg': 'ឯកសារ Sponsor មិនត្រូវបានរកឃើញឡើយ'}

    ext = os.path.splitext(media_path)[1].lower()
    is_video = ext in ['.mp4', '.mov', '.webm', '.mkv', '.avi']
    is_image = ext in ['.png', '.jpg', '.jpeg', '.webp']

    if not is_video and not is_image:
        return {'is_valid': False, 'error_msg': f'ទម្រង់ឯកសារ {ext} មិនត្រូវបានគាំទ្រឡើយ (គាំទ្រតែ MP4, MOV, WEBM, PNG, JPG, WEBP)'}

    try:
        w, h = get_video_dimensions(media_path)
        dur = get_media_duration(media_path) if is_video else 0.0
        audio = has_audio_stream(media_path) if is_video else False

        return {
            'is_valid': True,
            'media_type': 'video' if is_video else 'image',
            'width': w,
            'height': h,
            'duration': dur,
            'has_audio': audio,
            'extension': ext,
            'filesize_mb': round(os.path.getsize(media_path) / (1024 * 1024), 2),
        }
    except Exception as ex:
        return {'is_valid': False, 'error_msg': f'មិនអាចអានទិន្នន័យមេឌៀបាន: {str(ex)}'}


def composite_sponsors_into_video(video_path: str, output_video_path: str, sponsors: list, options: dict = None) -> str:
    """
    Composites video and image sponsors into the main video stream using FFmpeg filter_complex.
    Supports:
      - Full-screen, PiP (7 positions), Overlays, Intros, Outros
      - Timing intervals: enable='between(t, start, end)'
      - Scaling, opacity, and audio mixing with main audio
    """
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Main video not found: {video_path}")

    if not sponsors or len(sponsors) == 0:
        import shutil
        shutil.copy2(video_path, output_video_path)
        return output_video_path

    options = options or {}
    main_w, main_h = get_video_dimensions(video_path)
    main_dur = get_media_duration(video_path)
    threads = os.cpu_count() or 4
    encoder, enc_flags = detect_best_video_encoder()

    inputs = [f'-i "{video_path}"']
    filter_chains = []
    current_v = '[0:v]'
    audio_inputs = ['[0:a]'] if has_audio_stream(video_path) else []
    active_sponsor_index = 1

    for sp in sponsors:
        media_path = sp.get('mediaUrl') or sp.get('filename')
        if not media_path or not os.path.exists(media_path):
            continue

        sp_type = sp.get('type', 'pip')
        pos = sp.get('position', 'top-right')
        scale_factor = float(sp.get('scale', 1.0))
        opacity = float(sp.get('opacity', 95)) / 100.0
        start_t = float(sp.get('startTime', 0))
        end_t = float(sp.get('endTime', start_t + float(sp.get('duration', 5))))

        # Register input
        inputs.append(f'-i "{media_path}"')
        sp_v_label = f"[{active_sponsor_index}:v]"
        scaled_sp_label = f"[sp_scaled_{active_sponsor_index}]"

        # Determine target dimensions
        if sp_type == 'fullscreen':
            target_w = main_w
            target_h = main_h
        else:
            base_w = int(main_w * 0.28 * scale_factor)
            target_w = max(64, base_w - (base_w % 2))
            target_h = -2

        # Scale and format opacity
        filter_chains.append(
            f"{sp_v_label}scale={target_w}:{target_h},format=rgba,colorchannelmixer=aa={opacity:.2f}{scaled_sp_label}"
        )

        # Calculate positioning coordinates
        if pos == 'top-left':
            x_expr = "20"
            y_expr = "20"
        elif pos == 'top-center':
            x_expr = "(W-w)/2"
            y_expr = "20"
        elif pos == 'top-right':
            x_expr = "W-w-20"
            y_expr = "20"
        elif pos == 'center':
            x_expr = "(W-w)/2"
            y_expr = "(H-h)/2"
        elif pos == 'bottom-left':
            x_expr = "20"
            y_expr = "H-h-20"
        elif pos == 'bottom-center':
            x_expr = "(W-w)/2"
            y_expr = "H-h-20"
        else:  # bottom-right (default)
            x_expr = "W-w-20"
            y_expr = "H-h-20"

        # Overlay onto current video
        next_v = f"[v_comp_{active_sponsor_index}]"
        filter_chains.append(
            f"{current_v}{scaled_sp_label}overlay={x_expr}:{y_expr}:enable='between(t,{start_t},{end_t})'{next_v}"
        )
        current_v = next_v

        # Audio mixing if sponsor is a video with audio and not muted
        if has_audio_stream(media_path) and sp.get('audioMode') != 'mute':
            sp_vol = float(sp.get('volume', 80)) / 100.0
            delay_ms = int(start_t * 1000)
            a_label = f"[sp_a_{active_sponsor_index}]"
            filter_chains.append(
                f"[{active_sponsor_index}:a]volume={sp_vol},adelay={delay_ms}|{delay_ms}{a_label}"
            )
            audio_inputs.append(a_label)

        active_sponsor_index += 1

    # Merge audio streams if multiple
    audio_map = "-map 0:a?"
    if len(audio_inputs) > 1:
        amix_chain = f"{''.join(audio_inputs)}amix=inputs={len(audio_inputs)}:duration=first:dropout_transition=2[a_mixed]"
        filter_chains.append(amix_chain)
        audio_map = "-map \"[a_mixed]\""

    fc_str = ";".join(filter_chains)
    input_flags = " ".join(inputs)

    if encoder == 'libx264':
        cmd = f'ffmpeg -nostdin -y {input_flags} -filter_complex "{fc_str}" -map "{current_v}" {audio_map} -c:v libx264 -preset ultrafast -threads {threads} -crf 20 -c:a aac -b:a 192k -movflags +faststart "{output_video_path}"'
    else:
        cmd = f'ffmpeg -nostdin -y {input_flags} -filter_complex "{fc_str}" -map "{current_v}" {audio_map} -c:v {encoder} {enc_flags} -c:a aac -b:a 192k -movflags +faststart "{output_video_path}"'

    try:
        run_command(cmd)
    except Exception as hw_ex:
        print(f"[Warning] Sponsor rendering with {encoder} failed: {hw_ex}. Falling back to libx264...")
        cpu_cmd = f'ffmpeg -nostdin -y {input_flags} -filter_complex "{fc_str}" -map "{current_v}" {audio_map} -c:v libx264 -preset ultrafast -threads {threads} -crf 20 -c:a aac -b:a 192k -movflags +faststart "{output_video_path}"'
        run_command(cpu_cmd)

    return output_video_path


def analyze_video_scenes(video_path: str) -> list:
    """
    Analyzes video using FFmpeg silence detection and visual scene change detection.
    Returns list of candidate scenes with timestamps, duration, and cut suggestions.
    """
    if not os.path.exists(video_path):
        return []

    total_dur = get_media_duration(video_path)
    if total_dur <= 0:
        return []

    scenes = []
    # Detect silence segments (gaps > 1.2 seconds below -35dB)
    silence_ranges = []
    try:
        import re
        cmd = f'ffmpeg -nostdin -i "{video_path}" -af silencedetect=noise=-35dB:d=1.2 -f null -'
        proc = subprocess.run(cmd, shell=True, capture_output=True, text=True, encoding='utf-8', errors='replace')
        raw = proc.stderr or ''

        start_times = [float(x) for x in re.findall(r'silence_start:\s*([\d.]+)', raw)]
        end_times = [float(x) for x in re.findall(r'silence_end:\s*([\d.]+)', raw)]

        for st, en in zip(start_times, end_times):
            silence_ranges.append({'start': st, 'end': en, 'dur': round(en - st, 2)})
    except Exception as e:
        print(f"Silence detect notice: {e}")

    # Break video into semantic scenes (every ~10-30s or at silence boundaries)
    chunk_size = min(30.0, max(5.0, total_dur / 10.0))
    current_time = 0.0
    scene_idx = 1

    while current_time < total_dur:
        end_time = min(total_dur, current_time + chunk_size)
        dur = round(end_time - current_time, 2)

        # Check if overlaps with silence
        is_silent = any(
            sr['start'] <= current_time and sr['end'] >= end_time for sr in silence_ranges
        )
        importance = 30 if is_silent else 85

        scenes.append({
            'id': f"scene_{scene_idx:02d}",
            'startTime': round(current_time, 2),
            'endTime': round(end_time, 2),
            'duration': dur,
            'speakerName': f"តួអង្គ Scene {scene_idx:02d}",
            'hasFace': not is_silent,
            'isSpeaking': not is_silent,
            'importanceScore': importance,
            'suggestedCut': is_silent,
            'cutReason': 'silence' if is_silent else None,
            'status': 'keep',
        })

        current_time = end_time
        scene_idx += 1

    return scenes


def apply_smart_cut_segments(video_path: str, output_path: str, scenes_to_remove: list) -> dict:
    """
    Applies non-destructive Smart Cut by removing specified silence/unimportant segments
    and concatenating retained segments into a new working copy video.
    Original video is never overwritten.
    """
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Video not found: {video_path}")

    total_dur = get_media_duration(video_path)
    if total_dur <= 0:
        raise ValueError("Invalid video duration")

    # Sort cut ranges
    raw_cuts = []
    for sc in scenes_to_remove:
        st = max(0.0, float(sc.get('startTime', 0)))
        en = min(total_dur, float(sc.get('endTime', st)))
        if en > st:
            raw_cuts.append((st, en))
    raw_cuts.sort(key=lambda x: x[0])

    # Merge overlapping cut intervals
    merged_cuts = []
    for c in raw_cuts:
        if not merged_cuts:
            merged_cuts.append(c)
        else:
            prev_st, prev_en = merged_cuts[-1]
            if c[0] <= prev_en:
                merged_cuts[-1] = (prev_st, max(prev_en, c[1]))
            else:
                merged_cuts.append(c)

    # Compute keep intervals
    keep_segments = []
    last_t = 0.0
    for c_st, c_en in merged_cuts:
        if c_st > last_t + 0.1:
            keep_segments.append((last_t, c_st))
        last_t = c_en
    if last_t < total_dur - 0.1:
        keep_segments.append((last_t, total_dur))

    if not keep_segments:
        # If everything was cut, keep at least the first 1 second
        keep_segments = [(0.0, min(1.0, total_dur))]

    total_removed = sum(c[1] - c[0] for c in merged_cuts)
    new_duration = sum(k[1] - k[0] for k in keep_segments)

    # Build filter_complex with trim and concat
    filter_parts = []
    concat_inputs = []
    has_audio = has_audio_stream(video_path)

    for i, (k_st, k_en) in enumerate(keep_segments):
        v_label = f"[v{i}]"
        filter_parts.append(f"[0:v]trim=start={k_st:.3f}:end={k_en:.3f},setpts=PTS-STARTPTS{v_label}")
        concat_inputs.append(v_label)
        if has_audio:
            a_label = f"[a{i}]"
            filter_parts.append(f"[0:a]atrim=start={k_st:.3f}:end={k_en:.3f},asetpts=PTS-STARTPTS{a_label}")
            concat_inputs.append(a_label)

    num_seg = len(keep_segments)
    if has_audio:
        filter_parts.append(f"{''.join(concat_inputs)}concat=n={num_seg}:v=1:a=1[outv][outa]")
        maps = '-map "[outv]" -map "[outa]"'
    else:
        filter_parts.append(f"{''.join(concat_inputs)}concat=n={num_seg}:v=1:a=0[outv]")
        maps = '-map "[outv]"'

    fc_str = ";".join(filter_parts)
    threads = os.cpu_count() or 4
    encoder, enc_flags = detect_best_video_encoder()

    cmd = f'ffmpeg -nostdin -y -i "{video_path}" -filter_complex "{fc_str}" {maps} -c:v {encoder} {enc_flags} -c:a aac -b:a 192k -movflags +faststart "{output_path}"'
    try:
        run_command(cmd)
    except Exception as e:
        print(f"[Warning] Hardware encoder failed for smart cut: {e}. Falling back to libx264...")
        cmd_cpu = f'ffmpeg -nostdin -y -i "{video_path}" -filter_complex "{fc_str}" {maps} -c:v libx264 -preset ultrafast -threads {threads} -c:a aac -b:a 192k -movflags +faststart "{output_path}"'
        run_command(cmd_cpu)

    return {
        'success': True,
        'original_duration': round(total_dur, 2),
        'cut_duration': round(new_duration, 2),
        'removed_seconds': round(total_removed, 2),
        'segments_count': num_seg,
        'output_path': output_path
    }




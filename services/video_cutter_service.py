import os
import sys
import subprocess
import json
import time
import math
import uuid
import asyncio
from typing import List, Dict, Any, Optional

# Ensure UTF-8 stdout/stderr on Windows
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

def run_command(cmd: str) -> str:
    """Run shell command synchronously using subprocess with full UTF-8 support."""
    env = os.environ.copy()
    env['PYTHONIOENCODING'] = 'utf-8'
    env['PYTHONUTF8'] = '1'
    process = subprocess.run(
        cmd,
        shell=True,
        capture_output=True,
        text=True,
        encoding='utf-8',
        errors='replace',
        env=env
    )
    if process.returncode != 0:
        raise RuntimeError(f"Command failed: {cmd}\nError: {process.stderr}")
    return process.stdout.strip()


def get_video_metadata(file_path: str) -> Dict[str, Any]:
    """Retrieve detailed video duration, resolution, codecs, and size using ffprobe."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    file_size = os.path.getsize(file_path)
    cmd = (
        f'ffprobe -v quiet -print_format json -show_format -show_streams "{file_path}"'
    )
    try:
        out = run_command(cmd)
        data = json.loads(out)
    except Exception as e:
        # Fallback to simple duration
        dur_cmd = f'ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "{file_path}"'
        try:
            dur = float(run_command(dur_cmd))
        except Exception:
            dur = 0.0
        return {
            'duration': dur,
            'width': 1920,
            'height': 1080,
            'fps': 30.0,
            'video_codec': 'unknown',
            'audio_codec': 'unknown',
            'size_bytes': file_size,
        }

    duration = 0.0
    width = 1920
    height = 1080
    fps = 30.0
    video_codec = 'h264'
    audio_codec = 'aac'

    if 'format' in data and 'duration' in data['format']:
        try:
            duration = float(data['format']['duration'])
        except Exception:
            pass

    for s in data.get('streams', []):
        if s.get('codec_type') == 'video':
            width = s.get('width', width)
            height = s.get('height', height)
            video_codec = s.get('codec_name', video_codec)
            r_frame_rate = s.get('r_frame_rate', '30/1')
            if '/' in r_frame_rate:
                try:
                    num, den = r_frame_rate.split('/')
                    fps = round(float(num) / float(den), 2)
                except Exception:
                    fps = 30.0
            if duration == 0.0 and 'duration' in s:
                try:
                    duration = float(s['duration'])
                except Exception:
                    pass
        elif s.get('codec_type') == 'audio':
            audio_codec = s.get('codec_name', audio_codec)

    return {
        'duration': duration,
        'width': width,
        'height': height,
        'fps': fps,
        'video_codec': video_codec,
        'audio_codec': audio_codec,
        'size_bytes': file_size,
    }


def split_video_sync(
    input_path: str,
    output_dir: str,
    mode: str = 'duration', # 'duration' | 'parts' | 'cues'
    duration_per_part_sec: float = 600.0, # 10 mins default
    num_parts: int = 2,
    custom_cues: Optional[List[float]] = None,
    lossless: bool = True,
    naming_prefix: str = 'ភាគ',
    progress_callback: Optional[Any] = None
) -> List[Dict[str, Any]]:
    """
    Split long video (1H - 5H) into multiple episodes/parts.
    Ultra-fast lossless stream copy (-c copy) or high quality re-encode.
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input file not found: {input_path}")

    os.makedirs(output_dir, exist_ok=True)
    meta = get_video_metadata(input_path)
    total_duration = meta['duration']

    if total_duration <= 0:
        raise ValueError("Could not determine video duration. File may be corrupted.")

    base_name = os.path.splitext(os.path.basename(input_path))[0]
    # Clean base name
    clean_base = base_name.replace('mediaFile-', '').split('_')[0]
    if not naming_prefix or naming_prefix.strip() == '':
        naming_prefix = 'ភាគ'

    # Compute cut points
    cuts: List[tuple] = [] # list of (start_sec, end_sec, part_idx)

    if mode == 'duration':
        dur = max(10.0, duration_per_part_sec)
        current_start = 0.0
        part_idx = 1
        while current_start < total_duration:
            current_end = min(total_duration, current_start + dur)
            if current_end - current_start >= 3.0: # Minimum 3 seconds
                cuts.append((current_start, current_end, part_idx))
                part_idx += 1
            current_start = current_end
    elif mode == 'parts':
        parts = max(2, min(100, num_parts))
        dur = total_duration / parts
        for i in range(parts):
            s = i * dur
            e = min(total_duration, (i + 1) * dur)
            cuts.append((s, e, i + 1))
    elif mode == 'cues' and custom_cues:
        sorted_cues = sorted([c for c in custom_cues if 0 < c < total_duration])
        points = [0.0] + sorted_cues + [total_duration]
        for i in range(len(points) - 1):
            s = points[i]
            e = points[i + 1]
            if e - s >= 2.0:
                cuts.append((s, e, i + 1))
    else:
        # Default 10 min
        dur = 600.0
        current_start = 0.0
        part_idx = 1
        while current_start < total_duration:
            current_end = min(total_duration, current_start + dur)
            cuts.append((current_start, current_end, part_idx))
            part_idx += 1
            current_start = current_end

    total_cuts = len(cuts)
    results: List[Dict[str, Any]] = []

    for idx, (start_sec, end_sec, part_num) in enumerate(cuts):
        part_dur = end_sec - start_sec
        part_filename = f"{clean_base}_{naming_prefix}_{part_num:02d}.mp4"
        part_output_path = os.path.join(output_dir, part_filename)

        if progress_callback:
            pct = int((idx / total_cuts) * 95)
            progress_callback(pct, f"កំពុងកាត់ {naming_prefix} ទី {part_num}/{total_cuts} ({math.floor(start_sec/60)}mn ដល់ {math.floor(end_sec/60)}mn)...")

        # Fast Stream Copy vs Accurate Remux
        if lossless:
            # -ss before -i for fast seeking, -to for precise end
            cmd = (
                f'ffmpeg -hide_banner -loglevel error -y '
                f'-ss {start_sec:.3f} -to {end_sec:.3f} -i "{input_path}" '
                f'-c copy -avoid_negative_ts make_zero '
                f'"{part_output_path}"'
            )
        else:
            # Re-encode mode
            cmd = (
                f'ffmpeg -hide_banner -loglevel error -y '
                f'-ss {start_sec:.3f} -to {end_sec:.3f} -i "{input_path}" '
                f'-c:v libx264 -preset veryfast -crf 20 -c:a aac -b:a 192k '
                f'"{part_output_path}"'
            )

        run_command(cmd)

        if os.path.exists(part_output_path):
            part_size = os.path.getsize(part_output_path)
            results.append({
                'part_index': part_num,
                'filename': part_filename,
                'url': f"/media/outputs/{part_filename}",
                'file_path': part_output_path,
                'start_time': start_sec,
                'end_time': end_sec,
                'duration': part_dur,
                'size_bytes': part_size,
                'formatted_time': f"{math.floor(start_sec/60):02d}:{math.floor(start_sec%60):02d} - {math.floor(end_sec/60):02d}:{math.floor(end_sec%60):02d}",
            })

    if progress_callback:
        progress_callback(100, f"🎉 បានកាត់វីដេអូចំនួន {len(results)} ភាគជោគជ័យ!")

    return results


def merge_videos_sync(
    input_paths: List[str],
    output_dir: str,
    output_filename: str = 'merged_video.mp4',
    lossless: bool = True,
    target_resolution: str = 'auto', # 'auto' | '1080p' | '720p'
    progress_callback: Optional[Any] = None
) -> Dict[str, Any]:
    """
    Merge multiple short video clips into 1 continuous long video.
    """
    if not input_paths or len(input_paths) == 0:
        raise ValueError("No input video files provided to merge.")

    for p in input_paths:
        if not os.path.exists(p):
            raise FileNotFoundError(f"Clip not found: {p}")

    os.makedirs(output_dir, exist_ok=True)
    if not output_filename.endswith('.mp4'):
        output_filename += '.mp4'

    output_path = os.path.join(output_dir, output_filename)

    if progress_callback:
        progress_callback(10, f"កំពុងត្រៀមបញ្ចូលវីដេអូចំនួន {len(input_paths)} ឃ្លីប...")

    # Create temporary concat demuxer text file
    concat_txt_path = os.path.join(output_dir, f"concat_{int(time.time() * 1000)}.txt")
    with open(concat_txt_path, 'w', encoding='utf-8') as f:
        for p in input_paths:
            # Escape single quotes and backslashes for FFmpeg
            norm_p = p.replace('\\', '/')
            f.write(f"file '{norm_p}'\n")

    try:
        # Check if lossless stream copy works
        if lossless:
            if progress_callback:
                progress_callback(30, "កំពុងដំណើរការបញ្ចូលគ្នាភ្លាមៗបែប Lossless Concat Stream Copy...")
            cmd = (
                f'ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 '
                f'-i "{concat_txt_path}" -c copy "{output_path}"'
            )
            try:
                run_command(cmd)
            except Exception as e:
                # If stream copy fails due to differing resolutions/codecs, fall back to re-encoding
                if progress_callback:
                    progress_callback(40, "កូដិកវីដេអូខុសគ្នា ប្ដូរទៅជា Safe Re-encode 1080p ស្វ័យប្រវត្តិ...")
                lossless = False

        if not lossless or not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
            # Universal Re-encode: Scales to unified 1080p (or 720p) and standardizes audio
            scale_filter = "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1"
            if target_resolution == '720p':
                scale_filter = "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1"

            # Filter complex concat to ensure 100% smooth playback without drift
            inputs_str = " ".join([f'-i "{p}"' for p in input_paths])
            filter_parts = []
            for i in range(len(input_paths)):
                filter_parts.append(f"[{i}:v]{scale_filter},format=yuv420p[v{i}];")
                filter_parts.append(f"[{i}:a]aformat=sample_rates=44100:channel_layouts=stereo[a{i}];")

            concat_str = "".join([f"[v{i}][a{i}]" for i in range(len(input_paths))])
            filter_parts.append(f"{concat_str}concat=n={len(input_paths)}:v=1:a=1[outv][outa]")

            filter_complex = "".join(filter_parts)

            if progress_callback:
                progress_callback(50, f"កំពុង Render និងបញ្ចូល {len(input_paths)} វីដេអូជា {target_resolution if target_resolution != 'auto' else '1080p'}...")

            cmd = (
                f'ffmpeg -hide_banner -loglevel error -y {inputs_str} '
                f'-filter_complex "{filter_complex}" '
                f'-map "[outv]" -map "[outa]" '
                f'-c:v libx264 -preset veryfast -crf 20 '
                f'-c:a aac -b:a 192k '
                f'"{output_path}"'
            )
            run_command(cmd)

    finally:
        if os.path.exists(concat_txt_path):
            try:
                os.remove(concat_txt_path)
            except Exception:
                pass

    if not os.path.exists(output_path):
        raise RuntimeError("Failed to generate merged video file.")

    meta = get_video_metadata(output_path)
    file_size = os.path.getsize(output_path)

    if progress_callback:
        progress_callback(100, "🎉 បានបញ្ចូលវីដេអូទាំងអស់ចូលគ្នា ១០០% ជោគជ័យ!")

    return {
        'filename': output_filename,
        'url': f"/media/outputs/{output_filename}",
        'file_path': output_path,
        'duration': meta['duration'],
        'size_bytes': file_size,
        'width': meta['width'],
        'height': meta['height'],
    }

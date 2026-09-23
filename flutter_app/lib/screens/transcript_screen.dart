// lib/screens/transcript_screen.dart
// Transcript Screen — VoxCPM2 Khmer Neural Studio v4.1
// Clean glassmorphism, soft colors, user-friendly

import 'dart:io';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';

import '../services/transcript_service.dart';

// ── Shared color tokens (same as main.dart G class) ──────────────────────────
class _G {
  static const surface  = Color(0xFF1C2640);
  static const card     = Color(0xFF1E2A40);
  static const divider  = Color(0x1AFFFFFF);
  static const blue     = Color(0xFF4A90D9);
  static const blueSoft = Color(0xFF6AABEF);
  static const teal     = Color(0xFF2EC4B6);
  static const green    = Color(0xFF44CF6C);
  static const amber    = Color(0xFFFFC857);
  static const red      = Color(0xFFFF6B6B);
  static const purple   = Color(0xFF9B72CF);
  static const t0       = Color(0xFFF1F5FB);
  static const t1       = Color(0xFF9BAEC8);
  static const t2       = Color(0xFF4E6080);
}

class TranscriptScreen extends StatefulWidget {
  final List<TranscriptSegment> segments;
  final void Function(List<TranscriptSegment>) onSegmentsReady;
  final String serverUrl;
  final bool serverMode;
  final String geminiApiKey;
  final void Function(String)? onVideoPicked;

  const TranscriptScreen({
    super.key,
    required this.segments,
    required this.onSegmentsReady,
    required this.serverUrl,
    required this.serverMode,
    required this.geminiApiKey,
    this.onVideoPicked,
  });

  @override
  State<TranscriptScreen> createState() => _TranscriptScreenState();
}

class _TranscriptScreenState extends State<TranscriptScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _waveCtrl;

  File?   _videoFile;
  String? _videoName;
  int     _videoBytes = 0;

  bool   _isProcessing = false;
  double _progress     = 0.0;
  String _progressMsg  = '';
  String? _errorMsg;

  List<TranscriptSegment> _segments = [];
  final Set<int> _expanded = {};

  @override
  void initState() {
    super.initState();
    _waveCtrl = AnimationController(vsync: this, duration: 1600.ms)..repeat();
    _segments = List.from(widget.segments);
  }

  @override
  void dispose() {
    _waveCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickVideo() async {
    final r = await ImagePicker().pickVideo(source: ImageSource.gallery);
    if (r == null) return;
    final f = File(r.path);
    setState(() {
      _videoFile = f; _videoName = r.name;
      _videoBytes = f.lengthSync(); _errorMsg = null;
    });
    widget.onVideoPicked?.call(r.name);
    HapticFeedback.mediumImpact();
  }

  Future<void> _startTranscribe() async {
    if (_videoFile == null) { _toast('⚠️ ជ្រើសរើសវីដេអូជាមុន!', _G.amber); return; }
    HapticFeedback.heavyImpact();
    setState(() {
      _isProcessing = true; _progress = 0; _progressMsg = 'ចាប់ផ្ដើម...';
      _errorMsg = null; _segments = [];
    });
    try {
      List<TranscriptSegment> result;
      if (widget.serverMode) {
        result = await TranscriptService.transcribeViaServer(
          videoFile: _videoFile!, serverUrl: widget.serverUrl, scope: 'full',
          onProgress: (p, msg) => setState(() { _progress = p; _progressMsg = msg; }),
        );
      } else {
        if (widget.geminiApiKey.isEmpty || widget.geminiApiKey.startsWith('your_')) {
          throw Exception('Gemini API key ត្រូវការ! បញ្ចូល key ក្នុង Settings');
        }
        result = await TranscriptService.transcribeViaGemini(
          videoFile: _videoFile!, geminiApiKey: widget.geminiApiKey,
          onProgress: (p, msg) => setState(() { _progress = p; _progressMsg = msg; }),
        );
      }
      setState(() { _segments = result; _isProcessing = false; _progress = 1.0; });
      widget.onSegmentsReady(result);
      HapticFeedback.heavyImpact();
      _toast('✅ Transcript ${result.length} ឈុតរួចរាល់!', _G.green);
    } catch (e) {
      setState(() { _isProcessing = false; _progress = 0; _errorMsg = e.toString(); });
      _toast('❌ $e', _G.red);
    }
  }

  void _toast(String msg, Color color) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
      ..clearSnackBars()
      ..showSnackBar(SnackBar(
        content: Text(msg, style: GoogleFonts.kantumruyPro(color: Colors.white, fontSize: 13)),
        backgroundColor: color.withValues(alpha: 0.95),
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.all(14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        duration: 3.seconds,
      ));
  }

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      Expanded(child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
        children: [

          // Header
          _PageHeader(icon: '🎙️', title: 'Transcript', sub: 'ស្រង់ & បកប្រែសំឡេង')
              .animate().fadeIn(duration: 400.ms),
          const SizedBox(height: 14),

          // Video picker
          _VideoPickerCard(
            videoFile: _videoFile, videoName: _videoName, videoBytes: _videoBytes,
            onPick: _pickVideo,
          ).animate().fadeIn(duration: 450.ms).slideY(begin: 0.06, end: 0),
          const SizedBox(height: 10),

          // API badge
          _ApiBadge(serverMode: widget.serverMode, serverUrl: widget.serverUrl,
              hasKey: widget.geminiApiKey.isNotEmpty && !widget.geminiApiKey.startsWith('your_'))
              .animate(delay: 50.ms).fadeIn(),
          const SizedBox(height: 10),

          // Progress
          if (_isProcessing)
            _ProgressCard(progress: _progress, msg: _progressMsg, waveCtrl: _waveCtrl)
                .animate().fadeIn(),

          // Error
          if (_errorMsg != null)
            _ErrorBanner(msg: _errorMsg!).animate().fadeIn().shake(),

          // Results
          if (_segments.isNotEmpty) ...[
            const SizedBox(height: 4),
            _ResultsBadge(count: _segments.length).animate().fadeIn(),
            const SizedBox(height: 8),
            ..._segments.asMap().entries.map((e) => _SegCard(
              key: ValueKey(e.key), seg: e.value, index: e.key,
              expanded: _expanded.contains(e.key),
              onToggle: () => setState(() {
                _expanded.contains(e.key) ? _expanded.remove(e.key) : _expanded.add(e.key);
              }),
            ).animate(delay: Duration(milliseconds: e.key * 35)).fadeIn(duration: 350.ms)
             .slideY(begin: 0.05, end: 0)),
          ],

          if (!_isProcessing && _segments.isEmpty && _errorMsg == null)
            _EmptyHint().animate(delay: 200.ms).fadeIn(),

          const SizedBox(height: 16),
        ],
      )),

      // Bottom bar
      _BottomBar(
        hasVideo: _videoFile != null, isProcessing: _isProcessing,
        hasSegments: _segments.isNotEmpty,
        onTranscribe: _isProcessing ? null : _startTranscribe,
        onExport: _segments.isNotEmpty
            ? () { widget.onSegmentsReady(_segments); _toast('→ Export to Translate!', _G.teal); }
            : null,
      ),
    ]);
  }
}

// ── Sub-widgets ──────────────────────────────────────────────────────────────

class _PageHeader extends StatelessWidget {
  final String icon, title, sub;
  const _PageHeader({required this.icon, required this.title, required this.sub});
  @override
  Widget build(BuildContext context) => Row(children: [
    Container(
      width: 44, height: 44,
      decoration: BoxDecoration(
        color: _G.blue.withValues(alpha: 0.18),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: _G.blue.withValues(alpha: 0.35)),
      ),
      child: Center(child: Text(icon, style: const TextStyle(fontSize: 20))),
    ),
    const SizedBox(width: 12),
    Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(title, style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.w700, color: _G.t0)),
      Text(sub, style: GoogleFonts.kantumruyPro(fontSize: 12, color: _G.t1)),
    ]),
  ]);
}

class _VideoPickerCard extends StatefulWidget {
  final File? videoFile; final String? videoName; final int videoBytes;
  final VoidCallback onPick;
  const _VideoPickerCard({required this.videoFile, required this.videoName, required this.videoBytes, required this.onPick});
  @override State<_VideoPickerCard> createState() => _VideoPickerCardState();
}
class _VideoPickerCardState extends State<_VideoPickerCard> {
  bool _pressed = false;
  @override Widget build(BuildContext context) => _GCard(child: Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Text('📹 វីដេអូប្រភព', style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w600, color: _G.t0)),
        if (widget.videoFile != null)
          _Chip('ប្ដូរ', _G.teal, onTap: widget.onPick),
      ]),
      const SizedBox(height: 10),
      if (widget.videoFile == null)
        GestureDetector(
          onTapDown: (_) => setState(() => _pressed = true),
          onTapUp:   (_) { setState(() => _pressed = false); widget.onPick(); },
          onTapCancel: () => setState(() => _pressed = false),
          child: AnimatedContainer(
            duration: 180.ms, width: double.infinity, padding: const EdgeInsets.symmetric(vertical: 24),
            decoration: BoxDecoration(
              color: _G.blue.withValues(alpha: _pressed ? 0.15 : 0.06),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: _G.blue.withValues(alpha: _pressed ? 0.5 : 0.2), width: _pressed ? 1.5 : 1),
            ),
            child: Column(children: [
              Text('🎬', style: const TextStyle(fontSize: 32))
                  .animate(onPlay: (c) => c.repeat(reverse: true))
                  .scaleXY(end: 1.06, duration: 1400.ms),
              const SizedBox(height: 8),
              Text('ចុចជ្រើស Video', style: GoogleFonts.kantumruyPro(fontSize: 14, fontWeight: FontWeight.w600, color: _G.t0)),
              const SizedBox(height: 3),
              Text('MP4, MKV', style: GoogleFonts.outfit(fontSize: 11, color: _G.t2)),
            ]),
          ),
        )
      else
        Row(children: [
          Container(
            width: 40, height: 40,
            decoration: BoxDecoration(color: _G.green.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(10)),
            child: const Center(child: Text('🎥', style: TextStyle(fontSize: 20))),
          ),
          const SizedBox(width: 10),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(widget.videoName ?? 'video.mp4',
                style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w600, color: _G.t0),
                maxLines: 1, overflow: TextOverflow.ellipsis),
            Text('${(widget.videoBytes / 1048576).toStringAsFixed(1)} MB',
                style: GoogleFonts.outfit(fontSize: 11, color: _G.green)),
          ])),
          Icon(Icons.check_circle_rounded, color: _G.green, size: 20),
        ]).animate().fadeIn(duration: 350.ms).slideX(begin: 0.05, end: 0),
    ],
  ));
}

class _ApiBadge extends StatelessWidget {
  final bool serverMode, hasKey; final String serverUrl;
  const _ApiBadge({required this.serverMode, required this.serverUrl, required this.hasKey});
  @override Widget build(BuildContext context) {
    final color = serverMode ? _G.purple : (hasKey ? _G.teal : _G.amber);
    final label = serverMode ? '💻 $serverUrl' : (hasKey ? '🤖 Gemini AI — on device' : '⚠️ Gemini key missing — go to Settings');
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(children: [
        Container(width: 6, height: 6, decoration: BoxDecoration(shape: BoxShape.circle, color: color)),
        const SizedBox(width: 8),
        Expanded(child: Text(label, style: GoogleFonts.outfit(fontSize: 11, color: color, fontWeight: FontWeight.w500))),
      ]),
    );
  }
}

class _ProgressCard extends StatelessWidget {
  final double progress; final String msg; final AnimationController waveCtrl;
  const _ProgressCard({required this.progress, required this.msg, required this.waveCtrl});
  @override Widget build(BuildContext context) => _GCard(child: Column(children: [
    SizedBox(height: 36, child: AnimatedBuilder(
      animation: waveCtrl,
      builder: (context, _) => CustomPaint(
        size: const Size(double.infinity, 36),
        painter: _WavePainter(waveCtrl.value, _G.teal),
      ),
    )),
    const SizedBox(height: 12),
    Row(children: [
      SizedBox(width: 16, height: 16, child: CircularProgressIndicator(
          strokeWidth: 2, value: progress == 0 ? null : progress,
          color: _G.teal, backgroundColor: _G.t2.withValues(alpha: 0.2))),
      const SizedBox(width: 10),
      Expanded(child: Text(msg, style: GoogleFonts.kantumruyPro(fontSize: 12, color: _G.t1),
          maxLines: 2, overflow: TextOverflow.ellipsis)),
      Text('${(progress * 100).toInt()}%',
          style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w700, color: _G.teal)),
    ]),
    const SizedBox(height: 10),
    ClipRRect(borderRadius: BorderRadius.circular(4),
        child: LinearProgressIndicator(
          value: progress == 0 ? null : progress, minHeight: 4,
          backgroundColor: _G.t2.withValues(alpha: 0.15),
          valueColor: const AlwaysStoppedAnimation<Color>(_G.teal),
        )),
  ]));
}

class _WavePainter extends CustomPainter {
  final double t; final Color c;
  _WavePainter(this.t, this.c);
  @override void paint(Canvas canvas, Size size) {
    const n = 26;
    final bw = size.width / n;
    for (int i = 0; i < n; i++) {
      final ph = i / n * math.pi * 2;
      final h  = (math.sin(t * math.pi * 2 + ph) * 0.5 + 0.5) * (0.3 + 0.7 * math.sin(i * 0.5).abs());
      final bh = h * size.height;
      canvas.drawRRect(
        RRect.fromRectAndRadius(Rect.fromLTWH(i * bw + bw * 0.2, size.height - bh, bw * 0.6, bh), const Radius.circular(2)),
        Paint()..color = c.withValues(alpha: 0.3 + 0.6 * h),
      );
    }
  }
  @override bool shouldRepaint(_WavePainter o) => true;
}

class _ErrorBanner extends StatelessWidget {
  final String msg;
  const _ErrorBanner({required this.msg});
  @override Widget build(BuildContext context) => Container(
    margin: const EdgeInsets.symmetric(vertical: 6),
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(
      color: _G.red.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(12),
      border: Border.all(color: _G.red.withValues(alpha: 0.3)),
    ),
    child: Row(children: [
      Icon(Icons.error_outline_rounded, color: _G.red, size: 18),
      const SizedBox(width: 8),
      Expanded(child: Text(msg, style: GoogleFonts.outfit(fontSize: 12, color: _G.red))),
    ]),
  );
}

class _ResultsBadge extends StatelessWidget {
  final int count;
  const _ResultsBadge({required this.count});
  @override Widget build(BuildContext context) => Row(children: [
    Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: _G.green.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(8),
        border: Border.all(color: _G.green.withValues(alpha: 0.3)),
      ),
      child: Row(children: [
        Icon(Icons.check_circle_rounded, size: 13, color: _G.green),
        const SizedBox(width: 5),
        Text('$count ឈុត', style: GoogleFonts.outfit(fontSize: 11, color: _G.green, fontWeight: FontWeight.w600)),
      ]),
    ),
    const SizedBox(width: 8),
    Text('ចុចដើម្បីបើក', style: GoogleFonts.kantumruyPro(fontSize: 11, color: _G.t2)),
  ]);
}

class _SegCard extends StatelessWidget {
  final TranscriptSegment seg; final int index;
  final bool expanded; final VoidCallback onToggle;
  const _SegCard({super.key, required this.seg, required this.index, required this.expanded, required this.onToggle});

  Color get _gc => seg.gender == 'female' ? _G.amber : _G.blueSoft;

  String get _time {
    String f(double s) => s < 60 ? s.toStringAsFixed(1) : '${(s ~/ 60)}:${(s % 60).toStringAsFixed(1).padLeft(4, '0')}';
    return '${f(seg.start)} → ${f(seg.end)}';
  }

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onToggle,
    child: AnimatedContainer(
      duration: 220.ms, margin: const EdgeInsets.only(bottom: 7),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: expanded ? _gc.withValues(alpha: 0.06) : _G.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: _gc.withValues(alpha: expanded ? 0.35 : 0.15)),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          _Tag('#${index + 1}', _gc),
          const SizedBox(width: 6),
          _Tag(seg.gender == 'female' ? '👩' : '👨', _gc),
          const SizedBox(width: 6),
          Text(_time, style: GoogleFonts.outfit(fontSize: 10, color: _G.t2)),
          const Spacer(),
          Icon(expanded ? Icons.expand_less_rounded : Icons.expand_more_rounded, size: 17, color: _G.t2),
        ]),
        const SizedBox(height: 8),
        // Chinese text
        if (seg.chineseText.isNotEmpty)
          Text(seg.chineseText,
              style: GoogleFonts.outfit(fontSize: 13, color: _G.t0, height: 1.5),
              maxLines: expanded ? null : 2, overflow: expanded ? TextOverflow.visible : TextOverflow.ellipsis),
        // Khmer translation
        if (expanded && seg.khmerText.isNotEmpty) ...[
          const SizedBox(height: 8),
          Container(
            width: double.infinity, padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: _G.teal.withValues(alpha: 0.07), borderRadius: BorderRadius.circular(8),
              border: Border.all(color: _G.teal.withValues(alpha: 0.2)),
            ),
            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('🇰🇭 ', style: const TextStyle(fontSize: 12)),
              Expanded(child: Text(seg.khmerText,
                  style: GoogleFonts.kantumruyPro(fontSize: 14, color: _G.t0, height: 1.6))),
            ]),
          ),
        ],
      ]),
    ),
  );
}

class _EmptyHint extends StatelessWidget {
  @override Widget build(BuildContext context) => Container(
    margin: const EdgeInsets.only(top: 20),
    padding: const EdgeInsets.all(28),
    decoration: BoxDecoration(
      color: _G.card, borderRadius: BorderRadius.circular(18),
      border: Border.all(color: _G.divider),
    ),
    child: Column(children: [
      const Text('🎙️', style: TextStyle(fontSize: 40))
          .animate(onPlay: (c) => c.repeat(reverse: true)).scaleXY(end: 1.06, duration: 1400.ms),
      const SizedBox(height: 12),
      Text('ជ្រើស Video → ចុច Transcribe', style: GoogleFonts.kantumruyPro(fontSize: 14, color: _G.t1, fontWeight: FontWeight.w600), textAlign: TextAlign.center),
      const SizedBox(height: 4),
      Text('AI ស្រង់ Chinese + Khmer', style: GoogleFonts.outfit(fontSize: 12, color: _G.t2), textAlign: TextAlign.center),
    ]),
  );
}

class _BottomBar extends StatelessWidget {
  final bool hasVideo, isProcessing, hasSegments;
  final VoidCallback? onTranscribe, onExport;
  const _BottomBar({required this.hasVideo, required this.isProcessing, required this.hasSegments, required this.onTranscribe, required this.onExport});
  @override Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.fromLTRB(16, 10, 16, 16),
    decoration: BoxDecoration(
      color: _G.surface,
      border: Border(top: BorderSide(color: _G.divider)),
    ),
    child: Row(children: [
      Expanded(flex: 3, child: _Btn(
        label: isProcessing ? '⏳ AI...' : '🎙️  Transcribe',
        gradient: const LinearGradient(colors: [Color(0xFF2D6BCD), Color(0xFF2EC4B6)]),
        loading: isProcessing, onTap: onTranscribe,
      )),
      if (hasSegments) ...[
        const SizedBox(width: 10),
        Expanded(flex: 2, child: _Btn(
          label: '→ Translate',
          gradient: const LinearGradient(colors: [Color(0xFF2EC4B6), Color(0xFF44CF6C)]),
          onTap: onExport,
        )),
      ],
    ]),
  );
}

// ── Shared micro-widgets ─────────────────────────────────────────────────────

class _GCard extends StatelessWidget {
  final Widget child;
  const _GCard({required this.child});
  @override Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: _G.card, borderRadius: BorderRadius.circular(16),
      border: Border.all(color: _G.divider),
    ),
    child: child,
  );
}

class _Tag extends StatelessWidget {
  final String text; final Color color;
  const _Tag(this.text, this.color);
  @override Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
    decoration: BoxDecoration(color: color.withValues(alpha: 0.14), borderRadius: BorderRadius.circular(6)),
    child: Text(text, style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w700, color: color)),
  );
}

class _Chip extends StatelessWidget {
  final String label; final Color color; final VoidCallback? onTap;
  const _Chip(this.label, this.color, {this.onTap});
  @override Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(8), border: Border.all(color: color.withValues(alpha: 0.3))),
      child: Text(label, style: GoogleFonts.outfit(fontSize: 11, color: color, fontWeight: FontWeight.w600)),
    ),
  );
}

class _Btn extends StatefulWidget {
  final String label; final LinearGradient gradient; final VoidCallback? onTap; final bool loading;
  const _Btn({required this.label, required this.gradient, this.onTap, this.loading = false});
  @override State<_Btn> createState() => _BtnState();
}
class _BtnState extends State<_Btn> with SingleTickerProviderStateMixin {
  late AnimationController _p;
  @override void initState() { super.initState(); _p = AnimationController(vsync: this, duration: 100.ms); }
  @override void dispose() { _p.dispose(); super.dispose(); }
  @override Widget build(BuildContext context) => GestureDetector(
    onTapDown: widget.onTap != null ? (_) => _p.forward() : null,
    onTapUp:   widget.onTap != null ? (_) { _p.reverse(); widget.onTap?.call(); } : null,
    onTapCancel: () => _p.reverse(),
    child: AnimatedBuilder(
      animation: _p,
      builder: (context, _) => Transform.scale(scale: 1.0 - 0.02 * _p.value,
        child: AnimatedOpacity(opacity: widget.onTap == null ? 0.4 : 1.0, duration: 200.ms,
          child: Container(
            height: 48, decoration: BoxDecoration(gradient: widget.gradient, borderRadius: BorderRadius.circular(13),
              boxShadow: [BoxShadow(color: widget.gradient.colors.first.withValues(alpha: 0.3), blurRadius: 12, offset: const Offset(0, 3))]),
            child: Center(child: widget.loading
                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : Text(widget.label, style: GoogleFonts.kantumruyPro(fontSize: 14, fontWeight: FontWeight.w700, color: Colors.white))),
          ),
        ),
      ),
    ),
  );
}

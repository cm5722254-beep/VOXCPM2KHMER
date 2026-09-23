// lib/main.dart
// VoxCPM2 Khmer Neural Studio — v4.0
// 4-Tab Navigation: Home · Transcript · Translate · Workspace
//
// NEW in v4.0:
//  🎙️ Transcript — AI extract Chinese speech + Khmer translation from video
//  🌐 Translate  — Edit Khmer lines, gender/role, per-line re-translate
//  🎬 Workspace  — Dubbing pipeline (Local Edge TTS + FFmpeg / Server)
//  🏠 Home       — Mode switcher, status, quick start
//
// Animations: particle splash, 3D mode card, waveform, tab shimmer indicator,
//             stagger cards, neon buttons, scan-line progress

import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:math' as math;
import 'package:animated_text_kit/animated_text_kit.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:video_player/video_player.dart';

import 'services/edge_tts_service.dart';
import 'services/ffmpeg_service.dart';
import 'services/transcript_service.dart';
import 'screens/transcript_screen.dart';
import 'screens/translate_screen.dart';
import 'screens/login_screen.dart';

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN SYSTEM v4.0
// ─────────────────────────────────────────────────────────────────────────────

class C {
  static const bg0 = Color(0xFF03060F);
  static const bg1 = Color(0xFF080D1A);
  static const card = Color(0xFF0A1020);
  static const glass = Color(0x14FFFFFF);
  static const violet = Color(0xFF7C3AED);
  static const violetLight = Color(0xFFAB7FF8);
  static const violetGlow = Color(0x607C3AED);
  static const cyan = Color(0xFF06B6D4);
  static const cyanGlow = Color(0x4406B6D4);
  static const green = Color(0xFF10B981);
  static const greenGlow = Color(0x4410B981);
  static const pink = Color(0xFFEC4899);
  static const pinkGlow = Color(0x44EC4899);
  static const orange = Color(0xFFF97316);
  static const t0 = Color(0xFFF0F6FF);
  static const t1 = Color(0xFF94A3B8);
  static const t2 = Color(0xFF475569);
  static const sh0 = Color(0xFF1E293B);
  static const sh1 = Color(0xFF334155);
  static const localMode = green;
  static const serverMode = violet;
}

// ─────────────────────────────────────────────────────────────────────────────
// MODELS & ENUMS
// ─────────────────────────────────────────────────────────────────────────────

enum DubbingMode { local, server }

extension DubbingModeX on DubbingMode {
  String get label => this == DubbingMode.local ? 'Local Mode' : 'Server Mode';
  String get kh => this == DubbingMode.local ? 'ឯករាជ ១០០%' : 'ភ្ជាប់ PC WiFi';
  String get icon => this == DubbingMode.local ? '📱' : '💻';
  Color get color => this == DubbingMode.local ? C.green : C.violet;
  Color get glow => this == DubbingMode.local ? C.greenGlow : C.violetGlow;
  LinearGradient get grad => this == DubbingMode.local
      ? const LinearGradient(colors: [C.green, C.cyan])
      : const LinearGradient(colors: [C.violet, C.pink]);
}

enum TtsStatus { idle, generating, done, error }

class DialogueLine {
  int index;
  double start, end;
  String gender, text;
  String? audioPath, audioUrl;
  TtsStatus ttsStatus;

  DialogueLine({
    required this.index,
    required this.start,
    required this.end,
    required this.gender,
    required this.text,
    this.audioPath,
    this.audioUrl,
    this.ttsStatus = TtsStatus.idle,
  });

  factory DialogueLine.fromSegment(TranscriptSegment s) => DialogueLine(
    index: s.index,
    start: s.start,
    end: s.end,
    gender: s.gender,
    text: s.khmerText.isNotEmpty ? s.khmerText : s.chineseText,
  );

  Map<String, dynamic> toJson() => {
    'line_index': index,
    'start_time': start,
    'end_time': end,
    'gender': gender,
    'khmer_translation': text,
    'speaker_role': gender == 'female' ? 'female_lead' : 'male_lead',
  };

  DubbingSegment toSegment() => DubbingSegment(
    index: index,
    startTime: start,
    endTime: end,
    gender: gender,
    text: text,
    audioPath: audioPath,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ENTRY POINT
// ─────────────────────────────────────────────────────────────────────────────

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: C.bg0,
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );
  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  runApp(const _App());
}

class _App extends StatelessWidget {
  const _App();
  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'Khmer Neural Studio',
    debugShowCheckedModeBanner: false,
    theme: _theme(),
    home: const SplashScreen(),
  );

  ThemeData _theme() => ThemeData(
    brightness: Brightness.dark,
    scaffoldBackgroundColor: C.bg0,
    primaryColor: C.violet,
    colorScheme: const ColorScheme.dark(
      primary: C.violet,
      secondary: C.cyan,
      surface: C.card,
    ),
    textTheme: GoogleFonts.kantumruyProTextTheme(
      ThemeData.dark().textTheme.apply(bodyColor: C.t0),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: C.bg1,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: C.glass),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.08)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: C.violetLight, width: 1.5),
      ),
      hintStyle: const TextStyle(color: C.t2, fontSize: 13),
    ),
    pageTransitionsTheme: const PageTransitionsTheme(
      builders: {TargetPlatform.android: CupertinoPageTransitionsBuilder()},
    ),
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  🔮  SPLASH SCREEN
// ═════════════════════════════════════════════════════════════════════════════

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});
  @override
  State<SplashScreen> createState() => _SplashState();
}

class _SplashState extends State<SplashScreen> with TickerProviderStateMixin {
  late AnimationController _pulse, _scan, _particle;
  bool _show = false;

  @override
  void initState() {
    super.initState();
    _pulse = AnimationController(vsync: this, duration: 2400.ms)
      ..repeat(reverse: true);
    _scan = AnimationController(vsync: this, duration: 1800.ms)..repeat();
    _particle = AnimationController(vsync: this, duration: 6000.ms)..repeat();
    Future.delayed(300.ms, () {
      if (mounted) setState(() => _show = true);
    });
    Future.delayed(2500.ms, () async {
      if (!mounted) return;
      final prefs = await SharedPreferences.getInstance();
      final isLoggedIn = prefs.getBool('isLoggedIn') ?? false;
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        PageRouteBuilder(
          pageBuilder: (_, a, _) => isLoggedIn ? const AppShell() : const LoginScreen(),
          transitionsBuilder: (_, a, _, child) {
            final c = CurvedAnimation(parent: a, curve: Curves.easeInOut);
            return FadeTransition(
              opacity: c,
              child: ScaleTransition(
                scale: Tween(begin: 1.06, end: 1.0).animate(c),
                child: child,
              ),
            );
          },
          transitionDuration: 700.ms,
        ),
      );
    });
  }

  @override
  void dispose() {
    _pulse.dispose();
    _scan.dispose();
    _particle.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final sz = MediaQuery.of(context).size;
    return Scaffold(
      backgroundColor: C.bg0,
      body: Stack(
        children: [
          _ParticleField(ctrl: _particle, size: sz),
          _AmbientBlobs(ctrl: _pulse),
          _ScanLine(ctrl: _scan, size: sz),
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (_show)
                  AnimatedBuilder(
                        animation: _pulse,
                        builder: (_, _) => Container(
                          width: 124,
                          height: 124,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: RadialGradient(
                              colors: [C.violet.withValues(alpha: 0.9), C.bg0],
                              stops: const [0.45, 1.0],
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: C.violet.withValues(
                                  alpha: 0.25 + 0.35 * _pulse.value,
                                ),
                                blurRadius: 48 + 28 * _pulse.value,
                                spreadRadius: 4,
                              ),
                              BoxShadow(
                                color: C.cyan.withValues(
                                  alpha: 0.12 + 0.12 * _pulse.value,
                                ),
                                blurRadius: 80,
                                spreadRadius: 8,
                              ),
                            ],
                            border: Border.all(
                              color: C.violetLight.withValues(
                                alpha: 0.35 + 0.25 * _pulse.value,
                              ),
                              width: 1.5,
                            ),
                          ),
                          child: const Center(
                            child: Text('🎬', style: TextStyle(fontSize: 54)),
                          ),
                        ),
                      )
                      .animate()
                      .scale(
                        begin: const Offset(0.3, 0.3),
                        duration: 900.ms,
                        curve: Curves.elasticOut,
                      )
                      .fadeIn(duration: 400.ms),
                const SizedBox(height: 36),
                if (_show)
                  DefaultTextStyle(
                    style: GoogleFonts.outfit(
                      fontSize: 28,
                      fontWeight: FontWeight.w800,
                      color: C.t0,
                      letterSpacing: 0.5,
                    ),
                    child: AnimatedTextKit(
                      animatedTexts: [
                        TypewriterAnimatedText(
                          'Khmer Neural Studio',
                          speed: 60.ms,
                          cursor: '|',
                        ),
                      ],
                      totalRepeatCount: 1,
                      displayFullTextOnTap: true,
                    ),
                  ).animate(delay: 500.ms).fadeIn(),
                const SizedBox(height: 6),
                if (_show)
                  DefaultTextStyle(
                    style: GoogleFonts.kantumruyPro(
                      fontSize: 13,
                      color: C.cyan,
                      fontWeight: FontWeight.w500,
                    ),
                    child: AnimatedTextKit(
                      animatedTexts: [
                        FadeAnimatedText(
                          'v4.0 • Transcript + Translate + Dubbing',
                          duration: 3000.ms,
                        ),
                      ],
                      totalRepeatCount: 1,
                    ),
                  ).animate(delay: 900.ms).fadeIn(),
                const SizedBox(height: 30),
                if (_show)
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      _SChip('🎙️ Transcript', C.cyan, delay: 1100.ms),
                      const SizedBox(width: 6),
                      _SChip('🌐 Translate', C.orange, delay: 1250.ms),
                      const SizedBox(width: 6),
                      _SChip('🎬 Dubbing', C.violet, delay: 1400.ms),
                    ],
                  ),
                const SizedBox(height: 52),
                if (_show) _ShimmerBar().animate(delay: 1400.ms).fadeIn(),
                const SizedBox(height: 14),
                if (_show)
                  Text(
                    'v4.0 • កំពុងផ្ទុក...',
                    style: GoogleFonts.kantumruyPro(fontSize: 11, color: C.t2),
                  ).animate(delay: 1500.ms).fadeIn(),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Splash helpers ───────────────────────────────────────────────────────────

class _SChip extends StatelessWidget {
  final String l;
  final Color c;
  final Duration delay;
  const _SChip(this.l, this.c, {required this.delay});
  @override
  Widget build(BuildContext context) =>
      Container(
            padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 6),
            decoration: BoxDecoration(
              color: c.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: c.withValues(alpha: 0.4)),
              boxShadow: [
                BoxShadow(color: c.withValues(alpha: 0.2), blurRadius: 8),
              ],
            ),
            child: Text(
              l,
              style: GoogleFonts.outfit(
                fontSize: 11,
                color: c,
                fontWeight: FontWeight.w600,
              ),
            ),
          )
          .animate(delay: delay)
          .fadeIn(duration: 400.ms)
          .slideY(begin: 0.4, end: 0, curve: Curves.easeOut)
          .scale(begin: const Offset(0.85, 0.85), curve: Curves.easeOut);
}

class _ShimmerBar extends StatefulWidget {
  @override
  State<_ShimmerBar> createState() => _ShimmerBarState();
}

class _ShimmerBarState extends State<_ShimmerBar>
    with SingleTickerProviderStateMixin {
  late AnimationController _c;
  @override
  void initState() {
    super.initState();
    _c = AnimationController(vsync: this, duration: 1400.ms)..repeat();
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: _c,
    builder: (_, _) => Container(
      width: 240,
      height: 3,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(2),
        gradient: LinearGradient(
          begin: Alignment(_c.value * 3 - 2, 0),
          end: Alignment(_c.value * 3, 0),
          colors: const [C.sh0, C.violet, C.cyan, C.sh0],
        ),
      ),
    ),
  );
}

class _ParticleField extends StatelessWidget {
  final AnimationController ctrl;
  final Size size;
  const _ParticleField({required this.ctrl, required this.size});
  static final _rng = math.Random(42);
  static final _ps = List.generate(
    40,
    (i) => _Pt(
      x: _rng.nextDouble(),
      y: _rng.nextDouble(),
      r: 0.8 + _rng.nextDouble() * 1.6,
      sp: 0.04 + _rng.nextDouble() * 0.12,
      a: 0.08 + _rng.nextDouble() * 0.18,
      ph: _rng.nextDouble() * math.pi * 2,
    ),
  );
  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: ctrl,
    builder: (_, _) =>
        CustomPaint(size: size, painter: _PtPainter(_ps, ctrl.value)),
  );
}

class _Pt {
  final double x, y, r, sp, a, ph;
  const _Pt({
    required this.x,
    required this.y,
    required this.r,
    required this.sp,
    required this.a,
    required this.ph,
  });
}

class _PtPainter extends CustomPainter {
  final List<_Pt> ps;
  final double t;
  _PtPainter(this.ps, this.t);
  @override
  void paint(Canvas canvas, Size size) {
    for (final p in ps) {
      final py = (p.y + t * p.sp) % 1.0;
      final g = (math.sin(t * math.pi * 2 * p.sp * 4 + p.ph) + 1) / 2;
      canvas.drawCircle(
        Offset(p.x * size.width, py * size.height),
        p.r * (0.8 + 0.4 * g),
        Paint()..color = C.violetLight.withValues(alpha: p.a * (0.5 + 0.5 * g)),
      );
    }
  }

  @override
  bool shouldRepaint(_PtPainter o) => true;
}

class _ScanLine extends StatelessWidget {
  final AnimationController ctrl;
  final Size size;
  const _ScanLine({required this.ctrl, required this.size});
  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: ctrl,
    builder: (_, _) => Positioned(
      top: ctrl.value * size.height,
      left: 0,
      right: 0,
      child: Container(
        height: 2,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              Colors.transparent,
              C.violet.withValues(alpha: 0.18),
              C.cyan.withValues(alpha: 0.3),
              C.violet.withValues(alpha: 0.18),
              Colors.transparent,
            ],
          ),
        ),
      ),
    ),
  );
}

class _AmbientBlobs extends StatelessWidget {
  final AnimationController ctrl;
  const _AmbientBlobs({required this.ctrl});
  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: ctrl,
    builder: (_, _) => Stack(
      children: [
        Positioned(
          top: -100,
          left: -80,
          child: _b(C.violet.withValues(alpha: 0.10 + 0.06 * ctrl.value), 300),
        ),
        Positioned(
          bottom: -120,
          right: -100,
          child: _b(C.cyan.withValues(alpha: 0.07 + 0.05 * ctrl.value), 340),
        ),
        Positioned(
          top: MediaQuery.of(context).size.height * 0.38,
          right: -60,
          child: _b(C.pink.withValues(alpha: 0.05 + 0.03 * ctrl.value), 200),
        ),
      ],
    ),
  );
  Widget _b(Color c, double s) => Container(
    width: s,
    height: s,
    decoration: BoxDecoration(shape: BoxShape.circle, color: c),
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  📱  APP SHELL  — 4-Tab Navigation
// ═════════════════════════════════════════════════════════════════════════════

class AppShell extends StatefulWidget {
  const AppShell({super.key});
  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> with TickerProviderStateMixin {
  late AnimationController _bgCtrl;
  late AnimationController _tabCtrl;

  int _tab = 0; // 0=Home 1=Transcript 2=Translate 3=Workspace

  // ── Shared state across tabs
  DubbingMode _mode = DubbingMode.local;
  String _serverUrl = 'http://192.168.50.202:3000';
  String _geminiKey = '';
  bool _serverOnline = false, _checkingServer = false;

  // Transcript/Translate shared segments
  List<TranscriptSegment> _segments = [];

  // Workspace state
  File? _videoFile;
  String? _uploadedFilename, _originalFilename;
  int _videoBytes = 0;

  List<DialogueLine> _lines = [];
  bool _isUploading = false, _isGenerating = false;
  double _progress = 0.0;
  String _progressMsg = '';
  String? _exportedUrl, _exportedPath;
  String? _animeTitle;

  @override
  void initState() {
    super.initState();
    _bgCtrl = AnimationController(vsync: this, duration: 4000.ms)
      ..repeat(reverse: true);
    _tabCtrl = AnimationController(vsync: this, duration: 300.ms);
    _initDefaultLines();
    _loadSettings();
  }

  @override
  void dispose() {
    _bgCtrl.dispose();
    _tabCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadSettings() async {
    final p = await SharedPreferences.getInstance();
    setState(() {
      _serverUrl = p.getString('serverUrl') ?? 'http://192.168.50.202:3000';
      _geminiKey = p.getString('geminiKey') ?? '';
      _mode = p.getBool('localMode') == false
          ? DubbingMode.server
          : DubbingMode.local;
    });
    if (_mode == DubbingMode.server) _checkConnection();
  }

  Future<void> _saveSettings() async {
    final p = await SharedPreferences.getInstance();
    await p.setString('serverUrl', _serverUrl);
    await p.setString('geminiKey', _geminiKey);
    await p.setBool('localMode', _mode == DubbingMode.local);
  }

  void _toggleMode() {
    HapticFeedback.selectionClick();
    setState(() {
      _mode = _mode == DubbingMode.local
          ? DubbingMode.server
          : DubbingMode.local;
      _exportedUrl = _exportedPath = null;
    });
    if (_mode == DubbingMode.server) _checkConnection();
    _saveSettings();
  }

  Future<void> _checkConnection() async {
    setState(() {
      _checkingServer = true;
      _serverOnline = false;
    });
    try {
      final r = await http
          .get(Uri.parse('$_serverUrl/health'))
          .timeout(5.seconds);
      setState(() => _serverOnline = r.statusCode == 200);
    } catch (_) {
      setState(() => _serverOnline = false);
    } finally {
      setState(() => _checkingServer = false);
    }
  }

  void _initDefaultLines() {
    _lines = [
      DialogueLine(
        index: 0,
        start: 0.0,
        end: 4.0,
        gender: 'male',
        text: 'សួស្តីបងប្អូនទាំងអស់គ្នា!',
      ),
      DialogueLine(
        index: 1,
        start: 4.5,
        end: 8.0,
        gender: 'female',
        text: 'ពិតជាអស្ចារ្យណាស់ ថ្ងៃនេះ!',
      ),
    ];
  }

  void _setTab(int t) {
    if (_tab == t) return;
    HapticFeedback.selectionClick();
    setState(() => _tab = t);
  }

  // Called from Transcript screen when segments are ready
  void _onSegmentsReady(List<TranscriptSegment> segs) {
    setState(() {
      _segments = segs;
      // Auto-populate workspace lines from segments
      if (segs.isNotEmpty) {
        _lines = segs.map((s) => DialogueLine.fromSegment(s)).toList();
      }
    });
  }

  // Called from Translate screen — export to Workspace
  void _onExportToWorkspace(List<TranscriptSegment> segs) {
    setState(() {
      _segments = segs;
      _lines = segs.map((s) => DialogueLine.fromSegment(s)).toList();
      _tab = 3; // jump to Workspace
    });
    HapticFeedback.heavyImpact();
  }

  // ── Workspace methods
  void _detectAnimeTitle(String? filename) {
    if (filename == null) return;
    String name = "Anime Dub Studio";
    final epMatch = RegExp(r'ep(?:isode)?\s*(\d+)', caseSensitive: false).firstMatch(filename);
    String ep = epMatch != null ? epMatch.group(1)! : "01";
    setState(() => _animeTitle = '$name - Ep $ep');
  }

  Future<void> _pickVideoForWorkspace() async {
    try {
      final r = await ImagePicker().pickVideo(source: ImageSource.gallery);
      if (r == null) return;
      final f = File(r.path);
      setState(() {
        _videoFile = f;
        _originalFilename = r.name;
        _videoBytes = f.lengthSync();
        _exportedUrl = _exportedPath = null;
      });
      _detectAnimeTitle(r.name);
      HapticFeedback.mediumImpact();
      if (_mode == DubbingMode.server) {
        await _uploadToServer(f);
      } else {
        _showToast('✅ ជ្រើសរើសវីដេអូ!', C.green);
      }
    } catch (e) {
      _showToast('⚠️ $e', Colors.redAccent);
    }
  }

  Future<void> _uploadToServer(File file) async {
    setState(() {
      _isUploading = true;
      _progress = 0.15;
      _progressMsg = 'Upload...';
    });
    try {
      final req = http.MultipartRequest(
        'POST',
        Uri.parse('$_serverUrl/api/upload'),
      );
      req.files.add(await http.MultipartFile.fromPath('mediaFile', file.path));
      final res = await http.Response.fromStream(await req.send());
      if (res.statusCode == 200) {
        final d = jsonDecode(res.body);
        setState(() {
          _uploadedFilename = d['filename'];
          _isUploading = false;
          _progress = 0;
        });
        _showToast('✅ Upload!', C.green);
      } else {
        throw Exception('HTTP ${res.statusCode}');
      }
    } catch (e) {
      setState(() {
        _isUploading = false;
        _progress = 0;
      });
      _showToast('⚠️ $e', Colors.redAccent);
    }
  }

  Future<void> _generateDubbing() async {
    if (_videoFile == null) {
      _showToast('⚠️ ជ្រើសរើសវីដេអូ!', Colors.orange);
      return;
    }
    if (_lines.isEmpty) {
      _showToast('⚠️ ត្រូវការ Transcript!', Colors.orange);
      return;
    }
    HapticFeedback.heavyImpact();
    _mode == DubbingMode.local
        ? await _generateLocal()
        : await _generateServer();
  }

  Future<void> _generateLocal() async {
    setState(() {
      _isGenerating = true;
      _progress = 0.05;
      _progressMsg = '🎤 Edge TTS...';
      for (final l in _lines) {
        l.ttsStatus = TtsStatus.idle;
        l.audioPath = null;
      }
    });
    try {
      final segs = _lines.where((l) => l.text.trim().isNotEmpty).toList();
      int done = 0;
      for (int i = 0; i < segs.length; i += 3) {
        final chunk = segs.sublist(i, (i + 3).clamp(0, segs.length));
        for (final l in chunk) {
          setState(() => l.ttsStatus = TtsStatus.generating);
        }
        await Future.wait(
          chunk.map((line) async {
            try {
              final r = await EdgeTtsService.generateForGender(
                text: line.text,
                gender: line.gender,
              );
              setState(() {
                line.audioPath = r.filePath;
                line.ttsStatus = TtsStatus.done;
              });
            } catch (_) {
              setState(() => line.ttsStatus = TtsStatus.error);
            } finally {
              done++;
              setState(() {
                _progress = 0.05 + (done / segs.length) * 0.55;
                _progressMsg = '🎤 TTS $done/${segs.length}';
              });
            }
          }),
        );
      }
      setState(() {
        _progress = 0.65;
        _progressMsg = '🎬 Server FFmpeg Mix...';
      });
      final ds = segs
          .where((l) => l.audioPath != null)
          .map((l) => l.toSegment())
          .toList();
      if (ds.isEmpty) throw Exception('TTS failed for all segments');

      // Phone generates TTS locally, server does the FFmpeg mix
      final videoUrl = await FfmpegService.assembleDubbingViaServer(
        videoPath: _videoFile!.path,
        segments: ds,
        serverUrl: _serverUrl,
        onProgress: (step, frac) => setState(() {
          _progress = 0.65 + frac * 0.32;
          _progressMsg = step;
        }),
      );

      setState(() {
        _isGenerating = false;
        _progress = 1.0;
        _exportedUrl = videoUrl;
        _exportedPath = null;
      });
      HapticFeedback.heavyImpact();
      _showToast('🎉 Dubbed ready!', C.green);
    } catch (e) {
      setState(() {
        _isGenerating = false;
        _progress = 0;
      });
      _showToast('❌ $e', Colors.redAccent);
    }
  }

  Future<void> _generateServer() async {
    if (_uploadedFilename == null) {
      _showToast('⚠️ Upload ជាមុន!', Colors.orange);
      return;
    }
    setState(() {
      _isGenerating = true;
      _progress = 0.2;
      _progressMsg = 'Server TTS...';
    });
    try {
      setState(() {
        _progress = 0.5;
        _progressMsg = 'Server Mix...';
      });
      final r = await http.post(
        Uri.parse('$_serverUrl/api/dubbing/assemble-custom'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'filename': _uploadedFilename,
          'segments': _lines.map((l) => l.toJson()).toList(),
        }),
      );
      if (r.statusCode == 200) {
        final d = jsonDecode(r.body);
        if (d['success'] == true && d['videoUrl'] != null) {
          setState(() {
            _isGenerating = false;
            _progress = 1.0;
            _exportedUrl = '$_serverUrl${d['videoUrl']}';
            _exportedPath = null;
          });
          HapticFeedback.heavyImpact();
          _showToast('🎉 Done!', C.green);
        } else {
          throw Exception(d['error'] ?? 'Server Error');
        }
      } else {
        throw Exception('HTTP ${r.statusCode}');
      }
    } catch (e) {
      setState(() {
        _isGenerating = false;
        _progress = 0;
      });
      _showToast('❌ $e', Colors.redAccent);
    }
  }

  void _showToast(String msg, Color color) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
      ..clearSnackBars()
      ..showSnackBar(
        SnackBar(
          content: Text(
            msg,
            style: GoogleFonts.kantumruyPro(color: Colors.white, fontSize: 13),
          ),
          backgroundColor: color.withValues(alpha: 0.95),
          behavior: SnackBarBehavior.floating,
          margin: const EdgeInsets.all(14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          duration: 3.seconds,
        ),
      );
  }

  // ── BUILD
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: C.bg0,
      extendBody: true,
      appBar: _buildAppBar(),
      body: Stack(
        children: [
          _AmbientBlobs(ctrl: _bgCtrl),
          SafeArea(
            bottom: false,
            child: IndexedStack(
              index: _tab,
              children: [
                // Tab 0: Home
                _HomeScreen(
                  mode: _mode,
                  animeTitle: _animeTitle,
                  serverOnline: _serverOnline,
                  checkingServer: _checkingServer,
                  serverUrl: _serverUrl,
                  segmentCount: _segments.length,
                  lineCount: _lines.length,
                  onToggleMode: _toggleMode,
                  onGoTranscript: () => _setTab(1),
                  onGoWorkspace: () => _setTab(3),
                ),
                // Tab 1: Transcript
                TranscriptScreen(
                  segments: _segments,
                  onSegmentsReady: _onSegmentsReady,
                  serverUrl: _serverUrl,
                  serverMode: _mode == DubbingMode.server,
                  geminiApiKey: _geminiKey,
                  onVideoPicked: _detectAnimeTitle,
                ),
                // Tab 2: Translate
                TranslateScreen(
                  segments: _segments,
                  onExportToWorkspace: _onExportToWorkspace,
                  geminiApiKey: _geminiKey,
                  serverMode: _mode == DubbingMode.server,
                ),
                // Tab 3: Workspace
                _WorkspaceScreen(
                  mode: _mode,
                  lines: _lines,
                  videoFile: _videoFile,
                  originalFilename: _originalFilename,
                  videoBytes: _videoBytes,
                  isUploading: _isUploading,
                  isGenerating: _isGenerating,
                  progress: _progress,
                  progressMsg: _progressMsg,
                  exportedUrl: _exportedUrl,
                  exportedPath: _exportedPath,
                  serverUrl: _serverUrl,
                  onPickVideo: _pickVideoForWorkspace,
                  onGenerate: _generateDubbing,
                  onAddLine: () => setState(() {
                    final s = _lines.isNotEmpty ? _lines.last.end + 0.5 : 0.0;
                    _lines.add(
                      DialogueLine(
                        index: _lines.length,
                        start: s,
                        end: s + 3.5,
                        gender: _lines.length % 2 == 0 ? 'male' : 'female',
                        text: '',
                      ),
                    );
                  }),
                  onRemoveLine: (l) => setState(() => _lines.remove(l)),
                  onLineChanged: (_) => setState(() {}),
                  onShowToast: _showToast,
                ),
              ],
            ),
          ),
        ],
      ),
      bottomNavigationBar: _AnimatedTabBar(
        currentIndex: _tab,
        onTap: _setTab,
        mode: _mode,
        segmentCount: _segments.length,
      ),
    );
  }

  AppBar _buildAppBar() {
    final tabTitles = ['Home', 'Transcript', 'Translate', 'Workspace'];
    final tabIcons = ['🏠', '🎙️', '🌐', '🎬'];
    return AppBar(
      backgroundColor: Colors.transparent,
      elevation: 0,
      flexibleSpace: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [C.bg0.withValues(alpha: 0.98), Colors.transparent],
          ),
        ),
      ),
      title: Row(
        children: [
          // Neon logo
          Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(9),
                  gradient: const LinearGradient(colors: [C.violet, C.pink]),
                  boxShadow: [BoxShadow(color: C.violetGlow, blurRadius: 12)],
                ),
                child: const Center(
                  child: Text('🎬', style: TextStyle(fontSize: 17)),
                ),
              )
              .animate(onPlay: (c) => c.repeat(reverse: true))
              .shimmer(
                duration: 2400.ms,
                color: C.violetLight.withValues(alpha: 0.3),
              ),
          const SizedBox(width: 10),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '${tabIcons[_tab]} ${tabTitles[_tab]}',
                style: GoogleFonts.outfit(
                  fontWeight: FontWeight.w700,
                  fontSize: 15,
                  color: C.t0,
                ),
              ),
              Text(
                'Khmer Neural Studio v4.0',
                style: GoogleFonts.outfit(
                  fontSize: 9,
                  color: C.t2,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ],
      ),
      actions: [
        _ModePill(mode: _mode, onToggle: _toggleMode),
        const SizedBox(width: 4),
        IconButton(
          icon: const Icon(Icons.tune_rounded, size: 19, color: C.t1),
          onPressed: _showSettings,
        ),
      ],
    );
  }

  void _showSettings() {
    final urlCtrl = TextEditingController(text: _serverUrl);
    final keyCtrl = TextEditingController(text: _geminiKey);
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
        child: _SettingsSheet(
          serverUrl: _serverUrl,
          geminiKey: _geminiKey,
          mode: _mode,
          urlCtrl: urlCtrl,
          keyCtrl: keyCtrl,
          onSave: (url, key) {
            setState(() {
              _serverUrl = url;
              _geminiKey = key;
            });
            _saveSettings();
            if (_mode == DubbingMode.server) _checkConnection();
            Navigator.pop(ctx);
            _showToast('✅ Saved!', C.green);
          },
          onToggleMode: () {
            _toggleMode();
            Navigator.pop(ctx);
          },
        ),
      ),
    );
  }
}

// ═════════════════════════════════════════════════════════════════════════════
//  🎯  ANIMATED TAB BAR
// ═════════════════════════════════════════════════════════════════════════════

class _AnimatedTabBar extends StatefulWidget {
  final int currentIndex;
  final void Function(int) onTap;
  final DubbingMode mode;
  final int segmentCount;
  const _AnimatedTabBar({
    required this.currentIndex,
    required this.onTap,
    required this.mode,
    required this.segmentCount,
  });
  @override
  State<_AnimatedTabBar> createState() => _AnimatedTabBarState();
}

class _AnimatedTabBarState extends State<_AnimatedTabBar>
    with SingleTickerProviderStateMixin {
  late AnimationController _shimmerCtrl;

  static const _tabs = [
    ('🏠', 'Home'),
    ('🎙️', 'Transcript'),
    ('🌐', 'Translate'),
    ('🎬', 'Workspace'),
  ];

  @override
  void initState() {
    super.initState();
    _shimmerCtrl = AnimationController(vsync: this, duration: 1600.ms)
      ..repeat();
  }

  @override
  void dispose() {
    _shimmerCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 72 + MediaQuery.of(context).padding.bottom,
      decoration: BoxDecoration(
        color: C.bg1,
        border: const Border(top: BorderSide(color: C.glass)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.5),
            blurRadius: 20,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Row(
          children: _tabs.asMap().entries.map((e) {
            final i = e.key;
            final tab = e.value;
            final active = widget.currentIndex == i;
            final color = active ? widget.mode.color : C.t2;

            // Badge for Translate tab
            final hasBadge = i == 2 && widget.segmentCount > 0;

            return Expanded(
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: () => widget.onTap(i),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Icon with active indicator
                    Stack(
                      alignment: Alignment.topRight,
                      children: [
                        AnimatedContainer(
                          duration: 250.ms,
                          curve: Curves.easeOut,
                          width: 40,
                          height: 34,
                          decoration: BoxDecoration(
                            color: active
                                ? color.withValues(alpha: 0.15)
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: active
                                ? [
                                    BoxShadow(
                                      color: color.withValues(alpha: 0.3),
                                      blurRadius: 10,
                                    ),
                                  ]
                                : [],
                          ),
                          child: Center(
                            child: AnimatedDefaultTextStyle(
                              duration: 200.ms,
                              style: TextStyle(fontSize: active ? 20 : 18),
                              child: Text(tab.$1),
                            ),
                          ),
                        ),
                        // Shimmer indicator for active
                        if (active)
                          Positioned(
                            bottom: 0,
                            left: 0,
                            right: 0,
                            child: AnimatedBuilder(
                              animation: _shimmerCtrl,
                              builder: (_, _) => Container(
                                height: 2,
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(1),
                                  gradient: LinearGradient(
                                    begin: Alignment(
                                      _shimmerCtrl.value * 3 - 2,
                                      0,
                                    ),
                                    end: Alignment(_shimmerCtrl.value * 3, 0),
                                    colors: [
                                      Colors.transparent,
                                      color,
                                      color.withValues(alpha: 0.5),
                                      Colors.transparent,
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ),
                        // Notification dot
                        if (hasBadge)
                          Positioned(
                            top: 2,
                            right: 2,
                            child:
                                Container(
                                      width: 8,
                                      height: 8,
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        color: C.orange,
                                        boxShadow: [
                                          BoxShadow(
                                            color: C.orange.withValues(
                                              alpha: 0.6,
                                            ),
                                            blurRadius: 4,
                                          ),
                                        ],
                                      ),
                                    )
                                    .animate(
                                      onPlay: (c) => c.repeat(reverse: true),
                                    )
                                    .scaleXY(end: 1.3, duration: 700.ms),
                          ),
                      ],
                    ),
                    const SizedBox(height: 3),
                    AnimatedDefaultTextStyle(
                      duration: 200.ms,
                      style: GoogleFonts.outfit(
                        fontSize: active ? 10.5 : 10,
                        color: color,
                        fontWeight: active ? FontWeight.w700 : FontWeight.w400,
                      ),
                      child: Text(tab.$2),
                    ),
                  ],
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }
}

// ═════════════════════════════════════════════════════════════════════════════
//  🏠  HOME SCREEN
// ═════════════════════════════════════════════════════════════════════════════

class _HomeScreen extends StatefulWidget {
  final DubbingMode mode;
  final String? animeTitle;
  final bool serverOnline, checkingServer;
  final String serverUrl;
  final int segmentCount, lineCount;
  final VoidCallback onToggleMode, onGoTranscript, onGoWorkspace;
  const _HomeScreen({
    required this.mode,
    this.animeTitle,
    required this.serverOnline,
    required this.checkingServer,
    required this.serverUrl,
    required this.segmentCount,
    required this.lineCount,
    required this.onToggleMode,
    required this.onGoTranscript,
    required this.onGoWorkspace,
  });
  @override
  State<_HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<_HomeScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _wave;
  @override
  void initState() {
    super.initState();
    _wave = AnimationController(vsync: this, duration: 2000.ms)..repeat();
  }

  @override
  void dispose() {
    _wave.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Anime Glowing Logo / Title
          if (widget.animeTitle != null)
            _AnimeGlowingLogo(title: widget.animeTitle!)
                .animate().fadeIn(duration: 500.ms).slideY(begin: -0.1, end: 0)
          else
            _AnimeGlowingLogo(title: 'Anime Dub Wizard')
                .animate().fadeIn(duration: 500.ms).slideY(begin: -0.1, end: 0),
          const SizedBox(height: 16),

          // ── Mode hero card
          _Mode3DCard(
            mode: widget.mode,
            onToggle: widget.onToggleMode,
          ).animate().fadeIn(duration: 500.ms).slideY(begin: 0.1, end: 0),
          const SizedBox(height: 16),

          // ── Status cards row
          Row(
            children: [
              Expanded(
                child: _StatusCard(
                  icon: '🎙️',
                  title: 'Transcript',
                  value: '${widget.segmentCount} ឈុត',
                  color: C.cyan,
                  onTap: widget.onGoTranscript,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _StatusCard(
                  icon: '🎬',
                  title: 'Workspace',
                  value: '${widget.lineCount} lines',
                  color: C.violet,
                  onTap: widget.onGoWorkspace,
                ),
              ),
            ],
          ).animate(delay: 80.ms).fadeIn().slideY(begin: 0.1, end: 0),
          const SizedBox(height: 16),

          // ── Waveform banner
          _WaveBanner(
            ctrl: _wave,
            mode: widget.mode,
          ).animate(delay: 120.ms).fadeIn().slideY(begin: 0.1, end: 0),
          const SizedBox(height: 18),

          // ── Feature grid
          Text(
            '✨ លក្ខណៈពិសេស v4.0',
            style: GoogleFonts.kantumruyPro(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: C.t1,
            ),
          ).animate(delay: 160.ms).fadeIn(),
          const SizedBox(height: 10),

          ..._homeFeatures.asMap().entries.map(
            (e) => _FeatureRow(
              emoji: e.value[0],
              title: e.value[1],
              sub: e.value[2],
              color: _fc(e.value[3]),
              delay: Duration(milliseconds: 200 + e.key * 70),
            ),
          ),

          const SizedBox(height: 24),

          // ── Quick-start CTA
          _NeonCTA(
            label: '🎙️ ចាប់ផ្ដើម Transcript',
            gradient: const LinearGradient(colors: [C.cyan, C.violet]),
            onTap: widget.onGoTranscript,
          ).animate(delay: 550.ms).fadeIn().slideY(begin: 0.3, end: 0),

          const SizedBox(height: 10),

          _NeonCTA(
            label: '🎬 ចូល Workspace',
            gradient: const LinearGradient(colors: [C.violet, C.pink]),
            onTap: widget.onGoWorkspace,
            height: 50,
          ).animate(delay: 620.ms).fadeIn(),

          const SizedBox(height: 14),
          Center(
            child: Text(
              'v4.0 • Transcript + Translate + Dubbing',
              style: GoogleFonts.outfit(fontSize: 11, color: C.t2),
            ),
          ).animate(delay: 700.ms).fadeIn(),
        ],
      ),
    );
  }

  static const _homeFeatures = [
    ['🎙️', 'AI Transcript', 'ស្រង់ Chinese + ​ Khmer translation', 'a'],
    ['🌐', 'Khmer Translate', 'កែ + Re-translate per line with Gemini', 'o'],
    ['📱', 'Local Dubbing', 'Edge TTS + FFmpeg on device', 'g'],
    ['💻', 'Server Dubbing', 'PC server handles mixing', 'v'],
  ];
  static Color _fc(String k) => switch (k) {
    'v' => C.violet,
    'a' => C.cyan,
    'g' => C.green,
    'o' => C.orange,
    _ => C.pink,
  };
}

class _AnimeGlowingLogo extends StatefulWidget {
  final String title;
  const _AnimeGlowingLogo({required this.title});
  @override
  State<_AnimeGlowingLogo> createState() => _AnimeGlowingLogoState();
}

class _AnimeGlowingLogoState extends State<_AnimeGlowingLogo> with SingleTickerProviderStateMixin {
  late AnimationController _c;
  @override
  void initState() {
    super.initState();
    _c = AnimationController(vsync: this, duration: 2500.ms)..repeat(reverse: true);
  }
  @override
  void dispose() { _c.dispose(); super.dispose(); }
  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
      decoration: BoxDecoration(
        color: C.card,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: C.cyan.withValues(alpha: 0.3), width: 1.5),
        boxShadow: [
          BoxShadow(color: C.cyanGlow, blurRadius: 20, spreadRadius: 2),
        ],
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            C.cyan.withValues(alpha: 0.15),
            C.violet.withValues(alpha: 0.05),
          ],
        ),
      ),
      child: AnimatedBuilder(
        animation: _c,
        builder: (_, child) {
          return Column(
            children: [
              Container(
                width: 70, height: 70,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: C.cyan.withValues(alpha: 0.3 + 0.3 * _c.value),
                      blurRadius: 30 + 20 * _c.value,
                    )
                  ],
                  gradient: const RadialGradient(colors: [C.cyan, C.violet]),
                ),
                child: const Center(child: Text('⚔️', style: TextStyle(fontSize: 32))),
              ),
              const SizedBox(height: 14),
              Text(
                widget.title,
                textAlign: TextAlign.center,
                style: GoogleFonts.outfit(
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                  color: C.t0,
                  letterSpacing: 1.2,
                  shadows: [
                    Shadow(color: C.cyan, blurRadius: 10 + 5 * _c.value)
                  ],
                ),
              ),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: C.violet.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: C.violetLight.withValues(alpha: 0.5)),
                ),
                child: Text(
                  'Cyberpunk Neural Studio',
                  style: GoogleFonts.outfit(fontSize: 10, color: C.violetLight, fontWeight: FontWeight.w700),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _StatusCard extends StatefulWidget {
  final String icon, title, value;
  final Color color;
  final VoidCallback onTap;
  const _StatusCard({
    required this.icon,
    required this.title,
    required this.value,
    required this.color,
    required this.onTap,
  });
  @override
  State<_StatusCard> createState() => _StatusCardState();
}

class _StatusCardState extends State<_StatusCard> {
  bool _p = false;
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTapDown: (_) => setState(() => _p = true),
    onTapUp: (_) {
      setState(() => _p = false);
      widget.onTap();
    },
    onTapCancel: () => setState(() => _p = false),
    child: AnimatedContainer(
      duration: 180.ms,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: _p ? widget.color.withValues(alpha: 0.14) : C.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: widget.color.withValues(alpha: _p ? 0.55 : 0.22),
        ),
        boxShadow: [
          BoxShadow(
            color: widget.color.withValues(alpha: _p ? 0.25 : 0.08),
            blurRadius: _p ? 18 : 8,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(widget.icon, style: const TextStyle(fontSize: 24)),
          const SizedBox(height: 8),
          Text(
            widget.title,
            style: GoogleFonts.outfit(
              fontSize: 12,
              color: C.t1,
              fontWeight: FontWeight.w500,
            ),
          ),
          Text(
            widget.value,
            style: GoogleFonts.outfit(
              fontSize: 15,
              color: widget.color,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    ),
  );
}

class _Mode3DCard extends StatefulWidget {
  final DubbingMode mode;
  final VoidCallback onToggle;
  const _Mode3DCard({required this.mode, required this.onToggle});
  @override
  State<_Mode3DCard> createState() => _Mode3DCardState();
}

class _Mode3DCardState extends State<_Mode3DCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _t;
  @override
  void initState() {
    super.initState();
    _t = AnimationController(vsync: this, duration: 150.ms);
  }

  @override
  void dispose() {
    _t.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTapDown: (_) => _t.forward(),
    onTapUp: (_) {
      _t.reverse();
      widget.onToggle();
    },
    onTapCancel: () => _t.reverse(),
    child: AnimatedBuilder(
      animation: _t,
      builder: (_, child) => Transform.scale(
        scale: 1.0 - 0.02 * _t.value,
        child: Transform(
          alignment: Alignment.center,
          transform: Matrix4.identity()
            ..setEntry(3, 2, 0.001)
            ..rotateX(-0.04 * _t.value),
          child: child,
        ),
      ),
      child: AnimatedContainer(
        duration: 350.ms,
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(22),
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              widget.mode.color.withValues(alpha: 0.22),
              widget.mode.color.withValues(alpha: 0.06),
            ],
          ),
          border: Border.all(
            color: widget.mode.color.withValues(alpha: 0.45),
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(color: widget.mode.glow, blurRadius: 28, spreadRadius: 2),
          ],
        ),
        child: Row(
          children: [
            AnimatedContainer(
              duration: 300.ms,
              width: 54,
              height: 54,
              decoration: BoxDecoration(
                color: widget.mode.color.withValues(alpha: 0.18),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: widget.mode.color.withValues(alpha: 0.3),
                ),
              ),
              child: Center(
                child: Text(
                  widget.mode.icon,
                  style: const TextStyle(fontSize: 28),
                ),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${widget.mode.label}  ✓ Active',
                    style: GoogleFonts.outfit(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: widget.mode.color,
                    ),
                  ),
                  Text(
                    widget.mode.kh,
                    style: GoogleFonts.kantumruyPro(fontSize: 12, color: C.t1),
                  ),
                  const SizedBox(height: 5),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 3,
                    ),
                    decoration: BoxDecoration(
                      color: widget.mode.color.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: widget.mode.color.withValues(alpha: 0.3),
                      ),
                    ),
                    child: Text(
                      'ចុចដើម្បីប្ដូរ Mode',
                      style: GoogleFonts.outfit(
                        fontSize: 10,
                        color: widget.mode.color,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.swap_horiz_rounded,
              color: widget.mode.color.withValues(alpha: 0.8),
              size: 24,
            ),
          ],
        ),
      ),
    ),
  );
}

class _WaveBanner extends StatelessWidget {
  final AnimationController ctrl;
  final DubbingMode mode;
  const _WaveBanner({required this.ctrl, required this.mode});
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
    decoration: BoxDecoration(
      borderRadius: BorderRadius.circular(22),
      gradient: LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [
          C.violet.withValues(alpha: 0.16),
          C.cyan.withValues(alpha: 0.07),
        ],
      ),
      border: Border.all(color: C.violet.withValues(alpha: 0.2)),
      boxShadow: [BoxShadow(color: C.violetGlow, blurRadius: 18)],
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Text('🇰🇭', style: TextStyle(fontSize: 22)),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                'ស្ទូឌីយោ Neural v4.0',
                style: GoogleFonts.kantumruyPro(
                  fontSize: 17,
                  fontWeight: FontWeight.w800,
                  color: C.t0,
                ),
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: mode.color.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: mode.color.withValues(alpha: 0.4)),
              ),
              child: Text(
                '${mode.icon} ${mode.label}',
                style: GoogleFonts.outfit(
                  fontSize: 10,
                  color: mode.color,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        SizedBox(
          height: 30,
          child: AnimatedBuilder(
            animation: ctrl,
            builder: (_, _) => CustomPaint(
              size: const Size(double.infinity, 30),
              painter: _WavePainter(ctrl.value, mode.color),
            ),
          ),
        ),
      ],
    ),
  );
}

class _WavePainter extends CustomPainter {
  final double t;
  final Color c;
  static const _n = 30;
  _WavePainter(this.t, this.c);
  @override
  void paint(Canvas canvas, Size size) {
    final bw = size.width / _n;
    for (int i = 0; i < _n; i++) {
      final ph = i / _n * math.pi * 2;
      final h =
          (math.sin(t * math.pi * 2 + ph) * 0.5 + 0.5) *
          (0.3 + 0.7 * math.sin(i * 0.45).abs());
      final bh = h * size.height;
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromLTWH(i * bw + bw * 0.15, size.height - bh, bw * 0.7, bh),
          const Radius.circular(3),
        ),
        Paint()
          ..shader =
              LinearGradient(
                begin: Alignment.bottomCenter,
                end: Alignment.topCenter,
                colors: [c.withValues(alpha: 0.2), c.withValues(alpha: 0.9)],
              ).createShader(
                Rect.fromLTWH(
                  i * bw + bw * 0.15,
                  size.height - bh,
                  bw * 0.7,
                  bh,
                ),
              ),
      );
    }
  }

  @override
  bool shouldRepaint(_WavePainter o) => true;
}

class _FeatureRow extends StatefulWidget {
  final String emoji, title, sub;
  final Color color;
  final Duration delay;
  const _FeatureRow({
    required this.emoji,
    required this.title,
    required this.sub,
    required this.color,
    required this.delay,
  });
  @override
  State<_FeatureRow> createState() => _FeatureRowState();
}

class _FeatureRowState extends State<_FeatureRow> {
  bool _h = false;
  @override
  Widget build(BuildContext context) =>
      GestureDetector(
            onTapDown: (_) => setState(() => _h = true),
            onTapUp: (_) => setState(() => _h = false),
            onTapCancel: () => setState(() => _h = false),
            child: AnimatedContainer(
              duration: 200.ms,
              margin: const EdgeInsets.only(bottom: 9),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                color: _h ? widget.color.withValues(alpha: 0.1) : C.card,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: widget.color.withValues(alpha: _h ? 0.45 : 0.18),
                ),
                boxShadow: [
                  BoxShadow(
                    color: widget.color.withValues(alpha: _h ? 0.18 : 0.05),
                    blurRadius: _h ? 20 : 8,
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: widget.color.withValues(alpha: _h ? 0.2 : 0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Center(
                      child: Text(
                        widget.emoji,
                        style: const TextStyle(fontSize: 21),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.title,
                          style: GoogleFonts.kantumruyPro(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: C.t0,
                          ),
                        ),
                        Text(
                          widget.sub,
                          style: GoogleFonts.kantumruyPro(
                            fontSize: 11,
                            color: C.t1,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Icon(
                    Icons.chevron_right_rounded,
                    color: widget.color.withValues(alpha: _h ? 0.8 : 0.4),
                    size: 20,
                  ),
                ],
              ),
            ),
          )
          .animate(delay: widget.delay)
          .fadeIn(duration: 450.ms)
          .slideX(begin: -0.08, end: 0);
}

// ═════════════════════════════════════════════════════════════════════════════
//  🎬  WORKSPACE SCREEN
// ═════════════════════════════════════════════════════════════════════════════

class _WorkspaceScreen extends StatefulWidget {
  final DubbingMode mode;
  final List<DialogueLine> lines;
  final File? videoFile;
  final String? originalFilename;
  final int videoBytes;
  final bool isUploading, isGenerating;
  final double progress;
  final String progressMsg;
  final String? exportedUrl, exportedPath, serverUrl;
  final VoidCallback onPickVideo, onGenerate, onAddLine;
  final void Function(DialogueLine) onRemoveLine, onLineChanged;
  final void Function(String, Color) onShowToast;

  const _WorkspaceScreen({
    required this.mode,
    required this.lines,
    required this.videoFile,
    required this.originalFilename,
    required this.videoBytes,
    required this.isUploading,
    required this.isGenerating,
    required this.progress,
    required this.progressMsg,
    required this.exportedUrl,
    required this.exportedPath,
    required this.serverUrl,
    required this.onPickVideo,
    required this.onGenerate,
    required this.onAddLine,
    required this.onRemoveLine,
    required this.onLineChanged,
    required this.onShowToast,
  });
  @override
  State<_WorkspaceScreen> createState() => _WorkspaceScreenState();
}

class _WorkspaceScreenState extends State<_WorkspaceScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _waveCtrl;
  @override
  void initState() {
    super.initState();
    _waveCtrl = AnimationController(vsync: this, duration: 1600.ms)..repeat();
  }

  @override
  void dispose() {
    _waveCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Column(
    children: [
      Expanded(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 6, 16, 16),
          children: [
            _WorkspaceModeBar(
              mode: widget.mode,
            ).animate().fadeIn(duration: 350.ms),
            const SizedBox(height: 10),
            _VideoCard(
              mode: widget.mode,
              videoFile: widget.videoFile,
              originalFilename: widget.originalFilename,
              videoBytes: widget.videoBytes,
              isUploading: widget.isUploading,
              onPickVideo: widget.onPickVideo,
            ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.1, end: 0),
            const SizedBox(height: 12),
            if (widget.isGenerating)
              _MiniWaveCard(
                ctrl: _waveCtrl,
                mode: widget.mode,
              ).animate().fadeIn(),
            if (widget.isGenerating) const SizedBox(height: 10),
            _DialogueEditor(
              lines: widget.lines,
              onAddLine: widget.onAddLine,
              onRemoveLine: widget.onRemoveLine,
              onLineChanged: widget.onLineChanged,
            ).animate(delay: 80.ms).fadeIn(duration: 400.ms),
            const SizedBox(height: 12),
            if (widget.isGenerating || widget.progress > 0)
              _ProgressCard(
                progress: widget.progress,
                msg: widget.progressMsg,
                mode: widget.mode,
              ).animate().fadeIn(),
            if (widget.exportedUrl != null || widget.exportedPath != null) ...[
              const SizedBox(height: 12),
              _ExportCard(
                exportedUrl: widget.exportedUrl,
                exportedPath: widget.exportedPath,
                onShowToast: widget.onShowToast,
              ).animate().fadeIn().scale(
                begin: const Offset(0.95, 0.95),
                curve: Curves.easeOut,
              ),
            ],
            const SizedBox(height: 12),
          ],
        ),
      ),
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        child: _NeonCTA(
          label: widget.isGenerating
              ? '⏳ Processing...'
              : (widget.mode == DubbingMode.local
                    ? '📱 Generate Local Dubbing'
                    : '💻 Generate Server Dubbing'),
          gradient: widget.mode.grad,
          loading: widget.isGenerating,
          onTap: widget.isGenerating ? null : widget.onGenerate,
        ),
      ),
    ],
  );
}

// ─── Workspace sub-widgets ────────────────────────────────────────────────────

class _WorkspaceModeBar extends StatelessWidget {
  final DubbingMode mode;
  const _WorkspaceModeBar({required this.mode});
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
    decoration: BoxDecoration(
      color: mode.color.withValues(alpha: 0.09),
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: mode.color.withValues(alpha: 0.32)),
      boxShadow: [BoxShadow(color: mode.glow, blurRadius: 10)],
    ),
    child: Row(
      children: [
        Icon(
          mode == DubbingMode.local
              ? Icons.smartphone_rounded
              : Icons.computer_rounded,
          size: 14,
          color: mode.color,
        ),
        const SizedBox(width: 7),
        Expanded(
          child: Text(
            mode == DubbingMode.local
                ? '📱 Local — Edge TTS + FFmpeg on device'
                : '💻 Server — PC handles TTS + FFmpeg',
            style: GoogleFonts.outfit(
              fontSize: 11,
              color: mode.color,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    ),
  );
}

class _VideoCard extends StatelessWidget {
  final DubbingMode mode;
  final File? videoFile;
  final String? originalFilename;
  final int videoBytes;
  final bool isUploading;
  final VoidCallback onPickVideo;
  const _VideoCard({
    required this.mode,
    required this.videoFile,
    required this.originalFilename,
    required this.videoBytes,
    required this.isUploading,
    required this.onPickVideo,
  });

  @override
  Widget build(BuildContext context) => _GCard(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              '🎬 វីដេអូ',
              style: GoogleFonts.kantumruyPro(
                fontWeight: FontWeight.w700,
                fontSize: 14,
              ),
            ),
            if (videoFile != null)
              _SmBtn('↔ ប្ដូរ', C.cyan, isUploading ? null : onPickVideo),
          ],
        ),
        const SizedBox(height: 10),
        if (videoFile == null)
          _DropZone(onTap: onPickVideo)
        else if (isUploading)
          _UploadRow()
        else
          _VideoPreview(
            file: videoFile!,
            name: originalFilename ?? 'video.mp4',
            bytes: videoBytes,
            mode: mode,
          ),
      ],
    ),
  );
}

class _DropZone extends StatefulWidget {
  final VoidCallback onTap;
  const _DropZone({required this.onTap});
  @override
  State<_DropZone> createState() => _DropZoneState();
}

class _DropZoneState extends State<_DropZone> {
  bool _p = false;
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTapDown: (_) => setState(() => _p = true),
    onTapUp: (_) {
      setState(() => _p = false);
      widget.onTap();
    },
    onTapCancel: () => setState(() => _p = false),
    child: AnimatedContainer(
      duration: 180.ms,
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 26),
      decoration: BoxDecoration(
        color: C.violet.withValues(alpha: _p ? 0.12 : 0.04),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: C.violet.withValues(alpha: _p ? 0.55 : 0.28)),
        boxShadow: _p ? [BoxShadow(color: C.violetGlow, blurRadius: 16)] : [],
      ),
      child: Column(
        children: [
          Text('📁', style: const TextStyle(fontSize: 36))
              .animate(onPlay: (c) => c.repeat(reverse: true))
              .scaleXY(end: 1.08, duration: 1200.ms),
          const SizedBox(height: 8),
          Text(
            'ជ្រើសរើស Video',
            style: GoogleFonts.kantumruyPro(
              fontWeight: FontWeight.w700,
              fontSize: 15,
              color: C.t0,
            ),
          ),
          Text(
            'MP4, MKV',
            style: GoogleFonts.kantumruyPro(fontSize: 11, color: C.t2),
          ),
        ],
      ),
    ),
  );
}

class _UploadRow extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: C.cyan.withValues(alpha: 0.06),
      borderRadius: BorderRadius.circular(12),
    ),
    child: Row(
      children: [
        const SizedBox(
          width: 20,
          height: 20,
          child: CircularProgressIndicator(strokeWidth: 2, color: C.cyan),
        ),
        const SizedBox(width: 12),
        Text(
          'Upload...',
          style: GoogleFonts.kantumruyPro(fontSize: 13, color: C.cyan),
        ),
      ],
    ),
  );
}

class _VideoPreview extends StatefulWidget {
  final File file;
  final String name;
  final int bytes;
  final DubbingMode mode;
  const _VideoPreview({
    required this.file,
    required this.name,
    required this.bytes,
    required this.mode,
  });
  @override
  State<_VideoPreview> createState() => _VideoPreviewState();
}

class _VideoPreviewState extends State<_VideoPreview> {
  VideoPlayerController? _ctrl;
  bool _ready = false;

  @override
  void initState() {
    super.initState();
    _initVideo();
  }
  
  @override
  void didUpdateWidget(_VideoPreview old) {
    super.didUpdateWidget(old);
    if (old.file.path != widget.file.path) {
      _initVideo();
    }
  }

  Future<void> _initVideo() async {
    final old = _ctrl;
    _ctrl = VideoPlayerController.file(widget.file);
    await _ctrl!.initialize();
    if (mounted) setState(() => _ready = true);
    old?.dispose();
  }

  @override
  void dispose() {
    _ctrl?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = widget.mode.color;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: c.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: c.withValues(alpha: 0.2)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Thumbnail / Preview
          Container(
            width: 70, height: 70,
            decoration: BoxDecoration(
              color: Colors.black26,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: c.withValues(alpha: 0.4)),
            ),
            clipBehavior: Clip.hardEdge,
            child: _ready
                ? AspectRatio(
                    aspectRatio: _ctrl!.value.aspectRatio,
                    child: VideoPlayer(_ctrl!),
                  )
                : const Center(child: CircularProgressIndicator(strokeWidth: 2)),
          ),
          const SizedBox(width: 14),
          // Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.name,
                  style: GoogleFonts.outfit(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: C.t0,
                  ),
                  maxLines: 1, overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  'Size: ${(widget.bytes / (1024 * 1024)).toStringAsFixed(1)} MB',
                  style: GoogleFonts.kantumruyPro(fontSize: 11, color: C.t2),
                ),
                if (_ready) ...[
                  const SizedBox(height: 2),
                  Text(
                    'Duration: ${_ctrl!.value.duration.inMinutes}:${(_ctrl!.value.duration.inSeconds % 60).toString().padLeft(2, '0')}',
                    style: GoogleFonts.outfit(fontSize: 11, color: C.t1),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Res: ${_ctrl!.value.size.width.toInt()}x${_ctrl!.value.size.height.toInt()}',
                    style: GoogleFonts.outfit(fontSize: 11, color: C.t1),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: 8),
          Icon(Icons.check_circle_rounded, color: c, size: 24),
        ],
      ),
    );
  }
}

class _MiniWaveCard extends StatelessWidget {
  final AnimationController ctrl;
  final DubbingMode mode;
  const _MiniWaveCard({required this.ctrl, required this.mode});
  @override
  Widget build(BuildContext context) => _GCard(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '🎤 Processing...',
          style: GoogleFonts.kantumruyPro(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: C.t1,
          ),
        ),
        const SizedBox(height: 8),
        SizedBox(
          height: 26,
          child: AnimatedBuilder(
            animation: ctrl,
            builder: (_, _) => CustomPaint(
              size: const Size(double.infinity, 26),
              painter: _WavePainter(ctrl.value, mode.color),
            ),
          ),
        ),
      ],
    ),
  );
}

class _DialogueEditor extends StatelessWidget {
  final List<DialogueLine> lines;
  final VoidCallback onAddLine;
  final void Function(DialogueLine) onRemoveLine, onLineChanged;
  const _DialogueEditor({
    required this.lines,
    required this.onAddLine,
    required this.onRemoveLine,
    required this.onLineChanged,
  });

  @override
  Widget build(BuildContext context) => _GCard(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              '💬 Lines (${lines.length})',
              style: GoogleFonts.kantumruyPro(
                fontWeight: FontWeight.w700,
                fontSize: 14,
              ),
            ),
            _SmBtn('+ Add', C.cyan, onAddLine),
          ],
        ),
        const SizedBox(height: 8),
        if (lines.isEmpty)
          Container(
            padding: const EdgeInsets.symmetric(vertical: 18),
            decoration: BoxDecoration(
              color: C.violet.withValues(alpha: 0.04),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: C.violet.withValues(alpha: 0.18)),
            ),
            child: Center(
              child: Text(
                'ដំណើរ Transcript ជាមុន → Export → Workspace',
                style: GoogleFonts.kantumruyPro(fontSize: 12, color: C.t2),
              ),
            ),
          )
        else
          ...lines.asMap().entries.map(
            (e) => _LineCard(
              key: ValueKey(e.key),
              line: e.value,
              index: e.key,
              onRemove: () => onRemoveLine(e.value),
              onChanged: () => onLineChanged(e.value),
            ),
          ),
      ],
    ),
  );
}

class _LineCard extends StatefulWidget {
  final DialogueLine line;
  final int index;
  final VoidCallback onRemove, onChanged;
  const _LineCard({
    super.key,
    required this.line,
    required this.index,
    required this.onRemove,
    required this.onChanged,
  });
  @override
  State<_LineCard> createState() => _LineCardState();
}

class _LineCardState extends State<_LineCard>
    with SingleTickerProviderStateMixin {
  late TextEditingController _tc, _sc, _ec;
  late AnimationController _flip;
  @override
  void initState() {
    super.initState();
    _tc = TextEditingController(text: widget.line.text);
    _sc = TextEditingController(text: widget.line.start.toStringAsFixed(1));
    _ec = TextEditingController(text: widget.line.end.toStringAsFixed(1));
    _flip = AnimationController(vsync: this, duration: 200.ms);
  }

  @override
  void dispose() {
    _tc.dispose();
    _sc.dispose();
    _ec.dispose();
    _flip.dispose();
    super.dispose();
  }

  Color get _gc => widget.line.gender == 'female' ? C.pink : C.cyan;

  Color get _sc2 => switch (widget.line.ttsStatus) {
    TtsStatus.done => C.green,
    TtsStatus.generating => C.cyan,
    TtsStatus.error => Colors.redAccent,
    _ => C.t2,
  };

  @override
  Widget build(BuildContext context) => AnimatedContainer(
    duration: 250.ms,
    margin: const EdgeInsets.only(bottom: 10),
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(
      color: C.bg1,
      borderRadius: BorderRadius.circular(14),
      border: Border.all(color: _gc.withValues(alpha: 0.22)),
      boxShadow: widget.line.ttsStatus == TtsStatus.done
          ? [BoxShadow(color: C.greenGlow, blurRadius: 12)]
          : widget.line.ttsStatus == TtsStatus.generating
          ? [BoxShadow(color: C.cyan.withValues(alpha: 0.25), blurRadius: 14)]
          : [],
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            _Badge('#${widget.index + 1}', _gc),
            const SizedBox(width: 6),
            GestureDetector(
              onTap: () async {
                await _flip.forward();
                setState(() {
                  widget.line.gender = widget.line.gender == 'male'
                      ? 'female'
                      : 'male';
                });
                widget.onChanged();
                await _flip.reverse();
              },
              child: AnimatedBuilder(
                animation: _flip,
                builder: (_, child) => Transform(
                  alignment: Alignment.center,
                  transform: Matrix4.identity()
                    ..setEntry(3, 2, 0.002)
                    ..rotateY(_flip.value * math.pi),
                  child: child,
                ),
                child: _Badge(
                  widget.line.gender == 'female' ? '👩 ស្រី' : '👨 ប្រុស',
                  _gc,
                ),
              ),
            ),
            const Spacer(),
            Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: _sc2,
                    boxShadow: widget.line.ttsStatus == TtsStatus.generating
                        ? [
                            BoxShadow(
                              color: _sc2.withValues(alpha: 0.7),
                              blurRadius: 8,
                            ),
                          ]
                        : null,
                  ),
                )
                .animate(
                  onPlay: (c) => widget.line.ttsStatus == TtsStatus.generating
                      ? c.repeat(reverse: true)
                      : null,
                )
                .scaleXY(
                  end: widget.line.ttsStatus == TtsStatus.generating
                      ? 1.6
                      : 1.0,
                  duration: 500.ms,
                ),
            const SizedBox(width: 8),
            GestureDetector(
              onTap: widget.onRemove,
              child: Icon(
                Icons.close_rounded,
                size: 16,
                color: C.t2.withValues(alpha: 0.6),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        TextField(
          controller: _tc,
          onChanged: (v) {
            widget.line.text = v;
            widget.onChanged();
          },
          style: GoogleFonts.kantumruyPro(fontSize: 13, color: C.t0),
          maxLines: 2,
          decoration: const InputDecoration(hintText: 'អក្សរខ្មែរ...'),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _sc,
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
                onChanged: (v) {
                  widget.line.start = double.tryParse(v) ?? widget.line.start;
                  widget.onChanged();
                },
                style: GoogleFonts.outfit(fontSize: 12, color: C.t0),
                decoration: InputDecoration(
                  labelText: '▶ Start',
                  labelStyle: GoogleFonts.outfit(fontSize: 10, color: C.t2),
                ),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: TextField(
                controller: _ec,
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
                onChanged: (v) {
                  widget.line.end = double.tryParse(v) ?? widget.line.end;
                  widget.onChanged();
                },
                style: GoogleFonts.outfit(fontSize: 12, color: C.t0),
                decoration: InputDecoration(
                  labelText: '⏹ End',
                  labelStyle: GoogleFonts.outfit(fontSize: 10, color: C.t2),
                ),
              ),
            ),
          ],
        ),
      ],
    ),
  );
}

class _ProgressCard extends StatefulWidget {
  final double progress;
  final String msg;
  final DubbingMode mode;
  const _ProgressCard({
    required this.progress,
    required this.msg,
    required this.mode,
  });
  @override
  State<_ProgressCard> createState() => _ProgressCardState();
}

class _ProgressCardState extends State<_ProgressCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _scan;
  @override
  void initState() {
    super.initState();
    _scan = AnimationController(vsync: this, duration: 1200.ms)..repeat();
  }

  @override
  void dispose() {
    _scan.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => _GCard(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            if (widget.progress < 1.0)
              SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: widget.mode.color,
                ),
              )
            else
              const Icon(Icons.check_circle_rounded, size: 20, color: C.green),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                widget.msg.isNotEmpty ? widget.msg : 'Processing...',
                style: GoogleFonts.kantumruyPro(fontSize: 12, color: C.t1),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            Text(
              '${(widget.progress * 100).toInt()}%',
              style: GoogleFonts.outfit(
                fontSize: 14,
                fontWeight: FontWeight.w800,
                color: widget.mode.color,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Stack(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(5),
              child: LinearProgressIndicator(
                value: widget.progress,
                backgroundColor: C.sh0,
                valueColor: AlwaysStoppedAnimation<Color>(widget.mode.color),
                minHeight: 6,
              ),
            ),
            AnimatedBuilder(
              animation: _scan,
              builder: (_, _) => ClipRRect(
                borderRadius: BorderRadius.circular(5),
                child: Container(
                  height: 6,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment(_scan.value * 3 - 2, 0),
                      end: Alignment(_scan.value * 3, 0),
                      colors: [
                        Colors.transparent,
                        Colors.white.withValues(alpha: 0.25),
                        Colors.transparent,
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ],
    ),
  );
}

class _ExportCard extends StatelessWidget {
  final String? exportedUrl, exportedPath;
  final void Function(String, Color) onShowToast;
  const _ExportCard({
    required this.exportedUrl,
    required this.exportedPath,
    required this.onShowToast,
  });
  @override
  Widget build(BuildContext context) => _GCard(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: C.green.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Center(
                    child: Text('🎉', style: TextStyle(fontSize: 24)),
                  ),
                )
                .animate(onPlay: (c) => c.repeat(reverse: true))
                .scaleXY(end: 1.1, duration: 800.ms),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Dubbed Video Ready!',
                    style: GoogleFonts.outfit(
                      fontWeight: FontWeight.w700,
                      fontSize: 14,
                      color: C.green,
                    ),
                  ),
                  Text(
                    exportedPath != null
                        ? '📱 Saved on Device'
                        : '💻 Available on Server',
                    style: GoogleFonts.outfit(fontSize: 11, color: C.t1),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        _NeonCTA(
          label: exportedPath != null ? '📂 Open File' : '📋 Copy URL',
          gradient: const LinearGradient(colors: [C.green, C.cyan]),
          height: 44,
          onTap: () {
            final s = exportedPath ?? exportedUrl ?? '';
            Clipboard.setData(ClipboardData(text: s));
            onShowToast('📋 Copied!', C.green);
          },
        ),
      ],
    ),
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  ⚙️  SETTINGS SHEET
// ═════════════════════════════════════════════════════════════════════════════

class _SettingsSheet extends StatelessWidget {
  final String serverUrl, geminiKey;
  final DubbingMode mode;
  final TextEditingController urlCtrl, keyCtrl;
  final void Function(String url, String key) onSave;
  final VoidCallback onToggleMode;

  const _SettingsSheet({
    required this.serverUrl,
    required this.geminiKey,
    required this.mode,
    required this.urlCtrl,
    required this.keyCtrl,
    required this.onSave,
    required this.onToggleMode,
  });

  @override
  Widget build(BuildContext context) => Container(
    decoration: BoxDecoration(
      color: C.bg1,
      borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      border: Border.all(color: C.glass),
      boxShadow: [
        BoxShadow(
          color: C.violetGlow,
          blurRadius: 40,
          offset: const Offset(0, -6),
        ),
      ],
    ),
    padding: const EdgeInsets.fromLTRB(22, 12, 22, 32),
    child: Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Center(
          child: Container(
            width: 44,
            height: 5,
            decoration: BoxDecoration(
              color: C.t2,
              borderRadius: BorderRadius.circular(3),
            ),
          ),
        ),
        const SizedBox(height: 20),
        Text(
          '⚙️ ការកំណត់ v4.0',
          style: GoogleFonts.kantumruyPro(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: C.t0,
          ),
        ),
        const SizedBox(height: 18),

        // Mode picker
        Text(
          '🔄 Mode',
          style: GoogleFonts.kantumruyPro(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: C.t1,
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: _ModeOpt(
                '📱',
                'Local',
                'TTS+FFmpeg on phone',
                C.green,
                mode == DubbingMode.local,
                mode != DubbingMode.local ? onToggleMode : null,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _ModeOpt(
                '💻',
                'Server',
                'PC WiFi server',
                C.violet,
                mode == DubbingMode.server,
                mode != DubbingMode.server ? onToggleMode : null,
              ),
            ),
          ],
        ),
        const SizedBox(height: 18),

        // Gemini API key
        Text(
          '🤖 Gemini API Key (Local Transcript)',
          style: GoogleFonts.kantumruyPro(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: C.t1,
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: keyCtrl,
          obscureText: false,
          style: GoogleFonts.outfit(fontSize: 13, color: C.t0),
          decoration: const InputDecoration(
            hintText: 'AIza...',
            prefixIcon: Icon(Icons.vpn_key_rounded, color: C.orange, size: 18),
          ),
        ),
        const SizedBox(height: 10),

        // Server URL
        Text(
          '💻 PC Server URL',
          style: GoogleFonts.kantumruyPro(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: C.t1,
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: urlCtrl,
          style: GoogleFonts.outfit(fontSize: 14, color: C.t0),
          decoration: const InputDecoration(
            hintText: 'http://192.168.x.x:3000',
            prefixIcon: Icon(Icons.link_rounded, color: C.cyan, size: 18),
          ),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 6,
          children: ['http://localhost:3000', 'http://192.168.50.202:3000']
              .map(
                (url) => GestureDetector(
                  onTap: () => urlCtrl.text = url,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 9,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: C.cyan.withValues(alpha: 0.07),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: C.cyan.withValues(alpha: 0.3)),
                    ),
                    child: Text(
                      url,
                      style: GoogleFonts.outfit(fontSize: 10, color: C.cyan),
                    ),
                  ),
                ),
              )
              .toList(),
        ),
        const SizedBox(height: 18),
        _NeonCTA(
          label: '💾 រក្សាទុក',
          gradient: const LinearGradient(colors: [C.violet, C.cyan]),
          height: 50,
          onTap: () => onSave(urlCtrl.text.trim(), keyCtrl.text.trim()),
        ),
      ],
    ),
  );
}

class _ModeOpt extends StatelessWidget {
  final String icon, label, sub;
  final Color color;
  final bool active;
  final VoidCallback? onTap;
  const _ModeOpt(
    this.icon,
    this.label,
    this.sub,
    this.color,
    this.active,
    this.onTap,
  );
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: AnimatedContainer(
      duration: 250.ms,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: active ? color.withValues(alpha: 0.14) : C.bg0,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: active ? color.withValues(alpha: 0.5) : C.glass,
          width: active ? 1.5 : 1.0,
        ),
        boxShadow: active
            ? [BoxShadow(color: color.withValues(alpha: 0.2), blurRadius: 12)]
            : [],
      ),
      child: Column(
        children: [
          Text(icon, style: const TextStyle(fontSize: 22)),
          const SizedBox(height: 5),
          Text(
            label,
            style: GoogleFonts.outfit(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: active ? color : C.t1,
            ),
          ),
          Text(sub, style: GoogleFonts.kantumruyPro(fontSize: 10, color: C.t2)),
        ],
      ),
    ),
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  🧩  SHARED MICRO-WIDGETS
// ═════════════════════════════════════════════════════════════════════════════

class _GCard extends StatelessWidget {
  final Widget child;
  const _GCard({required this.child});
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: C.card,
      borderRadius: BorderRadius.circular(18),
      border: Border.all(color: C.glass),
      boxShadow: [
        BoxShadow(color: Colors.black.withValues(alpha: 0.35), blurRadius: 18),
      ],
    ),
    child: child,
  );
}

class _Badge extends StatelessWidget {
  final String text;
  final Color color;
  const _Badge(this.text, this.color);
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
    decoration: BoxDecoration(
      color: color.withValues(alpha: 0.12),
      borderRadius: BorderRadius.circular(7),
    ),
    child: Text(
      text,
      style: GoogleFonts.outfit(
        fontSize: 10,
        fontWeight: FontWeight.w800,
        color: color,
      ),
    ),
  );
}

class _SmBtn extends StatelessWidget {
  final String l;
  final Color c;
  final VoidCallback? t;
  const _SmBtn(this.l, this.c, this.t);
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: t,
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: c.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: c.withValues(alpha: 0.3)),
      ),
      child: Text(
        l,
        style: GoogleFonts.kantumruyPro(
          fontSize: 12,
          color: c,
          fontWeight: FontWeight.w600,
        ),
      ),
    ),
  );
}

class _ModePill extends StatelessWidget {
  final DubbingMode mode;
  final VoidCallback onToggle;
  const _ModePill({required this.mode, required this.onToggle});
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onToggle,
    child: AnimatedContainer(
      duration: 300.ms,
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: mode.color.withValues(alpha: 0.13),
        border: Border.all(color: mode.color.withValues(alpha: 0.45)),
        boxShadow: [BoxShadow(color: mode.glow, blurRadius: 10)],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            mode == DubbingMode.local
                ? Icons.smartphone_rounded
                : Icons.computer_rounded,
            size: 13,
            color: mode.color,
          ),
          const SizedBox(width: 4),
          Text(
            mode == DubbingMode.local ? 'Local' : 'Server',
            style: GoogleFonts.outfit(
              fontSize: 11,
              color: mode.color,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    ),
  );
}

class _NeonCTA extends StatefulWidget {
  final String label;
  final LinearGradient gradient;
  final VoidCallback? onTap;
  final double height;
  final bool loading;
  const _NeonCTA({
    required this.label,
    required this.gradient,
    this.onTap,
    this.height = 58,
    this.loading = false,
  });
  @override
  State<_NeonCTA> createState() => _NeonCTAState();
}

class _NeonCTAState extends State<_NeonCTA>
    with SingleTickerProviderStateMixin {
  late AnimationController _p;
  @override
  void initState() {
    super.initState();
    _p = AnimationController(vsync: this, duration: 100.ms);
  }

  @override
  void dispose() {
    _p.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTapDown: widget.onTap != null ? (_) => _p.forward() : null,
    onTapUp: widget.onTap != null
        ? (_) {
            _p.reverse();
            widget.onTap?.call();
          }
        : null,
    onTapCancel: () => _p.reverse(),
    child: AnimatedBuilder(
      animation: _p,
      builder: (_, _) => Transform.scale(
        scale: 1.0 - 0.03 * _p.value,
        child: AnimatedOpacity(
          opacity: widget.onTap == null ? 0.5 : 1.0,
          duration: 200.ms,
          child: Container(
            height: widget.height,
            decoration: BoxDecoration(
              gradient: widget.gradient,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: widget.gradient.colors.first.withValues(
                    alpha: 0.42 - 0.15 * _p.value,
                  ),
                  blurRadius: 22 - 6 * _p.value,
                  offset: const Offset(0, 4),
                ),
                BoxShadow(
                  color: widget.gradient.colors.last.withValues(alpha: 0.18),
                  blurRadius: 36,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Center(
              child: widget.loading
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.5,
                        color: Colors.white,
                      ),
                    )
                  : Text(
                      widget.label,
                      style: GoogleFonts.kantumruyPro(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                        letterSpacing: 0.3,
                      ),
                    ),
            ),
          ),
        ),
      ),
    ),
  );
}

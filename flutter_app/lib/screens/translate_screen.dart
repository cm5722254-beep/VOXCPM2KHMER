// lib/screens/translate_screen.dart
//
// Translate Screen — VoxCPM2 Khmer Neural Studio v4.0
//
// Features:
//  • Show all transcript segments side-by-side (Chinese | Khmer)
//  • Edit any Khmer line inline with animated text field
//  • Gender toggle per line (👨 ↔ 👩) with spring-flip animation
//  • Re-translate single line via Gemini (🔄 button)
//  • Speaker role picker (male_lead, female_lead, elder, etc.)
//  • Export all → Workspace Dubbing tab

import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';

import '../services/transcript_service.dart';

// Colors
class _C {
  static const bg0   = Color(0xFF03060F);
  static const bg1   = Color(0xFF080D1A);
  static const card  = Color(0xFF0A1020);
  static const glass = Color(0x14FFFFFF);
  static const violet      = Color(0xFF7C3AED);
  static const violetGlow  = Color(0x607C3AED);
  static const violetLight = Color(0xFFAB7FF8);
  static const cyan        = Color(0xFF06B6D4);
  static const green       = Color(0xFF10B981);
  static const pink        = Color(0xFFEC4899);
  static const orange      = Color(0xFFF97316);
  static const t0 = Color(0xFFF0F6FF);
  static const t1 = Color(0xFF94A3B8);
  static const t2 = Color(0xFF475569);
}

const List<String> _kRoles = [
  'male_lead', 'female_lead', 'elder', 'child', 'villain_female',
  'villain_male', 'general', 'servant_female', 'old_uncle', 'governor',
];

class TranslateScreen extends StatefulWidget {
  final List<TranscriptSegment> segments;
  final void Function(List<TranscriptSegment>) onExportToWorkspace;
  final String geminiApiKey;
  final bool serverMode;

  const TranslateScreen({
    super.key,
    required this.segments,
    required this.onExportToWorkspace,
    required this.geminiApiKey,
    required this.serverMode,
  });

  @override
  State<TranslateScreen> createState() => _TranslateScreenState();
}

class _TranslateScreenState extends State<TranslateScreen> with TickerProviderStateMixin {
  late List<TranscriptSegment> _segs;

  // Per-line retranslate loading state
  final Map<int, bool> _retranslating = {};

  // Filter
  String _filterGender = 'all'; // 'all' | 'male' | 'female'
  String _searchQuery  = '';

  late AnimationController _bgCtrl;

  @override
  void initState() {
    super.initState();
    _segs   = List.from(widget.segments);
    _bgCtrl = AnimationController(vsync: this, duration: 3000.ms)..repeat(reverse: true);
  }

  @override
  void dispose() { _bgCtrl.dispose(); super.dispose(); }

  List<TranscriptSegment> get _filtered {
    var list = _segs;
    if (_filterGender != 'all') list = list.where((s) => s.gender == _filterGender).toList();
    if (_searchQuery.isNotEmpty) {
      list = list.where((s) =>
          s.chineseText.contains(_searchQuery) ||
          s.khmerText.contains(_searchQuery)).toList();
    }
    return list;
  }

  Future<void> _retranslate(TranscriptSegment seg) async {
    if (widget.geminiApiKey.isEmpty || widget.geminiApiKey.startsWith('your_')) {
      _toast('⚠️ Gemini API key ត្រូវការ!', Colors.orange);
      return;
    }
    setState(() => _retranslating[seg.index] = true);
    try {
      final newKh = await TranscriptService.retranslateSegment(
        chineseText: seg.chineseText,
        speakerRole: seg.speakerRole,
        geminiApiKey: widget.geminiApiKey,
      );
      setState(() => seg.khmerText = newKh);
      HapticFeedback.selectionClick();
    } catch (e) {
      _toast('❌ $e', Colors.redAccent);
    } finally {
      setState(() => _retranslating[seg.index] = false);
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
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        duration: const Duration(seconds: 3),
      ));
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filtered;

    return Column(children: [
      Expanded(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
          children: [

            // ── Header
            _TranslateHeader(count: _segs.length)
                .animate().fadeIn(duration: 400.ms),
            const SizedBox(height: 14),

            // ── Search + filter bar
            _FilterBar(
              filterGender: _filterGender,
              onFilterChange: (g) => setState(() => _filterGender = g),
              onSearch: (q) => setState(() => _searchQuery = q),
            ).animate(delay: 50.ms).fadeIn(),
            const SizedBox(height: 12),

            // ── Empty state
            if (_segs.isEmpty)
              _EmptyTranslate()
                  .animate(delay: 100.ms).fadeIn(),

            // ── Segment cards
            ...filtered.asMap().entries.map((e) {
              final i   = e.key;
              final seg = e.value;
              return _TranslateCard(
                key:           ValueKey(seg.index),
                segment:       seg,
                isRetranslating: _retranslating[seg.index] == true,
                onRetranslate: () => _retranslate(seg),
                onGenderFlip:  () => setState(() {
                  seg.gender      = seg.gender == 'male' ? 'female' : 'male';
                  seg.speakerRole = seg.gender == 'female' ? 'female_lead' : 'male_lead';
                }),
                onRoleChange:  (r) => setState(() => seg.speakerRole = r),
                onTextChange:  (v) => setState(() => seg.khmerText = v),
              )
                  .animate(delay: Duration(milliseconds: i * 45))
                  .fadeIn(duration: 400.ms)
                  .slideY(begin: 0.06, end: 0, curve: Curves.easeOut);
            }),

            const SizedBox(height: 16),
          ],
        ),
      ),

      // ── Bottom bar
      _TranslateBottomBar(
        segCount: _segs.length,
        onExport: _segs.isEmpty
            ? null
            : () {
                widget.onExportToWorkspace(_segs);
                HapticFeedback.heavyImpact();
                _toast('✅ Export ${_segs.length} ឈុត → Workspace!', _C.green);
              },
        onClear: _segs.isEmpty
            ? null
            : () => setState(() {
                _segs.clear();
                for (final s in widget.segments) {
                  s.khmerText = '';
                }
              }),
      ),
    ]);
  }
}

// ─── Sub-widgets ──────────────────────────────────────────────────────────────

class _TranslateHeader extends StatelessWidget {
  final int count;
  const _TranslateHeader({required this.count});

  @override
  Widget build(BuildContext context) {
    return Row(children: [
      Container(
        width: 46, height: 46,
        decoration: BoxDecoration(
          gradient: const LinearGradient(colors: [_C.orange, _C.pink]),
          borderRadius: BorderRadius.circular(13),
          boxShadow: [BoxShadow(color: _C.pink.withValues(alpha: 0.4), blurRadius: 14)],
        ),
        child: const Center(child: Text('🌐', style: TextStyle(fontSize: 22))),
      ),
      const SizedBox(width: 12),
      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('Translate', style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.w800, color: _C.t0)),
        Text('$count ឈុត • ចិន → ខ្មែរ', style: GoogleFonts.kantumruyPro(fontSize: 12, color: _C.t1)),
      ]),
    ]);
  }
}

class _FilterBar extends StatefulWidget {
  final String filterGender;
  final void Function(String) onFilterChange;
  final void Function(String) onSearch;
  const _FilterBar({required this.filterGender, required this.onFilterChange, required this.onSearch});
  @override State<_FilterBar> createState() => _FilterBarState();
}
class _FilterBarState extends State<_FilterBar> {
  final _ctrl = TextEditingController();

  @override void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      // Search field
      TextField(
        controller: _ctrl,
        onChanged: widget.onSearch,
        style: GoogleFonts.outfit(fontSize: 13, color: _C.t0),
        decoration: InputDecoration(
          hintText: 'ស្វែងរក...',
          prefixIcon: const Icon(Icons.search_rounded, size: 18, color: _C.t2),
          suffixIcon: _ctrl.text.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.clear_rounded, size: 16, color: _C.t2),
                  onPressed: () { _ctrl.clear(); widget.onSearch(''); })
              : null,
        ),
      ),
      const SizedBox(height: 8),
      // Gender filter chips
      Row(children: [
        for (final g in [('all', '🎭 ទាំងអស់'), ('male', '👨 ប្រុស'), ('female', '👩 ស្រី')])
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: _FilterChip(
              label: g.$2,
              active: widget.filterGender == g.$1,
              onTap: () => widget.onFilterChange(g.$1),
            ),
          ),
      ]),
    ]);
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool active;
  final VoidCallback onTap;
  const _FilterChip({required this.label, required this.active, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: 200.ms,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: active ? _C.violet.withValues(alpha: 0.2) : _C.card,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: active ? _C.violetLight.withValues(alpha: 0.6) : _C.glass),
          boxShadow: active ? [BoxShadow(color: _C.violetGlow, blurRadius: 10)] : [],
        ),
        child: Text(label,
            style: GoogleFonts.outfit(fontSize: 11,
                color: active ? _C.violetLight : _C.t1,
                fontWeight: active ? FontWeight.w700 : FontWeight.w500)),
      ),
    );
  }
}

class _EmptyTranslate extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(top: 24),
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: _C.card,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: _C.glass),
      ),
      child: Column(children: [
        const Text('🌐', style: TextStyle(fontSize: 44))
            .animate(onPlay: (c) => c.repeat(reverse: true))
            .scaleXY(end: 1.08, duration: 1400.ms),
        const SizedBox(height: 14),
        Text('ចូលទៅ Transcript ជាមុន', style: GoogleFonts.kantumruyPro(fontSize: 14, color: _C.t1, fontWeight: FontWeight.w600), textAlign: TextAlign.center),
        const SizedBox(height: 6),
        Text('ស្រង់ Transcript រួចហើយ Export ទៅ Translate', style: GoogleFonts.kantumruyPro(fontSize: 12, color: _C.t2), textAlign: TextAlign.center),
      ]),
    );
  }
}

/// Full editable translate card per segment
class _TranslateCard extends StatefulWidget {
  final TranscriptSegment segment;
  final bool isRetranslating;
  final VoidCallback onRetranslate, onGenderFlip;
  final void Function(String) onRoleChange, onTextChange;

  const _TranslateCard({
    super.key,
    required this.segment,
    required this.isRetranslating,
    required this.onRetranslate,
    required this.onGenderFlip,
    required this.onRoleChange,
    required this.onTextChange,
  });

  @override State<_TranslateCard> createState() => _TranslateCardState();
}

class _TranslateCardState extends State<_TranslateCard> with SingleTickerProviderStateMixin {
  late TextEditingController _khCtrl;
  late AnimationController   _flipCtrl;
  bool _showRole = false;

  @override
  void initState() {
    super.initState();
    _khCtrl   = TextEditingController(text: widget.segment.khmerText);
    _flipCtrl = AnimationController(vsync: this, duration: 220.ms);
  }

  @override
  void didUpdateWidget(_TranslateCard old) {
    super.didUpdateWidget(old);
    if (old.segment.khmerText != widget.segment.khmerText) {
      _khCtrl.text = widget.segment.khmerText;
      _khCtrl.selection = TextSelection.fromPosition(TextPosition(offset: _khCtrl.text.length));
    }
  }

  @override
  void dispose() { _khCtrl.dispose(); _flipCtrl.dispose(); super.dispose(); }

  Color get _gc => widget.segment.gender == 'female' ? _C.pink : _C.cyan;
  Color get _rc => _roleColor(widget.segment.speakerRole);

  static Color _roleColor(String r) => switch (r) {
    'male_lead'      => _C.cyan,
    'female_lead'    => _C.pink,
    'elder'          => _C.orange,
    'child'          => const Color(0xFFFFD60A),
    'villain_female' => const Color(0xFFBF5AF2),
    'villain_male'   => const Color(0xFFFF453A),
    'general'        => _C.orange,
    'servant_female' => _C.pink,
    _                => _C.t1,
  };

  Future<void> _doGenderFlip() async {
    await _flipCtrl.forward();
    widget.onGenderFlip();
    await _flipCtrl.reverse();
  }

  @override
  Widget build(BuildContext context) {
    final seg = widget.segment;

    return AnimatedContainer(
      duration: 250.ms,
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: _C.card,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: _gc.withValues(alpha: 0.25)),
        boxShadow: [BoxShadow(color: _gc.withValues(alpha: 0.08), blurRadius: 14)],
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [

        // ── Header row
        Row(children: [
          _Badge('#${seg.index + 1}', _gc),
          const SizedBox(width: 6),
          // Gender flip button
          GestureDetector(
            onTap: _doGenderFlip,
            child: AnimatedBuilder(
              animation: _flipCtrl,
              builder: (_, child) => Transform(
                alignment: Alignment.center,
                transform: Matrix4.identity()
                  ..setEntry(3, 2, 0.002)
                  ..rotateY(_flipCtrl.value * math.pi),
                child: child,
              ),
              child: _Badge(seg.gender == 'female' ? '👩 ស្រី' : '👨 ប្រុស', _gc),
            ),
          ),
          const SizedBox(width: 6),
          // Role chip
          GestureDetector(
            onTap: () => setState(() => _showRole = !_showRole),
            child: AnimatedContainer(
              duration: 200.ms,
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: _rc.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(7),
                border: Border.all(color: _rc.withValues(alpha: 0.3)),
              ),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Text(seg.speakerRole.replaceAll('_', ' '),
                    style: GoogleFonts.outfit(fontSize: 9, color: _rc, fontWeight: FontWeight.w600)),
                const SizedBox(width: 3),
                Icon(Icons.arrow_drop_down_rounded, size: 13, color: _rc),
              ]),
            ),
          ),
          const Spacer(),
          // Re-translate button
          GestureDetector(
            onTap: widget.isRetranslating ? null : widget.onRetranslate,
            child: AnimatedContainer(
              duration: 200.ms,
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: _C.violet.withValues(alpha: widget.isRetranslating ? 0.05 : 0.12),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: _C.violetLight.withValues(alpha: 0.35)),
              ),
              child: widget.isRetranslating
                  ? const SizedBox(width: 14, height: 14,
                      child: CircularProgressIndicator(strokeWidth: 1.5, color: _C.violetLight))
                  : Row(mainAxisSize: MainAxisSize.min, children: [
                      const Icon(Icons.refresh_rounded, size: 12, color: _C.violetLight),
                      const SizedBox(width: 4),
                      Text('AI ≡', style: GoogleFonts.outfit(fontSize: 10, color: _C.violetLight, fontWeight: FontWeight.w600)),
                    ]),
            ),
          ),
        ]),

        // ── Role picker (expanded)
        if (_showRole) ...[
          const SizedBox(height: 8),
          Wrap(spacing: 6, runSpacing: 6, children: _kRoles.map((r) => GestureDetector(
            onTap: () {
              widget.onRoleChange(r);
              setState(() => _showRole = false);
            },
            child: AnimatedContainer(
              duration: 150.ms,
              padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
              decoration: BoxDecoration(
                color: seg.speakerRole == r ? _roleColor(r).withValues(alpha: 0.2) : _C.bg1,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: _roleColor(r).withValues(alpha: seg.speakerRole == r ? 0.6 : 0.2)),
              ),
              child: Text(r.replaceAll('_', ' '),
                  style: GoogleFonts.outfit(fontSize: 10, color: _roleColor(r), fontWeight: FontWeight.w600)),
            ),
          )).toList()),
        ],

        const SizedBox(height: 10),

        // ── Chinese source
        if (seg.chineseText.isNotEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: _C.orange.withValues(alpha: 0.06),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: _C.orange.withValues(alpha: 0.2)),
            ),
            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('中 ', style: GoogleFonts.outfit(fontSize: 10, color: _C.orange, fontWeight: FontWeight.w700)),
              Expanded(child: Text(seg.chineseText,
                  style: GoogleFonts.outfit(fontSize: 13, color: _C.t0, height: 1.5))),
            ]),
          ),

        const SizedBox(height: 8),

        // ── Khmer editable field
        TextField(
          controller: _khCtrl,
          onChanged: widget.onTextChange,
          style: GoogleFonts.kantumruyPro(fontSize: 14, color: _C.t0, height: 1.6),
          maxLines: 3,
          minLines: 2,
          decoration: InputDecoration(
            hintText: 'អក្សរខ្មែរ...',
            prefixIcon: Padding(
              padding: const EdgeInsets.only(left: 8, right: 4, top: 8),
              child: Text('🇰🇭', style: const TextStyle(fontSize: 14)),
            ),
            prefixIconConstraints: const BoxConstraints(minWidth: 30),
            filled: true,
            fillColor: _C.violet.withValues(alpha: 0.05),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: _gc.withValues(alpha: 0.2)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: _gc.withValues(alpha: 0.55), width: 1.5),
            ),
          ),
        ),

        // ── Timestamp
        const SizedBox(height: 6),
        Text(
          '⏱ ${seg.start.toStringAsFixed(1)}s → ${seg.end.toStringAsFixed(1)}s  '
          '(${(seg.end - seg.start).toStringAsFixed(1)}s)',
          style: GoogleFonts.outfit(fontSize: 10, color: _C.t2),
        ),
      ]),
    );
  }
}

class _TranslateBottomBar extends StatelessWidget {
  final int segCount;
  final VoidCallback? onExport, onClear;
  const _TranslateBottomBar({required this.segCount, this.onExport, this.onClear});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      decoration: BoxDecoration(
        color: _C.bg0,
        border: Border(top: BorderSide(color: const Color(0x14FFFFFF))),
      ),
      child: Row(children: [
        Expanded(
          flex: 3,
          child: _NeonBtn(
            label: segCount == 0 ? '→ Export to Workspace' : '🎬 Export $segCount ឈុត → Workspace',
            gradient: const LinearGradient(colors: [Color(0xFF7C3AED), Color(0xFF06B6D4)]),
            onTap: onExport,
          ),
        ),
        if (onClear != null) ...[
          const SizedBox(width: 10),
          _NeonBtn(
            label: '🗑',
            gradient: LinearGradient(colors: [Colors.redAccent.withValues(alpha: 0.8), Colors.red.withValues(alpha: 0.6)]),
            onTap: onClear,
          ),
        ],
      ]),
    );
  }
}

class _Badge extends StatelessWidget {
  final String text;
  final Color color;
  const _Badge(this.text, this.color);
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
    decoration: BoxDecoration(
      color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(7)),
    child: Text(text, style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w700, color: color)),
  );
}

class _NeonBtn extends StatefulWidget {
  final String label;
  final LinearGradient gradient;
  final VoidCallback? onTap;
  const _NeonBtn({required this.label, required this.gradient, this.onTap});
  @override State<_NeonBtn> createState() => _NeonBtnState();
}
class _NeonBtnState extends State<_NeonBtn> with SingleTickerProviderStateMixin {
  late AnimationController _p;
  @override void initState() { super.initState(); _p = AnimationController(vsync: this, duration: 100.ms); }
  @override void dispose() { _p.dispose(); super.dispose(); }
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: widget.onTap != null ? (_) => _p.forward() : null,
      onTapUp:   widget.onTap != null ? (_) { _p.reverse(); widget.onTap?.call(); } : null,
      onTapCancel: () => _p.reverse(),
      child: AnimatedBuilder(
        animation: _p,
        builder: (context, _) => Transform.scale(
          scale: 1.0 - 0.03 * _p.value,
          child: AnimatedOpacity(
            opacity: widget.onTap == null ? 0.45 : 1.0, duration: 200.ms,
            child: Container(
              height: 50,
              decoration: BoxDecoration(
                gradient: widget.gradient,
                borderRadius: BorderRadius.circular(14),
                boxShadow: [BoxShadow(color: widget.gradient.colors.first.withValues(alpha: 0.4), blurRadius: 16, offset: const Offset(0, 4))],
              ),
              child: Center(child: Text(widget.label,
                  style: GoogleFonts.kantumruyPro(fontSize: 14, fontWeight: FontWeight.w700, color: Colors.white))),
            ),
          ),
        ),
      ),
    );
  }
}

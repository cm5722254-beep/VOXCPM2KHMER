// lib/services/transcript_service.dart
//
// Transcript + Translation service for VoxCPM2 Khmer Neural Studio v4.0
//
// Two modes:
//  1. SERVER mode  — uploads video to PC server, calls /api/dubbing/scan-timeline
//  2. LOCAL mode   — calls Gemini API directly from phone with base64 audio chunk
//
// Returns List<TranscriptSegment> with:
//   - timestamps (start/end)
//   - original Chinese text
//   - Khmer translation
//   - speaker gender + role

import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'package:uuid/uuid.dart';

// ─── Data model ───────────────────────────────────────────────────────────────

class TranscriptSegment {
  final int     index;
  double        start;
  double        end;
  String        chineseText;   // original dialogue
  String        khmerText;     // translated Khmer
  String        gender;        // 'male' | 'female'
  String        speakerRole;   // e.g. 'male_lead', 'female_lead'
  String        speakerId;     // 'speaker_1', 'speaker_2'…
  String?       audioPath;     // local TTS path (set after dubbing)
  TranscriptStatus status;

  TranscriptSegment({
    required this.index,
    required this.start,
    required this.end,
    this.chineseText  = '',
    this.khmerText    = '',
    this.gender       = 'male',
    this.speakerRole  = 'male_lead',
    this.speakerId    = 'speaker_1',
    this.audioPath,
    this.status       = TranscriptStatus.idle,
  });

  /// Build from server JSON segment
  factory TranscriptSegment.fromJson(Map<String, dynamic> j, int index) {
    final gender = (j['gender'] as String? ?? 'male').toLowerCase().contains('f')
        ? 'female' : 'male';
    return TranscriptSegment(
      index:       index,
      start:       (j['start_time']  as num?)?.toDouble() ?? (index * 3.0),
      end:         (j['end_time']    as num?)?.toDouble() ?? ((index + 1) * 3.0),
      chineseText: j['chinese_text']      as String? ?? '',
      khmerText:   j['khmer_translation'] as String? ?? j['khmer_text'] as String? ?? '',
      gender:      gender,
      speakerRole: j['speaker_role'] as String? ?? (gender == 'female' ? 'female_lead' : 'male_lead'),
      speakerId:   j['speaker_id']   as String? ?? 'speaker_1',
    );
  }

  Map<String, dynamic> toJson() => {
    'line_index':         index,
    'start_time':         start,
    'end_time':           end,
    'chinese_text':       chineseText,
    'khmer_translation':  khmerText,
    'gender':             gender,
    'speaker_role':       speakerRole,
    'speaker_id':         speakerId,
  };
}

enum TranscriptStatus { idle, processing, done, error }

// ─── Progress callback ────────────────────────────────────────────────────────

typedef TranscriptProgress = void Function(double progress, String message);

// ─── Service ─────────────────────────────────────────────────────────────────

class TranscriptService {

  // ── SERVER MODE: upload + scan-timeline ──────────────────────────────────

  /// Upload [videoFile] to [serverUrl], then call /api/dubbing/scan-timeline.
  /// Streams progress via [onProgress] (0.0–1.0).
  static Future<List<TranscriptSegment>> transcribeViaServer({
    required File videoFile,
    required String serverUrl,
    String scope = 'full',
    TranscriptProgress? onProgress,
  }) async {
    onProgress?.call(0.05, '📤 Upload វីដេអូទៅ Server...');

    // Step 1: Upload
    final uploadReq = http.MultipartRequest(
      'POST', Uri.parse('$serverUrl/api/upload'));
    uploadReq.files.add(
        await http.MultipartFile.fromPath('mediaFile', videoFile.path));
    final uploadStreamed = await uploadReq.send()
        .timeout(const Duration(minutes: 5));
    final uploadRes = await http.Response.fromStream(uploadStreamed);

    if (uploadRes.statusCode != 200) {
      throw Exception('Upload failed: HTTP ${uploadRes.statusCode}');
    }
    final uploadData = jsonDecode(uploadRes.body) as Map<String, dynamic>;
    final filename   = uploadData['filename'] as String? ?? '';
    if (filename.isEmpty) throw Exception('Server did not return filename');

    onProgress?.call(0.30, '🔍 AI ស្កេន Timeline...');

    // Step 2: scan-timeline
    final scanRes = await http.post(
      Uri.parse('$serverUrl/api/dubbing/scan-timeline'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'filename': filename, 'scope': scope}),
    ).timeout(const Duration(minutes: 10));

    if (scanRes.statusCode != 200) {
      throw Exception('scan-timeline failed: HTTP ${scanRes.statusCode}');
    }
    final scanData = jsonDecode(scanRes.body) as Map<String, dynamic>;

    onProgress?.call(0.90, '📝 កំពុងដំណើរការលទ្ធផល...');

    if (scanData['success'] != true) {
      throw Exception(scanData['error'] ?? 'scan-timeline returned success=false');
    }

    final rawSegs = (scanData['segments'] as List?) ?? [];
    final segs    = rawSegs.asMap().entries
        .map((e) => TranscriptSegment.fromJson(
              e.value as Map<String, dynamic>, e.key))
        .toList();

    onProgress?.call(1.0, '✅ Transcript រួចរាល់! ${segs.length} ឈុត');
    return segs;
  }

  // ── LOCAL MODE: direct Gemini API call ────────────────────────────────────

  /// Calls Gemini 1.5 Flash multimodal API with the video file as base64 input.
  /// Parses the JSON response into transcript segments.
  ///
  /// [geminiApiKey] — your GEMINI_API_KEY from .env
  static Future<List<TranscriptSegment>> transcribeViaGemini({
    required File videoFile,
    required String geminiApiKey,
    String model = 'gemini-1.5-flash',
    TranscriptProgress? onProgress,
  }) async {
    if (geminiApiKey.isEmpty || geminiApiKey.startsWith('your_')) {
      throw Exception('Gemini API key is not set. Please add it in Settings.');
    }

    onProgress?.call(0.05, '📖 អានឯកសារវីដេអូ...');

    // Read video file as base64
    final bytes  = await videoFile.readAsBytes();
    final b64    = base64Encode(bytes);
    final mime   = _mimeFor(videoFile.path);

    onProgress?.call(0.20, '🤖 ផ្ញើទៅ Gemini AI...');

    const prompt = '''
You are an expert Chinese-to-Khmer movie dubbing transcriptionist.

Analyze this video and extract ALL spoken Chinese dialogue segments.

Return ONLY a valid JSON array. Each element must be:
{
  "start_time": <float seconds>,
  "end_time": <float seconds>,
  "chinese_text": "<original spoken Chinese>",
  "khmer_translation": "<Khmer translation — natural, cinematic dubbing style, matching lip-sync rhythm>",
  "gender": "male" or "female",
  "speaker_role": "male_lead" | "female_lead" | "elder" | "child" | "villain_female" | "villain_male" | "general" | "servant_female",
  "speaker_id": "speaker_1" (unique per character)
}

Rules:
- Khmer text must use only Khmer Unicode (ក-អ). No Thai, no Chinese chars.
- Match syllable count/rhythm to original for lip-sync.
- Cover the FULL video.
- Return ONLY the JSON array, no markdown, no explanation.
''';

    final body = jsonEncode({
      'contents': [{
        'parts': [
          {'text': prompt},
          {
            'inline_data': {
              'mime_type': mime,
              'data': b64,
            }
          }
        ]
      }],
      'generationConfig': {
        'temperature': 0.3,
        'maxOutputTokens': 8192,
      }
    });

    final url = 'https://generativelanguage.googleapis.com/v1beta/models/'
        '$model:generateContent?key=$geminiApiKey';

    onProgress?.call(0.35, '⏳ Gemini AI កំពុងបកប្រែ... (អាចចំណាយ 1-3 នាទី)');

    final res = await http.post(
      Uri.parse(url),
      headers: {'Content-Type': 'application/json'},
      body: body,
    ).timeout(const Duration(minutes: 8));

    if (res.statusCode != 200) {
      final err = jsonDecode(res.body);
      throw Exception('Gemini error: ${err['error']?['message'] ?? res.statusCode}');
    }

    onProgress?.call(0.80, '📝 កំពុងវិភាគលទ្ធផល...');

    final resData  = jsonDecode(res.body) as Map<String, dynamic>;
    final content  = resData['candidates']?[0]?['content']?['parts']?[0]?['text'] as String? ?? '';
    final cleaned  = _extractJson(content);

    List<dynamic> rawList;
    try {
      rawList = jsonDecode(cleaned) as List;
    } catch (e) {
      throw Exception('Gemini returned invalid JSON: ${cleaned.substring(0, cleaned.length.clamp(0, 200))}');
    }

    final segs = rawList.asMap().entries
        .map((e) => TranscriptSegment.fromJson(
              e.value as Map<String, dynamic>, e.key))
        .toList();

    onProgress?.call(1.0, '✅ Gemini Transcript ${segs.length} ឈុត');
    return segs;
  }

  // ── Translate single line (Gemini) ─────────────────────────────────────

  /// Re-translate a single Chinese line to Khmer via Gemini.
  static Future<String> retranslateSegment({
    required String chineseText,
    required String speakerRole,
    required String geminiApiKey,
    String model = 'gemini-1.5-flash',
  }) async {
    if (geminiApiKey.isEmpty) throw Exception('No Gemini key');

    final body = jsonEncode({
      'contents': [{
        'parts': [{
          'text': 'Translate this Chinese movie dialogue to natural cinematic Khmer '
              '(ភាសាខ្មែរបុរាណ/ភាសាកុន). Speaker role: $speakerRole.\n'
              'Chinese: "$chineseText"\n'
              'Return ONLY the Khmer translation text, nothing else.'
        }]
      }],
      'generationConfig': {'temperature': 0.4, 'maxOutputTokens': 256},
    });

    final url = 'https://generativelanguage.googleapis.com/v1beta/models/'
        '$model:generateContent?key=$geminiApiKey';

    final res = await http.post(Uri.parse(url),
        headers: {'Content-Type': 'application/json'},
        body: body).timeout(const Duration(seconds: 30));

    if (res.statusCode != 200) throw Exception('Gemini ${res.statusCode}');
    final d = jsonDecode(res.body);
    return (d['candidates']?[0]?['content']?['parts']?[0]?['text'] as String? ?? '').trim();
  }

  // ── Save / load transcript ─────────────────────────────────────────────

  /// Save segments to a JSON file in temp directory. Returns file path.
  static Future<String> saveToFile(List<TranscriptSegment> segments) async {
    final dir  = await getTemporaryDirectory();
    final path = '${dir.path}/transcript_${const Uuid().v4().substring(0, 8)}.json';
    await File(path).writeAsString(
        jsonEncode(segments.map((s) => s.toJson()).toList()));
    return path;
  }

  /// Load segments from a previously saved JSON file.
  static Future<List<TranscriptSegment>> loadFromFile(String path) async {
    final raw  = await File(path).readAsString();
    final list = jsonDecode(raw) as List;
    return list.asMap().entries
        .map((e) => TranscriptSegment.fromJson(e.value as Map<String, dynamic>, e.key))
        .toList();
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  static String _mimeFor(String path) {
    final ext = path.split('.').last.toLowerCase();
    return switch (ext) {
      'mp4'  => 'video/mp4',
      'mkv'  => 'video/x-matroska',
      'mov'  => 'video/quicktime',
      'avi'  => 'video/x-msvideo',
      'webm' => 'video/webm',
      _      => 'video/mp4',
    };
  }

  /// Extract the first JSON array from a string (handles markdown code fences)
  static String _extractJson(String text) {
    // Remove ```json ... ``` fences
    text = text.replaceAll(RegExp(r'```json\s*'), '').replaceAll(RegExp(r'```\s*'), '');
    // Find first '[' to last ']'
    final start = text.indexOf('[');
    final end   = text.lastIndexOf(']');
    if (start == -1 || end == -1 || end <= start) return '[]';
    return text.substring(start, end + 1);
  }
}

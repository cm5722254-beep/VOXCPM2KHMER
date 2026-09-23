// lib/services/edge_tts_service.dart
//
// Microsoft Edge TTS — Dart WebSocket Client
// Connects directly to wss://speech.platform.bing.com and streams audio MP3 data.
// No PC server required — runs entirely on-device.

import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'package:path_provider/path_provider.dart';
import 'package:uuid/uuid.dart';
import 'package:web_socket_channel/io.dart';

/// Available Khmer-quality voices for dubbing.
class EdgeTtsVoice {
  static const String piseth = 'km-KH-PisethNeural';   // Male — ប្រុស
  static const String sreymom = 'km-KH-SreymomNeural'; // Female — ស្រី

  /// Pick voice by gender string ('male' / 'female')
  static String forGender(String gender) {
    return gender.toLowerCase() == 'female' ? sreymom : piseth;
  }
}

/// Result returned by [EdgeTtsService.generateAudio].
class TtsResult {
  final String filePath; // Absolute path to the MP3 file on disk
  final Duration duration; // Approximate duration (0 if not available)

  const TtsResult({required this.filePath, this.duration = Duration.zero});
}

/// On-device Edge TTS client.
///
/// Usage:
/// ```dart
/// final result = await EdgeTtsService.generateAudio(
///   text: 'សួស្ដី',
///   voiceName: EdgeTtsVoice.piseth,
/// );
/// ```
class EdgeTtsService {
  static const String _wssBase =
      'wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1';
  static const String _token =
      '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
  static const Duration _timeout = Duration(seconds: 30);

  // ── Timestamp helper ────────────────────────────────────────────────────────

  static String _timestamp() {
    final now = DateTime.now().toUtc();
    final y   = now.year.toString().padLeft(4, '0');
    final mo  = now.month.toString().padLeft(2, '0');
    final d   = now.day.toString().padLeft(2, '0');
    final h   = now.hour.toString().padLeft(2, '0');
    final mi  = now.minute.toString().padLeft(2, '0');
    final s   = now.second.toString().padLeft(2, '0');
    final ms  = now.millisecond.toString().padLeft(3, '0');
    return '$y-$mo-${d}T$h:$mi:$s.${ms}Z';
  }

  // ── Message builders ────────────────────────────────────────────────────────

  /// Initial speech.config message — sent once per connection.
  static String _speechConfig() {
    final payload = jsonEncode({
      'context': {
        'synthesis': {
          'audio': {
            'metadataoptions': {
              'sentenceBoundaryEnabled': 'false',
              'wordBoundaryEnabled': 'false',
            },
            'outputFormat': 'audio-24khz-48kbitrate-mono-mp3',
          },
        },
      },
    });
    return 'X-Timestamp:${_timestamp()}\r\n'
        'Content-Type:application/json; charset=utf-8\r\n'
        'Path:speech.config\r\n'
        '\r\n'
        '$payload';
  }

  /// SSML synthesis request message.
  static String _ssmlMessage({
    required String requestId,
    required String text,
    required String voiceName,
    String pitch = '+0Hz',
    String rate = '+0%',
    String volume = '+0%',
  }) {
    // Escape XML special chars
    final safeText = text
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&apos;');

    final ssml = '<speak version=\'1.0\' '
        'xmlns=\'http://www.w3.org/2001/10/synthesis\' '
        'xml:lang=\'km-KH\'>'
        '<voice name=\'$voiceName\'>'
        '<prosody pitch=\'$pitch\' rate=\'$rate\' volume=\'$volume\'>'
        '$safeText'
        '</prosody>'
        '</voice>'
        '</speak>';

    return 'X-RequestId:$requestId\r\n'
        'Content-Type:application/ssml+xml\r\n'
        'X-Timestamp:${_timestamp()}\r\n'
        'Path:ssml\r\n'
        '\r\n'
        '$ssml';
  }

  // ── Audio binary parser ──────────────────────────────────────────────────────

  /// Edge TTS binary frames have a 2-byte big-endian header length prefix
  /// followed by the header text, then audio payload.
  ///
  /// Frame layout:
  ///   [2 bytes: header length (big-endian)]
  ///   [N bytes: header text]
  ///   [remaining bytes: raw MP3 data]
  ///
  /// We look for "Path:audio" in the header to confirm it's an audio frame.
  static Uint8List? _extractAudioBytes(Uint8List data) {
    if (data.length < 2) return null;
    final headerLen = (data[0] << 8) | data[1];
    if (data.length < 2 + headerLen) return null;

    final headerBytes = data.sublist(2, 2 + headerLen);
    final header = utf8.decode(headerBytes, allowMalformed: true);

    if (!header.contains('Path:audio')) return null;

    final audioStart = 2 + headerLen;
    if (audioStart >= data.length) return null;
    return data.sublist(audioStart);
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  /// Generate TTS audio for [text] using [voiceName] and save to a temp MP3 file.
  ///
  /// Returns [TtsResult] with the path to the MP3 file.
  /// Throws on network error or timeout.
  static Future<TtsResult> generateAudio({
    required String text,
    required String voiceName,
    String pitch = '+0Hz',
    String rate = '+0%',
    String volume = '+0%',
  }) async {
    if (text.trim().isEmpty) {
      throw ArgumentError('TTS text must not be empty');
    }

    final requestId = const Uuid().v4().replaceAll('-', '').toUpperCase();
    final uri = Uri.parse('$_wssBase?TrustedClientToken=$_token');

    final tempDir = await getTemporaryDirectory();
    final outPath =
        '${tempDir.path}/tts_${requestId}_${DateTime.now().millisecondsSinceEpoch}.mp3';
    final file = File(outPath);
    final sink = file.openWrite(mode: FileMode.write);

    final completer = Completer<TtsResult>();
    bool turnEnded = false;

    IOWebSocketChannel? channel;

    try {
      channel = IOWebSocketChannel.connect(
        uri,
        headers: {
          'Origin': 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
          'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
              '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache',
        },
        connectTimeout: _timeout,
      );
    } catch (e) {
      await sink.close();
      rethrow;
    }

    // Schedule overall timeout
    final timer = Timer(_timeout, () {
      if (!completer.isCompleted) {
        channel?.sink.close();
        completer.completeError(
            TimeoutException('Edge TTS timed out after ${_timeout.inSeconds}s'));
      }
    });

    channel.stream.listen(
      (dynamic message) {
        if (turnEnded || completer.isCompleted) return;

        if (message is String) {
          // Text frame — look for turn.end signal
          if (message.contains('Path:turn.end')) {
            turnEnded = true;
            channel?.sink.close();
          }
        } else if (message is List<int>) {
          final bytes = Uint8List.fromList(message);
          final audio = _extractAudioBytes(bytes);
          if (audio != null && audio.isNotEmpty) {
            sink.add(audio);
          }
        } else if (message is Uint8List) {
          final audio = _extractAudioBytes(message);
          if (audio != null && audio.isNotEmpty) {
            sink.add(audio);
          }
        }
      },
      onDone: () async {
        timer.cancel();
        await sink.flush();
        await sink.close();
        if (!completer.isCompleted) {
          completer.complete(TtsResult(filePath: outPath));
        }
      },
      onError: (Object error) async {
        timer.cancel();
        await sink.close();
        if (!completer.isCompleted) {
          completer.completeError(error);
        }
      },
      cancelOnError: true,
    );

    // Send config then SSML
    try {
      channel.sink.add(_speechConfig());
      channel.sink.add(_ssmlMessage(
        requestId: requestId,
        text: text,
        voiceName: voiceName,
        pitch: pitch,
        rate: rate,
        volume: volume,
      ));
    } catch (e) {
      timer.cancel();
      await sink.close();
      if (!completer.isCompleted) completer.completeError(e);
    }

    return completer.future;
  }

  /// Convenience: generate audio for a dialogue segment with gender-based voice.
  static Future<TtsResult> generateForGender({
    required String text,
    required String gender,
    String pitch = '+0Hz',
    String rate = '+0%',
  }) {
    return generateAudio(
      text: text,
      voiceName: EdgeTtsVoice.forGender(gender),
      pitch: pitch,
      rate: rate,
    );
  }

  /// Generate audio for a list of segments concurrently (up to [concurrency] at once).
  /// Returns a list of file paths in the same order as [segments].
  static Future<List<String?>> generateBatch({
    required List<Map<String, dynamic>> segments,
    int concurrency = 3,
    void Function(int done, int total, String msg)? onProgress,
  }) async {
    final results = List<String?>.filled(segments.length, null);
    int done = 0;

    // Process in chunks to limit concurrency
    for (int start = 0; start < segments.length; start += concurrency) {
      final end =
          (start + concurrency).clamp(0, segments.length);
      final chunk = segments.sublist(start, end);

      final futures = chunk.asMap().entries.map((entry) async {
        final i = start + entry.key;
        final seg = entry.value;
        final text = (seg['khmer_translation'] as String? ??
                seg['text'] as String? ?? '')
            .trim();
        if (text.isEmpty) return;
        try {
          final result = await generateForGender(
            text: text,
            gender: seg['gender'] as String? ?? 'male',
          );
          results[i] = result.filePath;
        } catch (e) {
          // Log but don't stop the whole batch
          results[i] = null;
        } finally {
          done++;
          onProgress?.call(done, segments.length,
              'TTS $done/${segments.length}: ${text.length > 20 ? '${text.substring(0, 20)}…' : text}');
        }
      });

      await Future.wait(futures);
    }

    return results;
  }
}

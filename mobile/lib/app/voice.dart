import 'dart:async';
import 'dart:io';
import 'dart:typed_data';

import 'package:audioplayers/audioplayers.dart';
import 'package:path_provider/path_provider.dart';
import 'package:record/record.dart';

import '../api/api.dart';

// Микрофон ва садо барои ёвари овозӣ.

class VoiceRecorder {
  final _recorder = AudioRecorder();
  StreamSubscription<Amplitude>? _levels;
  Completer<String?>? _done;

  // Сатҳи садо 0..1 — барои ҷунбиши доира.
  void Function(double level)? onLevel;

  Future<bool> hasPermission() => _recorder.hasPermission();

  // То анҷоми гап гӯш мекунад: баъди хомӯшии кӯтоҳ худаш мебандад.
  // Роҳи файли садо бармегардонад; агар корбар гап назад — null.
  Future<String?> listen() async {
    final dir = await getTemporaryDirectory();
    final path = '${dir.path}/speech.m4a';
    await _recorder.start(const RecordConfig(encoder: AudioEncoder.aacLc, sampleRate: 16000, numChannels: 1), path: path);
    final done = Completer<String?>();
    _done = done;
    final started = DateTime.now();
    var lastLoud = started;
    var spoke = false;
    _levels = _recorder.onAmplitudeChanged(const Duration(milliseconds: 150)).listen((a) {
      final now = DateTime.now();
      onLevel?.call(((a.current + 50) / 50).clamp(0.0, 1.0));
      if (a.current > -38) {
        spoke = true;
        lastLoud = now;
      }
      final total = now.difference(started);
      if (spoke && now.difference(lastLoud) > const Duration(milliseconds: 1400)) {
        stop();
      } else if (!spoke && total > const Duration(seconds: 8)) {
        cancel();
      } else if (total > const Duration(seconds: 25)) {
        stop();
      }
    });
    return done.future;
  }

  // Анҷоми гап: садо фиристода мешавад.
  Future<void> stop() async {
    final done = _done;
    if (done == null) return;
    _done = null;
    await _levels?.cancel();
    final path = await _recorder.stop();
    done.complete(path);
  }

  // Бекор кардан: садо фиристода намешавад.
  Future<void> cancel() async {
    final done = _done;
    if (done == null) return;
    _done = null;
    await _levels?.cancel();
    await _recorder.stop();
    done.complete(null);
  }

  Future<void> dispose() async {
    await cancel();
    await _recorder.dispose();
  }
}

class VoicePlayer {
  final _player = AudioPlayer();
  int _run = 0;

  // Ҷумла ба ҷумла: ҷумлаи аввал зуд сар мешавад. false — садо наомад.
  Future<bool> speak(String text, String lang) async {
    final run = ++_run;
    final parts = splitSentences(text);
    final audio = [for (final part in parts) Api.instance.speak(part, lang)];
    var played = false;
    for (final item in audio) {
      final Uint8List? bytes = await item;
      if (run != _run) return played;
      if (bytes == null) continue;
      final finished = _player.onPlayerComplete.first;
      await _player.play(BytesSource(bytes, mimeType: 'audio/mpeg'));
      played = true;
      await Future.any([finished, _stopped.future]);
      if (run != _run) return played;
    }
    return played;
  }

  Completer<void> _stopped = Completer<void>();

  Future<void> stop() async {
    _run++;
    if (!_stopped.isCompleted) _stopped.complete();
    _stopped = Completer<void>();
    await _player.stop();
  }

  Future<void> dispose() async {
    await stop();
    await _player.dispose();
  }
}

// Матн ба ҷумлаҳо; ҷумлаҳои хурд якҷоя мешаванд, то садо бурида набарояд.
List<String> splitSentences(String text) {
  final raw = text.trim().split(RegExp(r'(?<=[.!?…])\s+'));
  final out = <String>[];
  for (final s in raw) {
    if (s.isEmpty) continue;
    if (out.isNotEmpty && out.last.length + s.length < 90) {
      out[out.length - 1] = '${out.last} $s';
    } else {
      out.add(s);
    }
  }
  return out;
}

Future<void> deleteQuietly(String path) async {
  try {
    await File(path).delete();
  } catch (_) {
    // Файли муваққатӣ; агар нест нашавад, бори дигар иваз мешавад.
  }
}

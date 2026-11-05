import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

// Натиҷаи охирини тест дар худи телефон: мисли сайт, баъди баста шудан ҳам мемонад.
class LastResult extends ChangeNotifier {
  static const _key = 'quiz_last_result_v1';
  Map<String, dynamic>? _saved;

  Map<String, dynamic>? get result => _saved == null ? null : Map<String, dynamic>.from(_saved!['result']);
  Map<String, dynamic>? get body => _saved == null ? null : Map<String, dynamic>.from(_saved!['body']);
  String? get advice => _saved?['advice'] as String?;
  List<Map<String, dynamic>> get why => [for (final item in (_saved?['why'] as List? ?? const [])) Map<String, dynamic>.from(item)];

  Future<void> load() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_key);
      _saved = raw == null ? null : Map<String, dynamic>.from(jsonDecode(raw));
    } catch (_) {
      _saved = null;
    }
    notifyListeners();
  }

  Future<void> save(Map<String, dynamic> result, Map<String, dynamic> body, [List<Map<String, dynamic>> why = const []]) async {
    _saved = {'result': result, 'body': body, 'why': why};
    notifyListeners();
    await _write();
  }

  Future<void> saveAdvice(String advice) async {
    if (_saved == null) return;
    _saved!['advice'] = advice;
    await _write();
  }

  // Баъди баромадан аз ҳисоб дар телефони муштарак натиҷа намемонад.
  Future<void> clear() async {
    _saved = null;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
  }

  Future<void> _write() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, jsonEncode(_saved));
  }
}

final lastResult = LastResult();

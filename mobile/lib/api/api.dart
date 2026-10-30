import 'dart:convert';

import 'package:http/http.dart' as http;

import '../app/settings.dart';
import '../app/i18n.dart';

// Ҳамон API-и сайт. Барои санҷиш дар компютер: --dart-define=API_BASE=http://localhost:3005/api
const apiBase = String.fromEnvironment('API_BASE', defaultValue: 'https://ikhtisosiman.qobus.tj/api');

class ApiException implements Exception {
  ApiException(this.message, {this.status = 0, this.code, this.data});
  final String message;
  final int status;
  final String? code; // масалан EMAIL_NOT_VERIFIED
  final Map<String, dynamic>? data;
  @override
  String toString() => message;
}

class Api {
  Api._();
  static final instance = Api._();
  final _client = http.Client();

  // Токени воридшавӣ; AuthStore онро мегузорад.
  String? token;

  Map<String, String> get _headers => {'Content-Type': 'application/json', if (token != null) 'Authorization': 'Bearer $token'};

  // Кеши GET дар хотира: рӯйхатҳо (ихтисос, донишгоҳ) дубора фавран кушода мешаванд,
  // ду дархости якхела дар як вақт ба сервер як бор мераванд.
  static const _cacheTtl = Duration(minutes: 10);
  final _cache = <String, (DateTime, Future<dynamic>)>{};

  Future<dynamic> get(String path, [Map<String, String>? query]) {
    final uri = Uri.parse('$apiBase$path').replace(queryParameters: {'lang': appSettings.lang, ...?query});
    final key = uri.toString();
    final hit = _cache[key];
    if (hit != null && DateTime.now().difference(hit.$1) < _cacheTtl) return hit.$2;
    final future = _send(() => _client.get(uri, headers: _headers));
    _cache[key] = (DateTime.now(), future);
    future.catchError((_) {
      _cache.remove(key); // хаторо нигоҳ намедорем — «Боз кӯшиш» дархости нав мекунад
      return null;
    });
    if (_cache.length > 300) _cache.remove(_cache.keys.first);
    return future;
  }

  Future<dynamic> post(String path, Map<String, dynamic> body) async {
    final uri = Uri.parse('$apiBase$path');
    return _send(() => _client.post(uri, headers: _headers, body: jsonEncode(body)));
  }

  Future<dynamic> delete(String path) async {
    final uri = Uri.parse('$apiBase$path');
    return _send(() => _client.delete(uri, headers: _headers));
  }

  Future<dynamic> _send(Future<http.Response> Function() request) async {
    http.Response response;
    try {
      response = await request().timeout(const Duration(seconds: 25));
    } catch (_) {
      throw ApiException(t('Интернет нест ё суст аст. Пайвастро санҷед ва боз кӯшиш кунед.'));
    }
    final text = utf8.decode(response.bodyBytes);
    dynamic data;
    try {
      data = text.isEmpty ? null : jsonDecode(text);
    } catch (_) {
      data = null;
    }
    if (response.statusCode >= 400) {
      throw ApiException(
        _message(data, response.statusCode),
        status: response.statusCode,
        code: data is Map && data['code'] is String ? data['code'] as String : null,
        data: data is Map ? Map<String, dynamic>.from(data) : null,
      );
    }
    return data;
  }

  // Паёми сервер: сатр ё рӯйхат (хатоҳои санҷиши майдонҳо).
  static String _message(dynamic data, int status) {
    final m = data is Map ? data['message'] : null;
    if (m is String && m.trim().isNotEmpty) return m;
    if (m is List && m.isNotEmpty) return m.map((e) => '$e').join('\n');
    if (status == 429) return t('Кӯшишҳо зиёд шуданд. Каме сабр кунед.');
    if (status >= 500) return t('Сервер ҳозир ҷавоб намедиҳад. Баъдтар кӯшиш кунед.');
    return t('Хатогӣ рӯй дод. Боз кӯшиш кунед.');
  }
}

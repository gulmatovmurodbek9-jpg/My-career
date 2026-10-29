import 'dart:convert';

import 'package:http/http.dart' as http;

// Ҳамон API-и сайт. Барои санҷиш дар компютер: --dart-define=API_BASE=http://localhost:3005/api
const apiBase = String.fromEnvironment('API_BASE', defaultValue: 'https://ikhtisosiman.qobus.tj/api');

class ApiException implements Exception {
  ApiException(this.message);
  final String message;
  @override
  String toString() => message;
}

class Api {
  Api._();
  static final instance = Api._();
  final _client = http.Client();

  Future<dynamic> get(String path, [Map<String, String>? query]) async {
    final uri = Uri.parse('$apiBase$path').replace(queryParameters: {'lang': 'tj', ...?query});
    return _send(() => _client.get(uri));
  }

  Future<dynamic> post(String path, Map<String, dynamic> body) async {
    final uri = Uri.parse('$apiBase$path');
    return _send(() => _client.post(uri, headers: {'Content-Type': 'application/json'}, body: jsonEncode(body)));
  }

  Future<dynamic> _send(Future<http.Response> Function() request) async {
    http.Response response;
    try {
      response = await request().timeout(const Duration(seconds: 25));
    } catch (_) {
      throw ApiException('Интернет нест ё суст аст. Пайвастро санҷед ва боз кӯшиш кунед.');
    }
    final text = utf8.decode(response.bodyBytes);
    final data = text.isEmpty ? null : jsonDecode(text);
    if (response.statusCode >= 400) {
      final message = data is Map && data['message'] is String ? data['message'] as String : 'Хатогӣ рӯй дод. Боз кӯшиш кунед.';
      throw ApiException(message);
    }
    return data;
  }
}

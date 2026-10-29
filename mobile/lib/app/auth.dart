import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../api/api.dart';

class AppUser {
  AppUser.fromJson(Map<String, dynamic> j)
      : id = '${j['id'] ?? ''}',
        name = '${j['name'] ?? ''}'.trim(),
        email = '${j['email'] ?? ''}',
        role = '${j['role'] ?? 'user'}';

  final String id;
  final String name;
  final String email;
  final String role;

  Map<String, dynamic> toJson() => {'id': id, 'name': name, 'email': email, 'role': role};

  String get displayName => name.isNotEmpty ? name : email.split('@').first;
}

// Ҳолати воридшавӣ. Токен дар хотираи бехатари телефон (Keychain / Keystore) нигоҳ дошта мешавад.
class AuthStore extends ChangeNotifier {
  static const _storage = FlutterSecureStorage();

  String? _token;
  AppUser? _user;

  bool get isLoggedIn => _token != null;
  AppUser? get user => _user;

  Future<void> load() async {
    try {
      _token = await _storage.read(key: 'token');
      final name = await _storage.read(key: 'user_name');
      final email = await _storage.read(key: 'user_email');
      final id = await _storage.read(key: 'user_id');
      if (_token != null && email != null) _user = AppUser.fromJson({'id': id, 'name': name, 'email': email});
    } catch (_) {
      _token = null;
    }
    Api.instance.token = _token;
    notifyListeners();
  }

  Future<void> _save(Map<String, dynamic> data) async {
    final token = data['access_token'];
    if (token is! String || token.isEmpty) throw ApiException('Ворид шудан нашуд. Боз кӯшиш кунед.');
    _token = token;
    _user = data['user'] is Map ? AppUser.fromJson(Map<String, dynamic>.from(data['user'])) : null;
    Api.instance.token = token;
    notifyListeners();
    try {
      await _storage.write(key: 'token', value: token);
      await _storage.write(key: 'user_id', value: _user?.id);
      await _storage.write(key: 'user_name', value: _user?.name);
      await _storage.write(key: 'user_email', value: _user?.email);
    } catch (_) {/* нигоҳ дошта нашуд — танҳо то бастани барнома */}
  }

  Future<void> login(String email, String password) async {
    final data = await Api.instance.post('/auth/login', {'email': email.trim(), 'password': password});
    await _save(Map<String, dynamic>.from(data));
  }

  // Бақайдгирӣ токен намедиҳад: аввал коди 6-рақамаи почта лозим аст.
  Future<void> register(String name, String email, String password) async {
    await Api.instance.post('/auth/register', {'name': name.trim(), 'email': email.trim(), 'password': password});
  }

  Future<void> verifyEmail(String email, String code) async {
    final data = await Api.instance.post('/auth/verify-email', {'email': email.trim(), 'code': code});
    await _save(Map<String, dynamic>.from(data));
  }

  Future<void> resendCode(String email) => Api.instance.post('/auth/resend-code', {'email': email.trim()});

  Future<void> forgotPassword(String email) => Api.instance.post('/auth/forgot-password', {'email': email.trim()});

  Future<String> resetPassword(String email, String code, String password) async {
    final data = await Api.instance.post('/auth/reset-password', {'email': email.trim(), 'code': code, 'password': password});
    return data is Map && data['message'] is String ? data['message'] as String : 'Парол иваз шуд.';
  }

  Future<void> logout() async {
    _token = null;
    _user = null;
    Api.instance.token = null;
    notifyListeners();
    try {
      await _storage.deleteAll();
    } catch (_) {}
  }

  // Талаби App Store: корбар ҳисобашро дар худи барнома нест карда тавонад.
  Future<void> deleteAccount() async {
    await Api.instance.delete('/users/me');
    await logout();
  }
}

final authStore = AuthStore();

// Санҷиши почта ва парол дар телефон — то ба сервер нарафта, хаторо гӯем.
String? validateEmail(String? v) {
  final s = (v ?? '').trim();
  if (s.isEmpty) return 'Почтаро нависед';
  if (!RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]{2,}$').hasMatch(s)) return 'Почта нодуруст аст. Масалан: nom@gmail.com';
  return null;
}

String? validatePassword(String? v) {
  final s = v ?? '';
  if (s.isEmpty) return 'Паролро нависед';
  if (s.length < 6) return 'Парол камаш 6 аломат бошад';
  return null;
}

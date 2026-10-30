import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

// Танзимоти корбар: забон, андозаи ҳарф, синф (баъди 9 ё 11) ва оё экрани «Хуш омадед» дида шудааст.
// Дар телефон нигоҳ дошта мешаванд.
class AppSettings extends ChangeNotifier {
  static const textScales = <double>[1.0, 1.15, 1.3];
  static const langs = ['tj', 'ru', 'en'];

  double _textScale = 1.0;
  int? _grade;
  String _lang = 'tj';
  bool _seenWelcome = false;

  double get textScale => _textScale;
  int? get grade => _grade;
  String get lang => _lang;
  bool get seenWelcome => _seenWelcome;

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    _textScale = prefs.getDouble('textScale') ?? 1.0;
    _grade = prefs.getInt('grade');
    final lang = prefs.getString('lang');
    _lang = langs.contains(lang) ? lang! : 'tj';
    _seenWelcome = prefs.getBool('seenWelcome') ?? false;
    notifyListeners();
  }

  Future<void> setTextScale(double value) async {
    _textScale = value;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setDouble('textScale', value);
  }

  Future<void> setGrade(int value) async {
    _grade = value;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('grade', value);
  }

  Future<void> setLang(String value) async {
    if (!langs.contains(value) || value == _lang) return;
    _lang = value;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('lang', value);
  }

  Future<void> markWelcomeSeen() async {
    _seenWelcome = true;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('seenWelcome', true);
  }
}

final appSettings = AppSettings();

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

// Танзимоти корбар: андозаи ҳарф ва синф (баъди 9 ё 11). Дар телефон нигоҳ дошта мешаванд.
class AppSettings extends ChangeNotifier {
  static const textScales = <double>[1.0, 1.15, 1.3];

  double _textScale = 1.0;
  int? _grade;

  double get textScale => _textScale;
  int? get grade => _grade;

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    _textScale = prefs.getDouble('textScale') ?? 1.0;
    _grade = prefs.getInt('grade');
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
}

final appSettings = AppSettings();

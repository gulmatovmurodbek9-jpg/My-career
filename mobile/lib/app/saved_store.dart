import 'package:flutter/foundation.dart';

import '../api/api.dart';
import 'auth.dart';

// Рамзҳои ихтисосҳои нигоҳдошта: тугмаи «нигоҳ доштан» дар ҳар корт ва дар саҳифаи ихтисос якхела нишон медиҳанд.
class SavedStore extends ChangeNotifier {
  SavedStore() {
    authStore.addListener(_onAuth);
  }

  Set<String> _ids = {};
  bool _loaded = false;
  final Set<String> _busy = {};

  bool isSaved(String id) => _ids.contains(id);
  bool isBusy(String id) => _busy.contains(id);

  void _onAuth() {
    _loaded = false;
    _ids = {};
    notifyListeners();
    ensureLoaded();
  }

  Future<void> ensureLoaded() async {
    if (_loaded || !authStore.isLoggedIn) return;
    _loaded = true;
    try {
      final data = await Api.instance.getFresh('/users/saved-careers');
      _ids = {for (final c in (data as List? ?? const [])) '${(c as Map)['id']}'};
      notifyListeners();
    } catch (_) {
      _loaded = false;
    }
  }

  // Сервер ҳолатро иваз мекунад ва ҳолати навро бармегардонад.
  Future<void> toggle(String id) async {
    if (_busy.contains(id)) return;
    _busy.add(id);
    notifyListeners();
    try {
      final data = await Api.instance.post('/users/save-career/$id', {});
      mark(id, data['saved'] == true);
    } finally {
      _busy.remove(id);
      notifyListeners();
    }
  }

  void mark(String id, bool saved) {
    saved ? _ids.add(id) : _ids.remove(id);
    notifyListeners();
  }
}

final savedStore = SavedStore();

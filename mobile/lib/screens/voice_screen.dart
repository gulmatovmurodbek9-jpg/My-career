import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../api/api.dart';
import '../app/auth.dart';
import '../app/config.dart';
import '../app/i18n.dart';
import '../app/settings.dart';
import '../app/theme.dart';
import '../app/voice.dart';
import '../ui/widgets.dart';
import 'career_detail_screen.dart';
import 'career_sections.dart';
import 'careers_screen.dart';
import 'university_detail_screen.dart';

enum _State { idle, listening, thinking, speaking }

// Ёвари овозӣ: гап мезанед → матн → /careers/assistant → ҷавоб бо овоз → саҳифаи лозимӣ кушода мешавад.
class VoiceScreen extends StatefulWidget {
  const VoiceScreen({super.key, required this.goToTab});

  // Гузариш ба бахшҳои менюи поён: 0 Асосӣ, 1 Тест, 3 Донишгоҳҳо.
  final void Function(int tab) goToTab;

  @override
  State<VoiceScreen> createState() => _VoiceScreenState();
}

class _VoiceScreenState extends State<VoiceScreen> with SingleTickerProviderStateMixin {
  final _mic = VoiceRecorder();
  final _player = VoicePlayer();
  final _input = TextEditingController();
  final _scroll = ScrollController();
  late final _pulse = AnimationController(vsync: this, duration: const Duration(milliseconds: 1400))..repeat(reverse: true);

  _State _state = _State.idle;
  double _level = 0;
  bool _typing = false;
  bool _muted = false;
  String? _notice;
  final _turns = <({bool mine, String text})>[];
  final _history = <Map<String, String>>[];
  List<Map<String, dynamic>> _options = const [];
  String _optionsKind = '';

  @override
  void initState() {
    super.initState();
    _mic.onLevel = (v) {
      if (mounted && _state == _State.listening) setState(() => _level = v);
    };
    WidgetsBinding.instance.addPostFrameCallback((_) => _listen());
  }

  @override
  void dispose() {
    _pulse.dispose();
    _mic.dispose();
    _player.dispose();
    _input.dispose();
    _scroll.dispose();
    super.dispose();
  }

  void _setState(_State s) {
    if (mounted) setState(() => _state = s);
  }

  void _toBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) _scroll.animateTo(_scroll.position.maxScrollExtent, duration: const Duration(milliseconds: 250), curve: Curves.easeOut);
    });
  }

  // Тугмаи калон: вобаста ба ҳолат сар мекунад, анҷом медиҳад ё садоро мебурад.
  Future<void> _onMic() async {
    switch (_state) {
      case _State.idle:
        await _listen();
      case _State.listening:
        await _mic.stop();
      case _State.speaking:
        await _player.stop();
      case _State.thinking:
        break;
    }
  }

  Future<void> _listen() async {
    if (_state != _State.idle || !mounted) return;
    setState(() => _notice = null);
    if (!await _mic.hasPermission()) {
      if (mounted) {
        setState(() {
          _notice = t('Иҷозати микрофон нест. Онро дар танзимоти телефон диҳед ё матн нависед.');
          _typing = true;
        });
      }
      return;
    }
    _setState(_State.listening);
    final path = await _mic.listen();
    if (!mounted) return;
    setState(() => _level = 0);
    if (path == null) {
      // Агар корбар дар ин миён савол интихоб карда бошад, ҳолати нав мемонад.
      if (_state == _State.listening) _setState(_State.idle);
      return;
    }
    _setState(_State.thinking);
    try {
      final text = await Api.instance.transcribe(path);
      if (!mounted) return;
      if (text.isEmpty) {
        setState(() => _notice = t('Мебахшед, нафаҳмидам. Бори дигар бигӯед.'));
        _setState(_State.idle);
        return;
      }
      await _send(text);
    } on ApiException catch (e) {
      if (mounted) setState(() => _notice = e.message);
      _setState(_State.idle);
    } finally {
      deleteQuietly(path);
    }
  }

  Future<void> _send(String raw) async {
    final text = raw.trim();
    if (text.isEmpty || !mounted) return;
    FocusManager.instance.primaryFocus?.unfocus();
    if (_state == _State.listening) await _mic.cancel();
    if (_state == _State.speaking) await _player.stop();
    final offered = _options;
    setState(() {
      _input.clear();
      _notice = null;
      _options = const [];
      _turns.add((mine: true, text: text));
      _state = _State.thinking;
    });
    _toBottom();
    Map<String, dynamic> data;
    try {
      final res = await Api.instance.post('/careers/assistant', {
        'message': text,
        'lang': appSettings.lang,
        'grade': ?appSettings.grade,
        'options': [
          for (final o in offered) {'id': '${o['id'] ?? ''}', 'name': '${o['name'] ?? ''}', 'label': '${o['label'] ?? ''}'},
        ],
        'history': _history,
      }, timeout: Api.aiTimeout);
      data = Map<String, dynamic>.from(res);
    } on ApiException catch (e) {
      if (mounted) setState(() => _notice = e.message);
      _setState(_State.idle);
      return;
    }
    if (!mounted) return;
    final reply = '${data['reply'] ?? ''}'.trim().isEmpty ? t('Мебахшед, нафаҳмидам. Бори дигар бигӯед.') : '${data['reply']}'.trim();
    final action = '${data['action'] ?? ''}';
    final params = data['params'] is Map ? Map<String, dynamic>.from(data['params']) : <String, dynamic>{};
    final lang = '${data['answerLang'] ?? appSettings.lang}';
    _history.add({'q': text, 'a': reply});
    if (_history.length > 6) _history.removeAt(0);
    setState(() {
      _turns.add((mine: false, text: reply));
      if (action.startsWith('choose_') && params['options'] is List) {
        _options = (params['options'] as List).map((e) => Map<String, dynamic>.from(e)).toList();
        _optionsKind = action;
      }
    });
    _toBottom();
    await _applySettings(action, params);
    if (!mounted) return;
    if (!_muted) {
      _setState(_State.speaking);
      final played = await _player.speak(reply, lang);
      if (!mounted) return;
      if (!played) setState(() => _notice = t('Садо нест — лутфан матнро хонед.'));
    }
    _setState(_State.idle);
    if (_navigate(action, params)) return;
    // Сӯҳбат давом мекунад: баъди ҷавоб боз гӯш мекунад (агар корбар матн нанавишта бошад).
    if (!_typing && !_muted && _options.isEmpty) _listen();
  }

  Future<void> _applySettings(String action, Map<String, dynamic> params) async {
    switch (action) {
      case 'set_grade':
        final g = int.tryParse('${params['grade']}');
        await appSettings.setGrade(g == 9 || g == 11 ? g : null);
      case 'set_theme':
        await appSettings.setDark('${params['theme']}' == 'dark');
      case 'save_career':
        if (authStore.isLoggedIn && '${params['id'] ?? ''}'.isNotEmpty) {
          try {
            await Api.instance.post('/users/save-career/${params['id']}', {});
          } on ApiException catch (e) {
            if (mounted) setState(() => _notice = e.message);
          }
        }
    }
  }

  // true — ба саҳифаи дигар рафтем ва гӯш кардан лозим нест.
  bool _navigate(String action, Map<String, dynamic> params) {
    final nav = Navigator.of(context);
    void open(Widget page) => nav.pushReplacement(smoothRoute(page));
    void tab(int i) {
      widget.goToTab(i);
      nav.pop();
    }

    void web(String path) {
      openLink('$siteUrl$path');
      nav.pop();
    }

    final id = '${params['id'] ?? ''}';
    switch (action) {
      case 'search':
        final q = '${params['query'] ?? ''}'.trim();
        open(CareersScreen(initialSearch: q.isEmpty ? null : q, initialAi: q.isNotEmpty));
      case 'open_career':
        if (id.isEmpty) return false;
        open(CareerDetailScreen(careerId: id, title: '${params['name'] ?? ''}'));
      case 'open_cluster':
        open(CareersScreen(clusterId: id.isEmpty ? null : id));
      case 'start_quiz':
        tab(1);
      case 'go_home':
        tab(0);
      case 'open_universities':
        if (id.isNotEmpty) {
          open(UniversityDetailScreen(universityId: id, title: '${params['name'] ?? ''}'));
        } else {
          tab(3);
        }
      case 'nearest_universities':
        tab(3);
      case 'set_language':
        final lang = '${params['lang'] ?? ''}';
        nav.pop();
        appSettings.setLang(lang);
      // Ин саҳифаҳо дар барнома ҳанӯз нестанд — дар сайт кушода мешаванд.
      case 'compare':
        web('/dashboard/compare');
      case 'open_report':
        web('/dashboard/ai-advisor');
      case 'open_plan':
        web('/dashboard/plan');
      case 'open_chat':
        web('/dashboard/ai-chat');
      case 'open_favorites':
        web('/favorites');
      case 'open_about':
        web('/about');
      case 'open_page':
        final path = '${params['path'] ?? ''}';
        if (path != '/swipe' && path != '/trial') return false;
        web(path);
      default:
        return false;
    }
    return true;
  }

  void _pickOption(Map<String, dynamic> o) {
    final id = '${o['id'] ?? ''}';
    final name = '${o['label'] ?? o['name'] ?? ''}';
    if (_state == _State.speaking) _player.stop();
    if (_optionsKind == 'choose_direction' && id.isNotEmpty) {
      Navigator.of(context).pushReplacement(smoothRoute(CareerDetailScreen(careerId: id, title: name)));
    } else if (_optionsKind == 'choose_university' && id.isNotEmpty) {
      Navigator.of(context).pushReplacement(smoothRoute(UniversityDetailScreen(universityId: id, title: name)));
    } else {
      _send(name);
    }
  }

  String get _status => switch (_state) {
    _State.idle => t('Барои гап задан пахш кунед'),
    _State.listening => t('Гӯш мекунам… гап занед'),
    _State.thinking => t('Фикр мекунам…'),
    _State.speaking => t('Гап мезанам — пахш кунед, то қатъ шавад'),
  };

  @override
  Widget build(BuildContext context) {
    final suggestions = [t('Кадом ихтисос ба ман мувофиқ аст?'), t('Донишгоҳҳои Душанберо нишон деҳ'), t('Тестро сар кун')];
    return Scaffold(
      appBar: AppBar(
        title: Text(t('Ёвари овозӣ')),
        actions: [
          IconButton(
            tooltip: _muted ? t('Садоро фаъол кунед') : t('Бе садо'),
            onPressed: () {
              if (!_muted) _player.stop();
              setState(() => _muted = !_muted);
            },
            icon: Icon(_muted ? Icons.volume_off_rounded : Icons.volume_up_rounded, color: AppColors.textSoft),
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(
              child: _turns.isEmpty
                  ? Center(
                      child: SingleChildScrollView(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          children: [
                            Text(
                              t('Чӣ мехоҳед бидонед?'),
                              textAlign: TextAlign.center,
                              style: TextStyle(fontFamily: AppFonts.display, fontSize: 23, fontWeight: FontWeight.w700, color: AppColors.text),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              t('Гап занед ё яке аз инҳоро интихоб кунед'),
                              textAlign: TextAlign.center,
                              style: TextStyle(fontSize: 14, color: AppColors.textSoft),
                            ),
                            const SizedBox(height: 18),
                            for (final s in suggestions) _Choice(text: s, onTap: () => _send(s)),
                          ],
                        ),
                      ),
                    )
                  : ListView(
                      controller: _scroll,
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                      children: [
                        for (final m in _turns) _Bubble(text: m.text, mine: m.mine),
                        for (final o in _options) _Choice(text: '${o['label'] ?? o['name'] ?? ''}', onTap: () => _pickOption(o)),
                      ],
                    ),
            ),
            if (_notice != null)
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
                child: Text(
                  _notice!,
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: AppColors.danger),
                ),
              ),
            Text(
              _status,
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13.5, color: AppColors.textSoft),
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 112,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _SideButton(
                    tooltip: t('Матн нависед'),
                    icon: _typing ? Icons.keyboard_hide_rounded : Icons.keyboard_rounded,
                    onTap: () {
                      if (_state == _State.listening) _mic.cancel();
                      setState(() => _typing = !_typing);
                    },
                  ),
                  const SizedBox(width: 22),
                  _MicOrb(state: _state, level: _level, pulse: _pulse, onTap: _onMic),
                  const SizedBox(width: 22),
                  _SideButton(tooltip: t('Пӯшидан'), icon: Icons.close_rounded, onTap: () => Navigator.of(context).maybePop()),
                ],
              ),
            ),
            if (_typing)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _input,
                        maxLength: 500,
                        textInputAction: TextInputAction.send,
                        onSubmitted: _send,
                        style: TextStyle(fontSize: 14.5, color: AppColors.text),
                        decoration: InputDecoration(counterText: '', isDense: true, hintText: t('Саволи худро нависед…'), contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12)),
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton.filled(
                      tooltip: t('Фиристодан'),
                      style: IconButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white, minimumSize: const Size(46, 46)),
                      onPressed: () => _send(_input.text),
                      icon: const Icon(Icons.send_rounded, size: 19),
                    ),
                  ],
                ),
              ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}

class _Bubble extends StatelessWidget {
  const _Bubble({required this.text, required this.mine});
  final String text;
  final bool mine;

  @override
  Widget build(BuildContext context) => Align(
    alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
    child: Container(
      margin: const EdgeInsets.only(bottom: 8),
      constraints: BoxConstraints(maxWidth: MediaQuery.sizeOf(context).width * 0.8),
      padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 10),
      decoration: BoxDecoration(
        color: mine ? AppColors.primary : AppColors.muted,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(mine ? 16 : 4),
          topRight: Radius.circular(mine ? 4 : 16),
          bottomLeft: const Radius.circular(16),
          bottomRight: const Radius.circular(16),
        ),
      ),
      child: Text(text, style: TextStyle(fontSize: 15, height: 1.42, color: mine ? Colors.white : AppColors.text)),
    ),
  );
}

class _Choice extends StatelessWidget {
  const _Choice({required this.text, required this.onTap});
  final String text;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Material(
      color: AppColors.contractSoft,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  text,
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.text),
                ),
              ),
              Icon(Icons.chevron_right_rounded, size: 19, color: AppColors.primary),
            ],
          ),
        ),
      ),
    ),
  );
}

class _SideButton extends StatelessWidget {
  const _SideButton({required this.tooltip, required this.icon, required this.onTap});
  final String tooltip;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => IconButton.filledTonal(
    tooltip: tooltip,
    style: IconButton.styleFrom(backgroundColor: AppColors.muted, foregroundColor: AppColors.text, minimumSize: const Size(50, 50)),
    onPressed: onTap,
    icon: Icon(icon, size: 22),
  );
}

// Доираи асосӣ: ҳангоми гӯш кардан аз баландии садо меҷунбад, ҳангоми гап задан нарм нафас мекашад.
class _MicOrb extends StatelessWidget {
  const _MicOrb({required this.state, required this.level, required this.pulse, required this.onTap});
  final _State state;
  final double level;
  final Animation<double> pulse;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final icon = switch (state) {
      _State.idle => Icons.mic_rounded,
      _State.listening => Icons.stop_rounded,
      _State.thinking => Icons.more_horiz_rounded,
      _State.speaking => Icons.graphic_eq_rounded,
    };
    return Semantics(
      button: true,
      label: t('Микрофон'),
      child: GestureDetector(
        onTap: onTap,
        child: SizedBox(
          width: 112,
          height: 112,
          child: AnimatedBuilder(
            animation: pulse,
            builder: (context, child) {
              final breathing = state == _State.speaking || state == _State.thinking ? pulse.value * 0.35 : 0.0;
              final grow = state == _State.listening ? math.max(level, 0.12) : breathing;
              return Stack(
                alignment: Alignment.center,
                children: [
                  if (state != _State.idle)
                    Container(
                      width: 78 + 34 * grow,
                      height: 78 + 34 * grow,
                      decoration: BoxDecoration(shape: BoxShape.circle, color: AppColors.primary.withValues(alpha: 0.2)),
                    ),
                  child!,
                ],
              );
            },
            child: Container(
              width: 76,
              height: 76,
              decoration: BoxDecoration(shape: BoxShape.circle, gradient: AppColors.brandGradient),
              child: Icon(icon, size: 34, color: Colors.white),
            ),
          ),
        ),
      ),
    );
  }
}

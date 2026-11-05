import 'dart:math';

import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../api/api.dart';
import '../api/models.dart';
import '../app/clusters.dart';
import '../app/settings.dart';
import '../app/theme.dart';
import '../app/web_texts.dart';
import '../ui/widgets.dart';
import 'careers_screen.dart';

// «Касб-свайп» (мисли /swipe-и сайт): 30 сурати кор, ба рост — маъқул, ба чап — не.
// Кортҳо ва матнҳо аз сайт (web_texts.dart), суратҳо аз худи сайт бор мешаванд.

const _site = 'https://ikhtisosiman.qobus.tj';
const _deckSize = 30;
const _seenKey = 'swipe_seen_v1';
const _shownKey = 'swipe_shown_v1';

String _sx(String key, [Map<String, Object?> vars = const {}]) {
  final value = (swipeTexts[appSettings.lang] ?? swipeTexts['tj'])[key] ?? swipeTexts['tj'][key] ?? '';
  return vars.entries.fold('$value', (text, e) => text.replaceAll('{{${e.key}}}', '${e.value}'));
}

List<Map<String, dynamic>> get _cards => [for (final c in swipeData['cards'] as List) Map<String, dynamic>.from(c)];
String _cardText(Map<String, dynamic> card) => '${(card['text'] as Map)[appSettings.lang] ?? (card['text'] as Map)['tj']}';
String _traitName(String key) => '${((swipeData['traits'] as Map)[key] as Map?)?[appSettings.lang] ?? key}';
String _mainCluster(Map<String, dynamic> card) => (Map<String, dynamic>.from(card['c']).entries.toList()..sort((a, b) => (b.value as num).compareTo(a.value as num))).first.key;

String _fold(String value) => value.toLowerCase().replaceAllMapped(RegExp('[ғӣқӯҳҷё]'), (m) => const {'ғ': 'г', 'ӣ': 'и', 'қ': 'к', 'ӯ': 'у', 'ҳ': 'х', 'ҷ': 'ч', 'ё': 'е'}[m[0]]!);
bool _nameHas(String name, String stem) => RegExp('(^|[^а-яёa-z])${_fold(stem).replaceAll(RegExp('[^а-яёa-z0-9]'), '')}').hasMatch(_fold(name));

class SwipeScreen extends StatefulWidget {
  const SwipeScreen({super.key, this.onFullTest});
  final VoidCallback? onFullTest;

  @override
  State<SwipeScreen> createState() => _SwipeScreenState();
}

class _SwipeScreenState extends State<SwipeScreen> {
  final _random = Random();
  List<Map<String, dynamic>> _deck = const [];
  final List<bool> _choices = [];
  double _dx = 0;
  bool _started = false;
  List<(Career, String?)>? _careers;

  bool get _done => _deck.isNotEmpty && _choices.length >= _deck.length;

  // Бозии нав: 30 корти нодида, аз ҳар самт баробар (мисли nextDeck-и сайт).
  Future<void> _newDeck() async {
    final prefs = await SharedPreferences.getInstance();
    var seen = prefs.getStringList(_seenKey) ?? <String>[];
    var pool = _cards.where((c) => !seen.contains(c['id'])).toList();
    if (pool.length < _deckSize) {
      seen = [];
      pool = _cards.toList();
    }
    pool.shuffle(_random);
    final byCluster = <String, List<Map<String, dynamic>>>{};
    for (final card in pool) {
      byCluster.putIfAbsent(_mainCluster(card), () => []).add(card);
    }
    final deck = <Map<String, dynamic>>[];
    for (final list in byCluster.values) {
      deck.addAll(list.take(_deckSize ~/ 5));
    }
    final rest = pool.where((c) => !deck.contains(c)).toList();
    while (deck.length < _deckSize && rest.isNotEmpty) {
      deck.add(rest.removeAt(0));
    }
    deck.shuffle(_random);
    await prefs.setStringList(_seenKey, [...seen, ...deck.map((c) => '${c['id']}')]);
    setState(() {
      _deck = deck;
      _choices.clear();
      _careers = null;
      _started = true;
      _dx = 0;
    });
  }

  void _decide(bool like) {
    if (_done) return;
    setState(() {
      _choices.add(like);
      _dx = 0;
    });
    if (_done) _loadCareers();
  }

  void _undo() {
    if (_choices.isEmpty) return;
    setState(() => _choices.removeLast());
  }

  Map<String, dynamic> _summary() {
    final traits = <String, int>{for (final k in (swipeData['traits'] as Map).keys) '$k': 0};
    final clusters = <String, num>{'c1': 0, 'c2': 0, 'c3': 0, 'c4': 0, 'c5': 0};
    for (var i = 0; i < _choices.length; i++) {
      final card = _deck[i];
      for (final trait in card['traits'] as List) {
        traits['$trait'] = (traits['$trait'] ?? 0) + (_choices[i] ? 1 : -1);
      }
      if (_choices[i]) {
        for (final e in (card['c'] as Map).entries) {
          clusters['${e.key}'] = (clusters['${e.key}'] ?? 0) + (e.value as num);
        }
      }
    }
    final ranked = traits.entries.toList()..sort((a, b) => b.value.compareTo(a.value));
    final top = clusters.entries.toList()..sort((a, b) => b.value.compareTo(a.value));
    return {
      'likes': ranked.where((e) => e.value > 0).take(3).map((e) => e.key).toList(),
      'dislikes': ranked.reversed.where((e) => e.value < 0).take(2).map((e) => e.key).toList(),
      'cluster': top.first.value > 0 ? int.parse(top.first.key.substring(1)) : null,
    };
  }

  // Ихтисосҳо аз калимаҳои суратҳои маъқул (мисли careersFromLikes-и сайт).
  Future<void> _loadCareers() async {
    final liked = [
      for (var i = 0; i < _choices.length; i++)
        if (_choices[i]) _deck[i],
    ];
    final weights = <String, int>{};
    for (final card in liked) {
      for (final stem in card['kw'] as List) {
        weights['$stem'] = (weights['$stem'] ?? 0) + 1;
      }
    }
    final stems = (weights.entries.toList()..sort((a, b) => b.value.compareTo(a.value))).take(6).map((e) => e.key).toList();
    if (stems.isEmpty) {
      setState(() => _careers = const []);
      return;
    }
    final prefs = await SharedPreferences.getInstance();
    final shown = prefs.getStringList(_shownKey) ?? const <String>[];
    final cluster = _summary()['cluster'];
    final lists = await Future.wait([
      for (final stem in stems)
        Api.instance
            .get('/careers', {'searchAny': stem, 'limit': '6', 'lang': appSettings.lang})
            .then((d) => [for (final c in d['data'] as List) Career.fromJson(Map<String, dynamic>.from(c))])
            .catchError((_) => <Career>[]),
    ]);
    final byName = <String, (Career, double, String?)>{};
    for (final career in lists.expand((l) => l)) {
      final key = career.name.replaceAll(RegExp(r'\s*\(.*$'), '').trim();
      if (key.isEmpty || byName.containsKey(key)) continue;
      final score =
          weights.entries.fold<double>(0, (sum, e) => sum + (_nameHas(career.name, e.key) ? e.value : 0)) +
          (cluster != null && career.clusterNumber == cluster ? 1.5 : 0) +
          _random.nextDouble() * 0.8 -
          (shown.contains(key) ? 2 : 0);
      final reason = (liked.map((card) => (card, (card['kw'] as List).where((stem) => _nameHas(career.name, '$stem')).length)).toList()..sort((a, b) => b.$2.compareTo(a.$2))).firstOrNull;
      byName[key] = (career, score, reason != null && reason.$2 > 0 ? _cardText(reason.$1) : null);
    }
    final picked = (byName.values.toList()..sort((a, b) => b.$2.compareTo(a.$2))).take(6).toList();
    await prefs.setStringList(_shownKey, [for (final p in picked) p.$1.name.replaceAll(RegExp(r'\s*\(.*$'), '').trim()]);
    if (mounted) setState(() => _careers = [for (final p in picked) (p.$1, p.$3)]);
  }

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return Scaffold(
      appBar: AppBar(title: Text(_sx('title'))),
      body: SafeArea(
        child: !_started
            ? ListView(
                padding: AppSizes.page,
                children: [
                  const SizedBox(height: 20),
                  Icon(Icons.swipe_rounded, size: 72, color: AppColors.primary),
                  const SizedBox(height: 16),
                  Text(_sx('title'), textAlign: TextAlign.center, style: text.headlineMedium),
                  const SizedBox(height: 10),
                  Text(_sx('subtitle'), textAlign: TextAlign.center, style: text.bodyLarge),
                  const SizedBox(height: 24),
                  FilledButton(onPressed: _newDeck, child: Text(_sx('start'))),
                  const SizedBox(height: 12),
                  Text(
                    _sx('disclaimer'),
                    textAlign: TextAlign.center,
                    style: text.bodySmall?.copyWith(color: AppColors.textSoft),
                  ),
                ],
              )
            : _done
            ? _result(text)
            : _game(text),
      ),
    );
  }

  Widget _game(TextTheme text) {
    final card = _deck[_choices.length];
    final next = _choices.length + 1 < _deck.length ? _deck[_choices.length + 1] : null;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      child: Column(
        children: [
          Text(_sx('of', {'n': _choices.length + 1, 't': _deck.length}), style: text.titleMedium?.copyWith(color: AppColors.primary)),
          const SizedBox(height: 8),
          Expanded(
            child: Stack(
              children: [
                if (next != null)
                  Positioned.fill(
                    child: Transform.scale(scale: 0.95, child: _CardView(card: next)),
                  ),
                Positioned.fill(
                  child: GestureDetector(
                    onHorizontalDragUpdate: (d) => setState(() => _dx += d.delta.dx),
                    onHorizontalDragEnd: (_) => _dx.abs() > 110 ? _decide(_dx > 0) : setState(() => _dx = 0),
                    child: Transform.translate(
                      offset: Offset(_dx, 0),
                      child: Transform.rotate(
                        angle: _dx / 900,
                        child: _CardView(card: card, like: (_dx / 110).clamp(0, 1).toDouble(), nope: (-_dx / 110).clamp(0, 1).toDouble()),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          Text(_sx('hint'), style: text.bodySmall?.copyWith(color: AppColors.textSoft)),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(onPressed: () => _decide(false), icon: const Icon(Icons.close_rounded), label: Text(_sx('nopeBtn'))),
              ),
              const SizedBox(width: 8),
              IconButton(tooltip: _sx('undo'), onPressed: _choices.isEmpty ? null : _undo, icon: const Icon(Icons.undo_rounded)),
              const SizedBox(width: 8),
              Expanded(
                child: FilledButton.icon(onPressed: () => _decide(true), icon: const Icon(Icons.favorite_rounded), label: Text(_sx('likeBtn'))),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _result(TextTheme text) {
    final s = _summary();
    final likes = [for (final k in s['likes'] as List) _traitName('$k')];
    final dislikes = [for (final k in s['dislikes'] as List) _traitName('$k')];
    final cluster = s['cluster'] as int?;
    final info = cluster == null ? null : clusters.firstWhere((c) => c.number == cluster);
    return ListView(
      padding: AppSizes.page,
      children: [
        if (likes.isEmpty)
          AppCard(child: Text(_sx('none'), style: text.bodyLarge))
        else ...[
          Text(_sx('resultTitle'), style: text.headlineSmall),
          const SizedBox(height: 8),
          for (final l in likes) Text('✓  $l', style: text.titleMedium?.copyWith(color: AppColors.primary)),
          if (dislikes.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(_sx('notLiked'), style: text.titleMedium),
            for (final d in dislikes) Text('–  $d', style: text.bodyLarge?.copyWith(color: AppColors.textSoft)),
          ],
        ],
        if (info != null) ...[SectionTitle(_sx('direction')), AppCard(child: Text(info.name[appSettings.lang] ?? info.name['tj'] ?? '', style: text.titleMedium))],
        SectionTitle(_sx('careers')),
        if (_careers == null)
          const Center(
            child: Padding(padding: EdgeInsets.all(16), child: CircularProgressIndicator()),
          )
        else
          for (final (career, because) in _careers!) ...[
            CareerCard(career: career),
            if (because != null)
              Padding(
                padding: const EdgeInsets.fromLTRB(4, 4, 4, 0),
                child: Text(_sx('because', {'a': because}), style: text.bodySmall?.copyWith(color: AppColors.textSoft)),
              ),
            const SizedBox(height: 10),
          ],
        const SizedBox(height: 8),
        Text(_sx('disclaimer'), style: text.bodySmall?.copyWith(color: AppColors.textSoft)),
        const SizedBox(height: 12),
        if (likes.isNotEmpty) ...[
          OutlinedButton.icon(
            onPressed: () => SharePlus.instance.share(ShareParams(text: '${_sx('shareText', {'a': likes.first.toLowerCase()})} $_site/swipe')),
            icon: const Icon(Icons.ios_share_rounded),
            label: Text(_sx('share')),
          ),
          const SizedBox(height: 8),
        ],
        OutlinedButton.icon(onPressed: _newDeck, icon: const Icon(Icons.refresh_rounded), label: Text(_sx('again'))),
        if (widget.onFullTest != null) ...[const SizedBox(height: 8), FilledButton(onPressed: widget.onFullTest, child: Text(_sx('fullTest')))],
      ],
    );
  }
}

class _CardView extends StatelessWidget {
  const _CardView({required this.card, this.like = 0, this.nope = 0});
  final Map<String, dynamic> card;
  final double like;
  final double nope;

  @override
  Widget build(BuildContext context) => ClipRRect(
    borderRadius: BorderRadius.circular(28),
    child: Stack(
      fit: StackFit.expand,
      children: [
        Container(color: AppColors.muted),
        Image.network('$_site/swipe/${card['id']}.webp', fit: BoxFit.cover, errorBuilder: (_, _, _) => const SizedBox.shrink()),
        const DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Colors.transparent, Color(0xCC000000)], stops: [0.45, 1]),
          ),
        ),
        Positioned(
          left: 20,
          right: 20,
          bottom: 22,
          child: Text(
            _cardText(card),
            style: const TextStyle(fontSize: 23, fontWeight: FontWeight.w800, color: Colors.white, height: 1.2),
          ),
        ),
        if (like > 0)
          Positioned(
            left: 20,
            top: 24,
            child: Opacity(
              opacity: like,
              child: _Stamp(text: _sx('like'), color: AppColors.primary),
            ),
          ),
        if (nope > 0)
          Positioned(
            right: 20,
            top: 24,
            child: Opacity(
              opacity: nope,
              child: _Stamp(text: _sx('nope'), color: Colors.white),
            ),
          ),
      ],
    ),
  );
}

class _Stamp extends StatelessWidget {
  const _Stamp({required this.text, required this.color});
  final String text;
  final Color color;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
    decoration: BoxDecoration(
      border: Border.all(color: color, width: 4),
      borderRadius: BorderRadius.circular(12),
    ),
    child: Text(
      text,
      style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: color, letterSpacing: 1.5),
    ),
  );
}

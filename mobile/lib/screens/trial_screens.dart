import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../api/api.dart';
import '../api/models.dart';
import '../app/i18n.dart';
import '../app/settings.dart';
import '../app/theme.dart';
import '../app/web_texts.dart';
import '../ui/widgets.dart';
import 'career_detail_screen.dart';
import 'share_card.dart';

// «Худро дар касб санҷед» (мисли /trial ва /trial/... -и сайт): матнҳо аз сайт (web_texts.dart).

String tx(String key, [Map<String, Object?> vars = const {}]) {
  final value = (trialTexts[appSettings.lang] ?? trialTexts['tj'])[key] ?? trialTexts['tj'][key] ?? '';
  return vars.entries.fold('$value', (text, e) => text.replaceAll('{{${e.key}}}', '${e.value}'));
}

List<dynamic> txList(String key) => ((trialTexts[appSettings.lang] ?? trialTexts['tj'])[key] as List?) ?? const [];

const _historyKey = 'trial_history_v1';

Future<List<Map<String, dynamic>>> trialHistory() async {
  final prefs = await SharedPreferences.getInstance();
  try {
    return [for (final item in jsonDecode(prefs.getString(_historyKey) ?? '[]') as List) Map<String, dynamic>.from(item)];
  } catch (_) {
    return [];
  }
}

Future<void> _saveHistory(Map<String, dynamic> entry) async {
  final list = (await trialHistory()).where((item) => item['key'] != entry['key']).toList()..insert(0, entry);
  final prefs = await SharedPreferences.getInstance();
  await prefs.setString(_historyKey, jsonEncode(list.take(20).toList()));
}

// ───────────── Рӯйхат ─────────────
class TrialHubScreen extends StatefulWidget {
  const TrialHubScreen({super.key});

  @override
  State<TrialHubScreen> createState() => _TrialHubScreenState();
}

class _TrialHubScreenState extends State<TrialHubScreen> {
  List<Map<String, dynamic>> _scenarios = const [];
  List<Map<String, dynamic>> _history = const [];
  List<Career>? _found;
  bool _failed = false;
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }

  Future<void> _load() async {
    final history = await trialHistory();
    if (mounted) setState(() => _history = history);
    try {
      final data = await Api.instance.get('/trial', {'lang': appSettings.lang});
      if (mounted) setState(() => _scenarios = [for (final s in (data['scenarios'] as List? ?? const [])) Map<String, dynamic>.from(s)]);
    } catch (_) {
      if (mounted) setState(() => _failed = true);
    }
  }

  void _search(String query) {
    _debounce?.cancel();
    if (query.trim().length < 2) {
      setState(() => _found = null);
      return;
    }
    _debounce = Timer(const Duration(milliseconds: 300), () async {
      try {
        final data = await Api.instance.get('/careers', {'search': query.trim(), 'limit': '8', 'lang': appSettings.lang});
        if (mounted) setState(() => _found = [for (final c in (data['data'] as List)) Career.fromJson(Map<String, dynamic>.from(c))]);
      } catch (_) {
        if (mounted) setState(() => _found = const []);
      }
    });
  }

  Future<void> _open(Widget page) async {
    await Navigator.of(context).push(smoothRoute(page));
    _load();
  }

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return Scaffold(
      appBar: AppBar(title: Text(tx('name'))),
      body: SafeArea(
        child: ListView(
          padding: AppSizes.page,
          children: [
            Text(tx('tagline'), style: text.titleMedium?.copyWith(color: AppColors.primary)),
            const SizedBox(height: 6),
            Text(tx('hubIntro'), style: text.bodyLarge),
            if (_history.length >= 2) ...[SectionTitle(t('Касбҳои санҷидашуда')), _TrialCompareCard(history: _history)],
            SectionTitle(tx('searchTitle')),
            Text(tx('searchHint'), style: text.bodyMedium),
            const SizedBox(height: 10),
            TextField(
              onChanged: _search,
              decoration: InputDecoration(hintText: tx('searchPlaceholder'), prefixIcon: const Icon(Icons.search_rounded)),
            ),
            if (_found != null) ...[
              const SizedBox(height: 8),
              if (_found!.isEmpty) Text(tx('noResults'), style: text.bodyMedium),
              for (final career in _found!) ...[
                AppCard(
                  onTap: () => _open(TrialPlayScreen(careerId: career.id, title: career.name)),
                  child: Row(
                    children: [
                      Expanded(child: Text(career.name, style: text.titleMedium)),
                      Icon(Icons.chevron_right_rounded, color: AppColors.textSoft),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
              ],
            ],
            SectionTitle(tx('samplesTitle')),
            if (_failed) AppCard(child: Text(tx('loadError'), style: text.bodyMedium)),
            for (final s in _scenarios) ...[
              AppCard(
                onTap: () => _open(TrialPlayScreen(family: '${s['family']}', title: '${s['familyName'] ?? s['role'] ?? ''}')),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${s['familyName'] ?? ''}',
                      style: text.bodyMedium?.copyWith(color: AppColors.primary, fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 4),
                    Text('${s['role'] ?? ''}', style: text.titleMedium),
                    const SizedBox(height: 4),
                    Text('${s['place'] ?? ''} · ${tx('minutes', {'n': s['minutes'] ?? 10})}', style: text.bodyMedium?.copyWith(color: AppColors.textSoft)),
                  ],
                ),
              ),
              const SizedBox(height: 10),
            ],
          ],
        ),
      ),
    );
  }
}

// Муқоисаи касбҳои санҷидашуда (аз таърихи ҳамин телефон).
class _TrialCompareCard extends StatelessWidget {
  const _TrialCompareCard({required this.history});
  final List<Map<String, dynamic>> history;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final rating = txList('rating');
    return AppCard(
      child: Column(
        children: [
          for (final h in history.take(5))
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 6),
              child: Row(
                children: [
                  Expanded(child: Text(cleanName('${h['name'] ?? ''}'), style: text.titleMedium)),
                  const SizedBox(width: 8),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text('${h['solved']}/${h['total']} · ${tx('likedOf', {'n': h['liked'], 'total': h['total']})}', style: text.bodySmall),
                      Text(
                        '${h['rating'] is int && (h['rating'] as int) >= 1 && (h['rating'] as int) <= rating.length ? rating[(h['rating'] as int) - 1] : ''} · ${h['fit'] == true ? tx('fitGood') : tx('fitOther')}',
                        style: text.bodySmall?.copyWith(color: h['fit'] == true ? AppColors.primary : AppColors.textSoft, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

// ───────────── Бозӣ: муқаддима → вазифаҳо → баҳо → хулоса ─────────────
class TrialPlayScreen extends StatefulWidget {
  const TrialPlayScreen({super.key, this.careerId, this.family, required this.title});
  final String? careerId;
  final String? family;
  final String title;

  @override
  State<TrialPlayScreen> createState() => _TrialPlayScreenState();
}

class _TrialPlayScreenState extends State<TrialPlayScreen> {
  Map<String, dynamic>? _scenario;
  bool _failed = false;
  String _stage = 'intro';
  int _index = 0;
  int? _confBefore;
  int? _confAfter;
  int? _rating;
  final Map<String, dynamic> _answers = {};
  final Map<String, Map<String, dynamic>> _checks = {};
  final Map<String, bool> _liked = {};
  Map<String, dynamic>? _summary;
  bool _busy = false;

  String get _base => widget.careerId != null ? '/trial/career/${widget.careerId}' : '/trial/${widget.family}';
  List<Map<String, dynamic>> get _tasks => [for (final t in (_scenario?['tasks'] as List? ?? const [])) Map<String, dynamic>.from(t)];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _failed = false);
    try {
      final data = await Api.instance.get(_base, {'lang': appSettings.lang}, const Duration(seconds: 60));
      if (mounted) setState(() => _scenario = Map<String, dynamic>.from(data));
    } catch (_) {
      if (mounted) setState(() => _failed = true);
    }
  }

  Future<void> _check(Map<String, dynamic> task) async {
    setState(() => _busy = true);
    try {
      final data = await Api.instance.post('$_base/check', {'taskId': task['id'], 'answer': _answers[task['id']], 'lang': appSettings.lang});
      setState(() => _checks['${task['id']}'] = Map<String, dynamic>.from(data));
    } catch (_) {
      _snack(tx('actionError'));
    }
    if (mounted) setState(() => _busy = false);
  }

  void _like(Map<String, dynamic> task, bool value) {
    setState(() {
      _liked['${task['id']}'] = value;
      if (_index < _tasks.length - 1) {
        _index++;
      } else {
        _stage = 'end';
      }
    });
  }

  Future<void> _finish() async {
    setState(() => _busy = true);
    try {
      final data = Map<String, dynamic>.from(
        await Api.instance.post('$_base/finish', {
          if (widget.careerId != null) 'careerId': widget.careerId,
          'lang': appSettings.lang,
          'rating': _rating,
          'confBefore': _confBefore,
          'confAfter': _confAfter,
          'tasks': [
            for (final task in _tasks) {'id': task['id'], 'answer': _answers[task['id']], 'liked': _liked[task['id']] == true},
          ],
        }),
      );
      final tasks = data['tasks'] as List? ?? const [];
      await _saveHistory({
        'key': widget.careerId ?? widget.family,
        'careerId': widget.careerId,
        'family': widget.family,
        'name': (data['career'] is Map ? data['career']['name'] : null) ?? data['role'] ?? widget.title,
        'solved': data['solved'],
        'total': data['total'],
        'liked': tasks.where((t) => t is Map && t['liked'] == true).length,
        'rating': data['rating'],
        'fit': data['suggestOther'] != true,
      });
      setState(() {
        _summary = data;
        _stage = 'result';
      });
    } catch (_) {
      _snack(tx('actionError'));
    }
    if (mounted) setState(() => _busy = false);
  }

  void _snack(String message) {
    if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    Widget body;
    if (_failed) {
      body = ListView(
        padding: AppSizes.page,
        children: [
          AppCard(child: Text(tx('loadError'), style: text.bodyLarge)),
          const SizedBox(height: 10),
          OutlinedButton(onPressed: _load, child: Text(tx('retry'))),
        ],
      );
    } else if (_scenario == null) {
      body = const Center(child: CircularProgressIndicator());
    } else {
      // Ҳар вазифа ва ҳар марҳила аз боло сар мешавад.
      body = ListView(
        key: ValueKey('$_stage-$_index'),
        padding: AppSizes.page,
        children: switch (_stage) {
          'intro' => _intro(text),
          'task' => _task(text),
          'end' => _end(text),
          _ => _result(text),
        },
      );
    }
    final total = _tasks.length;
    final progress = _stage == 'intro' ? 0.0 : (_stage == 'task' && total > 0 ? (_index + (_checks.containsKey('${_tasks[_index]['id']}') ? 0.5 : 0)) / total : 1.0);
    return Scaffold(
      appBar: AppBar(
        title: Text(cleanName(widget.title), maxLines: 1, overflow: TextOverflow.ellipsis),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(4),
          child: LinearProgressIndicator(value: progress, minHeight: 4),
        ),
      ),
      body: SafeArea(child: body),
    );
  }

  Widget _scale(List<dynamic> labels, int? value, ValueChanged<int> onChanged) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      for (var i = 0; i < labels.length; i++) ...[_Option(label: '${labels[i]}', selected: value == i + 1, onTap: () => onChanged(i + 1)), const SizedBox(height: 8)],
    ],
  );

  List<Widget> _intro(TextTheme text) {
    final s = _scenario!;
    final tasks = _tasks;
    final hard = tasks.where((t) => t['skill'] != 'soft').length;
    return [
      Text('${s['role'] ?? ''}', style: text.headlineMedium),
      const SizedBox(height: 4),
      Text('${s['place'] ?? ''}', style: text.bodyMedium?.copyWith(color: AppColors.textSoft)),
      const SizedBox(height: 4),
      Text(
        tx('quickInfo', {'n': tasks.length, 'm': s['minutes'] ?? 10}),
        style: text.bodyMedium?.copyWith(color: AppColors.primary, fontWeight: FontWeight.w600),
      ),
      const SizedBox(height: 14),
      Text('${s['intro'] ?? ''}', style: text.bodyLarge),
      const SizedBox(height: 10),
      Text('${tx('hardCount', {'n': hard})} · ${tx('softCount', {'n': tasks.length - hard})}', style: text.bodyMedium),
      const SizedBox(height: 10),
      Text(s['generated'] == true ? tx('aiNote') : tx('simplified'), style: TextStyle(fontSize: 13.5, color: AppColors.textSoft)),
      SectionTitle(tx('confBefore')),
      _scale(txList('confScale'), _confBefore, (v) => setState(() => _confBefore = v)),
      const SizedBox(height: 8),
      FilledButton(onPressed: _confBefore == null || tasks.isEmpty ? null : () => setState(() => _stage = 'task'), child: Text(tx('start'))),
    ];
  }

  bool _ready(Map<String, dynamic> task) {
    final value = _answers[task['id']];
    return switch (task['kind']) {
      'number' => value != null && num.tryParse('$value') != null,
      'choice' => value != null,
      'multi' => value is List && value.length == (task['pick'] ?? 2),
      _ => value is List && value.length == (task['options'] as List).length,
    };
  }

  List<Widget> _task(TextTheme text) {
    final task = _tasks[_index];
    final id = '${task['id']}';
    final result = _checks[id];
    final kind = '${task['kind']}';
    final options = [for (final o in (task['options'] as List? ?? const [])) Map<String, dynamic>.from(o)];
    final value = _answers[id];
    final selected = kind == 'choice' ? (value == null ? const [] : [value]) : (value is List ? value : const []);
    final table = task['table'] is Map ? Map<String, dynamic>.from(task['table']) : null;
    return [
      Text(
        tx('task', {'n': _index + 1, 'total': _tasks.length}),
        style: text.bodyMedium?.copyWith(color: AppColors.primary, fontWeight: FontWeight.w600),
      ),
      Text(task['skill'] == 'soft' ? tx('soft') : tx('hard'), style: text.bodySmall?.copyWith(color: AppColors.textSoft)),
      const SizedBox(height: 6),
      Text('${task['title'] ?? ''}', style: text.headlineSmall),
      const SizedBox(height: 10),
      if ('${task['prompt'] ?? ''}'.isNotEmpty) Text('${task['prompt']}', style: text.bodyLarge),
      if ('${task['quote'] ?? ''}'.isNotEmpty) ...[
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            border: Border(left: BorderSide(color: AppColors.primary, width: 3)),
            color: AppColors.contractSoft,
          ),
          child: Text('${task['quote']}', style: text.bodyLarge?.copyWith(fontStyle: FontStyle.italic)),
        ),
      ],
      if ('${task['code'] ?? ''}'.isNotEmpty) ...[
        const SizedBox(height: 10),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: const Color(0xFF0F172A), borderRadius: BorderRadius.circular(12)),
          child: Text(
            '${task['code']}',
            style: const TextStyle(fontFamily: 'monospace', fontSize: 13.5, color: Color(0xFFE2E8F0)),
          ),
        ),
      ],
      if (table?['head'] is List) ...[
        const SizedBox(height: 10),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: DataTable(
            headingRowHeight: 40,
            columns: [
              for (final h in table!['head'] as List)
                DataColumn(
                  label: Text('$h', style: const TextStyle(fontWeight: FontWeight.w700)),
                ),
            ],
            rows: [
              for (final row in (table['rows'] as List? ?? const [])) DataRow(cells: [for (final cell in row as List) DataCell(Text('$cell'))]),
            ],
          ),
        ),
      ],
      const SizedBox(height: 12),
      Text('${task['question'] ?? ''}', style: text.titleMedium),
      if (result == null && kind == 'multi') Text(tx('pickN', {'n': task['pick'] ?? 2}), style: text.bodySmall?.copyWith(color: AppColors.textSoft)),
      if (result == null && kind == 'order') Text(tx('orderHint'), style: text.bodySmall?.copyWith(color: AppColors.textSoft)),
      const SizedBox(height: 10),
      if (kind == 'number')
        TextField(
          enabled: result == null,
          keyboardType: const TextInputType.numberWithOptions(decimal: true, signed: true),
          decoration: InputDecoration(hintText: tx('yourNumber')),
          onChanged: (v) => setState(() => _answers[id] = v.trim().isEmpty ? null : num.tryParse(v.trim().replaceAll(',', '.'))),
        )
      else
        for (final option in options) ...[
          _Option(
            label: '${option['text']}',
            leading: kind == 'order' ? (selected.contains(option['id']) ? '${selected.indexOf(option['id']) + 1}' : '·') : '${option['id']}'.toUpperCase(),
            selected: selected.contains(option['id']),
            onTap: result != null
                ? null
                : () => setState(() {
                    final optionId = option['id'];
                    if (kind == 'choice') {
                      _answers[id] = optionId;
                    } else {
                      final list = [...selected];
                      if (list.contains(optionId)) {
                        list.remove(optionId);
                      } else if (kind != 'multi' || list.length < (task['pick'] ?? 2)) {
                        list.add(optionId);
                      }
                      _answers[id] = list;
                    }
                  }),
          ),
          const SizedBox(height: 8),
        ],
      const SizedBox(height: 8),
      if (result == null)
        FilledButton(onPressed: !_ready(task) || _busy ? null : () => _check(task), child: Text(tx('check')))
      else ...[
        _Feedback(task: task, result: result, index: _index),
        SectionTitle(tx('liked')),
        FilledButton(onPressed: () => _like(task, true), child: Text(tx('likeYes'))),
        const SizedBox(height: 8),
        OutlinedButton(onPressed: () => _like(task, false), child: Text(tx('likeNo'))),
      ],
    ];
  }

  List<Widget> _end(TextTheme text) {
    final reality = [for (final r in (_scenario?['reality'] as List? ?? const [])) '$r'];
    return [
      if (reality.isNotEmpty) ...[SectionTitle(tx('realityTitle')), AppCard(child: _Bullets(reality))],
      SectionTitle(tx('confAfter')),
      _scale(txList('confScale'), _confAfter, (v) => setState(() => _confAfter = v)),
      SectionTitle(tx('ratingQ')),
      _scale(txList('rating'), _rating, (v) => setState(() => _rating = v)),
      const SizedBox(height: 8),
      FilledButton(onPressed: _rating == null || _confAfter == null || _busy ? null : _finish, child: Text(tx('seeResult'))),
    ];
  }

  List<Widget> _result(TextTheme text) {
    final s = _summary!;
    final tasks = [for (final t in (s['tasks'] as List? ?? const [])) Map<String, dynamic>.from(t)];
    final hard = tasks.where((t) => t['skill'] != 'soft').toList();
    final soft = tasks.where((t) => t['skill'] == 'soft').toList();
    double share(List<Map<String, dynamic>> list) => list.isEmpty ? 0 : list.where((t) => t['liked'] == true).length / list.length;
    final lean = (share(hard) - share(soft)).abs() < 0.2 ? tx('leanBoth') : (share(hard) > share(soft) ? tx('leanHard') : tx('leanSoft'));
    final scale = txList('confScale');
    String conf(dynamic v) => v is int && v >= 1 && v <= scale.length ? '${scale[v - 1]}' : '—';
    final verdicts = (trialTexts[appSettings.lang] ?? trialTexts['tj'])['verdict'] as Map? ?? const {};
    final name = cleanName('${(s['career'] is Map ? s['career']['name'] : null) ?? s['role'] ?? widget.title}');
    final career = s['career'] is Map ? Map<String, dynamic>.from(s['career']) : null;
    return [
      Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(AppSizes.radius + 4)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              s['suggestOther'] == true ? tx('fitOther') : tx('fitGood'),
              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: Colors.white),
            ),
            const SizedBox(height: 8),
            Text(tx('solved', {'n': s['solved'], 'total': s['total']}), style: const TextStyle(fontSize: 16, color: Colors.white)),
            const SizedBox(height: 4),
            Text(tx('confChange', {'a': conf(s['confBefore']), 'b': conf(s['confAfter'])}), style: const TextStyle(fontSize: 15, color: Colors.white)),
          ],
        ),
      ),
      const SizedBox(height: 10),
      OutlinedButton.icon(
        onPressed: () => showShareCard(
          context,
          ShareCardData.trial(
            title: name,
            fit: s['suggestOther'] != true,
            solved: s['solved'] is int ? s['solved'] as int : null,
            total: s['total'] is int ? s['total'] as int : null,
            confBefore: conf(s['confBefore']),
            confAfter: conf(s['confAfter']),
          ),
          '${tx('name')}: $name — ${tx('solved', {'n': s['solved'], 'total': s['total']})}.',
        ),
        icon: const Icon(Icons.ios_share_rounded),
        label: Text(t('Натиҷаро фиристед')),
      ),
      const SizedBox(height: 12),
      AppCard(child: Text(lean, style: text.bodyLarge)),
      if (s['suggestOther'] == true) ...[const SizedBox(height: 10), AppCard(child: Text(tx('suggestOtherCareer'), style: text.bodyLarge))],
      SectionTitle(tx('resultTitle')),
      for (final item in tasks) ...[
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('${item['title'] ?? ''}', style: text.titleMedium),
              const SizedBox(height: 4),
              Text('${verdicts[item['verdict']] ?? ''}', style: text.bodyMedium?.copyWith(color: AppColors.textSoft)),
            ],
          ),
        ),
        const SizedBox(height: 8),
      ],
      if (career != null && '${career['id'] ?? widget.careerId ?? ''}'.isNotEmpty) ...[
        const SizedBox(height: 8),
        OutlinedButton(
          onPressed: () => Navigator.of(context).push(smoothRoute(CareerDetailScreen(careerId: '${career['id'] ?? widget.careerId}', title: name))),
          child: Text(tx('fullPage')),
        ),
      ],
      const SizedBox(height: 8),
      TextButton(onPressed: () => Navigator.of(context).pop(), child: Text(tx('allScenarios'))),
    ];
  }
}

class _Option extends StatelessWidget {
  const _Option({required this.label, required this.selected, this.onTap, this.leading});
  final String label;
  final bool selected;
  final VoidCallback? onTap;
  final String? leading;

  @override
  Widget build(BuildContext context) => Material(
    color: selected ? AppColors.contractSoft : AppColors.card,
    borderRadius: BorderRadius.circular(AppSizes.radius),
    child: InkWell(
      borderRadius: BorderRadius.circular(AppSizes.radius),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(AppSizes.radius),
          border: Border.all(color: selected ? AppColors.primary : AppColors.border, width: selected ? 1.6 : 1),
        ),
        child: Row(
          children: [
            if (leading != null) ...[
              Container(
                width: 28,
                height: 28,
                alignment: Alignment.center,
                decoration: BoxDecoration(color: selected ? AppColors.primary : AppColors.contractSoft, shape: BoxShape.circle),
                child: Text(
                  leading!,
                  style: TextStyle(fontWeight: FontWeight.w700, color: selected ? Colors.white : AppColors.primary),
                ),
              ),
              const SizedBox(width: 12),
            ],
            Expanded(
              child: Text(label, style: TextStyle(fontSize: 15.5, height: 1.3, color: AppColors.text)),
            ),
          ],
        ),
      ),
    ),
  );
}

class _Bullets extends StatelessWidget {
  const _Bullets(this.items);
  final List<String> items;

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      for (final item in items)
        Padding(
          padding: const EdgeInsets.only(top: 6),
          child: Text('•  $item', style: Theme.of(context).textTheme.bodyLarge),
        ),
    ],
  );
}

class _Feedback extends StatelessWidget {
  const _Feedback({required this.task, required this.result, required this.index});
  final Map<String, dynamic> task;
  final Map<String, dynamic> result;
  final int index;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final solved = result['solved'] == true;
    final lines = txList(solved ? 'praise' : 'encourage');
    final line = lines.isEmpty ? const ['', ''] : lines[index % lines.length] as List;
    final options = {for (final o in (task['options'] as List? ?? const [])) '${(o as Map)['id']}': '${o['text']}'};
    final answer = result['answer'];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('${line[0]}', style: text.titleLarge?.copyWith(color: solved ? AppColors.primary : AppColors.text)),
              const SizedBox(height: 4),
              Text(task['kind'] == 'order' && solved && result['perfect'] != true ? tx('rightOrder') : '${line[1]}', style: text.bodyLarge),
              if (task['kind'] == 'order' && result['perfect'] != true && answer is List) ...[
                const SizedBox(height: 10),
                Text(tx('correctOrder'), style: text.titleMedium),
                for (var i = 0; i < answer.length; i++) Text('${i + 1}. ${options['${answer[i]}'] ?? ''}', style: text.bodyMedium),
              ],
              if (task['kind'] == 'number' && !solved) ...[
                const SizedBox(height: 10),
                Text(tx('correctNumber', {'n': answer}), style: text.titleMedium),
                if ('${result['numberFeedback'] ?? ''}'.isNotEmpty) Text('${result['numberFeedback']}', style: text.bodyMedium),
              ],
            ],
          ),
        ),
        const SizedBox(height: 8),
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(tx('whyTitle'), style: text.titleMedium?.copyWith(color: AppColors.primary)),
              for (final (i, step) in ((result['steps'] as List? ?? const []).indexed))
                Padding(
                  padding: const EdgeInsets.only(top: 6),
                  child: Text('${i + 1}. $step', style: text.bodyLarge),
                ),
              if ('${result['realLife'] ?? ''}'.isNotEmpty) ...[const SizedBox(height: 10), Text('${tx('realLifeTitle')} ${result['realLife']}', style: text.bodyLarge)],
              if ('${result['tip'] ?? ''}'.isNotEmpty) ...[const SizedBox(height: 10), Text('${tx('tipTitle')} ${result['tip']}', style: text.bodyLarge)],
              if ('${result['skillName'] ?? ''}'.isNotEmpty) ...[
                const SizedBox(height: 10),
                Text(
                  '${tx('skillUsed')} ${result['skillName']}',
                  style: text.bodyMedium?.copyWith(color: AppColors.primary, fontWeight: FontWeight.w600),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

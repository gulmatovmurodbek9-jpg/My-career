import 'dart:async';

import 'package:flutter/material.dart';

import '../api/api.dart';
import '../api/models.dart';
import '../app/i18n.dart';
import '../app/last_result.dart';
import '../app/settings.dart';
import '../app/theme.dart';
import '../app/web_texts.dart';
import '../ui/widgets.dart';
import 'career_detail_screen.dart';

// Се абзори кабинет (мисли /dashboard/compare, /dashboard/ai-advisor ва /dashboard/ai-chat-и сайт).
// Ҳар се бо вуруд кор мекунанд ва аз квотаи рӯзонаи AI-и корбар истифода мебаранд.

const _aiTimeout = Duration(seconds: 90);

List<String> _strings(dynamic value) => value is List ? [for (final v in value) '$v'.trim()].where((s) => s.isNotEmpty).toList() : const [];

String _errorText(Object error) => error is ApiException && error.message.isNotEmpty ? error.message : t('AI ҳоло ҷавоб надод. Каме баъд боз кӯшиш кунед.');

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
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('•  ', style: TextStyle(fontSize: 16, color: AppColors.primary)),
              Expanded(child: Text(item, style: Theme.of(context).textTheme.bodyLarge)),
            ],
          ),
        ),
    ],
  );
}

class _AiNote extends StatelessWidget {
  const _AiNote();

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(top: 6, bottom: 4),
    child: Text(t('Матни AI аст, на маълумоти расмӣ. Рақамҳо ва фактҳоро дар саҳифаи ихтисос санҷед.'), style: TextStyle(fontSize: 13.5, color: AppColors.textSoft)),
  );
}

// ───────────── Муқоиса (мисли /dashboard/compare-и сайт) ─────────────
String _cx(String key) => '${(compareTexts[appSettings.lang] ?? compareTexts['tj'])[key] ?? compareTexts['tj'][key] ?? ''}';

class CompareScreen extends StatefulWidget {
  const CompareScreen({super.key});

  @override
  State<CompareScreen> createState() => _CompareScreenState();
}

class _CompareScreenState extends State<CompareScreen> {
  static const _max = 3;
  final List<Career> _picked = [];
  List<Career> _saved = const [];
  List<Career> _suggested = const [];
  List<Career>? _found;
  final _search = TextEditingController();
  final _question = TextEditingController();
  Timer? _debounce;
  Map<String, dynamic>? _data;
  String? _error;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _loadChoices();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _search.dispose();
    _question.dispose();
    super.dispose();
  }

  // Захирашуда ва ихтисосҳои натиҷаи тест — барои интихоби зуд.
  Future<void> _loadChoices() async {
    try {
      final data = await Api.instance.getFresh('/users/saved-careers');
      if (mounted) setState(() => _saved = [for (final c in (data as List? ?? const [])) Career.fromJson(Map<String, dynamic>.from(c))]);
    } catch (_) {}
    final saved = lastResult.result;
    final clusterId = saved == null ? '' : QuizResult.fromJson(saved).clusterId;
    if (clusterId.isEmpty) return;
    try {
      final data = await Api.instance.get('/careers', {'clusterId': clusterId, 'limit': '8', 'lang': appSettings.lang});
      if (mounted) setState(() => _suggested = [for (final c in data['data'] as List) Career.fromJson(Map<String, dynamic>.from(c))]);
    } catch (_) {}
  }

  void _onSearch(String query) {
    _debounce?.cancel();
    if (query.trim().length < 2) {
      setState(() => _found = null);
      return;
    }
    _debounce = Timer(const Duration(milliseconds: 300), () async {
      try {
        final data = await Api.instance.get('/careers', {'search': query.trim(), 'limit': '6', 'lang': appSettings.lang});
        if (mounted) setState(() => _found = [for (final c in data['data'] as List) Career.fromJson(Map<String, dynamic>.from(c))]);
      } catch (_) {
        if (mounted) setState(() => _found = const []);
      }
    });
  }

  bool _isPicked(Career c) => _picked.any((p) => p.id == c.id);

  void _toggle(Career career) {
    setState(() {
      _data = null;
      if (_isPicked(career)) {
        _picked.removeWhere((p) => p.id == career.id);
      } else if (_picked.length < _max) {
        _picked.add(career);
      }
    });
  }

  Future<void> _compare() async {
    setState(() {
      _loading = true;
      _error = null;
      _data = null;
    });
    try {
      final data = await Api.instance.post('/careers/compare', {
        'scores': lastResult.result?['scores'] ?? {},
        // Сервер ихтисосҳоро аз рӯи номи тоҷикии база меёбад.
        'careers': [for (final c in _picked) c.nameTj.isNotEmpty ? c.nameTj : c.name],
        'lang': appSettings.lang,
        if (_question.text.trim().isNotEmpty) 'compareQuestion': _question.text.trim(),
      }, timeout: _aiTimeout);
      if (mounted) setState(() => _data = Map<String, dynamic>.from(data));
    } catch (e) {
      if (mounted) setState(() => _error = e is ApiException && e.status == 429 ? '${_cx('rateLimitError')}. ${_cx('rateLimitDesc')}' : _errorText(e));
    }
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return Scaffold(
      appBar: AppBar(title: Text(_cx('title'))),
      body: SafeArea(
        child: ListView(
          padding: AppSizes.page,
          children: [
            Text(_cx('subtitle'), style: text.bodyLarge?.copyWith(color: AppColors.textSoft)),
            SectionTitle('${_cx('selected')} (${_picked.length}/$_max)'),
            if (_picked.isEmpty) Text(_cx('minCareers'), style: text.bodyMedium?.copyWith(color: AppColors.textSoft)),
            for (final c in _picked) ...[_PickedRow(career: c, onRemove: () => _toggle(c)), const SizedBox(height: 8)],
            const SizedBox(height: 8),
            TextField(
              controller: _search,
              onChanged: _onSearch,
              decoration: InputDecoration(hintText: _cx('searchPlaceholder'), prefixIcon: const Icon(Icons.search_rounded), isDense: true),
            ),
            if (_found != null) ...[
              const SizedBox(height: 8),
              if (_found!.isEmpty) Text(t('Ихтисос ёфт нашуд.'), style: text.bodyMedium),
              for (final c in _found!) _ChoiceRow(career: c, picked: _isPicked(c), full: _picked.length >= _max, onTap: () => _toggle(c)),
            ],
            if (_saved.isNotEmpty) ...[SectionTitle(_cx('savedTitle')), for (final c in _saved) _ChoiceRow(career: c, picked: _isPicked(c), full: _picked.length >= _max, onTap: () => _toggle(c))],
            if (_suggested.isNotEmpty) ...[
              SectionTitle(_cx('suggestedGroupTitle')),
              for (final c in _suggested) _ChoiceRow(career: c, picked: _isPicked(c), full: _picked.length >= _max, onTap: () => _toggle(c)),
            ],
            SectionTitle(_cx('compareQuestion')),
            TextField(
              controller: _question,
              maxLength: 300,
              minLines: 1,
              maxLines: 3,
              decoration: InputDecoration(hintText: _cx('compareQuestionPlaceholder'), counterText: ''),
            ),
            const SizedBox(height: 6),
            for (final quick in [_cx('quickCompareSalary'), _cx('quickCompareFuture'), _cx('quickCompareProsCons')])
              TextButton(
                style: TextButton.styleFrom(alignment: Alignment.centerLeft),
                onPressed: () => setState(() => _question.text = quick),
                child: Text('+ $quick'),
              ),
            const SizedBox(height: 8),
            FilledButton(onPressed: _picked.length < 2 || _loading ? null : _compare, child: Text(_loading ? _cx('comparing') : _cx('compare'))),
            if (_loading) ...[
              const SizedBox(height: 8),
              Text(
                _cx('comparingDesc'),
                textAlign: TextAlign.center,
                style: text.bodyMedium?.copyWith(color: AppColors.textSoft),
              ),
            ],
            if (_error != null) ...[
              const SizedBox(height: 12),
              AppCard(child: Text(_error!, style: text.bodyLarge)),
              const SizedBox(height: 8),
              OutlinedButton(onPressed: _compare, child: Text(_cx('retry'))),
            ],
            if (_data != null) ..._result(text),
          ],
        ),
      ),
    );
  }

  List<Widget> _result(TextTheme text) {
    final d = _data!;
    final best = d['bestCareer'] is Map ? Map<String, dynamic>.from(d['bestCareer']) : const <String, dynamic>{};
    final items = [for (final item in (d['careerComparison'] as List? ?? const [])) Map<String, dynamic>.from(item)];
    final alternatives = [for (final item in (d['alternatives'] as List? ?? const [])) Map<String, dynamic>.from(item)];
    String level(String? value) => switch (value) {
      'high' => _cx('high'),
      'low' => _cx('low'),
      'easy' => _cx('easy'),
      'hard' => _cx('hard'),
      _ => _cx('medium'),
    };
    return [
      const _AiNote(),
      if ('${best['name'] ?? ''}'.isNotEmpty) ...[
        SectionTitle(_cx('bestMatch')),
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(AppSizes.radius + 4)),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                cleanName('${best['name']}'),
                style: const TextStyle(fontSize: 21, fontWeight: FontWeight.w700, color: Colors.white, height: 1.2),
              ),
              if ('${best['reason'] ?? ''}'.isNotEmpty) ...[const SizedBox(height: 8), Text('${best['reason']}', style: const TextStyle(fontSize: 15.5, color: Colors.white, height: 1.4))],
            ],
          ),
        ),
      ],
      if ('${d['customAnalysis'] ?? ''}'.trim().isNotEmpty) ...[SectionTitle(_cx('customAnalysis')), AppCard(child: Text('${d['customAnalysis']}', style: text.bodyLarge))],
      if (items.isEmpty) ...[const SizedBox(height: 12), AppCard(child: Text(_cx('noComparisonData'), style: text.bodyLarge))],
      for (final item in items) ...[
        SectionTitle(cleanName('${item['career'] ?? item['careerName'] ?? item['name'] ?? ''}')),
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (item['matchPercentage'] is num) ...[
                Text(_cx('match'), style: text.bodySmall?.copyWith(color: AppColors.textSoft)),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Expanded(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(99),
                        child: LinearProgressIndicator(value: ((item['matchPercentage'] as num) / 100).clamp(0, 1).toDouble(), minHeight: 8, backgroundColor: AppColors.contractSoft),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Text('${item['matchPercentage']}%', style: text.titleMedium?.copyWith(color: AppColors.primary)),
                  ],
                ),
                const SizedBox(height: 10),
              ],
              if ('${item['summary'] ?? ''}'.isNotEmpty) Text('${item['summary']}', style: text.bodyLarge),
              const SizedBox(height: 10),
              Text(
                '${_cx('demand')}: ${level(item['marketDemand'] as String?)} · ${_cx('difficulty')}: ${level(item['learningDifficulty'] as String?)}',
                style: text.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
              ),
              if ('${item['salaryRange'] ?? ''}'.trim().isNotEmpty) ...[const SizedBox(height: 4), Text('${_cx('salary')}: ${item['salaryRange']}', style: text.bodyMedium)],
              if (_strings(item['pros']).isNotEmpty) ...[const SizedBox(height: 12), Text(_cx('pros'), style: text.titleMedium), _Bullets(_strings(item['pros']))],
              if (_strings(item['cons']).isNotEmpty) ...[const SizedBox(height: 12), Text(_cx('cons'), style: text.titleMedium), _Bullets(_strings(item['cons']))],
              if (_strings(item['skillsRequired']).isNotEmpty) ...[const SizedBox(height: 12), Text(_cx('skills'), style: text.titleMedium), _Bullets(_strings(item['skillsRequired']))],
            ],
          ),
        ),
      ],
      SectionTitle(_cx('factsTitle')),
      Text(_cx('factsPurpose'), style: text.bodySmall?.copyWith(color: AppColors.textSoft)),
      const SizedBox(height: 8),
      for (final c in _picked) ...[
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(c.name, style: text.titleMedium),
              const SizedBox(height: 6),
              if (c.code.isNotEmpty) _Fact(_cx('factCode'), c.code),
              if (c.years != null) _Fact(_cx('factDuration'), '${c.years} ${_cx('factYears')}'),
              if (c.minFee != null) _Fact(_cx('factTuition'), money(c.minFee!)),
              _Fact(_cx('factFree'), c.hasFreeSeats ? _cx('factFreeYes') : _cx('factFreeNo')),
              if (c.universitiesCount > 0) _Fact(_cx('factUniversities'), '${c.universitiesCount}'),
            ],
          ),
        ),
        const SizedBox(height: 8),
      ],
      Text(_cx('factsNote'), style: text.bodySmall?.copyWith(color: AppColors.textSoft)),
      if (alternatives.isNotEmpty) ...[
        SectionTitle(_cx('alternativesTitle')),
        Text(_cx('alternativesDesc'), style: text.bodySmall?.copyWith(color: AppColors.textSoft)),
        const SizedBox(height: 8),
        for (final alt in alternatives) ...[
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(cleanName('${alt['name'] ?? ''}'), style: text.titleMedium),
                if ('${alt['reason'] ?? ''}'.isNotEmpty) ...[const SizedBox(height: 4), Text('${alt['reason']}', style: text.bodyMedium)],
                const SizedBox(height: 8),
                OutlinedButton(
                  onPressed: () => Navigator.of(context).push(smoothRoute(CareerDetailScreen(careerId: '${alt['id']}', title: cleanName('${alt['name'] ?? ''}')))),
                  child: Text(_cx('viewSpecialty')),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
        ],
      ],
    ];
  }
}

class _PickedRow extends StatelessWidget {
  const _PickedRow({required this.career, required this.onRemove});
  final Career career;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.fromLTRB(14, 4, 4, 4),
    decoration: BoxDecoration(
      color: AppColors.contractSoft,
      borderRadius: BorderRadius.circular(AppSizes.radius),
      border: Border.all(color: AppColors.primary),
    ),
    child: Row(
      children: [
        Expanded(child: Text(career.name, style: Theme.of(context).textTheme.titleMedium)),
        IconButton(
          tooltip: _cx('remove'),
          onPressed: onRemove,
          icon: Icon(Icons.close_rounded, color: AppColors.primary),
        ),
      ],
    ),
  );
}

class _ChoiceRow extends StatelessWidget {
  const _ChoiceRow({required this.career, required this.picked, required this.full, required this.onTap});
  final Career career;
  final bool picked;
  final bool full;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => ListTile(
    contentPadding: EdgeInsets.zero,
    enabled: picked || !full,
    onTap: onTap,
    title: Text(career.name, style: Theme.of(context).textTheme.bodyLarge),
    subtitle: career.cluster.isEmpty ? null : Text(career.cluster, style: TextStyle(color: AppColors.textSoft)),
    trailing: Icon(picked ? Icons.check_circle_rounded : Icons.add_circle_outline_rounded, color: AppColors.primary),
  );
}

class _Fact extends StatelessWidget {
  const _Fact(this.label, this.value);
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(top: 4),
    child: Row(
      children: [
        Expanded(
          child: Text(label, style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.textSoft)),
        ),
        Text(value, style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600)),
      ],
    ),
  );
}

// ───────────── Ҳисоботи AI ─────────────
class AdvisorReportScreen extends StatefulWidget {
  const AdvisorReportScreen({super.key});

  @override
  State<AdvisorReportScreen> createState() => _AdvisorReportScreenState();
}

class _AdvisorReportScreenState extends State<AdvisorReportScreen> {
  Map<String, dynamic>? _report;
  String? _error;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    if (lastResult.result?['scores'] != null) _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await Api.instance.post('/careers/ai-advisor', {
        'scores': lastResult.result!['scores'],
        'lang': appSettings.lang,
        'quizProfile': {
          'answers': [
            for (final item in lastResult.why.take(30)) {'question': '${item['q']}'.substring(0, '${item['q']}'.length.clamp(0, 300)), 'selectedText': '${item['a']}'},
          ],
        },
      }, timeout: _aiTimeout);
      // Сервер ҳисоботро дар {report: {...}} мефиристад (бо mmtScores ва topMatches дар паҳлӯ).
      final root = Map<String, dynamic>.from(data);
      final report = root['report'] is Map ? Map<String, dynamic>.from(root['report']) : root;
      if (mounted) setState(() => _report = report);
    } catch (e) {
      if (mounted) setState(() => _error = _errorText(e));
    }
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final r = _report;
    final recs = [for (final item in (r?['careerRecommendations'] as List? ?? const [])) Map<String, dynamic>.from(item)];
    final reasons = [for (final item in (r?['explanation'] as List? ?? const [])) Map<String, dynamic>.from(item)];
    final roadmap = r?['careerRoadmap'] is Map ? Map<String, dynamic>.from(r!['careerRoadmap']) : const <String, dynamic>{};
    final steps = [for (final item in (roadmap['steps'] as List? ?? const [])) Map<String, dynamic>.from(item)];
    final outlook = r?['tenYearOutlook'] is Map ? Map<String, dynamic>.from(r!['tenYearOutlook']) : const <String, dynamic>{};
    return Scaffold(
      appBar: AppBar(title: Text(t('Ҳисоботи AI'))),
      body: SafeArea(
        child: ListView(
          padding: AppSizes.page,
          children: [
            if (lastResult.result == null)
              AppCard(child: Text(t('Ҳисобот аз натиҷаи тест сохта мешавад. Аввал тестро супоред.'), style: text.bodyLarge))
            else if (_loading)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 40),
                child: Column(
                  children: [
                    const CircularProgressIndicator(),
                    const SizedBox(height: 14),
                    Text(t('AI ҳисоботро тайёр мекунад…'), style: text.bodyLarge),
                  ],
                ),
              )
            else if (_error != null) ...[
              AppCard(child: Text(_error!, style: text.bodyLarge)),
              const SizedBox(height: 10),
              OutlinedButton(onPressed: _load, child: Text(t('Боз кӯшиш кунед'))),
            ] else if (r != null) ...[
              const _AiNote(),
              if ([...(r['quizAnswerAnalysis'] as List? ?? const [])].any((x) => x is Map && '${x['insight'] ?? ''}'.isNotEmpty)) ...[
                SectionTitle(t('Ҷавобҳои шумо')),
                for (final item in [
                  for (final x in (r['quizAnswerAnalysis'] as List))
                    if (x is Map && '${x['insight'] ?? ''}'.isNotEmpty) x,
                ]) ...[
                  AppCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if ('${item['question'] ?? ''}'.isNotEmpty) Text('${item['question']}', style: text.bodySmall?.copyWith(color: AppColors.textSoft)),
                        if ('${item['answer'] ?? ''}'.isNotEmpty) Text('${item['answer']}', style: text.titleMedium),
                        const SizedBox(height: 4),
                        Text('${item['insight']}', style: text.bodyMedium),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                ],
              ],
              if ('${r['personalityAnalysis'] ?? ''}'.isNotEmpty) ...[SectionTitle(t('Ҷавобҳои шумо чӣ нишон медиҳанд')), AppCard(child: Text('${r['personalityAnalysis']}', style: text.bodyLarge))],
              if (recs.isNotEmpty) ...[
                SectionTitle(t('Ихтисосҳои тавсияшуда')),
                for (final rec in recs) ...[
                  AppCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(cleanName('${rec['name'] ?? ''}'), style: text.titleMedium),
                        if ('${rec['shortDescription'] ?? ''}'.isNotEmpty) ...[const SizedBox(height: 4), Text('${rec['shortDescription']}', style: text.bodyMedium)],
                        for (final reason in reasons.where((x) => '${x['career']}' == '${rec['name']}')) ...[
                          const SizedBox(height: 6),
                          Text('${reason['reason'] ?? ''}', style: text.bodyMedium?.copyWith(color: AppColors.textSoft)),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 10),
                ],
              ],
              if (steps.isNotEmpty) ...[
                SectionTitle(t('Роҳнамо: {name}', {'name': cleanName('${roadmap['targetCareer'] ?? ''}')})),
                for (var i = 0; i < steps.length; i++) ...[
                  AppCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('${i + 1}. ${steps[i]['title'] ?? ''}', style: text.titleMedium),
                        if ('${steps[i]['duration'] ?? ''}'.isNotEmpty) Text('${steps[i]['duration']}', style: text.bodyMedium?.copyWith(color: AppColors.primary)),
                        if ('${steps[i]['description'] ?? ''}'.isNotEmpty) ...[const SizedBox(height: 4), Text('${steps[i]['description']}', style: text.bodyMedium)],
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                ],
              ],
              if (outlook.isNotEmpty) ...[
                SectionTitle(t('Ояндаи касб')),
                AppCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if ('${outlook['summary'] ?? ''}'.isNotEmpty) Text('${outlook['summary']}', style: text.bodyLarge),
                      if (_strings(outlook['opportunities']).isNotEmpty) ...[const SizedBox(height: 10), Text(t('Имкониятҳо'), style: text.titleMedium), _Bullets(_strings(outlook['opportunities']))],
                      if (_strings(outlook['risks']).isNotEmpty) ...[const SizedBox(height: 10), Text(t('Хатарҳо'), style: text.titleMedium), _Bullets(_strings(outlook['risks']))],
                    ],
                  ),
                ),
              ],
            ],
          ],
        ),
      ),
    );
  }
}

// ───────────── Чати AI бо таърих ─────────────
class AiChatScreen extends StatefulWidget {
  const AiChatScreen({super.key});

  @override
  State<AiChatScreen> createState() => _AiChatScreenState();
}

class _AiChatScreenState extends State<AiChatScreen> {
  final _input = TextEditingController();
  final _scroll = ScrollController();
  final List<(bool, String)> _messages = [];
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _history();
  }

  @override
  void dispose() {
    _input.dispose();
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _history() async {
    try {
      final data = await Api.instance.getFresh('/users/chat-history');
      if (!mounted || data is! List) return;
      setState(() {
        for (final item in data.skip(data.length > 30 ? data.length - 30 : 0)) {
          _messages
            ..add((true, '${item['question'] ?? ''}'))
            ..add((false, '${item['answer'] ?? ''}'));
        }
      });
      _toEnd();
    } catch (_) {}
  }

  void _toEnd() => WidgetsBinding.instance.addPostFrameCallback((_) {
    if (_scroll.hasClients) _scroll.jumpTo(_scroll.position.maxScrollExtent);
  });

  Future<void> _send() async {
    final question = _input.text.trim();
    if (question.isEmpty || _loading) return;
    setState(() {
      _messages.add((true, question));
      _input.clear();
      _loading = true;
    });
    _toEnd();
    try {
      final data = await Api.instance.post('/careers/ask', {'question': question, 'lang': appSettings.lang}, timeout: _aiTimeout);
      setState(() => _messages.add((false, '${data['answer'] ?? ''}')));
    } catch (e) {
      setState(() => _messages.add((false, _errorText(e))));
    }
    if (mounted) setState(() => _loading = false);
    _toEnd();
  }

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return Scaffold(
      appBar: AppBar(title: Text(t('Чати AI'))),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: _messages.isEmpty
                  ? Center(
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Text(
                          t('Дар бораи касб, ихтисос ё донишгоҳ савол диҳед. Масалан: «Барои барномасоз кадом фанҳо муҳиманд?»'),
                          textAlign: TextAlign.center,
                          style: text.bodyLarge?.copyWith(color: AppColors.textSoft),
                        ),
                      ),
                    )
                  : ListView.builder(
                      controller: _scroll,
                      padding: const EdgeInsets.all(16),
                      itemCount: _messages.length + (_loading ? 1 : 0),
                      itemBuilder: (context, i) {
                        if (i == _messages.length) {
                          return Align(
                            alignment: Alignment.centerLeft,
                            child: Text(t('AI менависад…'), style: text.bodyMedium?.copyWith(color: AppColors.textSoft)),
                          );
                        }
                        final (mine, body) = _messages[i];
                        return Align(
                          alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 10),
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                            constraints: BoxConstraints(maxWidth: MediaQuery.sizeOf(context).width * 0.82),
                            decoration: BoxDecoration(
                              color: mine ? AppColors.primary : AppColors.card,
                              border: mine ? null : Border.all(color: AppColors.border),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: SelectableText(body, style: TextStyle(fontSize: 16, height: 1.4, color: mine ? Colors.white : AppColors.text)),
                          ),
                        );
                      },
                    ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 6, 12, 12),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _input,
                      minLines: 1,
                      maxLines: 4,
                      maxLength: 1000,
                      textInputAction: TextInputAction.send,
                      onSubmitted: (_) => _send(),
                      decoration: InputDecoration(hintText: t('Саволи худро нависед'), counterText: '', isDense: true),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filled(tooltip: t('Фиристодан'), onPressed: _loading ? null : _send, icon: const Icon(Icons.arrow_upward_rounded)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

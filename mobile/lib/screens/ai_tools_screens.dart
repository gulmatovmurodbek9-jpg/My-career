import 'package:flutter/material.dart';

import '../api/api.dart';
import '../api/models.dart';
import '../app/i18n.dart';
import '../app/last_result.dart';
import '../app/settings.dart';
import '../app/theme.dart';
import '../ui/widgets.dart';

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

// ───────────── Муқоиса ─────────────
class CompareScreen extends StatefulWidget {
  const CompareScreen({super.key, required this.choices});
  // Ихтисосҳои нигоҳдошта ва ихтисосҳои натиҷаи тест.
  final List<String> choices;

  @override
  State<CompareScreen> createState() => _CompareScreenState();
}

class _CompareScreenState extends State<CompareScreen> {
  final Set<String> _picked = {};
  final _question = TextEditingController();
  Map<String, dynamic>? _data;
  String? _error;
  bool _loading = false;

  @override
  void dispose() {
    _question.dispose();
    super.dispose();
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
        'careers': _picked.toList(),
        'lang': appSettings.lang,
        if (_question.text.trim().isNotEmpty) 'compareQuestion': _question.text.trim(),
      }, timeout: _aiTimeout);
      if (mounted) setState(() => _data = Map<String, dynamic>.from(data));
    } catch (e) {
      if (mounted) setState(() => _error = _errorText(e));
    }
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final items = [for (final item in (_data?['careerComparison'] as List? ?? const [])) Map<String, dynamic>.from(item)];
    return Scaffold(
      appBar: AppBar(title: Text(t('Муқоисаи ихтисосҳо'))),
      body: SafeArea(
        child: ListView(
          padding: AppSizes.page,
          children: [
            Text(t('2 ё 3 ихтисосро интихоб кунед.'), style: text.bodyLarge),
            const SizedBox(height: 8),
            if (widget.choices.isEmpty)
              AppCard(child: Text(t('Аввал тест супоред ё ихтисосҳоро нигоҳ доред, то аз онҳо интихоб кунед.'), style: text.bodyMedium))
            else
              for (final name in widget.choices)
                CheckboxListTile(
                  contentPadding: EdgeInsets.zero,
                  controlAffinity: ListTileControlAffinity.leading,
                  value: _picked.contains(name),
                  onChanged: !_picked.contains(name) && _picked.length >= 3 ? null : (_) => setState(() => _picked.contains(name) ? _picked.remove(name) : _picked.add(name)),
                  title: Text(cleanName(name), style: text.bodyLarge),
                ),
            const SizedBox(height: 8),
            TextField(
              controller: _question,
              maxLength: 300,
              decoration: InputDecoration(hintText: t('Саволи шумо (ихтиёрӣ): масалан, кадомаш барои деҳот беҳтар аст?'), counterText: ''),
            ),
            const SizedBox(height: 12),
            FilledButton(onPressed: _picked.length < 2 || _loading ? null : _compare, child: Text(_loading ? t('AI муқоиса мекунад…') : t('Муқоиса кардан'))),
            if (_error != null) ...[const SizedBox(height: 12), AppCard(child: Text(_error!, style: text.bodyMedium))],
            if (_data != null) ...[
              const _AiNote(),
              if ('${_data!['bestCareerName'] ?? ''}'.isNotEmpty) ...[
                SectionTitle(t('Ба шумо бештар мувофиқ')),
                AppCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(cleanName('${_data!['bestCareerName']}'), style: text.titleLarge?.copyWith(color: AppColors.primary)),
                      const SizedBox(height: 6),
                      Text('${_data!['bestCareerReason'] ?? ''}', style: text.bodyLarge),
                    ],
                  ),
                ),
              ],
              if ('${_data!['customAnalysis'] ?? ''}'.trim().isNotEmpty) ...[SectionTitle(t('Ҷавоб ба саволи шумо')), AppCard(child: Text('${_data!['customAnalysis']}', style: text.bodyLarge))],
              for (final item in items) ...[
                SectionTitle(cleanName('${item['careerName'] ?? item['name'] ?? ''}')),
                AppCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if ('${item['summary'] ?? ''}'.isNotEmpty) Text('${item['summary']}', style: text.bodyLarge),
                      if (_strings(item['pros']).isNotEmpty) ...[const SizedBox(height: 10), Text(t('Афзалиятҳо'), style: text.titleMedium), _Bullets(_strings(item['pros']))],
                      if (_strings(item['cons']).isNotEmpty) ...[const SizedBox(height: 10), Text(t('Душвориҳо'), style: text.titleMedium), _Bullets(_strings(item['cons']))],
                      if (_strings(item['skillsRequired']).isNotEmpty) ...[const SizedBox(height: 10), Text(t('Малакаҳои лозим'), style: text.titleMedium), _Bullets(_strings(item['skillsRequired']))],
                      if ('${item['salaryRange'] ?? ''}'.trim().isNotEmpty) ...[
                        const SizedBox(height: 10),
                        Text(t('Маош: {v}', {'v': '${item['salaryRange']}'}), style: text.bodyLarge),
                      ],
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
      if (mounted) setState(() => _report = Map<String, dynamic>.from(data));
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

import 'package:flutter/material.dart';

import '../api/api.dart';
import '../api/models.dart';
import '../app/auth.dart';
import '../app/settings.dart';
import '../app/theme.dart';
import '../ui/widgets.dart';
import 'results_screen.dart';

// Экрани аввали тест: синф ва тугмаи «Сар кардан».
class QuizStartScreen extends StatelessWidget {
  const QuizStartScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return Scaffold(
      appBar: AppBar(title: const Text('Тести касбӣ')),
      // Тугмаи асосӣ ҳамеша дар поён намоён аст — лозим нест, ки ба поён кашед.
      bottomNavigationBar: ListenableBuilder(
        listenable: appSettings,
        builder: (context, _) => Container(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
          decoration: const BoxDecoration(color: AppColors.background, border: Border(top: BorderSide(color: AppColors.border))),
          child: SafeArea(
            top: false,
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              if (appSettings.grade == null)
                Padding(padding: const EdgeInsets.only(bottom: 8), child: Text('Аввал синфро интихоб кунед', style: text.bodyMedium)),
              FilledButton.icon(
                onPressed: appSettings.grade == null
                    ? null
                    : () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const QuizFlowScreen())),
                icon: const Icon(Icons.play_arrow_rounded, size: 26),
                label: const Text('Тестро сар кунед'),
              ),
            ]),
          ),
        ),
      ),
      body: ListenableBuilder(
        listenable: appSettings,
        builder: (context, _) => ListView(
          padding: AppSizes.page,
          children: [
            Text('Чӣ тавр мегузарад?', style: text.headlineMedium),
            const SizedBox(height: 14),
            const _Step(number: '1', text: 'Ба 24 саволи содда дар бораи ҳаёти худ ҷавоб медиҳед.'),
            const _Step(number: '2', text: 'Баъд 5 саволи дигар дар бораи самти шумо.'),
            const _Step(number: '3', text: 'Мебинед, ки кадом ихтисосҳо ба шумо мувофиқанд ва онҳоро дар куҷо мехонанд.'),
            const SizedBox(height: 10),
            Text('Ҷавоби «дуруст» ё «нодуруст» нест. Он чиро интихоб кунед, ки ба шумо наздиктар аст.', style: text.bodyLarge),
            const SectionTitle('Шумо баъди кадом синф ҳастед?'),
            for (final g in [9, 11]) ...[
              _GradeButton(grade: g, selected: appSettings.grade == g),
              const SizedBox(height: 12),
            ],
          ],
        ),
      ),
    );
  }
}

class _Step extends StatelessWidget {
  const _Step({required this.number, required this.text});
  final String number;
  final String text;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 14),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          CircleAvatar(radius: 17, backgroundColor: AppColors.contractSoft, child: Text(number, style: const TextStyle(fontSize: 16.5, fontWeight: FontWeight.w800, color: AppColors.primary))),
          const SizedBox(width: 14),
          Expanded(child: Padding(padding: const EdgeInsets.only(top: 6), child: Text(text, style: Theme.of(context).textTheme.bodyLarge))),
        ]),
      );
}

class _GradeButton extends StatelessWidget {
  const _GradeButton({required this.grade, required this.selected});
  final int grade;
  final bool selected;

  @override
  Widget build(BuildContext context) => Semantics(
        selected: selected,
        button: true,
        child: Material(
          color: selected ? AppColors.contractSoft : Colors.white,
          borderRadius: BorderRadius.circular(AppSizes.radius),
          child: InkWell(
            borderRadius: BorderRadius.circular(AppSizes.radius),
            onTap: () => appSettings.setGrade(grade),
            child: Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(AppSizes.radius),
                border: Border.all(color: selected ? AppColors.primary : AppColors.border, width: selected ? 2.5 : 2),
              ),
              child: Row(children: [
                Icon(selected ? Icons.check_circle_rounded : Icons.circle_outlined, size: 26, color: selected ? AppColors.primary : AppColors.textSoft),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('Баъди синфи $grade', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.text)),
                    Text(grade == 9 ? 'Метавонед ба коллеҷ дароед' : 'Метавонед ба донишгоҳ ё коллеҷ дароед', style: Theme.of(context).textTheme.bodyMedium),
                  ]),
                ),
              ]),
            ),
          ),
        ),
      );
}

// Худи тест: як савол дар як экран, ҷавобҳо тугмаҳои калон.
class QuizFlowScreen extends StatefulWidget {
  const QuizFlowScreen({super.key});

  @override
  State<QuizFlowScreen> createState() => _QuizFlowScreenState();
}

class _QuizFlowScreenState extends State<QuizFlowScreen> {
  static const _tieShare = 0.15; // ҳамон ҳадди сайт: ду самт камтар аз 15% фарқ — аз худи хонанда мепурсем
  static const _expectedTotal = 29;

  final List<QuizQuestion> _questions = [];
  final Map<String, String> _answers = {};
  Map<int, String> _clusterNames = {};
  int _index = 0;
  bool _stage2 = false;
  String? _loading = 'Саволҳо бор мешаванд…';
  String? _error;

  @override
  void initState() {
    super.initState();
    _start();
  }

  Future<void> _start() async {
    setState(() {
      _loading = 'Саволҳо бор мешаванд…';
      _error = null;
    });
    try {
      final results = await Future.wait([Api.instance.get('/quiz/questions'), Api.instance.get('/clusters')]);
      final questions = (results[0] as List).map((e) => QuizQuestion.fromJson(Map<String, dynamic>.from(e))).toList();
      final clusters = {for (final c in results[1] as List) (c['clusterId'] as num).toInt(): '${c['clusterName']}'};
      setState(() {
        _questions
          ..clear()
          ..addAll(questions);
        _clusterNames = clusters;
        _loading = null;
      });
    } catch (e) {
      setState(() {
        _loading = null;
        _error = e.toString();
      });
    }
  }

  List<Map<String, String>> get _answerList =>
      _answers.entries.map((e) => {'questionId': e.key, 'selectedValue': e.value}).toList();

  Future<void> _answer(String value) async {
    final question = _questions[_index];
    _answers[question.id] = value;
    if (_index < _questions.length - 1) {
      setState(() => _index++);
      return;
    }
    if (!_stage2 && question.id != 'tiebreak') {
      await _afterStage1();
    } else if (question.id == 'tiebreak') {
      await _loadStage2(value == 'both' ? _rankedClusters.first.key : value);
    } else {
      await _submit();
    }
  }

  List<MapEntry<String, double>> _rankedClusters = [];

  Future<void> _afterStage1() async {
    setState(() => _loading = 'Ҷавобҳо ҳисоб мешаванд…');
    try {
      final data = await Api.instance.post('/quiz/score', {'answers': _answerList});
      final scores = Map<String, dynamic>.from(data['scores']['mmtClusters']);
      _rankedClusters = scores.entries.map((e) => MapEntry(e.key, (e.value as num).toDouble())).toList()
        ..sort((a, b) => b.value.compareTo(a.value));
      final first = _rankedClusters[0];
      final second = _rankedClusters[1];
      if (first.value - second.value < _tieShare * (first.value < 1 ? 1 : first.value)) {
        String name(String key) => _clusterNames[int.parse(key.substring(1))] ?? key;
        int percent(double score) => (score / 40 * 100).round();
        setState(() {
          _questions.add(QuizQuestion(
            id: 'tiebreak',
            part: 'tiebreak',
            text: 'Ду самт ба шумо баробар наздик баромад. Кадомаш ба дилатон наздиктар аст?',
            options: [
              QuizOption('${name(first.key)} (${percent(first.value)}%)', first.key),
              QuizOption('${name(second.key)} (${percent(second.value)}%)', second.key),
              QuizOption('Намедонам, ҳарду ба ман наздиканд', 'both'),
            ],
          ));
          _index++;
          _loading = null;
        });
        return;
      }
      await _loadStage2(first.key);
    } catch (e) {
      setState(() {
        _loading = null;
        _error = e.toString();
      });
    }
  }

  Future<void> _loadStage2(String clusterKey) async {
    setState(() => _loading = 'Саволҳои самти шумо бор мешаванд…');
    try {
      final data = await Api.instance.get('/quiz/specialty-questions', {'clusterNumber': clusterKey.replaceAll(RegExp(r'\D'), '')});
      final more = (data as List).map((e) => QuizQuestion.fromJson(Map<String, dynamic>.from(e))).toList();
      if (more.isEmpty) {
        await _submit();
        return;
      }
      setState(() {
        _questions.addAll(more);
        _stage2 = true;
        _index++;
        _loading = null;
      });
    } catch (e) {
      setState(() {
        _loading = null;
        _error = e.toString();
      });
    }
  }

  Future<void> _submit() async {
    setState(() => _loading = 'Натиҷа тайёр мешавад…');
    final body = {
      'answers': _answerList,
      'lang': 'tj',
      'grade': appSettings.grade ?? 11,
      'deferAdvice': true,
    };
    try {
      dynamic data;
      // Агар корбар ворид шуда бошад, натиҷа дар ҳисобаш нигоҳ дошта мешавад.
      if (authStore.isLoggedIn) {
        try {
          data = await Api.instance.post('/quiz/submit-authenticated', body);
        } on ApiException catch (e) {
          if (e.status != 401) rethrow;
          await authStore.logout(); // токен кӯҳна шудааст
        }
      }
      data ??= await Api.instance.post('/quiz/submit', body);
      if (!mounted) return;
      Navigator.of(context).pushReplacement(MaterialPageRoute(
        builder: (_) => ResultsScreen(result: QuizResult.fromJson(Map<String, dynamic>.from(data)), requestBody: body),
      ));
    } catch (e) {
      setState(() {
        _loading = null;
        _error = e.toString();
      });
    }
  }

  void _back() {
    if (_index > 0) {
      setState(() => _index--);
    } else {
      Navigator.of(context).maybePop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    Widget body;
    if (_loading != null) {
      body = LoadingView(text: _loading!);
    } else if (_error != null) {
      body = ErrorView(message: _error!, onRetry: _questions.isEmpty ? _start : () => setState(() => _error = null));
    } else {
      final question = _questions[_index];
      final total = _questions.length > _expectedTotal ? _questions.length : _expectedTotal;
      final selected = _answers[question.id];
      body = ListView(
        padding: AppSizes.page,
        children: [
          Text('Савол ${_index + 1} аз $total', style: text.titleMedium?.copyWith(color: AppColors.primary)),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(value: (_index + 1) / total, minHeight: 10, backgroundColor: AppColors.contractSoft),
          ),
          const SizedBox(height: 24),
          Text(question.text, style: text.headlineMedium),
          const SizedBox(height: 22),
          for (var i = 0; i < question.options.length; i++) ...[
            _AnswerButton(
              letter: String.fromCharCode(0x0410 + i), // А, Б, В…
              text: question.options[i].text,
              selected: selected == question.options[i].value,
              onTap: () => _answer(question.options[i].value),
            ),
            const SizedBox(height: 12),
          ],
        ],
      );
    }
    return PopScope(
      canPop: _index == 0 || _loading != null,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _back();
      },
      child: Scaffold(
        appBar: AppBar(
          leading: IconButton(iconSize: 26, tooltip: 'Баргаштан', icon: const Icon(Icons.arrow_back_rounded), onPressed: _back),
          title: const Text('Тест'),
        ),
        body: SafeArea(child: body),
      ),
    );
  }
}

class _AnswerButton extends StatelessWidget {
  const _AnswerButton({required this.letter, required this.text, required this.selected, required this.onTap});
  final String letter;
  final String text;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Semantics(
        button: true,
        selected: selected,
        label: text,
        child: Material(
          color: selected ? AppColors.contractSoft : Colors.white,
          borderRadius: BorderRadius.circular(AppSizes.radius),
          child: InkWell(
            borderRadius: BorderRadius.circular(AppSizes.radius),
            onTap: onTap,
            child: Container(
              constraints: const BoxConstraints(minHeight: 68),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(AppSizes.radius),
                border: Border.all(color: selected ? AppColors.primary : AppColors.border, width: selected ? 2.5 : 2),
              ),
              child: Row(children: [
                Container(
                  width: 40,
                  height: 40,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(color: selected ? AppColors.primary : AppColors.contractSoft, shape: BoxShape.circle),
                  child: Text(letter, style: TextStyle(fontSize: 16.5, fontWeight: FontWeight.w800, color: selected ? Colors.white : AppColors.primary)),
                ),
                const SizedBox(width: 14),
                Expanded(child: Text(text, style: const TextStyle(fontSize: 16.5, height: 1.35, fontWeight: FontWeight.w600, color: AppColors.text))),
              ]),
            ),
          ),
        ),
      );
}

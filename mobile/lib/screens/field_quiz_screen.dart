import 'package:flutter/material.dart';

import '../api/api.dart';
import '../api/models.dart';
import '../app/clusters.dart';
import '../app/i18n.dart';
import '../app/settings.dart';
import '../app/theme.dart';
import '../ui/widgets.dart';
import 'careers_screen.dart';

// «Намедонам кадом самт»: 3 саволи ҳамон соҳа (саволҳои қадами 2-и тест) ва ихтисосҳо аз рӯи ҷавобҳо.
// Калимаҳои ҷавобҳо дар номи ихтисосҳо ҷустуҷӯ мешаванд; сервер ихтисосҳои бештар мувофиқро боло мегузорад.
class FieldQuizScreen extends StatefulWidget {
  const FieldQuizScreen({super.key, required this.clusterNumber, this.onFullTest});
  final int clusterNumber;
  final VoidCallback? onFullTest;

  @override
  State<FieldQuizScreen> createState() => _FieldQuizScreenState();
}

class _FieldQuizScreenState extends State<FieldQuizScreen> {
  List<Map<String, dynamic>> _questions = const [];
  final List<int> _answers = [];
  List<Career>? _careers;
  bool _failed = false;

  String _text(dynamic value) => value is Map ? '${value[appSettings.lang] ?? value['tj'] ?? ''}' : '${value ?? ''}';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _failed = false);
    try {
      final data = await Api.instance.get('/quiz/specialty-questions', {'clusterNumber': '${widget.clusterNumber}'});
      if (mounted) setState(() => _questions = [for (final q in data as List) Map<String, dynamic>.from(q)]);
    } catch (_) {
      if (mounted) setState(() => _failed = true);
    }
  }

  void _answer(int index) {
    setState(() => _answers.add(index));
    if (_answers.length == _questions.length) _results();
  }

  Future<void> _results() async {
    final keywords = <String>{
      for (var i = 0; i < _questions.length; i++) ...[for (final k in ((_questions[i]['options'] as List)[_answers[i]] as Map)['keywords'] as List? ?? const []) '$k'],
    };
    try {
      final clusters = await Api.instance.get('/clusters');
      final id = [
        for (final c in clusters as List)
          if ((c['clusterId'] as num?)?.toInt() == widget.clusterNumber) '${c['id']}',
      ].firstOrNull;
      final data = await Api.instance.get('/careers', {'searchAny': keywords.toList(), 'clusterId': ?id, 'limit': '30', if (appSettings.grade != null) 'grade': '${appSettings.grade}'});
      // Мисли тести асосӣ: ихтисоси байторӣ танҳо вақте боло меравад, ки хонанда ҳайвонотро интихоб кард;
      // номҳои такрорӣ (як ихтисос дар якчанд муассиса) як бор.
      final wantsAnimals = keywords.any((k) => RegExp('байтор|ҳайвон|зоо').hasMatch(k));
      final seen = <String>{};
      final list = [
        for (final c in data['data'] as List)
          if (seen.add('${(c as Map)['name']}'.toLowerCase())) Career.fromJson(Map<String, dynamic>.from(c)),
      ];
      final animal = RegExp('байтор|ветеринар', caseSensitive: false);
      final ordered = [...list.where((c) => wantsAnimals || !animal.hasMatch(c.name)), if (!wantsAnimals) ...list.where((c) => animal.hasMatch(c.name))];
      if (mounted) setState(() => _careers = ordered.take(10).toList());
    } catch (_) {
      if (mounted) setState(() => _failed = true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final info = clusters.where((c) => c.number == widget.clusterNumber).firstOrNull;
    final done = _questions.isNotEmpty && _answers.length == _questions.length;
    return Scaffold(
      appBar: AppBar(title: Text(info?.title ?? t('Тести кӯтоҳ'))),
      body: SafeArea(
        child: ListView(
          padding: AppSizes.page,
          children: [
            if (_failed) ...[
              AppCard(child: Text(t('Маълумот наомад. Интернетро санҷед.'), style: text.bodyLarge)),
              const SizedBox(height: 10),
              OutlinedButton(onPressed: _questions.isEmpty ? _load : _results, child: Text(t('Боз кӯшиш кунед'))),
            ] else if (_questions.isEmpty)
              const Center(
                child: Padding(padding: EdgeInsets.all(24), child: CircularProgressIndicator()),
              )
            else if (!done) ...[
              Text(t('Савол {v1} аз {v2}', {'v1': _answers.length + 1, 'v2': _questions.length}), style: text.titleMedium?.copyWith(color: AppColors.primary)),
              const SizedBox(height: 6),
              ClipRRect(
                borderRadius: BorderRadius.circular(99),
                child: LinearProgressIndicator(value: (_answers.length + 1) / _questions.length, minHeight: 6, backgroundColor: AppColors.contractSoft),
              ),
              const SizedBox(height: 16),
              Text(_text(_questions[_answers.length]['question']), style: text.titleLarge),
              const SizedBox(height: 12),
              for (final (i, option) in (_questions[_answers.length]['options'] as List).indexed) ...[
                AppCard(
                  onTap: () => _answer(i),
                  child: Text(_text((option as Map)['text']), style: text.bodyLarge),
                ),
                const SizedBox(height: 8),
              ],
              if (_answers.isNotEmpty) TextButton(onPressed: () => setState(_answers.removeLast), child: Text(t('Баргаштан'))),
            ] else ...[
              Text(t('Ба шумо инҳо наздиканд'), style: text.headlineSmall),
              const SizedBox(height: 4),
              Text(t('Аз рӯи 3 ҷавоби шумо. Ин маслиҳат аст, на ташхис.'), style: text.bodyMedium?.copyWith(color: AppColors.textSoft)),
              const SizedBox(height: 12),
              if (_careers == null)
                const Center(
                  child: Padding(padding: EdgeInsets.all(24), child: CircularProgressIndicator()),
                )
              else if (_careers!.isEmpty)
                AppCard(child: Text(t('Ихтисос ёфт нашуд.'), style: text.bodyLarge))
              else
                for (final c in _careers!) ...[CareerCard(career: c), const SizedBox(height: 10)],
              const SizedBox(height: 8),
              OutlinedButton(
                onPressed: () => setState(() {
                  _answers.clear();
                  _careers = null;
                }),
                child: Text(t('Аз нав')),
              ),
              if (widget.onFullTest != null) ...[const SizedBox(height: 8), FilledButton(onPressed: widget.onFullTest, child: Text(t('Тести пурра: 20 савол')))],
            ],
          ],
        ),
      ),
    );
  }
}

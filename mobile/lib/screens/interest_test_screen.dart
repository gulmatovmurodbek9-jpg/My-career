import 'package:flutter/material.dart';

import '../app/interest_profiler.dart';
import '../app/settings.dart';
import '../app/theme.dart';
import '../ui/widgets.dart';
import 'method_screen.dart';

String _l(String tj, String ru, String en) => switch (appSettings.lang) {
  'ru' => ru,
  'en' => en,
  _ => tj,
};

// Тести шавқ (O*NET): 60 кор, дар ҳар экран 6 кор. Ҳисоб дар худи телефон; чизе фиристода намешавад.
class InterestTestScreen extends StatefulWidget {
  const InterestTestScreen({super.key});

  @override
  State<InterestTestScreen> createState() => _InterestTestScreenState();
}

class _InterestTestScreenState extends State<InterestTestScreen> {
  static const _perPage = 6;
  final _checked = <int>{};
  int _page = 0;
  bool _done = false;

  int get _pages => ipItems.length ~/ _perPage;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_l('Тести шавқ', 'Тест интересов', 'Interest test'))),
      body: _done ? _result() : _questions(),
    );
  }

  Widget _questions() {
    final start = _page * _perPage;
    return SafeArea(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          LinearProgressIndicator(value: (_page + 1) / _pages),
          Expanded(
            child: ListView(
              padding: AppSizes.page,
              children: [
                Text(_l('Кадом корҳоро кардан мехоҳед?', 'Чем бы вы хотели заниматься?', 'Which activities would you like to do?'), style: Theme.of(context).textTheme.headlineMedium),
                const SizedBox(height: 6),
                Text(
                  _l(
                    'Ба таҳсил ва маош нигоҳ накунед. Ҳар чанд кор, ки хоҳед, қайд кунед.',
                    'Не думайте об обучении и зарплате. Отметьте сколько угодно.',
                    'Do not think about education or pay. Tick as many as you like.',
                  ),
                  style: TextStyle(fontSize: 14, color: AppColors.textSoft),
                ),
                const SizedBox(height: 12),
                for (var i = start; i < start + _perPage; i++)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Material(
                      color: _checked.contains(i) ? AppColors.contractSoft : AppColors.card,
                      borderRadius: BorderRadius.circular(14),
                      child: CheckboxListTile(
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                          side: BorderSide(color: _checked.contains(i) ? AppColors.primary : AppColors.border),
                        ),
                        value: _checked.contains(i),
                        activeColor: AppColors.primary,
                        title: Text(_l(ipItems[i].tj, ipItems[i].ru, ipItems[i].en), style: TextStyle(fontSize: 15, color: AppColors.text)),
                        onChanged: (v) => setState(() => v == true ? _checked.add(i) : _checked.remove(i)),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
            child: Row(
              children: [
                if (_page > 0) ...[
                  Expanded(
                    child: OutlinedButton(onPressed: () => setState(() => _page--), child: Text(_l('Қафо', 'Назад', 'Back'))),
                  ),
                  const SizedBox(width: 10),
                ],
                Expanded(
                  flex: 2,
                  child: FilledButton(
                    onPressed: () => setState(() => _page < _pages - 1 ? _page++ : _done = true),
                    child: Text(_page < _pages - 1 ? '${_l('Давом', 'Далее', 'Next')} (${_page + 1}/$_pages)' : _l('Натиҷа', 'Результат', 'Result')),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _result() {
    final scores = {for (final k in ipTypes.keys) k: 0};
    for (final i in _checked) {
      scores[ipItems[i].type] = scores[ipItems[i].type]! + 1;
    }
    final ranked = scores.entries.toList()..sort((a, b) => b.value.compareTo(a.value));
    final tied = ranked[2].value == ranked[3].value && ranked[2].value > 0;
    if (_checked.isEmpty) {
      return Center(
        child: Padding(
          padding: AppSizes.page,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(_l('Ягон кор қайд нашуд.', 'Ничего не отмечено.', 'Nothing was ticked.'), style: TextStyle(fontSize: 16, color: AppColors.text)),
              const SizedBox(height: 12),
              FilledButton(onPressed: _restart, child: Text(_l('Аз нав', 'Заново', 'Start over'))),
            ],
          ),
        ),
      );
    }
    return ListView(
      padding: AppSizes.page,
      children: [
        Text(_l('Шавқҳои асосии шумо', 'Ваши главные интересы', 'Your main interests'), style: Theme.of(context).textTheme.headlineMedium),
        const SizedBox(height: 14),
        for (final e in ranked) _bar(e.key, e.value, ranked.indexOf(e) < 3 && e.value > 0),
        if (tied)
          Padding(
            padding: const EdgeInsets.only(top: 6),
            child: Text(
              _l(
                'Баъзе шавқҳо холи баробар доранд. Худатон бинед, ки кадомаш ба шумо наздиктар аст.',
                'У некоторых интересов равные баллы. Решите сами, какой вам ближе.',
                'Some interests are tied. Decide which one fits you better.',
              ),
              style: TextStyle(fontSize: 13.5, color: AppColors.textSoft),
            ),
          ),
        const SizedBox(height: 16),
        Text(
          _l(
            'Ин натиҷа шавқи шуморо нишон медиҳад, на қобилият ё ихтисоси ниҳоиро. Барои пайдо кардани ихтисосҳо тести асосиро супоред.',
            'Результат показывает ваши интересы, а не способности или окончательную специальность. Чтобы подобрать специальности, пройдите основной тест.',
            'This shows your interests, not your ability or a final specialty. Take the main test to find specialties.',
          ),
          style: TextStyle(fontSize: 14.5, height: 1.4, color: AppColors.text),
        ),
        const SizedBox(height: 16),
        FilledButton(onPressed: _restart, child: Text(_l('Аз нав', 'Заново', 'Start over'))),
        TextButton(onPressed: () => Navigator.of(context).push(smoothRoute(const MethodScreen())), child: Text(_l('Ин тест аз куҷост?', 'Откуда этот тест?', 'Where is this test from?'))),
      ],
    );
  }

  void _restart() => setState(() {
    _checked.clear();
    _page = 0;
    _done = false;
  });

  Widget _bar(String key, int score, bool top) {
    final type = ipTypes[key]!;
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  _l(type.tj, type.ru, type.en),
                  style: TextStyle(fontSize: 15.5, fontWeight: top ? FontWeight.w700 : FontWeight.w500, color: AppColors.text),
                ),
              ),
              Text(
                '$score/10',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.text),
              ),
            ],
          ),
          const SizedBox(height: 5),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(minHeight: 8, value: score / 10, backgroundColor: AppColors.muted, color: top ? AppColors.primary : AppColors.primary.withValues(alpha: 0.4)),
          ),
          if (top) ...[const SizedBox(height: 5), Text(_l(type.tjDesc, type.ruDesc, type.enDesc), style: TextStyle(fontSize: 13.5, color: AppColors.textSoft))],
        ],
      ),
    );
  }
}

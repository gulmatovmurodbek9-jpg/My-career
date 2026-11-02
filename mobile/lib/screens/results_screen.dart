import 'package:flutter/material.dart';

import '../api/api.dart';
import '../api/models.dart';
import '../app/last_result.dart';
import '../app/theme.dart';
import '../ui/widgets.dart';
import 'career_detail_screen.dart';
import 'careers_screen.dart';
import 'quiz_screen.dart';
import '../app/i18n.dart';

class ResultsScreen extends StatefulWidget {
  const ResultsScreen({super.key, required this.result, required this.requestBody, this.savedAdvice});
  final QuizResult result;
  final Map<String, dynamic> requestBody;
  final String? savedAdvice;

  @override
  State<ResultsScreen> createState() => _ResultsScreenState();
}

class _ResultsScreenState extends State<ResultsScreen> {
  String? _advice;
  bool _adviceFailed = false;

  @override
  void initState() {
    super.initState();
    if (widget.savedAdvice != null) {
      _advice = widget.savedAdvice;
    } else {
      _loadAdvice();
    }
  }

  // Натиҷа фавран нишон дода мешавад; маслиҳати AI баъд, алоҳида меояд.
  Future<void> _loadAdvice() async {
    try {
      final data = await Api.instance.post('/quiz/advice', widget.requestBody);
      final advice = '${data['aiAdvice'] ?? ''}'.trim();
      if (advice.isNotEmpty) lastResult.saveAdvice(advice);
      if (mounted) setState(() => _advice = advice);
    } catch (_) {
      if (mounted) setState(() => _adviceFailed = true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final r = widget.result;
    return Scaffold(
      appBar: AppBar(title: Text(t('Натиҷаи шумо'))),
      body: SafeArea(
        child: ListView(
          padding: AppSizes.page,
          children: [
            Container(
              padding: const EdgeInsets.all(22),
              decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(AppSizes.radius + 4)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (r.undecided.isEmpty) Text(t('Самти мувофиқи шумо'), style: TextStyle(fontSize: 17, color: Colors.white.withValues(alpha: 0.9))),
                  const SizedBox(height: 6),
                  Text(
                    r.undecided.isEmpty ? r.clusterName : t('Шавқи шумо ҳанӯз равшан нест'),
                    style: const TextStyle(fontSize: 23, fontWeight: FontWeight.w700, color: Colors.white, height: 1.2),
                  ),
                  const SizedBox(height: 12),
                  if (r.undecided.isEmpty)
                    Text(
                      t('Мувофиқат: {n}%', {'n': r.clusterPercent}),
                      style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600, color: Colors.white),
                    )
                  else
                    Text(t('Ин хато нест. Ҷавобҳоятон ба чанд самт баробар наздиканд.'), style: const TextStyle(fontSize: 15.5, color: Colors.white, height: 1.35)),
                ],
              ),
            ),
            if (r.undecided.isNotEmpty) _UndecidedCard(directions: r.undecided),
            SectionTitle(t('Маслиҳат')),
            AppCard(
              child: _advice != null && _advice!.isNotEmpty
                  ? Text(_advice!, style: text.bodyLarge)
                  : _adviceFailed
                  ? Text(t('Маслиҳат ҳоло наомад. Ихтисосҳои поёнро бинед.'), style: text.bodyMedium)
                  : Row(
                      children: [
                        const SizedBox(width: 26, height: 26, child: CircularProgressIndicator(strokeWidth: 3)),
                        const SizedBox(width: 14),
                        Expanded(child: Text(t('Маслиҳат тайёр мешавад…'), style: text.bodyMedium)),
                      ],
                    ),
            ),
            if (r.directions.isNotEmpty) ...[
              SectionTitle(t('Ҳамаи 5 самт')),
              AppCard(
                child: Column(
                  children: [for (final d in r.directions) _DirectionBar(name: d.key, percent: d.value)],
                ),
              ),
            ],
            SectionTitle(t('Ихтисосҳои мувофиқ ({n})', {'n': r.careers.length})),
            Text(t('Ба ихтисос пахш кунед, то маош ва донишгоҳҳоро бинед.'), style: text.bodyMedium),
            const SizedBox(height: 12),
            for (var i = 0; i < r.careers.length; i++) ...[_CareerResultCard(rank: i + 1, career: r.careers[i]), const SizedBox(height: 12)],
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: () => Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const QuizFlowScreen())),
              icon: const Icon(Icons.refresh_rounded, size: 28),
              label: Text(t('Тестро аз нав супоред')),
            ),
          ],
        ),
      ),
    );
  }
}

// Хонандаи дудил: ду-се самт баробар ва қадамҳо барои равшанӣ.
class _UndecidedCard extends StatelessWidget {
  const _UndecidedCard({required this.directions});
  final List<UndecidedDirection> directions;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 12),
        for (final d in directions) ...[
          AppCard(
            onTap: () => Navigator.of(context).push(smoothRoute(CareersScreen(clusterId: d.id, title: d.name))),
            child: Row(
              children: [
                Expanded(child: Text(d.name, style: text.titleMedium)),
                const SizedBox(width: 10),
                Text('${d.percent}%', style: text.titleMedium?.copyWith(color: AppColors.primary)),
              ],
            ),
          ),
          const SizedBox(height: 8),
        ],
        SectionTitle(t('Барои равшанӣ чӣ кор кунед')),
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(t('1. Дар ҳар самт 2–3 ихтисосро кушоед ва бинед, ки кадомаш ба шумо наздик аст.'), style: text.bodyLarge),
              const SizedBox(height: 8),
              Text(t('2. Бо волидон, омӯзгор ё касе, ки дар ин соҳа кор мекунад, сӯҳбат кунед.'), style: text.bodyLarge),
              const SizedBox(height: 8),
              Text(t('3. Пас аз як ҳафта тестро боз супоред ва натиҷаро муқоиса кунед.'), style: text.bodyLarge),
            ],
          ),
        ),
      ],
    );
  }
}

class _DirectionBar extends StatelessWidget {
  const _DirectionBar({required this.name, required this.percent});
  final String name;
  final int percent;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 8),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(child: Text(name, style: Theme.of(context).textTheme.titleMedium)),
            Text(
              '$percent%',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.primary),
            ),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(999),
          child: LinearProgressIndicator(value: percent.clamp(0, 100) / 100, minHeight: 12, backgroundColor: AppColors.contractSoft),
        ),
      ],
    ),
  );
}

class _CareerResultCard extends StatelessWidget {
  const _CareerResultCard({required this.rank, required this.career});
  final int rank;
  final MatchedCareer career;

  @override
  Widget build(BuildContext context) => AppCard(
    onTap: () => Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => CareerDetailScreen(careerId: career.id, title: career.name),
      ),
    ),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        CircleAvatar(
          radius: 17,
          backgroundColor: AppColors.contractSoft,
          child: Text(
            '$rank',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.primary),
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(career.name, style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(999),
                      child: LinearProgressIndicator(value: career.percent.clamp(0, 100) / 100, minHeight: 10, backgroundColor: AppColors.contractSoft),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    '${career.percent}%',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.primary),
                  ),
                ],
              ),
              if (career.universitiesCount > 0) ...[
                const SizedBox(height: 10),
                Text(
                  t('Дар {n} муассиса: {names}', {'n': career.universitiesCount, 'names': career.universityNames.join(', ')}),
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 14.5, height: 1.35, color: AppColors.textSoft),
                ),
                const SizedBox(height: 4),
                Text(
                  [
                    if (career.free) t('Ҷойи буҷетӣ ҳаст') else t('Ҷойи буҷетӣ нест'),
                    if (career.minFee != null) t('Шартнома аз {n} сомонӣ', {'n': career.minFee}),
                    if (career.local) t('Дар шаҳри шумо'),
                    if (career.affordable == false) t('Аз маблағи гуфтаи шумо гаронтар аст'),
                  ].join(' · '),
                  style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.w600, color: AppColors.primary),
                ),
              ],
            ],
          ),
        ),
        Icon(Icons.chevron_right_rounded, size: 26, color: AppColors.textSoft),
      ],
    ),
  );
}

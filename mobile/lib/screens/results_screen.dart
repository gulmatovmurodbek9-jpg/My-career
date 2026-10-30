import 'package:flutter/material.dart';

import '../api/api.dart';
import '../api/models.dart';
import '../app/theme.dart';
import '../ui/widgets.dart';
import 'career_detail_screen.dart';
import 'quiz_screen.dart';
import '../app/i18n.dart';

class ResultsScreen extends StatefulWidget {
  const ResultsScreen({super.key, required this.result, required this.requestBody});
  final QuizResult result;
  final Map<String, dynamic> requestBody;

  @override
  State<ResultsScreen> createState() => _ResultsScreenState();
}

class _ResultsScreenState extends State<ResultsScreen> {
  String? _advice;
  bool _adviceFailed = false;

  @override
  void initState() {
    super.initState();
    _loadAdvice();
  }

  // Натиҷа фавран нишон дода мешавад; маслиҳати AI баъд, алоҳида меояд.
  Future<void> _loadAdvice() async {
    try {
      final data = await Api.instance.post('/quiz/advice', widget.requestBody);
      if (mounted) setState(() => _advice = '${data['aiAdvice'] ?? ''}'.trim());
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
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(t('Самти мувофиқи шумо'), style: TextStyle(fontSize: 17, color: Colors.white.withValues(alpha: 0.9))),
                const SizedBox(height: 6),
                Text(r.clusterName, style: const TextStyle(fontSize: 23, fontWeight: FontWeight.w700, color: Colors.white, height: 1.2)),
                const SizedBox(height: 12),
                Text(t('Мувофиқат: {n}%', {'n': r.clusterPercent}), style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600, color: Colors.white)),
              ]),
            ),
            SectionTitle(t('Маслиҳат')),
            AppCard(
              child: _advice != null && _advice!.isNotEmpty
                  ? Text(_advice!, style: text.bodyLarge)
                  : _adviceFailed
                      ? Text(t('Маслиҳат ҳоло наомад. Ихтисосҳои поёнро бинед.'), style: text.bodyMedium)
                      : Row(children: [
                          const SizedBox(width: 26, height: 26, child: CircularProgressIndicator(strokeWidth: 3)),
                          const SizedBox(width: 14),
                          Expanded(child: Text(t('Маслиҳат тайёр мешавад…'), style: text.bodyMedium)),
                        ]),
            ),
            if (r.directions.isNotEmpty) ...[
              SectionTitle(t('Ҳамаи 5 самт')),
              AppCard(
                child: Column(children: [
                  for (final d in r.directions) _DirectionBar(name: d.key, percent: d.value),
                ]),
              ),
            ],
            SectionTitle(t('Ихтисосҳои мувофиқ ({n})', {'n': r.careers.length})),
            Text(t('Ба ихтисос пахш кунед, то маош ва донишгоҳҳоро бинед.'), style: text.bodyMedium),
            const SizedBox(height: 12),
            for (var i = 0; i < r.careers.length; i++) ...[
              _CareerResultCard(rank: i + 1, career: r.careers[i]),
              const SizedBox(height: 12),
            ],
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

class _DirectionBar extends StatelessWidget {
  const _DirectionBar({required this.name, required this.percent});
  final String name;
  final int percent;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Expanded(child: Text(name, style: Theme.of(context).textTheme.titleMedium)),
            Text('$percent%', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.primary)),
          ]),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(value: percent.clamp(0, 100) / 100, minHeight: 12, backgroundColor: AppColors.contractSoft),
          ),
        ]),
      );
}

class _CareerResultCard extends StatelessWidget {
  const _CareerResultCard({required this.rank, required this.career});
  final int rank;
  final MatchedCareer career;

  @override
  Widget build(BuildContext context) => AppCard(
        onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => CareerDetailScreen(careerId: career.id, title: career.name))),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          CircleAvatar(radius: 17, backgroundColor: AppColors.contractSoft, child: Text('$rank', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.primary))),
          const SizedBox(width: 14),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(career.name, style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              Row(children: [
                Expanded(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(999),
                    child: LinearProgressIndicator(value: career.percent.clamp(0, 100) / 100, minHeight: 10, backgroundColor: AppColors.contractSoft),
                  ),
                ),
                const SizedBox(width: 10),
                Text('${career.percent}%', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.primary)),
              ]),
              if (career.free) ...[
                const SizedBox(height: 10),
                Badge2(t('Ҷойи буҷетӣ ҳаст'), color: AppColors.budget, background: AppColors.budgetSoft),
              ],
            ]),
          ),
          const Icon(Icons.chevron_right_rounded, size: 26, color: AppColors.textSoft),
        ]),
      );
}

import 'package:flutter/material.dart';

import '../app/config.dart';
import '../app/i18n.dart';
import '../app/theme.dart';
import '../ui/widgets.dart';
import 'career_sections.dart';

// Саҳифаи алоҳида: «Як рӯзи корӣ» — вақтҳо, ҷиҳатҳои мусбат ва манфӣ. Маълумот аз /trial/career/:id.
class CareerDayScreen extends StatelessWidget {
  const CareerDayScreen({super.key, required this.careerId, required this.careerName, required this.trial});
  final String careerId;
  final String careerName;
  final Map<String, dynamic> trial;

  static List<String> _list(dynamic v) => v is List ? v.map((e) => '$e').toList() : const [];

  @override
  Widget build(BuildContext context) {
    final day = trial['day'] is List ? (trial['day'] as List).map((e) => Map<String, dynamic>.from(e)).toList() : const <Map<String, dynamic>>[];
    final pros = _list(trial['pros']);
    final cons = _list(trial['cons']);
    return Scaffold(
      appBar: AppBar(title: Text(t('Як рӯзи корӣ'))),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
          children: [
            Text(
              careerName,
              style: TextStyle(fontFamily: AppFonts.display, fontSize: 21, fontWeight: FontWeight.w700, color: AppColors.text, height: 1.2),
            ),
            if ('${trial['place'] ?? ''}'.isNotEmpty) ...[
              const SizedBox(height: 5),
              Row(
                children: [
                  Icon(Icons.place_rounded, size: 15, color: AppColors.textSoft),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text('${trial['place']}', style: TextStyle(fontSize: 13, color: AppColors.textSoft)),
                  ),
                ],
              ),
            ],
            const SizedBox(height: 16),
            if (day.isNotEmpty)
              CareerSection(
                icon: Icons.wb_sunny_rounded,
                color: sectionAmber,
                title: t('Як рӯзи корӣ — аз субҳ то шом'),
                child: Column(
                  children: [for (var i = 0; i < day.length; i++) _TimelineRow(time: '${day[i]['time'] ?? ''}', text: '${day[i]['text'] ?? ''}', last: i == day.length - 1)],
                ),
              ),
            if (pros.isNotEmpty) ...[const SizedBox(height: 14), _ProsCons(title: t('Ҷиҳатҳои мусбат'), items: pros, icon: Icons.add_circle_rounded, color: AppColors.budget)],
            if (cons.isNotEmpty) ...[const SizedBox(height: 14), _ProsCons(title: t('Ҷиҳатҳои манфӣ'), items: cons, icon: Icons.remove_circle_rounded, color: AppColors.danger)],
            const SizedBox(height: 16),
            GradientButton(label: t('Худро дар касб санҷед'), height: 50, onPressed: () => openLink('$siteUrl/trial/career/$careerId')),
          ],
        ),
      ),
    );
  }
}

class _TimelineRow extends StatelessWidget {
  const _TimelineRow({required this.time, required this.text, required this.last});
  final String time;
  final String text;
  final bool last;

  @override
  Widget build(BuildContext context) => IntrinsicHeight(
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Column(
          children: [
            const SizedBox(height: 4),
            Container(
              width: 10,
              height: 10,
              decoration: BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
            ),
            if (!last) Expanded(child: Container(width: 2, color: AppColors.primary.withValues(alpha: 0.25))),
          ],
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Padding(
            padding: EdgeInsets.only(bottom: last ? 0 : 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  time,
                  style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: AppColors.primary),
                ),
                const SizedBox(height: 3),
                Text(text, style: TextStyle(fontSize: 14.5, color: AppColors.text, height: 1.42)),
              ],
            ),
          ),
        ),
      ],
    ),
  );
}

class _ProsCons extends StatelessWidget {
  const _ProsCons({required this.title, required this.items, required this.icon, required this.color});
  final String title;
  final List<String> items;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) => CareerSection(
    icon: icon,
    color: color,
    title: title,
    child: Column(
      children: [
        for (final item in items)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.only(top: 2),
                  child: Icon(icon, size: 16, color: color),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(item, style: TextStyle(fontSize: 14, color: AppColors.text, height: 1.4)),
                ),
              ],
            ),
          ),
      ],
    ),
  );
}

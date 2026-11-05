import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../api/api.dart';
import '../api/models.dart';
import '../app/i18n.dart';
import '../app/settings.dart';
import '../app/subjects.dart';
import '../app/theme.dart';
import '../ui/widgets.dart';
import 'career_detail_screen.dart';
import 'careers_screen.dart';
import 'universities_screen.dart';

const _site = 'https://ikhtisosiman.qobus.tj';

// Корти болоии натиҷа ҳамчун сурат (мисли ShareResult-и сайт) ба Telegram, WhatsApp ва ғ.
Future<void> shareResultCard(GlobalKey cardKey, QuizResult result) async {
  final text = '${t('Натиҷаи тести касбии ман: {name}', {'name': result.clusterName})} $_site';
  try {
    final boundary = cardKey.currentContext?.findRenderObject() as RenderRepaintBoundary?;
    if (boundary == null) throw StateError('no card');
    final image = await boundary.toImage(pixelRatio: 3);
    final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
    final file = File('${(await getTemporaryDirectory()).path}/ikhtisosi-man-natija.png');
    await file.writeAsBytes(bytes!.buffer.asUint8List());
    await SharePlus.instance.share(ShareParams(files: [XFile(file.path)], text: text));
  } catch (_) {
    await SharePlus.instance.share(ShareParams(text: text));
  }
}

// «Чаро ин натиҷа?»: ҷавобҳое, ки ба самти асосӣ хол доданд.
class WhyResultCard extends StatelessWidget {
  const WhyResultCard({super.key, required this.result, required this.why});
  final QuizResult result;
  final List<Map<String, dynamic>> why;

  @override
  Widget build(BuildContext context) {
    final key = 'c${result.clusterNumber}';
    final gave = why.where((item) => ((item['scores'] as Map?)?[key] ?? 0) is num && ((item['scores'] as Map?)?[key] ?? 0) > 0).toList();
    if (gave.isEmpty) return const SizedBox.shrink();
    return AppCard(
      padding: EdgeInsets.zero,
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
          title: Text(t('Чаро ин натиҷа?'), style: Theme.of(context).textTheme.titleMedium),
          subtitle: Text(t('{n} ҷавоби шумо ба ин самт ишора кард', {'n': gave.length}), style: TextStyle(color: AppColors.textSoft)),
          children: [
            for (final item in gave)
              Padding(
                padding: const EdgeInsets.only(top: 10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('${item['q']}', style: TextStyle(fontSize: 14, color: AppColors.textSoft)),
                    const SizedBox(height: 2),
                    Text(
                      '${item['a']}',
                      style: TextStyle(fontSize: 15.5, fontWeight: FontWeight.w600, color: AppColors.text),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}

// Фанҳои муҳими самт, ки хонанда ҳамчун фанни қавӣ қайд накард.
class WeakSubjectsCard extends StatelessWidget {
  const WeakSubjectsCard({super.key, required this.result, required this.strong});
  final QuizResult result;
  final List<String> strong;

  @override
  Widget build(BuildContext context) {
    final needed = clusterSubjects[result.clusterNumber] ?? const [];
    final missing = needed.where((key) => !strong.contains(key)).toList();
    if (strong.isEmpty || missing.isEmpty || result.undecided.isNotEmpty) return const SizedBox.shrink();
    final names = missing.map((key) => subjectName(key, appSettings.lang)).join(', ');
    return Padding(
      padding: const EdgeInsets.only(top: 12),
      child: AppCard(
        child: Text(
          t('Барои самти «{name}» фанҳои {subjects} муҳиманд, вале шумо онҳоро қавӣ нагуфтед. Ба онҳо диққат диҳед ё самтҳои дигарро ҳам бинед.', {'name': result.clusterName, 'subjects': names}),
          style: Theme.of(context).textTheme.bodyLarge,
        ),
      ),
    );
  }
}

// Қадамҳои навбатӣ баъди натиҷа.
class ResultActions extends StatelessWidget {
  const ResultActions({super.key, required this.result});
  final QuizResult result;

  @override
  Widget build(BuildContext context) {
    void open(Widget page) => Navigator.of(context).push(smoothRoute(page));
    final first = result.careers.isEmpty ? null : result.careers.first;
    Widget row(IconData icon, String label, VoidCallback onTap) => AppCard(
      onTap: onTap,
      child: Row(
        children: [
          Icon(icon, color: AppColors.primary),
          const SizedBox(width: 14),
          Expanded(child: Text(label, style: Theme.of(context).textTheme.titleMedium)),
          Icon(Icons.chevron_right_rounded, color: AppColors.textSoft),
        ],
      ),
    );
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (result.clusterId.isNotEmpty) ...[
          row(Icons.work_outline_rounded, t('Ҳамаи ихтисосҳои ин самт'), () => open(CareersScreen(clusterId: result.clusterId, title: result.clusterName))),
          const SizedBox(height: 8),
        ],
        if (first != null) ...[
          row(Icons.wb_sunny_outlined, t('«Як рӯз дар ихтисос»: {name}', {'name': first.name}), () => open(CareerDetailScreen(careerId: first.id, title: first.name))),
          const SizedBox(height: 8),
        ],
        row(Icons.school_outlined, t('Донишгоҳ ва коллеҷҳо'), () => open(const UniversitiesScreen())),
      ],
    );
  }
}

// Фикри волидонро пурсидан: пайванд ба сайт (/parent/:code), ҷавоб баъд дар ҳамин ҷо.
class ParentInviteCard extends StatefulWidget {
  const ParentInviteCard({super.key, required this.result});
  final QuizResult result;

  @override
  State<ParentInviteCard> createState() => _ParentInviteCardState();
}

class _ParentInviteCardState extends State<ParentInviteCard> {
  final _name = TextEditingController();
  String? _code;
  String? _secret;
  Map<String, dynamic>? _answer;
  bool _busy = false;
  bool _failed = false;

  @override
  void initState() {
    super.initState();
    _restore();
  }

  @override
  void dispose() {
    _name.dispose();
    super.dispose();
  }

  Future<void> _restore() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _code = prefs.getString('parent_invite_code');
      _secret = prefs.getString('parent_invite_secret');
    });
    _check();
  }

  Future<void> _check() async {
    if (_code == null) return;
    try {
      final data = await Api.instance.get('/parents/invites/$_code/result', {'secret': _secret ?? ''});
      if (mounted) setState(() => _answer = Map<String, dynamic>.from(data));
    } catch (_) {}
  }

  Future<void> _create() async {
    setState(() {
      _busy = true;
      _failed = false;
    });
    try {
      final data = await Api.instance.post('/parents/invites', {
        'childName': _name.text.trim(),
        'scores': widget.result.scores,
        'lang': appSettings.lang,
        'careers': [
          for (final c in widget.result.careers.take(12)) {'id': c.id, 'name': c.name, 'percent': c.percent},
        ],
      });
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('parent_invite_code', '${data['code']}');
      await prefs.setString('parent_invite_secret', '${data['secret']}');
      setState(() {
        _code = '${data['code']}';
        _secret = '${data['secret']}';
      });
      await _share();
    } catch (_) {
      setState(() => _failed = true);
    }
    if (mounted) setState(() => _busy = false);
  }

  Future<void> _share() => SharePlus.instance.share(ShareParams(text: '${t('Ихтисосҳои ман ва натиҷаи тестро бинед ва фикри худро гӯед:')} $_site/parent/$_code'));

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final answered = _answer?['answered'] == true;
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(t('Фикри волидонро пурсед'), style: text.titleMedium),
          const SizedBox(height: 6),
          if (_code == null) ...[
            Text(t('Ба волидон пайванд фиристед: онҳо натиҷаи шуморо мебинанд ва фикри худро мегӯянд. Бақайдгирӣ лозим нест.'), style: text.bodyMedium),
            const SizedBox(height: 10),
            TextField(
              controller: _name,
              decoration: InputDecoration(hintText: t('Номи шумо'), isDense: true),
            ),
            const SizedBox(height: 10),
            FilledButton(onPressed: _busy ? null : _create, child: Text(t('Пайванд фиристодан'))),
            if (_failed) ...[const SizedBox(height: 8), Text(t('Пайванд сохта нашуд. Интернетро санҷед.'), style: text.bodyMedium)],
          ] else if (answered) ...[
            Text(t('Волидон ҷавоб доданд.'), style: text.bodyLarge),
            if ('${_answer?['wish'] ?? ''}'.trim().isNotEmpty) ...[const SizedBox(height: 6), Text('«${_answer!['wish']}»', style: text.bodyLarge?.copyWith(fontStyle: FontStyle.italic))],
          ] else ...[
            Text(t('Интизори ҷавоби волидон…'), style: text.bodyMedium),
            const SizedBox(height: 10),
            OutlinedButton(onPressed: _share, child: Text(t('Пайвандро боз фиристодан'))),
            TextButton(onPressed: _check, child: Text(t('Санҷидан'))),
          ],
        ],
      ),
    );
  }
}

// Баҳо ба натиҷа ва «дар ММТ кадом кластерро интихоб кардед?» (мисли QuizFeedback-и сайт).
class QuizFeedbackCard extends StatefulWidget {
  const QuizFeedbackCard({super.key, required this.attemptId});
  final String attemptId;

  @override
  State<QuizFeedbackCard> createState() => _QuizFeedbackCardState();
}

class _QuizFeedbackCardState extends State<QuizFeedbackCard> {
  int? _rating;
  int? _ntc;
  bool _sent = false;
  final _comment = TextEditingController();

  static const _clusters = ['1. Табиӣ ва техникӣ', '2. Иқтисод ва география', '3. Филология, педагогика ва санъат', '4. Ҷомеашиносӣ ва ҳуқуқ', '5. Тиб, биология ва варзиш'];

  @override
  void dispose() {
    _comment.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    try {
      await Future.wait([
        if (_ntc != null) Api.instance.post('/quiz/ntc-choice', {'attemptId': widget.attemptId, 'cluster': _ntc}),
        if (_rating != null) Api.instance.post('/quiz/feedback', {'attemptId': widget.attemptId, 'rating': _rating, if (_comment.text.trim().isNotEmpty) 'comment': _comment.text.trim()}),
      ]);
    } catch (_) {
      // Нарасид — корбарро озор намедиҳем, мисли сайт.
    }
    if (mounted) setState(() => _sent = true);
  }

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    if (widget.attemptId.isEmpty) return const SizedBox.shrink();
    if (_sent) return AppCard(child: Text(t('Ташаккур! Ҷавобҳои шумо сабт шуданд.'), style: text.bodyLarge));
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(t('Натиҷа ба шумо писанд омад?'), style: text.titleMedium),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              for (var value = 1; value <= 5; value++)
                IconButton(
                  tooltip: '$value',
                  onPressed: () => setState(() => _rating = value),
                  icon: Icon(value <= (_rating ?? 0) ? Icons.star_rounded : Icons.star_outline_rounded, size: 36, color: AppColors.primary),
                ),
            ],
          ),
          if (_rating != null && _rating! <= 3) ...[
            TextField(
              controller: _comment,
              maxLength: 500,
              decoration: InputDecoration(hintText: t('Чӣ нодуруст буд? (ихтиёрӣ)'), isDense: true, counterText: ''),
            ),
            const SizedBox(height: 8),
          ],
          const SizedBox(height: 8),
          Text(t('Дар ММТ кадом кластерро интихоб кардед ё мекунед?'), style: text.titleMedium),
          const SizedBox(height: 8),
          DropdownButtonFormField<int>(
            initialValue: _ntc,
            isExpanded: true,
            hint: Text(t('Интихоб кунед')),
            onChanged: (value) => setState(() => _ntc = value),
            items: [
              for (var i = 0; i < _clusters.length; i++) DropdownMenuItem(value: i + 1, child: Text(t(_clusters[i]))),
              DropdownMenuItem(value: 0, child: Text(t('Ҳанӯз намедонам'))),
            ],
          ),
          const SizedBox(height: 12),
          FilledButton(onPressed: _rating == null && _ntc == null ? null : _send, child: Text(t('Фиристодан'))),
        ],
      ),
    );
  }
}

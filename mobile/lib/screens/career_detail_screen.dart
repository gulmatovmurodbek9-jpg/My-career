import 'package:flutter/material.dart';

import '../api/api.dart';
import '../api/models.dart';
import '../app/auth.dart';
import '../app/career_refs.dart';
import '../app/clusters.dart';
import '../app/config.dart';
import '../app/i18n.dart';
import '../app/settings.dart';
import '../app/theme.dart';
import '../ui/widgets.dart';
import 'auth/login_screen.dart';
import 'career_day_screen.dart';
import 'career_sections.dart';
import 'university_detail_screen.dart';

// Саҳифаи ихтисос — мисли саҳифаи сайт, бо тартиби барои телефон:
// дар бораи касб → дар куҷо омӯхтан → ёвари AI → чаро → мақсад → 10 сол → бал → маош → …
class CareerDetailScreen extends StatefulWidget {
  const CareerDetailScreen({super.key, required this.careerId, required this.title});
  final String careerId;
  final String title;

  @override
  State<CareerDetailScreen> createState() => _CareerDetailScreenState();
}

class _CareerDetailScreenState extends State<CareerDetailScreen> {
  Career? _career;
  List<Offering> _offerings = [];
  Map<String, dynamic>? _trial;
  Map<String, dynamic>? _quizScores;
  Set<String> _planIds = {};
  String? _planBusy;
  String? _error;
  bool _liked = false;
  bool _saved = false;
  int _likes = 0;
  bool _showAllOffers = false;
  bool _fullText = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _error = null);
    try {
      final results = await Future.wait([
        Api.instance.get('/careers/${widget.careerId}'),
        Api.instance.get('/careers/${widget.careerId}/offerings', {if (appSettings.grade != null) 'grade': '${appSettings.grade}'}),
      ]);
      if (!mounted) return;
      final career = Career.fromJson(Map<String, dynamic>.from(results[0]));
      setState(() {
        _career = career;
        _likes = career.likes;
        _offerings = (results[1] as List).map((e) => Offering.fromJson(Map<String, dynamic>.from(e))).toList();
      });
      _loadTrial();
      _loadPersonal();
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    }
  }

  Future<void> _loadTrial() async {
    try {
      final data = await Api.instance.get('/trial/career/${widget.careerId}');
      if (mounted && data is Map) setState(() => _trial = Map<String, dynamic>.from(data));
    } catch (_) {
      // Сенария ҳанӯз нест — тугмаи «Як рӯзи корӣ» нишон дода намешавад.
    }
  }

  // Писанд, захира, рӯйхати ҳуҷҷатсупорӣ ва холҳои тест — танҳо барои корбари воридшуда.
  Future<void> _loadPersonal() async {
    if (!authStore.isLoggedIn) return;
    try {
      final results = await Future.wait([Api.instance.getFresh('/users/profile'), Api.instance.getFresh('/users/application-plan')]);
      if (!mounted) return;
      final profile = results[0];
      final plan = results[1];
      bool has(dynamic list) => list is List && list.any((c) => c is Map && c['id'] == widget.careerId);
      setState(() {
        if (profile is Map) {
          _liked = has(profile['likedCareers']);
          _saved = has(profile['savedCareers']);
          final quiz = profile['quizResults'];
          if (quiz is Map && quiz['mmtClusters'] is Map) _quizScores = Map<String, dynamic>.from(quiz['mmtClusters']);
        }
        if (plan is Map && plan['items'] is List) {
          _planIds = (plan['items'] as List).map((e) => '${e['offeringId']}').toSet();
        }
      });
    } catch (_) {
      // Ин маълумоти иловагӣ аст; саҳифа бе он ҳам кор мекунад.
    }
  }

  bool _needLogin() {
    if (authStore.isLoggedIn) return false;
    Navigator.of(context).push(authRoute(const LoginScreen()));
    return true;
  }

  void _snack(String message) => ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(message)));

  Future<void> _toggleLike() async {
    if (_needLogin()) return;
    try {
      final data = await Api.instance.post('/careers/${widget.careerId}/like', {});
      if (!mounted) return;
      setState(() {
        _liked = data['liked'] == true;
        _likes = (data['likesCount'] as num?)?.toInt() ?? _likes;
      });
    } on ApiException catch (e) {
      if (mounted) _snack(e.message);
    }
  }

  Future<void> _toggleSave() async {
    if (_needLogin()) return;
    try {
      final data = await Api.instance.post('/users/save-career/${widget.careerId}', {});
      if (mounted) setState(() => _saved = data['saved'] == true);
    } on ApiException catch (e) {
      if (mounted) _snack(e.message);
    }
  }

  Future<void> _togglePlan(String offeringId) async {
    if (_needLogin() || _planBusy != null) return;
    setState(() => _planBusy = offeringId);
    try {
      if (_planIds.contains(offeringId)) {
        await Api.instance.delete('/users/application-plan/$offeringId');
        _planIds = {..._planIds}..remove(offeringId);
      } else {
        await Api.instance.post('/users/application-plan/$offeringId', {});
        _planIds = {..._planIds, offeringId};
        if (mounted) _snack(t('Ба рӯйхати ҳуҷҷатсупорӣ илова шуд'));
      }
    } on ApiException catch (e) {
      if (!mounted) return;
      // Дар рӯйхат ихтисоси кластери дигар ҳаст: сервер пешниҳод мекунад, ки аз нав сар кунем.
      if (e.status == 409 && e.code != 'PLAN_FULL') {
        final clear = await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            content: Text(e.message),
            actions: [
              TextButton(onPressed: () => Navigator.pop(context, false), child: Text(t('Не'))),
              TextButton(onPressed: () => Navigator.pop(context, true), child: Text(t('Рӯйхатро тоза карда, илова кунед'))),
            ],
          ),
        );
        if (clear == true) {
          try {
            await Api.instance.delete('/users/application-plan');
            await Api.instance.post('/users/application-plan/$offeringId', {});
            _planIds = {offeringId};
          } on ApiException catch (e2) {
            if (mounted) _snack(e2.message);
          }
        }
      } else {
        _snack(e.message);
      }
    }
    if (mounted) setState(() => _planBusy = null);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(t('Ихтисос')),
        actions: _career == null
            ? null
            : [
                TextButton.icon(
                  onPressed: _toggleLike,
                  icon: Icon(_liked ? Icons.favorite_rounded : Icons.favorite_border_rounded, size: 20, color: _liked ? AppColors.danger : AppColors.textSoft),
                  label: Text(
                    '$_likes',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.text),
                  ),
                ),
                IconButton(
                  tooltip: t('Захира'),
                  onPressed: _toggleSave,
                  icon: Icon(_saved ? Icons.bookmark_rounded : Icons.bookmark_border_rounded, color: _saved ? AppColors.primary : AppColors.textSoft),
                ),
                const SizedBox(width: 4),
              ],
      ),
      body: SafeArea(
        child: _error != null
            ? ErrorView(message: _error!, onRetry: _load)
            : _career == null
            ? const LoadingView()
            : _content(_career!),
      ),
    );
  }

  Widget _content(Career c) {
    const gap = SizedBox(height: 14);
    final certs = usefulCertificates(c.certificates);
    final related = c.related.toSet().where((s) => s != c.name && s != c.nameTj).toList();
    final hasResources = c.books.isNotEmpty || c.courses.isNotEmpty || c.blogs.isNotEmpty;
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 28),
      children: [
        _hero(c),
        gap,
        _about(c),
        gap,
        _whereToStudy(c),
        gap,
        CareerAiChat(careerId: c.id),
        if (c.purpose.isNotEmpty) ...[
          gap,
          CareerSection(
            icon: Icons.track_changes_rounded,
            color: sectionBlue,
            title: t('Мақсади ихтисос'),
            subtitle: t('Ин ихтисос барои чӣ зарур аст'),
            child: Text(c.purpose, style: TextStyle(fontSize: 14.5, color: AppColors.text, height: 1.5)),
          ),
        ],
        gap,
        CareerFutureSection(careerId: c.id),
        gap,
        AdmissionScoresSection(careerId: c.id),
        if (_quizScores != null) ...[gap, QuizScoresSection(scores: _quizScores!, careerCluster: c.clusterNumber)],
        gap,
        SalarySection(career: c),
        if (c.technicalSkills.isNotEmpty || c.softSkills.isNotEmpty || c.technologies.isNotEmpty) ...[gap, SkillsSection(career: c)],
        if (c.projects.isNotEmpty) ...[
          gap,
          SimpleListSection(icon: Icons.apartment_rounded, color: sectionOrange, title: t('Намунаҳои лоиҳаҳо'), subtitle: t('Чӣ лоиҳаҳо метавонед эҷод кунед'), items: c.projects),
        ],
        if (c.jobs.isNotEmpty) ...[
          gap,
          SimpleListSection(icon: Icons.work_rounded, color: sectionBlue, title: t('Дар куҷо кор карда метавонед'), subtitle: t('Бо ин ихтисос дар ин ҷойҳо кор мекунанд'), items: c.jobs),
        ],
        if (certs.isNotEmpty) ...[gap, CertificatesSection(names: certs)],
        if (hasResources) ...[gap, ResourcesSection(career: c)],
        if (related.isNotEmpty) ...[gap, RelatedSection(names: related)],
        if (c.advice.isNotEmpty) ...[gap, AdviceCard(text: c.advice)],
        if (_trial != null && _trial!['day'] is List && (_trial!['day'] as List).isNotEmpty) ...[gap, _dayCard(c)],
        gap,
        _trialCard(c),
      ],
    );
  }

  // Сарлавҳа: кабуди чуқур, мисли корти тест дар саҳифаи асосӣ.
  Widget _hero(Career c) {
    final cluster = clusterTitle(c.clusterNumber, c.cluster);
    final info = clusters.where((e) => e.number == c.clusterNumber).firstOrNull;
    final facts = <(String, String)>[
      if (c.degree.isNotEmpty) (t('Дараҷа'), offerLabel(c.degree)),
      if (c.years != null) (t('Мӯҳлат'), t('{n} сол', {'n': c.years})),
      if (c.minFee != null && c.minFee! > 0) (t('Нархи таҳсил'), t('аз {n} сомонӣ', {'n': money(c.minFee!)})),
      if (c.hasFreeSeats) (t('Ҷойҳои ройгон'), t('Ҳаст')),
      if (c.code.isNotEmpty) (t('Коди ММТ'), c.code),
    ];
    Widget fact((String, String) f) => Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(f.$1, style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.65))),
        const SizedBox(height: 2),
        Text(
          f.$2,
          style: const TextStyle(fontSize: 14.5, fontWeight: FontWeight.w600, color: Colors.white),
        ),
      ],
    );
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(22),
        gradient: const LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [Color(0xFF0B1F57), Color(0xFF1739A6), Color(0xFF2F5FE8)], stops: [0, 0.55, 1]),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Кластер — аввалин чизе, ки чашм мебинад: рақам ва ном, бе фон.
          if (cluster.isNotEmpty)
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(info?.icon ?? Icons.hub_rounded, size: 26, color: Colors.white),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (c.clusterNumber != null)
                        Text(
                          t('Кластери {n}', {'n': c.clusterNumber}).toUpperCase(),
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 0.8, color: Colors.white.withValues(alpha: 0.65)),
                        ),
                      Text(
                        cluster,
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: Colors.white, height: 1.25),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          const SizedBox(height: 16),
          Text(
            c.name,
            style: const TextStyle(fontFamily: AppFonts.display, fontSize: 23, fontWeight: FontWeight.w700, color: Colors.white, height: 1.2),
          ),
          if (facts.isNotEmpty) ...[
            const SizedBox(height: 16),
            Container(height: 1, color: Colors.white.withValues(alpha: 0.18)),
            const SizedBox(height: 14),
            for (var i = 0; i < facts.length; i += 2)
              Padding(
                padding: EdgeInsets.only(bottom: i + 2 < facts.length ? 12 : 0),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(child: fact(facts[i])),
                    const SizedBox(width: 12),
                    Expanded(child: i + 1 < facts.length ? fact(facts[i + 1]) : const SizedBox.shrink()),
                  ],
                ),
              ),
          ],
        ],
      ),
    );
  }

  Widget _about(Career c) {
    final text = c.description.isNotEmpty ? c.description : c.purpose;
    if (text.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          text,
          maxLines: _fullText ? null : 5,
          overflow: _fullText ? null : TextOverflow.ellipsis,
          style: TextStyle(fontSize: 14.5, color: AppColors.text, height: 1.5),
        ),
        if (text.length > 220)
          TextButton(
            style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: const Size(0, 34), tapTargetSize: MaterialTapTargetSize.shrinkWrap),
            onPressed: () => setState(() => _fullText = !_fullText),
            child: Text(_fullText ? t('Камтар') : t('Бештар хондан')),
          ),
        if (!c.contentWritten) ...[
          const SizedBox(height: 6),
          Container(
            padding: const EdgeInsets.all(11),
            decoration: BoxDecoration(color: AppColors.warning.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(14)),
            child: Text(
              t('Тавсифи муфассали ин ихтисос ҳанӯз навишта мешавад. Маълумоти расмӣ аз Маркази миллии тестӣ гирифта шудааст.'),
              style: TextStyle(fontSize: 12.5, color: AppColors.text, height: 1.4),
            ),
          ),
        ],
      ],
    );
  }

  // «Дар куҷо омӯхтан мумкин»: кӯтоҳ — хулоса ва ду пешниҳоди аввал; боқӣ бо як пахш.
  Widget _whereToStudy(Career c) {
    final grade9 = appSettings.grade == 9;
    if (_offerings.isEmpty) {
      return CareerSection(
        icon: Icons.school_rounded,
        color: sectionCyan,
        title: t('Дар куҷо омӯхтан мумкин аст'),
        child: Text(grade9 ? t('Баъди синфи 9 ин ихтисосро дар коллеҷ намехонанд.') : t('Ҳоло ягон муассиса ин ихтисосро қабул намекунад.'), style: TextStyle(fontSize: 14, color: AppColors.text)),
      );
    }
    final sorted = [..._offerings]..sort((a, b) => (b.free ? 1 : 0) - (a.free ? 1 : 0));
    final places = _offerings.map((o) => o.universityName).toSet().length;
    final freeCount = _offerings.where((o) => o.free).length;
    final fees = _offerings.where((o) => !o.free && o.fee != null && o.fee! > 0).map((o) => o.fee!).toList()..sort();
    final cities = _offerings.map((o) => o.city).where((s) => s.isNotEmpty).toSet();
    final shown = _showAllOffers ? sorted : sorted.take(2).toList();
    Widget fact(String value, String label) => Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 9),
        decoration: BoxDecoration(color: AppColors.muted, borderRadius: BorderRadius.circular(12)),
        child: Column(
          children: [
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                value,
                maxLines: 1,
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.text),
              ),
            ),
            const SizedBox(height: 1),
            Text(
              label,
              maxLines: 2,
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 11, color: AppColors.textSoft, height: 1.2),
            ),
          ],
        ),
      ),
    );
    return CareerSection(
      icon: Icons.school_rounded,
      color: sectionCyan,
      title: t('Дар куҷо омӯхтан мумкин аст'),
      subtitle: t('{offers} пешниҳод дар {places} муассиса', {'offers': _offerings.length, 'places': places}),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              fact('$freeCount', t('Ҷойҳои ройгон')),
              const SizedBox(width: 6),
              fact(fees.isEmpty ? '—' : money(fees.first), t('Арзонтарин пулакӣ')),
              const SizedBox(width: 6),
              fact(cities.length == 1 ? cities.first : '${cities.length}', t('Шаҳрҳо')),
            ],
          ),
          const SizedBox(height: 10),
          for (final o in shown) _OfferingCard(offering: o, inPlan: _planIds.contains(o.id), busy: _planBusy == o.id, onPlan: () => _togglePlan(o.id)),
          if (sorted.length > 2)
            TextButton(onPressed: () => setState(() => _showAllOffers = !_showAllOffers), child: Text(_showAllOffers ? t('Камтар') : t('Ҳамаро дидан ({n})', {'n': sorted.length}))),
        ],
      ),
    );
  }

  Widget _dayCard(Career c) => Material(
    color: AppColors.card,
    borderRadius: BorderRadius.circular(22),
    child: InkWell(
      borderRadius: BorderRadius.circular(22),
      onTap: () => Navigator.of(context).push(smoothRoute(CareerDayScreen(careerId: c.id, careerName: c.name, trial: _trial!))),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(color: AppColors.contractSoft, borderRadius: BorderRadius.circular(14)),
              child: Icon(Icons.wb_sunny_rounded, size: 23, color: AppColors.primary),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    t('Як рӯзи корӣ'),
                    style: TextStyle(fontFamily: AppFonts.display, fontSize: 16.5, fontWeight: FontWeight.w700, color: AppColors.text),
                  ),
                  const SizedBox(height: 2),
                  Text(t('Аз субҳ то шом, ҷиҳатҳои мусбат ва манфӣ'), style: TextStyle(fontSize: 12.5, color: AppColors.textSoft)),
                ],
              ),
            ),
            Icon(Icons.chevron_right_rounded, color: AppColors.textSoft),
          ],
        ),
      ),
    ),
  );

  Widget _trialCard(Career c) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: AppColors.contractSoft,
      borderRadius: BorderRadius.circular(22),
      border: Border.all(color: AppColors.primary.withValues(alpha: 0.25)),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          t('Худро дар касб санҷед'),
          style: TextStyle(fontFamily: AppFonts.display, fontSize: 16.5, fontWeight: FontWeight.w700, color: AppColors.text),
        ),
        const SizedBox(height: 4),
        Text(t('Пеш аз интихоб худатон санҷед: як рӯзи корӣ, 4 вазифаи воқеии ҳамин ихтисос, ҷиҳатҳои мусбат ва манфӣ.'), style: TextStyle(fontSize: 13.5, color: AppColors.textSoft, height: 1.4)),
        const SizedBox(height: 12),
        GradientButton(label: t('Санҷидан'), height: 48, onPressed: () => openLink('$siteUrl/trial/career/${c.id}')),
      ],
    ),
  );
}

class _OfferingCard extends StatelessWidget {
  const _OfferingCard({required this.offering, required this.inPlan, required this.busy, required this.onPlan});
  final Offering offering;
  final bool inPlan;
  final bool busy;
  final VoidCallback onPlan;

  @override
  Widget build(BuildContext context) {
    final o = offering;
    final details = [
      if (o.city.isNotEmpty) o.city,
      if (o.studyForm.isNotEmpty) offerLabel(o.studyForm),
      if (o.language.isNotEmpty) offerLabel(o.language),
      if (o.seats != null && o.seats! > 0) t('{n} ҷой', {'n': o.seats}),
    ].join(' · ');
    final badge = o.free ? Badge2(t('буҷетӣ'), color: AppColors.budget, background: AppColors.budgetSoft) : Badge2(o.fee != null ? '${money(o.fee!)} ${t('сомонӣ')}' : t('шартномавӣ'));
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Container(
        padding: const EdgeInsets.all(11),
        decoration: BoxDecoration(
          color: inPlan ? AppColors.contractSoft : null,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: inPlan ? AppColors.primary.withValues(alpha: 0.4) : AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            InkWell(
              onTap: o.universityId.isEmpty ? null : () => Navigator.of(context).push(smoothRoute(UniversityDetailScreen(universityId: o.universityId, title: o.universityName))),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(
                      o.universityName,
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.text, height: 1.3),
                    ),
                  ),
                  const SizedBox(width: 8),
                  badge,
                ],
              ),
            ),
            if (details.isNotEmpty) ...[const SizedBox(height: 5), Text(details, style: TextStyle(fontSize: 12.5, color: AppColors.textSoft))],
            const SizedBox(height: 9),
            SizedBox(
              height: 38,
              child: inPlan
                  ? FilledButton(
                      style: FilledButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        minimumSize: const Size(0, 38),
                        textStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                      ),
                      onPressed: busy ? null : onPlan,
                      child: Text(busy ? '…' : t('✓ Дар рӯйхат')),
                    )
                  : OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size(0, 38),
                        textStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                      ),
                      onPressed: busy ? null : onPlan,
                      child: Text(busy ? '…' : t('+ Илова')),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

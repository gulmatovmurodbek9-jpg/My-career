import 'package:flutter/material.dart';

import '../api/api.dart';
import '../api/models.dart';
import '../app/auth.dart';
import '../app/i18n.dart';
import '../app/last_result.dart';
import '../app/theme.dart';
import '../ui/widgets.dart';
import 'ai_tools_screens.dart';
import 'app_header.dart';
import 'auth/login_screen.dart';
import 'auth/profile_screen.dart';
import 'career_detail_screen.dart';
import 'careers_screen.dart';
import 'result_extras.dart';
import 'results_screen.dart';
import 'interest_test_screen.dart';
import 'settings_screen.dart';
import 'swipe_screen.dart';
import 'trial_screens.dart';
import 'shell.dart';

// Ҳар бор, ки бахши «Панел» кушода мешавад, рӯйхатҳо аз нав гирифта мешаванд.
final dashboardRefresh = ValueNotifier<int>(0);

// Панел (мисли /dashboard-и сайт): натиҷаи охирин, ихтисосҳои нигоҳдошта ва нақшаи ҳуҷҷатсупорӣ.
class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  List<Career> _saved = const [];
  List<Map<String, dynamic>> _plan = const [];
  bool _loading = false;
  bool _failed = false;

  @override
  void initState() {
    super.initState();
    authStore.addListener(_load);
    dashboardRefresh.addListener(_load);
    _load();
  }

  @override
  void dispose() {
    authStore.removeListener(_load);
    dashboardRefresh.removeListener(_load);
    super.dispose();
  }

  Future<void> _load() async {
    if (!authStore.isLoggedIn) {
      if (mounted) {
        setState(() {
          _saved = const [];
          _plan = const [];
        });
      }
      return;
    }
    setState(() {
      _loading = true;
      _failed = false;
    });
    try {
      final results = await Future.wait([Api.instance.getFresh('/users/saved-careers'), Api.instance.getFresh('/users/application-plan')]);
      if (!mounted) return;
      setState(() {
        _saved = [for (final c in (results[0] as List? ?? const [])) Career.fromJson(Map<String, dynamic>.from(c))];
        _plan = [for (final item in ((results[1] as Map?)?['items'] as List? ?? const [])) Map<String, dynamic>.from(item)];
      });
    } catch (_) {
      if (mounted) setState(() => _failed = true);
    }
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _unsave(Career career) async {
    setState(() => _saved = [..._saved.where((c) => c.id != career.id)]);
    try {
      await Api.instance.post('/users/save-career/${career.id}', {});
    } catch (_) {
      _load();
    }
  }

  Future<void> _removeChoice(String offeringId) async {
    setState(() => _plan = [..._plan.where((item) => '${item['offeringId']}' != offeringId)]);
    try {
      await Api.instance.delete('/users/application-plan/$offeringId');
    } catch (_) {
      _load();
    }
  }

  void _open(Widget page) => Navigator.of(context).push(smoothRoute(page));

  // Барои муқоиса: ихтисосҳои нигоҳдошта ва ихтисосҳои натиҷаи тест, бе такрор.
  List<String> _compareChoices() {
    final names = <String>{for (final c in _saved) c.name};
    final saved = lastResult.result;
    if (saved != null) names.addAll(QuizResult.fromJson(saved).careers.take(8).map((c) => c.name));
    return names.where((n) => n.isNotEmpty).toList();
  }

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return Scaffold(
      appBar: const AppHeader(),
      body: SafeArea(
        child: ListenableBuilder(
          listenable: Listenable.merge([authStore, lastResult]),
          builder: (context, _) => RefreshIndicator(
            onRefresh: _load,
            child: ListView(
              padding: AppSizes.page,
              children: [
                Text(t('Панел'), style: text.headlineMedium),
                if (authStore.user != null) Text(authStore.user!.name, style: text.bodyLarge?.copyWith(color: AppColors.textSoft)),
                SectionTitle(t('Натиҷаи тест')),
                _LastResultCard(onStart: () => AppShell.goTo(context, 1)),
                if (!authStore.isLoggedIn) ...[
                  SectionTitle(t('Ихтисосҳо ва нақшаи ман')),
                  AppCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text(t('Ворид шавед, то ихтисосҳои нигоҳдошта ва нақшаи ҳуҷҷатсупорӣ дар ҳамаи дастгоҳҳо бо шумо бошанд.'), style: text.bodyLarge),
                        const SizedBox(height: 12),
                        FilledButton(onPressed: () => Navigator.of(context).push(authRoute(const LoginScreen())), child: Text(t('Воридшавӣ'))),
                      ],
                    ),
                  ),
                ] else ...[
                  SectionTitle(t('Ихтисосҳои нигоҳдошта ({n})', {'n': _saved.length})),
                  if (_failed)
                    AppCard(child: Text(t('Маълумот наомад. Барои навсозӣ экранро ба поён кашед.'), style: text.bodyMedium))
                  else if (_loading && _saved.isEmpty)
                    const Center(
                      child: Padding(padding: EdgeInsets.all(16), child: CircularProgressIndicator()),
                    )
                  else if (_saved.isEmpty)
                    AppCard(
                      onTap: () => AppShell.goTo(context, 2),
                      child: Text(t('Ҳоло холӣ аст. Дар саҳифаи ихтисос тугмаи нигоҳ доштанро пахш кунед.'), style: text.bodyMedium),
                    )
                  else
                    for (final career in _saved) ...[
                      Dismissible(
                        key: ValueKey('saved-${career.id}'),
                        direction: DismissDirection.endToStart,
                        onDismissed: (_) => _unsave(career),
                        background: Container(
                          alignment: Alignment.centerRight,
                          padding: const EdgeInsets.only(right: 20),
                          child: Icon(Icons.delete_outline_rounded, color: AppColors.textSoft),
                        ),
                        child: CareerCard(career: career),
                      ),
                      const SizedBox(height: 10),
                    ],
                  if (_saved.isNotEmpty) Text(t('Барои бардоштан ихтисосро ба чап кашед.'), style: text.bodySmall?.copyWith(color: AppColors.textSoft)),
                  SectionTitle(t('Нақшаи ҳуҷҷатсупорӣ ({n})', {'n': _plan.length})),
                  if (_plan.isEmpty && !_loading)
                    AppCard(child: Text(t('Дар саҳифаи ихтисос ҷойи таҳсилро «Ба рӯйхат» илова кунед. Дар ММТ то 10 интихоб мумкин аст.'), style: text.bodyMedium))
                  else
                    for (final item in _plan) ...[
                      _PlanItem(
                        item: item,
                        onOpen: () => _open(CareerDetailScreen(careerId: '${item['careerId']}', title: '${item['careerName'] ?? ''}')),
                        onRemove: () => _removeChoice('${item['offeringId']}'),
                      ),
                      const SizedBox(height: 10),
                    ],
                ],
                if (authStore.isLoggedIn) ...[
                  SectionTitle(t('Абзорҳои AI')),
                  _LinkRow(
                    icon: Icons.compare_arrows_rounded,
                    label: t('Муқоисаи ихтисосҳо'),
                    onTap: () => _open(CompareScreen(choices: _compareChoices())),
                  ),
                  const SizedBox(height: 8),
                  _LinkRow(icon: Icons.description_outlined, label: t('Ҳисоботи AI'), onTap: () => _open(const AdvisorReportScreen())),
                  const SizedBox(height: 8),
                  _LinkRow(icon: Icons.chat_bubble_outline_rounded, label: t('Чати AI'), onTap: () => _open(const AiChatScreen())),
                ],
                if (lastResult.result != null) ...[SectionTitle(t('Оила')), ParentInviteCard(result: QuizResult.fromJson(lastResult.result!))],
                SectionTitle(t('Санҷиши худ')),
                _LinkRow(
                  icon: Icons.swipe_rounded,
                  label: t('Касб-свайп: 30 сурат'),
                  onTap: () => _open(
                    SwipeScreen(
                      onFullTest: () {
                        Navigator.of(context).pop();
                        AppShell.goTo(context, 1);
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                _LinkRow(icon: Icons.wb_sunny_outlined, label: t('Худро дар касб санҷед'), onTap: () => _open(const TrialHubScreen())),
                const SizedBox(height: 8),
                _LinkRow(icon: Icons.checklist_rounded, label: t('Тести шавқ (O*NET)'), onTap: () => _open(const InterestTestScreen())),
                SectionTitle(t('Ҳисоб')),
                if (authStore.isLoggedIn) ...[_LinkRow(icon: Icons.person_outline_rounded, label: t('Профил'), onTap: () => _open(const ProfileScreen())), const SizedBox(height: 8)],
                _LinkRow(icon: Icons.tune_rounded, label: t('Танзимот'), onTap: () => _open(const SettingsScreen())),
                const SizedBox(height: 8),
                _LinkRow(icon: Icons.work_outline_rounded, label: t('Ҳамаи ихтисосҳо'), onTap: () => _open(const CareersScreen())),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _LastResultCard extends StatelessWidget {
  const _LastResultCard({required this.onStart});
  final VoidCallback onStart;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final saved = lastResult.result;
    if (saved == null) {
      return AppCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(t('Шумо ҳанӯз тест насупоридаед.'), style: text.bodyLarge),
            const SizedBox(height: 12),
            FilledButton(onPressed: onStart, child: Text(t('Тестро сар кунед'))),
          ],
        ),
      );
    }
    final result = QuizResult.fromJson(saved);
    return AppCard(
      onTap: () => Navigator.of(context).push(smoothRoute(ResultsScreen(result: result, requestBody: lastResult.body ?? {}, savedAdvice: lastResult.advice, why: lastResult.why))),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(result.undecided.isEmpty ? result.clusterName : t('Шавқи шумо ҳанӯз равшан нест'), style: text.titleMedium),
                const SizedBox(height: 4),
                Text(t('{n} ихтисоси мувофиқ', {'n': result.careers.length}), style: text.bodyMedium?.copyWith(color: AppColors.textSoft)),
              ],
            ),
          ),
          Icon(Icons.chevron_right_rounded, color: AppColors.textSoft),
        ],
      ),
    );
  }
}

class _PlanItem extends StatelessWidget {
  const _PlanItem({required this.item, required this.onOpen, required this.onRemove});
  final Map<String, dynamic> item;
  final VoidCallback onOpen;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final free = item['isFree'] == true;
    final fee = item['tuitionFee'];
    return AppCard(
      onTap: onOpen,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 15,
            backgroundColor: AppColors.contractSoft,
            child: Text(
              '${item['order'] ?? ''}',
              style: TextStyle(fontWeight: FontWeight.w700, color: AppColors.primary),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(cleanName('${item['careerName'] ?? ''}'), style: text.titleMedium),
                const SizedBox(height: 4),
                Text('${item['universityName'] ?? ''}${item['city'] != null ? ', ${item['city']}' : ''}', style: text.bodyMedium?.copyWith(color: AppColors.textSoft)),
                const SizedBox(height: 4),
                Text(
                  free ? t('Ҷойи буҷетӣ') : (fee is num ? t('Шартнома: {n} сомонӣ', {'n': fee}) : t('Шартнома')),
                  style: text.bodyMedium?.copyWith(color: AppColors.primary, fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ),
          IconButton(
            tooltip: t('Аз рӯйхат бардоштан'),
            onPressed: onRemove,
            icon: Icon(Icons.close_rounded, color: AppColors.textSoft),
          ),
        ],
      ),
    );
  }
}

class _LinkRow extends StatelessWidget {
  const _LinkRow({required this.icon, required this.label, required this.onTap});
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => AppCard(
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
}

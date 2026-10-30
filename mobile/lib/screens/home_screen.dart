import 'package:flutter/material.dart';

import '../api/api.dart';
import '../app/auth.dart';
import '../app/clusters.dart';
import '../app/i18n.dart';
import '../app/theme.dart';
import '../ui/widgets.dart';
import 'app_header.dart';
import 'careers_screen.dart';
import 'settings_screen.dart';
import 'shell.dart';

// Саҳифаи асосӣ: салом, корти тест, 5 самти касбӣ (варақзанӣ) ва гузаришҳои зуд.
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  // id ва шумораи ихтисосҳои ҳар кластер аз сервер (калид — рақами кластер).
  final _ids = <int, String>{};
  final _counts = <int, int>{};

  @override
  void initState() {
    super.initState();
    _loadClusters();
  }

  Future<void> _loadClusters() async {
    try {
      final data = await Api.instance.get('/clusters');
      if (!mounted || data is! List) return;
      setState(() {
        for (final c in data) {
          final n = c['clusterId'];
          if (n is! num) continue;
          _ids[n.toInt()] = '${c['id']}';
          if (c['careerCount'] is num) _counts[n.toInt()] = (c['careerCount'] as num).toInt();
        }
      });
    } catch (_) {
      // Бе интернет рақамҳои дохилӣ намоён мешаванд.
    }
  }

  void _openCluster(ClusterInfo c) {
    final id = _ids[c.number];
    if (id == null) return AppShell.goTo(context, 2);
    Navigator.of(context).push(smoothRoute(CareersScreen(clusterId: id, title: c.title)));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const AppHeader(),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(0, 4, 0, 24),
          children: [
            const Padding(padding: EdgeInsets.symmetric(horizontal: 16), child: _Greeting()),
            const SizedBox(height: 14),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: _TestCard(onStart: () => AppShell.goTo(context, 1)),
            ),
            const SizedBox(height: 24),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: _SectionTitle(title: t('Самтҳои касбӣ'), subtitle: t('Ҳар самт чӣ кор мекунад ва барои чист — варақ занед')),
            ),
            const SizedBox(height: 12),
            _ClusterSwiper(counts: _counts, onOpen: _openCluster),
            const SizedBox(height: 22),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  Expanded(
                    child: _QuickTile(icon: Icons.work_rounded, color: AppColors.primary, title: t('Ихтисосҳо'), subtitle: t('{n} ихтисос', {'n': 884}), onTap: () => AppShell.goTo(context, 2)),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _QuickTile(
                      icon: Icons.school_rounded,
                      color: const Color(0xFF059669),
                      title: t('Донишгоҳҳо'),
                      subtitle: t('{n} муассиса', {'n': 128}),
                      onTap: () => AppShell.goTo(context, 3),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: AppCard(
                onTap: () => Navigator.of(context).push(smoothRoute(const SettingsScreen())),
                child: Row(
                  children: [
                    Icon(Icons.text_increase_rounded, size: 24, color: AppColors.primary),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(t('Ҳарфҳо хурданд? Дар «Танзимот» онҳоро калон кунед.'), style: TextStyle(fontSize: 14, color: AppColors.textSoft, height: 1.35)),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// «Салом, Муродбек! 👋» ё барои меҳмон «Хуш омадед!».
class _Greeting extends StatelessWidget {
  const _Greeting();

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: authStore,
    builder: (context, _) {
      final name = (authStore.user?.displayName ?? '').split(' ').first;
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            t('Роҳнамои касбии шумо'),
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: AppColors.textSoft),
          ),
          const SizedBox(height: 2),
          Text(
            name.isEmpty ? '${t('Хуш омадед!')} 👋' : '${t('Салом, {name}!', {'name': name})} 👋',
            style: TextStyle(fontFamily: AppFonts.display, fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.text),
          ),
        ],
      );
    },
  );
}

// Корти калони кабуд: тести касбӣ.
class _TestCard extends StatelessWidget {
  const _TestCard({required this.onStart});
  final VoidCallback onStart;

  @override
  Widget build(BuildContext context) {
    Widget chip(IconData icon, String label) => Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.16), borderRadius: BorderRadius.circular(999)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: Colors.white),
          const SizedBox(width: 4),
          Text(
            label,
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white),
          ),
        ],
      ),
    );
    return Container(
      padding: const EdgeInsets.fromLTRB(18, 16, 18, 18),
      decoration: BoxDecoration(gradient: AppColors.brandGradient, borderRadius: BorderRadius.circular(24), boxShadow: buttonShadow),
      child: Stack(
        children: [
          Positioned(right: -8, top: -6, child: Icon(Icons.psychology_alt_rounded, size: 76, color: Colors.white.withValues(alpha: 0.12))),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.18), borderRadius: BorderRadius.circular(999)),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.lightbulb_rounded, size: 14, color: Color(0xFFFCD34D)),
                    const SizedBox(width: 5),
                    Text(
                      t('Тести касбӣ'),
                      style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: Colors.white),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              Text(
                t('Касби мувофиқи худро ёбед'),
                style: const TextStyle(fontFamily: AppFonts.display, fontSize: 20, fontWeight: FontWeight.w700, color: Colors.white, height: 1.2),
              ),
              const SizedBox(height: 6),
              Text(
                t('Ба саволҳои содда ҷавоб диҳед — мебинед, ки кадом самт ва ихтисосҳо ба шумо наздиканд.'),
                style: TextStyle(fontSize: 13, color: Colors.white.withValues(alpha: 0.88), height: 1.4),
              ),
              const SizedBox(height: 12),
              Wrap(spacing: 6, runSpacing: 6, children: [chip(Icons.checklist_rounded, t('29 савол')), chip(Icons.schedule_rounded, t('~7 дақиқа')), chip(Icons.hub_rounded, t('5 самт'))]),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: Material(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(16),
                    onTap: onStart,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          t('Оғози тест'),
                          style: const TextStyle(fontSize: 15.5, fontWeight: FontWeight.w600, color: Color(0xFF003BB3)),
                        ),
                        const SizedBox(width: 8),
                        const Icon(Icons.arrow_forward_rounded, size: 19, color: Color(0xFF003BB3)),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.title, required this.subtitle});
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(
        title,
        style: TextStyle(fontFamily: AppFonts.display, fontSize: 19, fontWeight: FontWeight.w700, color: AppColors.text),
      ),
      const SizedBox(height: 2),
      Text(subtitle, style: TextStyle(fontSize: 13, color: AppColors.textSoft)),
    ],
  );
}

// Варақзании 5 кластер: ҳар корт — чӣ кор мекунад, мақсадаш ва чанд ихтисос дорад.
class _ClusterSwiper extends StatefulWidget {
  const _ClusterSwiper({required this.counts, required this.onOpen});
  final Map<int, int> counts;
  final void Function(ClusterInfo) onOpen;

  @override
  State<_ClusterSwiper> createState() => _ClusterSwiperState();
}

class _ClusterSwiperState extends State<_ClusterSwiper> {
  final _page = PageController(viewportFraction: 0.88);
  int _index = 0;

  @override
  void dispose() {
    _page.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final scale = MediaQuery.textScalerOf(context).scale(1).clamp(1.0, 1.4);
    return Column(
      children: [
        SizedBox(
          height: 318 * scale,
          child: PageView.builder(
            controller: _page,
            padEnds: false,
            itemCount: clusters.length,
            onPageChanged: (i) => setState(() => _index = i),
            itemBuilder: (context, i) {
              final c = clusters[i];
              return Padding(
                padding: EdgeInsets.only(left: i == 0 ? 16 : 6, right: i == clusters.length - 1 ? 16 : 6),
                child: _ClusterCard(cluster: c, count: widget.counts[c.number] ?? c.count, onOpen: () => widget.onOpen(c)),
              );
            },
          ),
        ),
        const SizedBox(height: 12),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            for (var i = 0; i < clusters.length; i++)
              AnimatedContainer(
                duration: const Duration(milliseconds: 220),
                margin: const EdgeInsets.symmetric(horizontal: 3),
                width: i == _index ? 22 : 7,
                height: 7,
                decoration: BoxDecoration(color: i == _index ? clusters[i].color : AppColors.border, borderRadius: BorderRadius.circular(999)),
              ),
          ],
        ),
      ],
    );
  }
}

class _ClusterCard extends StatelessWidget {
  const _ClusterCard({required this.cluster, required this.count, required this.onOpen});
  final ClusterInfo cluster;
  final int count;
  final VoidCallback onOpen;

  @override
  Widget build(BuildContext context) {
    final color = cluster.color;
    final soft = color.withValues(alpha: AppColors.dark ? 0.18 : 0.09);
    return Material(
      color: AppColors.card,
      borderRadius: BorderRadius.circular(22),
      child: InkWell(
        borderRadius: BorderRadius.circular(22),
        onTap: onOpen,
        child: Container(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: AppColors.border),
            gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [soft, Colors.transparent], stops: const [0, 0.6]),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(14)),
                    child: Icon(cluster.icon, color: Colors.white, size: 24),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      t('Кластери {n}', {'n': cluster.number}).toUpperCase(),
                      style: TextStyle(fontSize: 11.5, letterSpacing: 0.6, fontWeight: FontWeight.w700, color: color),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                    decoration: BoxDecoration(color: soft, borderRadius: BorderRadius.circular(999)),
                    child: Text(
                      t('{n} ихтисос', {'n': count}),
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: color),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                cluster.title,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(fontFamily: AppFonts.display, fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.text, height: 1.2),
              ),
              const SizedBox(height: 6),
              Text(
                cluster.about,
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(fontSize: 13.5, color: AppColors.textSoft, height: 1.4),
              ),
              const Spacer(),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.fromLTRB(11, 9, 11, 9),
                decoration: BoxDecoration(color: AppColors.muted, borderRadius: BorderRadius.circular(14)),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.flag_rounded, size: 15, color: color),
                        const SizedBox(width: 5),
                        Text(
                          t('Мақсад'),
                          style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: AppColors.text),
                        ),
                      ],
                    ),
                    const SizedBox(height: 3),
                    Text(
                      cluster.goal,
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(fontSize: 12.5, color: AppColors.textSoft, height: 1.35),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Text(
                    t('Ҳамаи ихтисосҳои ин самт'),
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: color),
                  ),
                  const Spacer(),
                  Icon(Icons.arrow_forward_rounded, size: 19, color: color),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _QuickTile extends StatelessWidget {
  const _QuickTile({required this.icon, required this.color, required this.title, required this.subtitle, required this.onTap});
  final IconData icon;
  final Color color;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Material(
    color: AppColors.card,
    borderRadius: BorderRadius.circular(20),
    child: InkWell(
      borderRadius: BorderRadius.circular(20),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: AppColors.dark ? 0.2 : 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(icon, size: 20, color: color),
                ),
                const Spacer(),
                Icon(Icons.arrow_forward_rounded, size: 18, color: AppColors.textSoft),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(fontFamily: AppFonts.display, fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.text),
            ),
            const SizedBox(height: 2),
            Text(subtitle, style: TextStyle(fontSize: 12.5, color: AppColors.textSoft)),
          ],
        ),
      ),
    ),
  );
}

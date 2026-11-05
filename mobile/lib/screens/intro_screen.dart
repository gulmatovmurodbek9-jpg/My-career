import 'package:flutter/material.dart';

import '../app/i18n.dart';
import '../app/settings.dart';
import '../app/theme.dart';
import 'auth/login_screen.dart';

// Муаррифии барнома: бори аввал ва аз танзимот («Барнома чӣ кор мекунад?»).
class IntroScreen extends StatefulWidget {
  const IntroScreen({super.key, this.replay = false});
  // true — аз танзимот кушода шуд: дар охир танҳо баргашт.
  final bool replay;

  @override
  State<IntroScreen> createState() => _IntroScreenState();
}

class _IntroScreenState extends State<IntroScreen> {
  final _pages = PageController();
  int _page = 0;

  static const _slides = [
    (Icons.explore_rounded, 'Ихтисоси ман чӣ кор мекунад?', 'Ба шумо ёрӣ медиҳад, ки самти касб, ихтисос ва ҷойи таҳсилро дар Тоҷикистон интихоб кунед.'),
    (Icons.checklist_rounded, 'Тести касбӣ', '20 саволи кӯтоҳ самти наздик ва ихтисосҳои мувофиқро нишон медиҳад. Ҷавоби дуруст ё нодуруст нест.'),
    (Icons.school_rounded, '884 ихтисос ва 128 муассиса', 'Барои ҳар ихтисос: дар куҷо мехонанд, ҷойи буҷетӣ ҳаст ё не, нарх ва холи гузариш.'),
    (Icons.mic_rounded, 'Ёвари AI', 'Бо овоз ё навиштан савол диҳед. AI маслиҳат медиҳад, қарорро худатон қабул мекунед.'),
  ];

  @override
  void dispose() {
    _pages.dispose();
    super.dispose();
  }

  void _finish({bool login = false}) {
    if (widget.replay) {
      Navigator.of(context).pop();
      return;
    }
    final navigator = Navigator.of(context);
    appSettings.markWelcomeSeen();
    if (login) navigator.push(authRoute(const LoginScreen()));
  }

  @override
  Widget build(BuildContext context) {
    final last = _page == _slides.length - 1;
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(onPressed: () => _finish(), child: Text(widget.replay ? t('Пӯшидан') : t('Гузаштан'))),
            ),
            Expanded(
              child: PageView(
                controller: _pages,
                onPageChanged: (page) => setState(() => _page = page),
                children: [for (final (icon, title, body) in _slides) _Slide(icon: icon, title: t(title), body: t(body))],
              ),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                for (var i = 0; i < _slides.length; i++)
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    width: i == _page ? 22 : 8,
                    height: 8,
                    decoration: BoxDecoration(color: i == _page ? AppColors.primary : AppColors.border, borderRadius: BorderRadius.circular(99)),
                  ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  FilledButton(
                    onPressed: last ? () => _finish() : () => _pages.nextPage(duration: const Duration(milliseconds: 280), curve: Curves.easeOutCubic),
                    child: Text(last ? (widget.replay ? t('Фаҳмидам') : t('Оғоз кардан')) : t('Минбаъд')),
                  ),
                  if (last && !widget.replay) ...[const SizedBox(height: 8), OutlinedButton(onPressed: () => _finish(login: true), child: Text(t('Воридшавӣ')))],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Slide extends StatelessWidget {
  const _Slide({required this.icon, required this.title, required this.body});
  final IconData icon;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 28),
    child: Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width: 110,
          height: 110,
          decoration: BoxDecoration(color: AppColors.contractSoft, shape: BoxShape.circle),
          child: Icon(icon, size: 54, color: AppColors.primary),
        ),
        const SizedBox(height: 32),
        Text(title, textAlign: TextAlign.center, style: Theme.of(context).textTheme.headlineMedium),
        const SizedBox(height: 14),
        Text(
          body,
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 17, height: 1.45, color: AppColors.textSoft),
        ),
      ],
    ),
  );
}

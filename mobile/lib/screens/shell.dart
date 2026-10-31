import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../app/theme.dart';
import '../ui/widgets.dart';
import 'careers_screen.dart';
import 'settings_screen.dart';
import 'home_screen.dart';
import 'quiz_screen.dart';
import 'universities_screen.dart';
import 'voice_screen.dart';
import '../app/i18n.dart';

// Бахшҳои асосӣ: 0 Асосӣ, 1 Тест, 2 Ихтисосҳо, 3 Донишгоҳҳо.
// Менюи поён: панели мудаввар, «Ёвар» (овоз) — тугмаи калон дар мобайн, «Танзимот» дар канор. Тест аз саҳифаи асосӣ ва бо овоз кушода мешавад.
class AppShell extends StatefulWidget {
  const AppShell({super.key});

  static void goTo(BuildContext context, int tab) => context.findAncestorStateOfType<_AppShellState>()?.select(tab);

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _tab = 0;

  void select(int tab) {
    if (tab == _tab) return;
    HapticFeedback.selectionClick();
    setState(() => _tab = tab);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _tab, children: const [HomeScreen(), QuizStartScreen(), CareersScreen(), UniversitiesScreen()]),
      bottomNavigationBar: SafeArea(
        minimum: const EdgeInsets.only(bottom: 10),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(12, 0, 12, 0),
          child: Container(
            height: 66,
            decoration: BoxDecoration(
              color: AppColors.card,
              borderRadius: BorderRadius.circular(26),
              border: Border.all(color: AppColors.border),
              boxShadow: AppColors.dark ? null : const [BoxShadow(color: Color(0x1F0D2E8C), blurRadius: 20, offset: Offset(0, 8), spreadRadius: -10)],
            ),
            child: Row(
              children: [
                _NavItem(icon: Icons.home_outlined, activeIcon: Icons.home_rounded, label: t('Асосӣ'), selected: _tab == 0, onTap: () => select(0)),
                _NavItem(icon: Icons.work_outline_rounded, activeIcon: Icons.work_rounded, label: t('Ихтисосҳо'), selected: _tab == 2, onTap: () => select(2)),
                _CenterItem(onTap: () => Navigator.of(context).push(smoothRoute(VoiceScreen(goToTab: select)))),
                _NavItem(icon: Icons.school_outlined, activeIcon: Icons.school_rounded, label: t('Донишгоҳҳо'), selected: _tab == 3, onTap: () => select(3)),
                _NavItem(icon: Icons.tune_rounded, activeIcon: Icons.tune_rounded, label: t('Танзимот'), selected: false, onTap: () => Navigator.of(context).push(smoothRoute(const SettingsScreen()))),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({required this.icon, required this.activeIcon, required this.label, required this.selected, required this.onTap});
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Expanded(
    child: _NavButton(
      label: label,
      selected: selected,
      onTap: onTap,
      icon: Icon(selected ? activeIcon : icon, size: 23, color: selected ? AppColors.primary : AppColors.textSoft),
    ),
  );
}

// Нишона бо «қурси» нарми кабуд дар зери бахши интихобшуда ва номи бахш.
class _NavButton extends StatelessWidget {
  const _NavButton({required this.icon, required this.label, required this.selected, required this.onTap});
  final Widget icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Semantics(
    button: true,
    selected: selected,
    label: label,
    excludeSemantics: true,
    child: InkResponse(
      onTap: onTap,
      radius: 34,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          AnimatedContainer(
            duration: const Duration(milliseconds: 220),
            curve: Curves.easeOutCubic,
            width: selected ? 46 : 34,
            height: 28,
            alignment: Alignment.center,
            decoration: BoxDecoration(color: selected ? AppColors.contractSoft : Colors.transparent, borderRadius: BorderRadius.circular(14)),
            child: icon,
          ),
          const SizedBox(height: 3),
          // Номи дароз (масалан «Специальности») хурдтар мешавад, вале бурида намешавад.
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(
              label,
              maxLines: 1,
              // Номи бахш бо андозаи доимӣ, то дар «Хеле калон» ҳам менюи поён вайрон нашавад.
              textScaler: TextScaler.noScaling,
              style: TextStyle(fontSize: 11, fontWeight: selected ? FontWeight.w700 : FontWeight.w600, color: selected ? AppColors.primary : AppColors.textSoft),
            ),
          ),
        ],
      ),
    ),
  );
}

// «Ёвар» — доираи калони градиентӣ бо микрофон, ки аз панел каме боло баромадааст (мисли сайт).
class _CenterItem extends StatelessWidget {
  const _CenterItem({required this.onTap});
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Expanded(
    child: Semantics(
      button: true,
      label: t('Ёвар'),
      excludeSemantics: true,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: Stack(
          clipBehavior: Clip.none,
          alignment: Alignment.bottomCenter,
          children: [
            Positioned(
              top: -18,
              child: Container(
                width: 54,
                height: 54,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: AppColors.brandGradient,
                  border: Border.all(color: AppColors.card, width: 3),
                  boxShadow: const [BoxShadow(color: Color(0x55003BB3), blurRadius: 18, offset: Offset(0, 8), spreadRadius: -4)],
                ),
                child: const Icon(Icons.mic_rounded, color: Colors.white, size: 27),
              ),
            ),
            Positioned(
              bottom: 9,
              child: Text(
                t('Ёвар'),
                textScaler: TextScaler.noScaling,
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.text),
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

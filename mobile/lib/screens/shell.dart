import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../app/auth.dart';
import '../app/theme.dart';
import '../ui/widgets.dart';
import 'auth/login_screen.dart';
import 'auth/profile_screen.dart';
import 'careers_screen.dart';
import 'home_screen.dart';
import 'quiz_screen.dart';
import 'universities_screen.dart';
import '../app/i18n.dart';

// Бахшҳои асосӣ: 0 Асосӣ, 1 Тест, 2 Ихтисосҳо, 3 Донишгоҳҳо.
// Менюи поён мисли сайт: панели сафеди мудаввар, «Тест» — тугмаи калон дар мобайн, «Ҳисоб» дар канор.
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

  void _openAccount() {
    HapticFeedback.selectionClick();
    Navigator.of(context).push(authStore.isLoggedIn ? smoothRoute(const ProfileScreen()) : authRoute(const LoginScreen()));
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
              color: Colors.white,
              borderRadius: BorderRadius.circular(26),
              border: Border.all(color: AppColors.border, width: 1.2),
              boxShadow: const [BoxShadow(color: Color(0x240D2E8C), blurRadius: 30, offset: Offset(0, 10), spreadRadius: -12)],
            ),
            child: Row(
              children: [
                _NavItem(icon: Icons.home_outlined, activeIcon: Icons.home_rounded, label: t('Асосӣ'), selected: _tab == 0, onTap: () => select(0)),
                _NavItem(icon: Icons.work_outline_rounded, activeIcon: Icons.work_rounded, label: t('Ихтисосҳо'), selected: _tab == 2, onTap: () => select(2)),
                _CenterItem(selected: _tab == 1, onTap: () => select(1)),
                _NavItem(icon: Icons.school_outlined, activeIcon: Icons.school_rounded, label: t('Донишгоҳҳо'), selected: _tab == 3, onTap: () => select(3)),
                Expanded(
                  child: ListenableBuilder(
                    listenable: authStore,
                    builder: (context, _) {
                      final name = authStore.user?.displayName ?? '';
                      return _NavButton(
                        label: authStore.isLoggedIn ? t('Ҳисоб') : t('Ворид'),
                        selected: false,
                        onTap: _openAccount,
                        icon: authStore.isLoggedIn && name.isNotEmpty
                            ? Container(
                                width: 26,
                                height: 26,
                                alignment: Alignment.center,
                                decoration: const BoxDecoration(shape: BoxShape.circle, gradient: AppColors.brandGradient),
                                child: Text(
                                  name.characters.first.toUpperCase(),
                                  style: const TextStyle(fontFamily: AppFonts.display, fontSize: 13, fontWeight: FontWeight.w800, color: Colors.white),
                                ),
                              )
                            : const Icon(Icons.person_outline_rounded, size: 24, color: AppColors.textSoft),
                      );
                    },
                  ),
                ),
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
              style: TextStyle(fontSize: 11, fontWeight: selected ? FontWeight.w800 : FontWeight.w600, color: selected ? AppColors.primary : AppColors.textSoft),
            ),
          ),
        ],
      ),
    ),
  );
}

// «Тест» — доираи калони градиентӣ, ки аз панел каме боло баромадааст (мисли «Ёвар» дар сайт).
class _CenterItem extends StatelessWidget {
  const _CenterItem({required this.selected, required this.onTap});
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Expanded(
    child: Semantics(
      button: true,
      selected: selected,
      label: t('Тест'),
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
              child: AnimatedScale(
                duration: const Duration(milliseconds: 220),
                scale: selected ? 1.06 : 1,
                child: Container(
                  width: 54,
                  height: 54,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: AppColors.brandGradient,
                    border: Border.all(color: Colors.white, width: 3),
                    boxShadow: const [BoxShadow(color: Color(0x55003BB3), blurRadius: 18, offset: Offset(0, 8), spreadRadius: -4)],
                  ),
                  child: const Icon(Icons.quiz_rounded, color: Colors.white, size: 26),
                ),
              ),
            ),
            Positioned(
              bottom: 9,
              child: Text(
                t('Тест'),
                textScaler: TextScaler.noScaling,
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: selected ? AppColors.primary : AppColors.text),
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

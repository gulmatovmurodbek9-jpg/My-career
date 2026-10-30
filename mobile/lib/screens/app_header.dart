import 'package:flutter/material.dart';

import '../app/auth.dart';
import '../app/i18n.dart';
import '../app/settings.dart';
import '../app/theme.dart';
import '../ui/widgets.dart';
import 'auth/auth_ui.dart';
import 'auth/login_screen.dart';
import 'auth/profile_screen.dart';

// Сарлавҳа мисли сайт: логотип ва «ИХТИСОСИ МАН», дар рост — торик/равшан, забон ва аватар.
class AppHeader extends StatelessWidget implements PreferredSizeWidget {
  const AppHeader({super.key});

  @override
  Size get preferredSize => const Size.fromHeight(60);

  @override
  Widget build(BuildContext context) {
    return AppBar(
      toolbarHeight: 60,
      titleSpacing: 16,
      title: Row(
        children: [
          Image.asset('assets/images/logo.png', width: 30, height: 30, filterQuality: FilterQuality.medium),
          const SizedBox(width: 9),
          Flexible(
            child: Text(
              t('Ихтисоси ман').toUpperCase(),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(fontFamily: AppFonts.body, fontSize: 16, fontWeight: FontWeight.w700, letterSpacing: 0.3, color: AppColors.text),
            ),
          ),
        ],
      ),
      actions: const [ThemeToggle(), SizedBox(width: 6), LangButton(), SizedBox(width: 8), AccountAvatar(), SizedBox(width: 14)],
    );
  }
}

// Тугмаи 🌙 / ☀️ — мавзӯи торик ё равшан.
class ThemeToggle extends StatelessWidget {
  const ThemeToggle({super.key});

  @override
  Widget build(BuildContext context) {
    final dark = appSettings.dark;
    return Tooltip(
      message: dark ? t('Мавзӯи равшан') : t('Мавзӯи торик'),
      child: Material(
        color: AppColors.muted,
        shape: const CircleBorder(),
        child: InkWell(
          customBorder: const CircleBorder(),
          onTap: () => appSettings.setDark(!dark),
          child: SizedBox(
            width: 36,
            height: 36,
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 260),
              transitionBuilder: (child, a) => RotationTransition(
                turns: Tween(begin: 0.6, end: 1.0).animate(a),
                child: FadeTransition(opacity: a, child: child),
              ),
              child: Icon(dark ? Icons.light_mode_rounded : Icons.dark_mode_outlined, key: ValueKey(dark), size: 19, color: dark ? AppColors.secondary : AppColors.text),
            ),
          ),
        ),
      ),
    );
  }
}

// Аватар: ворид шуда — ҳарфи аввали ном дар доираи кабуд (ба профил); меҳмон — нишонаи одам (ба воридшавӣ).
class AccountAvatar extends StatelessWidget {
  const AccountAvatar({super.key});

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: authStore,
    builder: (context, _) {
      final name = authStore.user?.displayName ?? '';
      final loggedIn = authStore.isLoggedIn;
      return Semantics(
        button: true,
        label: loggedIn ? t('Ҳисоби ман') : t('Ворид шудан'),
        child: GestureDetector(
          onTap: () => Navigator.of(context).push(loggedIn ? smoothRoute(const ProfileScreen()) : authRoute(const LoginScreen())),
          child: Container(
            width: 38,
            height: 38,
            padding: const EdgeInsets.all(2),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: AppColors.primary.withValues(alpha: 0.35), width: 1.5),
            ),
            child: Container(
              alignment: Alignment.center,
              decoration: BoxDecoration(shape: BoxShape.circle, gradient: loggedIn ? AppColors.brandGradient : null, color: loggedIn ? null : AppColors.contractSoft),
              child: loggedIn && name.isNotEmpty
                  ? Text(
                      name.characters.first.toUpperCase(),
                      style: const TextStyle(fontFamily: AppFonts.display, fontSize: 14, fontWeight: FontWeight.w700, color: Colors.white),
                    )
                  : Icon(Icons.person_rounded, size: 19, color: AppColors.primary),
            ),
          ),
        ),
      );
    },
  );
}

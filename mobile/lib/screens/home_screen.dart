import 'package:flutter/material.dart';

import '../app/auth.dart';
import '../app/theme.dart';
import '../ui/widgets.dart';
import 'auth/login_screen.dart';
import 'auth/profile_screen.dart';
import 'settings_screen.dart';
import 'shell.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Ихтисоси ман'),
        actions: [
          IconButton(
            tooltip: 'Танзимот',
            iconSize: 30,
            icon: const Icon(Icons.settings_outlined),
            onPressed: () => Navigator.of(context).push(smoothRoute(const SettingsScreen())),
          ),
          const _AccountButton(),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: ListView(
          padding: AppSizes.page,
          children: [
            Text('Кадом касб ба шумо мувофиқ аст?', style: text.headlineMedium),
            const SizedBox(height: 10),
            Text('Тест гузаред, ихтисосҳоро бинед ва донишгоҳро интихоб кунед. Ҳамааш ройгон аст.', style: text.bodyLarge),
            const SizedBox(height: 24),
            ActionCard(
              primary: true,
              icon: Icons.quiz_rounded,
              title: 'Тестро сар кунед',
              subtitle: '29 саволи содда, тақрибан 7 дақиқа',
              onTap: () => AppShell.goTo(context, 1),
            ),
            const SizedBox(height: AppSizes.gap),
            ActionCard(
              icon: Icons.work_rounded,
              title: 'Ихтисосҳо',
              subtitle: '884 ихтисоси расмии ММТ: маош, нарх ва ҷойҳои буҷетӣ',
              onTap: () => AppShell.goTo(context, 2),
            ),
            const SizedBox(height: AppSizes.gap),
            ActionCard(
              icon: Icons.school_rounded,
              title: 'Донишгоҳҳо ва коллеҷҳо',
              subtitle: '128 муассисаи Тоҷикистон',
              onTap: () => AppShell.goTo(context, 3),
            ),
            const SizedBox(height: 28),
            AppCard(
              child: Row(children: [
                const Icon(Icons.text_increase_rounded, size: 36, color: AppColors.primary),
                const SizedBox(width: 14),
                Expanded(child: Text('Ҳарфҳо хурданд? Дар «Танзимот» онҳоро калон кунед.', style: text.bodyLarge)),
              ]),
              onTap: () => Navigator.of(context).push(smoothRoute(const SettingsScreen())),
            ),
          ],
        ),
      ),
    );
  }
}

// Меҳмон — тугмаи «Ворид шудан»; ворид шуда — ҳарфи аввали ном дар доира (ба профил мебарад).
class _AccountButton extends StatelessWidget {
  const _AccountButton();

  @override
  Widget build(BuildContext context) => ListenableBuilder(
        listenable: authStore,
        builder: (context, _) {
          final user = authStore.user;
          if (!authStore.isLoggedIn) {
            return Padding(
              padding: const EdgeInsets.only(left: 4),
              child: TextButton.icon(
                onPressed: () => Navigator.of(context).push(authRoute(const LoginScreen())),
                icon: const Icon(Icons.person_outline_rounded, size: 26),
                label: const Text('Ворид'),
              ),
            );
          }
          final name = user?.displayName ?? '';
          return IconButton(
            tooltip: 'Ҳисоби ман',
            onPressed: () => Navigator.of(context).push(smoothRoute(const ProfileScreen())),
            icon: Container(
              width: 40,
              height: 40,
              alignment: Alignment.center,
              decoration: const BoxDecoration(shape: BoxShape.circle, gradient: AppColors.brandGradient),
              child: Text(
                name.isEmpty ? '?' : name.characters.first.toUpperCase(),
                style: const TextStyle(fontFamily: AppFonts.display, fontSize: 18, fontWeight: FontWeight.w800, color: Colors.white),
              ),
            ),
          );
        },
      );
}

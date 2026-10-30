import 'package:flutter/material.dart';

import '../app/theme.dart';
import '../ui/widgets.dart';
import 'app_header.dart';
import 'settings_screen.dart';
import 'shell.dart';
import '../app/i18n.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return Scaffold(
      appBar: const AppHeader(),
      body: SafeArea(
        child: ListView(
          padding: AppSizes.page,
          children: [
            Text(t('Кадом касб ба шумо мувофиқ аст?'), style: text.headlineMedium),
            const SizedBox(height: 10),
            Text(t('Тест гузаред, ихтисосҳоро бинед ва донишгоҳро интихоб кунед. Ҳамааш ройгон аст.'), style: text.bodyLarge),
            const SizedBox(height: 24),
            ActionCard(primary: true, icon: Icons.quiz_rounded, title: t('Тестро сар кунед'), subtitle: t('29 саволи содда, тақрибан 7 дақиқа'), onTap: () => AppShell.goTo(context, 1)),
            const SizedBox(height: AppSizes.gap),
            ActionCard(icon: Icons.work_rounded, title: t('Ихтисосҳо'), subtitle: t('884 ихтисоси расмии ММТ: маош, нарх ва ҷойҳои буҷетӣ'), onTap: () => AppShell.goTo(context, 2)),
            const SizedBox(height: AppSizes.gap),
            ActionCard(icon: Icons.school_rounded, title: t('Донишгоҳҳо ва коллеҷҳо'), subtitle: t('128 муассисаи Тоҷикистон'), onTap: () => AppShell.goTo(context, 3)),
            const SizedBox(height: 28),
            AppCard(
              child: Row(
                children: [
                  Icon(Icons.text_increase_rounded, size: 30, color: AppColors.primary),
                  const SizedBox(width: 14),
                  Expanded(child: Text(t('Ҳарфҳо хурданд? Дар «Танзимот» онҳоро калон кунед.'), style: text.bodyLarge)),
                ],
              ),
              onTap: () => Navigator.of(context).push(smoothRoute(const SettingsScreen())),
            ),
          ],
        ),
      ),
    );
  }
}

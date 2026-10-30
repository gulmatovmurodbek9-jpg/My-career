import 'package:flutter/material.dart';

import '../app/theme.dart';
import '../ui/widgets.dart';
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
            iconSize: 26,
            icon: const Icon(Icons.settings_outlined),
            onPressed: () => Navigator.of(context).push(smoothRoute(const SettingsScreen())),
          ),
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
                const Icon(Icons.text_increase_rounded, size: 30, color: AppColors.primary),
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

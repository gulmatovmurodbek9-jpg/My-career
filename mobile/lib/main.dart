import 'package:flutter/material.dart';

import 'app/auth.dart';
import 'app/i18n.dart';
import 'app/settings.dart';
import 'app/theme.dart';
import 'screens/shell.dart';
import 'screens/welcome_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Future.wait([appSettings.load(), authStore.load()]);
  _rebuildOnLanguageChange();
  runApp(const IkhtisosiManApp());
}

// Вақте забон ё мавзӯъ (торик/равшан) иваз мешавад, ҳамаи экранҳои кушода (ҳатто онҳое, ки дар тӯдаи
// Navigator ҳастанд) аз нав сохта мешаванд, то матнҳои t(...) ва рангҳои AppColors фавран нав шаванд.
void _rebuildOnLanguageChange() {
  var lang = appSettings.lang;
  var dark = appSettings.dark;
  AppColors.dark = dark;
  appSettings.addListener(() {
    if (appSettings.lang == lang && appSettings.dark == dark) return;
    lang = appSettings.lang;
    dark = appSettings.dark;
    AppColors.dark = dark;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      void rebuild(Element el) {
        el.markNeedsBuild();
        el.visitChildren(rebuild);
      }

      WidgetsBinding.instance.rootElement?.visitChildren(rebuild);
    });
  });
}

class IkhtisosiManApp extends StatelessWidget {
  const IkhtisosiManApp({super.key});
  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: appSettings,
      builder: (context, _) => MaterialApp(
        title: t('Ихтисоси ман'),
        debugShowCheckedModeBanner: false,
        theme: buildTheme(),
        // Андозаи ҳарф аз танзимоти барнома (Муқаррарӣ / Калон / Хеле калон), бо андозаи системаи телефон.
        builder: (context, child) {
          final media = MediaQuery.of(context);
          final system = media.textScaler.scale(1).clamp(1.0, 1.4);
          return MediaQuery(
            data: media.copyWith(textScaler: TextScaler.linear((system * appSettings.textScale).clamp(1.0, 1.6))),
            child: child!,
          );
        },
        // Калиди забон: маълумоти аз сервер омада (ихтисосҳо, донишгоҳҳо) бо забони нав аз нав бор мешавад.
        home: appSettings.seenWelcome ? AppShell(key: ValueKey(appSettings.lang)) : const WelcomeScreen(),
      ),
    );
  }
}

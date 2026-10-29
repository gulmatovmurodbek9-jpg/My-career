import 'package:flutter/material.dart';

import 'app/settings.dart';
import 'app/theme.dart';
import 'screens/shell.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await appSettings.load();
  runApp(const IkhtisosiManApp());
}

class IkhtisosiManApp extends StatelessWidget {
  const IkhtisosiManApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: appSettings,
      builder: (context, _) => MaterialApp(
        title: 'Ихтисоси ман',
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
        home: const AppShell(),
      ),
    );
  }
}

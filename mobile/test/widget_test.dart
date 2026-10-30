import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ikhtisosi_man/api/models.dart';
import 'package:ikhtisosi_man/app/auth.dart';
import 'package:ikhtisosi_man/app/i18n.dart';
import 'package:ikhtisosi_man/app/i18n_en.dart';
import 'package:ikhtisosi_man/app/i18n_ru.dart';
import 'package:ikhtisosi_man/app/settings.dart';
import 'package:ikhtisosi_man/screens/auth/auth_ui.dart';
import 'package:ikhtisosi_man/screens/auth/login_screen.dart';
import 'package:ikhtisosi_man/main.dart';
import 'package:ikhtisosi_man/ui/widgets.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  group('Моделҳо', () {
    test('ихтисос: майдонҳои холӣ барномаро намеафтонанд', () {
      final c = Career.fromJson({'id': 'x', 'name': 'Стоматология', 'cluster': {'clusterName': 'Тиб'}, 'hasFreeSeats': true, 'minTuitionFee': 6050});
      expect(c.name, 'Стоматология');
      expect(c.cluster, 'Тиб');
      expect(c.hasFreeSeats, isTrue);
      expect(c.minFee, 6050);
      expect(c.salary, isEmpty);
      expect(c.jobs, isEmpty);
    });

    test('пешниҳод: буҷетӣ аз paymentType «ройгон»', () {
      final free = Offering.fromJson({'paymentType': 'ройгон', 'university': {'id': 'u', 'name': 'ДМТ', 'city': 'Душанбе'}});
      final paid = Offering.fromJson({'paymentType': 'пулакӣ', 'tuitionFee': 8535});
      expect(free.free, isTrue);
      expect(free.city, 'Душанбе');
      expect(paid.free, isFalse);
      expect(paid.fee, 8535);
    });

    test('савол: вариантҳо бо тартиби аслӣ рақам мегиранд', () {
      final q = QuizQuestion.fromJson({
        'id': 'm01',
        'part': 'mmt',
        'question': {'tj': 'Савол?'},
        'options': [
          {'text': {'tj': 'Якум'}},
          {'text': {'tj': 'Дуюм'}},
        ],
      });
      expect(q.options.map((o) => o.value), ['0', '1']);
      expect(q.options.last.text, 'Дуюм');
    });

    test('натиҷа: фоизи самт аз миқёси 0–40', () {
      final r = QuizResult.fromJson({
        'topCluster': {'clusterName': 'Техникӣ', 'averageMatch': 75, 'specializations': [{'id': '1', 'name': 'Информатика', 'matchPercentage': 88, 'free': true}]},
        'allMatches': [{'clusterName': 'Техникӣ', 'score': 30}],
      });
      expect(r.clusterPercent, 75);
      expect(r.careers.single.percent, 88);
      expect(r.directions.single.value, 75);
    });
  });

  test('номҳо: рамзи дохилӣ пинҳон мешавад, қавси оддӣ мемонад', () {
    expect(cleanName('Бизнес-идора (ФМТДМТБваДТТ)'), 'Бизнес-идора');
    expect(cleanName('Таълими касбӣ (информатика)'), 'Таълими касбӣ (информатика)');
  });

  test('рақамҳо бо фосила: 8535 → «8 535»', () {
    expect(money(8535), '8 535');
    expect(money(950), '950');
    expect(money(1000000), '1 000 000');
  });

  testWidgets('экрани асосӣ: се амали калон ва 4 бахш дар поён', (tester) async {
    SharedPreferences.setMockInitialValues({'seenWelcome': true});
    await appSettings.load();
    await tester.pumpWidget(const IkhtisosiManApp());
    await tester.pumpAndSettle();

    expect(find.text('Тестро сар кунед'), findsOneWidget);
    expect(find.text('Ихтисосҳо'), findsWidgets);
    expect(find.text('Донишгоҳҳо ва коллеҷҳо'), findsOneWidget);
    expect(find.text('Донишгоҳҳо'), findsOneWidget);
    expect(find.text('Тест'), findsOneWidget);
  });

  test('почта ва парол: хатоҳо пеш аз фиристодан', () {
    expect(validateEmail(''), isNotNull);
    expect(validateEmail('ali@gmail'), isNotNull);
    expect(validateEmail(' ali@gmail.com '), isNull);
    expect(validatePassword('12345'), isNotNull);
    expect(validatePassword('123456'), isNull);
  });

  testWidgets('воридшавӣ: майдонҳои холӣ хато нишон медиҳанд, «фаромӯш кардам» ҳаст', (tester) async {
    await tester.pumpWidget(MaterialApp(home: const LoginScreen()));
    await tester.pumpAndSettle();
    expect(find.text('Паролро фаромӯш кардед?'), findsOneWidget);
    await tester.ensureVisible(find.text('Ворид шудан'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Ворид шудан'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Почтаро нависед'));
    expect(find.text('Почтаро нависед'), findsOneWidget);
    expect(find.text('Паролро нависед'), findsOneWidget);
  });

  testWidgets('рамзи 6-рақама: танҳо рақам, баъди 6-ум худаш мефиристад', (tester) async {
    final controller = TextEditingController();
    String? done;
    await tester.pumpWidget(MaterialApp(home: Scaffold(body: CodeInput(controller: controller, onCompleted: (c) => done = c))));
    await tester.enterText(find.byType(TextField), '12a3456789');
    await tester.pump();
    expect(controller.text, '123456');
    expect(done, '123456');
  });

  testWidgets('бори аввал «Хуш омадед», «Оғоз кардан» ба экрани асосӣ мебарад', (tester) async {
    SharedPreferences.setMockInitialValues({});
    await appSettings.load();
    await tester.pumpWidget(const IkhtisosiManApp());
    await tester.pumpAndSettle();
    expect(find.text('Хуш омадед ба'), findsOneWidget);
    await tester.tap(find.text('Оғоз кардан'));
    await tester.pumpAndSettle();
    expect(find.text('Тестро сар кунед'), findsOneWidget);
    final prefs = await SharedPreferences.getInstance();
    expect(prefs.getBool('seenWelcome'), isTrue);
  });

  testWidgets('забон: русӣ интихоб шуд — матнҳо фавран русӣ мешаванд', (tester) async {
    SharedPreferences.setMockInitialValues({'seenWelcome': true});
    await appSettings.load();
    await tester.pumpWidget(const IkhtisosiManApp());
    await tester.pumpAndSettle();
    await appSettings.setLang('ru');
    await tester.pumpAndSettle();
    expect(find.text('Начать тест'), findsOneWidget);
    expect(t('Хуш омадед, {name}!', {'name': 'Алӣ'}), 'Добро пожаловать, Алӣ!');
    await appSettings.setLang('tj');
    await tester.pumpAndSettle();
  });

  // Ҳар матне, ки дар код ба t('…') дода шудааст, бояд тарҷумаи русӣ ва англисӣ дошта бошад.
  test('тарҷума: ҳамаи матнҳои t() русӣ ва англисӣ доранд', () {
    final keys = <String>{};
    final pattern = RegExp(r"(?<![A-Za-z0-9_])t\('((?:[^'\\]|\\.)*)'");
    for (final f in Directory('lib').listSync(recursive: true).whereType<File>().where((f) => f.path.endsWith('.dart'))) {
      for (final m in pattern.allMatches(f.readAsStringSync())) {
        keys.add(m.group(1)!.replaceAll(r"\'", "'"));
      }
    }
    expect(keys.length, greaterThan(150));
    expect(keys.where((k) => !ru.containsKey(k)).toList(), isEmpty, reason: 'русӣ нест');
    expect(keys.where((k) => !en.containsKey(k)).toList(), isEmpty, reason: 'англисӣ нест');
  });
}

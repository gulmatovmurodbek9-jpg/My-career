import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ikhtisosi_man/api/models.dart';
import 'package:ikhtisosi_man/app/settings.dart';
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
    SharedPreferences.setMockInitialValues({});
    await appSettings.load();
    await tester.pumpWidget(const IkhtisosiManApp());
    await tester.pumpAndSettle();

    expect(find.text('Тестро сар кунед'), findsOneWidget);
    expect(find.text('Ихтисосҳо'), findsWidgets);
    expect(find.text('Донишгоҳҳо ва коллеҷҳо'), findsOneWidget);
    expect(find.byType(NavigationBar), findsOneWidget);
  });
}

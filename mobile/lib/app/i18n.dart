import 'i18n_en.dart';
import 'i18n_ru.dart';
import 'settings.dart';

// Тарҷума: калид — худи матни тоҷикӣ. Агар тарҷума набошад, матни тоҷикӣ нишон дода мешавад.
// Ҷойҳои холӣ: {n}, {email} ва ғ. — t('Баъди {n} сония', {'n': 5}).
String t(String tj, [Map<String, Object?> args = const {}]) {
  final lang = appSettings.lang;
  var s = lang == 'ru'
      ? (ru[tj] ?? tj)
      : lang == 'en'
      ? (en[tj] ?? tj)
      : tj;
  args.forEach((k, v) => s = s.replaceAll('{$k}', '$v'));
  return s;
}

// Номи забон барои интихоб.
const langNames = {'tj': 'Тоҷикӣ', 'ru': 'Русский', 'en': 'English'};
const langShort = {'tj': 'TJ', 'ru': 'RU', 'en': 'EN'};

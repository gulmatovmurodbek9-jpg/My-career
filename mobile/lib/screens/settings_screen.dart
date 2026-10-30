import 'package:flutter/material.dart';

import '../app/settings.dart';
import '../app/theme.dart';
import '../ui/widgets.dart';
import '../app/i18n.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  static List<String> get _labels => [t('Муқаррарӣ'), t('Калон'), t('Хеле калон')];

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return Scaffold(
      appBar: AppBar(title: Text(t('Танзимот'))),
      body: ListenableBuilder(
        listenable: appSettings,
        builder: (context, _) => ListView(
          padding: AppSizes.page,
          children: [
            Text(t('Забон'), style: text.titleLarge),
            const SizedBox(height: 12),
            for (final code in AppSettings.langs) ...[
              _Choice(label: langNames[code]!, selected: appSettings.lang == code, onTap: () => appSettings.setLang(code)),
              const SizedBox(height: 10),
            ],
            const SizedBox(height: 14),
            Text(t('Андозаи ҳарфҳо'), style: text.titleLarge),
            const SizedBox(height: 6),
            Text(t('Андозаеро интихоб кунед, ки хондан осон бошад.'), style: text.bodyMedium),
            const SizedBox(height: 14),
            for (var i = 0; i < AppSettings.textScales.length; i++) ...[
              _Choice(
                label: _labels[i],
                selected: appSettings.textScale == AppSettings.textScales[i],
                onTap: () => appSettings.setTextScale(AppSettings.textScales[i]),
                preview: 18 * AppSettings.textScales[i],
              ),
              const SizedBox(height: 10),
            ],
            SectionTitle(t('Шумо баъди кадом синф ҳастед?')),
            for (final g in [9, 11]) ...[
              _Choice(
                label: g == 9 ? t('Баъди синфи 9 (коллеҷ)') : t('Баъди синфи 11 (донишгоҳ ё коллеҷ)'),
                selected: appSettings.grade == g,
                onTap: () => appSettings.setGrade(g),
              ),
              const SizedBox(height: 10),
            ],
            const SizedBox(height: 18),
            Text(t('Сайт: ikhtisosiman.qobus.tj'), style: text.bodyMedium),
          ],
        ),
      ),
    );
  }
}

class _Choice extends StatelessWidget {
  const _Choice({required this.label, required this.selected, required this.onTap, this.preview});
  final String label;
  final bool selected;
  final VoidCallback onTap;
  final double? preview;

  @override
  Widget build(BuildContext context) => Semantics(
        selected: selected,
        button: true,
        child: Material(
          color: selected ? AppColors.contractSoft : Colors.white,
          borderRadius: BorderRadius.circular(AppSizes.radius),
          child: InkWell(
            borderRadius: BorderRadius.circular(AppSizes.radius),
            onTap: onTap,
            child: Container(
              constraints: const BoxConstraints(minHeight: AppSizes.buttonHeight + 4),
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(AppSizes.radius),
                border: Border.all(color: selected ? AppColors.primary : AppColors.border, width: selected ? 2.5 : 2),
              ),
              child: Row(children: [
                Icon(selected ? Icons.radio_button_checked_rounded : Icons.radio_button_off_rounded, size: 26, color: selected ? AppColors.primary : AppColors.textSoft),
                const SizedBox(width: 14),
                Expanded(child: Text(label, style: TextStyle(fontSize: preview ?? 19, fontWeight: FontWeight.w700, color: AppColors.text))),
              ]),
            ),
          ),
        ),
      );
}

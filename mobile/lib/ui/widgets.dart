import 'package:flutter/material.dart';

import '../app/theme.dart';

String money(int n) {
  final s = n.toString();
  final buffer = StringBuffer();
  for (var i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 == 0) buffer.write(' ');
    buffer.write(s[i]);
  }
  return buffer.toString();
}

// Карточкаи калон бо нишона, сарлавҳа ва шарҳ — барои амалҳои асосӣ дар экрани аввал.
class ActionCard extends StatelessWidget {
  const ActionCard({super.key, required this.icon, required this.title, required this.subtitle, required this.onTap, this.primary = false});

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  final bool primary;

  @override
  Widget build(BuildContext context) {
    final fg = primary ? Colors.white : AppColors.text;
    return Semantics(
      button: true,
      label: '$title. $subtitle',
      child: Material(
        color: primary ? AppColors.primary : AppColors.card,
        borderRadius: BorderRadius.circular(AppSizes.radius + 4),
        child: InkWell(
          borderRadius: BorderRadius.circular(AppSizes.radius + 4),
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(AppSizes.radius + 4),
              border: primary ? null : Border.all(color: AppColors.border, width: 2),
            ),
            child: Row(
              children: [
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    color: primary ? Colors.white.withValues(alpha: 0.18) : AppColors.contractSoft,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Icon(icon, size: 34, color: primary ? Colors.white : AppColors.primary),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title, style: TextStyle(fontSize: 21, fontWeight: FontWeight.w800, color: fg)),
                      const SizedBox(height: 4),
                      Text(subtitle, style: TextStyle(fontSize: 16, height: 1.35, color: primary ? Colors.white.withValues(alpha: 0.92) : AppColors.textSoft)),
                    ],
                  ),
                ),
                Icon(Icons.chevron_right_rounded, size: 34, color: fg),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class Badge2 extends StatelessWidget {
  const Badge2(this.text, {super.key, this.color = AppColors.primary, this.background = AppColors.contractSoft});
  final String text;
  final Color color;
  final Color background;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(color: background, borderRadius: BorderRadius.circular(999)),
        child: Text(text, style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: color)),
      );
}

class AppCard extends StatelessWidget {
  const AppCard({super.key, required this.child, this.onTap, this.padding = const EdgeInsets.all(18)});
  final Widget child;
  final VoidCallback? onTap;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context) => Material(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(AppSizes.radius),
        child: InkWell(
          borderRadius: BorderRadius.circular(AppSizes.radius),
          onTap: onTap,
          child: Container(
            width: double.infinity,
            padding: padding,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(AppSizes.radius),
              border: Border.all(color: AppColors.border, width: 1.5),
            ),
            child: child,
          ),
        ),
      );
}

class LoadingView extends StatelessWidget {
  const LoadingView({super.key, this.text = 'Каме интизор шавед…'});
  final String text;

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            const SizedBox(width: 48, height: 48, child: CircularProgressIndicator(strokeWidth: 5)),
            const SizedBox(height: 20),
            Text(text, textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodyLarge),
          ]),
        ),
      );
}

class ErrorView extends StatelessWidget {
  const ErrorView({super.key, required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            const Icon(Icons.wifi_off_rounded, size: 64, color: AppColors.textSoft),
            const SizedBox(height: 16),
            Text(message, textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodyLarge),
            const SizedBox(height: 24),
            FilledButton.icon(onPressed: onRetry, icon: const Icon(Icons.refresh_rounded, size: 28), label: const Text('Боз кӯшиш кунед')),
          ]),
        ),
      );
}

class SectionTitle extends StatelessWidget {
  const SectionTitle(this.text, {super.key});
  final String text;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(top: 24, bottom: 12),
        child: Text(text, style: Theme.of(context).textTheme.titleLarge),
      );
}

// Сатри «тамға: қимат», масалан «Навкор: 2 500 – 5 000 сомонӣ».
class InfoRow extends StatelessWidget {
  const InfoRow(this.label, this.value, {super.key});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Expanded(flex: 2, child: Text(label, style: Theme.of(context).textTheme.bodyMedium)),
          const SizedBox(width: 12),
          Expanded(flex: 3, child: Text(value, style: Theme.of(context).textTheme.titleMedium)),
        ]),
      );
}

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../app/theme.dart';
import '../app/i18n.dart';

String money(int n) {
  final s = n.toString();
  final buffer = StringBuffer();
  for (var i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 == 0) buffer.write(' ');
    buffer.write(s[i]);
  }
  return buffer.toString();
}

// Гузариши нарм байни экранҳо: пайдо шудан ва каме боло баромадан.
Route<T> smoothRoute<T>(Widget page) => PageRouteBuilder<T>(
      transitionDuration: const Duration(milliseconds: 320),
      reverseTransitionDuration: const Duration(milliseconds: 240),
      pageBuilder: (_, _, _) => page,
      transitionsBuilder: (_, animation, _, child) {
        final curved = CurvedAnimation(parent: animation, curve: Curves.easeOutCubic);
        return FadeTransition(
          opacity: curved,
          child: SlideTransition(position: Tween(begin: const Offset(0, 0.04), end: Offset.zero).animate(curved), child: child),
        );
      },
    );

// Нишонаи мураббаъ бо градиенти бренд (мисли сайт: «Хуш омадед!»).
class GradientIcon extends StatelessWidget {
  const GradientIcon(this.icon, {super.key, this.size = 72});
  final IconData icon;
  final double size;

  @override
  Widget build(BuildContext context) => Container(
        width: size,
        height: size,
        decoration: BoxDecoration(gradient: AppColors.brandGradient, borderRadius: BorderRadius.circular(size * 0.3), boxShadow: buttonShadow),
        child: Icon(icon, size: size * 0.48, color: Colors.white),
      );
}

// Тугмаи асосӣ бо градиент ва ҳолати боркунӣ.
class GradientButton extends StatelessWidget {
  const GradientButton({super.key, required this.label, required this.onPressed, this.loading = false, this.icon = Icons.arrow_forward_rounded, this.height = AppSizes.buttonHeight});
  final String label;
  final VoidCallback? onPressed;
  final bool loading;
  final IconData? icon;
  final double height;

  @override
  Widget build(BuildContext context) {
    final enabled = onPressed != null && !loading;
    return Semantics(
      button: true,
      enabled: enabled,
      label: label,
      child: AnimatedOpacity(
        duration: const Duration(milliseconds: 200),
        opacity: onPressed == null ? 0.55 : 1,
        child: DecoratedBox(
          decoration: BoxDecoration(gradient: AppColors.brandGradient, borderRadius: BorderRadius.circular(AppSizes.radius), boxShadow: enabled ? buttonShadow : null),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              borderRadius: BorderRadius.circular(AppSizes.radius),
              onTap: enabled
                  ? () {
                      HapticFeedback.lightImpact();
                      onPressed!();
                    }
                  : null,
              child: SizedBox(
                height: height,
                child: Center(
                  child: AnimatedSwitcher(
                    duration: const Duration(milliseconds: 200),
                    child: loading
                        ? const SizedBox(key: ValueKey('l'), width: 28, height: 28, child: CircularProgressIndicator(strokeWidth: 3, color: Colors.white))
                        : Row(key: const ValueKey('t'), mainAxisSize: MainAxisSize.min, children: [
                            Text(label, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.white, letterSpacing: 0.1)),
                            if (icon != null) ...[const SizedBox(width: 8), Icon(icon, color: Colors.white, size: 21)],
                          ]),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// Майдон бо тамға дар боло ва нишона (мисли «Имейл», «Парол» дар сайт).
class LabeledField extends StatelessWidget {
  const LabeledField({
    super.key,
    required this.label,
    required this.controller,
    required this.icon,
    this.hint,
    this.validator,
    this.keyboardType,
    this.textInputAction = TextInputAction.next,
    this.onSubmitted,
    this.autofillHints,
    this.obscure = false,
    this.suffix,
    this.trailing,
    this.dense = false,
  });

  final String label;
  final TextEditingController controller;
  final IconData icon;
  final String? hint;
  final String? Function(String?)? validator;
  final TextInputType? keyboardType;
  final TextInputAction textInputAction;
  final ValueChanged<String>? onSubmitted;
  final Iterable<String>? autofillHints;
  final bool obscure;
  final Widget? suffix;
  final Widget? trailing; // масалан «Паролро фаромӯш кардам?»
  final bool dense; // зичтар — барои формаҳои воридшавӣ, то дар як экран ҷой шаванд

  @override
  Widget build(BuildContext context) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Expanded(child: Text(label, style: TextStyle(fontSize: dense ? 15 : 16, fontWeight: FontWeight.w600, color: AppColors.text))),
          ?trailing,
        ]),
        SizedBox(height: dense ? 6 : 8),
        TextFormField(
          controller: controller,
          validator: validator,
          keyboardType: keyboardType,
          textInputAction: textInputAction,
          onFieldSubmitted: onSubmitted,
          autofillHints: autofillHints,
          obscureText: obscure,
          autocorrect: false,
          enableSuggestions: !obscure,
          style: TextStyle(fontSize: dense ? 16 : 18, color: AppColors.text),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: dense ? const TextStyle(fontSize: 15, color: AppColors.textSoft) : null,
            isDense: dense,
            contentPadding: dense ? const EdgeInsets.symmetric(horizontal: 14, vertical: 14) : null,
            prefixIcon: Icon(icon, size: dense ? 21 : 24),
            suffixIcon: suffix,
          ),
        ),
      ]);
}

// Паёми хато ё муваффақият дар дохили форма — бо пайдошавии нарм.
class FormMessage extends StatelessWidget {
  const FormMessage({super.key, required this.text, this.success = false});
  final String? text;
  final bool success;

  @override
  Widget build(BuildContext context) => AnimatedSize(
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOutCubic,
        child: text == null || text!.isEmpty
            ? const SizedBox(width: double.infinity)
            : Container(
                width: double.infinity,
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: success ? AppColors.budgetSoft : AppColors.dangerSoft,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Icon(success ? Icons.check_circle_rounded : Icons.error_rounded, color: success ? AppColors.budget : AppColors.danger, size: 26),
                  const SizedBox(width: 10),
                  Expanded(child: Text(text!, style: TextStyle(fontSize: 16, height: 1.4, fontWeight: FontWeight.w600, color: success ? AppColors.budget : AppColors.danger))),
                ]),
              ),
      );
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
    final radius = BorderRadius.circular(AppSizes.cardRadius + 4);
    return Semantics(
      button: true,
      label: '$title. $subtitle',
      child: Container(
        decoration: BoxDecoration(
          gradient: primary ? AppColors.brandGradient : null,
          color: primary ? null : AppColors.card,
          borderRadius: radius,
          border: primary ? null : Border.all(color: AppColors.border),
          boxShadow: primary ? buttonShadow : cardShadow,
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            borderRadius: radius,
            onTap: onTap,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 10, 16),
              child: Row(children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: primary ? Colors.white.withValues(alpha: 0.18) : AppColors.contractSoft,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Icon(icon, size: 26, color: primary ? Colors.white : AppColors.primary),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(title, style: TextStyle(fontFamily: AppFonts.display, fontSize: 18, fontWeight: FontWeight.w700, color: fg)),
                    const SizedBox(height: 2),
                    Text(subtitle, style: TextStyle(fontSize: 14, height: 1.35, color: primary ? Colors.white.withValues(alpha: 0.92) : AppColors.textSoft)),
                  ]),
                ),
                Icon(Icons.chevron_right_rounded, size: 26, color: fg),
              ]),
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
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(color: background, borderRadius: BorderRadius.circular(999)),
        child: Text(text, style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600, color: color)),
      );
}

// Карточкаи сафед бо сояи нарми кабуд — мисли .glass-card дар сайт.
class AppCard extends StatelessWidget {
  const AppCard({super.key, required this.child, this.onTap, this.padding = const EdgeInsets.all(16)});
  final Widget child;
  final VoidCallback? onTap;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context) {
    final radius = BorderRadius.circular(AppSizes.cardRadius);
    return Container(
      decoration: BoxDecoration(color: AppColors.card, borderRadius: radius, border: Border.all(color: AppColors.border), boxShadow: cardShadow),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: radius,
          onTap: onTap,
          child: Padding(padding: padding, child: SizedBox(width: double.infinity, child: child)),
        ),
      ),
    );
  }
}

class LoadingView extends StatelessWidget {
  const LoadingView({super.key, this.text});
  final String? text;

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            const SizedBox(width: 48, height: 48, child: CircularProgressIndicator(strokeWidth: 5)),
            const SizedBox(height: 20),
            Text(text ?? t('Каме интизор шавед…'), textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodyLarge),
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
            FilledButton.icon(onPressed: onRetry, icon: const Icon(Icons.refresh_rounded, size: 28), label: Text(t('Боз кӯшиш кунед'))),
          ]),
        ),
      );
}

class SectionTitle extends StatelessWidget {
  const SectionTitle(this.text, {super.key});
  final String text;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(top: 22, bottom: 10),
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

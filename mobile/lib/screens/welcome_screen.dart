import 'package:flutter/material.dart';

import '../app/i18n.dart';
import '../app/settings.dart';
import '../app/theme.dart';
import '../ui/widgets.dart';
import 'auth/auth_ui.dart';
import 'auth/login_screen.dart';

// Экрани аввал — танҳо бори якум, вақте барнома нав насб шудааст.
// «Оғоз кардан» → ба барнома; «Воридшавӣ» → ба барнома ва экрани воридшавӣ.
class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  void _start(BuildContext context, {bool login = false}) {
    final navigator = Navigator.of(context);
    appSettings.markWelcomeSeen();
    if (login) navigator.push(authRoute(const LoginScreen()));
  }

  @override
  Widget build(BuildContext context) {
    // Ҳама дар як экран, бе скрол: сурат ҷои боқимондаро мегирад ва дар телефони хурд худаш хурд мешавад.
    return Scaffold(
      backgroundColor: AppColors.background,
      body: DecoratedBox(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [AppColors.dark ? const Color(0xFF0D1426) : const Color(0xFFF1F4FF), AppColors.background],
            stops: const [0, 0.55],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 460),
              child: MediaQuery.withClampedTextScaling(
                maxScaleFactor: 1.1,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 6),
                            decoration: BoxDecoration(color: AppColors.contractSoft, borderRadius: BorderRadius.circular(999)),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Container(
                                  width: 7,
                                  height: 7,
                                  decoration: BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
                                ),
                                const SizedBox(width: 7),
                                Text(
                                  t('РОҲНАМОИ КАСБӢ'),
                                  style: TextStyle(fontSize: 11.5, letterSpacing: 0.6, fontWeight: FontWeight.w700, color: AppColors.primary),
                                ),
                              ],
                            ),
                          ),
                          const Spacer(),
                          const LangButton(),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Expanded(
                        child: _Appear(
                          delay: 0,
                          child: LayoutBuilder(
                            builder: (context, box) {
                              final size = box.maxHeight.clamp(0.0, 300.0);
                              return Stack(
                                alignment: Alignment.center,
                                children: [
                                  Container(
                                    width: size * 0.95,
                                    height: size * 0.95,
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      gradient: RadialGradient(colors: [AppColors.accent.withValues(alpha: 0.13), AppColors.accent.withValues(alpha: 0)]),
                                    ),
                                  ),
                                  Image.asset('assets/images/welcome_boy.webp', height: size, fit: BoxFit.contain, filterQuality: FilterQuality.medium),
                                ],
                              );
                            },
                          ),
                        ),
                      ),
                      const SizedBox(height: 10),
                      _Appear(
                        delay: 120,
                        child: InfoChip(icon: Icons.auto_awesome_rounded, text: t('Интихоби дуруст — ояндаи дурахшон')),
                      ),
                      const SizedBox(height: 14),
                      _Appear(
                        delay: 200,
                        child: Column(
                          children: [
                            Text(
                              t('Хуш омадед ба'),
                              textAlign: TextAlign.center,
                              style: TextStyle(fontFamily: AppFonts.display, fontSize: 23, fontWeight: FontWeight.w700, color: AppColors.text, height: 1.15),
                            ),
                            ShaderMask(
                              shaderCallback: (r) => AppColors.brandGradient.createShader(r),
                              child: Text(
                                t('«Ихтисоси ман»'),
                                textAlign: TextAlign.center,
                                style: const TextStyle(fontFamily: AppFonts.display, fontSize: 25, fontWeight: FontWeight.w700, color: Colors.white, height: 1.25),
                              ),
                            ),
                            const SizedBox(height: 10),
                            Text(
                              t('Истеъдодҳои пинҳонии худро кашф кунед ва роҳи беҳтарини касбиатонро ёбед.'),
                              textAlign: TextAlign.center,
                              style: TextStyle(fontSize: 14, height: 1.4, color: AppColors.textSoft),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),
                      _Appear(delay: 280, child: const _Facts()),
                      const SizedBox(height: 16),
                      _Appear(
                        delay: 340,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            GradientButton(label: t('Оғоз кардан'), height: 50, onPressed: () => _start(context)),
                            const SizedBox(height: 10),
                            SizedBox(
                              height: 50,
                              child: OutlinedButton.icon(
                                style: OutlinedButton.styleFrom(
                                  minimumSize: const Size.fromHeight(50),
                                  foregroundColor: AppColors.primary,
                                  side: BorderSide(color: AppColors.primary.withValues(alpha: 0.55)),
                                ),
                                onPressed: () => _start(context, login: true),
                                icon: const Icon(Icons.login_rounded, size: 20),
                                label: Text(t('Воридшавӣ')),
                              ),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              t('Ройгон • Тест тақрибан 7 дақиқа'),
                              textAlign: TextAlign.center,
                              style: TextStyle(fontSize: 12, color: AppColors.textSoft),
                            ),
                          ],
                        ),
                      ),
                    ],
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

// Се рақами воқеӣ дар як тасма: ихтисосҳо, донишгоҳҳо, самтҳо.
class _Facts extends StatelessWidget {
  const _Facts();

  @override
  Widget build(BuildContext context) {
    Widget item(String n, String label) => Expanded(
      child: Column(
        children: [
          Text(
            n,
            style: TextStyle(fontFamily: AppFonts.display, fontSize: 17, fontWeight: FontWeight.w700, color: AppColors.primary),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(fontSize: 12, color: AppColors.textSoft),
          ),
        ],
      ),
    );
    Widget line() => Container(width: 1, height: 28, color: AppColors.border);
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 6),
      decoration: BoxDecoration(color: AppColors.contractSoft.withValues(alpha: 0.55), borderRadius: BorderRadius.circular(16)),
      child: Row(children: [item('884', t('ихтисос')), line(), item('128', t('муассиса')), line(), item('5', t('самти касбӣ'))]),
    );
  }
}

// Пайдошавии нарм бо таъхир — барои ҷузъҳои экрани аввал.
class _Appear extends StatelessWidget {
  const _Appear({required this.delay, required this.child});
  final int delay;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final total = 520 + delay;
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: Duration(milliseconds: total),
      curve: Interval(delay / total, 1, curve: Curves.easeOutCubic),
      builder: (context, v, child) => Opacity(
        opacity: v,
        child: Transform.translate(offset: Offset(0, 18 * (1 - v)), child: child),
      ),
      child: child,
    );
  }
}

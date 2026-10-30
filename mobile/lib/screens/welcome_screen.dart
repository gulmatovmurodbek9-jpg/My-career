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
    final height = MediaQuery.sizeOf(context).height;
    return Scaffold(
      backgroundColor: Colors.white,
      body: DecoratedBox(
        decoration: const BoxDecoration(
          gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Color(0xFFF1F4FF), Colors.white], stops: [0, 0.55]),
        ),
        child: SafeArea(
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 460),
              child: CustomScrollView(slivers: [
                SliverFillRemaining(
                  hasScrollBody: false,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 10, 20, 14),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                      Row(children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 6),
                          decoration: BoxDecoration(color: AppColors.contractSoft, borderRadius: BorderRadius.circular(999)),
                          child: Row(mainAxisSize: MainAxisSize.min, children: [
                            Container(width: 7, height: 7, decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle)),
                            const SizedBox(width: 7),
                            Text(t('РОҲНАМОИ КАСБӢ'), style: const TextStyle(fontSize: 11.5, letterSpacing: 0.6, fontWeight: FontWeight.w800, color: AppColors.primary)),
                          ]),
                        ),
                        const Spacer(),
                        const LangButton(),
                      ]),
                      const Spacer(),
                      _Appear(
                        delay: 0,
                        child: Stack(alignment: Alignment.center, children: [
                          Container(
                            width: height * 0.32,
                            height: height * 0.32,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: RadialGradient(colors: [AppColors.accent.withValues(alpha: 0.13), AppColors.accent.withValues(alpha: 0)]),
                            ),
                          ),
                          Image.asset('assets/images/welcome_boy.webp', height: (height * 0.34).clamp(180, 330), fit: BoxFit.contain, filterQuality: FilterQuality.medium),
                        ]),
                      ),
                      const SizedBox(height: 12),
                      _Appear(delay: 120, child: InfoChip(icon: Icons.auto_awesome_rounded, text: t('Интихоби дуруст — ояндаи дурахшон'))),
                      const SizedBox(height: 14),
                      _Appear(
                        delay: 200,
                        child: Column(children: [
                          Text(t('Хуш омадед ба'), textAlign: TextAlign.center, style: const TextStyle(fontFamily: AppFonts.display, fontSize: 27, fontWeight: FontWeight.w800, color: AppColors.text, height: 1.15)),
                          ShaderMask(
                            shaderCallback: (r) => AppColors.brandGradient.createShader(r),
                            child: Text(t('«Ихтисоси ман»'), textAlign: TextAlign.center, style: const TextStyle(fontFamily: AppFonts.display, fontSize: 29, fontWeight: FontWeight.w800, color: Colors.white, height: 1.25)),
                          ),
                          const SizedBox(height: 10),
                          Text(
                            t('Истеъдодҳои пинҳонии худро кашф кунед ва роҳи беҳтарини касбиатонро ёбед.'),
                            textAlign: TextAlign.center,
                            style: const TextStyle(fontSize: 15.5, height: 1.45, color: AppColors.textSoft),
                          ),
                        ]),
                      ),
                      const SizedBox(height: 16),
                      _Appear(delay: 280, child: const _Facts()),
                      const Spacer(),
                      const SizedBox(height: 16),
                      _Appear(
                        delay: 340,
                        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                          GradientButton(label: t('Оғоз кардан'), height: 54, onPressed: () => _start(context)),
                          const SizedBox(height: 10),
                          SizedBox(
                            height: 54,
                            child: OutlinedButton.icon(
                              style: OutlinedButton.styleFrom(
                                minimumSize: const Size.fromHeight(54),
                                foregroundColor: AppColors.primary,
                                side: const BorderSide(color: AppColors.primary, width: 1.5),
                              ),
                              onPressed: () => _start(context, login: true),
                              icon: const Icon(Icons.login_rounded, size: 20),
                              label: Text(t('Воридшавӣ')),
                            ),
                          ),
                          const SizedBox(height: 12),
                          Text(t('Ройгон • Тест тақрибан 7 дақиқа'), textAlign: TextAlign.center, style: const TextStyle(fontSize: 13, color: AppColors.textSoft)),
                        ]),
                      ),
                    ]),
                  ),
                ),
              ]),
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
          child: Column(children: [
            Text(n, style: const TextStyle(fontFamily: AppFonts.display, fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.primary)),
            const SizedBox(height: 2),
            Text(label, textAlign: TextAlign.center, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12, color: AppColors.textSoft)),
          ]),
        );
    Widget line() => Container(width: 1, height: 28, color: AppColors.border);
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 6),
      decoration: BoxDecoration(color: AppColors.contractSoft.withValues(alpha: 0.55), borderRadius: BorderRadius.circular(16)),
      child: Row(children: [
        item('884', t('ихтисос')),
        line(),
        item('128', t('муассиса')),
        line(),
        item('5', t('самти касбӣ')),
      ]),
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
      builder: (context, v, child) => Opacity(opacity: v, child: Transform.translate(offset: Offset(0, 18 * (1 - v)), child: child)),
      child: child,
    );
  }
}

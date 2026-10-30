import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../api/api.dart';
import '../../app/auth.dart';
import '../../app/i18n.dart';
import '../../ui/widgets.dart';
import 'auth_ui.dart';
import 'forgot_password_screen.dart';
import 'register_screen.dart';
import 'verify_email_screen.dart';

// Баъди воридшавӣ ҳамаи экранҳои воридшавӣ баста мешаванд ва корбар ба ҷое бармегардад, ки аз он омада буд.
void closeAuthFlow(BuildContext context) {
  Navigator.of(context).popUntil((r) => r.settings.name != authRouteName);
}

const authRouteName = 'auth';

Route<T> authRoute<T>(Widget page) => PageRouteBuilder<T>(
      settings: const RouteSettings(name: authRouteName),
      transitionDuration: const Duration(milliseconds: 320),
      reverseTransitionDuration: const Duration(milliseconds: 240),
      pageBuilder: (_, _, _) => page,
      transitionsBuilder: (_, animation, _, child) {
        final curved = CurvedAnimation(parent: animation, curve: Curves.easeOutCubic);
        return FadeTransition(
          opacity: curved,
          child: SlideTransition(position: Tween(begin: const Offset(0.06, 0), end: Offset.zero).animate(curved), child: child),
        );
      },
    );

void welcomeSnack(BuildContext context, String text) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));

// Тугмаи Google бо ҳолати боркунӣ — дар воридшавӣ ва бақайдгирӣ.
class GoogleLoginSection extends StatefulWidget {
  const GoogleLoginSection({super.key, required this.onError});
  final ValueChanged<String> onError;

  @override
  State<GoogleLoginSection> createState() => _GoogleLoginSectionState();
}

class _GoogleLoginSectionState extends State<GoogleLoginSection> {
  bool _loading = false;

  Future<void> _go() async {
    setState(() => _loading = true);
    try {
      final ok = await authStore.googleLogin();
      if (!mounted) return;
      setState(() => _loading = false);
      if (ok) {
        welcomeSnack(context, t('Хуш омадед, {name}!', {'name': authStore.user?.displayName ?? ''}));
        closeAuthFlow(context);
      }
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      widget.onError(e.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!AuthStore.googleAvailable) return const SizedBox.shrink();
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      const OrDivider(),
      GoogleButton(onPressed: _go, loading: _loading),
    ]);
  }
}

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, this.email});
  final String? email;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _form = GlobalKey<FormState>();
  late final _email = TextEditingController(text: widget.email);
  final _password = TextEditingController();
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    if (!_form.currentState!.validate()) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await authStore.login(_email.text, _password.text);
      if (!mounted) return;
      TextInput.finishAutofillContext();
      welcomeSnack(context, t('Хуш омадед, {name}!', {'name': authStore.user?.displayName ?? ''}));
      closeAuthFlow(context);
    } on ApiException catch (e) {
      if (!mounted) return;
      if (e.code == 'EMAIL_NOT_VERIFIED') {
        setState(() => _loading = false);
        final email = (e.data?['email'] as String?) ?? _email.text.trim();
        // Коди нав мефиристем, то корбар интизори коди кӯҳна нашавад.
        authStore.resendCode(email).catchError((_) {});
        Navigator.of(context).push(authRoute(VerifyEmailScreen(email: email)));
        return;
      }
      setState(() {
        _loading = false;
        _error = e.status == 401 ? t('Почта ё парол нодуруст аст.') : e.message;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthScaffold(
      barTitle: t('Воридшавӣ'),
      image: 'assets/images/login_boy.webp',
      heading: t('Хуш омадед!'),
      subtitle: t('Барои идомаи роҳи касбӣ ба ҳисоби худ ворид шавед'),
      footer: AuthFooter(
        text: t('Ҳисоб надоред?'),
        action: t('Бақайдгирӣ'),
        onTap: () => Navigator.of(context).pushReplacement(authRoute(const RegisterScreen())),
      ),
      child: AutofillGroup(
        child: Form(
          key: _form,
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            FormMessage(text: _error),
            AuthField(
              label: t('Почтаи электронӣ'),
              controller: _email,
              icon: Icons.mail_outline_rounded,
              hint: 'nom@gmail.com',
              keyboardType: TextInputType.emailAddress,
              autofillHints: const [AutofillHints.email],
              validator: validateEmail,
            ),
            const SizedBox(height: 14),
            AuthField(
              label: t('Парол'),
              controller: _password,
              icon: Icons.lock_outline_rounded,
              hint: '••••••••',
              password: true,
              textInputAction: TextInputAction.done,
              onSubmitted: (_) => _submit(),
              autofillHints: const [AutofillHints.password],
              validator: (v) => (v ?? '').isEmpty ? t('Паролро нависед') : null,
            ),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: () => Navigator.of(context).push(authRoute(ForgotPasswordScreen(email: _email.text.trim()))),
                child: Text(t('Паролро фаромӯш кардед?'), style: const TextStyle(fontSize: 14.5, fontWeight: FontWeight.w800)),
              ),
            ),
            const SizedBox(height: 4),
            GradientButton(label: t('Ворид шудан'), loading: _loading, onPressed: _submit, height: 54),
            GoogleLoginSection(onError: (m) => setState(() => _error = m)),
          ]),
        ),
      ),
    );
  }
}

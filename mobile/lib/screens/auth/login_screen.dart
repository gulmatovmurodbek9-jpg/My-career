import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../api/api.dart';
import '../../app/auth.dart';
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
          child: SlideTransition(position: Tween(begin: const Offset(0, 0.04), end: Offset.zero).animate(curved), child: child),
        );
      },
    );

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
  bool _showPassword = false;
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
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Хуш омадед, ${authStore.user?.displayName ?? ''}!')));
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
        _error = e.status == 401 ? 'Почта ё парол нодуруст аст.' : e.message;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthScaffold(
      icon: Icons.lock_open_rounded,
      title: 'Хуш омадед!',
      subtitle: 'Барои нигоҳ доштани натиҷаҳо ба ҳисоби худ ворид шавед',
      footer: AuthFooter(
        text: 'Ҳисоб надоред?',
        action: 'Бақайдгирӣ',
        onTap: () => Navigator.of(context).pushReplacement(authRoute(const RegisterScreen())),
      ),
      child: AutofillGroup(
        child: Form(
          key: _form,
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            FormMessage(text: _error),
            LabeledField(
              label: 'Почтаи электронӣ',
              controller: _email,
              icon: Icons.mail_outline_rounded,
              hint: 'nom@gmail.com',
              keyboardType: TextInputType.emailAddress,
              autofillHints: const [AutofillHints.email],
              validator: validateEmail,
            ),
            const SizedBox(height: 18),
            LabeledField(
              label: 'Парол',
              controller: _password,
              icon: Icons.lock_outline_rounded,
              hint: 'Пароли худро нависед',
              obscure: !_showPassword,
              textInputAction: TextInputAction.done,
              onSubmitted: (_) => _submit(),
              autofillHints: const [AutofillHints.password],
              validator: (v) => (v ?? '').isEmpty ? 'Паролро нависед' : null,
              suffix: EyeButton(visible: _showPassword, onTap: () => setState(() => _showPassword = !_showPassword)),
            ),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: () => Navigator.of(context).push(authRoute(ForgotPasswordScreen(email: _email.text.trim()))),
                child: const Text('Паролро фаромӯш кардам?'),
              ),
            ),
            const SizedBox(height: 8),
            GradientButton(label: 'Ворид шудан', icon: Icons.login_rounded, loading: _loading, onPressed: _submit),
          ]),
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';

import '../../api/api.dart';
import '../../app/auth.dart';
import '../../app/i18n.dart';
import '../../ui/widgets.dart';
import 'auth_ui.dart';
import 'login_screen.dart';
import 'reset_password_screen.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key, this.email});
  final String? email;

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _form = GlobalKey<FormState>();
  late final _email = TextEditingController(text: widget.email);
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
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
      await authStore.forgotPassword(_email.text);
      if (!mounted) return;
      setState(() => _loading = false);
      Navigator.of(context).pushReplacement(authRoute(ResetPasswordScreen(email: _email.text.trim())));
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.message;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthScaffold(
      barTitle: t('Барқарорсозӣ'),
      icon: Icons.key_rounded,
      heading: t('Паролро фаромӯш кардед?'),
      subtitle: t('Парво накунед! Почтаатонро нависед — ба он рамзи 6-рақама мефиристем, то пароли нав гузоред.'),
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
            textInputAction: TextInputAction.done,
            onSubmitted: (_) => _submit(),
            autofillHints: const [AutofillHints.email],
            validator: validateEmail,
          ),
          const SizedBox(height: 18),
          GradientButton(label: t('Рамзро фиристед'), loading: _loading, onPressed: _submit, height: 54),
          const SizedBox(height: 14),
          Center(
            child: TextButton.icon(
              onPressed: () => Navigator.of(context).maybePop(),
              icon: const Icon(Icons.arrow_back_rounded, size: 18),
              label: Text(t('Бозгашт ба воридшавӣ')),
            ),
          ),
        ]),
      ),
    );
  }
}

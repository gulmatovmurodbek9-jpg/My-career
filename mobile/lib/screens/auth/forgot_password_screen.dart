import 'package:flutter/material.dart';

import '../../api/api.dart';
import '../../app/auth.dart';
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
      icon: Icons.key_rounded,
      title: 'Паролро фаромӯш кардед?',
      subtitle: 'Почтаатонро нависед — ба он рамзи 6-рақама мефиристем, то пароли нав гузоред',
      footer: AuthFooter(
        text: 'Паролро ёд овардед?',
        action: 'Ворид шудан',
        onTap: () => Navigator.of(context).maybePop(),
      ),
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
            textInputAction: TextInputAction.done,
            onSubmitted: (_) => _submit(),
            autofillHints: const [AutofillHints.email],
            validator: validateEmail,
          ),
          const SizedBox(height: 22),
          GradientButton(label: 'Рамзро фиристед', icon: Icons.send_rounded, loading: _loading, onPressed: _submit),
        ]),
      ),
    );
  }
}

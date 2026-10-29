import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../api/api.dart';
import '../../app/auth.dart';
import '../../app/theme.dart';
import '../../ui/widgets.dart';
import 'auth_ui.dart';
import 'login_screen.dart';

class ResetPasswordScreen extends StatefulWidget {
  const ResetPasswordScreen({super.key, required this.email});
  final String email;

  @override
  State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen> {
  final _form = GlobalKey<FormState>();
  final _code = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  bool _showPassword = false;
  bool _loading = false;
  String? _error;
  String? _info;
  int _wait = 60;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _startTimer(60);
  }

  @override
  void dispose() {
    _timer?.cancel();
    _code.dispose();
    _password.dispose();
    _confirm.dispose();
    super.dispose();
  }

  void _startTimer(int seconds) {
    _timer?.cancel();
    setState(() => _wait = seconds);
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) return t.cancel();
      setState(() => _wait--);
      if (_wait <= 0) t.cancel();
    });
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    final codeOk = _code.text.length == 6;
    if (!_form.currentState!.validate() || !codeOk) {
      if (!codeOk) setState(() => _error = 'Рамзи 6-рақамаро аз почта нависед');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
      _info = null;
    });
    try {
      final message = await authStore.resetPassword(widget.email, _code.text, _password.text);
      if (!mounted) return;
      TextInput.finishAutofillContext();
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
      Navigator.of(context).pushReplacement(authRoute(LoginScreen(email: widget.email)));
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.message;
      });
    }
  }

  Future<void> _resend() async {
    setState(() {
      _error = null;
      _info = null;
    });
    try {
      await authStore.forgotPassword(widget.email);
      if (!mounted) return;
      setState(() => _info = 'Рамзи нав фиристода шуд.');
      _startTimer(60);
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _error = e.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthScaffold(
      icon: Icons.lock_reset_rounded,
      title: 'Пароли нав',
      subtitle: 'Агар ${widget.email} дар сайт бошад, ба он рамзи 6-рақама фиристодем. Почта ва «Спам»-ро санҷед.',
      child: AutofillGroup(
        child: Form(
          key: _form,
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            FormMessage(text: _error),
            FormMessage(text: _info, success: true),
            const Text('Рамз аз почта', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.text)),
            const SizedBox(height: 8),
            CodeInput(controller: _code),
            Center(
              child: _wait > 0
                  ? Padding(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      child: Text('Рамзи навро баъди $_wait сония гирифта метавонед', textAlign: TextAlign.center, style: const TextStyle(fontSize: 15, color: AppColors.textSoft)),
                    )
                  : TextButton.icon(onPressed: _resend, icon: const Icon(Icons.refresh_rounded), label: const Text('Рамзро боз фиристед')),
            ),
            const SizedBox(height: 6),
            LabeledField(
              label: 'Пароли нав',
              controller: _password,
              icon: Icons.lock_outline_rounded,
              hint: 'Камаш 6 аломат',
              obscure: !_showPassword,
              autofillHints: const [AutofillHints.newPassword],
              validator: validatePassword,
              suffix: EyeButton(visible: _showPassword, onTap: () => setState(() => _showPassword = !_showPassword)),
            ),
            const SizedBox(height: 18),
            LabeledField(
              label: 'Паролро такрор кунед',
              controller: _confirm,
              icon: Icons.lock_outline_rounded,
              hint: 'Ҳамон паролро боз нависед',
              obscure: !_showPassword,
              textInputAction: TextInputAction.done,
              onSubmitted: (_) => _submit(),
              autofillHints: const [AutofillHints.newPassword],
              validator: (v) => v != _password.text ? 'Паролҳо як хел нестанд' : null,
            ),
            const SizedBox(height: 22),
            GradientButton(label: 'Паролро иваз кардан', icon: Icons.check_rounded, loading: _loading, onPressed: _submit),
          ]),
        ),
      ),
    );
  }
}

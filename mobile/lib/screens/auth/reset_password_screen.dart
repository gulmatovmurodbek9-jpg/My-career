import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../api/api.dart';
import '../../app/auth.dart';
import '../../app/i18n.dart';
import '../../app/theme.dart';
import '../../ui/widgets.dart';
import 'auth_ui.dart';
import 'login_screen.dart';
import 'success_screen.dart';

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
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) return timer.cancel();
      setState(() => _wait--);
      if (_wait <= 0) timer.cancel();
    });
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    final codeOk = _code.text.length == 6;
    if (!_form.currentState!.validate() || !codeOk) {
      if (!codeOk) setState(() => _error = t('Рамзи 6-рақамаро аз почта нависед'));
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
      _info = null;
    });
    try {
      await authStore.resetPassword(widget.email, _code.text, _password.text);
      if (!mounted) return;
      TextInput.finishAutofillContext();
      Navigator.of(context).pushReplacement(authRoute(PasswordChangedScreen(email: widget.email)));
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
      setState(() => _info = t('Рамзи нав фиристода шуд.'));
      _startTimer(60);
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _error = e.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final matches = _confirm.text.isNotEmpty && _confirm.text == _password.text;
    return AuthScaffold(
      barTitle: t('Пароли нав'),
      icon: Icons.lock_reset_rounded,
      heading: t('Пароли нав гузоред'),
      subtitle: t('Агар ин почта дар сайт бошад, ба он рамзи 6-рақама фиристодем.'),
      belowSubtitle: Padding(padding: const EdgeInsets.only(top: 10), child: InfoChip(icon: Icons.mail_outline_rounded, text: widget.email)),
      child: AutofillGroup(
        child: Form(
          key: _form,
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            FormMessage(text: _error),
            FormMessage(text: _info, success: true),
            Text(t('Рамз аз почта'), style: const TextStyle(fontSize: 14.5, fontWeight: FontWeight.w700, color: AppColors.text)),
            const SizedBox(height: 7),
            CodeInput(controller: _code),
            ResendRow(wait: _wait, onResend: _resend),
            const SizedBox(height: 14),
            AuthField(
              label: t('Пароли нав'),
              controller: _password,
              icon: Icons.lock_outline_rounded,
              hint: t('Камаш 6 аломат'),
              password: true,
              onChanged: (_) => setState(() {}),
              autofillHints: const [AutofillHints.newPassword],
              validator: validatePassword,
            ),
            PasswordStrength(password: _password.text),
            const SizedBox(height: 14),
            AuthField(
              label: t('Паролро такрор кунед'),
              controller: _confirm,
              icon: Icons.lock_reset_rounded,
              hint: '••••••••',
              password: true,
              onChanged: (_) => setState(() {}),
              textInputAction: TextInputAction.done,
              onSubmitted: (_) => _submit(),
              autofillHints: const [AutofillHints.newPassword],
              trailing: matches ? const Icon(Icons.check_circle_rounded, size: 20, color: AppColors.budget) : null,
              validator: (v) => v != _password.text ? t('Паролҳо як хел нестанд') : null,
            ),
            const SizedBox(height: 20),
            GradientButton(label: t('Паролро иваз кардан'), loading: _loading, onPressed: _submit, height: 54),
            const SizedBox(height: 12),
            InfoChip(icon: Icons.verified_user_outlined, text: t('Пароли шумо рамзгузорӣ карда нигоҳ дошта мешавад'), color: AppColors.textSoft),
          ]),
        ),
      ),
    );
  }
}

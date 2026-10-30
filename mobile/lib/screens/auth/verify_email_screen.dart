import 'dart:async';

import 'package:flutter/material.dart';

import '../../api/api.dart';
import '../../app/auth.dart';
import '../../app/i18n.dart';
import '../../ui/widgets.dart';
import 'auth_ui.dart';
import 'login_screen.dart';

class VerifyEmailScreen extends StatefulWidget {
  const VerifyEmailScreen({super.key, required this.email});
  final String email;

  @override
  State<VerifyEmailScreen> createState() => _VerifyEmailScreenState();
}

class _VerifyEmailScreenState extends State<VerifyEmailScreen> {
  final _code = TextEditingController();
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

  Future<void> _submit([String? _]) async {
    if (_loading) return;
    if (_code.text.length != 6) {
      setState(() => _error = t('Ҳамаи 6 рақамро нависед'));
      return;
    }
    FocusScope.of(context).unfocus();
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await authStore.verifyEmail(widget.email, _code.text);
      if (!mounted) return;
      welcomeSnack(context, t('Почта тасдиқ шуд. Хуш омадед, {name}!', {'name': authStore.user?.displayName ?? ''}));
      closeAuthFlow(context);
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.message;
        _code.clear();
      });
    }
  }

  Future<void> _resend() async {
    setState(() {
      _error = null;
      _info = null;
    });
    try {
      await authStore.resendCode(widget.email);
      if (!mounted) return;
      setState(() => _info = t('Рамзи нав фиристода шуд.'));
      _startTimer(60);
    } on ApiException catch (e) {
      if (!mounted) return;
      final wait = e.data?['waitSeconds'];
      if (wait is num) _startTimer(wait.toInt());
      setState(() => _error = e.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthScaffold(
      barTitle: t('Тасдиқи почта'),
      icon: Icons.mark_email_read_rounded,
      heading: t('Почтаро тасдиқ кунед'),
      subtitle: t('Ба почтаи шумо рамзи 6-рақама фиристодем'),
      belowSubtitle: Padding(padding: const EdgeInsets.only(top: 10), child: InfoChip(icon: Icons.mail_outline_rounded, text: widget.email)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        FormMessage(text: _error),
        FormMessage(text: _info, success: true),
        CodeInput(controller: _code, hasError: _error != null && _code.text.isEmpty, onCompleted: _submit),
        ResendRow(wait: _wait, onResend: _resend),
        const SizedBox(height: 16),
        GradientButton(label: t('Тасдиқ кардан'), loading: _loading, onPressed: _submit, height: 54),
        const SizedBox(height: 14),
        NoteBox(icon: Icons.info_outline_rounded, text: t('Агар нома наояд, ҷузвдони «Спам»-ро ҳам санҷед.')),
      ]),
    );
  }
}

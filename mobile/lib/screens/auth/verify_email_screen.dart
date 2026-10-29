import 'dart:async';

import 'package:flutter/material.dart';

import '../../api/api.dart';
import '../../app/auth.dart';
import '../../app/theme.dart';
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
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) return t.cancel();
      setState(() => _wait--);
      if (_wait <= 0) t.cancel();
    });
  }

  Future<void> _submit([String? _]) async {
    if (_loading) return;
    if (_code.text.length != 6) {
      setState(() => _error = 'Ҳамаи 6 рақамро нависед');
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
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Почта тасдиқ шуд. Хуш омадед, ${authStore.user?.displayName ?? ''}!')));
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
      setState(() => _info = 'Рамзи нав фиристода шуд. Почтаро (ва ҷузвдони «Спам»-ро) санҷед.');
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
      icon: Icons.mark_email_read_rounded,
      title: 'Почтаро тасдиқ кунед',
      subtitle: 'Рамзи 6-рақамаро, ки ба ${widget.email} фиристодем, нависед',
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        FormMessage(text: _error),
        FormMessage(text: _info, success: true),
        CodeInput(controller: _code, hasError: _error != null && _code.text.isEmpty, onCompleted: _submit),
        const SizedBox(height: 22),
        GradientButton(label: 'Тасдиқ кардан', icon: Icons.verified_rounded, loading: _loading, onPressed: _submit),
        const SizedBox(height: 10),
        Center(
          child: _wait > 0
              ? Padding(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  child: Text('Рамзи навро баъди $_wait сония гирифта метавонед', textAlign: TextAlign.center, style: const TextStyle(fontSize: 16, color: AppColors.textSoft)),
                )
              : TextButton.icon(onPressed: _resend, icon: const Icon(Icons.refresh_rounded), label: const Text('Рамзро боз фиристед')),
        ),
      ]),
    );
  }
}

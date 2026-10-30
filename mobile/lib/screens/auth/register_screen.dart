import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../api/api.dart';
import '../../app/auth.dart';
import '../../app/config.dart';
import '../../app/i18n.dart';
import '../../app/theme.dart';
import '../../ui/widgets.dart';
import 'auth_ui.dart';
import 'login_screen.dart';
import 'verify_email_screen.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _form = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  late final _privacyTap = TapGestureRecognizer()..onTap = () => launchUrl(Uri.parse('$siteUrl/privacy'), mode: LaunchMode.externalApplication);
  bool _agree = false;
  bool _agreeError = false;
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _password.dispose();
    _confirm.dispose();
    _privacyTap.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    final valid = _form.currentState!.validate();
    setState(() => _agreeError = !_agree);
    if (!valid || !_agree) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await authStore.register(_name.text, _email.text, _password.text);
      if (!mounted) return;
      setState(() => _loading = false);
      Navigator.of(context).push(authRoute(VerifyEmailScreen(email: _email.text.trim())));
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
    final matches = _confirm.text.isNotEmpty && _confirm.text == _password.text;
    return AuthScaffold(
      barTitle: t('Бақайдгирӣ'),
      // Бе нишона: майдонҳо зиёданд, то ҳама дар як экран ҷой шаванд.
      heading: t('Ҳисоб созед'),
      subtitle: t('Роҳи касбии ояндаи худро кашф кунед'),
      footer: AuthFooter(
        text: t('Аллакай ҳисоб доред?'),
        action: t('Ворид шудан'),
        onTap: () => Navigator.of(context).pushReplacement(authRoute(LoginScreen(email: _email.text.trim()))),
      ),
      child: AutofillGroup(
        child: Form(
          key: _form,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              FormMessage(text: _error),
              AuthField(
                label: t('Ному насаб'),
                controller: _name,
                icon: Icons.person_outline_rounded,
                hint: t('Масалан: Фарҳод Самиев'),
                keyboardType: TextInputType.name,
                autofillHints: const [AutofillHints.name],
                validator: (v) => (v ?? '').trim().length < 2 ? t('Номи худро нависед') : null,
              ),
              const SizedBox(height: 10),
              AuthField(
                label: t('Почтаи электронӣ'),
                controller: _email,
                icon: Icons.mail_outline_rounded,
                hint: 'nom@gmail.com',
                keyboardType: TextInputType.emailAddress,
                autofillHints: const [AutofillHints.email],
                validator: validateEmail,
              ),
              const SizedBox(height: 10),
              AuthField(
                label: t('Парол'),
                controller: _password,
                icon: Icons.lock_outline_rounded,
                hint: t('Камаш 6 аломат'),
                password: true,
                onChanged: (_) => setState(() {}),
                autofillHints: const [AutofillHints.newPassword],
                validator: validatePassword,
              ),
              if (_password.text.isNotEmpty) PasswordStrength(password: _password.text),
              const SizedBox(height: 10),
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
                trailing: matches ? Icon(Icons.check_circle_rounded, size: 20, color: AppColors.budget) : null,
                validator: (v) => v != _password.text ? t('Паролҳо як хел нестанд') : null,
              ),
              const SizedBox(height: 6),
              InkWell(
                borderRadius: BorderRadius.circular(10),
                onTap: () => setState(() {
                  _agree = !_agree;
                  _agreeError = false;
                }),
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 2),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SizedBox(
                        width: 28,
                        height: 24,
                        child: Checkbox(
                          value: _agree,
                          side: BorderSide(color: _agreeError ? AppColors.danger : AppColors.borderStrong, width: 1.2),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                          onChanged: (v) => setState(() {
                            _agree = v ?? false;
                            _agreeError = false;
                          }),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text.rich(
                          TextSpan(
                            style: TextStyle(fontSize: 14, height: 1.4, color: _agreeError ? AppColors.danger : AppColors.textSoft),
                            children: [
                              TextSpan(text: t('Ман бо ')),
                              TextSpan(
                                text: t('Сиёсати махфият'),
                                recognizer: _privacyTap,
                                style: TextStyle(fontWeight: FontWeight.w700, color: AppColors.primary),
                              ),
                              TextSpan(text: t(' розӣ ҳастам')),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),
              GradientButton(label: t('Ҳисоб сохтан'), loading: _loading, onPressed: _submit, height: 54),
              GoogleLoginSection(onError: (m) => setState(() => _error = m)),
            ],
          ),
        ),
      ),
    );
  }
}

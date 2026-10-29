import 'package:flutter/material.dart';

import '../../api/api.dart';
import '../../app/auth.dart';
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
  bool _showPassword = false;
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _name.dispose();
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
    return AuthScaffold(
      icon: Icons.person_add_alt_1_rounded,
      title: 'Бақайдгирӣ',
      subtitle: 'Ҳисоб созед — натиҷаи тест ва ихтисосҳои интихобкардаатон гум намешаванд',
      footer: AuthFooter(
        text: 'Аллакай ҳисоб доред?',
        action: 'Ворид шудан',
        onTap: () => Navigator.of(context).pushReplacement(authRoute(LoginScreen(email: _email.text.trim()))),
      ),
      child: AutofillGroup(
        child: Form(
          key: _form,
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            FormMessage(text: _error),
            LabeledField(
              label: 'Ному насаб',
              controller: _name,
              icon: Icons.person_outline_rounded,
              hint: 'Масалан: Алӣ Раҳимов',
              keyboardType: TextInputType.name,
              autofillHints: const [AutofillHints.name],
              validator: (v) => (v ?? '').trim().length < 2 ? 'Номи худро нависед' : null,
            ),
            const SizedBox(height: 18),
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
              hint: 'Камаш 6 аломат',
              obscure: !_showPassword,
              textInputAction: TextInputAction.done,
              onSubmitted: (_) => _submit(),
              autofillHints: const [AutofillHints.newPassword],
              validator: validatePassword,
              suffix: EyeButton(visible: _showPassword, onTap: () => setState(() => _showPassword = !_showPassword)),
            ),
            const SizedBox(height: 10),
            const Text(
              'Ба почтаатон рамзи 6-рақама меояд — бо он почтаро тасдиқ мекунед.',
              style: TextStyle(fontSize: 15, height: 1.4, color: Color(0xFF626B84)),
            ),
            const SizedBox(height: 20),
            GradientButton(label: 'Ҳисоб сохтан', icon: Icons.check_rounded, loading: _loading, onPressed: _submit),
          ]),
        ),
      ),
    );
  }
}

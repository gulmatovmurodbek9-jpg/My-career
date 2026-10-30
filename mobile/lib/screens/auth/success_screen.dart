import 'package:flutter/material.dart';

import '../../app/i18n.dart';
import '../../app/theme.dart';
import '../../ui/widgets.dart';
import 'auth_ui.dart';
import 'login_screen.dart';

// «Ҳамааш тайёр!» — баъди иваз кардани парол.
class PasswordChangedScreen extends StatelessWidget {
  const PasswordChangedScreen({super.key, required this.email});
  final String email;

  @override
  Widget build(BuildContext context) {
    return AuthScaffold(
      barTitle: t('Муваффақият'),
      icon: Icons.verified_rounded,
      heading: t('Ҳамааш тайёр!'),
      subtitle: t('Пароли шумо иваз шуд. Акнун бо пароли нав ворид шавед ва роҳи касбиатонро идома диҳед.'),
      belowSubtitle: Padding(
        padding: const EdgeInsets.only(top: 12),
        child: InfoChip(icon: Icons.verified_user_rounded, text: t('Ҳисоб бехатар аст'), color: AppColors.budget),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        AppCard(
          padding: const EdgeInsets.all(14),
          child: Row(children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(color: AppColors.contractSoft, borderRadius: BorderRadius.circular(12)),
              child: const Icon(Icons.key_rounded, color: AppColors.primary),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(t('Парол нав шуд'), style: const TextStyle(fontSize: 15.5, fontWeight: FontWeight.w800, color: AppColors.text)),
                const SizedBox(height: 2),
                Text(email, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13.5, color: AppColors.textSoft)),
              ]),
            ),
            const Icon(Icons.check_circle_rounded, color: AppColors.budget),
          ]),
        ),
        const SizedBox(height: 22),
        GradientButton(
          label: t('Ба воридшавӣ'),
          height: 54,
          onPressed: () => Navigator.of(context).pushReplacement(authRoute(LoginScreen(email: email))),
        ),
        const SizedBox(height: 8),
        TextButton(onPressed: () => closeAuthFlow(context), child: Text(t('Ба саҳифаи асосӣ'))),
      ]),
    );
  }
}

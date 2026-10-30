import 'package:flutter/material.dart';

import '../../api/api.dart';
import '../../app/auth.dart';
import '../../app/theme.dart';
import '../../ui/widgets.dart';
import '../settings_screen.dart';
import '../../app/i18n.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _deleting = false;

  Future<void> _logout() async {
    final ok = await _confirm(title: t('Аз ҳисоб баромадан?'), body: t('Натиҷаҳоятон дар ҳисоб мемонанд. Баъд боз бо почта ва парол ворид шуда метавонед.'), action: t('Баромадан'));
    if (ok != true || !mounted) return;
    await authStore.logout();
    if (!mounted) return;
    Navigator.of(context).pop();
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(t('Шумо аз ҳисоб баромадед'))));
  }

  Future<void> _delete() async {
    final ok = await _confirm(
      title: t('Ҳисобро нест кардан?'),
      body: t('Ҳисоб, натиҷаҳои тест ва ихтисосҳои интихобшуда пурра нест мешаванд. Инро баргардондан мумкин нест.'),
      action: t('Ҳа, нест кунед'),
      danger: true,
    );
    if (ok != true || !mounted) return;
    setState(() => _deleting = true);
    try {
      await authStore.deleteAccount();
      if (!mounted) return;
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(t('Ҳисоб нест карда шуд'))));
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _deleting = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  Future<bool?> _confirm({required String title, required String body, required String action, bool danger = false}) {
    return showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
        title: Text(
          title,
          style: const TextStyle(fontFamily: AppFonts.display, fontSize: 22, fontWeight: FontWeight.w800),
        ),
        content: Text(body, style: const TextStyle(fontSize: 17, height: 1.45, color: AppColors.textSoft)),
        actionsPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        actions: [
          Row(
            children: [
              Expanded(
                child: OutlinedButton(onPressed: () => Navigator.pop(context, false), child: Text(t('Не'))),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: FilledButton(
                  style: danger ? FilledButton.styleFrom(backgroundColor: AppColors.danger) : null,
                  onPressed: () => Navigator.pop(context, true),
                  child: Text(action, textAlign: TextAlign.center),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = authStore.user;
    final name = user?.displayName ?? '';
    return Scaffold(
      appBar: AppBar(title: Text(t('Ҳисоби ман'))),
      body: SafeArea(
        child: ListView(
          padding: AppSizes.page,
          children: [
            AppCard(
              padding: const EdgeInsets.all(22),
              child: Column(
                children: [
                  Container(
                    width: 88,
                    height: 88,
                    alignment: Alignment.center,
                    decoration: const BoxDecoration(shape: BoxShape.circle, gradient: AppColors.brandGradient, boxShadow: buttonShadow),
                    child: Text(
                      name.isEmpty ? '?' : name.characters.first.toUpperCase(),
                      style: const TextStyle(fontFamily: AppFonts.display, fontSize: 38, fontWeight: FontWeight.w800, color: Colors.white),
                    ),
                  ),
                  const SizedBox(height: 14),
                  Text(name, textAlign: TextAlign.center, style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 4),
                  Text(user?.email ?? '', textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodyMedium),
                ],
              ),
            ),
            const SizedBox(height: AppSizes.gap),
            AppCard(
              padding: const EdgeInsets.all(18),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.cloud_done_rounded, color: AppColors.budget, size: 30),
                  SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      t('Натиҷаи ҳар тесте, ки ҳоло мегузаред, дар ҳисобатон нигоҳ дошта мешавад — дар сайт ҳам онро мебинед.'),
                      style: TextStyle(fontSize: 17, height: 1.45, color: AppColors.text),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            OutlinedButton.icon(
              onPressed: () => Navigator.of(context).push(smoothRoute(const SettingsScreen())),
              icon: const Icon(Icons.text_increase_rounded),
              label: Text(t('Андозаи ҳарф ва синф')),
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(onPressed: _deleting ? null : _logout, icon: const Icon(Icons.logout_rounded), label: Text(t('Аз ҳисоб баромадан'))),
            const SizedBox(height: 36),
            TextButton.icon(
              style: TextButton.styleFrom(foregroundColor: AppColors.danger),
              onPressed: _deleting ? null : _delete,
              icon: _deleting ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2.5)) : const Icon(Icons.delete_outline_rounded),
              label: Text(t('Ҳисобро нест кардан')),
            ),
          ],
        ),
      ),
    );
  }
}

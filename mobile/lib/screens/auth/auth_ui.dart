import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../app/theme.dart';
import '../../ui/widgets.dart';

// Қолаби экранҳои воридшавӣ — мисли сайт: карточкаи сафед дар марказ, нишонаи градиентӣ,
// сарлавҳаи калон ва шарҳ. Карточка ҳангоми кушодан нарм пайдо мешавад.
class AuthScaffold extends StatelessWidget {
  const AuthScaffold({super.key, required this.icon, required this.title, required this.subtitle, required this.child, this.footer});

  final IconData icon;
  final String title;
  final String subtitle;
  final Widget child;
  final Widget? footer;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(backgroundColor: Colors.transparent, toolbarHeight: 48, leading: Navigator.of(context).canPop() ? const BackButton() : null),
      extendBodyBehindAppBar: true,
      body: DecoratedBox(
        decoration: const BoxDecoration(
          gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Color(0xFFEFF3FF), AppColors.background]),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 20),
              keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 440),
                child: TweenAnimationBuilder<double>(
                  tween: Tween(begin: 0, end: 1),
                  duration: const Duration(milliseconds: 420),
                  curve: Curves.easeOutCubic,
                  builder: (context, t, child) => Opacity(
                    opacity: t,
                    child: Transform.translate(offset: Offset(0, 16 * (1 - t)), child: child),
                  ),
                  child: Container(
                    padding: const EdgeInsets.fromLTRB(20, 22, 20, 16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(28),
                      border: Border.all(color: AppColors.border, width: 1.5),
                      boxShadow: const [BoxShadow(color: Color(0x1F0D2E8C), blurRadius: 60, offset: Offset(0, 24), spreadRadius: -20)],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Center(child: GradientIcon(icon, size: 52)),
                        const SizedBox(height: 14),
                        Text(
                          title,
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontFamily: AppFonts.display, fontSize: 24, fontWeight: FontWeight.w800, color: AppColors.text, height: 1.15),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          subtitle,
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontSize: 15, height: 1.4, color: AppColors.textSoft),
                        ),
                        const SizedBox(height: 20),
                        child,
                        if (footer != null) ...[const SizedBox(height: 14), const Divider(color: AppColors.border, height: 1), const SizedBox(height: 4), footer!],
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// «Ҳисоб надоред? Бақайдгирӣ» — матн ва пайванд дар як сатр.
class AuthFooter extends StatelessWidget {
  const AuthFooter({super.key, required this.text, required this.action, required this.onTap, this.icon});
  final String text;
  final String action;
  final VoidCallback onTap;
  final IconData? icon;

  @override
  Widget build(BuildContext context) => Wrap(
    alignment: WrapAlignment.center,
    crossAxisAlignment: WrapCrossAlignment.center,
    children: [
      Text(text, style: const TextStyle(fontSize: 15, color: AppColors.textSoft)),
      TextButton.icon(
        onPressed: onTap,
        icon: Text(action, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800)),
        label: Icon(icon ?? Icons.arrow_forward_rounded, size: 18),
      ),
    ],
  );
}

// Тугмаи «чашм» барои нишон додан ё пинҳон кардани парол.
class EyeButton extends StatelessWidget {
  const EyeButton({super.key, required this.visible, required this.onTap});
  final bool visible;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) =>
      IconButton(tooltip: visible ? 'Паролро пинҳон кунед' : 'Паролро нишон диҳед', iconSize: 22, icon: Icon(visible ? Icons.visibility_off_outlined : Icons.visibility_outlined), onPressed: onTap);
}

// Рамзи 6-рақама: шаш катаки калон. Дар дохил як майдон аст — часпондан (paste) ва
// пур кардани худкор аз SMS/почта кор мекунад.
class CodeInput extends StatefulWidget {
  const CodeInput({super.key, required this.controller, this.onCompleted, this.hasError = false});
  final TextEditingController controller;
  final ValueChanged<String>? onCompleted;
  final bool hasError;

  @override
  State<CodeInput> createState() => _CodeInputState();
}

class _CodeInputState extends State<CodeInput> {
  final _focus = FocusNode();

  @override
  void initState() {
    super.initState();
    widget.controller.addListener(_changed);
    _focus.addListener(() => setState(() {}));
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _focus.requestFocus();
    });
  }

  @override
  void dispose() {
    widget.controller.removeListener(_changed);
    _focus.dispose();
    super.dispose();
  }

  void _changed() {
    setState(() {});
    if (widget.controller.text.length == 6) widget.onCompleted?.call(widget.controller.text);
  }

  @override
  Widget build(BuildContext context) {
    final code = widget.controller.text;
    return Semantics(
      container: true,
      label: 'Рамзи 6-рақама',
      child: GestureDetector(
        onTap: () => _focus.requestFocus(),
        child: Stack(
          children: [
            Row(
              children: List.generate(6, (i) {
                final filled = i < code.length;
                final active = _focus.hasFocus && (i == code.length || (i == 5 && code.length == 6));
                final color = widget.hasError
                    ? AppColors.danger
                    : active
                    ? AppColors.accent
                    : filled
                    ? AppColors.primary
                    : AppColors.border;
                return Expanded(
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 160),
                    height: 54,
                    margin: EdgeInsets.only(right: i == 5 ? 0 : 8),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: filled ? AppColors.contractSoft : AppColors.muted,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: color, width: active || widget.hasError ? 2 : 1.5),
                    ),
                    child: Text(
                      filled ? code[i] : '',
                      style: const TextStyle(fontFamily: AppFonts.display, fontSize: 24, fontWeight: FontWeight.w800, color: AppColors.text),
                    ),
                  ),
                );
              }),
            ),
            // Майдони ноаён, ки рақамҳоро мегирад. alwaysIncludeSemantics — то TalkBack/VoiceOver онро бинад.
            Positioned.fill(
              child: Opacity(
                opacity: 0,
                alwaysIncludeSemantics: true,
                child: TextField(
                  controller: widget.controller,
                  focusNode: _focus,
                  keyboardType: TextInputType.number,
                  autofillHints: const [AutofillHints.oneTimeCode],
                  maxLength: 6,
                  showCursor: false,
                  enableInteractiveSelection: false,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(6)],
                  decoration: const InputDecoration(counterText: '', border: InputBorder.none, filled: false),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

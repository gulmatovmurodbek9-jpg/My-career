import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../app/auth.dart';
import '../../app/i18n.dart';
import '../../app/settings.dart';
import '../../app/theme.dart';

// Қолаби экранҳои воридшавӣ: дар боло «‹ Сарлавҳа  TJ», баъд сурат ё нишонаи калон,
// сарлавҳаи калон ва шарҳ дар марказ, форма ва дар поён пайванд.
class AuthScaffold extends StatelessWidget {
  const AuthScaffold({super.key, required this.barTitle, required this.heading, required this.subtitle, required this.child, this.image, this.icon, this.footer, this.belowSubtitle});

  final String barTitle;
  final String heading;
  final String subtitle;
  final Widget child;
  final String? image; // assets/images/…
  final IconData? icon;
  final Widget? footer;
  final Widget? belowSubtitle;

  @override
  Widget build(BuildContext context) {
    final canPop = Navigator.of(context).canPop();
    return Scaffold(
      backgroundColor: AppColors.card,
      appBar: AppBar(
        backgroundColor: AppColors.card,
        toolbarHeight: 52,
        centerTitle: true,
        automaticallyImplyLeading: false,
        leading: canPop ? IconButton(tooltip: t('Баргаштан'), icon: Icon(Icons.arrow_back_ios_new_rounded, size: 20), onPressed: () => Navigator.of(context).maybePop()) : null,
        title: Text(
          barTitle,
          style: TextStyle(fontFamily: AppFonts.body, fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.text),
        ),
        actions: [LangButton(), SizedBox(width: 12)],
      ),
      body: SafeArea(
        top: false,
        child: Center(
          child: SingleChildScrollView(
            padding: EdgeInsets.fromLTRB(22, 4, 22, 20),
            keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
            child: ConstrainedBox(
              constraints: BoxConstraints(maxWidth: 440),
              child: TweenAnimationBuilder<double>(
                tween: Tween(begin: 0, end: 1),
                duration: Duration(milliseconds: 380),
                curve: Curves.easeOutCubic,
                builder: (context, v, child) => Opacity(
                  opacity: v,
                  child: Transform.translate(offset: Offset(0, 14 * (1 - v)), child: child),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (image != null)
                      Center(
                        child: Image.asset(image!, height: 180, fit: BoxFit.contain, filterQuality: FilterQuality.medium),
                      )
                    else if (icon != null)
                      Center(child: HeroIcon(icon!)),
                    SizedBox(height: 14),
                    Text(
                      heading,
                      textAlign: TextAlign.center,
                      style: TextStyle(fontFamily: AppFonts.display, fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.text, height: 1.2, letterSpacing: -0.2),
                    ),
                    SizedBox(height: 6),
                    Text(
                      subtitle,
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 15, height: 1.45, color: AppColors.textSoft),
                    ),
                    ?belowSubtitle,
                    SizedBox(height: 20),
                    child,
                    if (footer != null) ...[SizedBox(height: 14), footer!],
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// Нишонаи калон дар доираи нарм бо ситорачаҳо — ба ҷои сурат дар экранҳои дигар.
class HeroIcon extends StatelessWidget {
  // ignore: prefer_initializing_formals
  const HeroIcon(this.icon, {super.key, Color? color, this.size = 132}) : _color = color;
  final IconData icon;
  final Color? _color;
  Color get color => _color ?? AppColors.primary;
  final double size;

  @override
  Widget build(BuildContext context) => SizedBox(
    width: size + 20,
    height: size,
    child: Stack(
      alignment: Alignment.center,
      children: [
        Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: RadialGradient(colors: [color.withValues(alpha: 0.16), color.withValues(alpha: 0.04)]),
          ),
        ),
        Container(
          width: size * 0.56,
          height: size * 0.56,
          decoration: BoxDecoration(
            color: Colors.white,
            shape: BoxShape.circle,
            boxShadow: [BoxShadow(color: color.withValues(alpha: 0.22), blurRadius: 24, offset: const Offset(0, 10), spreadRadius: -6)],
          ),
          child: ShaderMask(
            shaderCallback: (r) => (color == AppColors.primary ? AppColors.brandGradient : LinearGradient(colors: [color, color])).createShader(r),
            child: Icon(icon, size: size * 0.3, color: Colors.white),
          ),
        ),
        Positioned(
          top: size * 0.08,
          right: 6,
          child: Icon(Icons.auto_awesome_rounded, size: 18, color: AppColors.secondary.withValues(alpha: 0.8)),
        ),
        Positioned(
          bottom: size * 0.16,
          left: 4,
          child: Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(color: color.withValues(alpha: 0.35), shape: BoxShape.circle),
          ),
        ),
        Positioned(
          top: size * 0.22,
          left: 14,
          child: Container(
            width: 5,
            height: 5,
            decoration: BoxDecoration(color: color.withValues(alpha: 0.3), shape: BoxShape.circle),
          ),
        ),
      ],
    ),
  );
}

// Интихоби забон: тугмаи хурди «TJ» → варақаи поён бо се забон.
class LangButton extends StatelessWidget {
  const LangButton({super.key});

  static Future<void> pick(BuildContext context) => showModalBottomSheet<void>(
    context: context,
    showDragHandle: true,
    backgroundColor: AppColors.card,
    builder: (context) => SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              t('Забон'),
              style: const TextStyle(fontFamily: AppFonts.display, fontSize: 20, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 10),
            for (final code in AppSettings.langs)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Material(
                  color: appSettings.lang == code ? AppColors.contractSoft : AppColors.muted,
                  borderRadius: BorderRadius.circular(16),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(16),
                    onTap: () {
                      Navigator.pop(context);
                      appSettings.setLang(code);
                    },
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      child: Row(
                        children: [
                          Text(
                            langShort[code]!,
                            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.primary),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Text(
                              langNames[code]!,
                              style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600, color: AppColors.text),
                            ),
                          ),
                          if (appSettings.lang == code) Icon(Icons.check_circle_rounded, color: AppColors.primary),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    ),
  );

  @override
  Widget build(BuildContext context) => Semantics(
    button: true,
    label: t('Забон'),
    child: Material(
      color: AppColors.contractSoft,
      borderRadius: BorderRadius.circular(999),
      child: InkWell(
        borderRadius: BorderRadius.circular(999),
        onTap: () => pick(context),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.translate_rounded, size: 16, color: AppColors.primary),
              const SizedBox(width: 5),
              Text(
                langShort[appSettings.lang]!,
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.primary),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}

// Майдони форма: тамға дар боло, қуттии сафед бо сояи нарм, нишона дар тарафи рост.
class AuthField extends StatefulWidget {
  const AuthField({
    super.key,
    required this.label,
    required this.controller,
    required this.icon,
    this.hint,
    this.validator,
    this.keyboardType,
    this.textInputAction = TextInputAction.next,
    this.onSubmitted,
    this.autofillHints,
    this.password = false,
    this.onChanged,
    this.trailing,
  });

  final String label;
  final TextEditingController controller;
  final IconData icon;
  final String? hint;
  final String? Function(String?)? validator;
  final TextInputType? keyboardType;
  final TextInputAction textInputAction;
  final ValueChanged<String>? onSubmitted;
  final Iterable<String>? autofillHints;
  final bool password;
  final ValueChanged<String>? onChanged;
  final Widget? trailing; // нишонаи иловагӣ пеш аз нишонаи асосӣ (масалан ✓)

  @override
  State<AuthField> createState() => _AuthFieldState();
}

class _AuthFieldState extends State<AuthField> {
  bool _visible = false;

  @override
  Widget build(BuildContext context) {
    final border = OutlineInputBorder(
      borderRadius: BorderRadius.circular(14),
      borderSide: BorderSide(color: AppColors.border),
    );
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          widget.label,
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.textSoft),
        ),
        const SizedBox(height: 7),
        DecoratedBox(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            boxShadow: [BoxShadow(color: Color(0x0F0D2E8C), blurRadius: 14, offset: Offset(0, 4), spreadRadius: -4)],
          ),
          child: TextFormField(
            controller: widget.controller,
            validator: widget.validator,
            keyboardType: widget.keyboardType,
            textInputAction: widget.textInputAction,
            onFieldSubmitted: widget.onSubmitted,
            onChanged: widget.onChanged,
            autofillHints: widget.autofillHints,
            obscureText: widget.password && !_visible,
            autocorrect: false,
            enableSuggestions: !widget.password,
            style: TextStyle(fontSize: 16, color: AppColors.text),
            decoration: InputDecoration(
              hintText: widget.hint,
              hintStyle: TextStyle(fontSize: 15, color: AppColors.hint),
              filled: true,
              fillColor: AppColors.card,
              isDense: true,
              contentPadding: EdgeInsets.fromLTRB(16, 15, 8, 15),
              border: border,
              enabledBorder: border,
              focusedBorder: border.copyWith(borderSide: BorderSide(color: AppColors.accent, width: 1.4)),
              errorBorder: border.copyWith(borderSide: BorderSide(color: AppColors.danger)),
              focusedErrorBorder: border.copyWith(borderSide: BorderSide(color: AppColors.danger, width: 1.4)),
              suffixIcon: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  ?widget.trailing,
                  if (widget.password)
                    IconButton(
                      tooltip: _visible ? t('Паролро пинҳон кунед') : t('Паролро нишон диҳед'),
                      visualDensity: VisualDensity.compact,
                      icon: Icon(_visible ? Icons.visibility_off_outlined : Icons.visibility_outlined, size: 21, color: AppColors.textSoft),
                      onPressed: () => setState(() => _visible = !_visible),
                    ),
                  Padding(
                    padding: EdgeInsets.only(right: 14, left: 2),
                    child: Icon(widget.icon, size: 21, color: AppColors.primary),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

// «Бо Google ворид шудан» — тугмаи сафед бо ҳарфи G-и рангин.
class GoogleButton extends StatelessWidget {
  const GoogleButton({super.key, required this.onPressed, this.loading = false});
  final VoidCallback? onPressed;
  final bool loading;

  @override
  Widget build(BuildContext context) => SizedBox(
    height: 54,
    child: OutlinedButton(
      onPressed: loading ? null : onPressed,
      style: OutlinedButton.styleFrom(
        backgroundColor: AppColors.card,
        side: BorderSide(color: AppColors.border),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSizes.radius)),
        minimumSize: Size.fromHeight(54),
      ),
      child: loading
          ? SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2.6))
          : Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                ShaderMask(
                  shaderCallback: (r) =>
                      SweepGradient(colors: [Color(0xFFEA4335), Color(0xFFFBBC05), Color(0xFF34A853), Color(0xFF4285F4), Color(0xFFEA4335)], stops: [0.0, 0.25, 0.5, 0.75, 1.0]).createShader(r),
                  child: Text(
                    'G',
                    style: TextStyle(fontFamily: AppFonts.display, fontSize: 22, fontWeight: FontWeight.w700, color: Colors.white),
                  ),
                ),
                SizedBox(width: 12),
                Text(
                  t('Бо Google ворид шудан'),
                  style: TextStyle(fontSize: 15.5, fontWeight: FontWeight.w500, color: AppColors.text),
                ),
              ],
            ),
    ),
  );
}

// Хати «— ё —» байни тугмаҳо.
class OrDivider extends StatelessWidget {
  const OrDivider({super.key});

  @override
  Widget build(BuildContext context) => Padding(
    padding: EdgeInsets.symmetric(vertical: 14),
    child: Row(
      children: [
        Expanded(child: Divider(color: AppColors.border)),
        Padding(
          padding: EdgeInsets.symmetric(horizontal: 12),
          child: Text(t('ё'), style: TextStyle(fontSize: 14, color: AppColors.textSoft)),
        ),
        Expanded(child: Divider(color: AppColors.border)),
      ],
    ),
  );
}

// «Ҳисоб надоред? Бақайдгирӣ» — матн ва пайванд дар як сатр.
class AuthFooter extends StatelessWidget {
  const AuthFooter({super.key, required this.text, required this.action, required this.onTap});
  final String text;
  final String action;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Wrap(
    alignment: WrapAlignment.center,
    crossAxisAlignment: WrapCrossAlignment.center,
    children: [
      Text(text, style: TextStyle(fontSize: 15, color: AppColors.textSoft)),
      TextButton(
        onPressed: onTap,
        child: Text(action, style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
      ),
    ],
  );
}

// Тамғаи хурди мудаввар (почта, вақт, «Ҳисоб бехатар аст»).
class InfoChip extends StatelessWidget {
  // ignore: prefer_initializing_formals
  const InfoChip({super.key, required this.icon, required this.text, Color? color}) : _color = color;
  final IconData icon;
  final String text;
  final Color? _color;
  Color get color => _color ?? AppColors.primary;

  @override
  Widget build(BuildContext context) => Center(
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.09), borderRadius: BorderRadius.circular(999)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 6),
          Flexible(
            child: Text(
              text,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600, color: color),
            ),
          ),
        ],
      ),
    ),
  );
}

// Эзоҳи хурд дар қуттии нарм (масалан «Почтаи „Спам“-ро ҳам санҷед»).
class NoteBox extends StatelessWidget {
  const NoteBox({super.key, required this.icon, required this.text});
  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(color: AppColors.contractSoft.withValues(alpha: 0.6), borderRadius: BorderRadius.circular(12)),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18, color: AppColors.primary),
        const SizedBox(width: 8),
        Expanded(
          child: Text(text, style: TextStyle(fontSize: 13.5, height: 1.4, color: AppColors.text)),
        ),
      ],
    ),
  );
}

// Нишондиҳандаи қувваи парол: чор хат ва ду шарт.
class PasswordStrength extends StatelessWidget {
  const PasswordStrength({super.key, required this.password});
  final String password;

  @override
  Widget build(BuildContext context) {
    final score = passwordStrength(password);
    final labels = [t('Паролро нависед'), t('Парол суст аст'), t('Парол миёна аст'), t('Парол қавӣ аст')];
    final colors = [AppColors.borderStrong, AppColors.danger, AppColors.secondary, AppColors.budget];
    final color = colors[score];
    final filled = score == 0 ? 0 : score + 1; // 1 → 2 хат, 2 → 3, 3 → 4
    final longEnough = password.length >= 6;
    final mixed = RegExp(r'[0-9]').hasMatch(password) && RegExp(r'[^0-9]').hasMatch(password);
    Widget rule(bool ok, String text) => Padding(
      padding: const EdgeInsets.only(top: 6),
      child: Row(
        children: [
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 200),
            child: Icon(ok ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded, key: ValueKey(ok), size: 17, color: ok ? AppColors.budget : AppColors.textSoft),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(text, style: TextStyle(fontSize: 13.5, color: AppColors.text)),
          ),
        ],
      ),
    );
    return Container(
      margin: const EdgeInsets.only(top: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: AppColors.muted, borderRadius: BorderRadius.circular(14)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              for (var i = 0; i < 4; i++)
                Expanded(
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 250),
                    height: 5,
                    margin: EdgeInsets.only(right: i == 3 ? 10 : 5),
                    decoration: BoxDecoration(color: i < filled ? color : AppColors.border, borderRadius: BorderRadius.circular(9)),
                  ),
                ),
              Text(
                labels[score],
                style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: score == 0 ? AppColors.textSoft : color),
              ),
            ],
          ),
          rule(longEnough, t('Камаш 6 аломат')),
          rule(mixed, t('Ҳарф ва рақам дошта бошад (тавсия)')),
        ],
      ),
    );
  }
}

// Рамзи 6-рақама: шаш катак. Дар дохил як майдон аст — часпондан (paste) ва
// пур кардани худкор аз почта/SMS кор мекунад.
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
      label: t('Рамзи 6-рақама'),
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
                    : Colors.transparent;
                return Expanded(
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 160),
                    height: 54,
                    margin: EdgeInsets.only(right: i == 5 ? 0 : 8),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: active ? AppColors.card : AppColors.muted,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: color, width: 1.4),
                      boxShadow: active ? const [BoxShadow(color: Color(0x290D2E8C), blurRadius: 16, offset: Offset(0, 6), spreadRadius: -4)] : null,
                    ),
                    child: filled
                        ? Text(
                            code[i],
                            style: TextStyle(fontFamily: AppFonts.display, fontSize: 23, fontWeight: FontWeight.w600, color: AppColors.text),
                          )
                        : active
                        ? Container(
                            width: 7,
                            height: 7,
                            decoration: BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
                          )
                        : null,
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

// Шумораи баръакс барои «Рамзи нав»: «Рамзи нав баъди 00:45» ё «Рамз наомад? Боз фиристед».
class ResendRow extends StatelessWidget {
  const ResendRow({super.key, required this.wait, required this.onResend});
  final int wait;
  final VoidCallback onResend;

  @override
  Widget build(BuildContext context) {
    if (wait > 0) {
      final mm = (wait ~/ 60).toString().padLeft(2, '0');
      final ss = (wait % 60).toString().padLeft(2, '0');
      return Padding(
        padding: const EdgeInsets.only(top: 12),
        child: InfoChip(icon: Icons.schedule_rounded, text: t('Рамзи нав баъди {time}', {'time': '$mm:$ss'}), color: AppColors.textSoft),
      );
    }
    return Padding(
      padding: const EdgeInsets.only(top: 4),
      child: Wrap(
        alignment: WrapAlignment.center,
        crossAxisAlignment: WrapCrossAlignment.center,
        children: [
          Text(t('Рамз наомад?'), style: TextStyle(fontSize: 14.5, color: AppColors.textSoft)),
          TextButton(
            onPressed: onResend,
            child: Text(t('Боз фиристед'), style: const TextStyle(fontSize: 14.5, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../api/api.dart';
import '../api/models.dart';
import '../app/career_refs.dart';
import '../app/clusters.dart';
import '../app/i18n.dart';
import '../app/settings.dart';
import '../app/theme.dart';
import '../ui/widgets.dart';
import 'careers_screen.dart';

// Ҳамаи қисмҳо як ранг доранд — кабуди сайт. Сабз ва сурх танҳо барои маъно (буҷетӣ, хатар).
Color get sectionBlue => AppColors.primary;
Color get sectionGreen => AppColors.primary;
Color get sectionViolet => AppColors.primary;
Color get sectionOrange => AppColors.primary;
Color get sectionAmber => AppColors.primary;
Color get sectionRose => AppColors.primary;
Color get sectionCyan => AppColors.primary;

Future<void> openLink(String url) => launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);

// Корти як қисм: нишонаи ранга, сарлавҳа, зерсарлавҳа ва мазмун.
class CareerSection extends StatelessWidget {
  const CareerSection({super.key, required this.icon, required this.color, required this.title, this.subtitle, required this.child});
  final IconData icon;
  final Color color;
  final String title;
  final String? subtitle;
  final Widget child;

  @override
  Widget build(BuildContext context) => Container(
    clipBehavior: Clip.antiAlias,
    decoration: BoxDecoration(
      color: AppColors.card,
      borderRadius: BorderRadius.circular(22),
      border: Border.all(color: AppColors.border),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          padding: const EdgeInsets.fromLTRB(14, 14, 14, 12),
          decoration: BoxDecoration(
            border: Border(bottom: BorderSide(color: AppColors.border)),
          ),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(color: AppColors.contractSoft, borderRadius: BorderRadius.circular(13)),
                child: Icon(icon, size: 21, color: color),
              ),
              const SizedBox(width: 11),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: TextStyle(fontFamily: AppFonts.display, fontSize: 16.5, fontWeight: FontWeight.w700, color: AppColors.text, height: 1.2),
                    ),
                    if (subtitle != null && subtitle!.isNotEmpty) ...[const SizedBox(height: 2), Text(subtitle!, style: TextStyle(fontSize: 12.5, color: AppColors.textSoft, height: 1.3))],
                  ],
                ),
              ),
            ],
          ),
        ),
        Padding(padding: const EdgeInsets.all(14), child: child),
      ],
    ),
  );
}

TextStyle get _body => TextStyle(fontSize: 14.5, color: AppColors.text, height: 1.45);
TextStyle get _soft => TextStyle(fontSize: 13, color: AppColors.textSoft, height: 1.4);
TextStyle get _label => TextStyle(fontSize: 12, fontWeight: FontWeight.w700, letterSpacing: 0.3, color: AppColors.textSoft);

class _SoftBox extends StatelessWidget {
  const _SoftBox({required this.child, this.color});
  final Widget child;
  final Color? color;

  @override
  Widget build(BuildContext context) => Container(
    width: double.infinity,
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(color: color ?? AppColors.muted, borderRadius: BorderRadius.circular(14)),
    child: child,
  );
}

class _Numbered extends StatelessWidget {
  const _Numbered(this.n, this.text);
  final int n;
  final String text;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 22,
          height: 22,
          alignment: Alignment.center,
          decoration: BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
          child: Text(
            '$n',
            style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: Colors.white),
          ),
        ),
        const SizedBox(width: 9),
        Expanded(child: Text(text, style: _body)),
      ],
    ),
  );
}

class _Bulleted extends StatelessWidget {
  const _Bulleted(this.items, {required this.icon, required this.color});
  final List<String> items;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      for (final item in items)
        Padding(
          padding: const EdgeInsets.only(bottom: 6),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.only(top: 2),
                child: Icon(icon, size: 16, color: color),
              ),
              const SizedBox(width: 7),
              Expanded(
                child: Text(item, style: TextStyle(fontSize: 14, color: AppColors.text, height: 1.4)),
              ),
            ],
          ),
        ),
    ],
  );
}

class _SmallButton extends StatelessWidget {
  const _SmallButton({required this.label, required this.onPressed, this.loading = false});
  final String label;
  final VoidCallback? onPressed;
  final bool loading;

  @override
  Widget build(BuildContext context) => FilledButton.icon(
    style: FilledButton.styleFrom(
      backgroundColor: AppColors.primary,
      foregroundColor: Colors.white,
      disabledBackgroundColor: AppColors.primary.withValues(alpha: 0.45),
      disabledForegroundColor: Colors.white,
      minimumSize: const Size(0, 44),
      padding: const EdgeInsets.symmetric(horizontal: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
    ),
    onPressed: loading ? null : onPressed,
    icon: loading ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Icon(Icons.auto_awesome_rounded, size: 17),
    label: Text(label),
  );
}

// Тугмаи мудаввар бо матне, ки ба сатри нав мегузарад (ActionChip матни дарозро мебурад).
class _Pill extends StatelessWidget {
  const _Pill({required this.text, required this.color, required this.border, required this.onTap, this.trailing});
  final String text;
  final Color color;
  final Color border;
  final VoidCallback? onTap;
  final IconData? trailing;

  @override
  Widget build(BuildContext context) => Material(
    color: color,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(16),
      side: BorderSide(color: border),
    ),
    child: InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Flexible(
              child: Text(
                text,
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: AppColors.text, height: 1.3),
              ),
            ),
            if (trailing != null) ...[const SizedBox(width: 3), Icon(trailing, size: 16, color: AppColors.textSoft)],
          ],
        ),
      ),
    ),
  );
}

// --- Ёвари AI дар бораи ихтисос ---

class CareerAiChat extends StatefulWidget {
  const CareerAiChat({super.key, required this.careerId});
  final String careerId;

  @override
  State<CareerAiChat> createState() => _CareerAiChatState();
}

class _CareerAiChatState extends State<CareerAiChat> {
  final _input = TextEditingController();
  final _messages = <({String role, String text})>[];
  Map<String, dynamic>? _info;
  bool _busy = false;
  bool _error = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _input.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final data = await Api.instance.get('/interview/${widget.careerId}');
      if (mounted && data is Map) setState(() => _info = Map<String, dynamic>.from(data));
    } catch (_) {
      // Бе маълумот ин қисм нишон дода намешавад.
    }
  }

  Future<void> _ask(String raw) async {
    final q = raw.trim();
    if (q.isEmpty || _busy) return;
    FocusScope.of(context).unfocus();
    setState(() {
      _messages.add((role: 'user', text: q));
      _input.clear();
      _busy = true;
      _error = false;
    });
    try {
      final data = await Api.instance.post('/interview/${widget.careerId}', {
        'lang': appSettings.lang,
        'messages': [
          for (final m in _messages) {'role': m.role, 'text': m.text},
        ],
      }, timeout: Api.aiTimeout);
      if (!mounted) return;
      setState(() {
        _messages.add((role: 'specialist', text: '${data['answer'] ?? ''}'));
        _busy = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _busy = false;
        _error = true;
      });
    }
  }

  Widget _bubble(String text, {bool mine = false}) => Align(
    alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
    child: Container(
      margin: const EdgeInsets.only(bottom: 8),
      constraints: BoxConstraints(maxWidth: MediaQuery.sizeOf(context).width * 0.74),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: mine ? AppColors.primary : AppColors.muted,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(mine ? 16 : 4),
          topRight: Radius.circular(mine ? 4 : 16),
          bottomLeft: const Radius.circular(16),
          bottomRight: const Radius.circular(16),
        ),
      ),
      child: Text(text, style: TextStyle(fontSize: 14, height: 1.42, color: mine ? Colors.white : AppColors.text)),
    ),
  );

  @override
  Widget build(BuildContext context) {
    final info = _info;
    if (info == null) return const SizedBox.shrink();
    final asked = _messages.where((m) => m.role == 'user').map((m) => m.text).toSet();
    final suggestions = (info['suggestions'] is List ? (info['suggestions'] as List).map((e) => '$e') : const <String>[]).where((s) => !asked.contains(s)).take(3).toList();
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: CareerSection(
        icon: Icons.smart_toy_rounded,
        color: sectionViolet,
        title: t('Аз AI дар бораи касб пурсед'),
        subtitle: t('Ёвари AI аз рӯи маълумоти ҳамин ихтисос ҷавоб медиҳад'),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _bubble('${info['greeting'] ?? ''}'),
            for (final m in _messages) _bubble(m.text, mine: m.role == 'user'),
            if (_busy)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: [
                    const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2)),
                    const SizedBox(width: 8),
                    Text(t('AI фикр мекунад…'), style: _soft),
                  ],
                ),
              ),
            if (_error)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Text(
                  t('Ҷавоб наомад. Боз кӯшиш кунед.'),
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.danger),
                ),
              ),
            const SizedBox(height: 4),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                for (final s in suggestions)
                  _Pill(
                    text: s,
                    color: sectionViolet.withValues(alpha: AppColors.dark ? 0.16 : 0.06),
                    border: sectionViolet.withValues(alpha: 0.3),
                    onTap: _busy ? null : () => _ask(s),
                  ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _input,
                    maxLength: 500,
                    textInputAction: TextInputAction.send,
                    onSubmitted: _ask,
                    style: TextStyle(fontSize: 14.5, color: AppColors.text),
                    decoration: InputDecoration(counterText: '', isDense: true, hintText: t('Саволи худро нависед…'), contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12)),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton.filled(
                  tooltip: t('Фиристодан'),
                  style: IconButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white, minimumSize: const Size(46, 46)),
                  onPressed: _busy ? null : () => _ask(_input.text),
                  icon: const Icon(Icons.send_rounded, size: 19),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(t('Ин ёвари AI аст, на одами воқеӣ. Барои қарори ниҳоӣ бо мутахассиси воқеӣ ҳам гап занед.'), style: TextStyle(fontSize: 11.5, color: AppColors.textSoft, height: 1.35)),
          ],
        ),
      ),
    );
  }
}

// --- «Чаро шумо ин касбро мехоҳед?» ---

class CareerWhy extends StatefulWidget {
  const CareerWhy({super.key, required this.careerId});
  final String careerId;

  @override
  State<CareerWhy> createState() => _CareerWhyState();
}

class _CareerWhyState extends State<CareerWhy> {
  final _reason = TextEditingController();
  Map<String, dynamic>? _result;
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _reason.dispose();
    super.dispose();
  }

  Future<void> _check() async {
    final text = _reason.text.trim();
    if (text.length < 3 || _busy) return;
    FocusScope.of(context).unfocus();
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final data = await Api.instance.post('/career-insight/${widget.careerId}/why', {'reason': text, 'lang': appSettings.lang}, timeout: Api.aiTimeout);
      if (!mounted) return;
      setState(() {
        _result = Map<String, dynamic>.from(data);
        _busy = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _busy = false;
        _error = e.message;
      });
    }
  }

  void _addChip(String chip) {
    final old = _reason.text.trim();
    _reason.text = old.isEmpty ? chip : '$old, ${chip.toLowerCase()}';
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final chips = [t('Маоши хуб дорад'), t('Падару модарам мехоҳанд'), t('Шавқ дорам'), t('Дӯстонам меравад')];
    return CareerSection(
      icon: Icons.help_rounded,
      color: sectionBlue,
      title: t('Чаро шумо ин касбро мехоҳед?'),
      subtitle: t('Сабаби худро ростқавлона нависед — AI мегӯяд, ки он чӣ қадар устувор аст.'),
      child: _result == null
          ? Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [for (final c in chips) _Pill(text: '+ $c', color: AppColors.muted, border: AppColors.border, onTap: () => _addChip(c))],
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _reason,
                  maxLength: 400,
                  minLines: 3,
                  maxLines: 4,
                  onChanged: (_) => setState(() {}),
                  style: TextStyle(fontSize: 14.5, color: AppColors.text),
                  decoration: InputDecoration(counterText: '', hintText: t('Масалан: ба одамон кӯмак кардан мехоҳам ва биологияро дӯст медорам…')),
                ),
                const SizedBox(height: 8),
                Text(t('Матни шумо нигоҳ дошта намешавад.'), style: TextStyle(fontSize: 12, color: AppColors.textSoft)),
                const SizedBox(height: 10),
                Align(
                  alignment: Alignment.centerLeft,
                  child: _SmallButton(label: t('Санҷед'), loading: _busy, onPressed: _reason.text.trim().length < 3 ? null : _check),
                ),
                if (_error != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    _error!,
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.danger),
                  ),
                ],
              ],
            )
          : _whyResult(_result!),
    );
  }

  Widget _whyResult(Map<String, dynamic> r) {
    final type = switch (r['type']) {
      'inner' => t('💚 Сабаби дохилӣ (шавқ, қобилият)'),
      'outer' => t('🟠 Сабаби берунӣ (пул, обрӯ, фишор)'),
      _ => t('🟡 Сабаби омехта'),
    };
    final (risk, riskColor) = switch (r['risk']) {
      'low' => (t('Хатари пушаймонӣ: паст'), AppColors.budget),
      'high' => (t('Хатари пушаймонӣ: баланд'), AppColors.danger),
      _ => (t('Хатари пушаймонӣ: миёна'), AppColors.warning),
    };
    final questions = r['questions'] is List ? (r['questions'] as List).map((e) => '$e').toList() : const <String>[];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Wrap(
          spacing: 6,
          runSpacing: 6,
          children: [
            Badge2(type, color: AppColors.text, background: AppColors.muted),
            Badge2(risk, color: riskColor, background: riskColor.withValues(alpha: 0.12)),
          ],
        ),
        const SizedBox(height: 10),
        Text('${r['summary'] ?? ''}', style: _body),
        if (questions.isNotEmpty) ...[
          const SizedBox(height: 12),
          Text(t('3 савол барои худатон'), style: _label),
          const SizedBox(height: 8),
          for (var i = 0; i < questions.length; i++) _Numbered(i + 1, questions[i]),
        ],
        if ('${r['talkTo'] ?? ''}'.isNotEmpty) ...[const SizedBox(height: 4), _SoftBox(child: Text('${t('Бо кӣ гап занед')}: ${r['talkTo']}', style: _body))],
        const SizedBox(height: 10),
        Align(
          alignment: Alignment.centerLeft,
          child: TextButton(onPressed: () => setState(() => _result = null), child: Text(t('Сабаби дигар'))),
        ),
      ],
    );
  }
}

// --- «Ин касб пас аз 10 сол» ---

class CareerFutureSection extends StatefulWidget {
  const CareerFutureSection({super.key, required this.careerId});
  final String careerId;

  @override
  State<CareerFutureSection> createState() => _CareerFutureSectionState();
}

class _CareerFutureSectionState extends State<CareerFutureSection> {
  Map<String, dynamic>? _data;
  bool _busy = false;
  String? _error;

  Future<void> _load() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final data = await Api.instance.get('/career-insight/${widget.careerId}/future', null, Api.aiTimeout);
      if (!mounted) return;
      setState(() {
        _data = Map<String, dynamic>.from(data);
        _busy = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _busy = false;
        _error = e.message;
      });
    }
  }

  static List<String> _list(dynamic v) => v is List ? v.map((e) => '$e').toList() : const [];

  @override
  Widget build(BuildContext context) {
    final d = _data;
    return CareerSection(
      icon: Icons.rocket_launch_rounded,
      color: sectionViolet,
      title: t('Ин касб пас аз 10 сол'),
      subtitle: t('AI ва мошинҳо кадом корро мегиранд, чӣ ба одам мемонад ва аз ҳозир чӣ кор кунед.'),
      child: d == null
          ? Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _SmallButton(label: _busy ? t('AI пешгӯӣ месозад…') : t('Нишон диҳед'), loading: _busy, onPressed: _load),
                if (_error != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    _error!,
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.danger),
                  ),
                ],
              ],
            )
          : Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _RiskMeter(risk: '${d['risk']}'),
                if ('${d['riskText'] ?? ''}'.isNotEmpty) ...[const SizedBox(height: 8), Text('${d['riskText']}', style: _soft)],
                const SizedBox(height: 12),
                _SoftBox(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(t('Ба мошин ва AI мегузарад'), style: _label),
                      const SizedBox(height: 8),
                      _Bulleted(_list(d['automated']), icon: Icons.settings_rounded, color: AppColors.textSoft),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                _SoftBox(
                  color: AppColors.contractSoft,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(t('Ба одам мемонад'), style: _label.copyWith(color: AppColors.primary)),
                      const SizedBox(height: 8),
                      _Bulleted(_list(d['human']), icon: Icons.lightbulb_rounded, color: AppColors.secondary),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                Text(t('Малакаҳои нав'), style: _label),
                const SizedBox(height: 8),
                Wrap(spacing: 6, runSpacing: 6, children: [for (final s in _list(d['skills'])) Badge2(s)]),
                const SizedBox(height: 12),
                Text(t('Аз ҳозир чӣ кор кунед'), style: _label),
                const SizedBox(height: 8),
                for (final (i, step) in _list(d['prepare']).indexed) _Numbered(i + 1, step),
                if ('${d['summary'] ?? ''}'.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  _SoftBox(
                    child: Text('${d['summary']}', style: _body.copyWith(fontWeight: FontWeight.w500)),
                  ),
                ],
                const SizedBox(height: 8),
                Text(t('Ин пешгӯии AI дар асоси тамоюлҳои ҷаҳонӣ аст, на факт.'), style: TextStyle(fontSize: 11.5, color: AppColors.textSoft)),
              ],
            ),
    );
  }
}

// Се зина: паст, миёна, баланд — зинаи ҳозира равшан; бе фоизи бофта.
class _RiskMeter extends StatelessWidget {
  const _RiskMeter({required this.risk});
  final String risk;

  @override
  Widget build(BuildContext context) {
    final levels = [('low', t('Паст'), AppColors.budget), ('mid', t('Миёна'), AppColors.warning), ('high', t('Баланд'), AppColors.danger)];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          t('Хатари автоматикунонӣ'),
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.text),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            for (final (i, l) in levels.indexed) ...[
              if (i > 0) const SizedBox(width: 6),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 9),
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: l.$1 == risk ? l.$3 : l.$3.withValues(alpha: AppColors.dark ? 0.14 : 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    l.$2,
                    style: TextStyle(fontSize: 13, fontWeight: l.$1 == risk ? FontWeight.w700 : FontWeight.w500, color: l.$1 == risk ? Colors.white : AppColors.textSoft),
                  ),
                ),
              ),
            ],
          ],
        ),
      ],
    );
  }
}

// --- Бали гузариш ---

class AdmissionScoresSection extends StatefulWidget {
  const AdmissionScoresSection({super.key, required this.careerId});
  final String careerId;

  @override
  State<AdmissionScoresSection> createState() => _AdmissionScoresSectionState();
}

class _AdmissionScoresSectionState extends State<AdmissionScoresSection> {
  Map<String, dynamic>? _data;
  bool _loaded = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await Api.instance.get('/careers/${widget.careerId}/scores');
      if (mounted) {
        setState(() {
          _data = data is Map ? Map<String, dynamic>.from(data) : null;
          _loaded = true;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loaded = true);
    }
  }

  static String _n(dynamic v) {
    if (v is! num) return '—';
    return v == v.roundToDouble() ? '${v.toInt()}' : v.toStringAsFixed(1);
  }

  Widget _stat(String value, String label, {Color? color}) => Expanded(
    child: _SoftBox(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            value,
            style: TextStyle(fontFamily: AppFonts.display, fontSize: 18, fontWeight: FontWeight.w700, color: color ?? AppColors.text),
          ),
          const SizedBox(height: 2),
          Text(label, style: TextStyle(fontSize: 12, color: AppColors.textSoft, height: 1.3)),
        ],
      ),
    ),
  );

  @override
  Widget build(BuildContext context) {
    final years = _data?['years'] is List ? (_data!['years'] as List).map((e) => Map<String, dynamic>.from(e)).toList() : const <Map<String, dynamic>>[];
    return CareerSection(
      icon: Icons.school_rounded,
      color: sectionOrange,
      title: t('Бали гузариш'),
      subtitle: t('Маълумоти расмии Маркази миллии тестӣ'),
      child: !_loaded
          ? const Center(
              child: Padding(padding: EdgeInsets.all(12), child: CircularProgressIndicator()),
            )
          : years.isEmpty
          ? Text(t('Барои ин ихтисос бали гузариш нашр нашудааст.'), style: _body)
          : _content(years),
    );
  }

  Widget _content(List<Map<String, dynamic>> years) {
    final first = years.first;
    final last = years.last;
    final scored = years.reversed.where((y) => y['minScore'] != null);
    final lastScored = scored.isEmpty ? null : scored.first;
    final peak = years.map((y) => (y['maxScore'] as num?)?.toDouble() ?? 0).reduce((a, b) => a > b ? a : b);
    final fa = first['avgScore'], la = last['avgScore'];
    final drift = fa is num && la is num ? ((la - fa) * 10).round() / 10 : null;
    final unis = _data?['universities'] is List ? (_data!['universities'] as List).map((e) => Map<String, dynamic>.from(e)).toList() : const <Map<String, dynamic>>[];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _SoftBox(
          color: sectionOrange.withValues(alpha: AppColors.dark ? 0.14 : 0.07),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(lastScored == null ? t('Бал нашр нашудааст') : t('Соли {year} барои дохил шудан лозим буд', {'year': lastScored['year']}), style: _soft),
              if (lastScored != null) ...[
                const SizedBox(height: 3),
                Text(
                  '${_n(lastScored['minScore'])} – ${_n(lastScored['maxScore'])} ${t('бал')}',
                  style: TextStyle(fontFamily: AppFonts.display, fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.text),
                ),
                const SizedBox(height: 3),
                Text(t('Вобаста ба муассиса ва шакли таҳсил'), style: TextStyle(fontSize: 12, color: AppColors.textSoft)),
              ],
            ],
          ),
        ),
        const SizedBox(height: 8),
        IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (last['maxCompetition'] != null) _stat(t('то {n} нафар', {'n': (last['maxCompetition'] as num).round()}), t('ба як ҷой дар соли {year}', {'year': last['year']})),
              if (last['maxCompetition'] != null && drift != null) const SizedBox(width: 8),
              if (drift != null)
                _stat(
                  '${drift > 0 ? '↑' : '↓'} ${_n(drift.abs())}',
                  drift > 0 ? t('бал баландтар аз соли {year}', {'year': first['year']}) : t('бал пасттар аз соли {year}', {'year': first['year']}),
                  color: drift > 0 ? AppColors.danger : AppColors.budget,
                ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        Text(t('Бали миёна аз рӯи солҳо'), style: _label),
        const SizedBox(height: 10),
        for (final y in years) _yearRow(y, peak, y == last),
        Text(t('«—» — Маркази миллии тестӣ бал нашр накардааст.'), style: TextStyle(fontSize: 11.5, color: AppColors.textSoft)),
        if (unis.isNotEmpty) ...[
          const SizedBox(height: 14),
          Text(t('Донишгоҳҳо дар соли {year}', {'year': _data?['lastYear'] ?? last['year']}), style: _label),
          const SizedBox(height: 8),
          for (final u in unis.take(5))
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('${u['university'] ?? ''}', style: TextStyle(fontSize: 13.5, color: AppColors.text, height: 1.3)),
                        Text(
                          [
                            if (u['paymentType'] == 'ройгон') t('буҷетӣ') else t('шартномавӣ'),
                            if (u['seats'] != null) t('{n} ҷой', {'n': u['seats']}),
                          ].join(' · '),
                          style: TextStyle(fontSize: 12, color: AppColors.textSoft),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    _n(u['score']),
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.text),
                  ),
                ],
              ),
            ),
        ],
        const SizedBox(height: 4),
        Align(
          alignment: Alignment.centerLeft,
          child: TextButton.icon(
            onPressed: () => openLink('${_data?['source']?['url'] ?? 'https://stat.ntc.tj/'}'),
            icon: const Icon(Icons.open_in_new_rounded, size: 15),
            label: Text(t('Манбаъ: Маркази миллии тестӣ'), style: const TextStyle(fontSize: 12.5)),
          ),
        ),
      ],
    );
  }

  // Сатри уфуқӣ: сол — хат — рақам. Рақам ҳамеша навишта шудааст, то нофаҳмо набошад.
  Widget _yearRow(Map<String, dynamic> y, double peak, bool isLast) {
    final avg = y['avgScore'];
    final ratio = avg is num && peak > 0 ? (avg / peak).clamp(0.04, 1.0).toDouble() : 0.0;
    return Padding(
      padding: const EdgeInsets.only(bottom: 9),
      child: Row(
        children: [
          SizedBox(
            width: 38,
            child: Text(
              '${y['year']}',
              style: TextStyle(fontSize: 13, fontWeight: isLast ? FontWeight.w700 : FontWeight.w500, color: isLast ? AppColors.text : AppColors.textSoft),
            ),
          ),
          Expanded(
            child: Container(
              height: 12,
              alignment: Alignment.centerLeft,
              decoration: BoxDecoration(color: AppColors.muted, borderRadius: BorderRadius.circular(999)),
              child: FractionallySizedBox(
                widthFactor: ratio,
                child: Container(
                  decoration: BoxDecoration(color: isLast ? AppColors.primary : AppColors.primary.withValues(alpha: 0.45), borderRadius: BorderRadius.circular(999)),
                ),
              ),
            ),
          ),
          SizedBox(
            width: 50,
            child: Text(
              _n(avg),
              textAlign: TextAlign.right,
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.text),
            ),
          ),
        ],
      ),
    );
  }
}

// --- Холҳои тести корбар аз рӯи самтҳо ---

class QuizScoresSection extends StatelessWidget {
  const QuizScoresSection({super.key, required this.scores, required this.careerCluster});
  final Map<String, dynamic> scores;
  final int? careerCluster;

  static const _max = 40;

  @override
  Widget build(BuildContext context) {
    final rows = [for (final c in clusters) (c, (scores['c${c.number}'] as num?)?.toInt() ?? 0)]..sort((a, b) => b.$2.compareTo(a.$2));
    return CareerSection(
      icon: Icons.insights_rounded,
      color: sectionBlue,
      title: t('Холҳо аз рӯи самтҳо'),
      subtitle: t('Хол аз рӯи ҷавобҳои саволномаи шумо'),
      child: Column(
        children: [
          for (final (c, score) in rows)
            Padding(
              padding: const EdgeInsets.only(bottom: 11),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(c.icon, size: 15, color: AppColors.primary),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          c.title,
                          style: TextStyle(fontSize: 13, fontWeight: c.number == careerCluster ? FontWeight.w700 : FontWeight.w500, color: AppColors.text),
                        ),
                      ),
                      if (c.number == careerCluster) ...[Badge2(t('ин ихтисос'), color: AppColors.primary, background: AppColors.contractSoft), const SizedBox(width: 6)],
                      Text(
                        '$score/$_max',
                        style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: AppColors.text),
                      ),
                    ],
                  ),
                  const SizedBox(height: 5),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(999),
                    child: LinearProgressIndicator(value: (score / _max).clamp(0.0, 1.0), minHeight: 8, color: AppColors.primary, backgroundColor: AppColors.muted),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

// --- Маош ---

class SalarySection extends StatelessWidget {
  const SalarySection({super.key, required this.career});
  final Career career;

  Widget _compareRow(String label, int amount, int peak, Color color, {bool bold = false}) => Padding(
    padding: const EdgeInsets.only(bottom: 9),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                label,
                style: TextStyle(fontSize: 13, fontWeight: bold ? FontWeight.w600 : FontWeight.w400, color: bold ? AppColors.text : AppColors.textSoft),
              ),
            ),
            Text(
              '${money(amount)} ${t('сомонӣ')}',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.text),
            ),
          ],
        ),
        const SizedBox(height: 4),
        ClipRRect(
          borderRadius: BorderRadius.circular(999),
          child: LinearProgressIndicator(value: amount / peak, minHeight: 8, color: color, backgroundColor: AppColors.muted),
        ),
      ],
    ),
  );

  Widget _tier(IconData icon, String label, String years, String value) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Container(
      padding: const EdgeInsets.all(11),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              color: sectionGreen.withValues(alpha: AppColors.dark ? 0.2 : 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 18, color: sectionGreen),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600, color: AppColors.text),
                ),
                Text(years, style: TextStyle(fontSize: 11.5, color: AppColors.textSoft)),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.text),
            ),
          ),
        ],
      ),
    ),
  );

  @override
  Widget build(BuildContext context) {
    final sector = sectorFor(career.nameTj, career.clusterNumber);
    String tier(String key) => '${career.salary[key] ?? ''}'.trim();
    final hasTiers = career.contentWritten && tier('junior').isNotEmpty;
    if (sector == null && !hasTiers) {
      return CareerSection(
        icon: Icons.payments_rounded,
        color: sectionGreen,
        title: t('Маоши меҳнат'),
        child: Text(t('Барои ин ихтисос маълумоти тасдиқшудаи маош надорем.'), style: _body),
      );
    }
    final diff = sector == null ? 0 : (sector.amount / nationalAverageSalary * 100).round() - 100;
    final peak = sector == null ? nationalAverageSalary : (sector.amount > nationalAverageSalary ? sector.amount : nationalAverageSalary);
    return CareerSection(
      icon: Icons.payments_rounded,
      color: sectionGreen,
      title: t('Маоши меҳнат'),
      subtitle: t('Чӣ қадар маош гирифтан мумкин аст'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (sector != null) ...[
            _SoftBox(
              color: sectionGreen.withValues(alpha: AppColors.dark ? 0.14 : 0.07),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(t('Маоши миёна дар соҳаи «{sector}»', {'sector': sector.label}), style: _soft),
                  const SizedBox(height: 3),
                  Text.rich(
                    TextSpan(
                      children: [
                        TextSpan(
                          text: money(sector.amount),
                          style: TextStyle(fontFamily: AppFonts.display, fontSize: 28, fontWeight: FontWeight.w700, color: AppColors.text),
                        ),
                        TextSpan(
                          text: ' ${t('сомонӣ/моҳ')}',
                          style: TextStyle(fontSize: 14, color: AppColors.textSoft),
                        ),
                      ],
                    ),
                  ),
                  if (diff != 0) ...[
                    const SizedBox(height: 6),
                    Badge2(
                      diff > 0 ? t('{n}% зиёдтар аз миёнаи кишвар', {'n': diff}) : t('{n}% камтар аз миёнаи кишвар', {'n': -diff}),
                      color: diff > 0 ? AppColors.budget : AppColors.warning,
                      background: (diff > 0 ? AppColors.budget : AppColors.warning).withValues(alpha: 0.13),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 12),
            _compareRow(sector.label, sector.amount, peak, sectionGreen, bold: true),
            _compareRow(t('Миёнаи кишвар'), nationalAverageSalary, peak, AppColors.primary.withValues(alpha: 0.5)),
            _compareRow(t('Ҳадди ақали қонунӣ'), minimumWage, peak, AppColors.textSoft),
            Text(t('Ин миёнаи тамоми соҳа аст, на маоши маҳз ин ихтисос. Маоши шумо аз корфармо, шаҳр ва таҷрибаатон вобаста аст.'), style: _soft),
            const SizedBox(height: 4),
            Text(t('Манбаъ: Агентии омори назди Президенти ҶТ, июни 2026'), style: TextStyle(fontSize: 11.5, color: AppColors.textSoft)),
          ],
          if (hasTiers) ...[
            if (sector != null) const SizedBox(height: 14),
            Text(t('Аз рӯи таҷриба дар ҳамин ихтисос'), style: _label),
            const SizedBox(height: 4),
            Text(t('Тахмини муаллифи сайт — манбаи расмӣ нест.'), style: TextStyle(fontSize: 12, color: AppColors.warning)),
            const SizedBox(height: 8),
            _tier(Icons.rocket_launch_rounded, t('Навкор'), t('0-1 соли таҷриба'), tier('junior')),
            if (tier('mid').isNotEmpty) _tier(Icons.trending_up_rounded, t('Миёна'), t('2-4 соли таҷриба'), tier('mid')),
            if (tier('senior').isNotEmpty) _tier(Icons.star_rounded, t('Таҷрибадор'), t('5+ соли таҷриба'), tier('senior')),
          ],
        ],
      ),
    );
  }
}

// --- Рӯйхатҳои оддӣ ---

class SkillsSection extends StatelessWidget {
  const SkillsSection({super.key, required this.career});
  final Career career;

  Widget _group(String title, List<String> items, IconData icon, Color color) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Row(
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 6),
          Text(
            title,
            style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w700, color: AppColors.text),
          ),
        ],
      ),
      const SizedBox(height: 8),
      Wrap(
        spacing: 6,
        runSpacing: 6,
        children: [
          for (final s in items)
            Badge2(
              s,
              color: AppColors.text,
              background: color.withValues(alpha: AppColors.dark ? 0.16 : 0.08),
            ),
        ],
      ),
    ],
  );

  @override
  Widget build(BuildContext context) => CareerSection(
    icon: Icons.code_rounded,
    color: sectionViolet,
    title: t('Маҳоратҳои зарурӣ'),
    subtitle: t('Чӣ маҳоратҳо бояд дошта бошед'),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (career.technicalSkills.isNotEmpty) _group(t('Маҳоратҳои техникӣ'), career.technicalSkills, Icons.build_rounded, sectionBlue),
        if (career.technicalSkills.isNotEmpty && career.softSkills.isNotEmpty) const SizedBox(height: 14),
        if (career.softSkills.isNotEmpty) _group(t('Маҳоратҳои муоширатӣ'), career.softSkills, Icons.groups_rounded, sectionViolet),
        if (career.technologies.isNotEmpty) ...[const SizedBox(height: 14), _group(t('Технологияҳо ва абзорҳо'), career.technologies, Icons.memory_rounded, sectionCyan)],
      ],
    ),
  );
}

class _ListTileRow extends StatelessWidget {
  const _ListTileRow({required this.icon, required this.color, required this.title, this.subtitle, this.onTap});
  final IconData icon;
  final Color color;
  final String title;
  final String? subtitle;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 7),
    child: Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.border),
          ),
          child: Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: AppColors.dark ? 0.2 : 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, size: 17, color: color),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w500, color: AppColors.text, height: 1.3),
                    ),
                    if (subtitle != null) ...[const SizedBox(height: 2), Text(subtitle!, style: TextStyle(fontSize: 12, color: AppColors.textSoft, height: 1.3))],
                  ],
                ),
              ),
              if (onTap != null) ...[const SizedBox(width: 6), Icon(Icons.open_in_new_rounded, size: 15, color: AppColors.textSoft)],
            ],
          ),
        ),
      ),
    ),
  );
}

class SimpleListSection extends StatelessWidget {
  const SimpleListSection({super.key, required this.icon, required this.color, required this.title, this.subtitle, required this.items});
  final IconData icon;
  final Color color;
  final String title;
  final String? subtitle;
  final List<String> items;

  @override
  Widget build(BuildContext context) => CareerSection(
    icon: icon,
    color: color,
    title: title,
    subtitle: subtitle,
    child: Column(
      children: [for (final item in items) _ListTileRow(icon: icon, color: color, title: item.isEmpty ? item : item[0].toUpperCase() + item.substring(1))],
    ),
  );
}

class CertificatesSection extends StatelessWidget {
  const CertificatesSection({super.key, required this.names});
  final List<String> names;

  @override
  Widget build(BuildContext context) => CareerSection(
    icon: Icons.workspace_premium_rounded,
    color: sectionAmber,
    title: t('Сертификатҳо'),
    subtitle: t('Чӣ сертификат арзиши касбиро баланд мебардорад ва онро аз куҷо мегиранд'),
    child: Column(
      children: [
        for (final name in names)
          Builder(
            builder: (context) {
              final info = certInfo(name);
              return _ListTileRow(icon: Icons.workspace_premium_rounded, color: sectionAmber, title: info.name, subtitle: '${t('Аз куҷо')}: ${info.where}', onTap: () => openLink(info.url));
            },
          ),
      ],
    ),
  );
}

class ResourcesSection extends StatelessWidget {
  const ResourcesSection({super.key, required this.career});
  final Career career;

  Widget _group(String title, List<String> items, IconData icon, Color color) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w700, color: AppColors.text),
        ),
        const SizedBox(height: 7),
        for (final item in items) _ListTileRow(icon: icon, color: color, title: item, onTap: () => openLink(resourceUrl(item))),
      ],
    ),
  );

  @override
  Widget build(BuildContext context) {
    final books = career.books.where(isRealBook).toList();
    final topics = career.books.where((b) => !isRealBook(b)).toList();
    return CareerSection(
      icon: Icons.menu_book_rounded,
      color: sectionRose,
      title: t('Манбаъҳои омӯзишӣ'),
      subtitle: t('Китобҳо, курсҳо ва блогҳо барои омӯзиш'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (books.isNotEmpty) _group(t('Китобҳо'), books, Icons.menu_book_rounded, sectionBlue),
          if (topics.isNotEmpty) _group(t('Мавзӯъҳо барои хондан (китоби дарсӣ ёбед)'), topics, Icons.menu_book_rounded, sectionBlue),
          if (career.courses.isNotEmpty) _group(t('Курсҳо'), career.courses, Icons.play_lesson_rounded, sectionViolet),
          if (career.blogs.isNotEmpty) _group(t('Блогҳо'), career.blogs, Icons.article_rounded, sectionCyan),
        ],
      ),
    );
  }
}

class RelatedSection extends StatelessWidget {
  const RelatedSection({super.key, required this.names});
  final List<String> names;

  @override
  Widget build(BuildContext context) => CareerSection(
    icon: Icons.layers_rounded,
    color: sectionViolet,
    title: t('Ихтисосҳои вобаста'),
    subtitle: t('Ихтисосҳои наздик ба ин соҳа'),
    child: Wrap(
      spacing: 7,
      runSpacing: 7,
      children: [
        for (final name in names)
          _Pill(
            text: name,
            color: AppColors.card,
            border: AppColors.border,
            trailing: Icons.chevron_right_rounded,
            onTap: () => Navigator.of(context).push(smoothRoute(CareersScreen(initialSearch: name, title: t('Ихтисосҳо')))),
          ),
      ],
    ),
  );
}

class AdviceCard extends StatelessWidget {
  const AdviceCard({super.key, required this.text});
  final String text;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      borderRadius: BorderRadius.circular(22),
      border: Border.all(color: AppColors.border),
      color: AppColors.card,
    ),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(color: AppColors.contractSoft, borderRadius: BorderRadius.circular(13)),
          child: Icon(Icons.lightbulb_rounded, size: 21, color: AppColors.primary),
        ),
        const SizedBox(width: 11),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                t('Маслиҳати тиллоӣ'),
                style: TextStyle(fontFamily: AppFonts.display, fontSize: 16.5, fontWeight: FontWeight.w700, color: AppColors.text),
              ),
              const SizedBox(height: 5),
              Text(
                '“$text”',
                style: TextStyle(fontSize: 14, fontStyle: FontStyle.italic, color: AppColors.textSoft, height: 1.45),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}

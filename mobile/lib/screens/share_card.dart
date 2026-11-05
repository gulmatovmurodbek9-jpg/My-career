import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:path_provider/path_provider.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:share_plus/share_plus.dart';

import '../app/i18n.dart';
import '../app/settings.dart';
import '../app/theme.dart';

// Корти натиҷа барои Telegram, WhatsApp ва Instagram (мисли Front/src/lib/shareCard.js):
// градиенти самт, логотип, натиҷа, даъват ва QR ба сайт. Андоза: Story 1080×1920 ё мураббаъ 1080×1080.

const _site = 'ikhtisosiman.qobus.tj';
const _cardLink = 'https://$_site/?ref=card';

const clusterGradient = <int, List<Color>>{
  1: [Color(0xFF0284C7), Color(0xFF1E3A8A)],
  2: [Color(0xFFD97706), Color(0xFF7C2D12)],
  3: [Color(0xFF7C3AED), Color(0xFF312E81)],
  4: [Color(0xFF059669), Color(0xFF064E3B)],
  5: [Color(0xFFE11D48), Color(0xFF701A75)],
};
const _defaultGradient = [Color(0xFF1D4ED8), Color(0xFF312E81)];

const _cardText = {
  'tj': {
    'direction': 'Самти ман',
    'careers': 'Ихтисосҳои ба ман мувофиқ',
    'fit': 'Ба ман мувофиқ аст',
    'notFit': 'Фаҳмидам, ки ин касб ба ман мувофиқ нест — ин ҳам натиҷа аст',
    'solved': 'Ҳал кардам: {n} аз {t}',
    'confidence': 'Боварӣ: {a} → {b}',
    'quizCta': 'Ту ҳам бисанҷ — 5 дақиқа',
    'trialCta': 'Ту ҳам худро дар касб санҷ',
  },
  'ru': {
    'direction': 'Моё направление',
    'careers': 'Подходящие мне специальности',
    'fit': 'Мне подходит',
    'notFit': 'Я понял(а), что эта профессия мне не подходит — это тоже результат',
    'solved': 'Решено: {n} из {t}',
    'confidence': 'Уверенность: {a} → {b}',
    'quizCta': 'Проверь и ты — 5 минут',
    'trialCta': 'Попробуй себя в профессии',
  },
  'en': {
    'direction': 'My direction',
    'careers': 'Specialties that suit me',
    'fit': 'This suits me',
    'notFit': 'I learned this career is not for me — that is a result too',
    'solved': 'Solved: {n} of {t}',
    'confidence': 'Confidence: {a} → {b}',
    'quizCta': 'Try it too — 5 minutes',
    'trialCta': 'Try yourself in a career',
  },
};

String _ct(String key, [Map<String, Object?> vars = const {}]) {
  final value = (_cardText[appSettings.lang] ?? _cardText['tj']!)[key] ?? '';
  return vars.entries.fold(value, (text, e) => text.replaceAll('{${e.key}}', '${e.value}'));
}

// Маълумоти корт: тест (самт, фоиз, ихтисосҳо) ё «Худро дар касб санҷед» (касб, мувофиқ, ҳал, боварӣ).
class ShareCardData {
  const ShareCardData.quiz({required this.title, this.percent, this.careers = const [], this.cluster}) : kind = 'quiz', fit = true, solved = null, total = null, confBefore = null, confAfter = null;
  const ShareCardData.trial({required this.title, required this.fit, this.solved, this.total, this.confBefore, this.confAfter, this.cluster}) : kind = 'trial', percent = null, careers = const [];

  final String kind;
  final String title;
  final int? percent;
  final List<String> careers;
  final int? cluster;
  final bool fit;
  final int? solved;
  final int? total;
  final String? confBefore;
  final String? confAfter;
}

Future<void> showShareCard(BuildContext context, ShareCardData data, String shareText) => showModalBottomSheet(
  context: context,
  isScrollControlled: true,
  useSafeArea: true,
  backgroundColor: AppColors.card,
  shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(22))),
  builder: (_) => _ShareSheet(data: data, shareText: shareText),
);

class _ShareSheet extends StatefulWidget {
  const _ShareSheet({required this.data, required this.shareText});
  final ShareCardData data;
  final String shareText;

  @override
  State<_ShareSheet> createState() => _ShareSheetState();
}

class _ShareSheetState extends State<_ShareSheet> {
  final _key = GlobalKey();
  final _name = TextEditingController();
  bool _story = true;
  bool _busy = false;

  @override
  void dispose() {
    _name.dispose();
    super.dispose();
  }

  Future<void> _share() async {
    setState(() => _busy = true);
    try {
      final boundary = _key.currentContext!.findRenderObject() as RenderRepaintBoundary;
      // Корт 360 нуқта паҳн аст: ×3 = 1080 пиксел, мисли сайт.
      final image = await boundary.toImage(pixelRatio: 3);
      final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
      final file = File('${(await getTemporaryDirectory()).path}/ikhtisosi-man-${DateTime.now().millisecondsSinceEpoch}.png');
      await file.writeAsBytes(bytes!.buffer.asUint8List());
      await SharePlus.instance.share(
        ShareParams(
          files: [XFile(file.path, mimeType: 'image/png')],
          text: '${widget.shareText} https://$_site',
        ),
      );
    } catch (_) {
      await SharePlus.instance.share(ShareParams(text: '${widget.shareText} https://$_site'));
    }
    if (mounted) setState(() => _busy = false);
  }

  @override
  Widget build(BuildContext context) {
    final height = MediaQuery.sizeOf(context).height;
    return Padding(
      padding: EdgeInsets.fromLTRB(16, 16, 16, 16 + MediaQuery.viewInsetsOf(context).bottom + MediaQuery.viewPaddingOf(context).bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(t('Корти натиҷа'), style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 12),
          SizedBox(
            height: height * (_story ? 0.38 : 0.28),
            child: FittedBox(
              child: RepaintBoundary(
                key: _key,
                child: _Card(data: widget.data, story: _story, name: _name.text.trim()),
              ),
            ),
          ),
          const SizedBox(height: 12),
          SegmentedButton<bool>(
            segments: [
              ButtonSegment(value: true, label: Text(t('Story'))),
              ButtonSegment(value: false, label: Text(t('Мураббаъ'))),
            ],
            selected: {_story},
            onSelectionChanged: (v) => setState(() => _story = v.first),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _name,
            maxLength: 40,
            onChanged: (_) => setState(() {}),
            decoration: InputDecoration(hintText: t('Номи шумо (ихтиёрӣ)'), counterText: '', isDense: true),
          ),
          const SizedBox(height: 12),
          FilledButton.icon(onPressed: _busy ? null : _share, icon: const Icon(Icons.ios_share_rounded), label: Text(t('Фиристодан'))),
        ],
      ),
    );
  }
}

class _Card extends StatelessWidget {
  const _Card({required this.data, required this.story, required this.name});
  final ShareCardData data;
  final bool story;
  final String name;

  @override
  Widget build(BuildContext context) {
    final colors = clusterGradient[data.cluster] ?? _defaultGradient;
    const white = Colors.white;
    final soft = Colors.white.withValues(alpha: 0.8);
    TextStyle display(double size) => TextStyle(fontFamily: AppFonts.display, fontSize: size, fontWeight: FontWeight.w900, color: white, height: 1.08);
    TextStyle body(double size, {Color? color, FontWeight weight = FontWeight.w700}) => TextStyle(fontFamily: AppFonts.body, fontSize: size, fontWeight: weight, color: color ?? white, height: 1.2);
    final careers = data.careers.where((c) => c.isNotEmpty).take(story ? 3 : 2).toList();
    return MediaQuery(
      data: const MediaQueryData(textScaler: TextScaler.noScaling),
      child: Container(
        width: 360,
        height: story ? 640 : 360,
        decoration: BoxDecoration(
          gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: colors),
        ),
        child: Stack(
          children: [
            Positioned(right: -70, top: -60, child: _Circle(size: 210)),
            Positioned(left: -80, bottom: story ? 120 : 40, child: _Circle(size: 170)),
            Padding(
              padding: EdgeInsets.fromLTRB(26, story ? 40 : 22, 26, 26),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: Image.asset('assets/images/logo.png', width: story ? 40 : 32, height: story ? 40 : 32),
                      ),
                      const SizedBox(width: 10),
                      Text('ИХТИСОСИ МАН', style: display(story ? 18 : 16)),
                    ],
                  ),
                  SizedBox(height: story ? 44 : 20),
                  if (name.isNotEmpty) ...[
                    Text(
                      name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: body(13.5, color: soft, weight: FontWeight.w600),
                    ),
                    SizedBox(height: story ? 14 : 8),
                  ],
                  if (data.kind == 'quiz') ...[
                    Text('${_ct('direction')}:', style: body(story ? 14.5 : 12.5, color: soft)),
                    const SizedBox(height: 6),
                    Text(data.title.toUpperCase(), maxLines: story ? 3 : 2, overflow: TextOverflow.ellipsis, style: display(story ? 30 : 23)),
                    if (data.percent != null) ...[
                      SizedBox(height: story ? 22 : 12),
                      Row(
                        children: [
                          Expanded(
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(99),
                              child: LinearProgressIndicator(value: (data.percent! / 100).clamp(0, 1).toDouble(), minHeight: story ? 11 : 9, color: white, backgroundColor: Colors.white24),
                            ),
                          ),
                          const SizedBox(width: 14),
                          Text('${data.percent}%', style: display(story ? 24 : 20)),
                        ],
                      ),
                    ],
                    if (careers.isNotEmpty) ...[
                      SizedBox(height: story ? 34 : 14),
                      Text('${_ct('careers')}:', style: body(story ? 14 : 12, color: soft)),
                      const SizedBox(height: 8),
                      for (var i = 0; i < careers.length; i++)
                        Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: EdgeInsets.symmetric(horizontal: 12, vertical: story ? 10 : 7),
                          decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.14), borderRadius: BorderRadius.circular(14)),
                          child: Row(
                            children: [
                              Text('${i + 1}', style: display(story ? 17 : 15)),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(careers[i], maxLines: 2, overflow: TextOverflow.ellipsis, style: body(story ? 15 : 13)),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ] else ...[
                    Text(data.fit ? '${_ct('fit')}:' : '', style: body(story ? 15 : 13, color: soft)),
                    const SizedBox(height: 6),
                    Text(data.title, maxLines: 3, overflow: TextOverflow.ellipsis, style: display(story ? 28 : 22)),
                    if (!data.fit) ...[
                      const SizedBox(height: 10),
                      Text(
                        _ct('notFit'),
                        style: body(story ? 14 : 12, color: soft, weight: FontWeight.w600),
                      ),
                    ],
                    SizedBox(height: story ? 24 : 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        if (data.total != null) _Chip(_ct('solved', {'n': data.solved, 't': data.total}), story),
                        if (data.confBefore != null && data.confAfter != null) _Chip(_ct('confidence', {'a': data.confBefore, 'b': data.confAfter}), story),
                      ],
                    ),
                  ],
                  const Spacer(),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(data.kind == 'quiz' ? _ct('quizCta') : _ct('trialCta'), style: display(story ? 19 : 15.5)),
                            const SizedBox(height: 6),
                            Text(_site, style: body(story ? 12.5 : 11, color: Colors.white.withValues(alpha: 0.85))),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(color: white, borderRadius: BorderRadius.circular(10)),
                        child: QrImageView(
                          data: _cardLink,
                          size: story ? 86 : 66,
                          padding: EdgeInsets.zero,
                          eyeStyle: const QrEyeStyle(eyeShape: QrEyeShape.square, color: Color(0xFF0F172A)),
                          dataModuleStyle: const QrDataModuleStyle(dataModuleShape: QrDataModuleShape.square, color: Color(0xFF0F172A)),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Circle extends StatelessWidget {
  const _Circle({required this.size});
  final double size;

  @override
  Widget build(BuildContext context) => Container(
    width: size,
    height: size,
    decoration: BoxDecoration(shape: BoxShape.circle, color: Colors.white.withValues(alpha: 0.07)),
  );
}

class _Chip extends StatelessWidget {
  const _Chip(this.text, this.story);
  final String text;
  final bool story;

  @override
  Widget build(BuildContext context) => Container(
    padding: EdgeInsets.symmetric(horizontal: 14, vertical: story ? 9 : 7),
    decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.16), borderRadius: BorderRadius.circular(99)),
    child: Text(
      text,
      style: TextStyle(fontFamily: AppFonts.body, fontSize: story ? 14 : 12, fontWeight: FontWeight.w700, color: Colors.white),
    ),
  );
}

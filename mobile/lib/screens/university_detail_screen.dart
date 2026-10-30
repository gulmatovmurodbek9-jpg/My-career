import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../api/api.dart';
import '../api/models.dart';
import '../app/settings.dart';
import '../app/theme.dart';
import '../ui/widgets.dart';
import 'career_detail_screen.dart';
import '../app/i18n.dart';

class UniversityDetailScreen extends StatefulWidget {
  const UniversityDetailScreen({super.key, required this.universityId, required this.title});
  final String universityId;
  final String title;

  @override
  State<UniversityDetailScreen> createState() => _UniversityDetailScreenState();
}

class _UniversityDetailScreenState extends State<UniversityDetailScreen> {
  University? _uni;
  List<Map<String, dynamic>> _specialties = [];
  String? _error;
  final _search = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _error = null);
    try {
      final results = await Future.wait([
        Api.instance.get('/universities/${widget.universityId}'),
        Api.instance.get('/universities/${widget.universityId}/specialties', {if (appSettings.grade != null) 'grade': '${appSettings.grade}'}),
      ]);
      setState(() {
        _uni = University.fromJson(Map<String, dynamic>.from(results[0]));
        _specialties = (results[1] as List).map((e) => Map<String, dynamic>.from(e)).toList();
      });
    } catch (e) {
      setState(() => _error = e.toString());
    }
  }

  Future<void> _open(Uri uri) async {
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication) && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(t('Кушода нашуд'), style: TextStyle(fontSize: 18))));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(t('Донишгоҳ'))),
      body: SafeArea(
        child: _error != null
            ? ErrorView(message: _error!, onRetry: _load)
            : _uni == null
                ? const LoadingView()
                : _content(context, _uni!),
      ),
    );
  }

  Widget _content(BuildContext context, University u) {
    final text = Theme.of(context).textTheme;
    final q = _search.text.trim().toLowerCase();
    final list = _specialties.where((s) => q.isEmpty || '${s['name']}'.toLowerCase().contains(q)).toList();
    final website = u.website.isEmpty ? null : Uri.tryParse(u.website.startsWith('http') ? u.website : 'https://${u.website}');
    return ListView(
      padding: AppSizes.page,
      children: [
        Text(u.name, style: text.headlineMedium),
        const SizedBox(height: 12),
        Wrap(spacing: 8, runSpacing: 8, children: [
          if (u.city.isNotEmpty) Badge2(u.city, color: AppColors.textSoft, background: const Color(0xFFF1F5F9)),
          if (u.type.isNotEmpty) Badge2(u.type),
          Badge2(u.isState ? t('Давлатӣ') : t('Ғайридавлатӣ'), color: u.isState ? AppColors.budget : const Color(0xFFB45309), background: u.isState ? AppColors.budgetSoft : const Color(0xFFFEF3C7)),
        ]),
        if (u.address.isNotEmpty) ...[
          const SizedBox(height: 14),
          Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Icon(Icons.place_rounded, size: 26, color: AppColors.textSoft),
            const SizedBox(width: 8),
            Expanded(child: Text(u.address, style: text.bodyLarge)),
          ]),
        ],
        const SizedBox(height: 18),
        Row(children: [
          if (website != null)
            Expanded(child: OutlinedButton.icon(onPressed: () => _open(website), icon: const Icon(Icons.language_rounded, size: 26), label: Text(t('Сомона')))),
          if (website != null && u.lat != null) const SizedBox(width: 10),
          if (u.lat != null && u.lng != null)
            Expanded(
              child: OutlinedButton.icon(
                onPressed: () => _open(Uri.parse('https://www.google.com/maps/search/?api=1&query=${u.lat},${u.lng}')),
                icon: const Icon(Icons.map_rounded, size: 26),
                label: Text(t('Харита')),
              ),
            ),
        ]),
        if (u.description.isNotEmpty) ...[
          SectionTitle(t('Дар бораи муассиса')),
          Text(u.description, style: text.bodyLarge),
        ],
        SectionTitle(t('Ихтисосҳо ({n})', {'n': _specialties.length})),
        if (_specialties.length > 8) ...[
          TextField(
            controller: _search,
            onChanged: (_) => setState(() {}),
            style: const TextStyle(fontSize: 16.5),
            decoration: InputDecoration(hintText: t('Ихтисосро ёбед'), prefixIcon: Icon(Icons.search_rounded, size: 26)),
          ),
          const SizedBox(height: 12),
        ],
        for (final s in list) ...[
          _SpecialtyCard(data: s),
          const SizedBox(height: 10),
        ],
      ],
    );
  }
}

class _SpecialtyCard extends StatelessWidget {
  const _SpecialtyCard({required this.data});
  final Map<String, dynamic> data;

  @override
  Widget build(BuildContext context) {
    final offerings = (data['offerings'] as List? ?? []).cast<Map>();
    final free = offerings.any((o) => o['paymentType'] == 'ройгон');
    final fees = offerings.map((o) => o['tuitionFee']).whereType<num>().where((n) => n > 0).toList()..sort();
    final name = cleanName('${data['name'] ?? ''}');
    return AppCard(
      onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => CareerDetailScreen(careerId: '${data['id']}', title: name))),
      child: Row(children: [
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(name, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            Wrap(spacing: 8, runSpacing: 8, children: [
              if (free) Badge2(t('Буҷетӣ'), color: AppColors.budget, background: AppColors.budgetSoft),
              if (fees.isNotEmpty) Badge2(t('{n} сомонӣ', {'n': money(fees.first.toInt())})),
            ]),
          ]),
        ),
        const Icon(Icons.chevron_right_rounded, size: 26, color: AppColors.textSoft),
      ]),
    );
  }
}

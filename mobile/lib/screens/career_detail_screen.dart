import 'package:flutter/material.dart';

import '../api/api.dart';
import '../api/models.dart';
import '../app/settings.dart';
import '../app/theme.dart';
import '../ui/widgets.dart';
import 'university_detail_screen.dart';

class CareerDetailScreen extends StatefulWidget {
  const CareerDetailScreen({super.key, required this.careerId, required this.title});
  final String careerId;
  final String title;

  @override
  State<CareerDetailScreen> createState() => _CareerDetailScreenState();
}

class _CareerDetailScreenState extends State<CareerDetailScreen> {
  Career? _career;
  List<Offering> _offerings = [];
  String? _error;
  bool _showFree = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _error = null);
    try {
      final results = await Future.wait([
        Api.instance.get('/careers/${widget.careerId}'),
        Api.instance.get('/careers/${widget.careerId}/offerings', {if (appSettings.grade != null) 'grade': '${appSettings.grade}'}),
      ]);
      final offerings = (results[1] as List).map((e) => Offering.fromJson(Map<String, dynamic>.from(e))).toList();
      setState(() {
        _career = Career.fromJson(Map<String, dynamic>.from(results[0]));
        _offerings = offerings;
        _showFree = offerings.any((o) => o.free);
      });
    } catch (e) {
      setState(() => _error = e.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Ихтисос')),
      body: SafeArea(
        child: _error != null
            ? ErrorView(message: _error!, onRetry: _load)
            : _career == null
                ? const LoadingView()
                : _content(context, _career!),
      ),
    );
  }

  Widget _content(BuildContext context, Career c) {
    final text = Theme.of(context).textTheme;
    final free = _offerings.where((o) => o.free).toList();
    final paid = _offerings.where((o) => !o.free).toList();
    final shown = _showFree ? free : paid;
    String salary(String key) => '${c.salary[key] ?? ''}'.trim();
    return ListView(
      padding: AppSizes.page,
      children: [
        if (c.cluster.isNotEmpty) Text(c.cluster.toUpperCase(), style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, letterSpacing: 0.6, color: AppColors.primary)),
        const SizedBox(height: 6),
        Text(c.name, style: text.headlineMedium),
        const SizedBox(height: 14),
        if (c.description.isNotEmpty) Text(c.description, style: text.bodyLarge),
        if (salary('junior').isNotEmpty) ...[
          const SectionTitle('Маош дар як моҳ'),
          AppCard(
            child: Column(children: [
              InfoRow('Навкор', salary('junior')),
              if (salary('mid').isNotEmpty) InfoRow('Бо таҷриба', salary('mid')),
              if (salary('senior').isNotEmpty) InfoRow('Мутахассиси калон', salary('senior')),
            ]),
          ),
          const SizedBox(height: 6),
          Text('Маош тахминӣ аст, аз эълонҳои кор.', style: text.bodyMedium),
        ],
        if (c.jobs.isNotEmpty) ...[
          const SectionTitle('Дар куҷо кор мекунанд'),
          for (final job in c.jobs.take(6))
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Padding(padding: EdgeInsets.only(top: 4), child: Icon(Icons.check_circle_rounded, size: 24, color: AppColors.budget)),
                const SizedBox(width: 10),
                Expanded(child: Text(job, style: text.bodyLarge)),
              ]),
            ),
        ],
        const SectionTitle('Дар куҷо мехонанд'),
        if (_offerings.isEmpty)
          Text('Ҳоло ягон муассиса ин ихтисосро қабул намекунад.', style: text.bodyLarge)
        else ...[
          // Ду тугмаи калон: буҷетӣ ва шартномавӣ — ҳар кадом рӯйхати худро нишон медиҳад.
          Row(children: [
            Expanded(child: _TypeButton(label: 'Буҷетӣ', count: free.length, selected: _showFree, color: AppColors.budget, soft: AppColors.budgetSoft, onTap: () => setState(() => _showFree = true))),
            const SizedBox(width: 10),
            Expanded(child: _TypeButton(label: 'Шартномавӣ', count: paid.length, selected: !_showFree, color: AppColors.contract, soft: AppColors.contractSoft, onTap: () => setState(() => _showFree = false))),
          ]),
          const SizedBox(height: 14),
          if (shown.isEmpty)
            Text(_showFree ? 'Ҷойи буҷетӣ нест.' : 'Ҷойи шартномавӣ нест.', style: text.bodyLarge)
          else
            for (final o in shown) ...[
              _OfferingCard(offering: o),
              const SizedBox(height: 12),
            ],
        ],
      ],
    );
  }
}

class _TypeButton extends StatelessWidget {
  const _TypeButton({required this.label, required this.count, required this.selected, required this.color, required this.soft, required this.onTap});
  final String label;
  final int count;
  final bool selected;
  final Color color;
  final Color soft;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Semantics(
        button: true,
        selected: selected,
        child: Material(
          color: selected ? color : soft,
          borderRadius: BorderRadius.circular(AppSizes.radius),
          child: InkWell(
            borderRadius: BorderRadius.circular(AppSizes.radius),
            onTap: count == 0 ? null : onTap,
            child: Container(
              height: AppSizes.buttonHeight + 4,
              alignment: Alignment.center,
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: FittedBox(
                child: Text('$label · $count', style: TextStyle(fontSize: 19, fontWeight: FontWeight.w800, color: selected ? Colors.white : color.withValues(alpha: count == 0 ? 0.5 : 1))),
              ),
            ),
          ),
        ),
      );
}

class _OfferingCard extends StatelessWidget {
  const _OfferingCard({required this.offering});
  final Offering offering;

  @override
  Widget build(BuildContext context) {
    final o = offering;
    final details = [
      if (o.city.isNotEmpty) o.city,
      if (o.studyForm.isNotEmpty) o.studyForm,
      if (o.language.isNotEmpty) o.language,
      if (o.seats != null && o.seats! > 0) '${o.seats} ҷой',
    ].join(' · ');
    return AppCard(
      onTap: o.universityId.isEmpty ? null : () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => UniversityDetailScreen(universityId: o.universityId, title: o.universityName))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(o.universityName, style: Theme.of(context).textTheme.titleMedium),
        if (details.isNotEmpty) ...[
          const SizedBox(height: 6),
          Text(details, style: Theme.of(context).textTheme.bodyMedium),
        ],
        const SizedBox(height: 10),
        o.free
            ? const Badge2('Буҷетӣ (ройгон)', color: AppColors.budget, background: AppColors.budgetSoft)
            : Badge2(o.fee != null ? '${money(o.fee!)} сомонӣ дар сол' : 'Шартномавӣ'),
      ]),
    );
  }
}

import 'package:flutter/material.dart';

import '../api/api.dart';
import '../api/models.dart';
import '../app/i18n.dart';
import '../app/theme.dart';
import '../ui/widgets.dart';
import 'career_detail_screen.dart';
import 'careers_screen.dart';

// Ду саҳифаи алоҳидаи Панел (мисли /favorites ва /dashboard/plan-и сайт).

class SavedCareersScreen extends StatefulWidget {
  const SavedCareersScreen({super.key});

  @override
  State<SavedCareersScreen> createState() => _SavedCareersScreenState();
}

class _SavedCareersScreenState extends State<SavedCareersScreen> {
  List<Career>? _saved;
  bool _failed = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _failed = false);
    try {
      final data = await Api.instance.getFresh('/users/saved-careers');
      if (mounted) setState(() => _saved = [for (final c in (data as List? ?? const [])) Career.fromJson(Map<String, dynamic>.from(c))]);
    } catch (_) {
      if (mounted) setState(() => _failed = true);
    }
  }

  Future<void> _unsave(Career career) async {
    setState(() => _saved = [...?_saved?.where((c) => c.id != career.id)]);
    try {
      await Api.instance.post('/users/save-career/${career.id}', {});
    } catch (_) {
      _load();
    }
  }

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final saved = _saved;
    return Scaffold(
      appBar: AppBar(title: Text(t('Ихтисосҳои нигоҳдошта'))),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _load,
          child: ListView(
            padding: AppSizes.page,
            children: [
              if (_failed)
                AppCard(child: Text(t('Маълумот наомад. Барои навсозӣ экранро ба поён кашед.'), style: text.bodyMedium))
              else if (saved == null)
                const Center(
                  child: Padding(padding: EdgeInsets.all(24), child: CircularProgressIndicator()),
                )
              else if (saved.isEmpty)
                AppCard(child: Text(t('Ҳоло холӣ аст. Дар саҳифаи ихтисос тугмаи нигоҳ доштанро пахш кунед.'), style: text.bodyLarge))
              else ...[
                Text(t('Барои бардоштан ихтисосро ба чап кашед.'), style: text.bodyMedium?.copyWith(color: AppColors.textSoft)),
                const SizedBox(height: 12),
                for (final career in saved) ...[
                  Dismissible(
                    key: ValueKey('saved-${career.id}'),
                    direction: DismissDirection.endToStart,
                    onDismissed: (_) => _unsave(career),
                    background: Container(
                      alignment: Alignment.centerRight,
                      padding: const EdgeInsets.only(right: 20),
                      child: Icon(Icons.delete_outline_rounded, color: AppColors.textSoft),
                    ),
                    child: CareerCard(career: career),
                  ),
                  const SizedBox(height: 10),
                ],
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class ApplicationPlanScreen extends StatefulWidget {
  const ApplicationPlanScreen({super.key});

  @override
  State<ApplicationPlanScreen> createState() => _ApplicationPlanScreenState();
}

class _ApplicationPlanScreenState extends State<ApplicationPlanScreen> {
  List<Map<String, dynamic>>? _plan;
  bool _failed = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _failed = false);
    try {
      final data = await Api.instance.getFresh('/users/application-plan');
      if (mounted) setState(() => _plan = [for (final item in ((data as Map?)?['items'] as List? ?? const [])) Map<String, dynamic>.from(item)]);
    } catch (_) {
      if (mounted) setState(() => _failed = true);
    }
  }

  Future<void> _remove(String offeringId) async {
    setState(() => _plan = [...?_plan?.where((item) => '${item['offeringId']}' != offeringId)]);
    try {
      await Api.instance.delete('/users/application-plan/$offeringId');
    } catch (_) {
      _load();
    }
  }

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final plan = _plan;
    return Scaffold(
      appBar: AppBar(title: Text(t('Нақшаи ҳуҷҷатсупорӣ'))),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _load,
          child: ListView(
            padding: AppSizes.page,
            children: [
              if (_failed)
                AppCard(child: Text(t('Маълумот наомад. Барои навсозӣ экранро ба поён кашед.'), style: text.bodyMedium))
              else if (plan == null)
                const Center(
                  child: Padding(padding: EdgeInsets.all(24), child: CircularProgressIndicator()),
                )
              else if (plan.isEmpty)
                AppCard(child: Text(t('Дар саҳифаи ихтисос ҷойи таҳсилро «Ба рӯйхат» илова кунед. Дар ММТ то 10 интихоб мумкин аст.'), style: text.bodyLarge))
              else ...[
                Text(t('Аввал ҷойҳои буҷетӣ, баъд шартномавӣ. Дар ММТ то 10 интихоб мумкин аст.'), style: text.bodyMedium?.copyWith(color: AppColors.textSoft)),
                const SizedBox(height: 12),
                for (final item in plan) ...[
                  _PlanItem(
                    item: item,
                    onOpen: () => Navigator.of(context).push(smoothRoute(CareerDetailScreen(careerId: '${item['careerId']}', title: '${item['careerName'] ?? ''}'))),
                    onRemove: () => _remove('${item['offeringId']}'),
                  ),
                  const SizedBox(height: 10),
                ],
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _PlanItem extends StatelessWidget {
  const _PlanItem({required this.item, required this.onOpen, required this.onRemove});
  final Map<String, dynamic> item;
  final VoidCallback onOpen;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final free = item['isFree'] == true;
    final fee = item['tuitionFee'];
    return AppCard(
      onTap: onOpen,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 15,
            backgroundColor: AppColors.contractSoft,
            child: Text(
              '${item['order'] ?? ''}',
              style: TextStyle(fontWeight: FontWeight.w700, color: AppColors.primary),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(cleanName('${item['careerName'] ?? ''}'), style: text.titleMedium),
                const SizedBox(height: 4),
                Text('${item['universityName'] ?? ''}${item['city'] != null ? ', ${item['city']}' : ''}', style: text.bodyMedium?.copyWith(color: AppColors.textSoft)),
                const SizedBox(height: 4),
                Text(
                  free ? t('Ҷойи буҷетӣ') : (fee is num ? t('Шартнома: {n} сомонӣ', {'n': money(fee.toInt())}) : t('Шартнома')),
                  style: text.bodyMedium?.copyWith(color: AppColors.primary, fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ),
          IconButton(
            tooltip: t('Аз рӯйхат бардоштан'),
            onPressed: onRemove,
            icon: Icon(Icons.close_rounded, color: AppColors.textSoft),
          ),
        ],
      ),
    );
  }
}

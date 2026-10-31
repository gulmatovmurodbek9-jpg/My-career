import 'dart:async';

import 'package:flutter/material.dart';

import '../api/api.dart';
import '../api/models.dart';
import '../app/career_refs.dart';
import '../app/settings.dart';
import '../app/theme.dart';
import '../ui/widgets.dart';
import 'career_detail_screen.dart';
import '../app/i18n.dart';

// Рӯйхати 884 ихтисос: ҷустуҷӯи калон дар боло, саҳифа ба саҳифа бор мешавад.
class CareersScreen extends StatefulWidget {
  const CareersScreen({super.key, this.clusterId, this.title, this.initialSearch});

  // Аз «Ихтисосҳои вобаста»: рӯйхат бо ҷустуҷӯи тайёр кушода мешавад.
  final String? initialSearch;

  // Аз саҳифаи асосӣ: танҳо ихтисосҳои як кластер.
  final String? clusterId;
  final String? title;

  @override
  State<CareersScreen> createState() => _CareersScreenState();
}

class _CareersScreenState extends State<CareersScreen> {
  final _items = <Career>[];
  final _scroll = ScrollController();
  final _search = TextEditingController();
  Timer? _debounce;
  int _page = 1;
  int _total = 0;
  bool _loading = false;
  bool _done = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    if (widget.initialSearch != null) _search.text = widget.initialSearch!;
    _scroll.addListener(() {
      if (_scroll.position.pixels > _scroll.position.maxScrollExtent - 600) _load();
    });
    _load(reset: true);
  }

  @override
  void dispose() {
    _scroll.dispose();
    _search.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  Future<void> _load({bool reset = false}) async {
    if (_loading || (_done && !reset)) return;
    if (reset) {
      _page = 1;
      _done = false;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final query = {
        'page': '$_page',
        'limit': '20',
        if (_search.text.trim().isNotEmpty) 'search': _search.text.trim(),
        if (appSettings.grade != null) 'grade': '${appSettings.grade}',
        if (widget.clusterId != null) 'clusterId': widget.clusterId!,
      };
      final data = await Api.instance.get('/careers', query);
      final list = (data['data'] as List).map((e) => Career.fromJson(Map<String, dynamic>.from(e))).toList();
      setState(() {
        if (reset) _items.clear();
        _items.addAll(list);
        _total = (data['meta']?['total'] as num?)?.toInt() ?? _items.length;
        _done = list.length < 20;
        _page++;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _loading = false;
        _error = e.toString();
      });
    }
  }

  void _onSearch(String _) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 450), () => _load(reset: true));
  }

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return Scaffold(
      appBar: AppBar(title: Text(widget.title ?? t('Ихтисосҳо'))),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 4, 20, 8),
              child: TextField(
                controller: _search,
                onChanged: _onSearch,
                textInputAction: TextInputAction.search,
                style: const TextStyle(fontSize: 16.5),
                decoration: InputDecoration(
                  hintText: t('Номи ихтисос, масалан «духтур»'),
                  prefixIcon: const Icon(Icons.search_rounded, size: 26),
                  suffixIcon: _search.text.isEmpty
                      ? null
                      : IconButton(
                          tooltip: t('Тоза кардан'),
                          iconSize: 28,
                          icon: const Icon(Icons.close_rounded),
                          onPressed: () {
                            _search.clear();
                            _load(reset: true);
                          },
                        ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(_loading && _items.isEmpty ? '' : t('Ёфт шуд: {n}', {'n': _total}), style: text.bodyMedium),
              ),
            ),
            Expanded(
              child: _error != null && _items.isEmpty
                  ? ErrorView(message: _error!, onRetry: () => _load(reset: true))
                  : _items.isEmpty && _loading
                  ? const LoadingView()
                  : _items.isEmpty
                  ? Center(
                      child: Padding(
                        padding: const EdgeInsets.all(28),
                        child: Text(t('Чунин ихтисос ёфт нашуд. Калимаи дигарро нависед.'), textAlign: TextAlign.center, style: text.bodyLarge),
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: () => _load(reset: true),
                      child: ListView.separated(
                        controller: _scroll,
                        padding: const EdgeInsets.fromLTRB(20, 10, 20, 32),
                        itemCount: _items.length + (_done ? 0 : 1),
                        separatorBuilder: (_, _) => const SizedBox(height: 12),
                        itemBuilder: (context, i) {
                          if (i >= _items.length) {
                            return const Padding(
                              padding: EdgeInsets.all(16),
                              child: Center(child: CircularProgressIndicator()),
                            );
                          }
                          return CareerCard(career: _items[i]);
                        },
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class CareerCard extends StatelessWidget {
  const CareerCard({super.key, required this.career});
  final Career career;

  @override
  Widget build(BuildContext context) {
    final cluster = clusterTitle(career.clusterNumber, career.cluster);
    final degree = [
      if (career.degree.isNotEmpty) offerLabel(career.degree),
      if (career.years != null) t('{n} сол', {'n': career.years}),
    ].join(' · ');
    return AppCard(
      onTap: () => Navigator.of(context).push(smoothRoute(CareerDetailScreen(careerId: career.id, title: career.name))),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (cluster.isNotEmpty)
            Text(
              (career.clusterNumber != null ? '${career.clusterNumber}. $cluster' : cluster).toUpperCase(),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, letterSpacing: 0.5, color: AppColors.primary),
            ),
          const SizedBox(height: 4),
          Text(
            career.name,
            style: TextStyle(fontFamily: AppFonts.display, fontSize: 16.5, fontWeight: FontWeight.w700, color: AppColors.text, height: 1.25),
          ),
          if (career.description.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(
              career.description,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(fontSize: 13, color: AppColors.textSoft, height: 1.4),
            ),
          ],
          const SizedBox(height: 10),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              if (career.code.isNotEmpty) Badge2(career.code, color: AppColors.textSoft, background: AppColors.muted),
              if (degree.isNotEmpty) Badge2(degree),
              if (career.minFee != null && career.minFee! > 0)
                Badge2(t('аз {n} сомонӣ', {'n': money(career.minFee!)})),
              if (career.hasFreeSeats) Badge2(t('Буҷетӣ ҳаст'), color: AppColors.budget, background: AppColors.budgetSoft),
              if (career.universitiesCount > 0) Badge2(t('{n} муассиса', {'n': career.universitiesCount}), color: AppColors.textSoft, background: AppColors.muted),
            ],
          ),
        ],
      ),
    );
  }
}

import 'dart:async';

import 'package:flutter/material.dart';

import '../api/api.dart';
import '../api/models.dart';
import '../app/career_refs.dart';
import '../app/clusters.dart';
import '../app/settings.dart';
import '../app/theme.dart';
import '../ui/widgets.dart';
import 'career_detail_screen.dart';
import 'career_filters.dart';
import '../app/i18n.dart';

// Рӯйхати 884 ихтисос: ҷустуҷӯ (оддӣ ва бо AI), филтрҳои фаҳмо дар зери он, саҳифа ба саҳифа бор мешавад.
class CareersScreen extends StatefulWidget {
  const CareersScreen({super.key, this.clusterId, this.title, this.initialSearch, this.initialAi = false});

  // Аз ёвари овозӣ: ҷумла бо ҷустуҷӯи AI иҷро мешавад.
  final bool initialAi;

  // Аз «Ихтисосҳои вобаста»: рӯйхат бо ҷустуҷӯи тайёр кушода мешавад.
  final String? initialSearch;

  // Аз саҳифаи асосӣ: танҳо ихтисосҳои як кластер.
  final String? clusterId;
  final String? title;

  @override
  State<CareersScreen> createState() => _CareersScreenState();
}

class _CareersScreenState extends State<CareersScreen> {
  static const _limit = 20;
  final _items = <Career>[];
  final _scroll = ScrollController();
  final _search = TextEditingController();
  Timer? _debounce;
  int _page = 1;
  int _total = 0;
  bool _loading = false;
  bool _done = false;
  String? _error;
  int _request = 0;
  late CareerFilters _filters = CareerFilters(grade: appSettings.grade, clusterId: widget.clusterId);

  // Ҷустуҷӯи AI: танҳо бо пахши тугма, чунки ҳар бор як дархост ба модел аст.
  String? _aiQuery;
  Map<String, dynamic>? _aiFilters;
  bool _aiUnderstood = true;
  String? _aiQuestion;
  List<Map<String, dynamic>> _aiOptions = const [];
  Map<String, dynamic>? _aiChoice;
  bool _aiError = false;

  @override
  void initState() {
    super.initState();
    if (widget.initialSearch != null) _search.text = widget.initialSearch!;
    if (widget.initialAi) _aiQuery = widget.initialSearch;
    _scroll.addListener(() {
      if (_scroll.hasClients && _scroll.position.pixels > _scroll.position.maxScrollExtent - 600) _load();
    });
    appSettings.addListener(_onSettings);
    _load(reset: true);
  }

  @override
  void dispose() {
    appSettings.removeListener(_onSettings);
    _scroll.dispose();
    _search.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  // Синф дар «Танзимот» ё тест иваз шуд.
  void _onSettings() {
    if (appSettings.grade == _filters.grade) return;
    _filters = appSettings.grade == null ? _filters.copy(clearGrade: true) : _filters.copy(grade: appSettings.grade);
    _load(reset: true);
  }

  Future<Map<String, dynamic>> _fetch() async {
    final paging = {'page': '$_page', 'limit': '$_limit'};
    final grade = appSettings.grade;
    final choice = _aiChoice;
    if (choice != null) {
      final f = choice['filters'] is Map ? Map<String, dynamic>.from(choice['filters']) : <String, dynamic>{};
      bool has(dynamic v) => v != null && '$v'.isNotEmpty && !(v is List && v.isEmpty);
      final data = await Api.instance.get('/careers', {
        ...paging,
        if (grade != null) 'grade': '$grade',
        if (has(f['search'])) 'search': '${f['search']}',
        if (has(f['searchAny'])) 'searchAny': (f['searchAny'] as List).map((e) => '$e').toList(),
        if (has(f['names'])) 'names': (f['names'] as List).map((e) => '$e').toList(),
        if (has(f['clusterId'])) 'clusterId': '${f['clusterId']}',
        if (has(f['maxPrice'])) 'maxPrice': '${f['maxPrice']}',
        if (has(f['city'])) 'city': '${f['city']}',
        if (f['onlyFree'] == true) 'freeSeatsOnly': 'true',
      });
      return Map<String, dynamic>.from(data);
    }
    if (_aiQuery != null) {
      final data = await Api.instance.post('/careers/ai-search', {'query': _aiQuery, 'lang': appSettings.lang, 'page': _page, 'limit': _limit, 'grade': ?grade}, timeout: Api.aiTimeout);
      return Map<String, dynamic>.from(data);
    }
    final text = _search.text.trim();
    final data = await Api.instance.get('/careers', {...paging, if (text.isNotEmpty) 'search': text, ..._filters.query});
    return Map<String, dynamic>.from(data);
  }

  Future<void> _load({bool reset = false}) async {
    if (!reset && (_loading || _done)) return;
    if (reset) {
      _page = 1;
      _done = false;
    }
    final request = ++_request; // ҷавоби дархости кӯҳна (филтри пешина) партофта мешавад
    setState(() {
      _loading = true;
      _error = null;
      if (reset) _aiError = false;
    });
    try {
      final data = await _fetch();
      if (!mounted || request != _request) return;
      final list = (data['data'] as List).map((e) => Career.fromJson(Map<String, dynamic>.from(e))).toList();
      setState(() {
        if (reset) _items.clear();
        _items.addAll(list);
        _total = (data['meta']?['total'] as num?)?.toInt() ?? _items.length;
        _done = list.length < _limit;
        _page++;
        _loading = false;
        if (_aiQuery != null && _aiChoice == null && reset) {
          _aiFilters = data['filters'] is Map ? Map<String, dynamic>.from(data['filters']) : null;
          _aiUnderstood = data['understood'] != false;
          _aiQuestion = data['question'] is String ? data['question'] as String : null;
          _aiOptions = data['options'] is List ? (data['options'] as List).map((e) => Map<String, dynamic>.from(e)).toList() : const [];
        }
      });
    } catch (e) {
      if (!mounted || request != _request) return;
      setState(() {
        _loading = false;
        _error = e.toString();
        if (_aiQuery != null && _aiChoice == null) _aiError = true;
      });
    }
  }

  void _onSearch(String _) {
    _debounce?.cancel();
    setState(_clearAi);
    _debounce = Timer(const Duration(milliseconds: 450), () => _load(reset: true));
  }

  void _clearAi() {
    _aiQuery = null;
    _aiFilters = null;
    _aiQuestion = null;
    _aiOptions = const [];
    _aiChoice = null;
    _aiError = false;
  }

  void _runAi() {
    final text = _search.text.trim();
    if (text.isEmpty) return;
    FocusScope.of(context).unfocus();
    _debounce?.cancel();
    setState(() {
      _clearAi();
      _aiQuery = text;
      _items.clear();
    });
    _load(reset: true);
  }

  void _applyFilters(CareerFilters next) {
    final gradeChanged = next.grade != _filters.grade;
    _filters = next;
    if (gradeChanged) appSettings.setGrade(next.grade);
    _load(reset: true);
  }

  void _clearAll() {
    _search.clear();
    setState(_clearAi);
    _applyFilters(CareerFilters(grade: _filters.grade));
  }

  Future<void> _openFilters() async {
    FocusScope.of(context).unfocus();
    final next = await showCareerFilters(context, _filters, _search.text.trim());
    if (next != null && mounted) _applyFilters(next);
  }

  String get _title => _filters.clusterId == widget.clusterId && widget.title != null ? widget.title! : t('Ихтисосҳо');

  @override
  Widget build(BuildContext context) {
    final showAi = _aiQuery != null;
    return Scaffold(
      appBar: AppBar(title: Text(_title)),
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(padding: const EdgeInsets.fromLTRB(16, 2, 16, 8), child: _searchField()),
            if (!showAi) _quickFilters(),
            if (showAi) _aiSummary(),
            Padding(
              padding: const EdgeInsets.fromLTRB(18, 8, 8, 2),
              child: SizedBox(
                height: 30,
                child: Row(
                  children: [
                    Expanded(
                      child: Text(_loading && _items.isEmpty ? (showAi ? t('AI меҷӯяд…') : '') : t('{n} ихтисос ёфт шуд', {'n': _total}), style: TextStyle(fontSize: 13.5, color: AppColors.textSoft)),
                    ),
                    if (!showAi && _filters.activeCount > 0)
                      TextButton(
                        style: TextButton.styleFrom(
                          minimumSize: const Size(0, 30),
                          padding: const EdgeInsets.symmetric(horizontal: 10),
                          textStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                        ),
                        onPressed: _clearAll,
                        child: Text(t('Тоза кардан')),
                      ),
                  ],
                ),
              ),
            ),
            Expanded(child: _list()),
          ],
        ),
      ),
    );
  }

  Widget _searchField() => TextField(
    controller: _search,
    onChanged: _onSearch,
    onSubmitted: (_) => _load(reset: true),
    textInputAction: TextInputAction.search,
    style: TextStyle(fontSize: 15, color: AppColors.text),
    decoration: InputDecoration(
      hintText: t('Ихтисос ё савол нависед…'),
      isDense: true,
      contentPadding: const EdgeInsets.symmetric(vertical: 13),
      prefixIcon: const Icon(Icons.search_rounded, size: 22),
      suffixIcon: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (_search.text.isNotEmpty)
            IconButton(
              tooltip: t('Тоза кардан'),
              iconSize: 20,
              visualDensity: VisualDensity.compact,
              icon: const Icon(Icons.close_rounded),
              onPressed: () {
                _search.clear();
                setState(_clearAi);
                _load(reset: true);
              },
            ),
          Padding(
            padding: const EdgeInsets.only(right: 6),
            child: Tooltip(
              message: t('Ҷустуҷӯи AI'),
              child: Material(
                color: _search.text.trim().isEmpty ? AppColors.muted : AppColors.primary,
                borderRadius: BorderRadius.circular(11),
                child: InkWell(
                  borderRadius: BorderRadius.circular(11),
                  onTap: _search.text.trim().isEmpty ? null : _runAi,
                  child: Padding(
                    padding: const EdgeInsets.all(8),
                    child: Icon(Icons.auto_awesome_rounded, size: 19, color: _search.text.trim().isEmpty ? AppColors.textSoft : Colors.white),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    ),
  );

  // Бе скрол: тугмаи филтр ва се синф ҳамеша пурра намоёнанд; филтрҳои фаъол дар зер ба сатри нав мегузаранд.
  Widget _quickFilters() {
    final f = _filters;
    final active = <Widget>[
      if (f.clusterId != null) _FilterChip(label: clusterTitle(f.clusterNumber, widget.title ?? t('Кластер')), onTap: () => _applyFilters(f.copy(clearCluster: true))),
      if (f.city != null) _FilterChip(label: f.city!, onTap: () => _applyFilters(f.copy(clearCity: true))),
      if (f.minPrice != null || f.maxPrice != null) _FilterChip(label: _priceLabel(f), onTap: () => _applyFilters(f.copy(clearPrice: true))),
      if (f.freeOnly) _FilterChip(label: t('Ҷойҳои ройгон'), onTap: () => _applyFilters(f.copy(freeOnly: false))),
    ];
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              _FilterButton(count: f.activeCount, onTap: _openFilters),
              const SizedBox(width: 8),
              Expanded(
                child: GradeSwitch(
                  value: f.grade,
                  short: true,
                  onChanged: (g) => _applyFilters(g == null ? f.copy(clearGrade: true) : f.copy(grade: g)),
                ),
              ),
            ],
          ),
          if (active.isNotEmpty) ...[const SizedBox(height: 8), Wrap(spacing: 6, runSpacing: 6, children: active)],
        ],
      ),
    );
  }

  String _priceLabel(CareerFilters f) {
    if (f.minPrice != null && f.maxPrice != null) return '${money(f.minPrice!)} – ${money(f.maxPrice!)} ${t('сомонӣ')}';
    if (f.maxPrice != null) return t('то {price} сомонӣ', {'price': money(f.maxPrice!)});
    return t('аз {n} сомонӣ', {'n': money(f.minPrice!)});
  }

  // Он чи AI фаҳмид ва соҳаҳое, ки пешниҳод мекунад.
  Widget _aiSummary() {
    final f = _aiFilters ?? const <String, dynamic>{};
    final choice = _aiChoice;
    final words = [
      if (f['names'] is List && (f['names'] as List).isNotEmpty)
        (f['names'] as List).join(', ')
      else if (f['keywords'] is List && (f['keywords'] as List).isNotEmpty)
        (f['keywords'] as List).join(', ')
      else if ('${f['search'] ?? ''}'.isNotEmpty)
        '${f['search']}',
    ];
    final tags = <String>[
      if (words.isNotEmpty) t('калима: {word}', {'word': words.first}),
      if (f['clusterNumber'] is num) clusterTitle((f['clusterNumber'] as num).toInt(), ''),
      if (f['maxPrice'] is num) t('то {price} сомонӣ', {'price': money((f['maxPrice'] as num).toInt())}),
      if ('${f['city'] ?? ''}'.isNotEmpty) t('шаҳри {city}', {'city': f['city']}),
      if (f['onlyFree'] == true) t('ҷойи ройгон'),
    ];
    final tagStyle = TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: AppColors.primary);
    Widget tag(String text) => Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(color: AppColors.contractSoft, borderRadius: BorderRadius.circular(999)),
      child: Text(text, style: tagStyle),
    );
    return ConstrainedBox(
      constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(context).height * 0.42),
      child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (_aiError)
              Text(
                t('Ҷустуҷӯи AI кор накард. Ҷустуҷӯи оддиро истифода баред.'),
                style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600, color: AppColors.danger),
              ),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                if (_aiFilters != null)
                  Text(
                    _aiUnderstood ? t('AI фаҳмид:') : t('AI саволро пурра нафаҳмид — ҷустуҷӯи оддӣ иҷро шуд.'),
                    style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: AppColors.textSoft),
                  ),
                for (final text in tags) tag(text),
                if (choice != null) tag(choice['clusterNumber'] is num ? clusterTitle((choice['clusterNumber'] as num).toInt(), '') : '${choice['label'] ?? ''}'),
                if (choice != null)
                  _SmallLink(
                    icon: Icons.arrow_back_rounded,
                    label: t('Вариантҳои дигар'),
                    onTap: () {
                      setState(() => _aiChoice = null);
                      _load(reset: true);
                    },
                  ),
                _SmallLink(
                  icon: Icons.close_rounded,
                  label: t('Тоза кардан'),
                  onTap: () {
                    setState(_clearAi);
                    _load(reset: true);
                  },
                ),
              ],
            ),
            if ('${f['note'] ?? ''}'.isNotEmpty) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: AppColors.contractSoft, borderRadius: BorderRadius.circular(12)),
                child: Text('${f['note']}', style: TextStyle(fontSize: 13, color: AppColors.text, height: 1.4)),
              ),
            ],
            if (_aiOptions.isNotEmpty && choice == null) ...[
              const SizedBox(height: 10),
              Text(
                _aiQuestion ?? t('Кадом соҳа ба шумо наздиктар аст?'),
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.text),
              ),
              const SizedBox(height: 8),
              for (final o in _aiOptions) _aiOption(o),
            ],
          ],
        ),
      ),
    );
  }

  Widget _aiOption(Map<String, dynamic> o) {
    final number = o['clusterNumber'] is num ? (o['clusterNumber'] as num).toInt() : null;
    final info = number == null ? null : clusters.where((c) => c.number == number).firstOrNull;
    final title = info?.title ?? '${o['label'] ?? ''}';
    final hint = info?.about ?? '${o['hint'] ?? ''}';
    return Padding(
      padding: const EdgeInsets.only(bottom: 7),
      child: Material(
        color: AppColors.card,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
          side: BorderSide(color: AppColors.border),
        ),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: () {
            setState(() => _aiChoice = o);
            _load(reset: true);
          },
          child: Padding(
            padding: const EdgeInsets.all(11),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        title,
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.text),
                      ),
                    ),
                    if (o['count'] != null) Badge2('${o['count']}', color: AppColors.textSoft, background: AppColors.muted),
                  ],
                ),
                if (hint.isNotEmpty) ...[
                  const SizedBox(height: 3),
                  Text(
                    hint,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 12.5, color: AppColors.textSoft, height: 1.35),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _list() {
    if (_error != null && _items.isEmpty) return ErrorView(message: _error!, onRetry: () => _load(reset: true));
    if (_items.isEmpty && _loading) return const LoadingView();
    if (_items.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                _aiQuery != null ? t('Барои ин савол ихтисос ёфт нашуд. Саволро содатар нависед.') : t('Ихтисосе ёфт нашуд'),
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 15.5, fontWeight: FontWeight.w600, color: AppColors.text),
              ),
              const SizedBox(height: 6),
              if (_aiQuery == null)
                Text(
                  t('Ҷустуҷӯ ё филтри худро иваз кунед.'),
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 13.5, color: AppColors.textSoft),
                ),
              const SizedBox(height: 12),
              OutlinedButton(onPressed: _clearAll, child: Text(t('Тоза кардан'))),
            ],
          ),
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: () => _load(reset: true),
      child: ListView.separated(
        controller: _scroll,
        padding: const EdgeInsets.fromLTRB(16, 6, 16, 32),
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
    );
  }
}

class _FilterButton extends StatelessWidget {
  const _FilterButton({required this.count, required this.onTap});
  final int count;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final selected = count > 0;
    return Tooltip(
      message: t('Филтрҳо'),
      child: Material(
        color: selected ? AppColors.contractSoft : AppColors.muted,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: onTap,
          child: SizedBox(
            width: 46,
            height: 46,
            child: Stack(
              alignment: Alignment.center,
              children: [
                Icon(Icons.tune_rounded, size: 21, color: selected ? AppColors.primary : AppColors.text),
                if (selected)
                  Positioned(
                    top: 4,
                    right: 4,
                    child: Container(
                      width: 16,
                      height: 16,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
                      child: Text(
                        '$count',
                        textScaler: TextScaler.noScaling,
                        style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Colors.white),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// Филтри фаъол: бо пахш нест мешавад.
class _FilterChip extends StatelessWidget {
  const _FilterChip({required this.label, required this.onTap});
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Material(
    color: AppColors.contractSoft,
    borderRadius: BorderRadius.circular(12),
    child: InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Flexible(
              child: Text(
                label,
                style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w500, color: AppColors.primary),
              ),
            ),
            const SizedBox(width: 4),
            Icon(Icons.close_rounded, size: 15, color: AppColors.primary),
          ],
        ),
      ),
    ),
  );
}

class _SmallLink extends StatelessWidget {
  const _SmallLink({required this.icon, required this.label, required this.onTap});
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => InkWell(
    borderRadius: BorderRadius.circular(999),
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: AppColors.textSoft),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: AppColors.textSoft),
          ),
        ],
      ),
    ),
  );
}

// Корти содда: чӣ ихтисос аст, чист ва ду сатри лозимӣ — бе чипҳо ва бе рамз (рамз дар саҳифаи ихтисос аст).
class CareerCard extends StatelessWidget {
  const CareerCard({super.key, required this.career});
  final Career career;

  @override
  Widget build(BuildContext context) {
    final cluster = clusterTitle(career.clusterNumber, career.cluster);
    final study = [
      if (career.degree.isNotEmpty) offerLabel(career.degree),
      if (career.years != null) t('{n} сол', {'n': career.years}),
      if (career.universitiesCount > 0) t('{n} муассиса', {'n': career.universitiesCount}),
    ].join(' · ');
    final hasFee = career.minFee != null && career.minFee! > 0;
    return AppCard(
      onTap: () => Navigator.of(context).push(smoothRoute(CareerDetailScreen(careerId: career.id, title: career.name))),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (cluster.isNotEmpty)
            Text(
              cluster,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: AppColors.primary),
            ),
          const SizedBox(height: 3),
          Text(
            career.name,
            style: TextStyle(fontFamily: AppFonts.display, fontSize: 16.5, fontWeight: FontWeight.w700, color: AppColors.text, height: 1.25),
          ),
          if (career.description.isNotEmpty) ...[
            const SizedBox(height: 5),
            Text(
              career.description,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(fontSize: 13, color: AppColors.textSoft, height: 1.4),
            ),
          ],
          if (study.isNotEmpty) ...[const SizedBox(height: 10), Text(study, style: TextStyle(fontSize: 13, color: AppColors.textSoft))],
          if (hasFee || career.hasFreeSeats) ...[
            const SizedBox(height: 3),
            Text.rich(
              TextSpan(
                children: [
                  if (hasFee)
                    TextSpan(
                      text: t('аз {n} сомонӣ', {'n': money(career.minFee!)}),
                      style: TextStyle(fontWeight: FontWeight.w600, color: AppColors.text),
                    ),
                  if (hasFee && career.hasFreeSeats)
                    TextSpan(
                      text: ' · ',
                      style: TextStyle(color: AppColors.textSoft),
                    ),
                  if (career.hasFreeSeats)
                    TextSpan(
                      text: t('Буҷетӣ ҳаст'),
                      style: TextStyle(fontWeight: FontWeight.w600, color: AppColors.budget),
                    ),
                ],
              ),
              style: const TextStyle(fontSize: 13.5),
            ),
          ],
        ],
      ),
    );
  }
}

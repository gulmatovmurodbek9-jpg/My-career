import 'dart:async';

import 'package:flutter/material.dart';

import '../api/api.dart';
import '../app/clusters.dart';
import '../app/i18n.dart';
import '../app/theme.dart';
import '../ui/widgets.dart';

// Филтрҳои рӯйхати ихтисосҳо — ҳамонҳое, ки дар сайт ҳастанд.
class CareerFilters {
  const CareerFilters({this.grade, this.clusterId, this.clusterNumber, this.city, this.minPrice, this.maxPrice, this.freeOnly = false});

  final int? grade;
  final String? clusterId;
  final int? clusterNumber;
  final String? city;
  final int? minPrice;
  final int? maxPrice;
  final bool freeOnly;

  // Синф алоҳида ҳисоб намешавад: он интихоби доимии корбар аст.
  int get activeCount => (clusterId != null ? 1 : 0) + (city != null ? 1 : 0) + (minPrice != null || maxPrice != null ? 1 : 0) + (freeOnly ? 1 : 0);

  Map<String, String> get query => {
    if (grade != null) 'grade': '$grade',
    'clusterId': ?clusterId,
    'city': ?city,
    if (minPrice != null) 'minPrice': '$minPrice',
    if (maxPrice != null) 'maxPrice': '$maxPrice',
    if (freeOnly) 'freeSeatsOnly': 'true',
  };

  CareerFilters copy({
    int? grade,
    bool clearGrade = false,
    String? clusterId,
    int? clusterNumber,
    bool clearCluster = false,
    String? city,
    bool clearCity = false,
    int? minPrice,
    int? maxPrice,
    bool clearPrice = false,
    bool? freeOnly,
  }) => CareerFilters(
    grade: clearGrade ? null : (grade ?? this.grade),
    clusterId: clearCluster ? null : (clusterId ?? this.clusterId),
    clusterNumber: clearCluster ? null : (clusterNumber ?? this.clusterNumber),
    city: clearCity ? null : (city ?? this.city),
    minPrice: clearPrice ? null : (minPrice ?? this.minPrice),
    maxPrice: clearPrice ? null : (maxPrice ?? this.maxPrice),
    freeOnly: freeOnly ?? this.freeOnly,
  );
}

// Варақаи филтрҳо аз поён. Тугмаи поён пешакӣ мегӯяд, ки чанд ихтисос ёфт мешавад.
Future<CareerFilters?> showCareerFilters(BuildContext context, CareerFilters current, String search) => showModalBottomSheet<CareerFilters>(
  context: context,
  isScrollControlled: true,
  useSafeArea: true,
  showDragHandle: true,
  backgroundColor: AppColors.card,
  builder: (context) => _FilterSheet(initial: current, search: search),
);

class _FilterSheet extends StatefulWidget {
  const _FilterSheet({required this.initial, required this.search});
  final CareerFilters initial;
  final String search;

  @override
  State<_FilterSheet> createState() => _FilterSheetState();
}

class _FilterSheetState extends State<_FilterSheet> {
  late CareerFilters _f = widget.initial;
  late final _min = TextEditingController(text: widget.initial.minPrice?.toString() ?? '');
  late final _max = TextEditingController(text: widget.initial.maxPrice?.toString() ?? '');
  final _ids = <int, String>{};
  final _counts = <int, int>{};
  List<Map<String, dynamic>> _cities = const [];
  int? _found;
  int _request = 0;
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    _loadClusters();
    _loadCities();
    _count();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _min.dispose();
    _max.dispose();
    super.dispose();
  }

  Future<void> _loadClusters() async {
    try {
      final data = await Api.instance.get('/clusters', {if (_f.grade != null) 'grade': '${_f.grade}'});
      if (!mounted || data is! List) return;
      setState(() {
        for (final c in data) {
          final n = c['clusterId'];
          if (n is! num) continue;
          _ids[n.toInt()] = '${c['id']}';
          _counts[n.toInt()] = (c['careerCount'] as num?)?.toInt() ?? 0;
        }
      });
    } catch (_) {
      // Бе шумора ҳам рӯйхат нишон дода мешавад.
    }
  }

  Future<void> _loadCities() async {
    try {
      final data = await Api.instance.get('/universities/cities');
      if (mounted && data is List) setState(() => _cities = data.map((e) => Map<String, dynamic>.from(e)).toList());
    } catch (_) {
      // Бе рӯйхат интихоби шаҳр пинҳон мемонад.
    }
  }

  // Шумора бо таъхир, то ҳангоми навиштани нарх дархост зиёд нашавад; ҷавоби кӯҳна ҳисоб намешавад.
  void _count() {
    _debounce?.cancel();
    final request = ++_request;
    setState(() => _found = null);
    _debounce = Timer(const Duration(milliseconds: 350), () async {
      try {
        final data = await Api.instance.get('/careers', {'limit': '1', 'page': '1', if (widget.search.isNotEmpty) 'search': widget.search, ..._f.query});
        if (mounted && request == _request) setState(() => _found = (data['meta']?['total'] as num?)?.toInt());
      } catch (_) {
        // Тугма бе шумора кор мекунад.
      }
    });
  }

  void _update(CareerFilters next, {bool reloadClusters = false}) {
    setState(() => _f = next);
    if (reloadClusters) _loadClusters();
    _count();
  }

  void _onPrice() {
    int? read(String s) {
      final n = int.tryParse(s.trim());
      return n != null && n > 0 ? n : null;
    }

    var min = read(_min.text), max = read(_max.text);
    if (min != null && max != null && min > max) (min, max) = (max, min);
    _f = CareerFilters(grade: _f.grade, clusterId: _f.clusterId, clusterNumber: _f.clusterNumber, city: _f.city, minPrice: min, maxPrice: max, freeOnly: _f.freeOnly);
    _count();
  }

  void _clear() {
    _min.clear();
    _max.clear();
    _update(CareerFilters(grade: _f.grade));
  }

  Future<void> _pickCity() async {
    final picked = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      showDragHandle: true,
      backgroundColor: AppColors.card,
      builder: (context) => _CityPicker(cities: _cities, selected: _f.city),
    );
    if (picked == null) return;
    _update(picked.isEmpty ? _f.copy(clearCity: true) : _f.copy(city: picked));
  }

  TextStyle get _heading => TextStyle(fontSize: 14.5, fontWeight: FontWeight.w700, color: AppColors.text);

  @override
  Widget build(BuildContext context) {
    final found = _found;
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: ConstrainedBox(
        constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(context).height * 0.88),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(18, 0, 8, 6),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      t('Филтрҳо'),
                      style: TextStyle(fontFamily: AppFonts.display, fontSize: 19, fontWeight: FontWeight.w700, color: AppColors.text),
                    ),
                  ),
                  if (_f.activeCount > 0) TextButton(onPressed: _clear, child: Text(t('Тоза кардан'))),
                ],
              ),
            ),
            Flexible(
              child: ListView(
                shrinkWrap: true,
                padding: const EdgeInsets.fromLTRB(18, 4, 18, 12),
                children: [
                  Text(t('Баъди кадом синф?'), style: _heading),
                  const SizedBox(height: 8),
                  GradeSwitch(
                    value: _f.grade,
                    onChanged: (g) => _update(g == null ? _f.copy(clearGrade: true) : _f.copy(grade: g), reloadClusters: true),
                  ),
                  if (_f.grade != null) ...[
                    const SizedBox(height: 6),
                    Text(
                      _f.grade == 9 ? t('Баъди синфи 9 танҳо ба коллеҷ дохил шудан мумкин аст.') : t('Баъди синфи 11 — ҳам коллеҷ, ҳам донишгоҳ.'),
                      style: TextStyle(fontSize: 12.5, color: AppColors.textSoft),
                    ),
                  ],
                  const SizedBox(height: 18),
                  Text(t('Кластерҳо'), style: _heading),
                  const SizedBox(height: 8),
                  _ClusterRow(icon: Icons.apps_rounded, title: t('Ҳамаи кластерҳо'), selected: _f.clusterId == null, onTap: () => _update(_f.copy(clearCluster: true))),
                  for (final c in clusters)
                    _ClusterRow(
                      icon: c.icon,
                      title: '${c.number}. ${c.title}',
                      count: _counts[c.number],
                      selected: _f.clusterId != null && _f.clusterId == _ids[c.number],
                      onTap: _ids[c.number] == null ? null : () => _update(_f.copy(clusterId: _ids[c.number], clusterNumber: c.number)),
                    ),
                  if (_cities.isNotEmpty) ...[
                    const SizedBox(height: 18),
                    Text(t('Шаҳр'), style: _heading),
                    const SizedBox(height: 8),
                    Material(
                      color: AppColors.muted,
                      borderRadius: BorderRadius.circular(14),
                      child: InkWell(
                        borderRadius: BorderRadius.circular(14),
                        onTap: _pickCity,
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
                          child: Row(
                            children: [
                              Icon(Icons.place_outlined, size: 20, color: AppColors.primary),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(_f.city ?? t('Ҳамаи шаҳрҳо'), style: TextStyle(fontSize: 14.5, color: AppColors.text)),
                              ),
                              Icon(Icons.expand_more_rounded, color: AppColors.textSoft),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 18),
                  Text(t('Нархи таҳсил'), style: _heading),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(child: _priceField(_min, t('Аз'), '0')),
                      const SizedBox(width: 10),
                      Expanded(child: _priceField(_max, t('То'), t('бе ҳад'))),
                    ],
                  ),
                  const SizedBox(height: 5),
                  Text(t('Сомонӣ дар як сол'), style: TextStyle(fontSize: 12, color: AppColors.textSoft)),
                  const SizedBox(height: 10),
                  SwitchListTile.adaptive(
                    contentPadding: EdgeInsets.zero,
                    value: _f.freeOnly,
                    activeTrackColor: AppColors.primary,
                    title: Text(t('Танҳо бо ҷойҳои ройгон'), style: _heading),
                    onChanged: (v) => _update(_f.copy(freeOnly: v)),
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.fromLTRB(18, 10, 18, 14),
              decoration: BoxDecoration(
                border: Border(top: BorderSide(color: AppColors.border)),
              ),
              child: SafeArea(
                top: false,
                child: GradientButton(label: found == null ? t('Нишон додан') : t('Нишон додан ({n})', {'n': found}), height: 50, onPressed: () => Navigator.pop(context, _f)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _priceField(TextEditingController controller, String label, String hint) => TextField(
    controller: controller,
    keyboardType: TextInputType.number,
    maxLength: 6,
    onChanged: (_) => _onPrice(),
    style: TextStyle(fontSize: 14.5, color: AppColors.text),
    decoration: InputDecoration(counterText: '', isDense: true, labelText: label, hintText: hint, contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12)),
  );
}

class GradeSwitch extends StatelessWidget {
  const GradeSwitch({super.key, required this.value, required this.onChanged, this.short = false});
  final bool short; // «Синфи 9» — барои сатри болои рӯйхат
  final int? value;
  final void Function(int?) onChanged;

  @override
  Widget build(BuildContext context) {
    Widget item(int? grade, String label) => Expanded(
      child: Material(
        color: value == grade ? AppColors.primary : Colors.transparent,
        borderRadius: BorderRadius.circular(11),
        child: InkWell(
          borderRadius: BorderRadius.circular(11),
          onTap: () => onChanged(grade),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 10),
            child: FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                label,
                maxLines: 1,
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: value == grade ? Colors.white : AppColors.textSoft),
              ),
            ),
          ),
        ),
      ),
    );
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(color: AppColors.muted, borderRadius: BorderRadius.circular(14)),
      child: Row(
        children: [
          item(null, t('Ҳама')),
          item(9, short ? t('Синфи {n}', {'n': 9}) : t('Баъди синфи {n}', {'n': 9})),
          item(11, short ? t('Синфи {n}', {'n': 11}) : t('Баъди синфи {n}', {'n': 11})),
        ],
      ),
    );
  }
}

class _ClusterRow extends StatelessWidget {
  const _ClusterRow({required this.icon, required this.title, required this.selected, required this.onTap, this.count});
  final IconData icon;
  final String title;
  final bool selected;
  final VoidCallback? onTap;
  final int? count;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 6),
    child: Material(
      color: selected ? AppColors.contractSoft : Colors.transparent,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: BorderSide(color: selected ? AppColors.primary.withValues(alpha: 0.5) : AppColors.border),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
          child: Row(
            children: [
              Icon(icon, size: 19, color: AppColors.primary),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(fontSize: 14, fontWeight: selected ? FontWeight.w600 : FontWeight.w400, color: AppColors.text, height: 1.25),
                ),
              ),
              if (count != null) ...[const SizedBox(width: 8), Text('$count', style: TextStyle(fontSize: 13, color: AppColors.textSoft))],
              if (selected) ...[const SizedBox(width: 8), Icon(Icons.check_circle_rounded, size: 19, color: AppColors.primary)],
            ],
          ),
        ),
      ),
    ),
  );
}

// Интихоби шаҳр бо ҷустуҷӯ. Сатри холӣ маънои «Ҳамаи шаҳрҳо»-ро дорад.
class _CityPicker extends StatefulWidget {
  const _CityPicker({required this.cities, required this.selected});
  final List<Map<String, dynamic>> cities;
  final String? selected;

  @override
  State<_CityPicker> createState() => _CityPickerState();
}

class _CityPickerState extends State<_CityPicker> {
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final q = _query.trim().toLowerCase();
    final list = widget.cities.where((c) => q.isEmpty || '${c['city']}'.toLowerCase().contains(q)).toList();
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: SizedBox(
        height: MediaQuery.sizeOf(context).height * 0.7,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
              child: TextField(
                onChanged: (v) => setState(() => _query = v),
                style: TextStyle(fontSize: 14.5, color: AppColors.text),
                decoration: InputDecoration(isDense: true, hintText: t('Ҷустуҷӯи шаҳр...'), prefixIcon: const Icon(Icons.search_rounded, size: 21)),
              ),
            ),
            Expanded(
              child: list.isEmpty
                  ? Center(
                      child: Text(t('Шаҳр ёфт нашуд'), style: TextStyle(fontSize: 14, color: AppColors.textSoft)),
                    )
                  : ListView(
                      children: [
                        if (q.isEmpty)
                          ListTile(
                            title: Text(t('Ҳамаи шаҳрҳо'), style: TextStyle(fontSize: 14.5, color: AppColors.text)),
                            trailing: widget.selected == null ? Icon(Icons.check_rounded, color: AppColors.primary) : null,
                            onTap: () => Navigator.pop(context, ''),
                          ),
                        for (final c in list)
                          ListTile(
                            title: Text('${c['city']}', style: TextStyle(fontSize: 14.5, color: AppColors.text)),
                            subtitle: Text(t('{n} муассиса', {'n': c['count']}), style: TextStyle(fontSize: 12, color: AppColors.textSoft)),
                            trailing: widget.selected == c['city'] ? Icon(Icons.check_rounded, color: AppColors.primary) : null,
                            onTap: () => Navigator.pop(context, '${c['city']}'),
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

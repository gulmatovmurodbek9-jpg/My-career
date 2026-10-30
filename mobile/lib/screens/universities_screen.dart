import 'package:flutter/material.dart';

import '../api/api.dart';
import '../api/models.dart';
import '../app/theme.dart';
import '../ui/widgets.dart';
import 'university_detail_screen.dart';

// 128 муассиса: як бор бор мешаванд, ҷустуҷӯ ва филтр дар худи телефон (тез).
class UniversitiesScreen extends StatefulWidget {
  const UniversitiesScreen({super.key});

  @override
  State<UniversitiesScreen> createState() => _UniversitiesScreenState();
}

class _UniversitiesScreenState extends State<UniversitiesScreen> {
  final _search = TextEditingController();
  List<University>? _all;
  String? _error;
  String _city = '';
  String _kind = 'all'; // all | higher | college

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
      final data = await Api.instance.get('/universities');
      final list = (data as List).map((e) => University.fromJson(Map<String, dynamic>.from(e))).toList()
        ..sort((a, b) => b.careerCount.compareTo(a.careerCount));
      setState(() => _all = list);
    } catch (e) {
      setState(() => _error = e.toString());
    }
  }

  List<University> get _shown {
    final q = _search.text.trim().toLowerCase();
    return (_all ?? []).where((u) {
      if (_city.isNotEmpty && u.city != _city) return false;
      if (_kind == 'college' && !u.isCollege) return false;
      if (_kind == 'higher' && u.isCollege) return false;
      return q.isEmpty || u.name.toLowerCase().contains(q) || u.city.toLowerCase().contains(q);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final cities = <String>{for (final u in _all ?? <University>[]) if (u.city.isNotEmpty) u.city}.toList()..sort();
    final shown = _shown;
    return Scaffold(
      appBar: AppBar(title: const Text('Донишгоҳҳо')),
      body: SafeArea(
        child: _error != null
            ? ErrorView(message: _error!, onRetry: _load)
            : _all == null
                ? const LoadingView()
                : ListView(
                    padding: const EdgeInsets.fromLTRB(20, 4, 20, 32),
                    children: [
                      TextField(
                        controller: _search,
                        onChanged: (_) => setState(() {}),
                        style: const TextStyle(fontSize: 16.5),
                        decoration: const InputDecoration(hintText: 'Номи донишгоҳ ё шаҳр', prefixIcon: Icon(Icons.search_rounded, size: 26)),
                      ),
                      const SizedBox(height: 12),
                      Row(children: [
                        for (final k in const [['all', 'Ҳама'], ['higher', 'Донишгоҳ'], ['college', 'Коллеҷ']]) ...[
                          Expanded(child: _Segment(label: k[1], selected: _kind == k[0], onTap: () => setState(() => _kind = k[0]))),
                          if (k[0] != 'college') const SizedBox(width: 8),
                        ],
                      ]),
                      const SizedBox(height: 12),
                      DropdownButtonFormField<String>(
                        initialValue: _city,
                        isExpanded: true,
                        iconSize: 26,
                        style: const TextStyle(fontSize: 16.5, color: AppColors.text),
                        decoration: const InputDecoration(prefixIcon: Icon(Icons.location_city_rounded, size: 28)),
                        items: [
                          const DropdownMenuItem(value: '', child: Text('Ҳамаи шаҳрҳо')),
                          for (final c in cities) DropdownMenuItem(value: c, child: Text(c)),
                        ],
                        onChanged: (v) => setState(() => _city = v ?? ''),
                      ),
                      const SizedBox(height: 12),
                      Text('Ёфт шуд: ${shown.length}', style: text.bodyMedium),
                      const SizedBox(height: 10),
                      if (shown.isEmpty)
                        Padding(padding: const EdgeInsets.all(20), child: Text('Чизе ёфт нашуд.', textAlign: TextAlign.center, style: text.bodyLarge))
                      else
                        for (final u in shown) ...[
                          _UniversityCard(university: u),
                          const SizedBox(height: 12),
                        ],
                    ],
                  ),
      ),
    );
  }
}

class _Segment extends StatelessWidget {
  const _Segment({required this.label, required this.selected, required this.onTap});
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Semantics(
        button: true,
        selected: selected,
        child: Material(
          color: selected ? AppColors.primary : Colors.white,
          borderRadius: BorderRadius.circular(14),
          child: InkWell(
            borderRadius: BorderRadius.circular(14),
            onTap: onTap,
            child: Container(
              height: 54,
              alignment: Alignment.center,
              decoration: BoxDecoration(borderRadius: BorderRadius.circular(14), border: Border.all(color: selected ? AppColors.primary : AppColors.border, width: 2)),
              child: FittedBox(child: Padding(padding: const EdgeInsets.symmetric(horizontal: 6), child: Text(label, style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: selected ? Colors.white : AppColors.text)))),
            ),
          ),
        ),
      );
}

class _UniversityCard extends StatelessWidget {
  const _UniversityCard({required this.university});
  final University university;

  @override
  Widget build(BuildContext context) {
    final u = university;
    return AppCard(
      onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => UniversityDetailScreen(universityId: u.id, title: u.name))),
      child: Row(children: [
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(u.name, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            Wrap(spacing: 8, runSpacing: 8, children: [
              if (u.city.isNotEmpty) Badge2(u.city, color: AppColors.textSoft, background: const Color(0xFFF1F5F9)),
              Badge2('${u.careerCount} ихтисос'),
              if (!u.isState) const Badge2('Ғайридавлатӣ', color: Color(0xFFB45309), background: Color(0xFFFEF3C7)),
            ]),
          ]),
        ),
        const Icon(Icons.chevron_right_rounded, size: 26, color: AppColors.textSoft),
      ]),
    );
  }
}

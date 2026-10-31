// Моделҳои маълумот аз API. Ҳар майдон ихтиёрӣ хонда мешавад, то майдони холӣ барномаро наафтонад.

String _str(dynamic v) => v == null ? '' : v.toString();

// «Бизнес-идора (ФМТДМТБваДТТ)» → «Бизнес-идора»: рамзи дохилии муассиса ба корбар маъно надорад.
String cleanName(String name) => name.replaceAll(RegExp(r'\s*\((?=[^)]*[А-ЯЁҲҶҚҒӢӮ]{4})[^)]*\)'), '').trim();
int? _int(dynamic v) => v is num ? v.toInt() : int.tryParse(_str(v));

class Career {
  Career.fromJson(Map<String, dynamic> j)
    : id = _str(j['id']),
      // Дар русӣ ва англисӣ сервер номи тарҷумашударо дар nameTranslated медиҳад.
      name = cleanName(_str(j['nameTranslated']).isNotEmpty ? _str(j['nameTranslated']) : _str(j['name'])),
      nameTj = _str(j['name']),
      code = _str(j['code']),
      cluster = j['cluster'] is Map ? _str(j['cluster']['clusterName']) : '',
      clusterNumber = _int(j['mmtCluster']),
      description = _str(j['description']),
      purpose = _str(j['purpose']),
      hasFreeSeats = j['hasFreeSeats'] == true,
      contentWritten = j['contentWritten'] == true,
      minFee = _int(j['minTuitionFee']),
      years = _int(j['durationYears']),
      degree = _str(j['degreeType']),
      likes = _int(j['likesCount']) ?? 0,
      universitiesCount = j['universities'] is List ? (j['universities'] as List).length : 0,
      salary = j['salaryAndMarket'] is Map ? Map<String, dynamic>.from(j['salaryAndMarket']) : const {},
      jobs = _strings(j['careerOpportunities']),
      technicalSkills = j['skills'] is Map ? _strings(j['skills']['technical']) : const [],
      softSkills = j['skills'] is Map ? _strings(j['skills']['soft']) : const [],
      technologies = _strings(j['technologies']),
      projects = _strings(j['projectsExamples']),
      certificates = _strings(j['certification']),
      books = j['learningResources'] is Map ? _strings(j['learningResources']['books']) : const [],
      courses = j['learningResources'] is Map ? _strings(j['learningResources']['courses']) : const [],
      blogs = j['learningResources'] is Map ? _strings(j['learningResources']['blogs']) : const [],
      related = _strings(j['relatedSpecializations']),
      advice = _str(j['advice']);

  final String id;
  final String name;
  final String nameTj;
  final String code;
  final String cluster;
  final int? clusterNumber;
  final String description;
  final String purpose;
  final bool hasFreeSeats;
  final bool contentWritten;
  final int? minFee;
  final int? years;
  final String degree;
  final int likes;
  final int universitiesCount;
  final Map<String, dynamic> salary;
  final List<String> jobs;
  final List<String> technicalSkills;
  final List<String> softSkills;
  final List<String> technologies;
  final List<String> projects;
  final List<String> certificates;
  final List<String> books;
  final List<String> courses;
  final List<String> blogs;
  final List<String> related;
  final String advice;
}

List<String> _strings(dynamic v) => v is List ? v.map(_str).map((s) => s.trim()).where((s) => s.isNotEmpty).toList() : const [];

class Offering {
  Offering.fromJson(Map<String, dynamic> j)
    : id = _str(j['id']),
      free = j['paymentType'] == 'ройгон',
      fee = _int(j['tuitionFee']),
      seats = _int(j['seats']),
      studyForm = _str(j['studyForm']),
      language = _str(j['language']),
      universityId = j['university'] is Map ? _str(j['university']['id']) : '',
      universityName = j['university'] is Map ? (_str(j['university']['nameTranslated']).isNotEmpty ? _str(j['university']['nameTranslated']) : _str(j['university']['name'])) : '',
      city = j['university'] is Map ? _str(j['university']['city']) : '',
      isState = j['university'] is Map ? j['university']['isState'] != false : true;

  final String id;
  final bool free;
  final int? fee;
  final int? seats;
  final String studyForm;
  final String language;
  final String universityId;
  final String universityName;
  final String city;
  final bool isState;
}

class University {
  University.fromJson(Map<String, dynamic> j)
    : id = _str(j['id']),
      name = _str(j['name']),
      city = _str(j['city']),
      address = _str(j['address']),
      type = _str(j['institutionType']),
      isState = j['isState'] == true,
      website = _str(j['website']),
      description = _str(j['description']),
      careerCount = _int(j['careerCount']) ?? 0,
      lat = j['latitude'] is num ? (j['latitude'] as num).toDouble() : double.tryParse(_str(j['latitude'])),
      lng = j['longitude'] is num ? (j['longitude'] as num).toDouble() : double.tryParse(_str(j['longitude']));

  final String id;
  final String name;
  final String city;
  final String address;
  final String type;
  final bool isState;
  final String website;
  final String description;
  final int careerCount;
  final double? lat;
  final double? lng;

  bool get isCollege => name.toLowerCase().contains('коллеҷ');
}

class QuizOption {
  QuizOption(this.text, this.value);
  final String text;
  final String value; // рақами вариант ("0"…) ё кластер ("c2") дар саволи «баробар»
}

class QuizQuestion {
  QuizQuestion({required this.id, required this.text, required this.options, this.part = 'mmt'});

  factory QuizQuestion.fromJson(Map<String, dynamic> j) {
    final options = (j['options'] as List? ?? []).asMap().entries.map((e) {
      final o = e.value as Map;
      final text = o['text'] is Map ? _str(o['text']['tj']) : _str(o['text']);
      return QuizOption(text, '${e.key}');
    }).toList();
    final q = j['question'];
    return QuizQuestion(id: _str(j['id']), text: q is Map ? _str(q['tj']) : _str(q), options: options, part: _str(j['part']));
  }

  final String id;
  final String text;
  final List<QuizOption> options;
  final String part;
}

class MatchedCareer {
  MatchedCareer.fromJson(Map<String, dynamic> j)
    : id = _str(j['id']),
      name = cleanName(_str(j['name'])),
      percent = _int(j['matchPercentage']) ?? 0,
      free = j['free'] == true,
      reasons = j['reasons'] is List ? (j['reasons'] as List).map(_str).toList() : const [];

  final String id;
  final String name;
  final int percent;
  final bool free;
  final List<String> reasons;
}

class QuizResult {
  QuizResult.fromJson(Map<String, dynamic> j)
    : clusterName = j['topCluster'] is Map ? _str(j['topCluster']['clusterName']) : '',
      clusterPercent = j['topCluster'] is Map ? (_int(j['topCluster']['averageMatch']) ?? 0) : 0,
      careers = j['topCluster'] is Map && j['topCluster']['specializations'] is List
          ? (j['topCluster']['specializations'] as List).map((e) => MatchedCareer.fromJson(Map<String, dynamic>.from(e))).toList()
          : const [],
      directions = j['allMatches'] is List
          ? (j['allMatches'] as List).map((e) => MapEntry(_str(e['clusterName']), ((e['score'] is num ? e['score'] as num : 0) / 40 * 100).round())).toList()
          : const [];

  final String clusterName;
  final int clusterPercent;
  final List<MatchedCareer> careers;
  final List<MapEntry<String, int>> directions;
}

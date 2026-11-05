// Фанҳои мактаб: ҳамон рӯйхати сайт (Front/src/lib/quizContext.js).
const schoolSubjects = <String, Map<String, String>>{
  'math': {'tj': 'Математика', 'ru': 'Математика', 'en': 'Maths'},
  'physics': {'tj': 'Физика', 'ru': 'Физика', 'en': 'Physics'},
  'chemistry': {'tj': 'Химия', 'ru': 'Химия', 'en': 'Chemistry'},
  'biology': {'tj': 'Биология', 'ru': 'Биология', 'en': 'Biology'},
  'geography': {'tj': 'География', 'ru': 'География', 'en': 'Geography'},
  'history': {'tj': 'Таърих', 'ru': 'История', 'en': 'History'},
  'language': {'tj': 'Забон ва адабиёт', 'ru': 'Язык и литература', 'en': 'Language & literature'},
  'foreign': {'tj': 'Забони хориҷӣ', 'ru': 'Иностранный язык', 'en': 'Foreign language'},
};

// Фанҳое, ки барои ҳар кластери ММТ асосӣ ҳастанд (имтиҳон ва таҳсил).
const clusterSubjects = <int, List<String>>{
  1: ['math', 'physics'],
  2: ['math', 'geography'],
  3: ['language', 'foreign', 'history'],
  4: ['history', 'language'],
  5: ['biology', 'chemistry'],
};

String subjectName(String key, String lang) => schoolSubjects[key]?[lang] ?? schoolSubjects[key]?['tj'] ?? key;

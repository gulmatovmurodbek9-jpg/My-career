import 'package:flutter/material.dart';

import 'settings.dart';

// 5 кластери ММТ. Ном ва тавсиф — айнан аз сайт (career_page.cl_N ва cl_N_desc),
// мақсад — аз сервер (/clusters), тарҷумаи русӣ ва англисӣ дар ин ҷо.
// Шумораи ихтисосҳо ва id аз сервер меояд; рақамҳои ин ҷо танҳо барои вақте ки интернет нест.
class ClusterInfo {
  const ClusterInfo({required this.number, required this.icon, required this.color, required this.count, required this.name, required this.description, required this.purpose});

  final int number;
  final IconData icon;
  final Color color;
  final int count;
  final Map<String, String> name;
  final Map<String, String> description;
  final Map<String, String> purpose;

  String get title => name[appSettings.lang] ?? name['tj']!;
  String get about => description[appSettings.lang] ?? description['tj']!;
  String get goal => purpose[appSettings.lang] ?? purpose['tj']!;
}

const clusters = [
  ClusterInfo(
    number: 1,
    icon: Icons.memory_rounded,
    color: Color(0xFF2563EB),
    count: 351,
    name: {'tj': 'Табиӣ ва техникӣ', 'ru': 'Естественные и технические науки', 'en': 'Natural and technical sciences'},
    description: {
      'tj': 'Барномасозӣ, муҳандисӣ, энергетика, сохтмон, нақлиёт ва технологияҳои иттилоотӣ. Барои онҳое, ки бо рақам, схема ва техника кор кардан меписанданд.',
      'ru': 'Программирование, инженерия, энергетика, строительство, транспорт и информационные технологии. Для тех, кто любит работать с числами, схемами и техникой.',
      'en': 'Programming, engineering, energy, construction, transport and information technology. For those who like working with numbers, diagrams and machines.',
    },
    purpose: {
      'tj': 'Тайёр кардани муҳандисон ва мутахассисони техникӣ, ки инфрасохтор ва иқтисоди рақамии кишварро месозанд ва нигоҳ медоранд.',
      'ru': 'Подготовка инженеров и технических специалистов, которые создают и поддерживают инфраструктуру и цифровую экономику страны.',
      'en': "Training engineers and technical specialists who build and maintain the country's infrastructure and digital economy.",
    },
  ),
  ClusterInfo(
    number: 2,
    icon: Icons.trending_up_rounded,
    color: Color(0xFF059669),
    count: 172,
    name: {'tj': 'Иқтисод ва география', 'ru': 'Экономика и география', 'en': 'Economics and geography'},
    description: {
      'tj': 'Молия, баҳисобгирӣ, менеҷмент, савдо, сайёҳӣ ва география. Барои онҳое, ки таҳлил, банақшагирӣ ва кор бо одамону рақамҳоро дӯст медоранд.',
      'ru': 'Финансы, бухгалтерский учёт, менеджмент, торговля, туризм и география. Для тех, кто любит анализ, планирование и работу с людьми и цифрами.',
      'en': 'Finance, accounting, management, trade, tourism and geography. For those who enjoy analysis, planning and working with people and figures.',
    },
    purpose: {
      'tj': 'Тайёр кардани иқтисодчиён ва менеҷерон, ки метавонанд захираҳоро самаранок идора кунанд ва тиҷорат ташкил намоянд.',
      'ru': 'Подготовка экономистов и менеджеров, которые умеют эффективно управлять ресурсами и организовывать бизнес.',
      'en': 'Training economists and managers who can manage resources effectively and build a business.',
    },
  ),
  ClusterInfo(
    number: 3,
    icon: Icons.palette_rounded,
    color: Color(0xFF7C3AED),
    count: 177,
    name: {'tj': 'Филология, педагогика ва санъат', 'ru': 'Филология, педагогика и искусство', 'en': 'Philology, pedagogy and arts'},
    description: {
      'tj': 'Забонҳо, адабиёт, омӯзгорӣ, мусиқӣ, дизайн ва ҳунар. Барои онҳое, ки бо калима, эҷод ва одамон кор кардан мехоҳанд.',
      'ru': 'Языки, литература, преподавание, музыка, дизайн и ремесло. Для тех, кто хочет работать со словом, творчеством и людьми.',
      'en': 'Languages, literature, teaching, music, design and craft. For those who want to work with words, creativity and people.',
    },
    purpose: {
      'tj': 'Тайёр кардани омӯзгорон, филологҳо ва аҳли ҳунар, ки насли оянда ва фарҳанги миллиро ташаккул медиҳанд.',
      'ru': 'Подготовка учителей, филологов и людей искусства, которые формируют будущее поколение и национальную культуру.',
      'en': 'Training teachers, philologists and artists who shape the next generation and the national culture.',
    },
  ),
  ClusterInfo(
    number: 4,
    icon: Icons.balance_rounded,
    color: Color(0xFFD97706),
    count: 76,
    name: {'tj': 'Ҷомеашиносӣ ва ҳуқуқ', 'ru': 'Обществознание и право', 'en': 'Social sciences and law'},
    description: {
      'tj': 'Ҳуқуқшиносӣ, сиёсатшиносӣ, журналистика, кори иҷтимоӣ ва муносибатҳои байналмилалӣ. Барои онҳое, ки адолат, ҷомеа ва муошират барояшон муҳим аст.',
      'ru': 'Юриспруденция, политология, журналистика, социальная работа и международные отношения. Для тех, кому важны справедливость, общество и общение.',
      'en': 'Law, political science, journalism, social work and international relations. For those who care about justice, society and communication.',
    },
    purpose: {
      'tj': 'Тайёр кардани ҳуқуқшиносон ва мутахассисони соҳаи ҷамъиятӣ, ки ҳуқуқи шаҳрвандон ва тартиби ҳуқуқиро ҳифз мекунанд.',
      'ru': 'Подготовка юристов и специалистов общественной сферы, которые защищают права граждан и правопорядок.',
      'en': "Training lawyers and public-sector specialists who protect citizens' rights and the rule of law.",
    },
  ),
  ClusterInfo(
    number: 5,
    icon: Icons.monitor_heart_rounded,
    color: Color(0xFFE11D48),
    count: 108,
    name: {'tj': 'Тиб, биология ва варзиш', 'ru': 'Медицина, биология и спорт', 'en': 'Medicine, biology and sport'},
    description: {
      'tj': 'Табобат, дорусозӣ, ҳамширагӣ, биология, экология ва тарбияи ҷисмонӣ. Барои онҳое, ки ба саломатии инсон ва табиати зинда шавқ доранд.',
      'ru': 'Лечение, фармация, сестринское дело, биология, экология и физическое воспитание. Для тех, кому интересны здоровье человека и живая природа.',
      'en': 'Treatment, pharmacy, nursing, biology, ecology and physical education. For those drawn to human health and the living world.',
    },
    purpose: {
      'tj': 'Тайёр кардани кормандони тиб ва мутахассисони соҳаи саломатӣ, ки ҳаёт ва тандурустии мардумро ҳифз мекунанд.',
      'ru': 'Подготовка медицинских работников и специалистов здравоохранения, которые берегут жизнь и здоровье людей.',
      'en': "Training medical workers and healthcare specialists who protect people's lives and health.",
    },
  ),
];

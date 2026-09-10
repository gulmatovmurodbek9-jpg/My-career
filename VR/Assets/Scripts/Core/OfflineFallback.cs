using System.Collections.Generic;

namespace IhtisosiMan.Core
{
    /// <summary>
    /// Захираи офлайн — он чизе, ки саҳна ҳангоми набудани сервер нишон медиҳад.
    ///
    /// ЧАРО ИН ҲАСТ:
    /// Дар толори фестивал Wi-Fi ё нест, ё чунон банд аст, ки дархост
    /// намегузарад. Барнома набояд ин ҷо истад. Меҳмон набояд ҳатто фаҳмад,
    /// ки чизе нашуд — ӯ шарҳро мебинад ва таҷриба давом мекунад.
    ///
    /// Матнҳо ҳамон матнҳои `VrService.staticExplanation()` дар backend-анд,
    /// то ду роҳ як хел садо диҳанд.
    ///
    /// БАЪДТАР (рӯзи 19 аз нақша): ин ҷо шарҳҳои пешакӣ бо AI тавлидшуда
    /// барои 10 профили маъмул гузошта мешаванд — ҷавоби «ҳақиқӣ»-и офлайн.
    /// Ҳозир матни устувори кластерӣ кофист.
    /// </summary>
    public static class OfflineFallback
    {
        /// <summary>Номи панҷ кластер — ҳамон тартиб, ки дар база.</summary>
        private static readonly Dictionary<int, string> ClusterNamesTj = new Dictionary<int, string>
        {
            { 1, "Табиӣ ва техникӣ" },
            { 2, "Иқтисод ва география" },
            { 3, "Филология ва санъат" },
            { 4, "Ҷомеашиносӣ ва ҳуқуқ" },
            { 5, "Тиб ва варзиш" },
        };

        private static readonly Dictionary<int, string> ClusterNamesRu = new Dictionary<int, string>
        {
            { 1, "Естественно-техническое" },
            { 2, "Экономика и география" },
            { 3, "Филология и искусство" },
            { 4, "Обществознание и право" },
            { 5, "Медицина и спорт" },
        };

        private static readonly Dictionary<int, string> ClusterNamesEn = new Dictionary<int, string>
        {
            { 1, "Science & Engineering" },
            { 2, "Economics & Geography" },
            { 3, "Languages & Arts" },
            { 4, "Social Studies & Law" },
            { 5, "Medicine & Sports" },
        };

        public static string ClusterName(int clusterNumber, string lang)
        {
            var table = lang == "ru" ? ClusterNamesRu
                      : lang == "en" ? ClusterNamesEn
                      : ClusterNamesTj;

            return table.TryGetValue(clusterNumber, out var name) ? name : string.Empty;
        }

        /// <summary>Матни шарҳ — ҳамон формулаи `staticExplanation()`-и backend.</summary>
        public static string Explanation(int clusterNumber, string lang)
        {
            var name = ClusterName(clusterNumber, lang);

            if (lang == "en")
            {
                return string.IsNullOrEmpty(name)
                    ? "Your answers have been recorded. Take a closer look at the specialties below."
                    : $"Your answers point most strongly toward {name}. The specialties below match that profile — take a closer look at them.";
            }

            if (lang == "ru")
            {
                return string.IsNullOrEmpty(name)
                    ? "Твои ответы записаны. Присмотрись к специальностям ниже."
                    : $"Твои ответы сильнее всего указывают на направление «{name}». Специальности ниже подходят этому профилю — присмотрись к ним.";
            }

            return string.IsNullOrEmpty(name)
                ? "Ҷавобҳои ту сабт шуданд. Ба ихтисосҳои поён назар кун."
                : $"Ҷавобҳои ту бештар ба самти «{name}» ишора мекунанд. Ихтисосҳои поён ба ин профил мувофиқанд — ба онҳо назар кун.";
        }

        /// <summary>Ҷавоби Сино, вақте ки маълумот нест — тахмин намекунад.</summary>
        public static string UnknownAnswer(string lang)
        {
            if (lang == "en") return "I don't know that for sure, and I won't guess. You can find the up-to-date details on our website.";
            if (lang == "ru") return "Этого я точно не знаю и придумывать не стану. Точные данные есть на нашем сайте.";
            return "Инро ман дақиқ намедонам ва тахмин намекунам. Маълумоти дақиқ дар вебсайти мо ҳаст.";
        }

        /// <summary>
        /// Ҷавоби пурраи офлайн барои пардаи 4 ва 10.
        ///
        /// Касбҳо холианд: рӯйхати воқеӣ танҳо дар база ҳаст ва сохтани ном
        /// манъ аст. Саҳна дар ин ҳолат профил ва шарҳро нишон медиҳад, вале
        /// кортҳои касбро не — ин аз номи сохта беҳтар аст.
        /// </summary>
        public static VrExplainResponse ExplainResponse(ClusterScores scores, string lang)
        {
            var top = scores?.TopClusterNumber() ?? 1;

            var profile = new VrProfileEntry[5];
            for (var i = 0; i < 5; i++)
            {
                var number = i + 1;
                profile[i] = new VrProfileEntry
                {
                    number = number,
                    name = ClusterName(number, lang),
                    score = scores?[number] ?? 0f,
                };
            }

            return new VrExplainResponse
            {
                cluster = new VrClusterInfo
                {
                    number = top,
                    name = ClusterName(top, lang),
                },
                scores = scores ?? new ClusterScores(),
                profile = profile,
                matchPercentage = scores?.MatchPercentage() ?? 0,
                careers = new VrCareer[0],
                explanation = Explanation(top, lang),
                source = "offline",
            };
        }

        public static VrAskResponse AskResponse(string lang)
        {
            return new VrAskResponse { answer = UnknownAnswer(lang), source = "offline" };
        }

        public static VrMapResponse MapResponse()
        {
            return new VrMapResponse { total = 0, nearest = null, points = new VrUniversity[0] };
        }
    }
}

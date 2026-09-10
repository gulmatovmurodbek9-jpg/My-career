using System;
using System.Collections.Generic;

namespace IhtisosiMan.Core
{
    /// <summary>
    /// Моделҳои саволҳо — акси дақиқи `Back/nest-backend/src/quiz/data/questions.ts`.
    ///
    /// Ҳамаи майдонҳо ҳамон номро доранд, ки дар JSON ҳастанд, зеро
    /// <c>JsonUtility</c>-и Unity танҳо аз рӯи ном мехонад ва атрибути
    /// иваз кардани номро намефаҳмад.
    ///
    /// Файли JSON-ро скрипти `npm run export:vr` месозад — онро дастӣ
    /// тағйир надиҳед, вагарна айнак ва вебсайт натиҷаи гуногун медиҳанд.
    /// </summary>
    [Serializable]
    public class LocalizedText
    {
        public string tj;
        public string ru;
        public string en;

        /// <summary>Матн бо забони интихобшуда; агар набошад — тоҷикӣ.</summary>
        public string Get(string lang)
        {
            switch (lang)
            {
                case "ru": return string.IsNullOrEmpty(ru) ? tj : ru;
                case "en": return string.IsNullOrEmpty(en) ? tj : en;
                default: return tj;
            }
        }
    }

    /// <summary>
    /// Холи як вариант барои панҷ кластер.
    ///
    /// Ҳар панҷ майдон ҳамеша дар JSON ҳастанд (скрипти содирот онҳоро пур
    /// мекунад), зеро <c>JsonUtility</c> майдони набударо аз сифр фарқ карда
    /// наметавонад.
    ///
    /// Навъ <c>float</c> аст, на <c>int</c>: дар маълумоти ҳозира ҳамаи холҳо
    /// бутунанд, вале агар рӯзе холи касрӣ илова шавад, <c>int</c> онро
    /// бесадо мебурид ва профили айнак аз профили сайт фарқ мекард.
    /// </summary>
    [Serializable]
    public class ClusterScores
    {
        public float c1;
        public float c2;
        public float c3;
        public float c4;
        public float c5;

        public ClusterScores() { }

        public ClusterScores(float c1, float c2, float c3, float c4, float c5)
        {
            this.c1 = c1;
            this.c2 = c2;
            this.c3 = c3;
            this.c4 = c4;
            this.c5 = c5;
        }

        /// <summary>Ҳадди аксари холи як кластер — 10 саволи MMT × 4 хол.</summary>
        public const float MaxScore = 40f;

        public float this[int clusterNumber]
        {
            get
            {
                switch (clusterNumber)
                {
                    case 1: return c1;
                    case 2: return c2;
                    case 3: return c3;
                    case 4: return c4;
                    case 5: return c5;
                    default: return 0f;
                }
            }
        }

        public void Add(ClusterScores other)
        {
            if (other == null) return;

            c1 += other.c1;
            c2 += other.c2;
            c3 += other.c3;
            c4 += other.c4;
            c5 += other.c5;
        }

        /// <summary>Рақами кластери пешбар (1..5). Ҳангоми баробарӣ хурдтарин.</summary>
        public int TopClusterNumber()
        {
            var top = 1;
            var best = c1;

            if (c2 > best) { best = c2; top = 2; }
            if (c3 > best) { best = c3; top = 3; }
            if (c4 > best) { best = c4; top = 4; }
            if (c5 > best) { best = c5; top = 5; }

            return top;
        }

        /// <summary>Фоизи мувофиқат, ҳамон формулаи `career.service.ts`.</summary>
        public int MatchPercentage()
        {
            var top = this[TopClusterNumber()];
            return Math.Min(100, (int)Math.Round(top / MaxScore * 100f, MidpointRounding.AwayFromZero));
        }

        public override string ToString()
        {
            return $"c1={c1} c2={c2} c3={c3} c4={c4} c5={c5}";
        }
    }

    [Serializable]
    public class QuizOption
    {
        public LocalizedText text;
        public ClusterScores scores;
        public string[] keywords;
    }

    [Serializable]
    public class QuizQuestion
    {
        public string id;

        /// <summary>"mmt" | "motivation" | "specialty"</summary>
        public string part;

        /// <summary>"scenario" | "motivation" | "environment" | "refinement"</summary>
        public string type;

        /// <summary>"c1".."c5" барои саволҳои ихтисос; вагарна холӣ.</summary>
        public string targetCluster;

        public LocalizedText question;
        public QuizOption[] options;
    }

    /// <summary>
    /// Реша дар `vr-questions.json`.
    ///
    /// <c>JsonUtility</c> массиви болоиро намехонад, аз ин рӯ саволҳо дар
    /// объекти печонда мераванд.
    /// </summary>
    [Serializable]
    public class QuizQuestionSet
    {
        public QuizQuestion[] questions;

        public QuizQuestion Find(string id)
        {
            if (questions == null || string.IsNullOrEmpty(id)) return null;

            for (var i = 0; i < questions.Length; i++)
            {
                if (questions[i] != null && questions[i].id == id) return questions[i];
            }
            return null;
        }

        public List<QuizQuestion> OfPart(string part)
        {
            var result = new List<QuizQuestion>();
            if (questions == null) return result;

            foreach (var q in questions)
            {
                if (q != null && q.part == part) result.Add(q);
            }
            return result;
        }
    }

    /// <summary>Як ҷавоби корбар.</summary>
    [Serializable]
    public class QuizAnswer
    {
        public string questionId;

        /// <summary>
        /// Индекси варианти интихобшуда ҳамчун сатр.
        ///
        /// Сатр аст, на <c>int</c>, зеро backend майдони <c>any</c> қабул
        /// мекунад ва ҳисоб бояд ҳамон рафтори JavaScript-ро такрор кунад —
        /// ниг. <see cref="ScoreCalculator"/>.
        /// </summary>
        public string selectedValue;

        public QuizAnswer() { }

        public QuizAnswer(string questionId, int selectedValue)
        {
            this.questionId = questionId;
            this.selectedValue = selectedValue.ToString(System.Globalization.CultureInfo.InvariantCulture);
        }

        public QuizAnswer(string questionId, string selectedValue)
        {
            this.questionId = questionId;
            this.selectedValue = selectedValue;
        }
    }

    /// <summary>
    /// Натиҷаи ҳисоб — акси `UserScores`-и backend.
    /// </summary>
    public class UserScores
    {
        public ClusterScores MmtClusters = new ClusterScores();
        public Dictionary<string, string> Motivation = new Dictionary<string, string>();
        public List<string> SpecialtyKeywords = new List<string>();
    }
}

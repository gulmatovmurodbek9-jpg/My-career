using System.Globalization;
using System.Collections.Generic;

namespace IhtisosiMan.Core
{
    /// <summary>
    /// Ҳисоби профили касбӣ дар айнак.
    ///
    /// Ин порти дақиқи <c>QuizService.calculateScores()</c> аз
    /// `Back/nest-backend/src/quiz/quiz.service.ts` аст.
    ///
    /// ЧАРО ДАР C#, НА ДАР СЕРВЕР:
    /// Талаби ТЗ мегӯяд, ки профил бо коди лоиҳа ҳисоб шавад, на бо AI. Ва
    /// демои фестивал бояд бе интернет кор кунад — дар толор Wi-Fi ҳамеша
    /// хиёнат мекунад. Аз ин рӯ ҳисоб дар худи айнак иҷро мешавад, ва сервер
    /// танҳо натиҷаро мефаҳмонад (`POST /vr/explain`).
    ///
    /// ЯГОНАГӢ БО BACKEND:
    /// Ҳар тағйири ин файл бояд бо тести <c>ScoreCalculatorTests</c> санҷида
    /// шавад — он натиҷаро бо векторҳои `vr-golden.json` муқоиса мекунад, ки
    /// худи backend онҳоро сохтааст. Агар айнак ва сайт ба як корбар ду
    /// профили гуногун диҳанд, тамоми эътимоди лоиҳа мешиканад.
    /// </summary>
    public static class ScoreCalculator
    {
        public const string PartMmt = "mmt";
        public const string PartMotivation = "motivation";
        public const string PartSpecialty = "specialty";

        /// <summary>
        /// Ҷавобҳо → профил.
        ///
        /// Рафтори ҳолатҳои канорӣ ҳамон аст, ки дар TypeScript:
        /// саволи номаълум бесадо партофта мешавад, индекси нодуруст ҳамчун
        /// «вариант интихоб нашуд» ҳисоб мешавад, ҷавоби такрорӣ ду бор
        /// ҷамъ мешавад.
        /// </summary>
        public static UserScores Calculate(IList<QuizAnswer> answers, QuizQuestionSet questionSet)
        {
            var scores = new UserScores();

            if (answers == null || questionSet == null) return scores;

            foreach (var answer in answers)
            {
                if (answer == null) continue;

                var question = questionSet.Find(answer.questionId);

                /* `if (!question) continue;` — саволи номаълум хато нест.
                   Барномаи кӯҳнаи айнак метавонад саволи бекоршударо
                   фиристад; демо набояд аз ин шиканад. */
                if (question == null) continue;

                var option = OptionAt(question, answer.selectedValue);

                if (question.part == PartMmt)
                {
                    /* Дар TypeScript ин шоха варианти мавҷудро талаб мекунад:
                       `question.part === QuizPart.MMT && selectedOption`. */
                    if (option != null) scores.MmtClusters.Add(option.scores);
                }
                else if (question.part == PartMotivation)
                {
                    /* `selectedOption?.text?.en || answer.selectedValue` —
                       матни англисӣ, вагарна худи қимати хом. Дар JavaScript
                       `||` сатри холиро низ рад мекунад, аз ин рӯ ин ҷо
                       `IsNullOrEmpty` санҷида мешавад, на танҳо `null`. */
                    var text = option?.text?.en;
                    scores.Motivation[question.type] =
                        string.IsNullOrEmpty(text) ? answer.selectedValue : text;
                }
                else if (question.part == PartSpecialty)
                {
                    if (option?.keywords != null)
                    {
                        scores.SpecialtyKeywords.AddRange(option.keywords);
                    }
                }
            }

            return scores;
        }

        /// <summary>Варианти интихобшуда, ё <c>null</c> агар индекс нодуруст бошад.</summary>
        private static QuizOption OptionAt(QuizQuestion question, string selectedValue)
        {
            if (question?.options == null) return null;

            var index = ToArrayIndex(selectedValue, question.options.Length);
            return index < 0 ? null : question.options[index];
        }

        /// <summary>
        /// Такрори `question.options[Number(answer.selectedValue)]`.
        ///
        /// Ин ҷои нозук аст. Дар JavaScript <c>Number()</c> рафтори худро
        /// дорад, ки <c>int.Parse</c>-и C# онро такрор намекунад:
        ///
        ///   Number("")     === 0    → варианти якум интихоб мешавад
        ///   Number("  ")   === 0    → ҳамин тавр
        ///   Number(null)   === 0    → ҳамин тавр
        ///   Number("2")    === 2
        ///   Number("2.7")  === 2.7  → options[2.7] === undefined
        ///   Number("abc")  === NaN  → options[NaN] === undefined
        ///   options[-1]    === undefined
        ///
        /// Агар ин ҷо танҳо <c>int.TryParse</c> бошад, сатри холӣ ҳамчун
        /// «вариант нест» ҳисоб мешуд, дар ҳоле ки backend вариантти якумро
        /// мегирад — ва ҳамон як ҷавоб дар айнак ва дар сайт ду профили
        /// гуногун медод.
        /// </summary>
        /// <returns>Индекси дуруст, ё <c>-1</c>.</returns>
        internal static int ToArrayIndex(string selectedValue, int length)
        {
            if (length <= 0) return -1;

            // Number(null) === 0 ва Number("") === 0
            if (string.IsNullOrWhiteSpace(selectedValue)) return 0 < length ? 0 : -1;

            if (!double.TryParse(
                    selectedValue.Trim(),
                    NumberStyles.Float,
                    CultureInfo.InvariantCulture,
                    out var number))
            {
                // Number("abc") === NaN → options[NaN] === undefined
                return -1;
            }

            // options[2.7] === undefined — танҳо индекси бутун кор мекунад
            if (number % 1 != 0) return -1;

            if (number < 0 || number >= length) return -1;

            return (int)number;
        }
    }
}

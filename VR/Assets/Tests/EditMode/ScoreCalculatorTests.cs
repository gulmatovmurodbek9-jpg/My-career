using System;
using System.Collections.Generic;
using System.IO;
using IhtisosiMan.Core;
using NUnit.Framework;
using UnityEngine;

namespace IhtisosiMan.Tests
{
    /// <summary>
    /// Санҷиши ягонагии ҳисоб байни айнак ва сервер.
    ///
    /// Векторҳои `vr-golden.json`-ро худи backend месозад
    /// (`npm run export:vr` → `QuizService.calculateScores()`). Ин тестҳо
    /// исбот мекунанд, ки порти C# ба ҳамон ҷавобҳо ҳамон профилро медиҳад.
    ///
    /// Агар ин тест сурх шавад — коди C#-ро ислоҳ кунед, на векторҳоро.
    /// Манбаи ҳақиқат backend аст.
    /// </summary>
    [TestFixture]
    public class ScoreCalculatorTests
    {
        private const string GoldenFileName = "vr-golden.json";
        private const float Tolerance = 0.0001f;

        private QuizQuestionSet _questions;
        private GoldenSet _golden;

        [Serializable]
        private class GoldenExpected
        {
            public ClusterScores scores;
            public string[] specialtyKeywords;
        }

        [Serializable]
        private class GoldenVector
        {
            public string name;
            public QuizAnswer[] answers;
            public GoldenExpected expected;
        }

        [Serializable]
        private class GoldenSet
        {
            public GoldenVector[] vectors;
        }

        [OneTimeSetUp]
        public void LoadData()
        {
            _questions = QuizDataLoader.LoadSync();

            var goldenPath = QuizDataLoader.PathFor(GoldenFileName);

            if (!File.Exists(goldenPath))
            {
                Assert.Fail($"{GoldenFileName} нест. Дар Back/nest-backend `npm run export:vr`-ро иҷро кунед.");
            }

            _golden = JsonUtility.FromJson<GoldenSet>(File.ReadAllText(goldenPath));

            Assert.That(_golden?.vectors, Is.Not.Null.And.Not.Empty, "векторҳои санҷишӣ холианд");
        }

        // ─────────────────────────────────────────────────────────
        //  Ягонагӣ бо backend
        // ─────────────────────────────────────────────────────────

        [Test]
        public void Hisob_bo_natijai_backend_muvofiq_ast()
        {
            var failures = new List<string>();

            foreach (var vector in _golden.vectors)
            {
                var result = ScoreCalculator.Calculate(vector.answers, _questions);
                var expected = vector.expected.scores;
                var actual = result.MmtClusters;

                if (Math.Abs(expected.c1 - actual.c1) > Tolerance ||
                    Math.Abs(expected.c2 - actual.c2) > Tolerance ||
                    Math.Abs(expected.c3 - actual.c3) > Tolerance ||
                    Math.Abs(expected.c4 - actual.c4) > Tolerance ||
                    Math.Abs(expected.c5 - actual.c5) > Tolerance)
                {
                    failures.Add($"[{vector.name}] холҳо: интизор {expected}, гирифта шуд {actual}");
                }

                var expectedKeywords = vector.expected.specialtyKeywords ?? Array.Empty<string>();

                /* Тартиб низ муҳим аст: калидвожаҳо дар `career.service.ts`
                   вазн мегиранд, ва тартиби гуногун метавонад рейтинги
                   ихтисосҳоро тағйир диҳад. */
                if (!AreEqual(expectedKeywords, result.SpecialtyKeywords))
                {
                    failures.Add(
                        $"[{vector.name}] калидвожаҳо: интизор [{string.Join(", ", expectedKeywords)}], " +
                        $"гирифта шуд [{string.Join(", ", result.SpecialtyKeywords)}]");
                }
            }

            Assert.That(failures, Is.Empty,
                "Ҳисоби C# аз backend фарқ мекунад:\n" + string.Join("\n", failures));
        }

        [Test]
        public void Hamai_vektorho_sanjida_shudand()
        {
            /* Агар векторҳо тасодуфан аз файл нест шаванд, тести боло сабз
               мемонад ва ҳеҷ чиз санҷида намешавад. */
            Assert.That(_golden.vectors.Length, Is.GreaterThanOrEqualTo(10));
        }

        // ─────────────────────────────────────────────────────────
        //  Маълумоти саволҳо
        // ─────────────────────────────────────────────────────────

        [Test]
        public void Savolhoi_mmt_dah_to_va_har_kadom_panj_variant()
        {
            var mmt = _questions.OfPart(ScoreCalculator.PartMmt);

            Assert.That(mmt.Count, Is.EqualTo(10), "шумораи саволҳои MMT тағйир ёфт");

            foreach (var question in mmt)
            {
                Assert.That(question.options, Is.Not.Null.And.Length.EqualTo(5),
                    $"саволи {question.id} панҷ вариант надорад");

                foreach (var option in question.options)
                {
                    Assert.That(option.scores, Is.Not.Null,
                        $"варианти саволи {question.id} хол надорад");
                }
            }
        }

        [Test]
        public void Hadi_aksari_khol_chihil_ast()
        {
            /* Агар шумораи саволҳо ё холҳо тағйир ёбад, `MaxScore` низ бояд
               тағйир ёбад — вагарна фоизи мувофиқат хато мешавад. */
            var mmt = _questions.OfPart(ScoreCalculator.PartMmt);
            var answers = new List<QuizAnswer>();

            foreach (var question in mmt) answers.Add(new QuizAnswer(question.id, 0));

            var result = ScoreCalculator.Calculate(answers, _questions);

            Assert.That(result.MmtClusters.c1, Is.EqualTo(ClusterScores.MaxScore).Within(Tolerance));
            Assert.That(result.MmtClusters.MatchPercentage(), Is.EqualTo(100));
        }

        // ─────────────────────────────────────────────────────────
        //  Ҳолатҳои канорӣ — рафтори Number() дар JavaScript
        // ─────────────────────────────────────────────────────────

        [TestCase("0", 5, 0)]
        [TestCase("3", 5, 3)]
        [TestCase("4", 5, 4)]
        [TestCase("5", 5, -1)]      // берун аз ҳудуд
        [TestCase("99", 5, -1)]
        [TestCase("-1", 5, -1)]
        [TestCase("2.7", 5, -1)]    // options[2.7] === undefined
        [TestCase("abc", 5, -1)]    // Number("abc") === NaN
        [TestCase("", 5, 0)]        // Number("") === 0
        [TestCase("   ", 5, 0)]     // Number("  ") === 0
        [TestCase(null, 5, 0)]      // Number(null) === 0
        [TestCase("2", 0, -1)]      // савол бе вариант
        public void Indeks_hamchun_JavaScript_hisob_meshavad(string value, int length, int expected)
        {
            Assert.That(ScoreCalculator.ToArrayIndex(value, length), Is.EqualTo(expected));
        }

        [Test]
        public void Savoli_nomavjud_partofta_meshavad()
        {
            var answers = new List<QuizAnswer> { new QuizAnswer("in-savol-vujud-nadorad", 0) };

            var result = ScoreCalculator.Calculate(answers, _questions);

            Assert.That(result.MmtClusters.c1, Is.EqualTo(0f).Within(Tolerance));
            Assert.That(result.SpecialtyKeywords, Is.Empty);
        }

        [Test]
        public void Javobhoi_holi_barnomaro_nameshikanad()
        {
            Assert.DoesNotThrow(() => ScoreCalculator.Calculate(null, _questions));
            Assert.DoesNotThrow(() => ScoreCalculator.Calculate(new List<QuizAnswer>(), null));
            Assert.DoesNotThrow(() => ScoreCalculator.Calculate(new List<QuizAnswer> { null }, _questions));
        }

        [Test]
        public void Klasteri_peshbar_va_foizi_muvofiqat()
        {
            var scores = new ClusterScores(8, 3, 5, 2, 6);

            Assert.That(scores.TopClusterNumber(), Is.EqualTo(1));
            Assert.That(scores[3], Is.EqualTo(5f).Within(Tolerance));
            Assert.That(scores.MatchPercentage(), Is.EqualTo(20)); // 8 / 40 = 20%
        }

        private static bool AreEqual(IReadOnlyList<string> expected, IReadOnlyList<string> actual)
        {
            if (expected.Count != actual.Count) return false;

            for (var i = 0; i < expected.Count; i++)
            {
                if (expected[i] != actual[i]) return false;
            }
            return true;
        }
    }
}

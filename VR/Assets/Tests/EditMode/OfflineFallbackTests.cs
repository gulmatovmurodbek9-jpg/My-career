using IhtisosiMan.Core;
using NUnit.Framework;

namespace IhtisosiMan.Tests
{
    /// <summary>
    /// Санҷиши захираи офлайн.
    ///
    /// Ин тестҳо як чизро нигоҳ медоранд: вақте сервер нест, саҳна бояд боз
    /// ҳам чизе барои нишон додан дошта бошад — вале ҳеҷ гоҳ чизи сохта.
    /// </summary>
    [TestFixture]
    public class OfflineFallbackTests
    {
        private const float Tolerance = 0.0001f;

        [Test]
        public void Javobi_offline_hamesha_purra_ast()
        {
            var scores = new ClusterScores(8, 3, 5, 2, 6);

            var response = OfflineFallback.ExplainResponse(scores, "tj");

            Assert.That(response.profile, Has.Length.EqualTo(5), "ҳар панҷ ҷазира бояд хол дошта бошад");
            Assert.That(response.cluster.number, Is.EqualTo(1));
            Assert.That(response.explanation, Is.Not.Empty);
            Assert.That(response.matchPercentage, Is.EqualTo(20)); // 8 / 40
            Assert.That(response.source, Is.EqualTo("offline"));
        }

        [Test]
        public void Offline_nomi_kasbi_sokhta_namedihad()
        {
            /* Ин муҳимтарин тести ин файл аст.
               Номи касб ва донишгоҳ ТАНҲО дар база ҳастанд. Агар сервер
               дастрас набошад, беҳтар аст рӯйхат холӣ бошад, аз он ки
               довталаб номи мавҷуднабударо бинад. */
            var response = OfflineFallback.ExplainResponse(new ClusterScores(40, 0, 0, 0, 0), "tj");

            Assert.That(response.careers, Is.Empty);
        }

        [Test]
        public void Offline_kholhoro_tagyir_namedihad()
        {
            var scores = new ClusterScores(7, 11, 3, 0, 19);

            var response = OfflineFallback.ExplainResponse(scores, "tj");

            Assert.That(response.scores.c1, Is.EqualTo(7f).Within(Tolerance));
            Assert.That(response.scores.c2, Is.EqualTo(11f).Within(Tolerance));
            Assert.That(response.scores.c5, Is.EqualTo(19f).Within(Tolerance));
            Assert.That(response.cluster.number, Is.EqualTo(5));
        }

        [TestCase("tj")]
        [TestCase("ru")]
        [TestCase("en")]
        public void Har_se_zabon_matni_khudro_dorad(string lang)
        {
            for (var cluster = 1; cluster <= 5; cluster++)
            {
                var name = OfflineFallback.ClusterName(cluster, lang);
                var text = OfflineFallback.Explanation(cluster, lang);

                Assert.That(name, Is.Not.Empty, $"кластери {cluster}, забони {lang}");
                Assert.That(text, Does.Contain(name), $"шарҳ бояд номи кластерро дошта бошад ({lang})");
            }
        }

        [Test]
        public void Zaboni_nomalum_ba_tojiki_meguzarad()
        {
            Assert.That(OfflineFallback.ClusterName(1, "de"), Is.EqualTo(OfflineFallback.ClusterName(1, "tj")));
        }

        [Test]
        public void Qimathoi_nodurust_barnomaro_nameshikanand()
        {
            Assert.That(OfflineFallback.ClusterName(0, "tj"), Is.Empty);
            Assert.That(OfflineFallback.ClusterName(99, "tj"), Is.Empty);
            Assert.DoesNotThrow(() => OfflineFallback.ExplainResponse(null, "tj"));
            Assert.That(OfflineFallback.ExplainResponse(null, "tj"), Is.Not.Null);
        }

        [Test]
        public void Sino_takhmin_namekunad()
        {
            Assert.That(OfflineFallback.UnknownAnswer("tj"), Does.Contain("намедонам"));
            Assert.That(OfflineFallback.AskResponse("tj").source, Is.EqualTo("offline"));
        }

        [Test]
        public void Kharitai_offline_pini_sokhta_namegzorad()
        {
            var map = OfflineFallback.MapResponse();

            Assert.That(map.points, Is.Empty);
            Assert.That(map.nearest, Is.Null);
        }

        [Test]
        public void Masofai_sifr_yane_malum_nest()
        {
            /* Сервер `distanceKm`-ро танҳо ҳангоми додани lat/lon мефиристад.
               Дар JSON он умуман нест ва JsonUtility сифр мемонад — саҳна
               набояд «0 км» нависад. */
            var uni = new VrUniversity { latitude = 38.5598f, longitude = 68.787f };

            Assert.That(uni.HasDistance, Is.False);
            Assert.That(uni.HasCoordinates, Is.True);

            uni.distanceKm = 42f;
            Assert.That(uni.HasDistance, Is.True);
        }
    }
}

using UnityEngine;

namespace IhtisosiMan.Core
{
    /// <summary>
    /// Танзимоти пайвастшавӣ ва забон.
    ///
    /// ЧАРО ScriptableObject, НА CONST ДАР КОД:
    /// Дар рӯзи фестивал суроғаи сервер метавонад иваз шавад (роутери мобилӣ,
    /// IP-и дигар), ва забон низ пеш аз ҳар меҳмон интихоб мешавад. Агар ин
    /// қиматҳо дар код бошанд, ҳар тағйир build-и нави APK мехоҳад — 10
    /// дақиқа дар лаҳзае, ки навбат меистад.
    ///
    /// Сохтан:  Assets → Create → Ихтисоси ман → VR Config
    /// </summary>
    [CreateAssetMenu(fileName = "VrConfig", menuName = "Ихтисоси ман/VR Config")]
    public class VrConfig : ScriptableObject
    {
        [Header("Сервер")]
        [Tooltip("Бе / дар охир. Мисол: http://192.168.1.50:3000")]
        public string baseUrl = "http://localhost:3000";

        [Tooltip("Мӯҳлати як дархост, сония. Дар VR интизории дароз аз ҷавоби бад бадтар аст.")]
        [Range(2, 15)]
        public int timeoutSeconds = 6;

        [Tooltip("Такрори як маротиба, агар дархост ТЕЗ афтад (қатъи пайваст). Пас аз мӯҳлат такрор намешавад.")]
        public bool retryOnFastFailure = true;

        [Header("Забон")]
        [Tooltip("tj | ru | en")]
        public string language = "tj";

        [Header("Ташхис")]
        [Tooltip("Ҳар дархост ва натиҷаро ба Logcat менависад. Пеш аз фестивал хомӯш кунед.")]
        public bool verboseLogging = true;

        /// <summary>Суроғаи пурраи роҳ, бо тозакунии / -и зиёдатӣ.</summary>
        public string Url(string path)
        {
            var root = string.IsNullOrEmpty(baseUrl) ? string.Empty : baseUrl.TrimEnd('/');
            var tail = string.IsNullOrEmpty(path) ? string.Empty : path.TrimStart('/');
            return $"{root}/{tail}";
        }
    }
}

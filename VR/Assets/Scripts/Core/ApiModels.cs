using System;

namespace IhtisosiMan.Core
{
    /// <summary>
    /// Моделҳои ҷавоби backend — акси `Back/nest-backend/src/vr/vr.service.ts`.
    ///
    /// Номи майдонҳо бояд ҳарф ба ҳарф бо JSON мувофиқ бошад: <c>JsonUtility</c>
    /// майдони номаълумро бесадо мепартояд ва хато намедиҳад. Агар ном ғалат
    /// бошад, дар саҳна сифр ё сатри холӣ мебарояд, на паёми хато.
    /// </summary>

    // ─────────────────────────────────────────────────────────────
    //  POST /vr/explain  ва  POST /vr/session
    // ─────────────────────────────────────────────────────────────

    [Serializable]
    public class VrClusterInfo
    {
        public string id;
        public int number;
        public string name;
        public string description;
    }

    /// <summary>Як сутуни профил дар пардаи 4.</summary>
    [Serializable]
    public class VrProfileEntry
    {
        public int number;
        public string name;
        public float score;
    }

    /// <summary>Донишгоҳ — пини харитаи пардаи 7 ва лавҳаи пардаи 8.</summary>
    [Serializable]
    public class VrUniversity
    {
        public string id;
        public string name;
        public string fullName;
        public string city;
        public string region;
        public string type;
        public bool isState;
        public string website;
        public float latitude;
        public float longitude;

        /// <summary>
        /// Масофа то ҷои корбар, км.
        /// </summary>
        /// <remarks>
        /// Сервер ин майдонро танҳо ҳангоми додани <c>lat</c>/<c>lon</c>
        /// мефиристад; вагарна он дар JSON умуман нест ва <c>JsonUtility</c>
        /// ин ҷо сифр мемонад. Аз ин рӯ сифрро ҳамчун «маълум нест» бихонед —
        /// ниг. <see cref="HasDistance"/>.
        /// </remarks>
        public float distanceKm;

        public bool HasDistance => distanceKm > 0f;

        public bool HasCoordinates => Math.Abs(latitude) > 0.0001f || Math.Abs(longitude) > 0.0001f;
    }

    /// <summary>Корти касб — истгоҳи пардаи 5 ва тӯмори пардаи 10.</summary>
    [Serializable]
    public class VrCareer
    {
        public string id;
        public string code;
        public string name;
        public string description;
        public string purpose;
        public int matchPercentage;
        public int universityCount;
        public VrUniversity[] universities;
    }

    [Serializable]
    public class VrExplainResponse
    {
        public VrClusterInfo cluster;
        public ClusterScores scores;
        public VrProfileEntry[] profile;
        public int matchPercentage;
        public VrCareer[] careers;
        public string explanation;

        /// <summary>"ai" | "cache" | "fallback" — барои панели оператор.</summary>
        public string source;

        public bool IsUsable => !string.IsNullOrEmpty(explanation);
    }

    // ─────────────────────────────────────────────────────────────
    //  GET /vr/map
    // ─────────────────────────────────────────────────────────────

    [Serializable]
    public class VrMapResponse
    {
        public int total;
        public VrUniversity nearest;
        public VrUniversity[] points;
    }

    // ─────────────────────────────────────────────────────────────
    //  POST /vr/ask
    // ─────────────────────────────────────────────────────────────

    [Serializable]
    public class VrAskResponse
    {
        public string answer;
        public string source;
    }

    // ─────────────────────────────────────────────────────────────
    //  Бадани дархостҳо
    // ─────────────────────────────────────────────────────────────

    [Serializable]
    public class VrExplainRequest
    {
        public ClusterScores scores;
        public string lang;
        public string[] keywords;
    }

    [Serializable]
    public class VrAskRequest
    {
        public string question;
        public string careerId;
        public string lang;
    }

    /// <summary>
    /// Натиҷаи ҳар даъвати API.
    ///
    /// Хато ҳеҷ гоҳ партофта намешавад: саҳнаи VR бояд ҳамеша чизе барои
    /// нишон додан дошта бошад. <see cref="IsOffline"/> мегӯяд, ки маълумот
    /// аз сервер омад ё аз захираи офлайн.
    /// </summary>
    public class ApiResult<T> where T : class
    {
        public T Data;
        public bool IsOffline;
        public string Error;

        public bool HasData => Data != null;

        public static ApiResult<T> Online(T data) => new ApiResult<T> { Data = data };

        public static ApiResult<T> Offline(T data, string error) =>
            new ApiResult<T> { Data = data, IsOffline = true, Error = error };
    }
}

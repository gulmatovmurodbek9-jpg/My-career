using System;
using System.Collections;
using System.Diagnostics;
using System.Globalization;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;
using Debug = UnityEngine.Debug;

namespace IhtisosiMan.Core
{
    /// <summary>
    /// Пайвасти барномаи VR ба backend.
    ///
    /// ҚОИДАИ АСОСӢ: ин синф ҳеҷ гоҳ хато намепартояд ва ҳеҷ гоҳ саҳнаро
    /// боз намедорад. Ҳар даъват ҳатман ҷавоб мегардонад — ё аз сервер, ё
    /// аз <see cref="OfflineFallback"/>. Дар айнак спиннери абадӣ маънои
    /// шикастани демо аст: меҳмон намедонад, ки интизор шавад ё айнакро
    /// барорад.
    ///
    /// ЧӢ ТАВР ИСТИФОДА МЕШАВАД:
    /// <code>
    /// StartCoroutine(ApiClient.Instance.Explain(scores, null, result =>
    /// {
    ///     resultPanel.Show(result.Data);          // ҳамеша пур аст
    ///     if (result.IsOffline) operatorPanel.MarkOffline();
    /// }));
    /// </code>
    /// </summary>
    public class ApiClient : MonoBehaviour
    {
        [SerializeField] private VrConfig config;

        private static ApiClient _instance;

        public static ApiClient Instance
        {
            get
            {
                if (_instance == null)
                {
                    var go = new GameObject("[ApiClient]");
                    _instance = go.AddComponent<ApiClient>();
                    DontDestroyOnLoad(go);
                }
                return _instance;
            }
        }

        private void Awake()
        {
            if (_instance != null && _instance != this)
            {
                Destroy(gameObject);
                return;
            }

            _instance = this;
            DontDestroyOnLoad(gameObject);
        }

        /// <summary>Танзимот; агар дар Inspector гузошта нашуда бошад — пешфарз.</summary>
        public VrConfig Config
        {
            get
            {
                if (config == null)
                {
                    config = ScriptableObject.CreateInstance<VrConfig>();
                    Debug.LogWarning("[ApiClient] VrConfig гузошта нашудааст — танзимоти пешфарз истифода мешавад");
                }
                return config;
            }
            set => config = value;
        }

        private string Lang => string.IsNullOrEmpty(Config.language) ? "tj" : Config.language;

        // ─────────────────────────────────────────────────────────
        //  POST /vr/explain — пардаи 4 ва 10
        // ─────────────────────────────────────────────────────────

        /// <summary>
        /// Холҳое, ки <see cref="ScoreCalculator"/> дар айнак ҳисоб кард, ба
        /// сервер мераванд ва бо касбҳо ва шарҳи Сино бармегарданд.
        ///
        /// Холҳо ба сервер танҳо барои ҷустуҷӯ мераванд — сервер онҳоро аз
        /// нав ҳисоб намекунад ва тағйир намедиҳад.
        /// </summary>
        public IEnumerator Explain(ClusterScores scores, string[] keywords, Action<ApiResult<VrExplainResponse>> onDone)
        {
            var body = new VrExplainRequest
            {
                scores = scores ?? new ClusterScores(),
                lang = Lang,
                keywords = keywords ?? new string[0],
            };

            yield return Send<VrExplainResponse>(
                UnityWebRequest.kHttpVerbPOST,
                Config.Url("vr/explain"),
                JsonUtility.ToJson(body),
                result =>
                {
                    /* Ҷавоби холӣ ҳам нокомист: беҳтар аст матни устувори
                       офлайнро нишон диҳем, аз он ки панели холӣ. */
                    if (!result.HasData || !result.Data.IsUsable)
                    {
                        onDone?.Invoke(ApiResult<VrExplainResponse>.Offline(
                            OfflineFallback.ExplainResponse(scores, Lang),
                            result.Error ?? "ҷавоби холӣ"));
                        return;
                    }

                    onDone?.Invoke(result);
                });
        }

        // ─────────────────────────────────────────────────────────
        //  GET /vr/map — пардаи 7
        // ─────────────────────────────────────────────────────────

        /// <summary>
        /// Донишгоҳҳо бо координатҳои воқеӣ.
        /// </summary>
        /// <param name="careerId">Танҳо донишгоҳҳои ҳамин ихтисос; холӣ — ҳамааш.</param>
        /// <param name="lat">Ҷои корбар — барои муайян кардани наздиктарин.</param>
        public IEnumerator Map(string careerId, float? lat, float? lon, int limit, Action<ApiResult<VrMapResponse>> onDone)
        {
            var query = new StringBuilder();

            void Add(string key, string value)
            {
                query.Append(query.Length == 0 ? '?' : '&');
                query.Append(key).Append('=').Append(UnityWebRequest.EscapeURL(value));
            }

            if (!string.IsNullOrEmpty(careerId)) Add("careerId", careerId);
            if (lat.HasValue) Add("lat", lat.Value.ToString("0.######", CultureInfo.InvariantCulture));
            if (lon.HasValue) Add("lon", lon.Value.ToString("0.######", CultureInfo.InvariantCulture));
            if (limit > 0) Add("limit", limit.ToString(CultureInfo.InvariantCulture));

            yield return Send<VrMapResponse>(
                UnityWebRequest.kHttpVerbGET,
                Config.Url("vr/map") + query,
                null,
                result =>
                {
                    if (!result.HasData)
                    {
                        /* Харитаи холӣ — саҳна паём нишон медиҳад, на пинҳои
                           сохта. Координати тахминӣ гузоштан манъ аст. */
                        onDone?.Invoke(ApiResult<VrMapResponse>.Offline(
                            OfflineFallback.MapResponse(), result.Error));
                        return;
                    }

                    onDone?.Invoke(result);
                });
        }

        // ─────────────────────────────────────────────────────────
        //  POST /vr/ask — пардаи 9
        // ─────────────────────────────────────────────────────────

        public IEnumerator Ask(string question, string careerId, Action<ApiResult<VrAskResponse>> onDone)
        {
            var body = new VrAskRequest
            {
                question = question,
                careerId = careerId,
                lang = Lang,
            };

            yield return Send<VrAskResponse>(
                UnityWebRequest.kHttpVerbPOST,
                Config.Url("vr/ask"),
                JsonUtility.ToJson(body),
                result =>
                {
                    if (!result.HasData || string.IsNullOrEmpty(result.Data.answer))
                    {
                        onDone?.Invoke(ApiResult<VrAskResponse>.Offline(
                            OfflineFallback.AskResponse(Lang), result.Error ?? "ҷавоби холӣ"));
                        return;
                    }

                    onDone?.Invoke(result);
                });
        }

        // ─────────────────────────────────────────────────────────
        //  Дарун
        // ─────────────────────────────────────────────────────────

        private IEnumerator Send<T>(string method, string url, string json, Action<ApiResult<T>> onDone)
            where T : class
        {
            var attempt = 0;
            string lastError = null;

            while (true)
            {
                attempt++;

                var watch = Stopwatch.StartNew();
                ApiResult<T> result = null;

                yield return Once<T>(method, url, json, r => result = r);

                watch.Stop();

                if (result != null && result.HasData)
                {
                    if (Config.verboseLogging)
                    {
                        Debug.Log($"[ApiClient] {method} {url} — {watch.ElapsedMilliseconds} мс, кӯшиши {attempt}");
                    }
                    onDone?.Invoke(result);
                    yield break;
                }

                lastError = result?.Error ?? "хатои номаълум";

                /*
                 * Такрор танҳо ҳангоми афтиши ТЕЗ.
                 *
                 * Агар дархост то мӯҳлат расида бошад, сервер ё шабака банд
                 * аст — кӯшиши дуюм боз ҳамон қадар вақт мехӯрад ва саҳна ду
                 * баробар дароз мешавад. Вале агар пайваст дар 300 мс рад
                 * шуда бошад (роутер лаҳзае афтод), такрор арзон аст ва
                 * аксаран кор мекунад.
                 */
                var budgetMs = Config.timeoutSeconds * 1000L;
                var wasFast = watch.ElapsedMilliseconds < budgetMs / 2;

                if (attempt >= 2 || !Config.retryOnFastFailure || !wasFast)
                {
                    Debug.LogWarning($"[ApiClient] {method} {url} афтод ({lastError}) — офлайн");
                    onDone?.Invoke(new ApiResult<T> { IsOffline = true, Error = lastError });
                    yield break;
                }

                if (Config.verboseLogging)
                {
                    Debug.Log($"[ApiClient] афтиши тез ({watch.ElapsedMilliseconds} мс) — такрор");
                }
            }
        }

        private IEnumerator Once<T>(string method, string url, string json, Action<ApiResult<T>> onDone)
            where T : class
        {
            using (var request = new UnityWebRequest(url, method))
            {
                request.downloadHandler = new DownloadHandlerBuffer();

                if (!string.IsNullOrEmpty(json))
                {
                    request.uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes(json));
                    request.SetRequestHeader("Content-Type", "application/json");
                }

                /* `timeout` дар UnityWebRequest бо сония аст ва дархостро худаш
                   мебандад — бе он корутина то timeout-и системаи оператсионӣ
                   (даҳҳо сония) овезон мемонад. */
                request.timeout = Mathf.Max(1, Config.timeoutSeconds);

                yield return request.SendWebRequest();

                if (request.result != UnityWebRequest.Result.Success)
                {
                    onDone?.Invoke(new ApiResult<T> { Error = $"{request.result}: {request.error}" });
                    yield break;
                }

                var text = request.downloadHandler.text;

                if (string.IsNullOrEmpty(text))
                {
                    onDone?.Invoke(new ApiResult<T> { Error = "бадани ҷавоб холӣ" });
                    yield break;
                }

                T parsed;
                try
                {
                    parsed = JsonUtility.FromJson<T>(text);
                }
                catch (Exception e)
                {
                    /* JSON-и вайрон набояд саҳнаро кушад — ин ҳамчун афтиши
                       муқаррарӣ ҳисоб мешавад ва ба офлайн мегузарад. */
                    onDone?.Invoke(new ApiResult<T> { Error = $"JSON хонда нашуд: {e.Message}" });
                    yield break;
                }

                if (parsed == null)
                {
                    onDone?.Invoke(new ApiResult<T> { Error = "JSON ба модел мувофиқ наомад" });
                    yield break;
                }

                onDone?.Invoke(ApiResult<T>.Online(parsed));
            }
        }

        /// <summary>
        /// Санҷиши тези дастрасии сервер — барои панели оператор пеш аз демо.
        /// </summary>
        public IEnumerator Ping(Action<bool> onDone)
        {
            yield return Map(null, null, null, 1, result => onDone?.Invoke(!result.IsOffline));
        }
    }
}

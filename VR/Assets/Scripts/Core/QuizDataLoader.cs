using System;
using System.Collections;
using System.IO;
using UnityEngine;
using UnityEngine.Networking;

namespace IhtisosiMan.Core
{
    /// <summary>
    /// Хондани `vr-questions.json` аз StreamingAssets.
    ///
    /// ДИҚҚАТ — доми Android:
    /// Дар Windows ва дар Editor StreamingAssets ҷузвдони оддист ва
    /// <c>File.ReadAllText</c> кор мекунад. Дар Quest 2 (Android) он ДАРУНИ
    /// худи APK, дар архиви фишурда мемонад — роҳаш `jar:file://…` мешавад ва
    /// ҳеҷ API-и файлӣ онро намехонад. Ягона роҳ <c>UnityWebRequest</c> аст.
    ///
    /// Ин фарқ дар Editor ҳеҷ гоҳ маълум намешавад: ҳама чиз кор мекунад, то
    /// рӯзе ки APK-ро ба айнак мегузорӣ ва саҳна холӣ мемонад. Аз ин рӯ ҳарду
    /// роҳ ҳозир навишта шуд.
    /// </summary>
    public static class QuizDataLoader
    {
        public const string QuestionsFileName = "vr-questions.json";

        public static string PathFor(string fileName)
        {
            return Path.Combine(Application.streamingAssetsPath, fileName);
        }

        /// <summary>
        /// Хондани саволҳо. Дар Android тавассути <c>UnityWebRequest</c>,
        /// дар дигар ҷойҳо аз файл.
        /// </summary>
        /// <param name="onLoaded">Ҳангоми муваффақият.</param>
        /// <param name="onFailed">Ҳангоми хато — саҳна бояд паём нишон диҳад, на яхкунад.</param>
        public static IEnumerator Load(Action<QuizQuestionSet> onLoaded, Action<string> onFailed = null)
        {
            var path = PathFor(QuestionsFileName);
            string json = null;
            string error = null;

            if (path.Contains("://") || path.Contains(":///"))
            {
                using (var request = UnityWebRequest.Get(path))
                {
                    yield return request.SendWebRequest();

                    if (request.result == UnityWebRequest.Result.Success)
                    {
                        json = request.downloadHandler.text;
                    }
                    else
                    {
                        error = request.error;
                    }
                }
            }
            else
            {
                try
                {
                    json = File.ReadAllText(path);
                }
                catch (Exception e)
                {
                    error = e.Message;
                }
            }

            if (json == null)
            {
                Debug.LogError($"[QuizDataLoader] {QuestionsFileName} хонда нашуд: {error}");
                onFailed?.Invoke(error ?? "файл ёфт нашуд");
                yield break;
            }

            var set = Parse(json, out var parseError);

            if (set == null)
            {
                Debug.LogError($"[QuizDataLoader] JSON вайрон аст: {parseError}");
                onFailed?.Invoke(parseError);
                yield break;
            }

            Debug.Log($"[QuizDataLoader] {set.questions.Length} савол бор шуд");
            onLoaded?.Invoke(set);
        }

        /// <summary>
        /// Хондани синхронӣ — танҳо барои Editor ва тестҳо.
        /// Дар Quest истифода набаред: он ҷо файл дар APK аст.
        /// </summary>
        public static QuizQuestionSet LoadSync(string fileName = QuestionsFileName)
        {
            var path = PathFor(fileName);

            if (!File.Exists(path))
            {
                throw new FileNotFoundException($"{fileName} дар StreamingAssets нест. `npm run export:vr`-ро иҷро кунед.", path);
            }

            var set = Parse(File.ReadAllText(path), out var error);

            if (set == null) throw new InvalidDataException(error);

            return set;
        }

        private static QuizQuestionSet Parse(string json, out string error)
        {
            error = null;

            try
            {
                var set = JsonUtility.FromJson<QuizQuestionSet>(json);

                if (set?.questions == null || set.questions.Length == 0)
                {
                    error = "рӯйхати саволҳо холӣ аст";
                    return null;
                }

                return set;
            }
            catch (Exception e)
            {
                error = e.Message;
                return null;
            }
        }
    }
}

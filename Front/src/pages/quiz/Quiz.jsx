import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Award,
    ArrowRight,
    Target,
    Zap,
    Users,
    ChevronLeft,
    ChevronRight,
    Check,
    Trophy,
    Sparkles,
    Search,
    Lightbulb,
    BarChart,
    Shield,
    FileText,
    TrendingUp,
    Bookmark,
    CheckCircle,
    Briefcase,
    Loader2,
    PenLine,
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { clusterLabel, clusterDescription } from "../../lib/clusterLabel";
import axios from "axios";
import { API } from "../../lib/config";
import { useAuthStore } from "../../store/authStore";
import { useToast } from "../../components/toast/ToastProvider";
import { MMT_CLUSTERS } from "../../lib/mmtClusters";
import { displayName } from "../../lib/careerName";
import { careerName, careerDescription } from "../../lib/careerText";
import { getGrade, gradeText, setGrade, GRADE_EVENT } from "../../lib/grade";
import { withLang } from "../../lib/apiLang";

const QUIZ_STORAGE_KEY = "quiz_results_v1";

const SPEC_WINDOW = 8;
const CLUSTER_PAGE_SIZE = 12;

const LogoMark = ({ className = "" }) => (
    <img src="/logo.png" alt="" aria-hidden="true" className={`object-contain ${className}`} />
);

// Тартиби ҷавобҳо барои ҳар корбар омехта (ҷои ҷавоб ба самт ишора накунад),
// вале дар давоми як сессия барои ҳамон савол собит.
const SHUFFLE_SEED = Math.floor(Math.random() * 1e9);
// «Ҷавоби худ»: агар ҳеҷ вариант мувофиқ набошад, корбар бо суханони худ менависад;
// AI онро ба варианти наздиктарин мепайвандад ва хол ҳамон хол-и вариант аст.
const OWN_TEXT = {
    tj: {
        title: "Ҷавоби шумо дар рӯйхат нест?",
        hint: "Бо суханони худ нависед — AI варианти аз ҳама наздикро меёбад ва ба шумо нишон медиҳад. Хол ҳамон тавр ҳисоб мешавад, ки бо интихоби вариант.",
        placeholder: "Масалан: «дар бораи ҳайвонот ва табиат»",
        send: "Ёфтан",
        matched: "Ҷавоби шумо ба ин вариант наздик аст:",
        accept: "Қабул",
        change: "Дигар кардан",
        none: "Ҷавобро ба ягон вариант пайваст карда натавонистем. Каме дигар нависед ё вариантро интихоб кунед.",
    },
    ru: {
        title: "Вашего ответа нет в списке?",
        hint: "Напишите своими словами — AI найдёт самый близкий вариант и покажет его вам. Баллы считаются так же, как при выборе варианта.",
        placeholder: "Например: «о животных и природе»",
        send: "Найти",
        matched: "Ваш ответ ближе всего к варианту:",
        accept: "Принять",
        change: "Изменить",
        none: "Не удалось сопоставить ответ с вариантом. Напишите иначе или выберите вариант.",
    },
    en: {
        title: "Your answer is not listed?",
        hint: "Write it in your own words — AI will find the closest option and show it to you. It is scored the same as choosing that option.",
        placeholder: "For example: “about animals and nature”",
        send: "Find",
        matched: "Your answer is closest to:",
        accept: "Accept",
        change: "Change",
        none: "We could not match your answer to an option. Rephrase it or pick an option.",
    },
};

// Фаҳмондани фоизи ҳар самт: кадом ҷавобҳо хол доданд ва дар куҷо хол гум шуд.
const EXPLAIN_TEXT = {
    tj: {
        open: "Чаро ин фоиз?",
        why: "Фоиз = холҳое, ки ҷавобҳои шумо ба ин самт доданд, аз ҳадди имконпазир.",
        gave: "Ин ҷавобҳо ба ин самт ишора карданд",
        missed: "Дар ин саволҳо хол гум шуд",
        missedHint: "шумо интихоб кардед «{{chosen}}», вале «{{other}}» ба ин самт мувофиқ буд",
        none: "Ягон ҷавоб ба ин самт ишора накард.",
        careers: "Ихтисосҳои ин самт",
        allCareers: "Ҳамаи ихтисосҳои ин самт",
        more: "Боз {{count}}",
    },
    ru: {
        open: "Почему такой процент?",
        why: "Процент = баллы, которые ваши ответы дали этому направлению, от максимально возможных.",
        gave: "Эти ответы указали на это направление",
        missed: "Здесь баллы потеряны",
        missedHint: "вы выбрали «{{chosen}}», а к этому направлению подходил «{{other}}»",
        none: "Ни один ответ не указал на это направление.",
        careers: "Специальности этого направления",
        allCareers: "Все специальности направления",
        more: "Ещё {{count}}",
    },
    en: {
        open: "Why this percentage?",
        why: "Percentage = points your answers gave this direction out of the maximum possible.",
        gave: "These answers pointed to this direction",
        missed: "Points were lost here",
        missedHint: "you chose “{{chosen}}”, while “{{other}}” matched this direction",
        none: "None of your answers pointed to this direction.",
        careers: "Specialties in this direction",
        allCareers: "All specialties in this direction",
        more: "{{count}} more",
    },
};
const fill = (text, values) => text.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key] ?? "");

// Саволи «ду самт баробар»: чаро пайдо шуд ва ҳар самт чӣ гуна аст.
const TIE_TEXT = {
    tj: {
        why: "Ҷавобҳои шумо ба ин ду самт қариб баробар хол доданд. Дар поён бинед, ки ҳар самт чӣ гуна кор аст ва кадом ихтисосҳо дорад, ва онеро интихоб кунед, ки ба дилатон наздиктар аст — тавсияҳо аз рӯи ҳамин сохта мешаванд.",
        examples: "Масалан:",
    },
    ru: {
        why: "Ваши ответы дали этим двум направлениям почти одинаковые баллы. Ниже — чем занимаются в каждом и какие там специальности. Выберите то, что вам ближе: по нему будут подобраны рекомендации.",
        examples: "Например:",
    },
    en: {
        why: "Your answers gave these two directions almost equal points. Below is what each one is about and which specialties it has. Pick the one closer to you — recommendations will be based on it.",
        examples: "For example:",
    },
};

// Баъди санҷиш: қадамҳои мушаххас, то корбар донад, ки минбаъд чӣ кунад.
const NEXT_TEXT = {
    tj: {
        title: "Акнун чӣ кор кунам?",
        hint: "Санҷиш танҳо самтро нишон медиҳад. Барои интихоби ниҳоӣ ин қадамҳоро гузаред:",
        steps: [
            ["Ихтисосҳоро шинос шавед", "2–3 ихтисоси боло ё поёнро кушоед: чӣ кор мекунанд, маош, бали гузариш ва дар куҷо мехонанд."],
            ["Муқоиса кунед", "2–3 ихтисоси маъқулро паҳлӯи ҳам гузоред — AI фарқ ва ояндаи онҳоро мефаҳмонад."],
            ["Ҷойи таҳсилро интихоб кунед", "Дар харита муассисаҳоеро бинед, ки ин ихтисосҳоро доранд: нарх, ҷойи ройгон ва шаҳр."],
            ["Ҳуҷҷатҳоро омода кунед", "Рӯйхати ҳуҷҷатсупорӣ: чӣ лозим аст ва то кай."],
            ["Ҳанӯз шубҳа доред?", "Ба ёвари овозӣ ё чати AI нависед: «кадом ихтисос барои ман беҳтар аст?»"],
        ],
        steps9: "Баъди синфи 9 — танҳо коллеҷҳо нишон дода мешаванд.",
        open: ["Ихтисосҳо", "Муқоиса", "Харита", "Ҳуҷҷатҳо", "Чати AI"],
        both: "Шумо ҳарду самтро интихоб кардед — дар «Ҳамаи панҷ самт» самти дуюмро кушоед ва ихтисосҳои онро низ бинед.",
    },
    ru: {
        title: "Что делать дальше?",
        hint: "Тест показывает только направление. Чтобы выбрать окончательно, пройдите эти шаги:",
        steps: [
            ["Познакомьтесь со специальностями", "Откройте 2–3 специальности: чем занимаются, зарплата, проходной балл и где учиться."],
            ["Сравните", "Поставьте 2–3 понравившиеся специальности рядом — AI объяснит разницу и перспективы."],
            ["Выберите, где учиться", "На карте — учебные заведения с этими специальностями: цена, бюджетные места, город."],
            ["Подготовьте документы", "План подачи документов: что нужно и до какого срока."],
            ["Остались сомнения?", "Спросите голосового помощника или AI-чат: «какая специальность мне подходит больше?»"],
        ],
        steps9: "После 9 класса показываются только колледжи.",
        open: ["Специальности", "Сравнение", "Карта", "Документы", "AI-чат"],
        both: "Вы выбрали оба направления — откройте второе в блоке «Все пять направлений» и посмотрите его специальности тоже.",
    },
    en: {
        title: "What should I do next?",
        hint: "The test only shows a direction. To make the final choice, go through these steps:",
        steps: [
            ["Get to know the specialties", "Open 2–3 specialties: what they do, salary, entry score and where to study."],
            ["Compare", "Put 2–3 specialties you like side by side — AI explains the difference and prospects."],
            ["Choose where to study", "On the map — institutions with these specialties: price, free places, city."],
            ["Prepare documents", "The application plan: what is needed and by when."],
            ["Still unsure?", "Ask the voice assistant or AI chat: “which specialty suits me better?”"],
        ],
        steps9: "After grade 9, only colleges are shown.",
        open: ["Specialties", "Compare", "Map", "Documents", "AI chat"],
        both: "You chose both directions — open the second one in “All five directions” and look at its specialties too.",
    },
};

const shuffledOrder = (id, count) => {
    // Саволи «баробар»: ду самт ва «Не знаю — оба» ҳамеша дар охир — бе омехта.
    if (id === "tiebreak") return Array.from({ length: count }, (_, i) => i);
    let h = SHUFFLE_SEED;
    for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const order = Array.from({ length: count }, (_, i) => i);
    for (let i = count - 1; i > 0; i--) {
        h = (h * 1103515245 + 12345) >>> 0;
        const j = h % (i + 1);
        [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
};
const STAGE2_COUNT = 5;

const Quiz = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { token, user, updateUser, logout } = useAuthStore();
    const { error: showError } = useToast();
    const [questions, setQuestions] = useState([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [quizStage, setQuizStage] = useState(1);
    const [answers, setAnswers] = useState([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(true);
    const [askRetake, setAskRetake] = useState(false);

    const [clusterCareers, setClusterCareers] = useState([]);
    const [savedIds, setSavedIds] = useState(new Set());
    const [savingId, setSavingId] = useState(null);
    const [stageLoading, setStageLoading] = useState(false);
    const [clusterPage, setClusterPage] = useState(1);
    const [clusterLastPage, setClusterLastPage] = useState(1);
    const [refreshingCareers, setRefreshingCareers] = useState(false);
    const [specOffset, setSpecOffset] = useState(0);
    const [showAllMatched, setShowAllMatched] = useState(false);
    // Пеш аз санҷиш: «баъди кадом синф?» — синфи 9 танҳо коллеҷ, синфи 11 коллеҷ ва донишгоҳ.
    const [gradeConfirmed, setGradeConfirmed] = useState(false);
    const pickGrade = (value) => {
        setGrade(value);
        setGradeConfirmed(true);
    };

    useEffect(() => {
        if (user?.savedCareers) {
            setSavedIds(new Set(user.savedCareers.map(c => c.id)));
        } else {
            setSavedIds(new Set());
        }
    }, [user?.savedCareers]);

    useEffect(() => {
        const saved = localStorage.getItem(QUIZ_STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setResults(parsed);
                setAskRetake(true);
            } catch (_) {
                localStorage.removeItem(QUIZ_STORAGE_KEY);
            }
        }
    }, []);

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const { data } = await axios.get(`${API}/quiz/questions`);
                setQuestions(data);
            } catch (err) {
                console.error("Fetch questions error:", err);
                showError(t('quiz.load_error_desc', 'Хатогӣ дар боргузорӣ. Лутфан дертар кӯшиш кунед.'));
            } finally {
                setLoading(false);
            }
        };
        fetchQuestions();
    }, []);

    // Тугмаи ⚡ саҳифаи тасодуфии дигари кластерро меорад, на ҳамон 12-тои аввалро.
    const fetchClusterCareers = async (shuffle = false) => {
        if (!results?.topCluster?.id || refreshingCareers) return;
        setRefreshingCareers(shuffle);
        try {
            let page = 1;
            if (shuffle && clusterLastPage > 1) {
                do {
                    page = 1 + Math.floor(Math.random() * clusterLastPage);
                } while (page === clusterPage);
            }
            const { data } = await axios.get(`${API}/careers`, {
                params: { clusterId: results.topCluster.id, limit: CLUSTER_PAGE_SIZE, page, ...(results.grade ? { grade: results.grade } : {}) },
            });
            let careers = data.data || [];
            if (shuffle) careers = [...careers].sort(() => Math.random() - 0.5);
            setClusterCareers(careers);
            setClusterPage(page);
            setClusterLastPage(data.meta?.lastPage || 1);
            if (shuffle) setSpecOffset((offset) => offset + SPEC_WINDOW);
        } catch (err) {
            console.error("Cluster careers fetch error:", err);
        } finally {
            setRefreshingCareers(false);
        }
    };


    const handleSaveCareer = async (career) => {
        if (!token) { navigate(`/login?next=${encodeURIComponent("/quiz")}`); return; }
        if (savingId) return;
        setSavingId(career.id);
        try {
            await axios.post(`${API}/users/save-career/${career.id}`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSavedIds(prev => {
                const next = new Set(prev);
                if (next.has(career.id)) { next.delete(career.id); }
                else { next.add(career.id); }
                return next;
            });
            const currentSaved = user?.savedCareers || [];
            const alreadySaved = currentSaved.some(c => c.id === career.id);
            const updatedSaved = alreadySaved
                ? currentSaved.filter(c => c.id !== career.id)
                : [...currentSaved, career];
            updateUser({ savedCareers: updatedSaved });
        } catch (err) {
            console.error("Save career error:", err);
            showError(err.response?.data?.message || err.message || t("career_page.failed"));
        } finally {
            setSavingId(null);
        }
    };

    // Клики дубора ҳангоми боркунӣ саволҳои қадами 2-ро чанд бор илова мекард (15 → 570 савол).
    const busyRef = useRef(false);
    // Ҳолати охирин: тугмаҳои саволи қаблӣ ҳангоми аниматсияи гузариш ҳанӯз дар экран
    // ҳастанд ва бо маълумоти кӯҳна кор мекарданд (қадами 2 такрор илова мешуд).
    const latest = useRef({});
    const gradePending = !gradeConfirmed && currentStep === 0 && answers.length === 0 && !showResults && !askRetake;
    latest.current = { questions, currentStep, quizStage, answers, gradePending, idle: !showResults && !isAnalyzing && !askRetake && !loading };

    // Ёвар синфро иваз кард («я после 9 класса») — савол ҷавоб гирифт.
    useEffect(() => {
        const onGrade = (event) => {
            if (event.detail === 9 || event.detail === 11) setGradeConfirmed(true);
        };
        window.addEventListener(GRADE_EVENT, onGrade);
        return () => window.removeEventListener(GRADE_EVENT, onGrade);
    }, []);

    const handleAnswer = async (selectedValue, clickedQuestionId) => {
        if (busyRef.current) return;
        const { questions, currentStep, quizStage, answers } = latest.current;
        const questionId = questions[currentStep]?.id;
        if (!questionId || (clickedQuestionId && clickedQuestionId !== questionId)) return;
        if (questionId === "tiebreak") {
            selectedValue = questions[currentStep].options[Number(selectedValue)]?.value ?? selectedValue;
        }
        const newAnswers = [
            ...answers.filter((answer) => answer.questionId !== questionId),
            { questionId, selectedValue },
        ];
        setAnswers(newAnswers);

        if (currentStep < questions.length - 1) {
            setCurrentStep(currentStep + 1);
            latest.current.currentStep = currentStep + 1;
        } else if (quizStage === 1 || quizStage === "tiebreak") {
            busyRef.current = true;
            setStageLoading(true);
            try {
                let clusterKey;
                if (quizStage === "tiebreak") {
                    // «Ҳарду» → самти холаш баландтар (варианти аввал); бонуси интихоб дода намешавад.
                    clusterKey = String(selectedValue) === "both"
                        ? String(questions[currentStep].options[0].value)
                        : String(selectedValue);
                } else {
                    // Танҳо холҳо (бе AI) — ҷавоб фавран.
                    const { data } = await axios.post(`${API}/quiz/score`, { answers: newAnswers });
                    const ranked = Object.entries(data?.scores?.mmtClusters || {})
                        .sort((a, b) => b[1] - a[1]);
                    const [first, second] = ranked;
                    // Ду самт қариб баробар — аз худи корбар мепурсем, на тасодуфан интихоб.
                    if (first && second && first[1] - second[1] < 0.15 * Math.max(first[1], 1)) {
                        const tiebreak = {
                            id: "tiebreak",
                            part: "tiebreak",
                            type: "refinement",
                            question: {
                                tj: "Ду самт ба шумо баробар наздик баромад. Кадомаш ба дилатон наздиктар аст?",
                                ru: "Два направления вам одинаково близки. Какое ближе вашему сердцу?",
                                en: "Two directions suit you equally. Which one is closer to your heart?",
                            },
                            // Фоиз (холҳо дар миқёси 0–40) — то корбар бинад, ки чаро савол пайдо шуд.
                            options: [
                                ...[first, second].map(([key, score]) => ({ value: key, cluster: key, percent: Math.round(((Number(score) || 0) / 40) * 100) })),
                                // Корбар ҳанӯз интихоб карда наметавонад — бо самти баландтар идома медиҳем,
                                // дар натиҷа самти дуюм ҳам нишон дода мешавад.
                                {
                                    value: "both",
                                    text: {
                                        tj: "Намедонам — ҳарду ба ман наздиканд",
                                        ru: "Не знаю — мне близки оба",
                                        en: "I don't know — both are close to me",
                                    },
                                },
                            ],
                        };
                        setQuestions((prev) => [...prev.filter((q) => q.id !== "tiebreak"), tiebreak]);
                        setQuizStage("tiebreak");
                        setCurrentStep((prev) => prev + 1);
                        return;
                    }
                    clusterKey = first?.[0] || "c1";
                }
                const { data: stage2Qs } = await axios.get(
                    `${API}/quiz/specialty-questions`,
                    { params: { clusterNumber: clusterKey.replace(/\D/g, "") || "1" } }
                );
                if (stage2Qs?.length > 0) {
                    setQuestions(prev => {
                        const known = new Set(prev.map((q) => q.id));
                        return [...prev, ...stage2Qs.filter((q) => !known.has(q.id))];
                    });
                    setQuizStage(2);
                    setCurrentStep(prev => prev + 1);
                } else {
                    busyRef.current = false;
                    submitQuiz(newAnswers);
                }
            } catch (err) {
                console.error('Stage 1 error:', err);
                busyRef.current = false;
                submitQuiz(newAnswers);
            } finally {
                setStageLoading(false);
                busyRef.current = false;
            }
        } else {
            submitQuiz(newAnswers);
        }
    };

    // Клавиатура: A–E ё 1–5 ҷавобро интихоб мекунад (ба ҳамон тартибе, ки дар экран аст).
    const answerRef = useRef(handleAnswer);
    answerRef.current = handleAnswer;
    useEffect(() => {
        const onKey = (event) => {
            if (event.ctrlKey || event.metaKey || event.altKey) return;
            if (/^(INPUT|TEXTAREA|SELECT)$/.test(event.target?.tagName || "")) return;
            const { questions: list, currentStep: step, idle } = latest.current;
            if (!idle) return;
            const question = list?.[step];
            if (!question?.options?.length) return;
            const key = event.key.toLowerCase();
            const position = /^[1-9]$/.test(key) ? Number(key) - 1 : "abcde".indexOf(key);
            if (position < 0 || position >= question.options.length) return;
            const idx = shuffledOrder(question.id, question.options.length)[position];
            answerRef.current(idx, question.id);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    // Ёвари овозӣ: саволи ҷорӣ бо ҷавобҳо (ба тартиби экран) ба ӯ дода мешавад,
    // то онро хонад; ҷавоб ва «далее/назад»-и корбар аз ӯ бармегардад.
    const voiceQuestion = (() => {
        const question = questions[currentStep];
        const idle = !showResults && !isAnalyzing && !askRetake && !loading && !stageLoading;
        if (idle && gradePending) {
            const text = gradeText(i18n.language);
            return { id: "grade", step: -1, lang: i18n.language || "tj", question: text.pickTitle, options: [text.pick9, text.pick11] };
        }
        if (!idle || !question?.options?.length) return null;
        const lang = i18n.language || "tj";
        const text = typeof question.question === "string"
            ? question.question
            : question.question?.[lang] || question.question?.tj || "";
        const options = shuffledOrder(question.id, question.options.length).map((idx) => {
            const option = question.options[idx];
            return option.cluster
                ? clusterLabel(t, { clusterId: Number(String(option.cluster).replace(/\D/g, "")) })
                : typeof option.text === "string" ? option.text : option.text?.[lang] || option.text?.tj || "";
        });
        return { id: question.id, step: currentStep, lang, question: text, options };
    })();
    const voiceKey = voiceQuestion ? `${voiceQuestion.id}|${voiceQuestion.lang}` : "";
    useEffect(() => {
        window.__quizVoice = voiceQuestion;
        window.dispatchEvent(new CustomEvent("quiz:question", { detail: voiceQuestion }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [voiceKey]);
    useEffect(() => () => {
        window.__quizVoice = null;
        window.dispatchEvent(new CustomEvent("quiz:question", { detail: null }));
    }, []);
    const [openCluster, setOpenCluster] = useState(null);
    const [showAllReasons, setShowAllReasons] = useState(false);
    const [clusterIds, setClusterIds] = useState({});
    const [clusterPreview, setClusterPreview] = useState({});
    const toggleCluster = async (key, number) => {
        setShowAllReasons(false);
        if (openCluster === key) {
            setOpenCluster(null);
            return;
        }
        setOpenCluster(key);
        if (clusterPreview[key]) return;
        try {
            let ids = clusterIds;
            if (!ids[number]) {
                const { data } = await axios.get(`${API}/clusters`);
                ids = Object.fromEntries((Array.isArray(data) ? data : data?.data || []).map((cluster) => [cluster.clusterId, cluster.id]));
                setClusterIds(ids);
            }
            const id = ids[number];
            if (!id) return;
            const { data } = await axios.get(`${API}/careers`, { params: { clusterId: id, limit: 6, page: 1, ...(results?.grade ? { grade: results.grade } : {}) } });
            setClusterPreview((old) => ({ ...old, [key]: { id, careers: data?.data || [], total: data?.meta?.total || 0 } }));
        } catch {
            setClusterPreview((old) => ({ ...old, [key]: { id: null, careers: [], total: 0 } }));
        }
    };

    // Ихтисосҳои мисолӣ барои ду самти баробар (бо синфи интихобшуда).
    const [tieExamples, setTieExamples] = useState({});
    const tieKey = questions[currentStep]?.id === "tiebreak"
        ? questions[currentStep].options.map((option) => option.cluster).join(",")
        : "";
    useEffect(() => {
        if (!tieKey) return undefined;
        let cancelled = false;
        (async () => {
            try {
                const grade = getGrade();
                const { data } = await axios.get(`${API}/clusters`);
                const ids = Object.fromEntries((Array.isArray(data) ? data : []).map((cluster) => [cluster.clusterId, cluster.id]));
                const found = {};
                for (const key of tieKey.split(",")) {
                    const id = ids[Number(String(key).replace(/\D/g, ""))];
                    if (!id) continue;
                    const res = await axios.get(`${API}/careers`, {
                        params: withLang({ clusterId: id, limit: 4, page: 1, ...(grade ? { grade } : {}) }),
                    });
                    found[key] = (res.data?.data || []).map((career) => displayName(careerName(career, i18n.language)));
                }
                if (!cancelled) setTieExamples(found);
            } catch {
                /* мисолҳо намоён намешаванд — савол бе онҳо ҳам кор мекунад */
            }
        })();
        return () => { cancelled = true; };
    }, [tieKey, i18n.language]);

    const [ownText, setOwnText] = useState("");
    const [ownLoading, setOwnLoading] = useState(false);
    const [ownMatch, setOwnMatch] = useState(null);
    const [ownNone, setOwnNone] = useState(false);
    useEffect(() => {
        setOwnText("");
        setOwnMatch(null);
        setOwnNone(false);
    }, [voiceKey]);

    // Ҷавоби озод → варианти наздиктарин. Аз ёвар (fromVoice) — фавран қабул
    // мешавад ва ёвар мегӯяд, ки кадом вариант интихоб шуд.
    const interpretOwn = async (text, fromVoice = false) => {
        const quiz = window.__quizVoice;
        const said = String(text || "").trim();
        if (!quiz || !said || ownLoading) return;
        setOwnLoading(true);
        setOwnNone(false);
        setOwnMatch(null);
        let position = null;
        try {
            const { data } = await axios.post(`${API}/quiz/interpret`, {
                question: quiz.question, options: quiz.options, text: said, lang: quiz.lang,
            }, { timeout: 12000 });
            position = Number.isInteger(data?.position) ? data.position : null;
        } catch {
            position = null;
        } finally {
            setOwnLoading(false);
        }
        if (window.__quizVoice?.id !== quiz.id) return;
        if (fromVoice) {
            window.dispatchEvent(new CustomEvent("quiz:matched", {
                detail: { position, option: position === null ? "" : quiz.options[position] },
            }));
            if (position !== null) {
                const { questions: list, currentStep: step } = latest.current;
                const question = list?.[step];
                if (question?.id === quiz.id) answerRef.current(shuffledOrder(question.id, question.options.length)[position], question.id);
            }
            return;
        }
        if (position === null) setOwnNone(true);
        else setOwnMatch({ position, option: quiz.options[position] });
    };
    const interpretRef = useRef(interpretOwn);
    interpretRef.current = interpretOwn;

    const acceptOwn = () => {
        const { questions: list, currentStep: step } = latest.current;
        const question = list?.[step];
        if (!question || !ownMatch) return;
        answerRef.current(shuffledOrder(question.id, question.options.length)[ownMatch.position], question.id);
    };

    useEffect(() => {
        const onCommand = (event) => {
            const command = event.detail || {};
            const { questions: list, currentStep: step, answers: given, idle, gradePending: asking } = latest.current;
            if (!idle) return;
            if (asking) {
                if (command.type === "answer" && (command.position === 0 || command.position === 1)) {
                    pickGrade(command.position === 0 ? 9 : 11);
                }
                return;
            }
            const question = list?.[step];
            if (!question?.options?.length) return;
            if (command.type === "answer") {
                if (command.position < 0 || command.position >= question.options.length) return;
                answerRef.current(shuffledOrder(question.id, question.options.length)[command.position], question.id);
            } else if (command.type === "free") {
                interpretRef.current(command.text, true);
            } else if (command.type === "back" && step > 0) {
                setCurrentStep(step - 1);
            } else if (command.type === "next" && given.some((answer) => answer.questionId === question.id) && step < list.length - 1) {
                setCurrentStep(step + 1);
            }
        };
        window.addEventListener("quiz:command", onCommand);
        return () => window.removeEventListener("quiz:command", onCommand);
    }, []);

    // Ҷавобҳо бо матни савол ва интихоб — барои саҳифаи натиҷа ва ёвар.
    const enrich = (data, finalAnswers) => {
        const activeLang = i18n.language || "tj";
        const answeredQuestions = finalAnswers.map((answer) => {
            const question = questions.find((q) => q.id === answer.questionId);
            const selectedOption = question?.options?.[Number(answer.selectedValue)];
            return {
                questionId: answer.questionId,
                type: question?.type,
                part: question?.part,
                targetCluster: question?.targetCluster,
                question: question?.question?.[activeLang] || question?.question?.tj || question?.question?.en || "",
                selectedValue: answer.selectedValue,
                selectedText: selectedOption?.text?.[activeLang] || selectedOption?.text?.tj || selectedOption?.text?.en || "",
                scores: selectedOption?.scores || null,
                keywords: selectedOption?.keywords || [],
            };
        });
        return {
            ...data,
            answers: answeredQuestions,
            rawAnswers: finalAnswers,
            answeredAt: new Date().toISOString(),
            quizLang: activeLang,
        };
    };

    const showQuizResults = (data, finalAnswers) => {
        const enrichedData = enrich(data, finalAnswers);
        setResults(enrichedData);
        try {
            localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(enrichedData));
        } catch {
            /* хотираи браузер пур ё баста — натиҷа дар экран мемонад */
        }
        busyRef.current = false;
        setIsAnalyzing(false);
        setShowResults(true);
    };

    const submitQuiz = async (finalAnswers) => {
        if (busyRef.current) return;
        busyRef.current = true;
        setIsAnalyzing(true);
        const body = { answers: finalAnswers, lang: i18n.language, grade: getGrade() };
        try {
            const url = token ? `${API}/quiz/submit-authenticated` : `${API}/quiz/submit`;
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const { data } = await axios.post(url, body, { headers });
            if (token) updateUser({ quizResults: data.scores });
            showQuizResults(data, finalAnswers);
        } catch (err) {
            console.error("Submit quiz error:", err);
            // Сессия гузашт — натиҷаро ҳамчун меҳмон ҳисоб мекунем, то ҷавобҳо гум нашаванд.
            if (err.response?.status === 401 && token) {
                logout();
                try {
                    const { data } = await axios.post(`${API}/quiz/submit`, body);
                    showQuizResults(data, finalAnswers);
                    return;
                } catch (retryErr) {
                    console.error("Retry submission failed:", retryErr);
                }
            }
            busyRef.current = false;
            setIsAnalyzing(false);
            // Пештар хато хомӯш буд: корбар намедонист, ки чӣ шуд. Ҷавобҳо мемонанд — метавон боз фиристод.
            showError(err.response?.data?.message || err.message || t("career_page.failed"));
        }
    };

    const handleRetake = () => {
        localStorage.removeItem(QUIZ_STORAGE_KEY);
        setResults(null);
        setAskRetake(false);
        setClusterCareers([]);
        setClusterPage(1);
        setClusterLastPage(1);
        setSpecOffset(0);
        setQuizStage(1);
        setSavedIds(new Set(user?.savedCareers?.map(c => c.id) || []));
        setAnswers([]);
        setCurrentStep(0);
        setGradeConfirmed(false);
        axios.get(`${API}/quiz/questions`).then(({ data }) => setQuestions(data)).catch(() => {});
    };

    const handleViewPrevious = () => {
        setAskRetake(false);
        setShowResults(true);
    };

    const totalExpected = quizStage === 2 ? questions.length : questions.filter((q) => q.id !== "tiebreak").length + STAGE2_COUNT;
    const progress = totalExpected > 0 ? Math.min(100, ((currentStep + 1) / totalExpected) * 100) : 0;
    const answeredCount = answers.length;
    const stageLabel = quizStage === 1 ? t('misc.quiz_stage_1') : t('misc.quiz_stage_2');

    const getIcon = (type) => {
        switch (type) {
            case "Realistic": return Zap;
            case "Investigative": return Search;
            case "Artistic": return Sparkles;
            case "Social": return Users;
            case "Enterprising": return Target;
            case "Conventional": return FileText;
            default: return LogoMark;
        }
    };

    if (askRetake && results) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center px-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card glass-card-glow p-10 text-center max-w-md w-full space-y-6"
                >
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                        <Trophy className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">
                            {t('quiz.previous_result_title', "Натиҷаи пештара мавҷуд аст")}
                        </h2>
                        <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                            {t('quiz.previous_result_desc', "Шумо қаблан квизро гузаштед ва натиҷаҳо захира карда шудаанд. Мехоҳед натиҷаҳоро бубинед ё аз нав санҷиш гузаред?")}
                        </p>
                        {results.topCluster && (
                            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest">
                                <Award className="w-3.5 h-3.5" />
                                {clusterLabel(t, results.topCluster)}
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleViewPrevious}
                            className="btn-primary w-full !py-4 !text-sm cursor-pointer"
                        >
                            {t('quiz.view_results', "Натиҷаҳоро бубинед")}
                            <ArrowRight className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleRetake}
                            className="glass-card w-full !p-4 hover:bg-white/5 transition-colors text-sm font-black uppercase tracking-widest cursor-pointer"
                        >
                            {t('quiz.retake', "Аз нав санҷиш гузаред")}
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    if (!questions || questions.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6">
                <div className="p-8 glass-card text-center max-w-md">
                    <h2 className="text-xl font-black uppercase tracking-tight mb-4">{t('quiz.load_error_title', "Хатогӣ дар боргузорӣ")}</h2>
                    <p className="text-muted-foreground text-sm mb-6">{t('quiz.load_error_desc', "Саволҳо ёфт нашуданд. Лутфан дертар кӯшиш кунед ё ба маъмурият хабар диҳед.")}</p>
                    <Link to="/">
                        <button className="btn-primary px-8 py-3 text-xs w-full cursor-pointer">
                            {t('quiz.back_home', "БА АСОСӢ")}
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    if (isAnalyzing) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6">
                <div className="relative w-16 h-16">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-full h-full border-2 border-primary/10 border-t-primary rounded-full shadow-[0_0_30px_rgba(99,102,241,0.2)]"
                    />
                    <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-primary animate-pulse" />
                </div>
                <div className="text-center space-y-1">
                    <h2 className="text-xl font-black tracking-tight uppercase">{t('quiz.analyzing')}</h2>
                    <p className="text-muted-foreground text-[8px] font-black uppercase tracking-[0.3em] animate-pulse">
                        {t('quiz.analyzing', 'Таҳлили маълумот...')}
                    </p>
                </div>
            </div>
        );
    }

    const mmtClusterLabel = (key) => {
        const cluster = MMT_CLUSTERS.find((c) => c.key === key);
        return cluster ? t(cluster.i18nKey, cluster.fallback) : key.toUpperCase();
    };

    if (showResults && results) {
        const topCluster = results.topCluster;
        // Ихтисосҳое, ки аз рӯи ҷавобҳои қадами 2 интихоб шудаанд (на рӯйхати умумии кластер).
        const matched = (topCluster?.specializations || []).filter(
            (spec, index, list) => list.findIndex((other) => other.name === spec.name) === index,
        );
        const visibleMatched = showAllMatched ? matched : matched.slice(0, 6);
        const aiAdvice = results.aiAdvice || "";
        // Холҳо дар миқёси 0–40 (сервер ба ин миқёс мувофиқ мекунад).
        const rankedClusters = Object.entries(results.scores?.mmtClusters || {})
            .map(([key, score]) => ({
                key,
                number: Number(key.replace(/\D/g, "")),
                label: mmtClusterLabel(key),
                raw: Number(score) || 0,
                percent: Math.max(0, Math.min(100, Math.round(((Number(score) || 0) / 40) * 100))),
            }))
            .sort((a, b) => b.raw - a.raw);
        const [first, second] = rankedClusters;
        const explain = EXPLAIN_TEXT[i18n.language] || EXPLAIN_TEXT.tj;
        const lang = i18n.language || "tj";
        // Нохунаки худи матн бардошта мешавад — вагарна «««…»»» дукарата мешуд.
        const pickText = (value) => String(typeof value === "string" ? value : value?.[lang] || value?.tj || value?.en || "")
            .trim().replace(/^[«"“]+|[»"”]+$/g, "");
        const reasonsFor = (key) => {
            const gave = [];
            const missed = [];
            for (const answer of results.answers || results.rawAnswers || []) {
                const question = questions.find((q) => q.id === answer.questionId);
                if (!question || question.part !== "mmt") continue;
                const chosen = question.options?.[Number(answer.selectedValue)];
                if (!chosen) continue;
                const points = Number(chosen.scores?.[key]) || 0;
                const best = question.options
                    .map((option) => ({ option, points: Number(option.scores?.[key]) || 0 }))
                    .sort((a, b) => b.points - a.points)[0];
                const item = { id: question.id, question: pickText(question.question), chosen: pickText(chosen.text) };
                if (points > 0) gave.push({ ...item, points });
                else if (best?.points > 0) missed.push({ ...item, other: pickText(best.option.text), points: best.points });
            }
            gave.sort((a, b) => b.points - a.points);
            missed.sort((a, b) => b.points - a.points);
            return { gave, missed };
        };
        const isClose = first && second && first.raw - second.raw < 0.15 * Math.max(first.raw, 1);

        return (
            <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
                <motion.section
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-[2rem] border border-border bg-card p-6 sm:p-8 text-center"
                >
                    <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary">
                        <Trophy className="w-4 h-4" aria-hidden="true" />
                        {t('quiz.analysis_success')}
                    </div>
                    <p className="mt-5 text-sm font-semibold text-muted-foreground">{t('quiz.your_direction', 'Самти ба шумо мувофиқ')}</p>
                    <h1 className="mt-1 text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                        {topCluster ? clusterLabel(t, topCluster) : t('quiz.cluster_not_defined')}
                    </h1>
                    {topCluster && (
                        <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
                            {clusterDescription(t, topCluster, "")}
                        </p>
                    )}
                    {results.grade === 9 && (
                        <p className="mx-auto mt-3 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-bold text-primary">
                            {gradeText(i18n.language).results9}
                        </p>
                    )}
                    {isClose && second && (
                        <p className="mx-auto mt-4 max-w-xl rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-foreground">
                            {t('quiz.close_second', { defaultValue: 'Самти «{{name}}» низ ба шумо хеле наздик аст — бо ихтисосҳои он ҳам шинос шавед.', name: second.label })}
                        </p>
                    )}
                </motion.section>

                <section className="rounded-[2rem] border border-border bg-card p-6 sm:p-8">
                    <h2 className="text-lg font-black text-foreground">{t('quiz.all_directions', 'Ҳамаи панҷ самт')}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{t('quiz.all_directions_hint', 'Чӣ қадар ҷавобҳои шумо ба ҳар самт мувофиқ омаданд.')}</p>
                    <ul className="mt-5 space-y-2">
                        {rankedClusters.map((cluster, index) => {
                            const isOpen = openCluster === cluster.key;
                            const reasons = isOpen ? reasonsFor(cluster.key) : null;
                            const preview = clusterPreview[cluster.key];
                            const limit = showAllReasons ? 99 : 3;
                            return (
                                <li key={cluster.key} className={`rounded-2xl ${isOpen ? "bg-muted/40" : ""}`}>
                                    <button
                                        type="button"
                                        onClick={() => toggleCluster(cluster.key, cluster.number)}
                                        aria-expanded={isOpen}
                                        className="w-full rounded-2xl px-3 py-2.5 text-left cursor-pointer hover:bg-muted/40 focus-ring"
                                    >
                                        <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                                            <span className={`font-bold ${index === 0 ? "text-foreground" : "text-muted-foreground"}`}>
                                                {cluster.number}. {cluster.label}
                                            </span>
                                            <span className="flex items-center gap-1.5 font-black tabular-nums text-foreground">
                                                {cluster.percent}%
                                                <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`} aria-hidden="true" />
                                            </span>
                                        </div>
                                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted" role="presentation">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${cluster.percent}%` }}
                                                transition={{ duration: 0.6, delay: index * 0.06 }}
                                                className={`h-full rounded-full ${index === 0 ? "bg-primary" : "bg-primary/35"}`}
                                            />
                                        </div>
                                        {!isOpen && (
                                            <div className="mt-1.5 text-[12px] font-semibold text-primary">{explain.open}</div>
                                        )}
                                    </button>

                                    {isOpen && (
                                        <div className="space-y-4 px-3 pb-4 pt-1 text-sm">
                                            <p className="text-[13px] text-muted-foreground">{explain.why}</p>

                                            {reasons.gave.length > 0 ? (
                                                <div>
                                                    <div className="font-bold text-foreground">✓ {explain.gave}</div>
                                                    <ul className="mt-2 space-y-2">
                                                        {reasons.gave.slice(0, limit).map((item) => (
                                                            <li key={item.id} className="rounded-xl bg-card p-3">
                                                                <div className="text-[13px] text-muted-foreground">{item.question}</div>
                                                                <div className="mt-0.5 font-semibold text-foreground">«{item.chosen}»</div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ) : (
                                                <p className="font-semibold text-muted-foreground">{explain.none}</p>
                                            )}

                                            {reasons.missed.length > 0 && (
                                                <div>
                                                    <div className="font-bold text-foreground">○ {explain.missed}</div>
                                                    <ul className="mt-2 space-y-2">
                                                        {reasons.missed.slice(0, limit).map((item) => (
                                                            <li key={item.id} className="rounded-xl border border-dashed border-border p-3">
                                                                <div className="text-[13px] text-muted-foreground">{item.question}</div>
                                                                <div className="mt-0.5 text-foreground">{fill(explain.missedHint, item)}</div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {!showAllReasons && (reasons.gave.length > 3 || reasons.missed.length > 3) && (
                                                <button type="button" onClick={() => setShowAllReasons(true)} className="text-[13px] font-bold text-primary cursor-pointer">
                                                    {fill(explain.more, { count: Math.max(0, reasons.gave.length - 3) + Math.max(0, reasons.missed.length - 3) })}
                                                </button>
                                            )}

                                            <div>
                                                <div className="font-bold text-foreground">{explain.careers}</div>
                                                {!preview ? (
                                                    <Loader2 className="mt-2 w-4 h-4 animate-spin text-muted-foreground" />
                                                ) : (
                                                    <>
                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                            {preview.careers.map((career) => (
                                                                <Link
                                                                    key={career.id}
                                                                    to={`/info/${career.id}`}
                                                                    className="rounded-full border border-border bg-card px-3 py-1.5 text-[13px] font-semibold text-foreground hover:border-primary"
                                                                >
                                                                    {displayName(careerName(career, i18n.language))}
                                                                </Link>
                                                            ))}
                                                        </div>
                                                        {preview.id && (
                                                            <Link
                                                                to={`/careers?clusterId=${preview.id}`}
                                                                className="mt-3 inline-flex items-center gap-1 text-[13px] font-bold text-primary"
                                                            >
                                                                {explain.allCareers}{preview.total ? ` (${preview.total})` : ""}
                                                                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                                                            </Link>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </section>

                {aiAdvice && (
                    <section className="rounded-[2rem] border border-primary/25 bg-primary/5 p-6 sm:p-8">
                        <div className="flex items-center gap-2 text-sm font-black text-primary">
                            <Sparkles className="w-4 h-4" aria-hidden="true" />
                            {t('quiz.ai_advice_title')}
                        </div>
                        <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-foreground/90">{aiAdvice}</p>
                    </section>
                )}

                {matched.length > 0 && (
                    <section className="rounded-[2rem] border border-border bg-card p-6 sm:p-8">
                        <h2 className="text-lg font-black text-foreground">{t('quiz.matched_careers', 'Ихтисосҳое, ки ба ҷавобҳои шумо мувофиқанд')}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">{t('quiz.matched_hint', 'Аз рӯи ҷавобҳои қисми дуюм интихоб шуданд — аввал мувофиқтаринҳо.')}</p>
                        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {visibleMatched.map((career, index) => {
                                const isSaved = savedIds.has(career.id);
                                return (
                                    <article key={career.id || career.name} className="flex flex-col gap-2 rounded-2xl border border-border bg-muted/30 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-3 min-w-0">
                                                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-xs font-black text-primary">{index + 1}</span>
                                                <h3 className="text-[15px] font-bold leading-snug text-foreground">
                                                    <Link to={`/info/${career.id}`} className="hover:text-primary hover:underline">{displayName(careerName(career, i18n.language))}</Link>
                                                </h3>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleSaveCareer(career)}
                                                disabled={savingId === career.id}
                                                aria-pressed={isSaved}
                                                aria-label={t('career_page.save')}
                                                title={t('career_page.save')}
                                                className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border transition-colors cursor-pointer ${isSaved ? "border-secondary/40 bg-secondary/15 text-secondary" : "border-border text-muted-foreground hover:text-secondary"}`}
                                            >
                                                <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
                                            </button>
                                        </div>
                                        {(careerDescription(career, i18n.language) || career.purpose) && (
                                            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{displayName(careerDescription(career, i18n.language) || career.purpose)}</p>
                                        )}
                                        <div className="mt-auto flex items-center justify-between gap-3 pt-1">
                                            <span className="text-xs font-bold text-muted-foreground">
                                                {career.tuitionFee
                                                    ? t('misc2.per_year_long', { price: career.tuitionFee.toLocaleString('ru-RU') })
                                                    : ""}
                                            </span>
                                            <Link to={`/info/${career.id}`} className="inline-flex items-center gap-1 text-xs font-black text-primary-strong hover:underline">
                                                {t('common.read_more')}
                                                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                                            </Link>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                        {matched.length > 6 && (
                            <button
                                type="button"
                                onClick={() => setShowAllMatched((v) => !v)}
                                className="mt-4 w-full rounded-xl border border-border py-3 text-sm font-bold text-foreground hover:bg-muted cursor-pointer"
                            >
                                {showAllMatched ? t('quiz.show_less', 'Камтар нишон диҳед') : t('quiz.show_more', { defaultValue: 'Боз {{count}} ихтисос', count: matched.length - 6 })}
                            </button>
                        )}
                    </section>
                )}

                {(() => {
                    const next = NEXT_TEXT[i18n.language] || NEXT_TEXT.tj;
                    const choseBoth = (results.answers || results.rawAnswers || []).some(
                        (answer) => answer.questionId === "tiebreak" && String(answer.selectedValue) === "both",
                    );
                    const links = [
                        topCluster?.id ? `/careers?clusterId=${topCluster.id}` : "/careers",
                        "/dashboard/compare",
                        "/universities",
                        "/dashboard/plan",
                        "/dashboard/ai-chat",
                    ];
                    return (
                        <section className="rounded-[2rem] border border-border bg-card p-6 sm:p-8">
                            <h2 className="text-lg font-black text-foreground">{next.title}</h2>
                            <p className="mt-1 text-sm text-muted-foreground">{next.hint}</p>
                            {choseBoth && (
                                <p className="mt-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-foreground">{next.both}</p>
                            )}
                            <ol className="mt-5 space-y-3">
                                {next.steps.map(([title, desc], index) => (
                                    <li key={title} className="flex items-start gap-3 rounded-2xl bg-muted/30 p-4">
                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-black text-primary-foreground">
                                            {index + 1}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div className="font-bold text-foreground">{title}</div>
                                            <p className="mt-0.5 text-[14px] leading-snug text-muted-foreground">
                                                {desc}
                                                {index === 2 && results.grade === 9 ? ` ${next.steps9}` : ""}
                                            </p>
                                        </div>
                                        <Link
                                            to={links[index]}
                                            className="shrink-0 inline-flex items-center gap-1 self-center rounded-lg border border-border bg-card px-3 py-2 text-[13px] font-bold text-foreground hover:border-primary"
                                        >
                                            {next.open[index]}
                                            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                                        </Link>
                                    </li>
                                ))}
                            </ol>
                        </section>
                    );
                })()}

                <div className="flex flex-col gap-3 sm:flex-row">
                    {topCluster?.id && (
                        <Link to={`/careers?clusterId=${topCluster.id}`} className="btn-primary flex-1 justify-center !py-4 text-sm">
                            {t('quiz.more_in_cluster', 'Ҳамаи ихтисосҳои ин самт')}
                            <ArrowRight className="w-4 h-4" aria-hidden="true" />
                        </Link>
                    )}
                    <Link to="/dashboard" className="flex-1 rounded-xl border border-border bg-card py-4 text-center text-sm font-bold text-foreground hover:bg-muted">
                        {t('quiz.dashboard_btn')}
                    </Link>
                    <button
                        type="button"
                        onClick={handleRetake}
                        className="flex-1 rounded-xl border border-border bg-card py-4 text-sm font-bold text-foreground hover:bg-muted cursor-pointer"
                    >
                        {t('quiz.retake')}
                    </button>
                </div>
            </div>
        );
    }

    if (gradePending) {
        const text = gradeText(i18n.language);
        const stored = getGrade();
        return (
            <div className="max-w-xl mx-auto py-10 px-4">
                <div className="rounded-[1.75rem] border border-border bg-card shadow-sm p-6 sm:p-8 space-y-5">
                    <div className="space-y-2 text-center">
                        <h2 className="text-xl md:text-2xl font-black text-foreground tracking-tight">{text.pickTitle}</h2>
                        <p className="text-[15px] leading-relaxed text-muted-foreground">{text.pickDesc}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                        {[[9, text.pick9], [11, text.pick11]].map(([value, label], position) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => pickGrade(value)}
                                className={`w-full flex items-center gap-3 p-4 rounded-2xl border text-left text-base font-bold text-foreground cursor-pointer ${
                                    stored === value ? "border-primary bg-primary/10" : "border-border bg-muted/40 hover:border-primary/50"
                                }`}
                            >
                                <span className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-sm font-black bg-background border border-border text-muted-foreground">
                                    {String.fromCharCode(65 + position)}
                                </span>
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentStep];
    if (!currentQuestion || !Array.isArray(currentQuestion.options) || currentQuestion.options.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6">
                <div className="p-8 glass-card text-center max-w-md">
                    <h2 className="text-xl font-black uppercase tracking-tight mb-4">{t('quiz.load_error_title', "Хатогӣ дар боргузорӣ")}</h2>
                    <p className="text-muted-foreground text-sm mb-6">{t('quiz.load_error_desc', "Саволҳо ёфт нашуданд. Лутфан дертар кӯшиш кунед ё ба маъмурият хабар диҳед.")}</p>
                    <button onClick={handleRetake} className="btn-primary px-8 py-3 text-xs w-full cursor-pointer">
                        {t('quiz.retake', "Аз нав санҷиш гузаред")}
                    </button>
                </div>
            </div>
        );
    }

    const CurrentIcon = getIcon(currentQuestion.type);
    const currentAnswer = answers.find((answer) => answer.questionId === currentQuestion.id)?.selectedValue;
    const canGoNext = currentAnswer !== undefined && currentAnswer !== null;
    const activeLang = i18n.language || "tj";
    const own = OWN_TEXT[activeLang] || OWN_TEXT.tj;
    const questionText = typeof currentQuestion.question === "string"
        ? currentQuestion.question
        : currentQuestion.question?.[activeLang] || currentQuestion.question?.tj || "";
    const typeKey = String(currentQuestion.type || "").toLowerCase();
    const typeLabel = !typeKey ? ""
        : i18n.exists(`quiz.type_${typeKey}`) ? t(`quiz.type_${typeKey}`)
        : i18n.exists(`quiz.category.${typeKey}`) ? t(`quiz.category.${typeKey}`)
        : "";

    return (
        <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 relative">
            <div className="space-y-4 relative">
                <div className="flex items-center justify-between gap-4">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                            <LogoMark className="w-4 h-4" />
                            {stageLabel}
                        </div>
                        <h1 className="text-2xl font-black text-foreground tracking-tight leading-tight">
                            {t('quiz.title')}
                        </h1>
                    </div>

                    <div className="shrink-0 rounded-2xl border border-border bg-card px-4 py-2.5 flex items-center gap-4">
                        <div className="text-center">
                            <div className="text-lg font-black text-primary leading-none">{Math.round(progress)}%</div>
                            <div className="mt-1 text-[11px] font-semibold text-muted-foreground">{t('quiz.progress')}</div>
                        </div>
                        <div className="w-px h-8 bg-border" />
                        <div className="text-center">
                            <div className="text-lg font-black text-foreground leading-none">
                                {currentStep + 1}<span className="text-sm font-bold text-muted-foreground">/{totalExpected}</span>
                            </div>
                            <div className="mt-1 text-[11px] font-semibold text-muted-foreground">{t('quiz.question')}</div>
                        </div>
                    </div>
                </div>

                {typeLabel && (
                    <div className="text-sm font-semibold text-muted-foreground">{typeLabel}</div>
                )}

                <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-gradient-to-r from-primary to-accent-blue"
                    />
                </div>

                <AnimatePresence mode="wait">
                            {stageLoading && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-[2rem]"
                                >
                                    <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin mb-4"></div>
                                    <h3 className="text-xl font-black uppercase tracking-widest text-primary">{t("misc2.cluster_analysis")}</h3>
                                    <p className="text-sm text-muted-foreground mt-2">{t("quiz.preparing")}</p>
                                </motion.div>
                            )}
                    <motion.div
                        key={currentQuestion.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="rounded-[1.75rem] border border-border bg-card shadow-sm p-5 sm:p-8"
                    >
                        <div className="space-y-5 w-full max-w-lg mx-auto">
                            <div className="flex flex-col items-center gap-3 text-center">
                                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <CurrentIcon className="w-7 h-7 text-primary" />
                                </div>
                                <h2 className="text-xl md:text-2xl font-black text-foreground tracking-tight leading-snug">
                                    {questionText}
                                </h2>
                                {currentQuestion.id === "tiebreak" && (
                                    <p className="max-w-md text-[14px] leading-relaxed text-muted-foreground">
                                        {(TIE_TEXT[activeLang] || TIE_TEXT.tj).why}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-2.5">
                                {shuffledOrder(currentQuestion.id, currentQuestion.options.length).map((idx, position) => {
                                    const option = currentQuestion.options[idx];
                                    const selected = currentAnswer === (option.value ?? idx);
                                    const optionText = option.cluster
                                        ? clusterLabel(t, { clusterId: Number(String(option.cluster).replace(/\D/g, "")) })
                                        : typeof option.text === "string"
                                            ? option.text
                                            : option.text?.[activeLang] || option.text?.tj || "";
                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => handleAnswer(idx, currentQuestion?.id)}
                                            aria-pressed={selected}
                                            className={`w-full flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl border text-left text-[15px] sm:text-base font-semibold leading-snug text-foreground cursor-pointer ${
                                                selected
                                                    ? "border-primary bg-primary/10"
                                                    : "border-border bg-muted/40 hover:border-primary/50"
                                            }`}
                                        >
                                            <span
                                                className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-sm font-black ${
                                                    selected
                                                        ? "bg-primary text-white"
                                                        : "bg-background border border-border text-muted-foreground"
                                                }`}
                                            >
                                                {selected ? <Check className="w-4 h-4" /> : String.fromCharCode(65 + position)}
                                            </span>
                                            {option.cluster ? (
                                                <span className="flex-1">
                                                    <span className="flex items-center justify-between gap-3">
                                                        <span>{optionText}</span>
                                                        {typeof option.percent === "number" && (
                                                            <span className="text-sm font-black tabular-nums text-primary">{option.percent}%</span>
                                                        )}
                                                    </span>
                                                    <span className="mt-1 block text-[13px] font-normal leading-snug text-muted-foreground">
                                                        {clusterDescription(t, { clusterId: Number(String(option.cluster).replace(/\D/g, "")) })}
                                                    </span>
                                                    {tieExamples[option.cluster]?.length > 0 && (
                                                        <span className="mt-1.5 block text-[13px] font-medium leading-snug text-foreground/80">
                                                            {(TIE_TEXT[activeLang] || TIE_TEXT.tj).examples} {tieExamples[option.cluster].join(", ")}
                                                        </span>
                                                    )}
                                                </span>
                                            ) : (
                                                <span className="flex-1">{optionText}</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {currentQuestion.id !== "tiebreak" && (
                            <div className="rounded-2xl border border-dashed border-border p-3.5 sm:p-4 space-y-2.5">
                                <div className="flex items-start gap-2.5">
                                    <PenLine className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                                    <div>
                                        <div className="text-sm font-bold text-foreground">{own.title}</div>
                                        <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{own.hint}</p>
                                    </div>
                                </div>
                                <form
                                    className="flex gap-2"
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        interpretOwn(ownText);
                                    }}
                                >
                                    <input
                                        value={ownText}
                                        onChange={(event) => {
                                            setOwnText(event.target.value);
                                            setOwnMatch(null);
                                            setOwnNone(false);
                                        }}
                                        maxLength={300}
                                        placeholder={own.placeholder}
                                        aria-label={own.title}
                                        className="flex-1 min-w-0 rounded-xl border border-border bg-background px-3.5 py-2.5 text-[15px] text-foreground outline-none focus:border-primary"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!ownText.trim() || ownLoading}
                                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                                    >
                                        {ownLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                        {own.send}
                                    </button>
                                </form>
                                {ownMatch && (
                                    <div className="rounded-xl bg-primary/10 p-3 text-sm" role="status">
                                        <div className="text-muted-foreground">{own.matched}</div>
                                        <div className="mt-1 font-bold text-foreground">
                                            {String.fromCharCode(65 + ownMatch.position)}. {ownMatch.option}
                                        </div>
                                        <div className="mt-2.5 flex gap-2">
                                            <button type="button" onClick={acceptOwn} className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold cursor-pointer">
                                                {own.accept}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setOwnMatch(null)}
                                                className="px-4 py-2 rounded-lg border border-border bg-card text-sm font-bold text-foreground cursor-pointer"
                                            >
                                                {own.change}
                                            </button>
                                        </div>
                                    </div>
                                )}
                                {ownNone && (
                                    <p className="text-[13px] font-semibold text-destructive" role="status">{own.none}</p>
                                )}
                            </div>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>

                <div className="flex items-center gap-3 pt-1">
                    {currentStep > 0 && (
                        <button
                            type="button"
                            onClick={() => setCurrentStep(currentStep - 1)}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border bg-card text-sm font-bold text-foreground cursor-pointer"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            {t('quiz.back')}
                        </button>
                    )}
                    {currentStep < questions.length - 1 && (
                        <button
                            type="button"
                            onClick={() => canGoNext && setCurrentStep(currentStep + 1)}
                            disabled={!canGoNext}
                            className={`ml-auto inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold ${
                                canGoNext
                                    ? "bg-primary text-white cursor-pointer"
                                    : "bg-muted text-muted-foreground cursor-not-allowed"
                            }`}
                        >
                            {t('common.next', "Next")}
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Quiz;

import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";
import { api } from "../api/client";
import { QUIZ_STORAGE_KEY } from "../config";
import { Button, Card, Muted, Screen, Title } from "../components/ui";
import { useAuth } from "../store/auth";
import { colors } from "../theme";

const getText = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.tj || value.ru || value.en || Object.values(value)[0] || "";
};

export default function QuizScreen({ navigation }) {
  const { token, updateUser } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [qs, raw] = await Promise.all([
        api("/quiz/questions"),
        AsyncStorage.getItem(QUIZ_STORAGE_KEY),
      ]);
      setQuestions(qs || []);
      if (raw) setResults(JSON.parse(raw));
    };
    load().catch((error) => Alert.alert("Хато", error.message)).finally(() => setLoading(false));
  }, []);

  const submit = async (finalAnswers) => {
    setSubmitting(true);
    try {
      const path = token ? "/quiz/submit-authenticated" : "/quiz/submit";
      const data = await api(path, {
        method: "POST",
        body: { answers: finalAnswers, lang: "tj" },
      });
      setResults(data);
      await AsyncStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(data));
      if (token) updateUser({ quizResults: data.scores });
    } catch (error) {
      Alert.alert("Хато", error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const answer = (selectedValue) => {
    const questionId = questions[step].id;
    const nextAnswers = [
      ...answers.filter((item) => item.questionId !== questionId),
      { questionId, selectedValue },
    ];
    setAnswers(nextAnswers);
    if (step < questions.length - 1) {
      setStep((prev) => prev + 1);
    } else {
      submit(nextAnswers);
    }
  };

  const retake = async () => {
    await AsyncStorage.removeItem(QUIZ_STORAGE_KEY);
    setResults(null);
    setAnswers([]);
    setStep(0);
  };

  if (loading || submitting) {
    return (
      <Screen style={{ alignItems: "center", justifyContent: "center", gap: 12 }}>
        <ActivityIndicator color={colors.secondary} />
        <Muted>{submitting ? "Натиҷа таҳлил мешавад..." : "Боргирӣ..."}</Muted>
      </Screen>
    );
  }

  if (results) {
    const specializations = results?.topCluster?.specializations || [];
    return (
      <Screen>
        <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 24 }}>
          <Title>Натиҷаи санҷиш</Title>
          <Card style={{ gap: 8 }}>
            <Muted>Кластери мувофиқ</Muted>
            <Title style={{ fontSize: 22 }}>{results?.topCluster?.clusterName || results?.topType}</Title>
            <Muted>{results?.topCluster?.clusterDescription || results?.personality}</Muted>
          </Card>
          {specializations.map((item) => (
            <Card key={item.id || item.name} style={{ gap: 8 }}>
              <Title style={{ fontSize: 18 }}>{item.name}</Title>
              <Muted>{item.matchPercentage || results?.topCluster?.averageMatch || 0}% мувофиқат</Muted>
            </Card>
          ))}
          <Button onPress={() => navigation.navigate("Compare")}>Муқоиса кардан</Button>
          <Button variant="ghost" onPress={retake}>Аз нав гузаштан</Button>
        </ScrollView>
      </Screen>
    );
  }

  const question = questions[step];
  if (!question) {
    return <Screen><Muted>Саволҳо ёфт нашуданд.</Muted></Screen>;
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
        <View>
          <Muted>Савол {step + 1} аз {questions.length}</Muted>
          <View style={{ height: 8, borderRadius: 8, backgroundColor: colors.panel2, marginTop: 8 }}>
            <View style={{ height: 8, borderRadius: 8, backgroundColor: colors.secondary, width: `${((step + 1) / questions.length) * 100}%` }} />
          </View>
        </View>
        <Card style={{ gap: 14 }}>
          <Title style={{ fontSize: 22 }}>{getText(question.text || question.title)}</Title>
          {(question.options || []).map((option, index) => (
            <Button key={option.id || index} variant="ghost" onPress={() => answer(String(index))}>
              {getText(option.text || option.label)}
            </Button>
          ))}
        </Card>
        {answers.length > 0 && (
          <Text style={{ color: colors.muted, textAlign: "center" }}>{answers.length} ҷавоб интихоб шуд</Text>
        )}
      </ScrollView>
    </Screen>
  );
}

import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";
import { api } from "../api/client";
import { QUIZ_STORAGE_KEY } from "../config";
import { Button, Card, Chip, Field, Muted, Screen, Title } from "../components/ui";
import { useAuth } from "../store/auth";
import { colors } from "../theme";

const normalizeCompare = (payload) => {
  const root = payload?.data || payload || {};
  const comparison = root.careerComparison || root.careers || root.comparisons || root.results || [];
  const items = Array.isArray(comparison)
    ? comparison
    : Object.entries(comparison || {}).map(([career, details]) => ({ career, ...details }));
  const best = root.bestCareer || items.slice().sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0))[0];
  return { items, best };
};

export default function CompareScreen() {
  const { user } = useAuth();
  const [savedCareers, setSavedCareers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [manual, setManual] = useState("");
  const [scores, setScores] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [saved, rawQuiz] = await Promise.all([
        api("/users/saved-careers").catch(() => []),
        AsyncStorage.getItem(QUIZ_STORAGE_KEY),
      ]);
      const savedList = Array.isArray(saved) ? saved : [];
      setSavedCareers(savedList);
      setSelected(savedList.map((item) => item.name).filter(Boolean).slice(0, 2));
      const quiz = rawQuiz ? JSON.parse(rawQuiz) : null;
      setScores(user?.quizResults || quiz?.scores || quiz);
      setBooting(false);
    };
    load().catch((error) => {
      setBooting(false);
      Alert.alert("Хато", error.message);
    });
  }, [user?.quizResults]);

  const canCompare = selected.length >= 2 && scores;
  const normalized = useMemo(() => normalizeCompare(result), [result]);

  const toggle = (name) => {
    setSelected((prev) => {
      if (prev.includes(name)) return prev.filter((item) => item !== name);
      if (prev.length >= 5) return prev;
      return [...prev, name];
    });
  };

  const addManual = () => {
    const name = manual.trim();
    if (!name || selected.includes(name) || selected.length >= 5) return;
    setSelected((prev) => [...prev, name]);
    setManual("");
  };

  const compare = async () => {
    setLoading(true);
    setResult(null);
    try {
      const data = await api("/careers/compare", {
        method: "POST",
        body: { scores, careers: selected, lang: "tj" },
      });
      setResult(data);
    } catch (error) {
      Alert.alert("Хато", error.message);
    } finally {
      setLoading(false);
    }
  };

  if (booting) {
    return <Screen style={{ alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={colors.secondary} /></Screen>;
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 24 }}>
        <View>
          <Title>Муқоиса</Title>
          <Muted>Ихтисосҳои захирашудаатонро интихоб кунед ё дастӣ илова намоед.</Muted>
        </View>
        {!scores && (
          <Card>
            <Muted>Барои муқоиса аввал санҷишро гузаред.</Muted>
          </Card>
        )}
        <Card style={{ gap: 12 }}>
          <Title style={{ fontSize: 18 }}>Ихтисосҳои захирашуда</Title>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {savedCareers.map((career) => (
              <Chip key={career.id || career.name} active={selected.includes(career.name)} onPress={() => toggle(career.name)}>
                {career.name}
              </Chip>
            ))}
          </View>
          {savedCareers.length === 0 && <Muted>Ҳоло захира нест.</Muted>}
          <Field placeholder="Ихтисосро нависед..." value={manual} onChangeText={setManual} onSubmitEditing={addManual} />
          <Button variant="ghost" onPress={addManual} disabled={!manual.trim() || selected.length >= 5}>Илова</Button>
        </Card>
        <Card style={{ gap: 10 }}>
          <Title style={{ fontSize: 18 }}>Интихобшуда: {selected.length}/5</Title>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {selected.map((name) => (
              <Chip key={name} active onPress={() => toggle(name)}>{name}</Chip>
            ))}
          </View>
          <Button onPress={compare} loading={loading} disabled={!canCompare}>Муқоиса кардан</Button>
        </Card>
        {normalized.best && (
          <Card style={{ gap: 8, borderColor: colors.amber }}>
            <Muted>Беҳтарин интихоб</Muted>
            <Title style={{ fontSize: 20 }}>{normalized.best.name || normalized.best.career}</Title>
            <Muted>{normalized.best.reason || normalized.best.summary}</Muted>
          </Card>
        )}
        {normalized.items.map((item, index) => (
          <Card key={`${item.career || item.name}-${index}`} style={{ gap: 8 }}>
            <Title style={{ fontSize: 18 }}>{item.career || item.name}</Title>
            <Text style={{ color: colors.secondary, fontWeight: "900" }}>{item.matchPercentage || item.match || 0}% мувофиқат</Text>
            <Muted>{item.summary || item.description}</Muted>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}

import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { api } from "../api/client";
import { QUIZ_STORAGE_KEY } from "../config";
import { Button, Card, Muted, Screen, Title } from "../components/ui";
import { useAuth } from "../store/auth";
import { colors } from "../theme";

export default function DashboardScreen({ navigation }) {
  const { user, logout, refreshProfile } = useAuth();
  const [quiz, setQuiz] = useState(null);

  useEffect(() => {
    refreshProfile().catch(() => {});
    AsyncStorage.getItem(QUIZ_STORAGE_KEY)
      .then((raw) => raw && setQuiz(JSON.parse(raw)))
      .catch(() => {});
  }, []);

  const scores = user?.quizResults || quiz?.scores;
  const clusters = scores?.mmtClusters;

  const getAdvisor = async () => {
    try {
      const result = await api("/careers/ai-advisor", {
        method: "POST",
        body: { scores, lang: "tj" },
      });
      Alert.alert("Машварат", result?.summary || result?.message || "Машварат омода шуд.");
    } catch (error) {
      Alert.alert("Хато", error.message);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 24 }}>
        <View>
          <Title>Панел</Title>
          <Muted>{user?.email}</Muted>
        </View>
        <Card style={{ gap: 10 }}>
          <Title style={{ fontSize: 18 }}>Натиҷаи санҷиш</Title>
          {clusters ? (
            Object.entries(clusters).map(([key, value]) => (
              <View key={key} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Text style={{ color: colors.text, width: 32, fontWeight: "900" }}>{key.toUpperCase()}</Text>
                <View style={{ flex: 1, height: 8, borderRadius: 8, backgroundColor: colors.panel2 }}>
                  <View style={{ width: `${Math.min(100, value * 3)}%`, height: 8, borderRadius: 8, backgroundColor: colors.secondary }} />
                </View>
                <Text style={{ color: colors.muted, width: 28, textAlign: "right" }}>{value}</Text>
              </View>
            ))
          ) : (
            <Muted>Ҳоло натиҷаи санҷиш нест.</Muted>
          )}
          <Button onPress={() => navigation.navigate("Quiz")}>{clusters ? "Аз нав гузаштан" : "Гузаштани санҷиш"}</Button>
        </Card>
        <Card style={{ gap: 10 }}>
          <Title style={{ fontSize: 18 }}>Асбобҳо</Title>
          <Button variant="ghost" onPress={() => navigation.navigate("Compare")}>Муқоисаи ихтисосҳо</Button>
          <Button variant="ghost" disabled={!scores} onPress={getAdvisor}>AI машварат</Button>
        </Card>
        <Button variant="ghost" onPress={logout}>Баромадан</Button>
      </ScrollView>
    </Screen>
  );
}

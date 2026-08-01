import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";
import { api } from "../api/client";
import { Button, Card, Muted, Screen, Title } from "../components/ui";
import { colors } from "../theme";

export default function CareerDetailScreen({ route }) {
  const { careerId } = route.params;
  const [career, setCareer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api(`/careers/${careerId}`)
      .then(setCareer)
      .catch((error) => Alert.alert("Хато", error.message))
      .finally(() => setLoading(false));
  }, [careerId]);

  if (loading) {
    return <Screen style={{ alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={colors.secondary} /></Screen>;
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 24 }}>
        <Title>{career?.name}</Title>
        <Muted>{career?.description || career?.purpose}</Muted>
        <Card style={{ gap: 8 }}>
          <Title style={{ fontSize: 18 }}>Маълумот</Title>
          <Info label="Кластер" value={career?.cluster?.clusterName || career?.mmtCluster} />
          <Info label="Нарх" value={career?.tuitionFee ? `${career.tuitionFee} сомонӣ` : "Номаълум"} />
          <Info label="Лайкҳо" value={career?.likesCount ?? 0} />
        </Card>
        {Array.isArray(career?.careerOpportunities) && career.careerOpportunities.length > 0 && (
          <Card style={{ gap: 8 }}>
            <Title style={{ fontSize: 18 }}>Имкониятҳо</Title>
            {career.careerOpportunities.map((item, index) => (
              <Text key={index} style={{ color: colors.text, lineHeight: 22 }}>• {item}</Text>
            ))}
          </Card>
        )}
        <Button>Захира кардан</Button>
      </ScrollView>
    </Screen>
  );
}

const Info = ({ label, value }) => (
  <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
    <Muted>{label}</Muted>
    <Text style={{ color: colors.text, fontWeight: "800", flex: 1, textAlign: "right" }}>{String(value || "-")}</Text>
  </View>
);

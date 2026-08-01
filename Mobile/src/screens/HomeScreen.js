import React from "react";
import { ScrollView, View } from "react-native";
import { Button, Card, Muted, Screen, Title } from "../components/ui";
import { useAuth } from "../store/auth";

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
        <View style={{ gap: 6 }}>
          <Title>Салом, {user?.name || "дӯстам"}</Title>
          <Muted>Ин версияи мобилии “Ихтисоси Ман” аст: ихтисосҳо, санҷиш, захираҳо ва муқоиса дар як барнома.</Muted>
        </View>
        <Card style={{ gap: 12 }}>
          <Title style={{ fontSize: 20 }}>Аз санҷиш оғоз кунем?</Title>
          <Muted>Натиҷаи санҷиш барои тавсия ва муқоисаи ихтисосҳо истифода мешавад.</Muted>
          <Button onPress={() => navigation.navigate("Quiz")}>Гузаштани санҷиш</Button>
        </Card>
        <Card style={{ gap: 12 }}>
          <Title style={{ fontSize: 20 }}>Ихтисосҳои захирашуда</Title>
          <Muted>Ҳама ихтисосҳое, ки дар web ё mobile захира мекунед, аз backend якҷо гирифта мешаванд.</Muted>
          <Button variant="ghost" onPress={() => navigation.navigate("Захираҳо")}>Дидан</Button>
        </Card>
      </ScrollView>
    </Screen>
  );
}

import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable } from "react-native";
import { api } from "../api/client";
import { Card, Muted, Screen, Title } from "../components/ui";
import { colors } from "../theme";

export default function FavoritesScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const data = await api("/users/saved-careers");
    setItems(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    load().catch((error) => Alert.alert("Хато", error.message)).finally(() => setLoading(false));
  }, [load]);

  return (
    <Screen>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={<Title style={{ marginBottom: 14 }}>Захираҳо</Title>}
        ListEmptyComponent={loading ? <ActivityIndicator color={colors.secondary} /> : <Muted>Ҳоло ихтисоси захирашуда нест.</Muted>}
        renderItem={({ item }) => (
          <Pressable onPress={() => navigation.navigate("CareerDetail", { careerId: item.id })}>
            <Card style={{ gap: 8, marginBottom: 12 }}>
              <Title style={{ fontSize: 18 }}>{item.name}</Title>
              <Muted numberOfLines={2}>{item.description || item.purpose}</Muted>
            </Card>
          </Pressable>
        )}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </Screen>
  );
}

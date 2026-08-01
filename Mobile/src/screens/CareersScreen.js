import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { api } from "../api/client";
import { Button, Card, Field, Muted, Screen, Title } from "../components/ui";
import { useAuth } from "../store/auth";
import { colors } from "../theme";

const CareerRow = ({ item, onOpen, onSave, saved }) => (
  <Pressable onPress={() => onOpen(item)}>
    <Card style={{ gap: 8, marginBottom: 12 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
        <Title style={{ fontSize: 18, flex: 1 }}>{item.name}</Title>
        <Text style={{ color: saved ? colors.amber : colors.muted, fontWeight: "900" }}>{saved ? "★" : "☆"}</Text>
      </View>
      <Muted numberOfLines={2}>{item.description || item.purpose || "Маълумоти кӯтоҳ дар бораи ихтисос."}</Muted>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Button style={{ flex: 1, minHeight: 42 }} variant="ghost" onPress={() => onOpen(item)}>Маълумот</Button>
        <Button style={{ flex: 1, minHeight: 42 }} onPress={() => onSave(item)}>{saved ? "Захира шуд" : "Захира"}</Button>
      </View>
    </Card>
  </Pressable>
);

export default function CareersScreen({ navigation }) {
  const { token, user, updateUser } = useAuth();
  const [items, setItems] = useState([]);
  const [savedIds, setSavedIds] = useState(new Set());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setSavedIds(new Set((user?.savedCareers || []).map((item) => item.id)));
  }, [user?.savedCareers]);

  const load = useCallback(async () => {
    const data = await api("/careers", { params: { page: 1, limit: 30, search } });
    setItems(data?.data || data || []);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    load().catch((error) => Alert.alert("Хато", error.message)).finally(() => setLoading(false));
  }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const toggleSave = async (career) => {
    try {
      const result = await api(`/users/save-career/${career.id}`, { method: "POST", token });
      setSavedIds((prev) => {
        const next = new Set(prev);
        result.saved ? next.add(career.id) : next.delete(career.id);
        return next;
      });
      const current = user?.savedCareers || [];
      updateUser({
        savedCareers: result.saved
          ? [...current.filter((item) => item.id !== career.id), career]
          : current.filter((item) => item.id !== career.id),
      });
    } catch (error) {
      Alert.alert("Хато", error.message);
    }
  };

  return (
    <Screen>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 16 }}>
            <Title>Ихтисосҳо</Title>
            <Field placeholder="Ҷустуҷӯи ихтисос..." value={search} onChangeText={setSearch} />
          </View>
        }
        ListEmptyComponent={loading ? <ActivityIndicator color={colors.secondary} /> : <Muted>Ихтисос ёфт нашуд.</Muted>}
        renderItem={({ item }) => (
          <CareerRow
            item={item}
            saved={savedIds.has(item.id)}
            onSave={toggleSave}
            onOpen={(career) => navigation.navigate("CareerDetail", { careerId: career.id })}
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.secondary} />}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </Screen>
  );
}

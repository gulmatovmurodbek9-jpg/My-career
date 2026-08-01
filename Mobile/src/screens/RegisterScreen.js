import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";
import { Button, Card, Field, Muted, Screen, Title } from "../components/ui";
import { useAuth } from "../store/auth";
import { colors } from "../theme";
import { useGoogleSignIn } from "../hooks/useGoogleSignIn";

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const google = useGoogleSignIn();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!name || !email || !password) return;
    setLoading(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password });
    } catch (error) {
      Alert.alert("Хато", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, justifyContent: "center" }}>
        <View style={{ gap: 20 }}>
          <View>
            <Title>Сабти ном</Title>
            <Muted>Ҳисоб созед, санҷиш гузаред ва ихтисосҳоро захира кунед.</Muted>
          </View>
          <Card style={{ gap: 12 }}>
            <Field placeholder="Ном" value={name} onChangeText={setName} />
            <Field placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
            <Field placeholder="Рамз" value={password} onChangeText={setPassword} secureTextEntry />
            <Button onPress={submit} loading={loading} disabled={!name || !email || !password}>Сабти ном</Button>
            {google.configured && (
              <Button variant="ghost" onPress={google.signIn} loading={google.loading} disabled={google.disabled}>
                Continue with Google
              </Button>
            )}
            <Pressable onPress={() => navigation.goBack()} style={{ alignItems: "center", padding: 8 }}>
              <Text style={{ color: colors.secondary, fontWeight: "900" }}>Аллакай ҳисоб доред?</Text>
            </Pressable>
          </Card>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

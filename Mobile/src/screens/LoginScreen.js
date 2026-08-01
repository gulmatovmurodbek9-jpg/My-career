import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";
import { Button, Card, Field, Muted, Screen, Title } from "../components/ui";
import { useAuth } from "../store/auth";
import { colors } from "../theme";
import { useGoogleSignIn } from "../hooks/useGoogleSignIn";

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const google = useGoogleSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      await login(email.trim(), password);
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
            <Title>Ихтисоси Ман</Title>
            <Muted>Ба ҳисоби худ ворид шавед ва ихтисосҳои захирашудаатонро бинед.</Muted>
          </View>
          <Card style={{ gap: 12 }}>
            <Field placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
            <Field placeholder="Рамз" value={password} onChangeText={setPassword} secureTextEntry />
            <Button onPress={submit} loading={loading} disabled={!email || !password}>Ворид шудан</Button>
            {google.configured && (
              <Button variant="ghost" onPress={google.signIn} loading={google.loading} disabled={google.disabled}>
                Continue with Google
              </Button>
            )}
            <Pressable onPress={() => navigation.navigate("Register")} style={{ alignItems: "center", padding: 8 }}>
              <Text style={{ color: colors.secondary, fontWeight: "900" }}>Ҳисоб надоред? Сабти ном</Text>
            </Pressable>
          </Card>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

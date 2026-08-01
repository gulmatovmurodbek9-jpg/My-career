import { useEffect, useState } from "react";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import {
  GOOGLE_ANDROID_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_WEB_CLIENT_ID,
} from "../config";
import { useAuth } from "../store/auth";

WebBrowser.maybeCompleteAuthSession();

export const useGoogleSignIn = () => {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const configured = !!(GOOGLE_WEB_CLIENT_ID || GOOGLE_ANDROID_CLIENT_ID || GOOGLE_IOS_CLIENT_ID);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID || undefined,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID || undefined,
    iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
    scopes: ["openid", "profile", "email"],
  });

  useEffect(() => {
    const finish = async () => {
      if (response?.type !== "success") return;
      const idToken = response.params?.id_token || response.authentication?.idToken;
      if (!idToken) {
        throw new Error("Google did not return an ID token");
      }
      setLoading(true);
      try {
        await loginWithGoogle(idToken);
      } finally {
        setLoading(false);
      }
    };

    finish().catch((error) => {
      setLoading(false);
      console.warn("Google sign-in failed:", error.message);
    });
  }, [response, loginWithGoogle]);

  return {
    configured,
    disabled: !configured || !request || loading,
    loading,
    signIn: () => promptAsync(),
  };
};

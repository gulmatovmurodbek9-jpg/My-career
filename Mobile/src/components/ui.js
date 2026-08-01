import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radii } from "../theme";

export const Screen = ({ children, style }) => (
  <View style={[styles.screen, style]}>{children}</View>
);

export const Card = ({ children, style }) => (
  <View style={[styles.card, style]}>{children}</View>
);

export const Title = ({ children, style }) => (
  <Text style={[styles.title, style]}>{children}</Text>
);

export const Muted = ({ children, style }) => (
  <Text style={[styles.muted, style]}>{children}</Text>
);

export const Button = ({ children, onPress, disabled, loading, variant = "primary", style }) => (
  <Pressable
    onPress={onPress}
    disabled={disabled || loading}
    style={({ pressed }) => [
      styles.button,
      variant === "ghost" && styles.ghostButton,
      (disabled || loading) && styles.disabled,
      pressed && !disabled && styles.pressed,
      style,
    ]}
  >
    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{children}</Text>}
  </Pressable>
);

export const Field = (props) => (
  <TextInput
    placeholderTextColor="#667085"
    autoCapitalize="none"
    style={styles.input}
    {...props}
  />
);

export const Chip = ({ children, active, onPress }) => (
  <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
    <Text style={[styles.chipText, active && styles.chipTextActive]}>{children}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 16,
  },
  card: {
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 16,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 0,
  },
  muted: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    minHeight: 50,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  ghostButton: {
    backgroundColor: colors.panel2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.8,
  },
  input: {
    minHeight: 50,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.panel,
    color: colors.text,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  chip: {
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.panel,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  chipActive: {
    borderColor: colors.secondary,
    backgroundColor: "#0b2530",
  },
  chipText: {
    color: colors.muted,
    fontWeight: "800",
  },
  chipTextActive: {
    color: colors.secondary,
  },
});

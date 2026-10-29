import 'package:flutter/material.dart';

// Рангҳо: контрасти баланд (WCAG AA), то дар офтоб ва барои чашми суст ҳам хонда шавад.
class AppColors {
  static const primary = Color(0xFF1D4ED8);
  static const primaryDark = Color(0xFF1E3A8A);
  static const budget = Color(0xFF047857);
  static const budgetSoft = Color(0xFFD1FAE5);
  static const contract = Color(0xFF1D4ED8);
  static const contractSoft = Color(0xFFDBEAFE);
  static const text = Color(0xFF0F172A);
  static const textSoft = Color(0xFF475569);
  static const background = Color(0xFFF8FAFC);
  static const card = Colors.white;
  static const border = Color(0xFFCBD5E1);
  static const danger = Color(0xFFB91C1C);
}

// Андозаҳо: тугма камаш 60 пиксел, матни асосӣ 18 — барои одами калонсол ҳам қулай.
class AppSizes {
  static const buttonHeight = 60.0;
  static const radius = 18.0;
  static const gap = 16.0;
  static const page = EdgeInsets.fromLTRB(20, 16, 20, 32);
}

ThemeData buildTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: AppColors.primary,
    primary: AppColors.primary,
    surface: AppColors.background,
  );
  const text = TextTheme(
    headlineLarge: TextStyle(fontSize: 30, fontWeight: FontWeight.w800, color: AppColors.text, height: 1.2),
    headlineMedium: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: AppColors.text, height: 1.25),
    titleLarge: TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.text, height: 1.3),
    titleMedium: TextStyle(fontSize: 19, fontWeight: FontWeight.w700, color: AppColors.text, height: 1.3),
    bodyLarge: TextStyle(fontSize: 18, color: AppColors.text, height: 1.5),
    bodyMedium: TextStyle(fontSize: 17, color: AppColors.textSoft, height: 1.45),
    labelLarge: TextStyle(fontSize: 19, fontWeight: FontWeight.w700),
  );
  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: AppColors.background,
    textTheme: text,
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.background,
      foregroundColor: AppColors.text,
      elevation: 0,
      centerTitle: false,
      titleTextStyle: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: AppColors.text),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size.fromHeight(AppSizes.buttonHeight),
        textStyle: const TextStyle(fontSize: 19, fontWeight: FontWeight.w700),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSizes.radius)),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size.fromHeight(AppSizes.buttonHeight),
        foregroundColor: AppColors.text,
        side: const BorderSide(color: AppColors.border, width: 2),
        textStyle: const TextStyle(fontSize: 19, fontWeight: FontWeight.w700),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSizes.radius)),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 18),
      hintStyle: const TextStyle(fontSize: 18, color: AppColors.textSoft),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(AppSizes.radius), borderSide: const BorderSide(color: AppColors.border, width: 2)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(AppSizes.radius), borderSide: const BorderSide(color: AppColors.border, width: 2)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(AppSizes.radius), borderSide: const BorderSide(color: AppColors.primary, width: 2.5)),
    ),
    navigationBarTheme: NavigationBarThemeData(
      height: 76,
      backgroundColor: Colors.white,
      indicatorColor: AppColors.contractSoft,
      labelTextStyle: WidgetStateProperty.resolveWith((states) => TextStyle(
            fontSize: 15,
            fontWeight: states.contains(WidgetState.selected) ? FontWeight.w800 : FontWeight.w600,
            color: states.contains(WidgetState.selected) ? AppColors.primary : AppColors.textSoft,
          )),
      iconTheme: WidgetStateProperty.resolveWith((states) => IconThemeData(
            size: 30,
            color: states.contains(WidgetState.selected) ? AppColors.primary : AppColors.textSoft,
          )),
    ),
  );
}

import 'package:flutter/material.dart';

// Рангҳо айнан аз сайт (Front/src/index.css, мавзӯи равшан).
class AppColors {
  static const primary = Color(0xFF003BB3); // --primary: hsl(220 100% 35%)
  static const accent = Color(0xFF2563EB); // --ring: hsl(221 83% 53%)
  static const primaryDark = Color(0xFF002A80);
  static const background = Color(0xFFF7F8FC); // --background
  static const text = Color(0xFF121A2B); // --foreground
  static const textSoft = Color(0xFF626B84); // --muted-foreground
  static const muted = Color(0xFFF2F3F8); // --muted
  static const card = Colors.white; // --card
  static const border = Color(0xFFE7E8EE); // --border
  static const borderStrong = Color(0xFFD5D8E3);
  static const secondary = Color(0xFFA15C07); // --secondary (зард)
  static const budget = Color(0xFF047857);
  static const budgetSoft = Color(0xFFD1FAE5);
  static const contract = primary;
  static const contractSoft = Color(0xFFE3EBFF);
  static const danger = Color(0xFFB91C1C);
  static const dangerSoft = Color(0xFFFEE2E2);

  // Градиенти тугмаҳо ва нишонаҳо, мисли сайт.
  static const brandGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [primary, accent],
  );
}

class AppFonts {
  static const body = 'GolosText';
  static const display = 'Geologica';
}

// Андозаҳо: тугма камаш 60 пиксел, матни асосӣ 18 — барои одами калонсол ҳам қулай.
class AppSizes {
  static const buttonHeight = 60.0;
  static const radius = 20.0;
  static const cardRadius = 24.0; // .glass-card: 1.5rem
  static const gap = 16.0;
  static const page = EdgeInsets.fromLTRB(20, 16, 20, 32);
}

// Сояи нарми кабуд, мисли .glass-card дар сайт.
const cardShadow = [BoxShadow(color: Color(0x290D2E8C), blurRadius: 40, offset: Offset(0, 18), spreadRadius: -24)];
const buttonShadow = [BoxShadow(color: Color(0x40003BB3), blurRadius: 24, offset: Offset(0, 10), spreadRadius: -8)];

ThemeData buildTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: AppColors.primary,
    primary: AppColors.primary,
    secondary: AppColors.secondary,
    surface: AppColors.background,
    onSurface: AppColors.text,
  );
  const display = AppFonts.display;
  const text = TextTheme(
    headlineLarge: TextStyle(fontFamily: display, fontSize: 30, fontWeight: FontWeight.w800, color: AppColors.text, height: 1.2, letterSpacing: -0.3),
    headlineMedium: TextStyle(fontFamily: display, fontSize: 26, fontWeight: FontWeight.w800, color: AppColors.text, height: 1.25, letterSpacing: -0.2),
    titleLarge: TextStyle(fontFamily: display, fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.text, height: 1.3),
    titleMedium: TextStyle(fontSize: 19, fontWeight: FontWeight.w700, color: AppColors.text, height: 1.3),
    bodyLarge: TextStyle(fontSize: 18, color: AppColors.text, height: 1.5),
    bodyMedium: TextStyle(fontSize: 17, color: AppColors.textSoft, height: 1.45),
    labelLarge: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
  );
  return ThemeData(
    useMaterial3: true,
    fontFamily: AppFonts.body,
    colorScheme: scheme,
    scaffoldBackgroundColor: AppColors.background,
    textTheme: text,
    splashFactory: InkSparkle.splashFactory,
    pageTransitionsTheme: const PageTransitionsTheme(builders: {
      TargetPlatform.android: FadeForwardsPageTransitionsBuilder(),
    }),
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.background,
      surfaceTintColor: Colors.transparent,
      foregroundColor: AppColors.text,
      elevation: 0,
      scrolledUnderElevation: 0.5,
      centerTitle: false,
      titleTextStyle: TextStyle(fontFamily: display, fontSize: 22, fontWeight: FontWeight.w800, color: AppColors.text),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size.fromHeight(AppSizes.buttonHeight),
        backgroundColor: AppColors.primary,
        disabledBackgroundColor: AppColors.borderStrong,
        textStyle: const TextStyle(fontFamily: AppFonts.body, fontSize: 18, fontWeight: FontWeight.w700),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSizes.radius)),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size.fromHeight(AppSizes.buttonHeight),
        foregroundColor: AppColors.text,
        backgroundColor: Colors.white,
        side: const BorderSide(color: AppColors.borderStrong, width: 1.5),
        textStyle: const TextStyle(fontFamily: AppFonts.body, fontSize: 18, fontWeight: FontWeight.w700),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSizes.radius)),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: AppColors.primary,
        minimumSize: const Size(48, 48),
        textStyle: const TextStyle(fontFamily: AppFonts.body, fontSize: 17, fontWeight: FontWeight.w700),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColors.muted,
      contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 18),
      hintStyle: const TextStyle(fontSize: 17, color: AppColors.textSoft),
      prefixIconColor: AppColors.textSoft,
      suffixIconColor: AppColors.textSoft,
      errorStyle: const TextStyle(fontSize: 15, height: 1.3, color: AppColors.danger),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: AppColors.border, width: 1.5)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: AppColors.border, width: 1.5)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: AppColors.accent, width: 2)),
      errorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: AppColors.danger, width: 1.5)),
      focusedErrorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: AppColors.danger, width: 2)),
    ),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      backgroundColor: AppColors.text,
      contentTextStyle: const TextStyle(fontFamily: AppFonts.body, fontSize: 17, color: Colors.white),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    ),
    navigationBarTheme: NavigationBarThemeData(
      height: 76,
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.transparent,
      indicatorColor: AppColors.contractSoft,
      labelTextStyle: WidgetStateProperty.resolveWith((states) => TextStyle(
            fontFamily: AppFonts.body,
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

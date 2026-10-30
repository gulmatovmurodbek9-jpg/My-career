import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

// Рангҳо айнан аз сайт (Front/src/index.css): мавзӯи равшан ва торик (.dark).
// Ҳолати торик аз AppSettings гузошта мешавад (AppColors.dark); ҳангоми иваз ҳамаи экранҳо аз нав сохта мешаванд.
class AppColors {
  static bool dark = false;
  static Color _c(int light, int darkValue) => Color(dark ? darkValue : light);

  static Color get primary => _c(0xFF003BB3, 0xFF3B82F6); // --primary
  static Color get accent => _c(0xFF2563EB, 0xFF60A5FA); // --ring / --accent-blue
  static Color get primaryDark => _c(0xFF002A80, 0xFF1D4ED8);
  static Color get background => _c(0xFFF7F8FC, 0xFF09090B); // --background
  static Color get card => _c(0xFFFFFFFF, 0xFF141417); // --card
  static Color get text => _c(0xFF121A2B, 0xFFF8FAFC); // --foreground
  static Color get textSoft => _c(0xFF626B84, 0xFF98A2B3); // --muted-foreground
  static Color get muted => _c(0xFFF2F3F8, 0xFF1F1F24); // --muted
  static Color get border => _c(0xFFE7E8EE, 0xFF2A2A30); // --border
  static Color get borderStrong => _c(0xFFD5D8E3, 0xFF3A3A42);
  static Color get secondary => _c(0xFFA15C07, 0xFFFBBF24); // --secondary (зард)
  static Color get budget => _c(0xFF047857, 0xFF34D399);
  static Color get budgetSoft => _c(0xFFD1FAE5, 0xFF0E2A22);
  static Color get contract => primary;
  static Color get contractSoft => _c(0xFFE3EBFF, 0xFF16233F);
  static Color get danger => _c(0xFFB91C1C, 0xFFF87171);
  static Color get dangerSoft => _c(0xFFFEE2E2, 0xFF3A1717);
  static Color get warning => _c(0xFFB45309, 0xFFFBBF24);
  static Color get warningSoft => _c(0xFFFEF3C7, 0xFF3A2A0C);
  static Color get hint => _c(0xFFA0A6B8, 0xFF6B7280);

  // Градиенти тугмаҳо ва нишонаҳо, мисли сайт.
  static LinearGradient get brandGradient =>
      LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: dark ? const [Color(0xFF2563EB), Color(0xFF3B82F6)] : const [Color(0xFF003BB3), Color(0xFF2563EB)]);
}

class AppFonts {
  static const body = 'GolosText';
  static const display = 'Geologica';
}

// Андозаҳо: тугма 54 пиксел, матни асосӣ 16. Барои одами калонсол дар «Танзимот» андозаи «Калон» ҳаст.
class AppSizes {
  static const buttonHeight = 54.0;
  static const radius = 18.0;
  static const cardRadius = 22.0; // .glass-card: 1.5rem
  static const gap = 12.0;
  static const page = EdgeInsets.fromLTRB(16, 8, 16, 24);
}

// Сояи нарми кабуд, мисли .glass-card дар сайт. Хурд нигоҳ дошта шудааст — сояи калон дар рӯйхатҳо телефонро суст мекунад.
List<BoxShadow> get cardShadow => AppColors.dark ? const [] : const [BoxShadow(color: Color(0x1A0D2E8C), blurRadius: 18, offset: Offset(0, 8), spreadRadius: -10)];
List<BoxShadow> get buttonShadow => [
  BoxShadow(color: (AppColors.dark ? const Color(0xFF2563EB) : const Color(0xFF003BB3)).withValues(alpha: 0.28), blurRadius: 18, offset: const Offset(0, 8), spreadRadius: -8),
];

ThemeData buildTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: AppColors.primary,
    brightness: AppColors.dark ? Brightness.dark : Brightness.light,
    primary: AppColors.primary,
    secondary: AppColors.secondary,
    surface: AppColors.background,
    onSurface: AppColors.text,
  );
  const display = AppFonts.display;
  final text = TextTheme(
    headlineLarge: TextStyle(fontFamily: display, fontSize: 26, fontWeight: FontWeight.w700, color: AppColors.text, height: 1.2, letterSpacing: -0.3),
    headlineMedium: TextStyle(fontFamily: display, fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.text, height: 1.25, letterSpacing: -0.2),
    titleLarge: TextStyle(fontFamily: display, fontSize: 19, fontWeight: FontWeight.w600, color: AppColors.text, height: 1.3),
    titleMedium: TextStyle(fontSize: 17, fontWeight: FontWeight.w600, color: AppColors.text, height: 1.3),
    bodyLarge: TextStyle(fontSize: 16, color: AppColors.text, height: 1.45),
    bodyMedium: TextStyle(fontSize: 15, color: AppColors.textSoft, height: 1.4),
    labelLarge: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
  );
  return ThemeData(
    useMaterial3: true,
    brightness: AppColors.dark ? Brightness.dark : Brightness.light,
    fontFamily: AppFonts.body,
    colorScheme: scheme,
    scaffoldBackgroundColor: AppColors.background,
    canvasColor: AppColors.card,
    cardColor: AppColors.card,
    dividerColor: AppColors.border,
    textTheme: text,
    // InkRipple — сабук; InkSparkle дар Android бори аввал шейдер месозад ва барнома «меистад».
    splashFactory: InkRipple.splashFactory,
    pageTransitionsTheme: const PageTransitionsTheme(builders: {TargetPlatform.android: FadeForwardsPageTransitionsBuilder()}),
    appBarTheme: AppBarTheme(
      backgroundColor: AppColors.background,
      surfaceTintColor: Colors.transparent,
      foregroundColor: AppColors.text,
      // Нишонаҳои сатри боло (соат, батарея): дар торик — сафед, дар равшан — сиёҳ.
      systemOverlayStyle: AppColors.dark ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark,
      elevation: 0,
      scrolledUnderElevation: 0.5,
      centerTitle: false,
      titleTextStyle: TextStyle(fontFamily: display, fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.text),
    ),
    iconTheme: IconThemeData(color: AppColors.text),
    bottomSheetTheme: BottomSheetThemeData(backgroundColor: AppColors.card, surfaceTintColor: Colors.transparent),
    dialogTheme: DialogThemeData(backgroundColor: AppColors.card, surfaceTintColor: Colors.transparent),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size.fromHeight(AppSizes.buttonHeight),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        disabledBackgroundColor: AppColors.borderStrong,
        textStyle: const TextStyle(fontFamily: AppFonts.body, fontSize: 16, fontWeight: FontWeight.w600),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSizes.radius)),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size.fromHeight(AppSizes.buttonHeight),
        foregroundColor: AppColors.text,
        backgroundColor: AppColors.card,
        side: BorderSide(color: AppColors.border),
        textStyle: const TextStyle(fontFamily: AppFonts.body, fontSize: 16, fontWeight: FontWeight.w600),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSizes.radius)),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: AppColors.primary,
        minimumSize: const Size(44, 40),
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
        tapTargetSize: MaterialTapTargetSize.padded,
        overlayColor: AppColors.primary.withValues(alpha: 0.05),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        textStyle: const TextStyle(fontFamily: AppFonts.body, fontSize: 15, fontWeight: FontWeight.w600),
      ),
    ),
    checkboxTheme: CheckboxThemeData(
      fillColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? AppColors.primary : Colors.transparent),
      checkColor: const WidgetStatePropertyAll(Colors.white),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColors.muted,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
      hintStyle: TextStyle(fontSize: 15, color: AppColors.textSoft),
      prefixIconColor: AppColors.textSoft,
      suffixIconColor: AppColors.textSoft,
      errorStyle: TextStyle(fontSize: 15, height: 1.3, color: AppColors.danger),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: AppColors.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: AppColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: AppColors.accent, width: 1.4),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: AppColors.danger),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: AppColors.danger, width: 1.4),
      ),
    ),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      backgroundColor: AppColors.dark ? const Color(0xFFE5E7EB) : const Color(0xFF121A2B),
      contentTextStyle: TextStyle(fontFamily: AppFonts.body, fontSize: 15, color: AppColors.dark ? const Color(0xFF121A2B) : Colors.white),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    ),
    progressIndicatorTheme: ProgressIndicatorThemeData(color: AppColors.primary),
  );
}

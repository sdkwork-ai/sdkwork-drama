import 'package:flutter/material.dart';

/// Tech-blue, flat, borderless. Mirrors the sdkwork-doctor visual baseline.
const Color kTechBlue = Color(0xFF0A5CFF);
const Color kTechBlueStrong = Color(0xFF0747C9);
const Color kTechBlueSoft = Color(0xFFE7EFFF);
const Color kTechCyan = Color(0xFF00D2FF);
const Color kChromeNavy = Color(0xFF061A3A);
const Color kCanvas = Color(0xFFF2F5FA);
const Color kSurface = Color(0xFFFFFFFF);
const Color kSurfaceAlt = Color(0xFFE6EDF8);
const Color kInk = Color(0xFF0A1324);
const Color kMuted = Color(0xFF5A6B85);
const Color kSuccess = Color(0xFF0E9F6E);
const Color kSuccessSoft = Color(0xFFE3F7EF);
const Color kWarning = Color(0xFFB26A00);
const Color kWarningSoft = Color(0xFFFFF4E0);

ThemeData buildAppTheme() {
  final ColorScheme scheme = ColorScheme.fromSeed(
    seedColor: kTechBlue,
    brightness: Brightness.light,
  ).copyWith(
    primary: kTechBlue,
    onPrimary: Colors.white,
    primaryContainer: kTechBlueSoft,
    onPrimaryContainer: kTechBlueStrong,
    secondary: kTechCyan,
    onSecondary: kChromeNavy,
    surface: kSurface,
    onSurface: kInk,
    surfaceContainerHighest: kSurfaceAlt,
    error: const Color(0xFFE5484D),
    onError: Colors.white,
  );

  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: kCanvas,
    appBarTheme: const AppBarTheme(
      backgroundColor: kSurface,
      foregroundColor: kInk,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: false,
      titleTextStyle: TextStyle(
        color: kInk,
        fontSize: 17,
        fontWeight: FontWeight.w600,
      ),
    ),
    cardTheme: const CardThemeData(
      color: kSurface,
      elevation: 0,
      margin: EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(14)),
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: kSurface,
      elevation: 0,
      height: 70,
      indicatorColor: kTechBlueSoft,
      labelTextStyle: WidgetStateProperty.resolveWith(
        (Set<WidgetState> states) => TextStyle(
          fontSize: 12,
          fontWeight: states.contains(WidgetState.selected)
              ? FontWeight.w700
              : FontWeight.w500,
          color: states.contains(WidgetState.selected) ? kTechBlueStrong : kMuted,
        ),
      ),
      iconTheme: WidgetStateProperty.resolveWith(
        (Set<WidgetState> states) => IconThemeData(
          color: states.contains(WidgetState.selected) ? kTechBlueStrong : kMuted,
        ),
      ),
    ),
    dividerTheme: const DividerThemeData(color: kSurfaceAlt, thickness: 1),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: kTechBlue,
        foregroundColor: Colors.white,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
      ),
    ),
    chipTheme: const ChipThemeData(
      backgroundColor: kTechBlueSoft,
      side: BorderSide.none,
      shape: StadiumBorder(),
      labelStyle: TextStyle(
        color: kTechBlueStrong,
        fontSize: 12,
        fontWeight: FontWeight.w600,
      ),
      padding: EdgeInsets.symmetric(horizontal: 8, vertical: 2),
    ),
    listTileTheme: const ListTileThemeData(iconColor: kMuted, textColor: kInk),
  );
}

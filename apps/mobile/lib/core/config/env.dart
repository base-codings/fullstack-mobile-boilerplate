// ignore_for_file: avoid_classes_with_only_static_members
import 'dart:io' show Platform;

import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:mobile_boilerplate/core/config/flavor.dart';

/// Runtime environment configuration loaded from `.env`.
///
/// <!-- Red Team #11, #15 -->
/// - `.env` is GITIGNORED. Copy `.env.example` → `.env` for local dev.
/// - Only non-secret runtime config (base URL, feature flags) goes here.
/// - Secrets MUST come from `flutter_secure_storage`.
/// - `API_BASE_URL=auto` triggers platform-aware loopback resolution.
///
/// Usage:
/// ```dart
/// final env = await AppEnv.load(Flavor.dev);
/// ```
class AppEnv {
  const AppEnv({
    required this.apiBaseUrl,
    required this.apiPrefix,
    required this.flavor,
  });

  final String apiBaseUrl;
  final String apiPrefix;
  final Flavor flavor;

  /// Load env vars from `.env` and resolve the base URL.
  ///
  /// Always loads a single `.env` file regardless of flavor.
  /// Flavor is used for gating behavior (logging, etc.), NOT for
  /// switching env files — avoid per-flavor files that leak secrets
  /// into APK assets (Red Team #11).
  static Future<AppEnv> load(Flavor flavor) async {
    await dotenv.load(fileName: '.env');

    final raw = dotenv.maybeGet('API_BASE_URL') ?? 'auto';
    final prefix = dotenv.maybeGet('API_PREFIX') ?? '/api';

    return AppEnv(
      apiBaseUrl: _resolveBaseUrl(raw),
      apiPrefix: prefix,
      flavor: flavor,
    );
  }

  /// Resolve `API_BASE_URL`:
  /// - `auto` → platform-aware localhost/emulator address.
  /// - anything else → use verbatim (supports explicit IP / https URL).
  static String _resolveBaseUrl(String raw) {
    if (raw != 'auto') return raw;

    // Android emulator uses 10.0.2.2 to reach host loopback.
    if (!kIsWeb && Platform.isAndroid) return 'http://10.0.2.2:3000';

    // iOS simulator, macOS, web, Linux desktop → host localhost.
    return 'http://localhost:3000';
  }
}

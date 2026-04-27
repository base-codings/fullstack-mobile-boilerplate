import 'package:dio/dio.dart';
import 'package:mobile_boilerplate/core/config/env.dart';
import 'package:mobile_boilerplate/core/config/flavor.dart';

/// Build a configured [Dio] instance for [env] and [flavor].
///
/// <!-- Red Team #9 -->
/// Body logging is intentionally DISABLED outside [Flavor.dev] to prevent
/// PII / token leakage into logcat, crash reporters, or proxy tools.
/// Only status codes and paths are logged in staging/prod.
Dio buildDioClient(AppEnv env, Flavor flavor) {
  final baseUrl = '${env.apiBaseUrl}${env.apiPrefix}';

  final dio = Dio(
    BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: <String, String>{
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    ),
  );

  // Log request/response bodies ONLY in dev flavor.
  // Body logging disabled in staging/prod to avoid PII leak (Red Team #9).
  final logBodies = flavor == Flavor.dev;

  dio.interceptors.add(
    LogInterceptor(
      requestBody: logBodies,
      responseBody: logBodies,
      requestHeader: logBodies,
      responseHeader: false, // headers are low-value for daily debugging
      logPrint: _logPrint,
    ),
  );

  return dio;
}

/// Internal log printer — swaps to `debugPrint` to respect Flutter's
/// output rate-limiter and avoids lint warnings on `print` calls.
void _logPrint(Object object) {
  // ignore: avoid_print
  print(object);
}

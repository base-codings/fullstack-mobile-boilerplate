import 'package:dio/dio.dart';
import 'package:mobile_boilerplate/core/error/failure.dart';

/// Map a [DioException] to a typed [Failure].
///
/// Keeps Dio as an implementation detail inside `core/network` —
/// repositories catch [DioException] and call this helper so that
/// domain code never imports Dio.
Failure mapDioToFailure(DioException e) {
  switch (e.type) {
    case DioExceptionType.connectionTimeout:
    case DioExceptionType.sendTimeout:
    case DioExceptionType.receiveTimeout:
      return NetworkFailure(
        'Request timed out: ${e.message ?? e.type.name}',
      );

    case DioExceptionType.connectionError:
      return NetworkFailure(
        'No network connection: ${e.message ?? 'unknown'}',
      );

    case DioExceptionType.badResponse:
      final statusCode = e.response?.statusCode ?? 0;
      final body = e.response?.data;
      final serverMsg = _extractServerMessage(body) ??
          e.message ??
          'Server error $statusCode';
      return ServerFailure(statusCode: statusCode, message: serverMsg);

    case DioExceptionType.cancel:
      return const UnknownFailure('Request was cancelled');

    case DioExceptionType.badCertificate:
      return const NetworkFailure('SSL certificate error');

    case DioExceptionType.unknown:
      return UnknownFailure(e.message ?? 'Unknown network error');
  }
}

/// Try to extract a `message` field from a JSON response body.
String? _extractServerMessage(dynamic body) {
  if (body is Map<String, dynamic>) {
    final msg = body['message'];
    if (msg is String) return msg;
  }
  return null;
}

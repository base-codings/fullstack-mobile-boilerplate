/// Sealed domain failure types — map transport-layer errors to
/// business-layer failures so presentation code never imports Dio directly.
///
/// Usage:
/// ```dart
/// switch (failure) {
///   case NetworkFailure(:final message) => showOfflineBanner(message),
///   case ServerFailure(:final statusCode) => showServerError(statusCode),
///   case UnknownFailure() => showGenericError(),
/// }
/// ```
sealed class Failure implements Exception {
  const Failure(this.message);

  /// Human-readable description (for debug; not shown raw to users).
  final String message;
}

/// No network connectivity or the request timed out.
final class NetworkFailure extends Failure {
  const NetworkFailure(super.message);
}

/// Server responded with a non-2xx status code.
final class ServerFailure extends Failure {
  const ServerFailure({required this.statusCode, required String message})
      : super(message);

  final int statusCode;
}

/// Anything that does not fit the above buckets (encoding errors, etc.).
final class UnknownFailure extends Failure {
  const UnknownFailure(super.message);
}

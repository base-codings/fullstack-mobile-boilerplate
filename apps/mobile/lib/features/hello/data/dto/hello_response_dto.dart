/// Placeholder DTO for the backend `GET /api/hello` response.
///
/// Phase 06 replaces this with the generated model from `packages/api_client`
/// (OpenAPI-generated via `dio` generator). At that point this file will be
/// deleted and the import in `hello_repository_impl.dart` will be updated.
///
/// Response envelope expected from the API:
/// ```json
/// {
///   "data": {
///     "message": "Hello from NestJS!",
///     "timestamp": "2026-04-26T12:00:00.000Z"
///   },
///   "meta": {},
///   "requestId": "abc-123"
/// }
/// ```
class HelloResponseDto {
  const HelloResponseDto({
    required this.message,
    required this.timestamp,
  });

  factory HelloResponseDto.fromJson(Map<String, dynamic> json) =>
      HelloResponseDto(
        message: json['message'] as String,
        timestamp: json['timestamp'] as String,
      );

  final String message;
  final String timestamp;

  @override
  String toString() =>
      'HelloResponseDto(message: $message, timestamp: $timestamp)';
}

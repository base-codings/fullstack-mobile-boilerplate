/// Domain entity representing a greeting message from the backend.
///
/// Kept as a plain Dart class so the initial scaffold compiles without
/// running build_runner.
///
/// Adopters can convert to freezed by:
///   1. Add `part 'hello_message.freezed.dart';` and `part 'hello_message.g.dart';`
///   2. Add `@freezed` annotation and `with _$HelloMessage` mixin.
///   3. Run `dart run build_runner build --delete-conflicting-outputs`.
///   See docs/guides/add-new-flutter-feature.md for the full pattern.
class HelloMessage {
  const HelloMessage({
    required this.message,
    required this.timestamp,
  });

  final String message;
  final DateTime timestamp;

  @override
  String toString() =>
      'HelloMessage(message: $message, timestamp: $timestamp)';

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is HelloMessage &&
          runtimeType == other.runtimeType &&
          message == other.message &&
          timestamp == other.timestamp;

  @override
  int get hashCode => Object.hash(message, timestamp);
}

import 'package:mobile_boilerplate/core/error/failure.dart' show Failure;
import 'package:mobile_boilerplate/features/hello/domain/entities/hello_message.dart';

/// Abstract contract for the hello feature's data source.
///
/// Implementations live in `data/` — domain code only sees this interface.
abstract class HelloRepository {
  /// Fetch a greeting message from the backend.
  ///
  /// Throws a [Failure] subtype (from `core/error/failure.dart`) on error.
  Future<HelloMessage> getHello();
}

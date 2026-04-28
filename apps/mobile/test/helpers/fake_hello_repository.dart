import 'package:mobile_boilerplate/features/hello/domain/entities/hello_message.dart';
import 'package:mobile_boilerplate/features/hello/domain/repositories/hello_repository.dart';

/// Test double for [HelloRepository].
///
/// We avoid mocktail here because [HelloRepository] is a tiny abstract class
/// with a single method — a hand-written fake is clearer and dependency-free.
class FakeHelloRepository implements HelloRepository {
  FakeHelloRepository({this.response, this.error});

  /// Response to return on success. Ignored if [error] is set.
  HelloMessage? response;

  /// If set, [getHello] throws this exception.
  Exception? error;

  /// Number of times [getHello] was invoked. Used to assert retries.
  int callCount = 0;

  @override
  Future<HelloMessage> getHello() async {
    callCount++;
    if (error != null) throw error!;
    return response ??
        HelloMessage(
          message: 'fake message',
          timestamp: DateTime.utc(2026, 4, 26, 12),
        );
  }
}

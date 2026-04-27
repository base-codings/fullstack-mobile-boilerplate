import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_boilerplate/core/di/providers.dart';
import 'package:mobile_boilerplate/features/hello/domain/entities/hello_message.dart';
import 'package:mobile_boilerplate/features/hello/presentation/controllers/hello_controller.dart';

import '../../helpers/fake_hello_repository.dart';

void main() {
  group('HelloController', () {
    test('emits AsyncData with the message returned by the repository', () async {
      final fake = FakeHelloRepository(
        response: HelloMessage(
          message: 'Hello from NestJS',
          timestamp: DateTime.utc(2026, 4, 26),
        ),
      );

      final container = ProviderContainer(
        overrides: [helloRepositoryProvider.overrideWithValue(fake)],
      );
      addTearDown(container.dispose);

      final result = await container.read(helloControllerProvider.future);

      expect(result.message, 'Hello from NestJS');
      expect(fake.callCount, 1);
    });

    test('emits AsyncError when the repository throws', () async {
      final fake = FakeHelloRepository(error: Exception('boom'));

      final container = ProviderContainer(
        overrides: [helloRepositoryProvider.overrideWithValue(fake)],
      );
      addTearDown(container.dispose);

      await expectLater(
        container.read(helloControllerProvider.future),
        throwsA(isA<Exception>()),
      );
    });

    test('refresh() re-invokes the repository', () async {
      final fake = FakeHelloRepository();

      final container = ProviderContainer(
        overrides: [helloRepositoryProvider.overrideWithValue(fake)],
      );
      addTearDown(container.dispose);

      await container.read(helloControllerProvider.future);
      expect(fake.callCount, 1);

      await container.read(helloControllerProvider.notifier).refresh();
      expect(fake.callCount, 2);
    });
  });
}

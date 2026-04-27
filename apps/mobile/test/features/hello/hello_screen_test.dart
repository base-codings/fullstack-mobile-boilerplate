import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_boilerplate/core/di/providers.dart';
import 'package:mobile_boilerplate/features/hello/domain/entities/hello_message.dart';
import 'package:mobile_boilerplate/features/hello/presentation/screens/hello_screen.dart';

import '../../helpers/fake_hello_repository.dart';
import '../../helpers/pump_app.dart';

void main() {
  group('HelloScreen', () {
    testWidgets('renders the message returned by the repository', (tester) async {
      final fake = FakeHelloRepository(
        response: HelloMessage(
          message: 'Hello from NestJS',
          timestamp: DateTime.utc(2026, 4, 26),
        ),
      );

      await pumpApp(
        tester,
        const HelloScreen(),
        overrides: [helloRepositoryProvider.overrideWithValue(fake)],
      );

      // Initial frame is loading — pump until AsyncNotifier resolves.
      await tester.pumpAndSettle();

      expect(find.text('Hello from NestJS'), findsOneWidget);
    });

    testWidgets('shows retry button on error and re-invokes repository on tap',
        (tester) async {
      final fake = FakeHelloRepository(error: Exception('network down'));

      await pumpApp(
        tester,
        const HelloScreen(),
        overrides: [helloRepositoryProvider.overrideWithValue(fake)],
      );
      await tester.pumpAndSettle();

      final retryButton = find.byType(FilledButton);
      expect(retryButton, findsOneWidget);
      expect(fake.callCount, 1);

      await tester.tap(retryButton);
      await tester.pumpAndSettle();

      expect(fake.callCount, 2);
    });

    testWidgets('shows progress indicator while loading', (tester) async {
      // Repository never resolves — stays in loading.
      final fake = _NeverResolvingRepository();

      await pumpApp(
        tester,
        const HelloScreen(),
        overrides: [helloRepositoryProvider.overrideWithValue(fake)],
      );

      // Single pump (not pumpAndSettle) to capture the loading frame.
      await tester.pump();
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });
  });
}

class _NeverResolvingRepository extends FakeHelloRepository {
  @override
  Future<HelloMessage> getHello() => Future.delayed(const Duration(seconds: 30));
}

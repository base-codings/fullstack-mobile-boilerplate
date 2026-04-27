import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_boilerplate/core/di/providers.dart';
import 'package:mobile_boilerplate/features/hello/domain/entities/hello_message.dart';

/// Provider for [HelloController].
///
/// Using plain [AsyncNotifierProvider] (not @riverpod codegen) so the
/// initial scaffold compiles without running build_runner.
///
/// Convert to @riverpod codegen:
///   1. Add `part 'hello_controller.g.dart';` directive.
///   2. Annotate with `@riverpod` and extend `_$HelloController`.
///   3. Run `dart run build_runner build --delete-conflicting-outputs`.
///   See docs/guides/add-new-flutter-feature.md for the full pattern.
final helloControllerProvider =
    AsyncNotifierProvider<HelloController, HelloMessage>(
  HelloController.new,
);

/// Async notifier that loads and manages the hello message state.
///
/// State lifecycle:
///   [AsyncLoading] → API call → [AsyncData] | [AsyncError]
///
/// Consumers call [refresh] to retry on error or pull-to-refresh.
class HelloController extends AsyncNotifier<HelloMessage> {
  @override
  Future<HelloMessage> build() =>
      ref.read(helloRepositoryProvider).getHello();

  /// Trigger a fresh load; updates state through loading → data/error.
  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(helloRepositoryProvider).getHello(),
    );
  }
}

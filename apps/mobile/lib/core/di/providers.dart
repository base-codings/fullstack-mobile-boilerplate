import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_boilerplate/core/config/env.dart';
import 'package:mobile_boilerplate/core/config/flavor.dart';
import 'package:mobile_boilerplate/core/network/dio_client.dart';
import 'package:mobile_boilerplate/features/hello/data/hello_repository_impl.dart';
import 'package:mobile_boilerplate/features/hello/domain/repositories/hello_repository.dart';

/// Current build flavor. Overridden in `main()` via ProviderScope.overrides.
///
/// Using a plain [Provider] (not @riverpod codegen) so the initial scaffold
/// compiles without running build_runner.
/// Convert to codegen: add `part 'providers.g.dart';` + `@riverpod` annotation.
final flavorProvider = Provider<Flavor>(
  (_) => throw UnimplementedError('flavorProvider must be overridden in main()'),
);

/// Resolved runtime environment (base URL, API prefix, flavor).
/// Overridden in `main()` via ProviderScope.overrides after `AppEnv.load()`.
final envProvider = Provider<AppEnv>(
  (_) => throw UnimplementedError('envProvider must be overridden in main()'),
);

/// Configured Dio HTTP client. Depends on [envProvider] and [flavorProvider].
final dioProvider = Provider<Dio>((ref) {
  final env = ref.watch(envProvider);
  final flavor = ref.watch(flavorProvider);
  return buildDioClient(env, flavor);
});

/// Hello feature repository. Phase 06 refactors this to inject the
/// generated api_client from `packages/api_client` instead of raw Dio.
final helloRepositoryProvider = Provider<HelloRepository>(
  (ref) => HelloRepositoryImpl(ref.watch(dioProvider)),
);

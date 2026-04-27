// Provider for the generated api_client (packages/api_client).
//
// IMPORTANT: This file references symbols that ONLY exist after running
// `pnpm codegen:api` from repo root. The freshly cloned scaffold ships
// with placeholder Dio-based code (see hello_repository_impl.dart).
//
// Migration to generated client (post-codegen):
//   1. Run `pnpm codegen:api` (requires Java 17 + Flutter SDK)
//   2. Uncomment the body of this file
//   3. Switch `helloRepositoryProvider` in core/di/providers.dart to inject
//      `helloApiProvider` instead of `dioProvider`
//   4. Update HelloRepositoryImpl to consume HelloApi from api_client
//   5. Delete features/hello/data/dto/hello_response_dto.dart (no longer needed)
//
// See docs/guides/api-contract-workflow.md for the full recipe.

// import 'package:api_client/api_client.dart';
// import 'package:flutter_riverpod/flutter_riverpod.dart';
// import 'package:mobile_boilerplate/core/di/providers.dart';
//
// final apiClientProvider = Provider<ApiClient>((ref) {
//   final dio = ref.watch(dioProvider);
//   return ApiClient(dio: dio);
// });
//
// final helloApiProvider = Provider<HelloApi>(
//   (ref) => ref.watch(apiClientProvider).getHelloApi(),
// );

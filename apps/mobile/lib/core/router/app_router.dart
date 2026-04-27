import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_boilerplate/features/hello/presentation/screens/hello_screen.dart';

/// Named route constants — avoids hardcoded strings across the codebase.
abstract final class AppRoutes {
  static const String home = '/';
}

/// App router provider — override is not required; the default instance is
/// sufficient. Exposed as [Provider] so widgets can watch for router changes.
final routerProvider = Provider<GoRouter>(_buildRouter);

GoRouter _buildRouter(Ref ref) => GoRouter(
      debugLogDiagnostics: true,
      initialLocation: AppRoutes.home,
      routes: [
        GoRoute(
          path: AppRoutes.home,
          builder: (context, state) => const HelloScreen(),
        ),
      ],
    );

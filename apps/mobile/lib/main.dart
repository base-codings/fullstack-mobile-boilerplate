import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_boilerplate/app.dart';
import 'package:mobile_boilerplate/core/config/env.dart';
import 'package:mobile_boilerplate/core/config/flavor.dart';
import 'package:mobile_boilerplate/core/di/providers.dart';

/// App entry point.
///
/// Execution order:
///   1. Parse FLAVOR from `--dart-define=FLAVOR=dev|staging|prod`
///      (defaults to `dev` if omitted).
///   2. Load `.env` via flutter_dotenv and resolve [AppEnv].
///   3. Mount [ProviderScope] with [flavorProvider] + [envProvider] overrides
///      so all downstream providers receive the correct config at startup.
void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Read flavor from compile-time constant.
  const flavorRaw = String.fromEnvironment('FLAVOR', defaultValue: 'dev');
  final flavor = flavorFromString(flavorRaw);

  // Load .env (gitignored — adopter copies from .env.example).
  final env = await AppEnv.load(flavor);

  runApp(
    ProviderScope(
      overrides: [
        flavorProvider.overrideWithValue(flavor),
        envProvider.overrideWithValue(env),
      ],
      child: const App(),
    ),
  );
}

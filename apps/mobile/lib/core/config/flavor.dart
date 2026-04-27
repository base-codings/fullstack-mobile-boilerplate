/// App build flavor — set at compile time via:
///   `--dart-define=FLAVOR=dev|staging|prod`
///
/// Flavor controls:
///   - Dio body logging (dev only — Red Team #9)
///   - Log verbosity
///   - Any future feature flags
library;

/// Supported build flavors.
enum Flavor { dev, staging, prod }

/// Parse a raw string from `--dart-define=FLAVOR=...` into a [Flavor].
/// Defaults to [Flavor.dev] for any unknown/null value.
Flavor flavorFromString(String? raw) => switch (raw) {
      'staging' => Flavor.staging,
      'prod' => Flavor.prod,
      _ => Flavor.dev,
    };

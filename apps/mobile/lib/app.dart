import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_boilerplate/core/router/app_router.dart';
import 'package:mobile_boilerplate/core/theme/app_theme.dart';
import 'package:mobile_boilerplate/l10n/app_localizations.dart';

/// Root application widget.
class App extends ConsumerWidget {
  /// Const constructor — App is a top-level singleton mounted by main().
  const App({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'Mobile Boilerplate',
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
    );
  }
}

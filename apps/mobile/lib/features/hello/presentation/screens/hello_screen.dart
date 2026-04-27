import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_boilerplate/features/hello/presentation/controllers/hello_controller.dart';
import 'package:mobile_boilerplate/features/hello/presentation/widgets/hello_card.dart';
import 'package:mobile_boilerplate/shared/widgets/error_view.dart';
import 'package:mobile_boilerplate/shared/widgets/loading_view.dart';

/// Entry screen — fetches and displays a greeting from the backend.
///
/// State machine:
///   AsyncLoading → [LoadingView]
///   AsyncError   → [ErrorView] with retry button
///   AsyncData    → [HelloCard] with message + timestamp
class HelloScreen extends ConsumerWidget {
  const HelloScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final helloAsync = ref.watch(helloControllerProvider);
    final l10n = AppLocalizations.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.helloTitle),
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(helloControllerProvider.notifier).refresh(),
        child: helloAsync.when(
          loading: () => LoadingView(message: l10n.helloLoading),
          error: (error, _) => ErrorView(
            message: error.toString(),
            retryLabel: l10n.helloErrorRetry,
            onRetry: () =>
                ref.read(helloControllerProvider.notifier).refresh(),
          ),
          data: (message) => ListView(
            children: [
              Padding(
                padding: const EdgeInsets.only(top: 24),
                child: HelloCard(message: message),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

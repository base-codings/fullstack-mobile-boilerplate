import 'package:flutter/material.dart';
import 'package:mobile_boilerplate/features/hello/domain/entities/hello_message.dart';

/// Card widget that displays the [HelloMessage] from the API.
///
/// Shows the greeting text prominently and the formatted timestamp below it.
/// Phase 05 will replace the hardcoded date format with an l10n-aware one.
class HelloCard extends StatelessWidget {
  const HelloCard({required this.message, super.key});

  final HelloMessage message;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final formattedTs = _formatTimestamp(message.timestamp);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              message.message,
              style: theme.textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Icon(
                  Icons.access_time,
                  size: 16,
                  color: theme.colorScheme.outline,
                ),
                const SizedBox(width: 6),
                Text(
                  formattedTs,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.outline,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  /// Format timestamp for display. Phase 05 replaces with `intl` DateFormat.
  String _formatTimestamp(DateTime dt) {
    final utc = dt.toUtc();
    return '${utc.year}-${_pad(utc.month)}-${_pad(utc.day)} '
        '${_pad(utc.hour)}:${_pad(utc.minute)}:${_pad(utc.second)} UTC';
  }

  String _pad(int n) => n.toString().padLeft(2, '0');
}

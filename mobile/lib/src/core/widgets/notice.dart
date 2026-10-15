import 'package:flutter/material.dart';

/// The independence and demo-data line the web carries in its shell footer and
/// on every auth page. The app talks to the shared CampusOne server, so the
/// wording is explicit about where demo data lives instead of repeating the
/// web's browser-storage sentence verbatim.
class IndependenceNotice extends StatelessWidget {
  const IndependenceNotice({super.key, this.compact = false});

  /// Only the independence line — for screens that already explain the demo.
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final style = theme.textTheme.labelSmall?.copyWith(
      color: theme.colorScheme.onSurfaceVariant,
      height: 1.5,
    );
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'CampusOne is an independent student-life prototype, not an official '
          'GCTU or SRC service.',
          style: style,
        ),
        if (!compact) ...[
          const SizedBox(height: 4),
          Text(
            'Demo accounts, requests and messages are stored on the connected '
            'CampusOne server. Never reuse your LMS or SIP password here.',
            style: style,
          ),
        ],
      ],
    );
  }
}

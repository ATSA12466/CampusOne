import 'package:flutter/material.dart';

/// The independence and data notice the web carries in its shell footer and
/// on every auth page. The app sends sign-in/profile requests to the API base
/// configured by the user, so the copy avoids the web's browser-storage claim.
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
            'Sign-in and profile updates use the API server configured for this app. '
            'Never reuse your LMS or SIP password here.',
            style: style,
          ),
        ],
      ],
    );
  }
}

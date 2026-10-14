import 'package:flutter/material.dart';

import '../api/api_client.dart';

/// Consistent loading / empty / error / content handling for every screen.
class AsyncView<T> extends StatelessWidget {
  const AsyncView({
    super.key,
    required this.snapshot,
    required this.builder,
    this.emptyTitle = 'Nothing here yet',
    this.emptyMessage = 'Check back later for updates.',
    this.emptyIcon = Icons.inbox_outlined,
    this.onRetry,
  });

  final AsyncSnapshot<T> snapshot;
  final Widget Function(BuildContext context, T data) builder;
  final String emptyTitle;
  final String emptyMessage;
  final IconData emptyIcon;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    if (snapshot.connectionState == ConnectionState.waiting &&
        !snapshot.hasData) {
      return const LoadingView();
    }
    if (snapshot.hasError) {
      return ErrorView(
        message: _friendly(snapshot.error),
        onRetry: onRetry,
      );
    }
    final data = snapshot.data;
    if (data == null || (data is List && data.isEmpty)) {
      return EmptyView(
        title: emptyTitle,
        message: emptyMessage,
        icon: emptyIcon,
      );
    }
    return builder(context, data);
  }

  static String _friendly(Object? error) {
    if (error is ApiException) return error.message;
    return 'Something went wrong. Please retry.';
  }
}

class LoadingView extends StatelessWidget {
  const LoadingView({super.key, this.label});

  final String? label;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(),
            if (label != null) ...[
              const SizedBox(height: 12),
              Text(label!, style: Theme.of(context).textTheme.bodyMedium),
            ],
          ],
        ),
      ),
    );
  }
}

class EmptyView extends StatelessWidget {
  const EmptyView({
    super.key,
    required this.title,
    required this.message,
    this.icon = Icons.inbox_outlined,
    this.action,
  });

  final String title;
  final String message;
  final IconData icon;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 56, color: theme.colorScheme.primary),
            const SizedBox(height: 16),
            Text(title, style: theme.textTheme.titleLarge),
            const SizedBox(height: 8),
            Text(
              message,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
            if (action != null) ...[
              const SizedBox(height: 16),
              action!,
            ],
          ],
        ),
      ),
    );
  }
}

class ErrorView extends StatelessWidget {
  const ErrorView({super.key, required this.message, this.onRetry});

  final String message;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.signal_wifi_connected_no_internet_4_outlined,
              size: 56,
              color: theme.colorScheme.error,
            ),
            const SizedBox(height: 16),
            Text(
              message,
              style: theme.textTheme.bodyLarge,
              textAlign: TextAlign.center,
            ),
            if (onRetry != null) ...[
              const SizedBox(height: 16),
              OutlinedButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh),
                label: const Text('Retry'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Small status chip used across lists.
class StatusChip extends StatelessWidget {
  const StatusChip({super.key, required this.label, this.tone = ChipTone.info});

  final String label;
  final ChipTone tone;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final Color background;
    final Color foreground;
    switch (tone) {
      case ChipTone.success:
        background = scheme.primaryContainer;
        foreground = scheme.onPrimaryContainer;
      case ChipTone.warning:
        background = scheme.tertiaryContainer;
        foreground = scheme.onTertiaryContainer;
      case ChipTone.danger:
        background = scheme.errorContainer;
        foreground = scheme.onErrorContainer;
      case ChipTone.info:
        background = scheme.surfaceContainerHighest;
        foreground = scheme.onSurfaceVariant;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: Theme.of(
          context,
        ).textTheme.labelSmall?.copyWith(color: foreground),
      ),
    );
  }
}

enum ChipTone { info, success, warning, danger }

/// Tappable list row with a title, subtitle and trailing widget.
class InfoRow extends StatelessWidget {
  const InfoRow({
    super.key,
    required this.title,
    this.subtitle,
    this.leading,
    this.trailing,
    this.onTap,
  });

  final String title;
  final String? subtitle;
  final Widget? leading;
  final Widget? trailing;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 4),
      leading: leading,
      title: Text(title, style: theme.textTheme.titleSmall),
      subtitle: subtitle == null
          ? null
          : Text(
              subtitle!,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
      trailing: trailing,
      onTap: onTap,
    );
  }
}

void showAppMessage(BuildContext context, String message, {bool error = false}) {
  final scheme = Theme.of(context).colorScheme;
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: error ? scheme.errorContainer : null,
      ),
    );
}

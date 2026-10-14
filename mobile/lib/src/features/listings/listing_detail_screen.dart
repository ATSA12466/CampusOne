import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/auth/auth_session.dart';
import '../../core/links/app_links.dart';
import '../../core/store/personal_store.dart';
import '../../core/store/saves_repository.dart';
import '../../core/widgets/states.dart';
import 'listings_repository.dart';

/// Generic detail over the catalog listing domains.
class ListingDetailScreen extends StatefulWidget {
  const ListingDetailScreen({
    super.key,
    required this.domain,
    required this.id,
    this.title,
  });

  final String domain;
  final String id;
  final String? title;

  @override
  State<ListingDetailScreen> createState() => _ListingDetailScreenState();
}

class _ListingDetailScreenState extends State<ListingDetailScreen> {
  Future<_Detail>? _future;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= _load();
  }

  Future<_Detail> _load() async {
    final api = SessionScope.apiOf(context);
    final item = await ListingsRepository(api).detail(widget.domain, widget.id);
    var saved = false;
    if (SessionScope.sessionOf(context).signedIn) {
      try {
        saved = await SavesRepository(api).isSaved(_saveKind, _entityId);
      } on ApiException {
        saved = false;
      }
    }
    return _Detail(item: item, saved: saved);
  }

  String get _saveKind => switch (widget.domain) {
    'media' => 'media',
    'announcements' => 'announcement',
    _ => 'listing',
  };

  /// Composite refs only for the generic `listing` kind; dedicated kinds
  /// use the plain item id (matches `SavedItem.ref`).
  String get _entityId => _saveKind == 'listing'
      ? SavesRepository.listingRef(widget.domain, widget.id)
      : widget.id;

  Future<void> _reload() async {
    final future = _load();
    if (!mounted) return;
    setState(() => _future = future);
    try {
      await future;
    } catch (_) {
      // FutureBuilder surfaces the error; refresh only waits for completion.
    }
  }

  Future<void> _toggleSaved(bool value) async {
    try {
      await SavesRepository(
        SessionScope.apiOf(context),
      ).setSaved(_saveKind, _entityId, value);
      _reload();
    } on ApiException catch (error) {
      if (mounted) showAppMessage(context, error.message, error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final signedIn = SessionScope.sessionOf(context).signedIn;
    return Scaffold(
      appBar: AppBar(title: Text(widget.title ?? 'Details')),
      body: FutureBuilder<_Detail>(
        future: _future,
        builder: (context, snapshot) => AsyncView<_Detail>(
          snapshot: snapshot,
          onRetry: _reload,
          builder: (context, data) {
            final item = data.item;
            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item.title,
                            style: Theme.of(context).textTheme.headlineSmall,
                          ),
                          if (item.subtitle.isNotEmpty) ...[
                            const SizedBox(height: 4),
                            Text(
                              item.subtitle,
                              style: Theme.of(context).textTheme.bodyMedium
                                  ?.copyWith(
                                    color: Theme.of(
                                      context,
                                    ).colorScheme.onSurfaceVariant,
                                  ),
                            ),
                          ],
                        ],
                      ),
                    ),
                    IconButton(
                      tooltip: data.saved ? 'Unsave' : 'Save',
                      onPressed: signedIn
                          ? () => _toggleSaved(!data.saved)
                          : null,
                      icon: Icon(
                        data.saved
                            ? Icons.bookmark
                            : Icons.bookmark_border_outlined,
                      ),
                    ),
                  ],
                ),
                if (item.chips.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      for (final chip in item.chips) StatusChip(label: chip),
                    ],
                  ),
                ],
                if (item.description.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Text(item.description),
                ],
                if ((item.extra['facilities'] ?? '').isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(
                    'Facilities: ${item.extra['facilities']}',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ],
                for (final paragraph in item.body) ...[
                  const SizedBox(height: 12),
                  Text(paragraph),
                ],
                const SizedBox(height: 16),
                _DomainActions(item: item),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _DomainActions extends StatelessWidget {
  const _DomainActions({required this.item});

  final ListingItem item;

  @override
  Widget build(BuildContext context) {
    final signedIn = SessionScope.sessionOf(context).signedIn;
    switch (item.domain) {
      case 'opportunities':
        final url = item.extra['applyUrl'] ?? '';
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const _HonestyNote(
              text:
                  'Illustrative opportunity, not a verified provider announcement. Confirm eligibility and closing dates independently.',
            ),
            const SizedBox(height: 8),
            FilledButton.icon(
              onPressed: signedIn
                  ? () => _apply(context)
                  : null,
              icon: const Icon(Icons.send_outlined),
              label: const Text('Record application'),
            ),
            if (url.isNotEmpty) ...[
              const SizedBox(height: 8),
              OutlinedButton.icon(
                onPressed: () => openExternalLink(context, url),
                icon: const Icon(Icons.open_in_new),
                label: const Text('Open provider page'),
              ),
            ],
          ],
        );
      case 'media':
        final source = item.extra['source'] ?? '';
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const _HonestyNote(
              text:
                  'Licensed CC0 playback sample — not a campus recording.',
            ),
            const SizedBox(height: 8),
            FilledButton.icon(
              onPressed: source.isEmpty
                  ? null
                  : () => openExternalLink(
                      context,
                      _resolve(context, source),
                    ),
              icon: const Icon(Icons.play_arrow_outlined),
              label: const Text('Play sample'),
            ),
          ],
        );
      case 'marketplace':
      case 'accommodation':
      case 'resources':
      case 'lostFound':
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const _HonestyNote(
              text:
                  'Illustrative fixture. Verify condition, availability and terms independently before any payment or handover.',
            ),
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: signedIn ? () => _enquire(context) : null,
              icon: const Icon(Icons.mail_outlined),
              label: Text(
                item.domain == 'lostFound'
                    ? 'Record a report note'
                    : 'Send an enquiry',
              ),
            ),
          ],
        );
      default:
        return const SizedBox.shrink();
    }
  }

  String _resolve(BuildContext context, String source) {
    if (source.startsWith('http')) return source;
    final base = SessionScope.apiOf(context).baseUrl;
    if (!source.startsWith('/media/') || source.contains('..')) return '';
    return '$base$source';
  }

  Future<void> _apply(BuildContext context) async {
    final message = await _askMessage(
      context,
      title: 'Record application',
      label: 'Notes for yourself (min 15 characters)',
    );
    if (message == null) return;
    try {
      await ListingsRepository(
        SessionScope.apiOf(context),
      ).sendEnquiry(
        ListingEnquiry(
          id: newRecordId('enq'),
          category: 'opportunities',
          listingId: item.id,
          message: message,
          intent: 'application',
          createdAt: DateTime.now().toUtc().toIso8601String(),
        ),
      );
      if (context.mounted) {
        showAppMessage(context, 'Application recorded on your account.');
      }
    } on ApiException catch (error) {
      if (context.mounted) {
        showAppMessage(context, error.message, error: true);
      }
    }
  }

  Future<void> _enquire(BuildContext context) async {
    final message = await _askMessage(
      context,
      title: item.domain == 'lostFound' ? 'Report note' : 'Enquiry',
      label: 'Message (min 15 characters)',
    );
    if (message == null) return;
    try {
      await ListingsRepository(
        SessionScope.apiOf(context),
      ).sendEnquiry(
        ListingEnquiry(
          id: newRecordId('enq'),
          category: _enquiryCategory,
          listingId: item.id,
          message: message,
          intent: item.domain == 'lostFound' ? 'report' : 'enquiry',
          createdAt: DateTime.now().toUtc().toIso8601String(),
        ),
      );
      if (context.mounted) {
        showAppMessage(context, 'Saved to your account.');
      }
    } on ApiException catch (error) {
      if (context.mounted) {
        showAppMessage(context, error.message, error: true);
      }
    }
  }

  String get _enquiryCategory => switch (item.domain) {
    'marketplace' => 'marketplace',
    'accommodation' => 'accommodation',
    'resources' => 'resources',
    'lostFound' => 'lost-found',
    _ => 'marketplace',
  };

  Future<String?> _askMessage(
    BuildContext context, {
    required String title,
    required String label,
  }) async {
    final controller = TextEditingController();
    try {
      return await showDialog<String>(
        context: context,
        builder: (context) => AlertDialog(
          title: Text(title),
          content: TextField(
            controller: controller,
            decoration: InputDecoration(labelText: label),
            minLines: 3,
            maxLines: 5,
            maxLength: 1500,
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () {
                if (controller.text.trim().length < 15) {
                  showAppMessage(
                    context,
                    'Write at least 15 characters.',
                    error: true,
                  );
                  return;
                }
                Navigator.of(context).pop(controller.text.trim());
              },
              child: const Text('Save'),
            ),
          ],
        ),
      );
    } finally {
      controller.dispose();
    }
  }
}

class _HonestyNote extends StatelessWidget {
  const _HonestyNote({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: scheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(text, style: Theme.of(context).textTheme.bodySmall),
    );
  }
}

class _Detail {
  _Detail({required this.item, required this.saved});

  final ListingItem item;
  final bool saved;
}

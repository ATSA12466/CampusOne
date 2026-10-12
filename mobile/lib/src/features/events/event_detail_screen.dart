import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/auth/auth_session.dart';
import '../../core/widgets/states.dart';
import '../attendance/exec_sessions_screen.dart';
import '../catalog/catalog_repository.dart';
import 'events_repository.dart';

class EventDetailScreen extends StatefulWidget {
  const EventDetailScreen({super.key, required this.eventId});

  final String eventId;

  @override
  State<EventDetailScreen> createState() => _EventDetailScreenState();
}

class _EventDetailScreenState extends State<EventDetailScreen> {
  Future<_EventDetail>? _future;
  bool _busy = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= _load();
  }

  Future<_EventDetail> _load() async {
    final api = SessionScope.apiOf(context);
    final repo = EventsRepository(api);
    final event = await CatalogRepository(api).event(widget.eventId);
    Ticket? ticket;
    bool saved = false;
    if (SessionScope.sessionOf(context).signedIn) {
      ticket = await repo.ticket(widget.eventId);
      try {
        saved = await repo.saved(widget.eventId);
      } on ApiException {
        saved = false;
      }
    }
    return _EventDetail(event: event, ticket: ticket, saved: saved);
  }

  void _reload() => setState(() => _future = _load());

  Future<void> _setRsvp(bool attending) async {
    if (_busy) return;
    if (!SessionScope.sessionOf(context).signedIn) {
      showAppMessage(context, 'Please sign in to RSVP.', error: true);
      return;
    }
    setState(() => _busy = true);
    try {
      await EventsRepository(
        SessionScope.apiOf(context),
      ).setRsvp(widget.eventId, attending);
      if (mounted) {
        showAppMessage(
          context,
          attending ? "You're going. Ticket issued." : 'RSVP cancelled.',
        );
      }
      _reload();
    } on ApiException catch (error) {
      if (mounted) showAppMessage(context, error.message, error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _toggleSaved(bool value) async {
    try {
      await EventsRepository(
        SessionScope.apiOf(context),
      ).setSaved(widget.eventId, value);
      _reload();
    } on ApiException catch (error) {
      if (mounted) showAppMessage(context, error.message, error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final session = SessionScope.sessionOf(context);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Event'),
        actions: [
          if (session.user?.isExecutive == true)
            IconButton(
              tooltip: 'Attendance sessions',
              icon: const Icon(Icons.qr_code_2_outlined),
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) =>
                      ExecSessionsScreen(eventId: widget.eventId),
                ),
              ),
            ),
        ],
      ),
      body: FutureBuilder<_EventDetail>(
        future: _future,
        builder: (context, snapshot) => AsyncView<_EventDetail>(
          snapshot: snapshot,
          onRetry: _reload,
          builder: (context, data) {
            final event = data.event;
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
                            event.title,
                            style: Theme.of(context).textTheme.headlineSmall,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${event.date} · ${event.venue}',
                            style: Theme.of(context).textTheme.bodyMedium
                                ?.copyWith(
                                  color: Theme.of(
                                    context,
                                  ).colorScheme.onSurfaceVariant,
                                ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      tooltip: data.saved ? 'Unsave' : 'Save',
                      onPressed: session.signedIn
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
                if (event.tagline.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(event.tagline),
                ],
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  children: [
                    StatusChip(label: event.category),
                    StatusChip(
                      label: '${event.registered}/${event.seats} going',
                      tone: event.full ? ChipTone.warning : ChipTone.info,
                    ),
                    if (event.organizer.isNotEmpty)
                      StatusChip(label: event.organizer),
                  ],
                ),
                if (data.ticket != null) ...[
                  const SizedBox(height: 16),
                  _TicketCard(ticket: data.ticket!),
                ],
                const SizedBox(height: 16),
                if (data.ticket == null)
                  FilledButton.icon(
                    onPressed: _busy || event.full
                        ? null
                        : () => _setRsvp(true),
                    icon: const Icon(Icons.confirmation_number_outlined),
                    label: Text(event.full ? 'Event full' : 'RSVP — I\'m going'),
                  )
                else
                  OutlinedButton.icon(
                    onPressed: _busy ? null : () => _setRsvp(false),
                    icon: const Icon(Icons.close),
                    label: const Text('Cancel RSVP'),
                  ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _TicketCard extends StatelessWidget {
  const _TicketCard({required this.ticket});

  final Ticket ticket;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Card(
      color: scheme.primaryContainer,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.confirmation_number_outlined,
                  color: scheme.onPrimaryContainer,
                ),
                const SizedBox(width: 8),
                Text(
                  'Your ticket',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: scheme.onPrimaryContainer,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              ticket.reference,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: scheme.onPrimaryContainer,
                fontWeight: FontWeight.bold,
              ),
            ),
            Text(
              '${ticket.name} · issued ${prettyDate(ticket.issuedAt)}',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: scheme.onPrimaryContainer,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _EventDetail {
  _EventDetail({required this.event, required this.ticket, required this.saved});

  final EventItem event;
  final Ticket? ticket;
  final bool saved;
}

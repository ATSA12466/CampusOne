import 'package:add_2_calendar/add_2_calendar.dart';
import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/auth/auth_session.dart';
import '../../core/media/media.dart';
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

  Future<void> _addToCalendar(EventItem event) async {
    final start =
        DateTime.tryParse(event.startsAt) ?? DateTime.tryParse(event.date);
    if (start == null) {
      if (mounted) {
        showAppMessage(context, 'This event has no usable start time.', error: true);
      }
      return;
    }
    final end =
        DateTime.tryParse(event.endsAt) ?? start.add(const Duration(hours: 2));
    try {
      final added = await Add2Calendar.addEvent2Cal(
        Event(
          title: event.title,
          description: event.tagline,
          location: event.venue,
          startDate: start,
          endDate: end.isAfter(start) ? end : start.add(const Duration(hours: 2)),
        ),
      );
      if (mounted) {
        showAppMessage(
          context,
          added ? 'Opening your calendar…' : 'Could not open the calendar app.',
          error: !added,
        );
      }
    } catch (_) {
      if (mounted) {
        showAppMessage(context, 'Could not open the calendar app.', error: true);
      }
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
                CampusImage(
                  image:
                      event.cover ??
                      DemoImages.forCategory(event.category) ??
                      DemoImages.innovationNight,
                  alt: event.cover?.alt,
                  aspect: CampusAspect.panorama,
                ),
                const SizedBox(height: 16),
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
                if (event.highlights.isNotEmpty ||
                    event.agenda.isNotEmpty ||
                    event.speakers.isNotEmpty ||
                    event.description.isNotEmpty ||
                    event.gallery.isNotEmpty) ...[
                  const SizedBox(height: 20),
                  if ((event.tagline.isEmpty) && event.description.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Text(event.description.first),
                    ),
                  if (event.highlights.isNotEmpty) ...[
                    Text(
                      'Highlights',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 6),
                    for (final highlight in event.highlights)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 3),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Icon(
                              Icons.star_border,
                              size: 18,
                              color: Theme.of(context).colorScheme.primary,
                            ),
                            const SizedBox(width: 10),
                            Expanded(child: Text(highlight)),
                          ],
                        ),
                      ),
                    const SizedBox(height: 14),
                  ],
                  if (event.agenda.isNotEmpty) ...[
                    Text(
                      'Programme',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 6),
                    for (final item in event.agenda)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 6),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            SizedBox(
                              width: 56,
                              child: Text(
                                item.startsAt.length >= 16
                                    ? item.startsAt.substring(11, 16)
                                    : '',
                                style: Theme.of(context).textTheme.labelMedium
                                    ?.copyWith(
                                      color: Theme.of(
                                        context,
                                      ).colorScheme.primary,
                                      fontWeight: FontWeight.w700,
                                    ),
                              ),
                            ),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item.title,
                                    style: Theme.of(context)
                                        .textTheme
                                        .bodyMedium
                                        ?.copyWith(
                                          fontWeight: FontWeight.w600,
                                        ),
                                  ),
                                  if (item.description.isNotEmpty)
                                    Text(
                                      item.description,
                                      style: Theme.of(
                                        context,
                                      ).textTheme.bodySmall,
                                    ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    const SizedBox(height: 14),
                  ],
                  if (event.speakers.isNotEmpty) ...[
                    Text(
                      'Hosts & speakers',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 4),
                    for (final speaker in event.speakers)
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: CampusAvatar(
                          name: speaker.name,
                          image: speaker.avatar,
                        ),
                        title: Text(speaker.name),
                        subtitle: Text(speaker.role),
                      ),
                    const SizedBox(height: 10),
                  ],
                  if (event.gallery.isNotEmpty)
                    GalleryStrip(
                      images: event.gallery,
                      caption:
                          'Demo event imagery — not an actual GCTU event.',
                    ),
                ],
                if (data.ticket != null) ...[
                  const SizedBox(height: 16),
                  _TicketCard(ticket: data.ticket!),
                ],
                const SizedBox(height: 16),
                OutlinedButton.icon(
                  onPressed: () => _addToCalendar(event),
                  icon: const Icon(Icons.calendar_add_on_outlined),
                  label: const Text('Add to calendar'),
                ),
                const SizedBox(height: 8),
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

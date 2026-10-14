import 'package:flutter/material.dart';

import '../../core/auth/auth_session.dart';
import '../../core/widgets/states.dart';
import '../catalog/catalog_repository.dart';
import 'event_detail_screen.dart';

class EventsScreen extends StatefulWidget {
  const EventsScreen({super.key});

  @override
  State<EventsScreen> createState() => _EventsScreenState();
}

class _EventsScreenState extends State<EventsScreen> {
  final _search = TextEditingController();
  Future<List<EventItem>>? _future;
  String _query = '';

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= _load();
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<List<EventItem>> _load() async {
    final api = SessionScope.apiOf(context);
    final page = await CatalogRepository(api).events(search: _query);
    return page.items;
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Events')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: SearchBar(
              controller: _search,
              hintText: 'Search events',
              leading: const Icon(Icons.search),
              trailing: _query.isEmpty
                  ? null
                  : [
                      IconButton(
                        tooltip: 'Clear',
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _search.clear();
                          setState(() => _query = '');
                          _reload();
                        },
                      ),
                    ],
              onSubmitted: (value) {
                setState(() => _query = value.trim());
                _reload();
              },
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: _reload,
              child: FutureBuilder<List<EventItem>>(
                future: _future,
                builder: (context, snapshot) => AsyncView<List<EventItem>>(
                  snapshot: snapshot,
                  onRetry: _reload,
                  emptyTitle: 'No events found',
                  emptyMessage: _query.isEmpty
                      ? 'Published events will appear here.'
                      : 'Try a different search.',
                  emptyIcon: Icons.event_outlined,
                  builder: (context, events) => ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: events.length,
                    itemBuilder: (context, index) {
                      final event = events[index];
                      return Card(
                        child: ListTile(
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 8,
                          ),
                          title: Text(event.title),
                          subtitle: Text(
                            '${event.date} · ${event.venue}\n${event.registered}/${event.seats} going',
                          ),
                          isThreeLine: true,
                          trailing: event.full
                              ? const StatusChip(
                                  label: 'Full',
                                  tone: ChipTone.warning,
                                )
                              : const Icon(Icons.chevron_right),
                          onTap: () => Navigator.of(context)
                              .push(
                                MaterialPageRoute(
                                  builder: (_) => EventDetailScreen(
                                    eventId: event.id,
                                  ),
                                ),
                              )
                              .then((_) => _reload()),
                        ),
                      );
                    },
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

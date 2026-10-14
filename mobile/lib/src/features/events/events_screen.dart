import 'package:flutter/material.dart';

import '../../core/auth/auth_session.dart';
import '../../core/widgets/states.dart';
import '../catalog/catalog_repository.dart';
import 'event_detail_screen.dart';

/// Event directory: search, category chips, time window, and sort.
/// Defaults match web (upcoming first, soonest first).
class EventsScreen extends StatefulWidget {
  const EventsScreen({super.key});

  @override
  State<EventsScreen> createState() => _EventsScreenState();
}

const _timeOptions = ['Upcoming', 'This week', 'Past', 'All'];
const _sortOptions = ['Soon', 'Newest', 'Title'];

class _EventsScreenState extends State<EventsScreen> {
  final _search = TextEditingController();
  Future<List<EventItem>>? _future;
  String _query = '';
  String _category = 'all';
  String _time = _timeOptions.first;
  String _sort = _sortOptions.first;

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

  DateTime? _startOf(EventItem event) =>
      DateTime.tryParse(event.startsAt) ?? DateTime.tryParse(event.date);

  List<EventItem> _visible(List<EventItem> events) {
    final today = DateTime.now();
    final startOfToday = DateTime(today.year, today.month, today.day);
    final weekOut = startOfToday.add(const Duration(days: 7));
    final filtered = events.where((event) {
      if (_category != 'all' && event.category != _category) return false;
      final start = _startOf(event);
      return switch (_time) {
        'Upcoming' => start == null || !start.isBefore(startOfToday),
        'This week' =>
          start != null &&
              !start.isBefore(startOfToday) &&
              start.isBefore(weekOut),
        'Past' => start != null && start.isBefore(startOfToday),
        _ => true,
      };
    }).toList();
    filtered.sort((a, b) {
      switch (_sort) {
        case 'Newest':
          return b.id.compareTo(a.id);
        case 'Title':
          return a.title.compareTo(b.title);
        default:
          final sa = _startOf(a);
          final sb = _startOf(b);
          if (sa == null && sb == null) return 0;
          if (sa == null) return 1;
          if (sb == null) return -1;
          return sa.compareTo(sb);
      }
    });
    return filtered;
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
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<String>(
                    initialValue: _time,
                    decoration: const InputDecoration(
                      labelText: 'When',
                      isDense: true,
                    ),
                    items: [
                      for (final option in _timeOptions)
                        DropdownMenuItem(
                          value: option,
                          child: Text(option),
                        ),
                    ],
                    onChanged: (value) =>
                        setState(() => _time = value ?? _timeOptions.first),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    initialValue: _sort,
                    decoration: const InputDecoration(
                      labelText: 'Sort',
                      isDense: true,
                    ),
                    items: [
                      for (final option in _sortOptions)
                        DropdownMenuItem(
                          value: option,
                          child: Text(option),
                        ),
                    ],
                    onChanged: (value) =>
                        setState(() => _sort = value ?? _sortOptions.first),
                  ),
                ),
              ],
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
                  builder: (context, events) {
                    final categories = <String>{
                      for (final event in events)
                        if (event.category.isNotEmpty) event.category,
                    }.toList()..sort();
                    final visible = _visible(events);
                    return ListView(
                      padding: const EdgeInsets.all(16),
                      children: [
                        if (categories.isNotEmpty) ...[
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: [
                              FilterChip(
                                label: const Text('All'),
                                selected: _category == 'all',
                                onSelected: (_) =>
                                    setState(() => _category = 'all'),
                              ),
                              for (final category in categories)
                                FilterChip(
                                  label: Text(category),
                                  selected: _category == category,
                                  onSelected: (_) =>
                                      setState(() => _category = category),
                                ),
                            ],
                          ),
                          const SizedBox(height: 8),
                        ],
                        if (visible.isEmpty)
                          const Padding(
                            padding: EdgeInsets.symmetric(vertical: 32),
                            child: Text(
                              'No events match these filters.',
                              textAlign: TextAlign.center,
                            ),
                          ),
                        for (final event in visible)
                          Card(
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
                          ),
                      ],
                    );
                  },
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

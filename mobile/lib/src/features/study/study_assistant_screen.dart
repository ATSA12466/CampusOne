import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/auth/auth_session.dart';
import '../../core/widgets/states.dart';
import '../listings/listings_repository.dart';

/// Entry to study support: topic prompts with material search over resources.
class StudyAssistantScreen extends StatefulWidget {
  const StudyAssistantScreen({super.key});

  @override
  State<StudyAssistantScreen> createState() => _StudyAssistantScreenState();
}

class _StudyAssistantScreenState extends State<StudyAssistantScreen> {
  static const prompts = [
    'Explain recursion like I am new to programming',
    'Summarise key formulas for linear algebra week 3',
    'Give me a 7-day revision plan for calculus',
    'Quiz me on HTTP status codes',
  ];
  final _controller = TextEditingController();
  Future<List<ListingItem>>? _future;
  String _topic = '';

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _search() {
    setState(() {
      _topic = _controller.text.trim();
      _future = ListingsRepository(
        SessionScope.apiOf(context),
      ).list('resources', search: _topic);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Study assistant')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text(
            'Searchable study materials. Pick a prompt or type your own topic.',
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final prompt in prompts)
                ActionChip(
                  label: Text(prompt, overflow: TextOverflow.ellipsis),
                  onPressed: () {
                    _controller.text = prompt;
                    _search();
                  },
                ),
            ],
          ),
          const SizedBox(height: 12),
          SearchBar(
            controller: _controller,
            hintText: 'Ask a study question…',
            leading: const Icon(Icons.psychology_outlined),
            onSubmitted: (_) => _search(),
          ),
          const SizedBox(height: 16),
          if (_future != null)
            FutureBuilder<List<ListingItem>>(
              future: _future,
              builder: (context, snapshot) => AsyncView<List<ListingItem>>(
                snapshot: snapshot,
                onRetry: _search,
                emptyTitle: 'No materials for “$_topic”',
                emptyMessage:
                    'Try a module title or topic keyword instead.',
                emptyIcon: Icons.school_outlined,
                builder: (context, items) => Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Matching materials (${items.length})',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 8),
                    for (final item in items)
                      Card(
                        child: ListTile(
                          title: Text(item.title),
                          subtitle: Text(item.subtitle),
                          trailing: IconButton(
                            tooltip: 'Copy title',
                            icon: const Icon(Icons.copy_outlined),
                            onPressed: () async {
                              await Clipboard.setData(
                                ClipboardData(text: item.title),
                              );
                              if (context.mounted) {
                                showAppMessage(
                                  context,
                                  'Title copied.',
                                );
                              }
                            },
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

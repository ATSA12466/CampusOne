import 'package:flutter/material.dart';

import '../../core/auth/auth_session.dart';
import '../../core/media/media.dart';
import '../../core/widgets/states.dart';
import '../listings/listings_repository.dart';

 /// The student's own listing enquiries and applications (account synced).
class EnquiriesScreen extends StatefulWidget {
  const EnquiriesScreen({super.key});

  @override
  State<EnquiriesScreen> createState() => _EnquiriesScreenState();
}

class _EnquiriesScreenState extends State<EnquiriesScreen> {
  Future<List<ListingEnquiry>>? _future;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= _load();
  }

  Future<List<ListingEnquiry>> _load() =>
      ListingsRepository(SessionScope.apiOf(context)).myEnquiries();

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
    return PhotoScaffold(
      image: DemoImages.clubService,
      eyebrow: 'STUDENT VOICES',
      title: 'A campus that listens.',
      description: 'Meet the responsibilities, follow the work and keep track of your requests.',
      appBar: AppBar(title: const Text('My enquiries')),
      body: RefreshIndicator(
        onRefresh: _reload,
        child: FutureBuilder<List<ListingEnquiry>>(
          future: _future,
          builder: (context, snapshot) => AsyncView<List<ListingEnquiry>>(
            snapshot: snapshot,
            onRetry: _reload,
            emptyTitle: 'No enquiries yet',
            emptyMessage:
                'Enquiries you send from listings and applications you record appear here.',
            emptyIcon: Icons.outgoing_mail,
            builder: (context, enquiries) => ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: enquiries.length,
              itemBuilder: (context, index) {
                final enquiry = enquiries[index];
                return Card(
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    title: Text(enquiry.category),
                    subtitle: Text(
                      '${enquiry.intent} · ${prettyDate(enquiry.createdAt)}\n${enquiry.message}',
                    ),
                    isThreeLine: true,
                  ),
                );
              },
            ),
          ),
        ),
      ),
    );
  }
}

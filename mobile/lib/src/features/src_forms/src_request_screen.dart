import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/auth/auth_session.dart';
import '../../core/store/personal_store.dart';
import '../../core/widgets/states.dart';

class SrcRequest {
  SrcRequest({
    required this.id,
    required this.title,
    required this.category,
    required this.description,
    required this.status,
    required this.createdAt,
  });

  final String id;
  final String title;
  final String category;
  final String description;
  final String status;
  final String createdAt;

  factory SrcRequest.fromJson(Map<String, dynamic> json) => SrcRequest(
    id: asString(json['id']),
    title: asString(json['title']),
    category: asString(json['category']),
    description: asString(json['description']),
    status: asString(json['status'], 'submitted'),
    createdAt: asString(json['createdAt']),
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'category': category,
    'description': description,
    'status': status,
    'createdAt': createdAt,
  };
}

/// Submit a request to the SRC office + keep a personal copy of submissions.
/// Review happens on the SRC side; students keep the submitted text here.
class SrcRequestScreen extends StatefulWidget {
  const SrcRequestScreen({super.key});

  @override
  State<SrcRequestScreen> createState() => _SrcRequestScreenState();
}

class _SrcRequestScreenState extends State<SrcRequestScreen> {
  Future<List<SrcRequest>>? _future;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= _load();
  }

  Future<List<SrcRequest>> _load() async => (await PersonalStoreRepository(
    SessionScope.apiOf(context),
  ).list('requests')).map(SrcRequest.fromJson).toList();

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

  Future<void> _compose() async {
    final submitted = await Navigator.of(
      context,
    ).push<bool>(MaterialPageRoute(builder: (_) => const _Composer()));
    if (submitted == true) _reload();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('SRC requests')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _compose,
        icon: const Icon(Icons.add),
        label: const Text('New request'),
      ),
      body: RefreshIndicator(
        onRefresh: _reload,
        child: FutureBuilder<List<SrcRequest>>(
          future: _future,
          builder: (context, snapshot) => AsyncView<List<SrcRequest>>(
            snapshot: snapshot,
            onRetry: _reload,
            emptyTitle: 'No requests yet',
            emptyMessage:
                'Requests you submit to the SRC office are kept here for your records.',
            emptyIcon: Icons.account_balance_outlined,
            builder: (context, requests) => ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: requests.length,
              itemBuilder: (context, index) {
                final request = requests[index];
                return Card(
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    title: Text(request.title),
                    subtitle: Text(
                      '${request.category} · ${prettyDate(request.createdAt)}\n${request.description}',
                    ),
                    isThreeLine: true,
                    trailing: StatusChip(label: request.status),
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

class _Composer extends StatefulWidget {
  const _Composer();

  @override
  State<_Composer> createState() => _ComposerState();
}

class _ComposerState extends State<_Composer> {
  static const categories = ['Academic support', 'Welfare', 'Infrastructure'];
  final _form = GlobalKey<FormState>();
  final _title = TextEditingController();
  final _description = TextEditingController();
  String _category = categories.first;
  bool _busy = false;

  @override
  void dispose() {
    _title.dispose();
    _description.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate() || _busy) return;
    setState(() => _busy = true);
    try {
      final api = SessionScope.apiOf(context);
      await api.post(
        ApiPaths.srcRequests,
        body: {
          'title': _title.text.trim(),
          'category': _category,
          'description': _description.text.trim(),
        },
      );
      await PersonalStoreRepository(api).put('requests', {
        'id': newRecordId('req'),
        'title': _title.text.trim(),
        'category': _category,
        'description': _description.text.trim(),
        'status': 'submitted',
        // studentRequestSchema.createdAt is a calendar date (YYYY-MM-DD).
        'createdAt': DateTime.now().toUtc().toIso8601String().substring(0, 10),
      });
      if (mounted) {
        showAppMessage(context, 'Request submitted to the SRC office.');
        Navigator.of(context).pop(true);
      }
    } on ApiException catch (error) {
      if (mounted) showAppMessage(context, error.message, error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('New SRC request')),
      body: Form(
        key: _form,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _title,
              decoration: const InputDecoration(labelText: 'Title'),
              maxLength: 120,
              validator: (value) => (value ?? '').trim().length >= 3
                  ? null
                  : 'Add a title.',
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _category,
              decoration: const InputDecoration(labelText: 'Category'),
              items: [
                for (final category in categories)
                  DropdownMenuItem(
                    value: category,
                    child: Text(category),
                  ),
              ],
              onChanged: (value) =>
                  setState(() => _category = value ?? categories.first),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _description,
              decoration: const InputDecoration(labelText: 'Description'),
              minLines: 4,
              maxLines: 8,
              maxLength: 2000,
              validator: (value) => (value ?? '').trim().length >= 10
                  ? null
                  : 'Add enough context for review (min 10 characters).',
            ),
            const SizedBox(height: 8),
            const Text(
              'Submitted to the SRC office for review. A copy stays on your account.',
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _busy ? null : _submit,
              child: const Text('Submit request'),
            ),
          ],
        ),
      ),
    );
  }
}

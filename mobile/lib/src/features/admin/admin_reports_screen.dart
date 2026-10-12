import 'package:flutter/material.dart';

import '../../core/auth/auth_session.dart';
import '../../core/widgets/states.dart';
import 'admin_repository.dart';

/// Super-admin / SRC read access to moderation reports and a user snapshot.
class AdminReportsScreen extends StatefulWidget {
  const AdminReportsScreen({super.key});

  @override
  State<AdminReportsScreen> createState() => _AdminReportsScreenState();
}

class _AdminReportsScreenState extends State<AdminReportsScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs;
  Future<List<ModerationReport>>? _reports;
  Future<List<AdminUserRow>>? _users;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _reports ??= AdminRepository(SessionScope.apiOf(context)).reports();
    _users ??= AdminRepository(SessionScope.apiOf(context)).users();
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  void _reload() => setState(() {
    _reports = AdminRepository(SessionScope.apiOf(context)).reports();
    _users = AdminRepository(SessionScope.apiOf(context)).users();
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Reports & admin'),
        bottom: const TabBar(
          tabs: [
            Tab(text: 'Reports'),
            Tab(text: 'Users'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabs,
        children: [
          RefreshIndicator(
            onRefresh: () async => _reload(),
            child: FutureBuilder<List<ModerationReport>>(
              future: _reports,
              builder: (context, snapshot) =>
                  AsyncView<List<ModerationReport>>(
                    snapshot: snapshot,
                    onRetry: _reload,
                    emptyTitle: 'No reports',
                    emptyMessage: 'Community reports appear here.',
                    emptyIcon: Icons.shield_outlined,
                    builder: (context, reports) => ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: reports.length,
                      itemBuilder: (context, index) {
                        final report = reports[index];
                        return Card(
                          child: ListTile(
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 8,
                            ),
                            title: Text(report.reason),
                            subtitle: Text(
                              '${report.targetType} · ${report.targetId}\n${prettyDateTime(report.createdAt)}',
                            ),
                            isThreeLine: true,
                            trailing: StatusChip(label: report.status),
                          ),
                        );
                      },
                    ),
                  ),
            ),
          ),
          RefreshIndicator(
            onRefresh: () async => _reload(),
            child: FutureBuilder<List<AdminUserRow>>(
              future: _users,
              builder: (context, snapshot) => AsyncView<List<AdminUserRow>>(
                snapshot: snapshot,
                onRetry: _reload,
                emptyTitle: 'No users',
                emptyMessage: 'Registered members appear here.',
                emptyIcon: Icons.group_outlined,
                builder: (context, users) => ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: users.length,
                  itemBuilder: (context, index) {
                    final user = users[index];
                    return Card(
                      child: ListTile(
                        leading: CircleAvatar(
                          child: Text(
                            user.name.isEmpty
                                ? '?'
                                : user.name.characters.first.toUpperCase(),
                          ),
                        ),
                        title: Text(user.name),
                        subtitle: Text(user.email),
                        trailing: StatusChip(label: user.role),
                      ),
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

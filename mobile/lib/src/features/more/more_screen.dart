import 'package:flutter/material.dart';

import '../../core/auth/auth_session.dart';
import '../admin/admin_reports_screen.dart';
import '../attendance/attendance_history_screen.dart';
import '../badges/badges_screen.dart';
import '../catalog/accommodation_screen.dart';
import '../catalog/announcements_screen.dart';
import '../catalog/materials_screen.dart';
import '../catalog/src_office_screen.dart';
import '../executives/executives_screen.dart';
import '../notifications/notifications_screen.dart';
import '../profile/profile_screen.dart';
import '../settings/server_settings_screen.dart';

class MoreScreen extends StatelessWidget {
  const MoreScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final session = SessionScope.sessionOf(context);
    final signedIn = session.signedIn;
    final elevated = session.user?.isExecutive == true;
    final admin = session.user?.isAdminRole == true;
    return Scaffold(
      appBar: AppBar(title: const Text('More')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (signedIn) ...[
            _Row(
              icon: Icons.notifications_outlined,
              title: 'Notifications',
              onTap: () => _go(context, const NotificationsScreen()),
            ),
            _Row(
              icon: Icons.how_to_reg_outlined,
              title: 'My attendance',
              onTap: () => _go(context, const AttendanceHistoryScreen()),
            ),
            _Row(
              icon: Icons.verified_outlined,
              title: 'My badges',
              onTap: () => _go(context, const BadgesScreen()),
            ),
            if (elevated)
              _Row(
                icon: Icons.admin_panel_settings_outlined,
                title: 'Executive tools',
                onTap: () => _go(context, const ExecutivesScreen()),
              ),
            if (admin)
              _Row(
                icon: Icons.shield_outlined,
                title: 'Reports & admin',
                onTap: () => _go(context, const AdminReportsScreen()),
              ),
            const SizedBox(height: 8),
          ],
          _Row(
            icon: Icons.campaign_outlined,
            title: 'Announcements',
            onTap: () => _go(context, const AnnouncementsScreen()),
          ),
          _Row(
            icon: Icons.bed_outlined,
            title: 'Accommodation',
            onTap: () => _go(context, const AccommodationScreen()),
          ),
          _Row(
            icon: Icons.menu_book_outlined,
            title: 'Study materials',
            onTap: () => _go(context, const MaterialsScreen()),
          ),
          _Row(
            icon: Icons.account_balance_outlined,
            title: 'SRC office',
            onTap: () => _go(context, const SrcOfficeScreen()),
          ),
          _Row(
            icon: Icons.person_outline,
            title: 'Profile',
            onTap: () => _go(context, const ProfileScreen()),
          ),
          _Row(
            icon: Icons.dns_outlined,
            title: 'Server',
            subtitle: SessionScope.apiOf(context).baseUrl,
            onTap: () => _go(context, const ServerSettingsScreen()),
          ),
        ],
      ),
    );
  }

  void _go(BuildContext context, Widget screen) {
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => screen));
  }
}

class _Row extends StatelessWidget {
  const _Row({required this.icon, required this.title, this.subtitle, this.onTap});

  final IconData icon;
  final String title;
  final String? subtitle;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: Icon(icon),
        title: Text(title),
        subtitle: subtitle == null ? null : Text(subtitle!),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }
}

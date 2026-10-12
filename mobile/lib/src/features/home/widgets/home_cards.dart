import 'package:flutter/material.dart';

import '../../../core/auth/auth_session.dart';
import '../../../core/widgets/states.dart';
import '../../catalog/catalog_repository.dart';
import '../../events/event_detail_screen.dart';

class CheckInBanner extends StatelessWidget {
  const CheckInBanner({super.key, required this.onScan});

  final VoidCallback onScan;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Card(
      color: scheme.primaryContainer,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Icon(
              Icons.qr_code_scanner,
              size: 40,
              color: scheme.onPrimaryContainer,
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'At an event?',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: scheme.onPrimaryContainer,
                    ),
                  ),
                  Text(
                    'Scan the session QR to check in.',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: scheme.onPrimaryContainer,
                    ),
                  ),
                ],
              ),
            ),
            FilledButton(onPressed: onScan, child: const Text('Scan')),
          ],
        ),
      ),
    );
  }
}

class StatsRow extends StatelessWidget {
  const StatsRow({
    super.key,
    required this.checkins,
    required this.badgeCount,
    required this.unread,
    required this.onCheckins,
    required this.onBadges,
    required this.onUnread,
  });

  final int checkins;
  final int badgeCount;
  final int unread;
  final VoidCallback onCheckins;
  final VoidCallback onBadges;
  final VoidCallback onUnread;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _Stat(
            label: 'Check-ins',
            value: '$checkins',
            icon: Icons.how_to_reg_outlined,
            onTap: onCheckins,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _Stat(
            label: 'Badges',
            value: '$badgeCount',
            icon: Icons.verified_outlined,
            onTap: onBadges,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _Stat(
            label: 'Unread',
            value: '$unread',
            icon: Icons.mark_email_unread_outlined,
            onTap: onUnread,
          ),
        ),
      ],
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({
    required this.label,
    required this.value,
    required this.icon,
    required this.onTap,
  });

  final String label;
  final String value;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: Column(
            children: [
              Icon(icon, color: Theme.of(context).colorScheme.primary),
              const SizedBox(height: 4),
              Text(value, style: Theme.of(context).textTheme.titleLarge),
              Text(
                label,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class SectionHeader extends StatelessWidget {
  const SectionHeader({super.key, required this.title, this.onSeeAll});

  final String title;
  final VoidCallback? onSeeAll;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(title, style: Theme.of(context).textTheme.titleMedium),
        if (onSeeAll != null)
          TextButton(onPressed: onSeeAll, child: const Text('See all')),
      ],
    );
  }
}

class EventRow extends StatelessWidget {
  const EventRow({super.key, required this.event});

  final EventItem event;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        title: Text(event.title),
        subtitle: Text('${event.date} · ${event.venue}'),
        trailing: event.full
            ? const StatusChip(label: 'Full', tone: ChipTone.warning)
            : Text(
                '${event.registered}/${event.seats}',
                style: Theme.of(context).textTheme.bodySmall,
              ),
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => EventDetailScreen(eventId: event.id),
          ),
        ),
      ),
    );
  }
}

class AnnouncementRow extends StatelessWidget {
  const AnnouncementRow({super.key, required this.item});

  final Announcement item;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        leading: Icon(
          item.pinned ? Icons.push_pin_outlined : Icons.campaign_outlined,
          color: Theme.of(context).colorScheme.primary,
        ),
        title: Text(item.title, maxLines: 2, overflow: TextOverflow.ellipsis),
        subtitle: Text(
          item.content,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
      ),
    );
  }
}

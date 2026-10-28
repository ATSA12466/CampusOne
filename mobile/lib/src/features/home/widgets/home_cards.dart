import 'package:flutter/material.dart';

import '../../../core/media/media.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/util/campus_date.dart';
import '../../../core/widgets/states.dart';
import '../../catalog/catalog_repository.dart';
import '../../schedule/schedule_repository.dart';
import '../../tasks/tasks_repository.dart';

/// Photo-led home building blocks, in the same order and with the same
/// treatments as the web home feature (`src/features/home/components/*`).

class WelcomeHeader extends StatelessWidget {
  const WelcomeHeader({
    super.key,
    required this.greeting,
    required this.now,
    this.signedIn = false,
  });

  final String greeting;
  final DateTime now;
  final bool signedIn;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'MAKE IT YOUR CAMPUS',
          style: theme.textTheme.labelSmall?.copyWith(
            color: theme.colorScheme.primary,
            letterSpacing: 1.6,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          greeting,
          style: theme.textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          '${longDateLabel(now)} · Accra time',
          style: theme.textTheme.bodySmall?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
        if (!signedIn)
          Padding(
            padding: const EdgeInsets.only(top: 10),
            child: Text(
              'Signed out: showing the public campus feed. Sign in for your '
              'check-ins, saved items and classes.',
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ),
      ],
    );
  }
}

/// "On the campus radar" — sponsored and editorial slides, each anchored by a
/// photo exactly as the web carousel does it.
class FeaturedCarousel extends StatelessWidget {
  const FeaturedCarousel({
    super.key,
    required this.items,
    required this.onOpen,
  });

  final List<FeaturedItem> items;
  final void Function(FeaturedItem item) onOpen;

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) return const SizedBox.shrink();
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                'ON THE CAMPUS RADAR',
                style: theme.textTheme.labelSmall?.copyWith(
                  letterSpacing: 1.6,
                  fontWeight: FontWeight.w800,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ),
            Text(
              'Curated for your day',
              style: theme.textTheme.labelSmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 232,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: items.length,
            separatorBuilder: (context, index) => const SizedBox(width: 12),
            itemBuilder: (context, index) => SizedBox(
              width: MediaQuery.sizeOf(context).width.clamp(280.0, 420.0) - 64,
              child: _FeaturedSlide(
                item: items[index],
                onOpen: () => onOpen(items[index]),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _FeaturedSlide extends StatelessWidget {
  const _FeaturedSlide({required this.item, required this.onOpen});

  final FeaturedItem item;
  final VoidCallback onOpen;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final image = item.thumbnail ?? DemoImages.innovationNight;
    return Material(
      color: theme.colorScheme.surface,
      borderRadius: BorderRadius.circular(CampusRadii.media),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onOpen,
        child: Stack(
          fit: StackFit.expand,
          children: [
            CampusImageFill(image: image, alt: image.alt),
            const PhotoScrim(),
            Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Row(
                    children: [
                      EyebrowBadge(
                        item.isSponsored ? 'Sponsored · Demo' : 'Video preview',
                        onPhoto: true,
                      ),
                      if (item.creator.isNotEmpty) ...[
                        const SizedBox(width: 8),
                        Flexible(
                          child: Text(
                            item.creator,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: theme.textTheme.labelSmall?.copyWith(
                              color: const Color(0xE6FFFFFF),
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(
                    item.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: theme.textTheme.titleLarge?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                      height: 1.15,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    item.description,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: const Color(0xE6FFFFFF),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      FilledButton.tonal(
                        onPressed: onOpen,
                        child: Text(item.ctaLabel.isEmpty ? 'Explore' : item.ctaLabel),
                      ),
                      if (item.duration.isNotEmpty) ...[
                        const SizedBox(width: 12),
                        Text(
                          item.duration,
                          style: theme.textTheme.labelSmall?.copyWith(
                            color: const Color(0xE6FFFFFF),
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// The film-scale clubs hero: panorama photo, scrim, invitation and a
/// fictional-faces credit line (kept honest, as on the web).
class ClubsHeroCard extends StatelessWidget {
  const ClubsHeroCard({
    super.key,
    required this.clubCount,
    required this.onOpen,
    this.image,
  });

  final int clubCount;
  final VoidCallback onOpen;
  final CampusMedia? image;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return HeroBanner(
      image: image ?? DemoImages.clubsHero,
      eyebrow: 'Clubs, societies & good company',
      title: 'Find your people.',
      description:
          "For the ideas you want to try. And the friends you haven't met yet.",
      children: [
        FilledButton(
          onPressed: onOpen,
          child: const Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Explore clubs'),
              SizedBox(width: 6),
              Icon(Icons.arrow_outward, size: 18),
            ],
          ),
        ),
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            CampusAvatar(name: 'Ama', image: DemoImages.studentAma, size: 34),
            Transform.translate(
              offset: const Offset(-10, 0),
              child: CampusAvatar(
                name: 'Kojo',
                image: DemoImages.studentKojo,
                size: 34,
              ),
            ),
            const SizedBox(width: 4),
            Text(
              clubCount > 0
                  ? '$clubCount demo communities to explore\nGenerated imagery · fictional students'
                  : 'Your community starts here',
              style: theme.textTheme.labelSmall?.copyWith(
                color: const Color(0xE6FFFFFF),
                height: 1.4,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

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
    final theme = Theme.of(context);
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(CampusRadii.card),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: Column(
            children: [
              Icon(icon, color: theme.colorScheme.primary),
              const SizedBox(height: 4),
              Text(value, style: theme.textTheme.titleLarge),
              Text(
                label,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
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
  const SectionHeader({
    super.key,
    required this.title,
    this.eyebrow,
    this.onSeeAll,
    this.seeAllLabel = 'See all',
  });

  final String title;
  final String? eyebrow;
  final VoidCallback? onSeeAll;
  final String seeAllLabel;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (eyebrow != null)
                Text(
                  eyebrow!.toUpperCase(),
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: theme.colorScheme.primary,
                    letterSpacing: 1.4,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              Text(
                title,
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
        if (onSeeAll != null)
          TextButton(
            onPressed: onSeeAll,
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(seeAllLabel),
                const Icon(Icons.arrow_outward, size: 16),
              ],
            ),
          ),
      ],
    );
  }
}

/// "A little plan. A good day." — next class plus the task preview the web
/// home pairs it with.
class TodayOverviewCard extends StatelessWidget {
  const TodayOverviewCard({
    super.key,
    required this.sessions,
    required this.tasks,
    required this.now,
    required this.signedIn,
    required this.onTimetable,
    required this.onTasks,
  });

  final List<ClassSession> sessions;
  final List<TaskItem> tasks;
  final DateTime now;
  final bool signedIn;
  final VoidCallback onTimetable;
  final VoidCallback onTasks;

  ClassSession? get _next {
    final nowMinutes = now.hour * 60 + now.minute;
    for (var offset = 0; offset < 7; offset++) {
      final weekday = ((now.weekday - 1 + offset) % 7) + 1;
      final candidates = sessions
          .where((session) => weekdayIndexOf(session.day) == weekday)
          .where(
            (session) =>
                offset > 0 ||
                (minutesOfDay(session.start) ?? 0) >= nowMinutes,
          )
          .toList()
        ..sort(
          (a, b) => (minutesOfDay(a.start) ?? 0).compareTo(
            minutesOfDay(b.start) ?? 0,
          ),
        );
      if (candidates.isNotEmpty) return candidates.first;
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final session = _next;
    final open = tasks.where((task) => !task.completed).toList()
      ..sort((a, b) => a.dueDate.compareTo(b.dueDate));
    final done = tasks.length - open.length;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    'A little plan. A good day.',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                Text(
                  'Accra time',
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            if (!signedIn)
              _Notice(
                icon: Icons.school_outlined,
                text:
                    'Sign in to see your class schedule and private tasks here.',
              )
            else ...[
              if (session != null)
                Row(
                  children: [
                    BrandGradient(
                      borderRadius: BorderRadius.circular(CampusRadii.control),
                      child: const SizedBox(
                        width: 56,
                        height: 56,
                        child: Icon(
                          Icons.schedule_outlined,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Next class · ${session.day}',
                            style: theme.textTheme.labelSmall?.copyWith(
                              color: theme.colorScheme.primary,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          Text(
                            session.course,
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          Text(
                            '${session.start}–${session.end} · ${session.venue} · '
                            '${startsInLabel(session.start, now)}',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                )
              else
                const _Notice(
                  icon: Icons.event_busy_outlined,
                  text: 'No classes in your timetable yet.',
                ),
              const SizedBox(height: 14),
              if (tasks.isEmpty)
                _Notice(
                  icon: Icons.checklist_outlined,
                  text: 'No tasks yet. Add one to plan your week.',
                )
              else ...[
                ClipRRect(
                  borderRadius: BorderRadius.circular(CampusRadii.pill),
                  child: LinearProgressIndicator(
                    value: tasks.isEmpty ? 0 : done / tasks.length,
                    minHeight: 6,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  '$done of ${tasks.length} tasks done',
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 6),
                for (final task in open.take(3))
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Row(
                      children: [
                        Icon(
                          Icons.radio_button_unchecked,
                          size: 18,
                          color: theme.colorScheme.outline,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            task.title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: theme.textTheme.bodyMedium,
                          ),
                        ),
                        if (task.dueDate.isNotEmpty)
                          Text(
                            relativeDayLabel(
                              parseCampusDate(task.dueDate) ?? now,
                              now,
                            ),
                            style: theme.textTheme.labelSmall?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
                          ),
                      ],
                    ),
                  ),
              ],
            ],
            const SizedBox(height: 12),
            Row(
              children: [
                TextButton(
                  onPressed: onTimetable,
                  child: const Text('Timetable'),
                ),
                const SizedBox(width: 8),
                TextButton(onPressed: onTasks, child: const Text('Tasks')),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _Notice extends StatelessWidget {
  const _Notice({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18, color: theme.colorScheme.onSurfaceVariant),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            text,
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ),
      ],
    );
  }
}

class QuickAction {
  const QuickAction({
    required this.title,
    required this.description,
    required this.icon,
    required this.image,
    required this.onTap,
  });

  final String title;
  final String description;
  final IconData icon;
  final CampusMedia? image;
  final VoidCallback onTap;
}

/// "A different kind of shortcut." — the photo shortcut strip.
class QuickActionsRow extends StatelessWidget {
  const QuickActionsRow({super.key, required this.actions});

  final List<QuickAction> actions;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 208,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: actions.length,
        separatorBuilder: (context, index) => const SizedBox(width: 12),
        itemBuilder: (context, index) {
          final action = actions[index];
          return SizedBox(
            width: 172,
            child: PhotoTile(
              image: action.image,
              title: action.title,
              description: action.description,
              icon: action.icon,
              onTap: action.onTap,
            ),
          );
        },
      ),
    );
  }
}

/// "Something to look forward to." — the photo-led next event card.
class EventFeatureCard extends StatelessWidget {
  const EventFeatureCard({
    super.key,
    required this.event,
    required this.onOpen,
    this.now,
  });

  final EventItem event;
  final VoidCallback onOpen;
  final DateTime? now;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final image =
        event.cover ??
        DemoImages.forCategory(event.category) ??
        DemoImages.innovationNight;
    final date = parseCampusDate(event.date);
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onOpen,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            CampusImage(image: image, alt: image.alt),
            Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'COMING UP · ${event.category.toUpperCase()}',
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: theme.colorScheme.primary,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.2,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    event.title,
                    style: theme.textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w700,
                      height: 1.15,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 16,
                    runSpacing: 6,
                    children: [
                      _Fact(
                        icon: Icons.calendar_today_outlined,
                        text: date == null
                            ? event.date
                            : relativeDayLabel(date, now),
                      ),
                      _Fact(
                        icon: Icons.place_outlined,
                        text: event.venue,
                      ),
                      _Fact(
                        icon: Icons.groups_outlined,
                        text: '${event.registered}/${event.seats} in',
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Text(
                        "See what's happening",
                        style: theme.textTheme.labelLarge?.copyWith(
                          color: theme.colorScheme.primary,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Icon(
                        Icons.arrow_outward,
                        size: 16,
                        color: theme.colorScheme.primary,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Fact extends StatelessWidget {
  const _Fact({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 15, color: theme.colorScheme.onSurfaceVariant),
        const SizedBox(width: 6),
        Text(
          text,
          style: theme.textTheme.bodySmall?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
      ],
    );
  }
}

/// Compact event row with its photo, used in the home "Upcoming events" list.
class EventRow extends StatelessWidget {
  const EventRow({super.key, required this.event, this.onTap});

  final EventItem event;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final image =
        event.cover ??
        DemoImages.forCategory(event.category) ??
        DemoImages.innovationNight;
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(CampusRadii.card),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              SizedBox(
                width: 76,
                height: 76,
                child: CampusImage(
                  image: image,
                  alt: image.alt,
                  aspect: CampusAspect.square,
                  borderRadius: BorderRadius.circular(CampusRadii.control),
                  showProvenance: false,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      event.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${event.date} · ${event.venue}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
              if (event.full)
                const StatusChip(label: 'Full', tone: ChipTone.warning)
              else
                Text(
                  '${event.registered}/${event.seats}',
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class AnnouncementRow extends StatelessWidget {
  const AnnouncementRow({super.key, required this.item, this.onTap});

  final Announcement item;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final image = item.cover;
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(CampusRadii.card),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (image != null) ...[
                SizedBox(
                  width: 76,
                  height: 76,
                  child: CampusImage(
                    image: image,
                    alt: image.alt,
                    aspect: CampusAspect.square,
                    borderRadius: BorderRadius.circular(CampusRadii.control),
                    showProvenance: false,
                  ),
                ),
                const SizedBox(width: 14),
              ] else ...[
                Icon(
                  item.pinned ? Icons.push_pin_outlined : Icons.campaign_outlined,
                  color: theme.colorScheme.primary,
                ),
                const SizedBox(width: 14),
              ],
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      item.content,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}


/// Official GCTU portals, mirroring `src/config/home.ts` →
/// `institutionalLinks` and the web `InstitutionalLinks` card on /home. These
/// open outside CampusOne, so they carry an external-link affordance.
class InstitutionalLink {
  const InstitutionalLink({
    required this.title,
    required this.description,
    required this.url,
    required this.icon,
  });

  final String title;
  final String description;
  final String url;
  final IconData icon;
}

const institutionalLinks = <InstitutionalLink>[
  InstitutionalLink(
    title: 'GCTU LMS',
    description: 'Course materials & assignments',
    url: 'https://lms.gctu.edu.gh/',
    icon: Icons.menu_book_outlined,
  ),
  InstitutionalLink(
    title: 'Student portal',
    description: 'GCTU SIP · registration & results',
    url: 'https://sip.gctu.edu.gh/',
    icon: Icons.school_outlined,
  ),
];

class InstitutionalLinksCard extends StatelessWidget {
  const InstitutionalLinksCard({super.key, required this.onOpen});

  final ValueChanged<InstitutionalLink> onOpen;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    'The important tabs, right here.',
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                Text(
                  'External portals',
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            for (final link in institutionalLinks)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                    side: BorderSide(color: theme.colorScheme.outlineVariant),
                  ),
                  tileColor: theme.colorScheme.surfaceContainerHighest,
                  leading: Icon(link.icon, color: theme.colorScheme.primary),
                  title: Text(
                    link.title,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  subtitle: Text(link.description),
                  trailing: const Icon(Icons.open_in_new, size: 18),
                  onTap: () => onOpen(link),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

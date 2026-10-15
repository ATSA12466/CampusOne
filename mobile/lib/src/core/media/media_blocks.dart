import 'package:flutter/material.dart';

import 'campus_image.dart';
import 'campus_media.dart';
import 'photo_scrim.dart';

/// Photo-led building blocks shared by every screen, mirroring the web
/// `src/components/media/*` primitives so the two clients compose the same
/// pictures in the same places.

class MediaFact {
  const MediaFact(this.label, this.value);

  final String label;
  final String value;
}

/// Web `Badge` in its two photo-safe tones.
class EyebrowBadge extends StatelessWidget {
  const EyebrowBadge(this.label, {super.key, this.onPhoto = false});

  final String label;
  final bool onPhoto;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return DecoratedBox(
      decoration: BoxDecoration(
        color: onPhoto
            ? const Color(0x3DFFFFFF)
            : scheme.primary.withAlpha(31),
        borderRadius: const BorderRadius.all(Radius.circular(999)),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        child: Text(
          label.toUpperCase(),
          style: TextStyle(
            fontSize: 10,
            letterSpacing: 0.6,
            fontWeight: FontWeight.w700,
            color: onPhoto ? Colors.white : scheme.primary,
          ),
        ),
      ),
    );
  }
}

/// Full-width photo banner with the web hero scrim, heading and optional
/// call-to-action row.
class HeroBanner extends StatelessWidget {
  const HeroBanner({
    super.key,
    this.image,
    required this.title,
    this.description,
    this.eyebrow,
    this.children,
    this.compact = false,
    this.priority = false,
    this.onTap,
  });

  final CampusMedia? image;
  final String title;
  final String? description;
  final String? eyebrow;
  final List<Widget>? children;
  final bool compact;
  final bool priority;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final minHeight = compact ? 288.0 : 384.0;
    final banner = ConstrainedBox(
      constraints: BoxConstraints(minHeight: minHeight),
      child: Stack(
        fit: StackFit.passthrough,
        children: [
          Positioned.fill(
            child: CampusImageFill(image: image, alt: image?.alt),
          ),
          Positioned.fill(
            child: LayoutBuilder(
              builder: (context, constraints) => PhotoScrim(
                hero: constraints.maxWidth >= 600,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.end,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (eyebrow != null) ...[
                  EyebrowBadge(eyebrow!, onPhoto: true),
                  const SizedBox(height: 16),
                ],
                Text(
                  title,
                  style: theme.textTheme.headlineSmall?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                    height: 1.15,
                  ),
                ),
                if (description != null) ...[
                  const SizedBox(height: 12),
                  Text(
                    description!,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: Colors.white,
                      height: 1.5,
                    ),
                  ),
                ],
                if (children != null && children!.isNotEmpty) ...[
                  const SizedBox(height: 20),
                  Wrap(
                    spacing: 12,
                    runSpacing: 12,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: children!,
                  ),
                ],
                if (image?.isGenerated ?? false) ...[
                  const SizedBox(height: 20),
                  Text(
                    'Generated demo imagery · not an actual campus photograph',
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: const Color(0xCCFFFFFF),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );

    if (onTap == null) return banner;
    return Material(
      color: Colors.transparent,
      child: InkWell(onTap: onTap, child: banner),
    );
  }
}

/// Picture tile used for home shortcuts and hub grids.
class PhotoTile extends StatelessWidget {
  const PhotoTile({
    super.key,
    this.image,
    required this.title,
    this.description,
    this.icon,
    this.onTap,
    this.featured = false,
  });

  final CampusMedia? image;
  final String title;
  final String? description;
  final IconData? icon;
  final VoidCallback? onTap;
  final bool featured;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tile = ConstrainedBox(
      constraints: BoxConstraints(minHeight: featured ? 288 : 208),
      child: Stack(
        fit: StackFit.passthrough,
        children: [
          Positioned.fill(
            child: CampusImageFill(image: image, alt: image?.alt),
          ),
          Positioned.fill(child: PhotoScrim()),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(icon ?? Icons.image_outlined, color: Colors.white, size: 24),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            title,
                            style: theme.textTheme.titleLarge?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          if (description != null)
                            Padding(
                              padding: const EdgeInsets.only(top: 4),
                              child: Text(
                                description!,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: const Color(0xE6FFFFFF),
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                    const Icon(
                      Icons.arrow_outward,
                      color: Colors.white,
                      size: 20,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );

    final rounded = ClipRRect(
      borderRadius: const BorderRadius.all(Radius.circular(24)),
      child: tile,
    );
    if (onTap == null) return rounded;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: const BorderRadius.all(Radius.circular(24)),
        child: rounded,
      ),
    );
  }
}

/// Standard directory/list card: picture on top, then eyebrow, title,
/// description and an optional facts footer.
class MediaCard extends StatelessWidget {
  const MediaCard({
    super.key,
    this.image,
    required this.title,
    this.eyebrow,
    this.description,
    this.facts = const <MediaFact>[],
    this.footer,
    this.onTap,
    this.aspect = CampusAspect.video,
    this.featured = false,
    this.trailing,
  });

  final CampusMedia? image;
  final String title;
  final String? eyebrow;
  final String? description;
  final List<MediaFact> facts;
  final Widget? footer;
  final VoidCallback? onTap;
  final CampusAspect aspect;
  final bool featured;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      elevation: featured ? 2 : 0,
      child: InkWell(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            CampusImage(image: image, alt: image?.alt, aspect: aspect),
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (eyebrow != null) ...[
                    EyebrowBadge(eyebrow!),
                    const SizedBox(height: 12),
                  ],
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          title,
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                            height: 1.2,
                          ),
                        ),
                      ),
                      if (trailing != null) trailing!,
                    ],
                  ),
                  if (description != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      description!,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            if (facts.isNotEmpty || footer != null)
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
                child: Column(
                  children: [
                    const Divider(height: 20),
                    Row(
                      children: [
                        Expanded(
                          child: Wrap(
                            spacing: 20,
                            runSpacing: 8,
                            children: [
                              for (final fact in facts)
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      fact.label.toUpperCase(),
                                      style: theme.textTheme.labelSmall
                                          ?.copyWith(
                                            color: theme
                                                .colorScheme
                                                .onSurfaceVariant,
                                            letterSpacing: 0.6,
                                            fontWeight: FontWeight.w700,
                                          ),
                                    ),
                                    Text(
                                      fact.value,
                                      style: theme.textTheme.bodyMedium
                                          ?.copyWith(
                                            fontWeight: FontWeight.w600,
                                          ),
                                    ),
                                  ],
                                ),
                            ],
                          ),
                        ),
                        if (footer != null) footer!,
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

/// Horizontal gallery used on detail screens (club/event/listing photos).
class GalleryStrip extends StatelessWidget {
  const GalleryStrip({
    super.key,
    required this.images,
    this.height = 170,
    this.caption,
  });

  final List<CampusMedia> images;
  final double height;
  final String? caption;

  @override
  Widget build(BuildContext context) {
    if (images.isEmpty) return const SizedBox.shrink();
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          height: height,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: images.length,
            separatorBuilder: (context, index) => const SizedBox(width: 12),
            itemBuilder: (context, index) {
              final media = images[index];
              return SizedBox(
                width: height * 1.35,
                child: CampusImage(
                  image: media,
                  alt: media.alt,
                  aspect: CampusAspect.auto,
                  borderRadius: const BorderRadius.all(Radius.circular(20)),
                ),
              );
            },
          ),
        ),
        if (caption != null)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(
              caption!,
              style: theme.textTheme.labelSmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ),
      ],
    );
  }
}

/// Circular avatar with initials, using the profile photo when one exists.
class CampusAvatar extends StatelessWidget {
  const CampusAvatar({
    super.key,
    required this.name,
    this.image,
    this.size = 40,
  });

  final String name;
  final CampusMedia? image;
  final double size;

  static String initialsOf(String name) {
    final words = name
        .trim()
        .split(RegExp(r'\s+'))
        .where((word) => word.isNotEmpty)
        .take(2)
        .map((word) => word[0])
        .join()
        .toUpperCase();
    return words.isEmpty ? '?' : words;
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final initials = initialsOf(name);
    final hasImage = image != null && image!.src.trim().isNotEmpty;
    return Semantics(
      label: name,
      image: true,
      child: SizedBox(
        width: size,
        height: size,
        child: ClipOval(
          child: hasImage
              ? CampusImageFill(
                  image: image,
                  alt: name,
                  showProvenance: false,
                )
              : BrandGradient(
                  child: Center(
                    child: Text(
                      initials,
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                        fontSize: size * 0.34,
                      ),
                    ),
                  ),
                ),
        ),
      ),
    );
  }
}

/// Phone-sized magazine page opening, mirroring the web `MagazineHeader`
/// (`src/components/shared/magazine-header.tsx`): the same photo, eyebrow,
/// display title, description and provenance line that opens each web screen.
///
/// Web screens place it as the first block of the page, so the mobile version
/// keeps it at the top of the body and lets the screen's own content scroll
/// underneath.
class PhotoPage extends StatelessWidget {
  const PhotoPage({
    super.key,
    this.image,
    required this.eyebrow,
    required this.title,
    required this.description,
    required this.child,
  });

  final CampusMedia? image;
  final String eyebrow;
  final String title;
  final String description;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        PhotoPageHeader(
          image: image,
          eyebrow: eyebrow,
          title: title,
          description: description,
        ),
        Expanded(child: child),
      ],
    );
  }
}

/// The photo band itself, without the surrounding page layout.
class PhotoPageHeader extends StatelessWidget {
  const PhotoPageHeader({
    super.key,
    this.image,
    required this.eyebrow,
    required this.title,
    required this.description,
  });

  final CampusMedia? image;
  final String eyebrow;
  final String title;
  final String description;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return SizedBox(
      height: 232,
      width: double.infinity,
      child: Stack(
        fit: StackFit.expand,
        children: [
          CampusImageFill(image: image, alt: image?.alt, showProvenance: false),
          const Positioned.fill(child: PhotoScrim()),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 18),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.end,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  eyebrow.toUpperCase(),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.headlineSmall?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                    height: 1.15,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  description,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: const Color(0xE6FFFFFF),
                    height: 1.35,
                  ),
                ),
                if (image?.isGenerated ?? false) ...[
                  const SizedBox(height: 6),
                  Text(
                    'Generated demo imagery · not an actual campus photograph',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: const Color(0xB3FFFFFF),
                      fontSize: 10,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Scaffold that opens a screen with the magazine photo band, matching the web
/// `MagazineHeader` that opens every student route. The platform app bar (back
/// button, actions) and the screen's own body stay exactly as they were.
class PhotoScaffold extends StatelessWidget {
  const PhotoScaffold({
    super.key,
    this.appBar,
    this.floatingActionButton,
    this.image,
    required this.eyebrow,
    required this.title,
    required this.description,
    required this.body,
  });

  final PreferredSizeWidget? appBar;
  final Widget? floatingActionButton;
  final CampusMedia? image;
  final String eyebrow;
  final String title;
  final String description;
  final Widget body;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: appBar,
      floatingActionButton: floatingActionButton,
      body: PhotoPage(
        image: image,
        eyebrow: eyebrow,
        title: title,
        description: description,
        child: body,
      ),
    );
  }
}

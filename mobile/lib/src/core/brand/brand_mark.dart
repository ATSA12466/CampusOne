import 'package:flutter/material.dart';

/// Owner-supplied brand artwork.
///
/// The masters live at the repository root (`SRCLogo.png` and
/// `campusone_app_icon.png`). Everything bundled here is a plain downscale
/// produced by `node scripts/brand-icons.mjs`; the crest is never recoloured,
/// redrawn or cropped.
class BrandAssets {
  const BrandAssets._();

  /// Official GCTU SRC crest, transparent background.
  static const crest = 'assets/src-crest.png';

  /// The crest on the CampusOne brand gradient — also the store/app icon.
  static const appIcon = 'assets/icon-1024.png';

  static const displayName = 'CampusOne';
  static const tagline = 'YOUR CAMPUS, CONNECTED';

  /// Matches the web `BrandMark` alt text.
  static const crestSemantics =
      "Ghana Communication Technology University Students' Representative Council crest.";
}

enum BrandMarkSize { sm, md, lg }

/// The crest on its own.
///
/// No tile, frame or background is drawn behind it: the artwork sits directly
/// on the surface, exactly like the web mark. If the asset is missing from a
/// build the mark degrades to the bundled app icon and then to plain "SRC"
/// lettering, still without a box.
class CrestMark extends StatelessWidget {
  const CrestMark({super.key, this.size = 44});

  final double size;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Semantics(
      image: true,
      label: BrandAssets.crestSemantics,
      child: SizedBox(
        width: size,
        height: size,
        child: Image.asset(
          BrandAssets.crest,
          fit: BoxFit.contain,
          filterQuality: FilterQuality.medium,
          errorBuilder: (context, error, stack) => Image.asset(
            BrandAssets.appIcon,
            fit: BoxFit.contain,
            filterQuality: FilterQuality.medium,
            errorBuilder: (context, error, stack) => Center(
              child: Text(
                'SRC',
                style: theme.textTheme.labelMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.6,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Crest + wordmark, the Flutter counterpart of the web `BrandMark`.
class CampusBrandMark extends StatelessWidget {
  const CampusBrandMark({
    super.key,
    this.size = BrandMarkSize.md,
    this.wordmark = true,
    this.center = false,
    this.onDark = false,
  });

  final BrandMarkSize size;
  final bool wordmark;

  /// Centre the mark with its text — used on the auth and onboarding screens.
  final bool center;

  /// Inverse tone for placing the mark on the hero photo scrim.
  final bool onDark;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final color = onDark ? Colors.white : theme.colorScheme.onSurface;
    final crest = CrestMark(
      size: switch (size) {
        BrandMarkSize.sm => 40,
        BrandMarkSize.md => 48,
        BrandMarkSize.lg => 64,
      },
    );
    final name = Text(
      BrandAssets.displayName,
      style: (switch (size) {
        BrandMarkSize.sm => theme.textTheme.titleMedium,
        BrandMarkSize.md => theme.textTheme.titleLarge,
        BrandMarkSize.lg => theme.textTheme.headlineSmall,
      })?.copyWith(fontWeight: FontWeight.w700, letterSpacing: -0.3, color: color),
    );
    final tagline = Text(
      BrandAssets.tagline,
      style: theme.textTheme.labelSmall?.copyWith(
        letterSpacing: 1.7,
        fontWeight: FontWeight.w600,
        color: color.withAlpha(184),
      ),
    );
    return Row(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: center ? MainAxisAlignment.center : MainAxisAlignment.start,
      children: [
        crest,
        if (wordmark) ...[
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: center ? CrossAxisAlignment.center : CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [name, tagline],
          ),
        ],
      ],
    );
  }
}

import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// Brand scrim that follows the active GCTU blue theme.
class PhotoScrim extends StatelessWidget {
  const PhotoScrim({super.key, this.hero = false});

  /// Wide hero treatment, lighter at the right edge; otherwise a card scrim.
  final bool hero;

  @override
  Widget build(BuildContext context) {
    final brand = Theme.of(context).colorScheme.primary;
    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: hero ? Alignment.centerLeft : Alignment.topCenter,
          end: hero ? Alignment.centerRight : Alignment.bottomCenter,
          colors: hero
              ? [
                  brand.withValues(alpha: .94),
                  brand.withValues(alpha: .72),
                  brand.withValues(alpha: .08),
                ]
              : [brand.withValues(alpha: .72), brand.withValues(alpha: .94)],
          stops: hero ? const [0.0, 0.62, 1.0] : null,
        ),
      ),
    );
  }
}

/// GCTU blue gradient used behind missing photos and on brand surfaces.
class BrandGradient extends StatelessWidget {
  const BrandGradient({super.key, this.child, this.borderRadius});

  final Widget? child;
  final BorderRadius? borderRadius;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: borderRadius,
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [CampusColors.primaryDark, Theme.of(context).colorScheme.primary],
        ),
      ),
      child: child,
    );
  }
}

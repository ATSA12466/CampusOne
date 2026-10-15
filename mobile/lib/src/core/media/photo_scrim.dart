import 'package:flutter/material.dart';

/// Web scrim + brand gradient values, copied from
/// `src/app/styles/foundation.css` so photos are tinted identically on both
/// clients (navy `#0B2545` over artwork, blue `#003399` for gradient fills).
class PhotoScrim extends StatelessWidget {
  const PhotoScrim({super.key, this.hero = false});

  /// `hero: true` matches the wide (≥768px) hero treatment: light on the right,
  /// heavily tinted on the left. Otherwise the top-to-bottom card scrim is used.
  final bool hero;

  static const Color start = Color(0xB80B2545); // rgba(11,37,69,.72)
  static const Color end = Color(0xF00B2545); // rgba(11,37,69,.94)
  static const Color edge = Color(0x140B2545); // rgba(11,37,69,.08)

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: hero ? Alignment.centerLeft : Alignment.topCenter,
          end: hero ? Alignment.centerRight : Alignment.bottomCenter,
          colors: hero
              ? const [PhotoScrim.end, PhotoScrim.start, PhotoScrim.edge]
              : const [PhotoScrim.start, PhotoScrim.end],
          stops: hero ? const [0.0, 0.62, 1.0] : null,
        ),
      ),
    );
  }
}

/// `linear-gradient(135deg, #0B2545, #003399)` — used behind missing photos and
/// on brand surfaces, matching the web `.brand-gradient` utility.
class BrandGradient extends StatelessWidget {
  const BrandGradient({super.key, this.child, this.borderRadius});

  final Widget? child;
  final BorderRadius? borderRadius;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: borderRadius,
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF0B2545), Color(0xFF003399)],
        ),
      ),
      child: child,
    );
  }
}

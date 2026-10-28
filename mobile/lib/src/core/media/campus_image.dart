import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/material.dart';

import '../auth/auth_session.dart';
import 'campus_media.dart';
import 'media_resolver.dart';
import 'photo_scrim.dart';

/// Aspect ratios used across the design system, matching the web
/// `imageFrame` variants in `src/components/media/campus-image.tsx`.
enum CampusAspect {
  square(1),
  portrait(4 / 5),
  tall(3 / 4),
  video(16 / 9),
  panorama(21 / 9),
  hero(16 / 7),
  auto(null);

  const CampusAspect(this.ratio);

  final double? ratio;
}

/// Photo frame with the web's loading, failure and provenance behaviour.
///
/// * Loading shows the pulsing skeleton (disabled under reduced motion).
/// * A missing or disallowed source shows the brand gradient + "Photo coming
///   soon" stand-in rather than a broken box.
/// * Placeholder artwork keeps its visible "Placeholder" chip; generated demo
///   imagery is labelled by the screen that presents it.
class CampusImage extends StatelessWidget {
  const CampusImage({
    super.key,
    this.image,
    this.alt,
    this.aspect = CampusAspect.video,
    this.fit = BoxFit.cover,
    this.showProvenance = true,
    this.borderRadius,
    this.overlay,
    this.resolver,
  });

  final CampusMedia? image;
  final String? alt;
  final CampusAspect aspect;
  final BoxFit fit;
  final bool showProvenance;
  final BorderRadius? borderRadius;
  final Widget? overlay;
  final MediaResolver? resolver;

  @override
  Widget build(BuildContext context) {
    final surface = CampusImageFill(
      image: image,
      alt: alt,
      fit: fit,
      showProvenance: showProvenance,
      borderRadius: borderRadius,
      overlay: overlay,
      resolver: resolver,
    );
    final ratio = aspect.ratio;
    if (ratio == null) return surface;
    return AspectRatio(aspectRatio: ratio, child: surface);
  }
}

/// The same photo frame, sized by its parent (used inside `Stack`/`Positioned`
/// layouts such as hero banners and photo tiles).
class CampusImageFill extends StatelessWidget {
  const CampusImageFill({
    super.key,
    this.image,
    this.alt,
    this.fit = BoxFit.cover,
    this.showProvenance = true,
    this.borderRadius,
    this.overlay,
    this.resolver,
  });

  final CampusMedia? image;
  final String? alt;
  final BoxFit fit;
  final bool showProvenance;
  final BorderRadius? borderRadius;
  final Widget? overlay;
  final MediaResolver? resolver;

  /// Default frame radius — web `--r-media: 1.5rem`.
  static const BorderRadius defaultRadius = BorderRadius.all(
    Radius.circular(24),
  );

  @override
  Widget build(BuildContext context) {
    final media = image;
    final radius = borderRadius ?? BorderRadius.zero;
    final activeResolver =
        resolver ??
        MediaResolver.forBaseUrl(SessionScope.apiOrNull(context)?.baseUrl ?? '');
    final label = media?.labelWith(alt) ?? (alt ?? '');

    if (media == null || media.isEmpty) {
      return _surface(radius: radius, child: _fallback(context, label));
    }

    final dataBytes = _decodeDataUri(media.src);
    final uri = dataBytes == null ? activeResolver.resolve(media.src) : null;
    if (dataBytes == null && uri == null) {
      return _surface(radius: radius, child: _fallback(context, label));
    }

    final alignment = Alignment(
      ((media.focalX ?? 50) / 50) - 1,
      ((media.focalY ?? 50) / 50) - 1,
    );

    final Widget picture = dataBytes != null
        ? Image.memory(
            dataBytes,
            fit: fit,
            alignment: alignment,
            gaplessPlayback: true,
            frameBuilder: _frameBuilder,
            errorBuilder: (context, error, stack) =>
                _fallback(context, label),
          )
        : Image.network(
            uri.toString(),
            fit: fit,
            alignment: alignment,
            frameBuilder: _frameBuilder,
            errorBuilder: (context, error, stack) =>
                _fallback(context, label),
          );

    return _surface(
      radius: radius,
      child: Semantics(
        image: true,
        label: label.isEmpty ? null : label,
        child: Stack(
          fit: StackFit.expand,
          children: [
            picture,
            if (overlay != null) overlay!,
            if (showProvenance && media.isPlaceholder)
              const Positioned(right: 8, bottom: 8, child: _PlaceholderChip()),
          ],
        ),
      ),
    );
  }

  Widget _surface({required BorderRadius radius, required Widget child}) {
    return ClipRRect(borderRadius: radius, child: child);
  }

  static Widget _frameBuilder(
    BuildContext context,
    Widget child,
    int? frame,
    bool wasSynchronouslyLoaded,
  ) {
    if (wasSynchronouslyLoaded || frame != null) {
      return _FadeIn(child: child);
    }
    return const _PulseSkeleton();
  }

  static Widget _fallback(BuildContext context, String label) {
    return BrandGradient(
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.image_not_supported_outlined,
                  size: 28, color: Colors.white70),
              const SizedBox(height: 8),
              const Text(
                'Photo coming soon',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
              if (label.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text(
                    label,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.white70, fontSize: 11),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  static const int _dataCacheLimit = 12;
  static final Map<String, Uint8List> _dataCache = {};

  static Uint8List? _decodeDataUri(String src) {
    if (!MediaResolver.isDataUri(src)) return null;
    final cached = _dataCache[src];
    if (cached != null) return cached;
    final commaIndex = src.indexOf(',');
    if (commaIndex < 0) return null;
    try {
      final bytes = base64Decode(src.substring(commaIndex + 1));
      if (_dataCache.length >= _dataCacheLimit) {
        _dataCache.remove(_dataCache.keys.first);
      }
      _dataCache[src] = bytes;
      return bytes;
    } catch (_) {
      return null;
    }
  }
}

class _PlaceholderChip extends StatelessWidget {
  const _PlaceholderChip();

  @override
  Widget build(BuildContext context) {
    return const DecoratedBox(
      decoration: BoxDecoration(
        color: Color(0xD90B2545),
        borderRadius: BorderRadius.all(Radius.circular(999)),
      ),
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        child: Text(
          'Placeholder',
          style: TextStyle(
            color: Colors.white,
            fontSize: 10,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}

class _FadeIn extends StatelessWidget {
  const _FadeIn({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final reduceMotion =
        MediaQuery.maybeOf(context)?.disableAnimations ?? false;
    if (reduceMotion) return child;
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: const Duration(milliseconds: 200),
      builder: (context, value, inner) => Opacity(
        opacity: value.clamp(0, 1),
        child: inner,
      ),
      child: child,
    );
  }
}

/// `--skeleton-sheen` equivalent: a 1.8s opacity pulse, disabled when the
/// platform asks for reduced motion.
class _PulseSkeleton extends StatefulWidget {
  const _PulseSkeleton();

  @override
  State<_PulseSkeleton> createState() => _PulseSkeletonState();
}

class _PulseSkeletonState extends State<_PulseSkeleton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1800),
  );

  @override
  void initState() {
    super.initState();
    _controller.repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final reduceMotion =
        MediaQuery.maybeOf(context)?.disableAnimations ?? false;
    final base = ColoredBox(
      color: scheme.surfaceContainerHighest,
      child: Center(
        child: Icon(Icons.image_outlined, color: scheme.outline, size: 24),
      ),
    );
    if (reduceMotion) return base;
    return FadeTransition(
      opacity: Tween(begin: 0.5, end: 1.0).animate(_controller),
      child: base,
    );
  }
}

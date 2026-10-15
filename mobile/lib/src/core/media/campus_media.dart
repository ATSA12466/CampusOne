/// Typed mirror of the web `CampusMedia` contract (`src/types/media.ts`).
///
/// Every photo in CampusOne is *described*, not just linked: the description
/// carries the alt text, focal point and — critically — where the image came
/// from, so the app can label stand-in artwork honestly instead of pretending
/// it is campus photography.
library;

enum MediaProvenance { placeholder, generated, licensed, upload, unknown }

MediaProvenance parseProvenance(dynamic value) {
  switch (value) {
    case 'placeholder':
      return MediaProvenance.placeholder;
    case 'generated':
      return MediaProvenance.generated;
    case 'licensed':
      return MediaProvenance.licensed;
    case 'upload':
      return MediaProvenance.upload;
    default:
      return MediaProvenance.unknown;
  }
}

class CampusMedia {
  const CampusMedia({
    required this.src,
    required this.alt,
    this.width,
    this.height,
    this.focalX,
    this.focalY,
    this.provenance = MediaProvenance.unknown,
    this.sourceNote,
  });

  final String src;
  final String alt;
  final int? width;
  final int? height;
  final double? focalX;
  final double? focalY;
  final MediaProvenance provenance;
  final String? sourceNote;

  bool get isEmpty => src.trim().isEmpty;
  bool get isPlaceholder => provenance == MediaProvenance.placeholder;
  bool get isGenerated => provenance == MediaProvenance.generated;

  /// Alt text used when a screen passes a stronger, context-specific label.
  String labelWith(String? fallback) {
    final trimmed = (fallback ?? '').trim();
    if (trimmed.isNotEmpty) return trimmed;
    final own = alt.trim();
    return own.isEmpty ? 'Campus photograph unavailable' : own;
  }

  CampusMedia copyWith({
    String? src,
    String? alt,
    int? width,
    int? height,
    double? focalX,
    double? focalY,
    MediaProvenance? provenance,
    String? sourceNote,
  }) => CampusMedia(
    src: src ?? this.src,
    alt: alt ?? this.alt,
    width: width ?? this.width,
    height: height ?? this.height,
    focalX: focalX ?? this.focalX,
    focalY: focalY ?? this.focalY,
    provenance: provenance ?? this.provenance,
    sourceNote: sourceNote ?? this.sourceNote,
  );

  /// Accepts the two shapes the API can return: a bare path/URL string, or a
  /// full `CampusMedia` object.
  static CampusMedia? tryParse(dynamic value, {String alt = ''}) {
    if (value is String) {
      final src = value.trim();
      if (src.isEmpty) return null;
      return CampusMedia(src: src, alt: alt);
    }
    if (value is Map) {
      final map = value.map((key, item) => MapEntry('$key', item));
      final src = map['src'];
      if (src is! String || src.trim().isEmpty) return null;
      final focal = map['focalPoint'];
      double? focalX;
      double? focalY;
      if (focal is Map) {
        focalX = _toDouble(focal['x']);
        focalY = _toDouble(focal['y']);
      }
      final rawAlt = map['alt'];
      return CampusMedia(
        src: src.trim(),
        alt: rawAlt is String && rawAlt.trim().isNotEmpty ? rawAlt : alt,
        width: _toInt(map['width']),
        height: _toInt(map['height']),
        focalX: focalX,
        focalY: focalY,
        provenance: parseProvenance(map['provenance']),
        sourceNote: map['sourceNote'] is String
            ? map['sourceNote'] as String
            : null,
      );
    }
    return null;
  }

  /// A source plus a separate alt/altAlt field, as clubs, events and the home
  /// featured carousel return them.
  static CampusMedia? pair(dynamic src, dynamic alt) =>
      tryParse(src, alt: alt is String ? alt : '');

  /// First usable image from a candidate list — used where records may carry
  /// `cover`, `thumbnail` or a gallery and only one of them is populated.
  static CampusMedia? firstOf(Iterable<dynamic> candidates, {String alt = ''}) {
    for (final candidate in candidates) {
      final parsed = tryParse(candidate, alt: alt);
      if (parsed != null) return parsed;
    }
    return null;
  }

  static List<CampusMedia> listFrom(dynamic value, {String alt = ''}) {
    if (value is! List) return const <CampusMedia>[];
    return [
      for (final entry in value)
        if (tryParse(entry, alt: alt) case final parsed?) parsed,
    ];
  }

  Map<String, dynamic> toJson() => {
    'src': src,
    'alt': alt,
    if (width != null) 'width': width,
    if (height != null) 'height': height,
    if (focalX != null && focalY != null) 'focalPoint': {'x': focalX, 'y': focalY},
    'provenance': provenance.name,
    if (sourceNote != null) 'sourceNote': sourceNote,
  };
}

double? _toDouble(dynamic value) {
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value);
  return null;
}

int? _toInt(dynamic value) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  if (value is String) return int.tryParse(value);
  return null;
}

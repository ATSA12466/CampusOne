import 'campus_media.dart';

/// Which stock-photo hosts the app will load absolute image URLs from.
///
/// The default set is deliberately small; a deployment that serves its own
/// media on a CDN adds hosts at build time:
///
/// ```bash
/// flutter build apk --dart-define=CAMPUSONE_IMAGE_HOSTS=cdn.example.edu
/// ```
///
/// This mirrors the web's `NEXT_PUBLIC_IMAGE_HOSTS` allow-list rather than
/// loading arbitrary remote images.
const String _configured = String.fromEnvironment('CAMPUSONE_IMAGE_HOSTS');

const Set<String> defaultImageHosts = {
  'images.unsplash.com',
  'images.pexels.com',
  'cdn.pixabay.com',
  'upload.wikimedia.org',
};

Set<String> get configuredImageHosts {
  if (_configured.trim().isEmpty) return defaultImageHosts;
  return {
    ...defaultImageHosts,
    ..._configured
        .split(',')
        .map((host) => host.trim().toLowerCase())
        .where((host) => host.isNotEmpty),
  };
}

/// Stand-in artwork used when a record has no photo attached, so screens keep
/// the web's photo-led composition instead of collapsing to grey boxes.
/// Provenance is `generated`, which makes the UI label it as demo artwork.
const CampusMedia generatedCampusLife = CampusMedia(
  src: '/images/demo/campus-life.webp',
  alt:
      'Fictional campus courtyard with students walking between classes — '
      'AI-generated demo illustration, not an actual GCTU photograph.',
  width: 1200,
  height: 675,
  provenance: MediaProvenance.generated,
  sourceNote: 'AI-generated for CampusOne; fictional campus and people.',
);

const CampusMedia generatedStudyCorner = CampusMedia(
  src: '/images/demo/study-corner.webp',
  alt:
      'Fictional study corner with notebooks and a laptop — AI-generated demo '
      'illustration, not an actual GCTU photograph.',
  width: 1200,
  height: 675,
  provenance: MediaProvenance.generated,
  sourceNote: 'AI-generated for CampusOne; fictional campus and people.',
);

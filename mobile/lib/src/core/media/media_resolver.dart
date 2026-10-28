import 'media_hosts.dart';

/// Turns the source strings stored in CampusOne data into URLs this app may
/// actually load.
///
/// Mirrors the web policy in `src/config/image-policy.ts`:
/// * same-server relative paths (`/images/...`) are always allowed;
/// * protocol-relative (`//host/...`) and traversal (`../`) paths are refused;
/// * control characters and backslashes are refused;
/// * absolute URLs must be `https` (or the configured server's own host), must
///   not carry credentials or an explicit port, and must be on an allowed host;
/// * `data:image/...` payloads (user photo records) are allowed and decoded
///   in-memory by `CampusImage` rather than fetched.
class MediaResolver {
  MediaResolver({required this.baseUrl, Iterable<String>? allowedHosts})
    : allowedHosts = {
        for (final host in (allowedHosts ?? configuredImageHosts)
            .map((host) => host.trim().toLowerCase()))
          if (host.isNotEmpty) host,
      };

  final String baseUrl;
  final Set<String> allowedHosts;

  static final RegExp _control = RegExp(r'[\u0000-\u001f\\]');
  static final RegExp _dotSegment = RegExp(r'(^|/)(\.|\.\.)(/|$)');
  static final RegExp _dataUri = RegExp(
    r'^data:image/(?:jpeg|jpg|png|webp|gif|avif);base64,',
    caseSensitive: false,
  );

  static final Map<String, MediaResolver> _resolvers = {};

  /// Resolvers are cached per server address so widgets do not rebuild them on
  /// every frame. [clearCache] runs whenever the server address changes.
  static MediaResolver forBaseUrl(String baseUrl) {
    final key = baseUrl.trim();
    return _resolvers[key] ??= MediaResolver(baseUrl: key);
  }

  static void clearCache() => _resolvers.clear();

  static bool isDataUri(String? src) =>
      src != null && _dataUri.hasMatch(src.trim());

  /// Returns a loadable `Uri`, or null when the source must not be fetched.
  Uri? resolve(String? raw) {
    final src = raw?.trim() ?? '';
    if (src.isEmpty) return null;
    if (_control.hasMatch(src)) return null;
    if (_dataUri.hasMatch(src)) return null; // decoded in-memory instead
    if (src.startsWith('/')) {
      if (src.startsWith('//')) return null;
      final path = src.split('?').first;
      if (_dotSegment.hasMatch(path)) return null;
      final base = Uri.tryParse(baseUrl);
      if (base == null || !base.hasScheme) return null;
      return base.resolve(src);
    }
    final uri = Uri.tryParse(src);
    if (uri == null || !uri.hasScheme) return null;
    if (uri.scheme != 'https' && uri.scheme != 'http') return null;
    if (uri.userInfo.isNotEmpty || uri.hasPort) return null;
    // Plain http is only tolerated for the server the app is already talking
    // to (development), never for third-party hosts.
    if (uri.scheme == 'http' && uri.host != Uri.tryParse(baseUrl)?.host) {
      return null;
    }
    if (!allowedHosts.contains(uri.host.toLowerCase())) return null;
    return uri;
  }

  bool isAllowed(String? src) => isDataUri(src) || resolve(src) != null;
}

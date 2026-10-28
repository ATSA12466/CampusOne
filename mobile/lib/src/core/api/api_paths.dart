/// Every backend path the app calls. The repo audit
/// (scripts/mobile-audit.mjs) verifies each one exists server-side.
class ApiPaths {
  static const authToken = '/api/v1/auth/login';
  static const register = '/api/v1/auth/register';
  static const me = '/api/v1/me';
  static const myClubs = '/api/users/me/clubs';
  static const meStore = '/api/me/store';
  static const saves = '/api/saves';
  static const passwordReset = '/api/auth/password-reset';
  static const srcRequests = '/api/src/requests';
  static const srcNominations = '/api/src/nominations';
  static const srcClubs = '/api/src/clubs';
  static const listingsSubmit = '/api/listings';
  static const reportsSubmit = '/api/reports';
  static const branding = '/api/branding/public';

  /// Catalog base paths, mirroring `src/config/api-endpoints.ts` exactly.
  /// Several collections live under prefixed paths (e.g. posts live at
  /// /api/community/posts, not /api/posts).
  static const catalogBases = {
    'featured': '/api/home/featured',
    'clubs': '/api/clubs',
    'events': '/api/events',
    'opportunities': '/api/opportunities',
    'accommodation': '/api/accommodation',
    'marketplace': '/api/marketplace',
    'resources': '/api/resources',
    'courses': '/api/courses',
    'posts': '/api/community/posts',
    'media': '/api/media',
    'announcements': '/api/announcements',
    'timetable': '/api/timetable',
    'representatives': '/api/src-office/representatives',
    'projects': '/api/src-office/projects',
    'campaigns': '/api/advertising',
    'lostFound': '/api/lost-found',
  };

  static String catalog(String collection) =>
      catalogBases[collection] ?? '/api/$collection';
  static String catalogItem(String collection, String id) =>
      '${catalog(collection)}/$id';

  static String clubMembership(String clubId) =>
      '/api/clubs/$clubId/membership';
  static String membership(String membershipId) =>
      '/api/clubs/memberships/$membershipId';
  static String clubSaved(String clubId) => '/api/clubs/$clubId/saved';

  static String eventRsvp(String eventId) => '/api/events/$eventId/rsvp';
  static String eventSaved(String eventId) => '/api/events/$eventId/saved';
  static String eventTicket(String eventId) =>
      '/api/events/$eventId/ticket';

  static const attendanceSessions = '/api/attendance/sessions';
  static String attendanceSession(String id) =>
      '/api/attendance/sessions/$id';
  static String sessionCode(String id) =>
      '/api/attendance/sessions/$id/code';
  static const checkIn = '/api/attendance/check-in';
  static const attendanceRecords = '/api/attendance/records';
  static String attendanceRecord(String id) =>
      '/api/attendance/records/$id';

  static const badges = '/api/badges';
  static const badgeDefinitions = '/api/badges/definitions';
  static const participation = '/api/participation';

  static const conversations = '/api/conversations';
  static String thread(String id) => '/api/conversations/$id/messages';
  static String threadRead(String id) =>
      '/api/conversations/$id/read';

  static const notifications = '/api/notifications';
  static const devices = '/api/v1/devices';

  static String manage(String clubId, String section) =>
      '/api/manage/clubs/$clubId/$section';
  static String manageItem(String clubId, String section, String itemId) =>
      '/api/manage/clubs/$clubId/$section/$itemId';
}

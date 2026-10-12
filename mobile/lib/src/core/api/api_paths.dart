/// Every backend path the app calls. The repo audit
/// (scripts/mobile-audit.mjs) verifies each one exists server-side.
class ApiPaths {
  static const authToken = '/api/auth/token';
  static const register = '/api/auth/register';
  static const me = '/api/users/me';
  static const myClubs = '/api/users/me/clubs';
  static const branding = '/api/branding/public';

  static String catalog(String collection) => '/api/$collection';
  static String catalogItem(String collection, String id) =>
      '/api/$collection/$id';

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
  static const devices = '/api/devices';

  static String manage(String clubId, String section) =>
      '/api/manage/clubs/$clubId/$section';
  static String manageItem(String clubId, String section, String itemId) =>
      '/api/manage/clubs/$clubId/$section/$itemId';
}

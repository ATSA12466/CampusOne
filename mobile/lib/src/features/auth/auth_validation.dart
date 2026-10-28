/// Lightweight client-side counterparts to the web Zod email checks and the
/// API's email limits. The server remains authoritative.
abstract final class AuthValidation {
  static final _email = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');

  static String? email(String? value) {
    final address = (value ?? '').trim();
    if (address.length > 254 || !_email.hasMatch(address)) {
      return 'Enter a valid email address.';
    }
    return null;
  }
}

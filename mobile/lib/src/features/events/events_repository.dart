import '../../core/api/api_client.dart';
import '../../core/api/api_paths.dart';
import '../../core/auth/auth_session.dart';

class RsvpResult {
  RsvpResult({required this.attending, this.id});

  final bool attending;
  final String? id;
}

class Ticket {
  Ticket({
    required this.reference,
    required this.name,
    required this.event,
    required this.status,
    required this.issuedAt,
  });

  final String reference;
  final String name;
  final String event;
  final String status;
  final String issuedAt;

  factory Ticket.fromJson(Map<String, dynamic> json) => Ticket(
    reference: asString(json['reference']),
    name: asString(json['name']),
    event: asString(json['event']),
    status: asString(json['status']),
    issuedAt: asString(json['issuedAt']),
  );
}

class EventsRepository {
  EventsRepository(this._api);

  final ApiClient _api;

  Future<RsvpResult> setRsvp(String eventId, bool attending) async {
    if (!attending) {
      await _api.delete(ApiPaths.eventRsvp(eventId));
      return RsvpResult(attending: false);
    }
    final json = await _api.post(
      ApiPaths.eventRsvp(eventId),
      body: {'attending': true},
    );
    final root = asMap(json);
    final rsvp = asMap(root['rsvp']);
    return RsvpResult(
      attending: root['attending'] == true,
      id: rsvp['id'] is String ? rsvp['id'] as String : null,
    );
  }

  Future<Ticket?> ticket(String eventId) async {
    try {
      final json = await _api.get(ApiPaths.eventTicket(eventId));
      return Ticket.fromJson(asMap(asMap(json)['ticket']));
    } on ApiException catch (error) {
      if (error.notFound) return null;
      rethrow;
    }
  }

  Future<bool> saved(String eventId) async {
    final json = await _api.get(ApiPaths.eventSaved(eventId));
    return asMap(json)['saved'] == true;
  }

  Future<bool> setSaved(String eventId, bool value) async {
    final json = await _api.put(
      ApiPaths.eventSaved(eventId),
      body: {'saved': value},
    );
    return asMap(json)['saved'] == true;
  }
}

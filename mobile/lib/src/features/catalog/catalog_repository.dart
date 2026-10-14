import '../../core/api/api_client.dart';
import '../../core/api/api_paths.dart';
import '../../core/api/paged.dart';
import '../../core/auth/auth_session.dart';

/// Thin typed access to the shared catalog endpoints.
class CatalogRepository {
  CatalogRepository(this._api);

  final ApiClient _api;

  Future<Paged<Club>> clubs({String search = '', String category = 'all'}) async {
    final json = await _api.get(
      ApiPaths.catalog('clubs'),
      query: {'search': search, 'category': category, 'pageSize': '30'},
    );
    return Paged.fromJson(json, Club.fromJson);
  }

  Future<Club> club(String id) async {
    final json = await _api.get(ApiPaths.catalogItem('clubs', id));
    return Club.fromJson(asMap(json));
  }

  Future<Paged<EventItem>> events({String search = '', String category = 'all'}) async {
    final json = await _api.get(
      ApiPaths.catalog('events'),
      query: {'search': search, 'category': category, 'pageSize': '30'},
    );
    return Paged.fromJson(json, EventItem.fromJson);
  }

  Future<EventItem> event(String id) async {
    final json = await _api.get(ApiPaths.catalogItem('events', id));
    return EventItem.fromJson(asMap(json));
  }

  Future<Paged<Announcement>> announcements({String search = ''}) async {
    final json = await _api.get(
      ApiPaths.catalog('announcements'),
      query: {'search': search, 'sort': 'newest', 'pageSize': '30'},
    );
    return Paged.fromJson(json, Announcement.fromJson);
  }

  Future<Paged<ListingItem>> accommodation() async {
    final json = await _api.get(
      ApiPaths.catalog('accommodation'),
      query: {'pageSize': '30'},
    );
    return Paged.fromJson(json, ListingItem.fromJson);
  }

  Future<Paged<MaterialItem>> materials() async {
    final json = await _api.get(
      ApiPaths.catalog('resources'),
      query: {'pageSize': '30'},
    );
    return Paged.fromJson(json, MaterialItem.fromJson);
  }

  Future<Paged<Representative>> representatives() async {
    final json = await _api.get(
      ApiPaths.catalog('representatives'),
      query: {'pageSize': '30'},
    );
    return Paged.fromJson(json, Representative.fromJson);
  }

  Future<Paged<SrcProject>> projects() async {
    final json = await _api.get(
      ApiPaths.catalog('projects'),
      query: {'pageSize': '30'},
    );
    return Paged.fromJson(json, SrcProject.fromJson);
  }
}

class Club {
  Club({
    required this.id,
    required this.name,
    required this.category,
    required this.description,
    required this.memberCount,
    required this.accepting,
    required this.meeting,
    required this.venue,
  });

  final String id;
  final String name;
  final String category;
  final String description;
  final int memberCount;
  final bool accepting;
  final String meeting;
  final String venue;

  factory Club.fromJson(Map<String, dynamic> json) {
    final details = asMap(json['details']);
    return Club(
      id: asString(json['id']),
      name: asString(json['name']),
      category: asString(json['category']),
      description: asString(json['description']),
      memberCount: asInt(details['memberCount']),
      accepting: details['accepting'] != false,
      meeting: asString(details['meeting']),
      venue: asString(details['venue']),
    );
  }
}

class EventItem {
  EventItem({
    required this.id,
    required this.title,
    required this.venue,
    required this.date,
    required this.category,
    required this.seats,
    required this.registered,
    required this.tagline,
    required this.organizer,
    required this.startsAt,
    required this.endsAt,
  });

  final String id;
  final String title;
  final String venue;
  final String date;
  final String category;
  final int seats;
  final int registered;
  final String tagline;
  final String organizer;
  final String startsAt;
  final String endsAt;

  bool get full => seats > 0 && registered >= seats;

  factory EventItem.fromJson(Map<String, dynamic> json) {
    final details = asMap(json['details']);
    return EventItem(
      id: asString(json['id']),
      title: asString(json['title']),
      venue: asString(json['venue']),
      date: asString(json['date']),
      category: asString(json['category']),
      seats: asInt(json['seats']),
      registered: asInt(json['registered']),
      tagline: asString(details['tagline']),
      organizer: asString(details['organizer']),
      startsAt: asString(details['startsAt']),
      endsAt: asString(details['endsAt']),
    );
  }
}

class Announcement {
  Announcement({
    required this.id,
    required this.title,
    required this.content,
    required this.category,
    required this.pinned,
    required this.publishedAt,
  });

  final String id;
  final String title;
  final String content;
  final String category;
  final bool pinned;
  final String publishedAt;

  factory Announcement.fromJson(Map<String, dynamic> json) => Announcement(
    id: asString(json['id']),
    title: asString(json['title']),
    content: asString(json['content']),
    category: asString(json['category']),
    pinned: json['pinned'] == true,
    publishedAt: asString(json['publishedAt']),
  );
}

class ListingItem {
  ListingItem({
    required this.id,
    required this.title,
    required this.location,
    required this.price,
    required this.facilities,
    required this.kind,
  });

  final String id;
  final String title;
  final String location;
  final String price;
  final List<String> facilities;
  final String kind;

  factory ListingItem.fromJson(Map<String, dynamic> json) {
    final raw = json['facilities'];
    return ListingItem(
      id: asString(json['id']),
      title: asString(json['title']),
      location: asString(json['location']),
      price: asString(json['price']),
      facilities: raw is List ? raw.whereType<String>().toList() : const [],
      kind: asString(asMap(json['details'])['kind']),
    );
  }
}

class MaterialItem {
  MaterialItem({
    required this.id,
    required this.title,
    required this.course,
    required this.category,
    required this.description,
  });

  final String id;
  final String title;
  final String course;
  final String category;
  final String description;

  factory MaterialItem.fromJson(Map<String, dynamic> json) => MaterialItem(
    id: asString(json['id']),
    title: asString(json['title']),
    course: asString(json['course']),
    category: asString(json['category']),
    description: asString(json['description']),
  );
}

class Representative {
  Representative({
    required this.id,
    required this.name,
    required this.role,
    required this.bio,
  });

  final String id;
  final String name;
  final String role;
  final String bio;

  factory Representative.fromJson(Map<String, dynamic> json) => Representative(
    id: asString(json['id']),
    name: asString(json['name'], asString(json['title'])),
    role: asString(json['role'], asString(json['position'])),
    bio: asString(json['bio'], asString(json['description'])),
  );
}

class SrcProject {
  SrcProject({
    required this.id,
    required this.title,
    required this.description,
    required this.status,
  });

  final String id;
  final String title;
  final String description;
  final String status;

  factory SrcProject.fromJson(Map<String, dynamic> json) => SrcProject(
    id: asString(json['id']),
    title: asString(json['title'], asString(json['name'])),
    description: asString(json['description']),
    status: asString(json['status']),
  );
}

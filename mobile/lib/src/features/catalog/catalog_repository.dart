import '../../core/api/api_client.dart';
import '../../core/api/api_paths.dart';
import '../../core/api/paged.dart';
import '../../core/auth/auth_session.dart';
import '../../core/media/campus_media.dart';

/// Thin typed access to the shared catalog endpoints.
///
/// Every model keeps the photo the web shows in the same place, parsed through
/// [CampusMedia] so a missing/stand-in image renders identically on both
/// clients instead of silently dropping to an empty box.
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

  /// The home "On the campus radar" carousel.
  Future<List<FeaturedItem>> featured() async {
    final json = await _api.get(
      ApiPaths.catalog('featured'),
      query: {'pageSize': '12'},
    );
    final items = asMap(json)['items'];
    if (items is! List) return const <FeaturedItem>[];
    return [
      for (final entry in items)
        if (entry is Map)
          FeaturedItem.fromJson(Map<String, dynamic>.from(entry)),
    ];
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
    this.cover,
    this.gallery = const <CampusMedia>[],
    this.tagline = '',
    this.story = const <String>[],
    this.highlights = const <String>[],
    this.leaders = const <ClubLeader>[],
  });

  final String id;
  final String name;
  final String category;
  final String description;
  final int memberCount;
  final bool accepting;
  final String meeting;
  final String venue;
  final CampusMedia? cover;
  final List<CampusMedia> gallery;
  final String tagline;
  final List<String> story;
  final List<String> highlights;
  final List<ClubLeader> leaders;

  factory Club.fromJson(Map<String, dynamic> json) {
    final details = asMap(json['details']);
    final coverAlt = asString(details['coverAlt']);
    final gallery = CampusMedia.listFrom(details['gallery']);
    final cover =
        CampusMedia.firstOf([
          details['cover'],
          json['cover'],
          if (gallery.isNotEmpty) details['gallery'][0],
        ], alt: coverAlt);
    return Club(
      id: asString(json['id']),
      name: asString(json['name']),
      category: asString(json['category']),
      description: asString(json['description']),
      memberCount: asInt(details['memberCount']),
      accepting: details['accepting'] != false,
      meeting: asString(details['meeting']),
      venue: asString(details['venue']),
      cover: cover,
      gallery: gallery,
      tagline: asString(details['tagline']),
      story: _strings(details['story']),
      highlights: _strings(details['highlights']),
      leaders: [
        for (final entry in _maps(details['leaders']))
          ClubLeader(
            name: asString(entry['name']),
            role: asString(entry['role']),
            avatar: CampusMedia.tryParse(entry['avatar']),
          ),
      ],
    );
  }
}

class ClubLeader {
  const ClubLeader({required this.name, required this.role, this.avatar});

  final String name;
  final String role;
  final CampusMedia? avatar;
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
    this.cover,
    this.gallery = const <CampusMedia>[],
    this.description = const <String>[],
    this.highlights = const <String>[],
    this.agenda = const <EventAgendaItem>[],
    this.speakers = const <EventSpeaker>[],
    this.accessibility = const <String>[],
    this.price = 0,
    this.status = 'scheduled',
    this.bookingClosesAt = '',
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
  final CampusMedia? cover;
  final List<CampusMedia> gallery;
  final List<String> description;
  final List<String> highlights;
  final List<EventAgendaItem> agenda;
  final List<EventSpeaker> speakers;
  final List<String> accessibility;
  final int price;
  final String status;
  final String bookingClosesAt;

  bool get full => seats > 0 && registered >= seats;
  bool get cancelled => status == 'cancelled';

  factory EventItem.fromJson(Map<String, dynamic> json) {
    final details = asMap(json['details']);
    final coverAlt = asString(details['coverAlt']);
    final gallery = CampusMedia.listFrom(details['gallery']);
    final cover =
        CampusMedia.firstOf([
          details['cover'],
          json['cover'],
          json['thumbnail'],
          if (gallery.isNotEmpty) details['gallery'][0],
        ], alt: coverAlt);
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
      cover: cover,
      gallery: gallery,
      description: _strings(details['description']),
      highlights: _strings(details['highlights']),
      agenda: [
        for (final entry in _maps(details['agenda']))
          EventAgendaItem(
            title: asString(entry['title']),
            startsAt: asString(entry['startsAt']),
            description: asString(entry['description']),
          ),
      ],
      speakers: [
        for (final entry in _maps(details['speakers']))
          EventSpeaker(
            name: asString(entry['name']),
            role: asString(entry['role']),
            avatar: CampusMedia.tryParse(entry['avatar']),
          ),
      ],
      accessibility: _strings(details['accessibility']),
      price: asInt(details['price']),
      status: asString(details['status'], 'scheduled'),
      bookingClosesAt: asString(details['bookingClosesAt']),
    );
  }
}

class EventAgendaItem {
  const EventAgendaItem({
    required this.title,
    required this.startsAt,
    required this.description,
  });

  final String title;
  final String startsAt;
  final String description;
}

class EventSpeaker {
  const EventSpeaker({required this.name, required this.role, this.avatar});

  final String name;
  final String role;
  final CampusMedia? avatar;
}

class Announcement {
  Announcement({
    required this.id,
    required this.title,
    required this.content,
    required this.category,
    required this.pinned,
    required this.publishedAt,
    this.cover,
  });

  final String id;
  final String title;
  final String content;
  final String category;
  final bool pinned;
  final String publishedAt;
  final CampusMedia? cover;

  factory Announcement.fromJson(Map<String, dynamic> json) => Announcement(
    id: asString(json['id']),
    title: asString(json['title']),
    content: asString(json['content']),
    category: asString(json['category']),
    pinned: json['pinned'] == true,
    publishedAt: asString(json['publishedAt']),
    cover: CampusMedia.firstOf([json['cover'], json['photo'], json['thumbnail']]),
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
    this.cover,
    this.gallery = const <CampusMedia>[],
    this.intro = '',
    this.owner = '',
    this.tags = const <String>[],
  });

  final String id;
  final String title;
  final String location;
  final String price;
  final List<String> facilities;
  final String kind;
  final CampusMedia? cover;
  final List<CampusMedia> gallery;
  final String intro;
  final String owner;
  final List<String> tags;

  factory ListingItem.fromJson(Map<String, dynamic> json) {
    final raw = json['facilities'];
    final details = asMap(json['details']);
    final gallery = CampusMedia.listFrom(details['gallery']);
    return ListingItem(
      id: asString(json['id']),
      title: asString(json['title']),
      location: asString(json['location']),
      price: asString(json['price']),
      facilities: raw is List ? raw.whereType<String>().toList() : const [],
      kind: asString(details['kind']),
      cover: CampusMedia.firstOf([
        details['cover'],
        json['cover'],
        json['photo'],
        json['thumbnail'],
        if (gallery.isNotEmpty) details['gallery'][0],
      ]),
      gallery: gallery,
      intro: asString(details['intro']),
      owner: asString(details['owner']),
      tags: _strings(details['tags']),
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
    this.cover,
    this.author = '',
    this.source = '',
  });

  final String id;
  final String title;
  final String course;
  final String category;
  final String description;
  final CampusMedia? cover;
  final String author;
  final String source;

  factory MaterialItem.fromJson(Map<String, dynamic> json) => MaterialItem(
    id: asString(json['id']),
    title: asString(json['title']),
    course: asString(json['course']),
    category: asString(json['category']),
    description: asString(json['description']),
    cover: CampusMedia.firstOf([
      asMap(json['details'])['cover'],
      json['cover'],
      json['photo'],
      json['thumbnail'],
    ]),
    author: asString(json['author'], asString(json['uploadedBy'])),
    source: asString(json['source'], asString(json['url'])),
  );
}

class Representative {
  Representative({
    required this.id,
    required this.name,
    required this.role,
    required this.bio,
    this.avatar,
  });

  final String id;
  final String name;
  final String role;
  final String bio;
  final CampusMedia? avatar;

  factory Representative.fromJson(Map<String, dynamic> json) => Representative(
    id: asString(json['id']),
    name: asString(json['name'], asString(json['title'])),
    role: asString(json['role'], asString(json['position'])),
    bio: asString(json['bio'], asString(json['description'])),
    avatar: CampusMedia.firstOf([json['avatar'], json['photo'], json['image']]),
  );
}

class SrcProject {
  SrcProject({
    required this.id,
    required this.title,
    required this.description,
    required this.status,
    this.cover,
  });

  final String id;
  final String title;
  final String description;
  final String status;
  final CampusMedia? cover;

  factory SrcProject.fromJson(Map<String, dynamic> json) => SrcProject(
    id: asString(json['id']),
    title: asString(json['title'], asString(json['name'])),
    description: asString(json['description']),
    status: asString(json['status']),
    cover: CampusMedia.firstOf([
      json['cover'],
      json['photo'],
      json['thumbnail'],
      json['image'],
    ]),
  );
}

/// One slide of the home "On the campus radar" carousel.
class FeaturedItem {
  FeaturedItem({
    required this.id,
    required this.title,
    required this.description,
    required this.type,
    required this.destination,
    this.thumbnail,
    this.creator = '',
    this.duration = '',
    this.ctaLabel = '',
    this.mediaSource = '',
    this.sponsored = false,
  });

  final String id;
  final String title;
  final String description;
  final String type;
  final String destination;
  final CampusMedia? thumbnail;
  final String creator;
  final String duration;
  final String ctaLabel;
  final String mediaSource;
  final bool sponsored;

  bool get isSponsored => sponsored || type == 'sponsored';
  bool get hasVideo => !isSponsored && mediaSource.isNotEmpty;

  factory FeaturedItem.fromJson(Map<String, dynamic> json) {
    final thumbnail = asString(json['thumbnail']);
    final alt = asString(json['thumbnailAlt']);
    return FeaturedItem(
      id: asString(json['id']),
      title: asString(json['title']),
      description: asString(json['description']),
      type: asString(json['type'], 'highlight'),
      destination: asString(json['destination']),
      thumbnail: thumbnail.isEmpty
          ? null
          : CampusMedia.tryParse(thumbnail, alt: alt),
      creator: asString(json['creator']),
      duration: asString(json['duration']),
      ctaLabel: asString(json['ctaLabel']),
      mediaSource: asString(json['mediaSource']),
      sponsored: json['sponsored'] == true,
    );
  }
}

List<String> _strings(dynamic value) =>
    value is List ? value.whereType<String>().toList() : const [];

List<Map<String, dynamic>> _maps(dynamic value) => value is List
    ? [
        for (final entry in value)
          if (entry is Map) Map<String, dynamic>.from(entry),
      ]
    : const [];

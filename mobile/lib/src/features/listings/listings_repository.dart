import '../../core/api/api_client.dart';
import '../../core/api/api_paths.dart';
import '../../core/auth/auth_session.dart';
import '../../core/media/campus_media.dart';
import '../../core/store/personal_store.dart';

/// One generic shape over the catalog listing domains.
class ListingItem {
  ListingItem({
    required this.domain,
    required this.id,
    required this.title,
    required this.subtitle,
    required this.description,
    required this.chips,
    required this.body,
    this.extra = const {},
    this.photo,
    this.gallery = const <CampusMedia>[],
  });

  final String domain;
  final String id;
  final String title;
  final String subtitle;
  final String description;
  final List<String> chips;
  final List<String> body;
  final Map<String, String> extra;

  /// Lead photo (web `details.cover`), plus the full gallery where the record
  /// has one. Records without a photo render the shared stand-in frame.
  final CampusMedia? photo;
  final List<CampusMedia> gallery;

  factory ListingItem.fromJson(String domain, Map<String, dynamic> json) {
    final details = asMap(json['details']);
    final gallery = CampusMedia.listFrom(details['gallery']);
    final photo = CampusMedia.firstOf([
      details['cover'],
      json['cover'],
      json['photo'],
      json['thumbnail'],
      if (gallery.isNotEmpty) details['gallery'][0],
    ], alt: asString(details['coverAlt']));
    final body = <String>[];
    final intro = asString(details['intro']);
    if (intro.isNotEmpty) body.add(intro);
    final rawBody = details['body'];
    if (rawBody is List) body.addAll(rawBody.whereType<String>());
    return switch (domain) {
      'marketplace' => ListingItem(
        domain: domain,
        id: asString(json['id']),
        title: asString(json['title']),
        subtitle:
            '${asString(json['priceLabel'])} · ${asString(json['category'])}',
        description: asString(json['description']),
        chips: [asString(json['category']), asString(details['condition'])]
            .where((c) => c.isNotEmpty)
            .toList(),
        body: body,
        extra: {'kind': asString(details['kind'])},
        photo: photo,
        gallery: gallery,
      ),
      'opportunities' => ListingItem(
        domain: domain,
        id: asString(json['id']),
        title: asString(json['title']),
        subtitle:
            '${asString(json['provider'])} · closes ${asString(json['deadline'])}',
        description: asString(
          json['summary'],
          asString(json['description']),
        ),
        chips: [asString(json['category'])]
            .where((c) => c.isNotEmpty)
            .toList(),
        body: body,
        extra: {
          'applyUrl': asString(json['applyUrl'], asString(details['applyUrl'])),
          'deadline': asString(json['deadline']),
        },
        photo: photo,
        gallery: gallery,
      ),
      'lostFound' => ListingItem(
        domain: domain,
        id: asString(json['id']),
        title: asString(json['item'], asString(json['title'])),
        subtitle:
            '${asString(json['type'])} · ${asString(json['location'])} · ${asString(json['date'])}',
        description: asString(json['description']),
        chips: [asString(json['type']), asString(json['status'])]
            .where((c) => c.isNotEmpty)
            .toList(),
        body: body,
        photo: photo,
        gallery: gallery,
      ),
      'media' => ListingItem(
        domain: domain,
        id: asString(json['id']),
        title: asString(json['title']),
        subtitle: '${asString(json['creator'])} · ${asString(json['duration'])}',
        description: asString(json['description']),
        chips: [asString(json['kind'])]
            .where((c) => c.isNotEmpty)
            .toList(),
        body: body,
        extra: {'source': asString(json['source']), 'kind': asString(json['kind']), 'duration': asString(json['duration']), 'creator': asString(json['creator'])},
        photo: photo,
        gallery: gallery,
      ),
      'campaigns' => ListingItem(
        domain: domain,
        id: asString(json['id']),
        title: asString(json['title']),
        subtitle:
            '${asString(json['advertiser'])} · ${asString(json['placement'])}',
        description: asString(json['description']),
        chips: [asString(json['status'])]
            .where((c) => c.isNotEmpty)
            .toList(),
        body: body,
        extra: {'ends': asString(json['endDate']), 'start': asString(json['startDate']), 'advertiser': asString(json['advertiser']), 'placement': asString(json['placement']), 'status': asString(json['status']), 'photo': photo?.src ?? ''},
        photo: photo,
        gallery: gallery,
      ),
      'courses' => ListingItem(
        domain: domain,
        id: asString(json['id']),
        title: '${asString(json['code'])} · ${asString(json['title'])}',
        subtitle: asString(json['code']),
        description: asString(json['description']),
        chips: const [],
        body: body,
        photo: photo,
        gallery: gallery,
      ),
      'resources' => ListingItem(
        domain: domain,
        id: asString(json['id']),
        title: asString(json['title']),
        subtitle:
            '${asString(json['course'])} · ${asString(json['category'])}',
        description: asString(json['description']),
        chips: [asString(json['category'])]
            .where((c) => c.isNotEmpty)
            .toList(),
        body: body,
        photo: photo,
        gallery: gallery,
      ),
      'accommodation' => ListingItem(
        domain: domain,
        id: asString(json['id']),
        title: asString(json['title']),
        subtitle: '${asString(json['location'])} · ${asString(json['price'])}',
        description: '',
        chips: [asString(details['kind'])]
            .where((c) => c.isNotEmpty)
            .toList(),
        body: body,
        extra: {
          'facilities': (json['facilities'] is List
                  ? (json['facilities'] as List).whereType<String>().toList()
                  : <String>[])
              .join(' · '),
          'location': asString(json['location']),
          'price': asString(json['price']),
        },
        photo: photo,
        gallery: gallery,
      ),
      'announcements' => ListingItem(
        domain: domain,
        id: asString(json['id']),
        title: asString(json['title']),
        subtitle:
            '${asString(json['category'])} · ${asString(json['publishedAt'])}',
        description: asString(json['content']),
        chips: [
          asString(json['category']),
          if (json['pinned'] == true) 'Pinned',
        ].where((c) => c.isNotEmpty).toList(),
        body: body,
        photo: photo,
        gallery: gallery,
      ),
      _ => ListingItem(
        domain: domain,
        id: asString(json['id']),
        title: asString(json['title'], asString(json['name'], 'Untitled')),
        subtitle: '',
        description: asString(
          json['description'],
          asString(json['content'], asString(json['summary'])),
        ),
        chips: const [],
        body: body,
      ),
    };
  }
}

class PhotoRecord {
  PhotoRecord({
    required this.id,
    required this.title,
    required this.description,
    required this.category,
    required this.location,
    required this.priceValue,
    required this.type,
    required this.photo,
    required this.status,
  });

  final String id;
  final String title;
  final String description;
  final String category;
  final String location;
  final double priceValue;
  final String type;
  final String photo;
  final String status;

  factory PhotoRecord.fromJson(Map<String, dynamic> json) => PhotoRecord(
    id: asString(json['id']),
    title: asString(json['title']),
    description: asString(json['description']),
    category: asString(json['category']),
    location: asString(json['location']),
    priceValue: json['priceValue'] is num
        ? (json['priceValue'] as num).toDouble()
        : 0,
    type: asString(json['type']),
    photo: asString(json['photo']),
    status: asString(json['status'], 'open'),
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'description': description,
    'category': category,
    'location': location,
    'priceValue': priceValue,
    'type': type,
    'photo': photo,
    'createdAt': DateTime.now().toUtc().toIso8601String(),
    'status': status,
  };
}

class ListingEnquiry {
  ListingEnquiry({
    required this.id,
    required this.category,
    required this.listingId,
    required this.message,
    required this.intent,
    required this.createdAt,
  });

  final String id;
  final String category;
  final String listingId;
  final String message;
  final String intent;
  final String createdAt;

  factory ListingEnquiry.fromJson(Map<String, dynamic> json) =>
      ListingEnquiry(
        id: asString(json['id']),
        category: asString(json['category']),
        listingId: asString(json['listingId']),
        message: asString(json['message']),
        intent: asString(json['intent']),
        createdAt: asString(json['createdAt']),
      );

  Map<String, dynamic> toJson() => {
    'id': id,
    'category': category,
    'listingId': listingId,
    'message': message,
    'intent': intent,
    'createdAt': createdAt,
  };
}

class ListingsRepository {
  ListingsRepository(ApiClient api)
    : _api = api,
      _store = PersonalStoreRepository(api);

  final ApiClient _api;
  final PersonalStoreRepository _store;

  Future<List<ListingItem>> list(String domain, {String search = ''}) async {
    final json = await _api.get(
      ApiPaths.catalog(domain),
      query: {'search': search, 'pageSize': '30'},
    );
    return asList(
      asMap(json)['items'],
    ).map((item) => ListingItem.fromJson(domain, item)).toList();
  }

  Future<ListingItem> detail(String domain, String id) async {
    final json = await _api.get(ApiPaths.catalogItem(domain, id));
    return ListingItem.fromJson(domain, asMap(json));
  }

  Future<List<PhotoRecord>> myPhotoRecords(String collection) async =>
      (await _store.list(collection)).map(PhotoRecord.fromJson).toList();

  Future<PhotoRecord> savePhotoRecord(
    String collection,
    PhotoRecord record,
  ) async =>
      PhotoRecord.fromJson(await _store.put(collection, record.toJson()));

  Future<bool> removePhotoRecord(String collection, String id) =>
      _store.remove(collection, id);

  Future<ListingEnquiry> sendEnquiry(ListingEnquiry enquiry) async =>
      ListingEnquiry.fromJson(
        await _store.put('enquiries', enquiry.toJson()),
      );

  Future<List<ListingEnquiry>> myEnquiries() async =>
      (await _store.list('enquiries')).map(ListingEnquiry.fromJson).toList();
}

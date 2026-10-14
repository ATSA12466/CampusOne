import '../../core/api/api_client.dart';
import '../../core/api/api_paths.dart';
import '../../core/auth/auth_session.dart';
import '../../core/store/personal_store.dart';

class FeedPost {
  FeedPost({
    required this.id,
    required this.author,
    required this.body,
    required this.createdAt,
    required this.topic,
    required this.likes,
    this.mine = false,
    this.photo,
  });

  final String id;
  final String author;
  final String body;
  final String createdAt;
  final String topic;
  final int likes;
  final bool mine;
  final String? photo;

  factory FeedPost.fromJson(Map<String, dynamic> json, {bool mine = false}) {
    final details = asMap(json['details']);
    return FeedPost(
      id: asString(json['id']),
      author: asString(json['author']),
      body: asString(json['body']),
      createdAt: asString(json['createdAt']),
      topic: asString(json['topic'], asString(details['topic'])),
      likes: asInt(json['likes']),
      mine: mine,
      photo: json['photo'] is String ? json['photo'] as String : null,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'author': author,
    'body': body,
    'topic': topic,
    'createdAt': createdAt,
    if (photo != null) 'photo': photo,
  };
}

class PostReply {
  PostReply({
    required this.id,
    required this.postId,
    required this.author,
    required this.body,
    required this.createdAt,
  });

  final String id;
  final String postId;
  final String author;
  final String body;
  final String createdAt;

  factory PostReply.fromJson(Map<String, dynamic> json) => PostReply(
    id: asString(json['id']),
    postId: asString(json['postId']),
    author: asString(json['author']),
    body: asString(json['body']),
    createdAt: asString(json['createdAt']),
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'postId': postId,
    'author': author,
    'body': body,
    'createdAt': createdAt,
  };
}

class CommunityRepository {
  CommunityRepository(ApiClient api)
    : _api = api,
      _store = PersonalStoreRepository(api);

  final ApiClient _api;
  final PersonalStoreRepository _store;

  Future<List<FeedPost>> publicPosts({String search = ''}) async {
    final json = await _api.get(
      ApiPaths.catalog('posts'),
      query: {'search': search, 'pageSize': '30'},
    );
    return asList(
      asMap(json)['items'],
    ).map((item) => FeedPost.fromJson(item)).toList();
  }

  Future<List<FeedPost>> myPosts() async =>
      (await _store.list('communityPosts'))
          .map((item) => FeedPost.fromJson(item, mine: true))
          .toList();

  Future<FeedPost> publish(FeedPost post) async =>
      FeedPost.fromJson(await _store.put('communityPosts', post.toJson()), mine: true);

  Future<bool> removePost(String id) => _store.remove('communityPosts', id);

  Future<List<PostReply>> replies() async =>
      (await _store.list('replies')).map(PostReply.fromJson).toList();

  Future<PostReply> addReply(PostReply reply) async =>
      PostReply.fromJson(await _store.put('replies', reply.toJson()));

  Future<Set<String>> reactedPostIds() async =>
      (await _store.list('reactions'))
          .map((item) => asString(item['postId']))
          .toSet();

  Future<void> setReacted(String postId, bool reacted) async {
    if (reacted) {
      await _store.put('reactions', {
        'id': postId,
        'postId': postId,
        'kind': 'like',
      });
    } else {
      await _store.remove('reactions', postId);
    }
  }

  /// Private note about a post (same semantics as web concerns).
  Future<void> addConcern({
    required String targetId,
    required String reason,
    required String note,
  }) async {
    await _store.put('concerns', {
      'id': newRecordId('concern'),
      'targetId': targetId,
      'area': 'community',
      'reason': reason,
      'note': note,
      'createdAt': DateTime.now().toUtc().toIso8601String(),
    });
  }

  /// Escalate to the moderation team (live report queue).
  Future<void> reportPost(String postId, String reason, String detail) =>
      _api.post(
        ApiPaths.reportsSubmit,
        body: {
          'targetType': 'post',
          'targetId': postId,
          'reason': reason,
          'detail': detail,
        },
      );
}

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
    return asList(asMap(json)['items']).map((item) => FeedPost.fromJson(item)).toList();
  }

  Future<List<FeedPost>> myPosts() async {
    final json = await _api.get(ApiPaths.catalog('posts'), query: {'mine':'true'});
    return asList(asMap(json)['items']).map((item) => FeedPost.fromJson(item, mine: true)).toList();
  }

  Future<FeedPost> publish(FeedPost post) async {
    final json = await _api.post(ApiPaths.catalog('posts'), body: post.toJson());
    return FeedPost.fromJson(asMap(json)['item'], mine: true);
  }

  Future<bool> removePost(String id) async { await _api.delete(ApiPaths.catalogItem('posts', id)); return true; }

  Future<List<PostReply>> replies() async => asList(asMap(await _api.get('/api/community/replies'))['items']).map(PostReply.fromJson).toList();

  Future<PostReply> addReply(PostReply reply) async => PostReply.fromJson(asMap(await _api.post('/api/community/posts/${reply.postId}/replies', body: {'body':reply.body}))['item']);

  Future<Set<String>> reactedPostIds() async => asList(asMap(await _api.get('/api/community/reactions'))['items']).map((item) => asString(item['postId'])).toSet();

  Future<void> setReacted(String postId, bool reacted) async {
    await _api.put('/api/community/posts/$postId/reaction', body: {'reacted':reacted});
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

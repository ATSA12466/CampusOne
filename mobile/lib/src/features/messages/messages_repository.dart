import '../../core/api/api_client.dart';
import '../../core/api/api_paths.dart';
import '../../core/auth/auth_session.dart';

class Conversation {
  Conversation({
    required this.id,
    required this.kind,
    required this.title,
    required this.clubId,
    required this.updatedAt,
    required this.unread,
    required this.members,
    this.lastBody,
    this.lastSender,
  });

  final String id;
  final String kind;
  final String title;
  final String clubId;
  final String updatedAt;
  final int unread;
  final int members;
  final String? lastBody;
  final String? lastSender;

  int get unreadCount => unread;

  String lastMessagePreview() {
    if (lastBody == null || lastBody!.isEmpty) return 'No messages yet';
    if (lastSender == null || lastSender!.isEmpty) return lastBody!;
    return '$lastSender: $lastBody';
  }

  factory Conversation.fromJson(Map<String, dynamic> json) {
    final last = asMap(json['lastMessage']);
    return Conversation(
      id: asString(json['id']),
      kind: asString(json['kind']),
      title: asString(json['title']),
      clubId: asString(json['clubId']),
      updatedAt: asString(json['updatedAt']),
      unread: asInt(json['unread']),
      members: asInt(json['members']),
      lastBody: last['body'] is String ? last['body'] as String : null,
      lastSender: last['senderName'] is String
          ? last['senderName'] as String
          : null,
    );
  }
}

class ChatMessage {
  ChatMessage({
    required this.id,
    required this.senderId,
    required this.senderName,
    required this.body,
    required this.createdAt,
  });

  final String id;
  final String senderId;
  final String senderName;
  final String body;
  final String createdAt;

  factory ChatMessage.fromJson(Map<String, dynamic> json) => ChatMessage(
    id: asString(json['id']),
    senderId: asString(json['senderId']),
    senderName: asString(json['senderName']),
    body: asString(json['body']),
    createdAt: asString(json['createdAt']),
  );
}

class MessagesRepository {
  MessagesRepository(this._api);

  final ApiClient _api;

  Future<List<Conversation>> conversations() async {
    final json = await _api.get(ApiPaths.conversations);
    final items = asMap(json)['items'];
    if (items is! List) return [];
    return items
        .whereType<Map<String, dynamic>>()
        .map(Conversation.fromJson)
        .toList();
  }

  Future<Conversation> startDirect(String userId) async {
    final json = await _api.post(
      ApiPaths.conversations,
      body: {'kind': 'direct', 'userId': userId},
    );
    return Conversation.fromJson(asMap(asMap(json)['item']));
  }

  Future<Conversation> createGroup({
    required String title,
    required List<String> memberIds,
  }) async {
    final json = await _api.post(
      ApiPaths.conversations,
      body: {'kind': 'group', 'title': title, 'memberIds': memberIds},
    );
    return Conversation.fromJson(asMap(asMap(json)['item']));
  }

  Future<List<ChatMessage>> thread(String id) async {
    final json = await _api.get(ApiPaths.thread(id));
    final items = asMap(json)['items'];
    if (items is! List) return [];
    return items
        .whereType<Map<String, dynamic>>()
        .map(ChatMessage.fromJson)
        .toList();
  }

  Future<ChatMessage> send(String id, String body) async {
    final json = await _api.post(ApiPaths.thread(id), body: {'body': body});
    return ChatMessage.fromJson(asMap(asMap(json)['item']));
  }

  Future<void> markRead(String id) =>
      _api.post(ApiPaths.threadRead(id));
}

import '../../core/api/api_client.dart';
import '../../core/auth/auth_session.dart';
import '../../core/store/personal_store.dart';

class TaskItem {
  TaskItem({
    required this.id,
    required this.title,
    required this.priority,
    required this.category,
    required this.completed,
    this.description = '',
    this.dueDate = '',
  });

  final String id;
  final String title;
  final String priority;
  final String category;
  final bool completed;
  final String description;
  final String dueDate;

  factory TaskItem.fromJson(Map<String, dynamic> json) => TaskItem(
    id: asString(json['id']),
    title: asString(json['title']),
    priority: asString(json['priority'], 'medium'),
    category: asString(json['category'], 'personal'),
    completed: json['completed'] == true,
    description: asString(json['description']),
    dueDate: asString(json['dueDate']),
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'description': description,
    'dueDate': dueDate,
    'priority': priority,
    'category': category,
    'completed': completed,
  };
}

class TasksRepository {
  TasksRepository(ApiClient api) : _store = PersonalStoreRepository(api);

  final PersonalStoreRepository _store;

  Future<List<TaskItem>> list() async =>
      (await _store.list('tasks')).map(TaskItem.fromJson).toList();

  Future<TaskItem> save(TaskItem task) async =>
      TaskItem.fromJson(await _store.put('tasks', task.toJson()));

  Future<bool> remove(String id) => _store.remove('tasks', id);
}

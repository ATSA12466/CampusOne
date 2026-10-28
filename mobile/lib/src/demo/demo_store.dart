import 'package:flutter/foundation.dart';

class DemoTask {
  const DemoTask({
    required this.id,
    required this.title,
    required this.course,
    required this.dueDate,
    required this.priority,
    required this.completed,
    this.description = '',
  });

  final String id;
  final String title;
  final String course;
  final DateTime dueDate;
  final String priority;
  final bool completed;
  final String description;

  DemoTask copyWith({bool? completed}) => DemoTask(
        id: id,
        title: title,
        course: course,
        dueDate: dueDate,
        priority: priority,
        completed: completed ?? this.completed,
        description: description,
      );
}

class DemoClassSession {
  const DemoClassSession({
    required this.id,
    required this.day,
    required this.course,
    required this.time,
    required this.venue,
    this.lecturer = '',
  });

  final String id;
  final String day;
  final String course;
  final String time;
  final String venue;
  final String lecturer;
}

/// In-memory presentation state. Nothing is sent to or loaded from a server.
class DemoStore extends ChangeNotifier {
  String _profileName = 'Student Demo';
  String _profileProgramme = 'BSc. Information Technology';
  String _profileLevel = 'Level 300';
  String _profileBio = 'Learning, building and connecting at GCTU.';
  String _profileInterests = 'Technology, design, campus life';
  String _profileCampus = 'Tesano, Accra';
  String? _profilePhoto;
  bool _profileDiscoverable = true;
  bool _profileInterestsVisible = true;
  final Set<String> _rsvps = {'techx'};
  final Set<String> _savedEvents = {'career'};
  final Map<String, String> _clubMembership = {'acs': 'member'};
  final Set<String> _registeredClubActivities = {'acs|techx'};
  final Set<String> _clubAttendance = {};
  final Set<String> _completedFreshersSteps = {};
  String? _srcPollChoice;
  final List<String> _srcFeedback = [];
  final Set<String> _readAnnouncements = {};
  final List<String> _localReplies = [];
  final List<DemoTask> _tasks = _initialTasks();
  final List<DemoClassSession> _classes = _initialClasses();
  final Set<String> _savedMaterials = {};
  final Set<String> _savedSchoolMedia = {};

  bool isGoing(String eventId) => _rsvps.contains(eventId);
  String get profileName => _profileName;
  String get profileProgramme => _profileProgramme;
  String get profileLevel => _profileLevel;
  String get profileBio => _profileBio;
  String get profileInterests => _profileInterests;
  String get profileCampus => _profileCampus;
  String? get profilePhoto => _profilePhoto;
  bool get profileDiscoverable => _profileDiscoverable;
  bool get profileInterestsVisible => _profileInterestsVisible;

  void updateProfilePrivacy({bool? discoverable, bool? interestsVisible}) {
    if (discoverable != null) _profileDiscoverable = discoverable;
    if (interestsVisible != null) {
      _profileInterestsVisible = interestsVisible;
    }
    notifyListeners();
  }

  void updateDemoProfile({
    required String name,
    required String programme,
    required String level,
    required String bio,
    required String interests,
    required String campus,
    required String? photo,
  }) {
    _profileName = name;
    _profileProgramme = programme;
    _profileLevel = level;
    _profileBio = bio;
    _profileInterests = interests;
    _profileCampus = campus;
    _profilePhoto = photo;
    notifyListeners();
  }

  bool isSaved(String eventId) => _savedEvents.contains(eventId);
  bool isJoined(String clubId) => _clubMembership[clubId] == 'member';
  String clubMembership(String clubId) =>
      _clubMembership[clubId] ?? 'not a member';
  bool isRegisteredForActivity(String id, {String? clubId}) =>
      _registeredClubActivities.contains(clubId == null ? id : '$clubId|$id');
  bool hasClubAttendance(String clubId, String activityId) =>
      _clubAttendance.contains('$clubId|$activityId');
  int clubAttendanceCount([String? clubId]) => clubId == null
      ? _clubAttendance.length
      : _clubAttendance.where((key) => key.startsWith('$clubId|')).length;
  bool isFreshersStepComplete(String step) =>
      _completedFreshersSteps.contains(step);
  String? get srcPollChoice => _srcPollChoice;
  List<String> get srcFeedback => List.unmodifiable(_srcFeedback);
  bool isRead(String title) => _readAnnouncements.contains(title);
  List<String> get localReplies => List.unmodifiable(_localReplies);
  List<DemoTask> get tasks => List.unmodifiable(_tasks);
  List<DemoClassSession> get classes => List.unmodifiable(_classes);
  bool isMaterialSaved(String id) => _savedMaterials.contains(id);
  bool isSchoolMediaSaved(String id) => _savedSchoolMedia.contains(id);
  int get unreadAnnouncements =>
      _readAnnouncements.length >= 3 ? 0 : 3 - _readAnnouncements.length;
  int get goingEventCount => _rsvps.length;
  int get savedEventCount => _savedEvents.length;
  int get joinedClubCount =>
      _clubMembership.values.where((status) => status == 'member').length;
  int get completedTaskCount => _tasks.where((task) => task.completed).length;
  int get pendingTaskCount => _tasks.where((task) => !task.completed).length;

  void addTask({
    required String title,
    required String course,
    required DateTime dueDate,
    required String priority,
    String description = '',
  }) {
    _tasks.insert(
        0,
        DemoTask(
          id: DateTime.now().microsecondsSinceEpoch.toString(),
          title: title.trim(),
          course: course.trim().isEmpty ? 'Personal' : course.trim(),
          dueDate: dueDate,
          priority: priority,
          completed: false,
          description: description.trim(),
        ));
    notifyListeners();
  }

  void toggleTask(String id) {
    final index = _tasks.indexWhere((task) => task.id == id);
    if (index < 0) return;
    _tasks[index] = _tasks[index].copyWith(completed: !_tasks[index].completed);
    notifyListeners();
  }

  void removeTask(String id) {
    _tasks.removeWhere((task) => task.id == id);
    notifyListeners();
  }

  void addClass(DemoClassSession session) {
    _classes.add(session);
    notifyListeners();
  }

  void removeClass(String id) {
    _classes.removeWhere((session) => session.id == id);
    notifyListeners();
  }

  void toggleSavedMaterial(String id) {
    _savedMaterials.contains(id)
        ? _savedMaterials.remove(id)
        : _savedMaterials.add(id);
    notifyListeners();
  }

  void toggleSchoolMediaSaved(String id) {
    _savedSchoolMedia.contains(id)
        ? _savedSchoolMedia.remove(id)
        : _savedSchoolMedia.add(id);
    notifyListeners();
  }

  void toggleRsvp(String eventId) {
    _rsvps.contains(eventId) ? _rsvps.remove(eventId) : _rsvps.add(eventId);
    notifyListeners();
  }

  void toggleSaved(String eventId) {
    _savedEvents.contains(eventId)
        ? _savedEvents.remove(eventId)
        : _savedEvents.add(eventId);
    notifyListeners();
  }

  void toggleJoined(String clubId) {
    isJoined(clubId)
        ? _clubMembership.remove(clubId)
        : _clubMembership[clubId] = 'member';
    notifyListeners();
  }

  void requestClubMembership(String clubId, {required bool approvalRequired}) {
    _clubMembership[clubId] = approvalRequired ? 'pending' : 'member';
    notifyListeners();
  }

  void leaveClub(String clubId) {
    _clubMembership.remove(clubId);
    notifyListeners();
  }

  void toggleClubActivity(String id, {String? clubId}) {
    final key = clubId == null ? id : '$clubId|$id';
    _registeredClubActivities.contains(key)
        ? _registeredClubActivities.remove(key)
        : _registeredClubActivities.add(key);
    notifyListeners();
  }

  void recordClubAttendance(String clubId, String activityId) {
    if (_clubAttendance.add('$clubId|$activityId')) notifyListeners();
  }

  void toggleFreshersStep(String step) {
    _completedFreshersSteps.contains(step)
        ? _completedFreshersSteps.remove(step)
        : _completedFreshersSteps.add(step);
    notifyListeners();
  }

  void voteSrcPoll(String choice) {
    _srcPollChoice = choice;
    notifyListeners();
  }

  void addSrcFeedback(String message) {
    final value = message.trim();
    if (value.isEmpty) return;
    _srcFeedback.insert(0, value);
    notifyListeners();
  }

  void markRead(String title) {
    _readAnnouncements.add(title);
    notifyListeners();
  }

  void addLocalReply(String reply) {
    final value = reply.trim();
    if (value.isEmpty) return;
    _localReplies.add(value);
    notifyListeners();
  }
}

List<DemoTask> _initialTasks() {
  final today = DateTime.now();
  return [
    DemoTask(
      id: 'task-revision',
      title: 'Review database normalization',
      course: 'Database Systems',
      dueDate: DateTime(today.year, today.month, today.day + 1),
      priority: 'High',
      completed: false,
      description: 'Revise 1NF, 2NF and 3NF before the tutorial.',
    ),
    DemoTask(
      id: 'task-reading',
      title: 'Read the networking lecture notes',
      course: 'Computer Networks',
      dueDate: DateTime(today.year, today.month, today.day + 3),
      priority: 'Medium',
      completed: false,
    ),
    DemoTask(
      id: 'task-completed',
      title: 'Choose a project topic',
      course: 'Research Methods',
      dueDate: DateTime(today.year, today.month, today.day - 1),
      priority: 'Low',
      completed: true,
    ),
  ];
}

List<DemoClassSession> _initialClasses() => const [
      DemoClassSession(
          id: 'c1',
          day: 'Monday',
          course: 'Data Communications',
          time: '9:00 AM - 11:00 AM',
          venue: 'Block B, Room 204',
          lecturer: 'Dr. A. Mensah'),
      DemoClassSession(
          id: 'c2',
          day: 'Monday',
          course: 'Web Application Development',
          time: '1:00 PM - 3:00 PM',
          venue: 'ICT Lab 2'),
      DemoClassSession(
          id: 'c3',
          day: 'Tuesday',
          course: 'Database Systems',
          time: '10:00 AM - 12:00 PM',
          venue: 'Block C, Room 105'),
      DemoClassSession(
          id: 'c4',
          day: 'Wednesday',
          course: 'Research Methods',
          time: '1:00 PM - 3:00 PM',
          venue: 'Main Lecture Theatre'),
      DemoClassSession(
          id: 'c5',
          day: 'Thursday',
          course: 'Computer Networks',
          time: '10:00 AM - 12:00 PM',
          venue: 'Networking Lab'),
      DemoClassSession(
          id: 'c6',
          day: 'Friday',
          course: 'Human Computer Interaction',
          time: '8:00 AM - 10:00 AM',
          venue: 'Block A, Room 302'),
    ];

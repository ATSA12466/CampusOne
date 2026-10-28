import 'package:flutter/material.dart';

class DemoEvent {
  const DemoEvent({
    required this.id,
    required this.title,
    required this.category,
    required this.date,
    required this.time,
    required this.venue,
    required this.description,
    required this.icon,
    required this.colors,
    required this.attending,
  });

  final String id;
  final String title;
  final String category;
  final String date;
  final String time;
  final String venue;
  final String description;
  final IconData icon;
  final List<Color> colors;
  final int attending;
}

class DemoClub {
  const DemoClub({
    required this.id,
    required this.name,
    required this.category,
    required this.members,
    required this.description,
    required this.icon,
    required this.color,
  });

  final String id;
  final String name;
  final String category;
  final int members;
  final String description;
  final IconData icon;
  final Color color;
}

class DemoAnnouncement {
  const DemoAnnouncement({
    required this.title,
    required this.category,
    required this.date,
    required this.body,
    required this.icon,
  });

  final String title;
  final String category;
  final String date;
  final String body;
  final IconData icon;
}

class DemoMessage {
  const DemoMessage({
    required this.name,
    required this.preview,
    required this.time,
    required this.initials,
    required this.color,
    this.unread = false,
  });

  final String name;
  final String preview;
  final String time;
  final String initials;
  final Color color;
  final bool unread;
}

const demoEvents = <DemoEvent>[
  DemoEvent(
    id: 'techx',
    title: 'TECHX Innovation Night',
    category: 'Technology',
    date: 'THU, 22 OCT',
    time: '5:30 PM',
    venue: 'Florence Onny Auditorium',
    description:
        'An evening of bold student ideas, live project demos and conversations with the people building Ghana’s next wave of technology.',
    icon: Icons.lightbulb_rounded,
    colors: [Color(0xFF102966), Color(0xFF315FD0)],
    attending: 184,
  ),
  DemoEvent(
    id: 'akwaaba',
    title: 'SRC Akwaaba Week',
    category: 'Campus life',
    date: 'MON, 26 OCT',
    time: '9:00 AM',
    venue: 'Main campus forecourt',
    description:
        'Meet your new campus community through music, games, student showcases and a week full of warm GCTU welcomes.',
    icon: Icons.celebration_rounded,
    colors: [Color(0xFF9C4E00), Color(0xFFFFB51B)],
    attending: 326,
  ),
  DemoEvent(
    id: 'career',
    title: 'Career Compass: Find your next step',
    category: 'Careers',
    date: 'WED, 28 OCT',
    time: '10:00 AM',
    venue: 'Business School, Block C',
    description:
        'Get practical advice on internships, portfolios and interviews from GCTU alumni and industry guests.',
    icon: Icons.explore_rounded,
    colors: [Color(0xFF006C65), Color(0xFF44A995)],
    attending: 92,
  ),
  DemoEvent(
    id: 'film',
    title: 'Open-air film and friends',
    category: 'Social',
    date: 'FRI, 30 OCT',
    time: '6:00 PM',
    venue: 'Student centre lawn',
    description:
        'Bring a friend, grab a seat under the stars and enjoy a relaxed campus film night hosted by the Film Society.',
    icon: Icons.movie_filter_rounded,
    colors: [Color(0xFF592E8C), Color(0xFF9D67C7)],
    attending: 148,
  ),
];

const demoClubs = <DemoClub>[
  DemoClub(
    id: 'acs',
    name: 'Association of Computing Students',
    category: 'Technology',
    members: 428,
    description:
        'Build, learn and collaborate with students who love computing and new ideas.',
    icon: Icons.code_rounded,
    color: Color(0xFF315FD0),
  ),
  DemoClub(
    id: 'robotics',
    name: 'Robotics & Innovation Hub',
    category: 'Engineering',
    members: 196,
    description:
        'Turn curious questions into working prototypes with a hands-on team.',
    icon: Icons.smart_toy_rounded,
    color: Color(0xFF008577),
  ),
  DemoClub(
    id: 'film-society',
    name: 'GCTU Film Society',
    category: 'Arts & culture',
    members: 143,
    description:
        'Explore film, photography and storytelling around the campus community.',
    icon: Icons.movie_creation_rounded,
    color: Color(0xFF8552A1),
  ),
  DemoClub(
    id: 'entrepreneurs',
    name: 'Young Entrepreneurs Network',
    category: 'Business',
    members: 214,
    description:
        'Share practical ideas, learn from peers and grow your next venture.',
    icon: Icons.rocket_launch_rounded,
    color: Color(0xFFE09500),
  ),
];

const demoAnnouncements = <DemoAnnouncement>[
  DemoAnnouncement(
    title: 'Course registration reminder',
    category: 'Academic notice',
    date: 'Today · 8:30 AM',
    body:
        'Check your student portal and confirm your registered courses before the end of the week. Contact your department office if you need help.',
    icon: Icons.school_outlined,
  ),
  DemoAnnouncement(
    title: 'Welcome to a new week on campus',
    category: 'Student life',
    date: 'Yesterday · 2:15 PM',
    body:
        'The SRC team has a full programme of activities planned. Save the dates and bring a friend along to the events that interest you.',
    icon: Icons.campaign_outlined,
  ),
  DemoAnnouncement(
    title: 'Library study spaces are open late',
    category: 'Campus update',
    date: 'Mon · 11:00 AM',
    body:
        'Extra study spaces are available in the main library this week. Please keep shared areas tidy and remember your student ID.',
    icon: Icons.menu_book_outlined,
  ),
];

const demoMessages = <DemoMessage>[
  DemoMessage(
    name: 'Ama Mensah',
    preview: 'Are you coming to the innovation night?',
    time: '10:42 AM',
    initials: 'AM',
    color: Color(0xFF4167B2),
    unread: true,
  ),
  DemoMessage(
    name: 'ACS Community',
    preview: 'Kwame: I added the workshop notes here.',
    time: 'Yesterday',
    initials: 'AC',
    color: Color(0xFF008577),
    unread: true,
  ),
  DemoMessage(
    name: 'Kojo Asare',
    preview: 'Thanks for sharing the timetable!',
    time: 'Tue',
    initials: 'KA',
    color: Color(0xFFE09500),
  ),
  DemoMessage(
    name: 'Film Society',
    preview: 'The film night poll is now open.',
    time: 'Mon',
    initials: 'FS',
    color: Color(0xFF8552A1),
  ),
];

import 'package:cloud_firestore/cloud_firestore.dart';

class Contact {
  final String id;
  final String name;
  final String phone;
  final String? email;
  final List<String> tags; // e.g., ["Hot", "Follow-up"]
  final List<CallHistoryEntry> callHistory;
  final String status; // e.g., "Interested", "Not Interested", "Call Again"
  final DateTime createdAt;
  final DateTime updatedAt;

  Contact({
    required this.id,
    required this.name,
    required this.phone,
    this.email,
    required this.tags,
    required this.callHistory,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Contact.fromMap(String id, Map<String, dynamic> data) {
    return Contact(
      id: id,
      name: data['name'] ?? '',
      phone: data['phone'] ?? '',
      email: data['email'],
      tags: List<String>.from(data['tags'] ?? []),
      callHistory: (data['callHistory'] as List<dynamic>? ?? [])
          .map((e) => CallHistoryEntry.fromMap(e))
          .toList(),
      status: data['status'] ?? '',
      createdAt: (data['createdAt'] as Timestamp).toDate(),
      updatedAt: (data['updatedAt'] as Timestamp).toDate(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'name': name,
      'phone': phone,
      'email': email,
      'tags': tags,
      'callHistory': callHistory.map((e) => e.toMap()).toList(),
      'status': status,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
    };
  }
}

class CallHistoryEntry {
  final DateTime time;
  final int durationSeconds;
  final String outcome; // e.g., "Answered", "Missed"
  final String? note;

  CallHistoryEntry({
    required this.time,
    required this.durationSeconds,
    required this.outcome,
    this.note,
  });

  factory CallHistoryEntry.fromMap(Map<String, dynamic> data) {
    return CallHistoryEntry(
      time: (data['time'] as Timestamp).toDate(),
      durationSeconds: data['durationSeconds'] ?? 0,
      outcome: data['outcome'] ?? '',
      note: data['note'],
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'time': time,
      'durationSeconds': durationSeconds,
      'outcome': outcome,
      'note': note,
    };
  }
} 
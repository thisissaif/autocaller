import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/contact.dart';

class AutoDialerScreen extends StatefulWidget {
  const AutoDialerScreen({super.key});

  @override
  State<AutoDialerScreen> createState() => _AutoDialerScreenState();
}

class _AutoDialerScreenState extends State<AutoDialerScreen> {
  List<Contact> contacts = [];
  List<Contact> filteredContacts = [];
  int currentIndex = 0;
  bool isDialing = false;
  bool isPaused = false;
  int intervalSeconds = 10;
  Timer? _timer;
  static const List<String> _allTags = ['Hot', 'Cold', 'Follow-up'];
  List<String> _selectedTags = List.from(_allTags);
  String _searchQuery = '';
  static const List<String> _allStatuses = ['All', 'Interested', 'Not Interested', 'Call Again'];
  String _selectedStatus = 'All';
  Stopwatch _callStopwatch = Stopwatch();

  void _filterContacts() {
    setState(() {
      filteredContacts = contacts.where((c) {
        final matchesTag = c.tags.any((tag) => _selectedTags.contains(tag));
        final matchesStatus = _selectedStatus == 'All' || c.status == _selectedStatus;
        final matchesSearch = _searchQuery.isEmpty ||
          c.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          c.phone.contains(_searchQuery);
        return matchesTag && matchesStatus && matchesSearch;
      }).toList();
      currentIndex = 0;
    });
  }

  void _startDialing() {
    if (filteredContacts.isEmpty) return;
    setState(() {
      isDialing = true;
      isPaused = false;
      currentIndex = 0;
    });
    _dialCurrent();
  }

  void _pauseDialing() {
    setState(() {
      isPaused = true;
    });
    _timer?.cancel();
  }

  void _resumeDialing() {
    setState(() {
      isPaused = false;
    });
    _dialCurrent();
  }

  void _skipCurrent() {
    if (currentIndex < filteredContacts.length - 1) {
      setState(() {
        currentIndex++;
      });
      _dialCurrent();
    } else {
      _stopDialing();
    }
  }

  void _stopDialing() {
    setState(() {
      isDialing = false;
      isPaused = false;
      currentIndex = 0;
    });
    _timer?.cancel();
  }

  void _dialCurrent() async {
    if (!isDialing || isPaused) return;
    final number = filteredContacts[currentIndex].phone;
    final contact = filteredContacts[currentIndex];
    final uri = Uri(scheme: 'tel', path: number);
    _callStopwatch.reset();
    _callStopwatch.start();
    await launchUrl(uri);
    // Pause and show log dialog after dialing
    _pauseDialing();
    await Future.delayed(const Duration(seconds: 2)); // Give time for call intent
    _callStopwatch.stop();
    _showLogDialog(contact, _callStopwatch.elapsed.inSeconds);
  }

  void _showLogDialog(Contact contact, int initialDuration) async {
    String selectedOutcome = 'Answered';
    String selectedStatus = contact.status;
    String note = '';
    int durationSeconds = initialDuration;
    final outcomes = ['Answered', 'Missed', 'Busy'];
    final statuses = ['Interested', 'Not Interested', 'Call Again'];
    final durationController = TextEditingController(text: durationSeconds.toString());
    await showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return AlertDialog(
          title: const Text('Log Call Result'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DropdownButtonFormField<String>(
                value: selectedOutcome,
                items: outcomes.map((o) => DropdownMenuItem(value: o, child: Text(o))).toList(),
                onChanged: (v) => selectedOutcome = v ?? 'Answered',
                decoration: const InputDecoration(labelText: 'Outcome'),
              ),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                value: selectedStatus.isNotEmpty ? selectedStatus : statuses[0],
                items: statuses.map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
                onChanged: (v) => selectedStatus = v ?? statuses[0],
                decoration: const InputDecoration(labelText: 'Status'),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: durationController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Call Duration (seconds)'),
                onChanged: (v) => durationSeconds = int.tryParse(v) ?? initialDuration,
              ),
              const SizedBox(height: 8),
              TextField(
                decoration: const InputDecoration(labelText: 'Note (optional)'),
                onChanged: (v) => note = v,
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () async {
                // Update Firestore: add call history entry and update status
                final now = DateTime.now();
                final callEntry = {
                  'time': now,
                  'durationSeconds': durationSeconds,
                  'outcome': selectedOutcome,
                  'note': note,
                };
                final contactRef = FirebaseFirestore.instance.collection('contacts').doc(contact.id);
                await contactRef.update({
                  'callHistory': FieldValue.arrayUnion([callEntry]),
                  'status': selectedStatus,
                  'updatedAt': now,
                });
                Navigator.of(context).pop();
              },
              child: const Text('Save'),
            ),
          ],
        );
      },
    );
    // Resume auto-dialing
    if (isDialing && !isPaused) return;
    if (currentIndex < filteredContacts.length - 1) {
      setState(() {
        currentIndex++;
        isPaused = false;
      });
      _dialCurrent();
    } else {
      _stopDialing();
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Auto Dialer')),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance.collection('contacts').orderBy('createdAt', descending: false).snapshots(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
            return const Center(child: Text('No contacts to dial.'));
          }
          contacts = snapshot.data!.docs.map((doc) => Contact.fromMap(doc.id, doc.data() as Map<String, dynamic>)).toList();
          _filterContacts();
          return Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Search bar
                TextField(
                  decoration: const InputDecoration(
                    labelText: 'Search by name or phone',
                    prefixIcon: Icon(Icons.search),
                  ),
                  onChanged: isDialing ? null : (value) {
                    _searchQuery = value;
                    _filterContacts();
                  },
                ),
                const SizedBox(height: 12),
                // Status dropdown
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text('Status:'),
                    const SizedBox(width: 8),
                    DropdownButton<String>(
                      value: _selectedStatus,
                      items: _allStatuses.map((status) => DropdownMenuItem(
                        value: status,
                        child: Text(status),
                      )).toList(),
                      onChanged: isDialing ? null : (value) {
                        if (value != null) {
                          _selectedStatus = value;
                          _filterContacts();
                        }
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                // Tag filter
                Wrap(
                  spacing: 8,
                  children: _allTags.map((tag) => FilterChip(
                    label: Text(tag),
                    selected: _selectedTags.contains(tag),
                    onSelected: isDialing ? null : (selected) {
                      setState(() {
                        if (selected) {
                          _selectedTags.add(tag);
                        } else {
                          _selectedTags.remove(tag);
                        }
                        _filterContacts();
                      });
                    },
                  )).toList(),
                ),
                const SizedBox(height: 16),
                Text('Current Number:', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                Text(
                  filteredContacts.isNotEmpty ? filteredContacts[currentIndex].phone : '-',
                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    ElevatedButton(
                      onPressed: isDialing && !isPaused ? _pauseDialing : null,
                      child: const Text('Pause'),
                    ),
                    const SizedBox(width: 12),
                    ElevatedButton(
                      onPressed: isDialing && isPaused ? _resumeDialing : null,
                      child: const Text('Resume'),
                    ),
                    const SizedBox(width: 12),
                    ElevatedButton(
                      onPressed: isDialing ? _skipCurrent : null,
                      child: const Text('Skip'),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text('Interval (sec):'),
                    const SizedBox(width: 8),
                    DropdownButton<int>(
                      value: intervalSeconds,
                      items: [5, 10, 15, 20, 30]
                          .map((v) => DropdownMenuItem(value: v, child: Text('$v')))
                          .toList(),
                      onChanged: isDialing ? null : (v) {
                        if (v != null) setState(() => intervalSeconds = v);
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 32),
                ElevatedButton(
                  onPressed: isDialing || filteredContacts.isEmpty ? null : _startDialing,
                  child: const Text('Start Auto Dial'),
                ),
                if (isDialing)
                  TextButton(
                    onPressed: _stopDialing,
                    child: const Text('Stop'),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }
} 
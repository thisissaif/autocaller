import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/contact.dart';

class ContactDetailScreen extends StatelessWidget {
  final Contact contact;
  const ContactDetailScreen({super.key, required this.contact});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(contact.name)),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: ListView(
          children: [
            Text('Phone: ${contact.phone}', style: const TextStyle(fontSize: 16)),
            if (contact.email != null && contact.email!.isNotEmpty)
              Text('Email: ${contact.email}', style: const TextStyle(fontSize: 16)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: contact.tags.map((tag) => Chip(label: Text(tag))).toList(),
            ),
            const SizedBox(height: 16),
            Text('Status: ${contact.status}', style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 24),
            Text('Call History', style: Theme.of(context).textTheme.titleMedium),
            const Divider(),
            if (contact.callHistory.isEmpty)
              const Text('No call history.'),
            ...contact.callHistory.reversed.map((entry) => ListTile(
              leading: Icon(
                entry.outcome == 'Answered'
                  ? Icons.call
                  : entry.outcome == 'Missed'
                    ? Icons.call_missed
                    : Icons.call_end,
                color: entry.outcome == 'Answered' ? Colors.green : Colors.red,
              ),
              title: Text('${entry.outcome} (${entry.durationSeconds}s)'),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(DateFormat('yyyy-MM-dd HH:mm').format(entry.time)),
                  if (entry.note != null && entry.note!.isNotEmpty)
                    Text('Note: ${entry.note!}'),
                ],
              ),
            )),
          ],
        ),
      ),
    );
  }
} 
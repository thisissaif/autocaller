import 'package:flutter/material.dart';
import 'package:flutterfire_ui/auth.dart';
import 'firebase_options.dart';

class AuthScreen extends StatelessWidget {
  const AuthScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SignInScreen(
      providerConfigs: [
        PhoneProviderConfiguration(),
        EmailProviderConfiguration(),
      ],
      headerBuilder: (context, constraints, _) => const Padding(
        padding: EdgeInsets.all(24.0),
        child: Text(
          'ProDialer Login',
          style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
        ),
      ),
      footerBuilder: (context, action) => const Padding(
        padding: EdgeInsets.only(top: 16.0),
        child: Text('By VoizeWave Pvt. Ltd.'),
      ),
    );
  }
} 
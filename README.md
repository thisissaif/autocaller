# ProDialer – Smart Auto Caller App

A comprehensive auto-calling solution for telecallers, sales teams, and small businesses. Built with Flutter for mobile and React for web admin panel.

## 🚀 Features

### Mobile App (Flutter)
- **Auto Dialing System** - Upload contacts via CSV/manual entry, auto-dial with pause/resume/skip
- **Lead & Contact Management** - Add/edit contacts, tagging system, call history
- **Call Script Panel** - Floating panel during calls with admin-editable scripts
- **Call Notes & Feedback** - Post-call notes, outcome tagging, status updates
- **Scheduler & Reminders** - Follow-up scheduling, missed call retry logic
- **Reporting & Analytics** - Statistics, PDF/CSV export, charts/tables
- **User Roles** - Admin and Telecaller permissions
- **Telecaller Registration** - Signup with resume/voice upload
- **Public Lead Capture** - Google Forms integration
- **Notifications** - FCM for alerts and reminders
- **Settings** - Language, theme, call interval configuration

### Admin Panel (React)
- **Authentication** - Secure admin login/logout
- **Dashboard** - Real-time analytics and charts
- **Lead Management** - CRUD operations, search, filter
- **Script Editor** - Call script management with versioning
- **Reports** - Analytics with PDF/CSV export
- **Settings** - Admin preferences and configuration

## 🛠 Tech Stack

### Mobile App
- **Frontend**: Flutter
- **Backend**: Firebase (Authentication, Firestore, Storage, Cloud Functions, Cloud Messaging)
- **State Management**: Provider
- **UI**: Material Design with dark/light mode

### Admin Panel
- **Frontend**: React + TypeScript
- **UI Framework**: Material-UI
- **Backend**: Firebase (Auth, Firestore)
- **Charts**: Recharts
- **Export**: jsPDF, PapaParse
- **Deployment**: Firebase Hosting

## 📱 Screenshots

### Mobile App
- Contact List with search and filtering
- Auto Dialer with call controls
- Call Script Panel during calls
- Contact Details with call history
- Settings with theme and language options

### Admin Panel
- Dashboard with analytics
- Lead management interface
- Script editor with templates
- Reports with export options
- Settings configuration

## 🚀 Quick Start

### Prerequisites
- Flutter SDK (3.0+)
- Node.js (18+)
- Firebase CLI
- Android Studio / Xcode (for mobile development)

### Mobile App Setup
```bash
cd prodialer_app
flutter pub get
flutter run
```

### Admin Panel Setup
```bash
cd prodialer_app/admin-panel
npm install
npm start
```

### Firebase Setup
1. Create a Firebase project
2. Enable Authentication, Firestore, Storage, Cloud Functions
3. Add your Firebase config to the apps
4. Set up Firebase Hosting for the admin panel

## 📦 Deployment

### Admin Panel (Automatic)
The admin panel automatically deploys to Firebase Hosting via GitHub Actions when you push to the main branch.

### Mobile App
- **Android**: Build APK/AAB and upload to Google Play Store
- **iOS**: Build and upload to App Store Connect

## 🔧 Configuration

### Firebase Configuration
1. Replace `lib/firebase_options.dart` with your Firebase config
2. Update `admin-panel/src/firebase.ts` with your Firebase config
3. Set up Firebase Authentication providers
4. Configure Firestore security rules

### Environment Variables
Create `.env` files for sensitive configuration:
```
FIREBASE_API_KEY=your_api_key
FIREBASE_PROJECT_ID=your_project_id
```

## 📊 Database Schema

### Collections
- `users` - User profiles and roles
- `contacts` - Contact information and call history
- `scripts` - Call scripts with versioning
- `settings` - User preferences
- `reports` - Call analytics and reports

## 🔐 Security

- Firebase Authentication for user management
- Firestore security rules for data access
- Role-based access control (Admin/Telecaller)
- Secure API endpoints with authentication

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in this repository
- Contact: support@voizewave.com

## 🏢 About

**ProDialer** is developed by **VoizeWave Pvt. Ltd.**

---

Made with ❤️ for telecallers and sales teams 
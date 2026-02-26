# WhatsApp Lead Manager - SaaS Mobile App

A professional mobile application for businesses to import WhatsApp chats and efficiently manage leads with bulk save capabilities.

## 🎯 Overview

**Phase 1 MVP** - WhatsApp Chat Import & Analysis System

This is a SaaS application that allows businesses to:
- Import exported WhatsApp chat files (.txt format)
- Automatically detect unsaved phone numbers
- Manage leads with advanced filtering and search
- Bulk save contacts to device with customizable naming
- Export leads as VCF files for sharing
- Track usage and subscription limits

## 🏗️ Architecture

### Backend (FastAPI + MongoDB)
- **WhatsApp Parser Engine**: Extracts phone numbers from chat exports with international format support (Nigerian +234)
- **RESTful API**: 8 endpoints for complete lead management
- **MongoDB Database**: Stores users, leads, imports, subscriptions
- **Subscription System**: Ready for Free, Basic ($9), Pro ($19), Business ($39) tiers

### Frontend (React Native + Expo)
- **Cross-platform**: iOS and Android support
- **Tab Navigation**: 4 main screens (Home, Import, Leads, Profile)
- **Native Features**: Device contacts integration, file picker, VCF sharing
- **Modern UI**: Material Design 3 with professional styling

## 📱 Features

### ✅ Implemented (MVP)

1. **Multi-File Import**
   - Select multiple WhatsApp chat exports at once
   - Batch processing with progress tracking
   - Automatic duplicate detection

2. **Lead Management**
   - View all leads with FlashList (high performance)
   - Filter by status (all/unsaved/saved)
   - Search by phone number or name
   - Multi-select with "Select All"

3. **Smart Contact Saving**
   - Customizable naming format (prefix, suffix, auto-numbering)
   - Preview before saving
   - Bulk save to device contacts
   - Real-time progress tracking

4. **VCF Export**
   - Export selected leads as .vcf file
   - Share via any app (Email, WhatsApp, Drive)
   - Compatible with all contact apps

5. **Dashboard Analytics**
   - Total leads count
   - Unsaved vs Saved breakdown
   - Import statistics
   - Monthly usage tracking

6. **Subscription Management**
   - Tier display (Free, Basic, Pro, Business)
   - Usage limits tracking
   - Upgrade prompts

### 🔮 Future Enhancements (Phase 2 & 3)

- **Authentication**: JWT-based email/password + Google OAuth
- **Subscription Enforcement**: Backend-controlled usage limits
- **Payment Integration**: Stripe (primary), Google Play Billing, Paystack
- **Advanced Features**: Tagging, cloud backup, team access, analytics

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and Yarn
- Python 3.11+
- MongoDB
- Expo CLI

### Installation

1. **Backend Setup**
```bash
cd /app/backend
pip install -r requirements.txt
python server.py
```

2. **Frontend Setup**
```bash
cd /app/frontend
yarn install
yarn start
```

3. **Access the App**
- Web: http://localhost:3000
- Mobile: Scan QR code with Expo Go app

## 📡 API Endpoints

### Base URL: `/api`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API info |
| GET | `/health` | Health check |
| POST | `/import/parse` | Parse WhatsApp chat file |
| GET | `/leads` | Get leads (with filters) |
| POST | `/leads/bulk-save` | Mark leads as saved |
| POST | `/leads/export-vcf` | Export leads as VCF |
| GET | `/leads/stats` | Get statistics |
| DELETE | `/leads/{id}` | Delete a lead |

## 🗄️ Database Schema

### Collections

**leads**
- user_id, phone_number, display_name
- source_chat, import_id
- first_seen, last_seen
- is_saved, tags, notes

**imports**
- user_id, filename
- total_numbers, unsaved_count
- processed_at, status

**users** (Ready for Phase 2)
- email, password_hash, name
- subscription_tier, naming_config

**subscriptions** (Ready for Phase 2)
- user_id, tier, status
- limits, current_usage
- start_date, expires_at

## 💰 Subscription Tiers

| Tier | Price | Imports/Month | Contacts/Month | Features |
|------|-------|---------------|----------------|----------|
| **Free Trial** | $0 (7 days) | 2 | 50 | Basic naming |
| **Basic** | $9/month | 10 | 1,000 | + Duplicate detection |
| **Pro** | $19/month | 30 | 5,000 | + Filtering, tagging, cloud backup |
| **Business** | $39/month | Unlimited | Unlimited | + Team access, analytics |

## 📋 How to Export WhatsApp Chats

1. Open WhatsApp and go to the chat
2. Tap the menu (⋮) > More > Export chat
3. Choose "Without Media"
4. Save the .txt file
5. Upload to the app

## 🎨 Technology Stack

### Backend
- **FastAPI**: Modern Python web framework
- **Motor**: Async MongoDB driver
- **Pydantic**: Data validation
- **phonenumbers**: International phone number parsing
- **python-jose**: JWT tokens (for Phase 2)
- **bcrypt**: Password hashing (for Phase 2)

### Frontend
- **React Native**: Cross-platform mobile framework
- **Expo**: Development platform
- **Expo Router**: File-based navigation
- **FlashList**: High-performance lists
- **Axios**: HTTP client
- **expo-contacts**: Device contacts access
- **expo-document-picker**: File selection
- **expo-sharing**: File sharing

## 🔐 Permissions

### iOS
- `NSContactsUsageDescription`: "Save WhatsApp leads to contacts"
- `NSPhotoLibraryUsageDescription`: "Access files for import"

### Android
- `READ_CONTACTS`
- `WRITE_CONTACTS`
- `READ_EXTERNAL_STORAGE`
- `WRITE_EXTERNAL_STORAGE`

## 🧪 Testing

### Backend Testing
All API endpoints have been thoroughly tested:
```bash
# Health check
curl http://localhost:8001/api/health

# Test import
python3 test_import.py
```

### Frontend Testing
**Note**: Frontend UI testing requires user permission before running automated tests.

## 📦 Sample Data

A sample WhatsApp chat file is included at `/app/sample_whatsapp_chat.txt` with 7 Nigerian phone numbers for testing.

## 🛣️ Roadmap

### ✅ Phase 1: Core Engine (Current)
- WhatsApp chat parsing
- Lead detection and management
- Bulk save with custom naming
- VCF export
- Basic UI and navigation

### 🔄 Phase 2: Authentication (Next)
- User registration and login
- JWT token management
- Google OAuth integration
- Profile management

### 🔄 Phase 3: Subscription & Payments
- Stripe integration
- Subscription tier enforcement
- Usage tracking and limits
- Payment webhooks

### 🔄 Phase 4: Advanced Features
- Tagging system
- Cloud backup and sync
- Team collaboration
- Advanced analytics
- Multi-device support

## 🏪 App Store Readiness

### iOS App Store
- ✅ Permissions properly declared
- ✅ Usage descriptions under 10 words
- ⏳ Need real API keys before submission

### Google Play Store
- ✅ Required permissions declared
- ✅ Adaptive icon configured
- ⏳ Need signed APK before submission

## 🔒 Security & Compliance

- ✅ No reverse engineering of WhatsApp
- ✅ No policy violations
- ✅ Uses only approved Android/iOS APIs
- ✅ Transparent permission explanations
- ✅ GDPR-compliant data handling (user-controlled)
- ✅ No root access required

## 🎯 Business Model

**Target Market**: Small to medium businesses in Nigeria and Africa receiving high volumes of WhatsApp inquiries.

**Value Proposition**: 
- Save hours of manual contact entry
- Never lose a lead
- Organized lead management
- Professional contact naming
- Scalable for growing businesses

## 📊 Current Status

### ✅ Completed
- WhatsApp parser engine (supports Nigerian +234 format)
- All backend APIs (8 endpoints)
- Database models and schema
- Complete mobile UI (4 screens)
- Multi-file import with tutorial
- Lead management with filters
- Bulk contact saving
- VCF export
- Subscription tier structure

### 🔄 In Progress
- Backend API testing ✅ COMPLETED
- Frontend UI testing (awaiting user permission)

### ⏳ Pending (Future Phases)
- User authentication
- Subscription enforcement
- Payment integration
- Advanced features (tagging, analytics)

## 📝 Notes

### WhatsApp Chat Format Support
The parser supports multiple WhatsApp export formats:
- `[DD/MM/YY, HH:MM:SS] Name: Message`
- `DD/MM/YY, HH:MM - Name: Message`
- `DD/MM/YYYY, HH:MM - Name: Message`

### Phone Number Formats
Supports international formats with focus on Nigerian numbers:
- `+2348123456789` (preferred)
- `2348123456789`
- `08123456789` (local format, auto-converted)

## 🤝 Contributing

This is an MVP SaaS product. Future enhancements will be prioritized based on user feedback and business needs.

## 📄 License

Proprietary - All rights reserved.

---

**Version**: 1.0.0 (MVP)  
**Last Updated**: February 2026  
**Status**: Backend Complete ✅ | Frontend UI Complete ✅ | Testing In Progress 🔄

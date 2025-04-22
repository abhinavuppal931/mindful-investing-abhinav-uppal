# Firebase Functions Setup for Mindful Investing Companion

This document provides instructions for setting up Firebase Functions for the Mindful Investing Companion application.

## Prerequisites

- Node.js (v14 or higher)
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase account and project

## Setup Instructions

1. **Initialize Firebase in a separate directory outside this project:**

```bash
mkdir firebase-functions
cd firebase-functions
firebase login
firebase init functions
```

Choose TypeScript when prompted and follow the setup instructions.

2. **Install required dependencies in the functions directory:**

```bash
cd functions
npm install axios cors express stripe @google/generative-ai
```

3. **Create environment variables:**

Create a `.env` file in the `functions` directory with the following variables:

```
FMP_API_KEY=your-financial-modeling-prep-api-key
FINANCIAL_DATASETS_API_KEY=your-financial-datasets-api-key
NEWS_API_KEY=your-news-api-key
GEMINI_API_KEY=your-gemini-api-key
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
```

4. **Create Functions:**

Replace the content of `functions/index.ts` in your functions directory with the functions code from the project documentation.

5. **Test Locally:**

```bash
firebase emulators:start
```

6. **Deploy to Firebase:**

```bash
firebase deploy --only functions
```

## Frontend Integration

1. Copy the Firebase configuration from your Firebase project settings
2. Create a `.env` file in your React project root with the following variables:

```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

3. Use the services in `src/services/api.ts` to call your Firebase functions from your React components.

## Troubleshooting

- If you encounter CORS issues, make sure your functions have the proper CORS headers.
- If environment variables aren't working, verify they're set correctly in the Firebase Functions environment.
- For local development, uncomment the emulator connection lines in `src/lib/firebase.ts`.

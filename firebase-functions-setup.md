
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
npm install axios cors express @google/generative-ai
```

3. **Create environment variables:**

Create a `.env` file in the `functions` directory with the following variables:

```
FMP_API_KEY=your-financial-modeling-prep-api-key
FINNHUB_API_KEY=your-finnhub-api-key
GEMINI_API_KEY=your-gemini-api-key
```

4. **Create Functions:**

Replace the content of `functions/index.ts` in your functions directory with the functions code from this project.

5. **Test Locally:**

```bash
firebase emulators:start
```

6. **Deploy to Firebase:**

```bash
firebase deploy --only functions
```

## API Endpoints

Once deployed, your functions will be available at:

### Financial Modeling Prep (FMP) Endpoints:
- `GET /api/fmp/quote/:symbol` - Get stock quote/price data
- `GET /api/fmp/financials/:symbol` - Get financial statements (income, balance, cash flow)
- `GET /api/fmp/metrics/:symbol` - Get key financial metrics

### Finnhub Endpoints:
- `GET /api/finnhub/news/:symbol` - Get company-specific news
- `GET /api/finnhub/market-news` - Get general market news
- `GET /api/finnhub/earnings` - Get earnings calendar data

### Gemini AI Endpoints:
- `POST /api/gemini/company-analysis` - Analyze company moat, risks, headwinds/tailwinds
- `POST /api/gemini/news-scoring` - Score news articles for relevance and sentiment
- `POST /api/gemini/bias-detection` - Detect trading biases and calculate decision scores

### Health Check:
- `GET /api/health` - Check if functions are running

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

## Required API Keys

You'll need to obtain the following API keys:

1. **Financial Modeling Prep API Key**
   - Sign up at: https://financialmodelingprep.com/
   - Used for: Stock prices, financial statements, key metrics

2. **Finnhub API Key**
   - Sign up at: https://finnhub.io/
   - Used for: Company news, market news, earnings calendar

3. **Google Gemini API Key**
   - Get from: https://makersuite.google.com/app/apikey
   - Used for: AI analysis, news scoring, bias detection

## Troubleshooting

- If you encounter CORS issues, make sure your functions have the proper CORS headers.
- If environment variables aren't working, verify they're set correctly in the Firebase Functions environment.
- For local development, uncomment the emulator connection lines in `src/lib/firebase.ts`.

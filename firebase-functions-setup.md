

# Firebase Functions Setup for Mindful Investing Companion

This document provides instructions for setting up Firebase Functions for the Mindful Investing Companion application.

## Prerequisites

- Node.js (v14 or higher)
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase account and project (mindfulinvestingcompanion)

## Setup Instructions

1. **Initialize Firebase in a separate directory outside this project:**

```bash
mkdir firebase-functions
cd firebase-functions
firebase login
firebase init functions
```

When prompted:
- Select "Use an existing project" and choose "mindfulinvestingcompanion"
- Choose TypeScript when prompted
- Follow the setup instructions

2. **Install required dependencies in the functions directory:**

```bash
cd functions
npm install axios cors express @google/generative-ai
```

3. **Create environment variables:**

Set environment variables using Firebase CLI:

```bash
# Set Financial Modeling Prep API Key
firebase functions:config:set fmp.api_key="your-financial-modeling-prep-api-key"

# Set Finnhub API Key  
firebase functions:config:set finnhub.api_key="your-finnhub-api-key"

# Set Gemini API Key
firebase functions:config:set gemini.api_key="your-gemini-api-key"
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

The React project is already configured to work with your Firebase project (mindfulinvestingcompanion).

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

## API Key Setup Commands

Once you have your API keys, run these commands in your Firebase functions directory:

```bash
# Replace YOUR_ACTUAL_KEY with your real API keys
firebase functions:config:set fmp.api_key="YOUR_FMP_API_KEY"
firebase functions:config:set finnhub.api_key="YOUR_FINNHUB_API_KEY" 
firebase functions:config:set gemini.api_key="YOUR_GEMINI_API_KEY"
```

## Troubleshooting

- If you encounter CORS issues, make sure your functions have the proper CORS headers.
- If environment variables aren't working, verify they're set correctly using `firebase functions:config:get`.
- For local development, uncomment the emulator connection lines in `src/lib/firebase.ts`.


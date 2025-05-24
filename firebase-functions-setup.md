
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

3. **Set environment variables with your API keys (EXECUTE THESE COMMANDS NOW):**

```bash
# Set Financial Modeling Prep API Key
firebase functions:config:set fmp.api_key="yBGrmBVvX7YMdlvYyV9lCsoW37LVphzN"

# Set Finnhub API Key  
firebase functions:config:set finnhub.api_key="d05f6dpr01qoigru810gd05f6dpr01qoigru8110"

# Set Gemini API Key
firebase functions:config:set gemini.api_key="AIzaSyDjYcoJDcohVvbbpiIcgZ1L6144pEvHGxo"

# Verify the configuration
firebase functions:config:get
```

4. **Copy Functions Code:**

Replace the content of `functions/index.ts` in your functions directory with the functions code from this project.

5. **Deploy to Firebase (EXECUTE THIS COMMAND):**

```bash
firebase deploy --only functions
```

6. **Test the deployment:**

After deployment, test your endpoints:

```bash
# Test health check
curl https://us-central1-mindfulinvestingcompanion.cloudfunctions.net/api/health

# Test stock quote
curl https://us-central1-mindfulinvestingcompanion.cloudfunctions.net/api/fmp/quote/AAPL

# Test company news
curl "https://us-central1-mindfulinvestingcompanion.cloudfunctions.net/api/finnhub/news/AAPL?from=2024-01-01&to=2024-12-31"
```

## API Endpoints

Once deployed, your functions will be available at:
`https://us-central1-mindfulinvestingcompanion.cloudfunctions.net/api`

### Financial Modeling Prep (FMP) Endpoints:
- `GET /api/fmp/quote/:symbol` - Get stock quote/price data
- `GET /api/fmp/financials/:symbol` - Get financial statements (income, balance, cash flow)
- `GET /api/fmp/metrics/:symbol` - Get key financial metrics
- `GET /api/fmp/profile/:symbol` - Get company profile

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

The frontend is already configured to use the deployed functions URL:
```typescript
const FUNCTIONS_BASE_URL = 'https://us-central1-mindfulinvestingcompanion.cloudfunctions.net';
```

## Troubleshooting

- If you encounter CORS issues, make sure your functions have the proper CORS headers.
- If environment variables aren't working, verify they're set correctly using `firebase functions:config:get`.
- For local development, uncomment the emulator connection lines in `src/lib/firebase.ts`.

## IMMEDIATE ACTION REQUIRED:

1. Run the firebase functions:config:set commands above
2. Run `firebase deploy --only functions`
3. Test the endpoints to ensure they're working
4. The frontend should automatically start pulling real data
